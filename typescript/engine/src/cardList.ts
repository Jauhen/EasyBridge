//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CCardList (CardList.H / CardList.cpp)
//
// base class -- a collection of cards
//

import { Card } from './card.js';
import { ACE, isDeckVal, makeDeckValue, MAXHOLDING, Suit } from './constants.js';

export class CardList {
  protected cards: Card[] = [];
  protected sorted = false;
  protected autoSort = true;
  protected reverseSort = false;
  protected strHoldings = '---';

  //
  // Construction/Destruction
  //
  constructor(cards: readonly Card[] | CardList = []) {
    // Note: fields are initialized directly rather than calling virtual clear()
    // in the base constructor (matching C++ non-polymorphic base construction).
    this.autoSort = true;
    this.reverseSort = false;
    if (cards instanceof CardList) {
      // copy constructor: merge source list
      this.merge(cards);
    } else {
      for (const card of cards) {
        this.add(card);
      }
    }
  }

  //
  // Simple routines
  //

  get length(): number {
    return this.cards.length;
  }

  get numCards(): number {
    return this.cards.length;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  get isSorted(): boolean {
    return this.sorted;
  }

  enableAutoSort(mode: boolean): void {
    this.autoSort = mode;
  }

  get holdingsString(): string {
    return this.strHoldings;
  }

  get cardsInAscendingDeckOrder(): readonly Card[] {
    return [...this.cards];
  }

  at(index: number): Card | undefined {
    return this.cards[index];
  }

  getAt(index: number): Card | undefined {
    return this.cards[index];
  }

  get topCard(): Card | null {
    if (this.cards.length === 0) return null;
    return this.cards[0] ?? null;
  }

  get bottomCard(): Card | null {
    if (this.cards.length === 0) return null;
    return this.cards[this.cards.length - 1] ?? null;
  }

  get secondHighestCard(): Card | null {
    if (this.cards.length <= 1) return null;
    return this.cards[1] ?? null;
  }

  get secondLowestCard(): Card | null {
    if (this.cards.length <= 1) return null;
    return this.cards[this.cards.length - 2] ?? null;
  }

  get topCardVal(): number {
    if (this.cards.length === 0) {
      throw new RangeError('CardList is empty');
    }
    return this.cards[0].faceValue;
  }

  get bottomCardVal(): number {
    if (this.cards.length === 0) {
      throw new RangeError('CardList is empty');
    }
    return this.cards[this.cards.length - 1].faceValue;
  }

  //
  // Basic routines
  //

  init(): void {
    // base no-op (CCardList::Init)
  }

  //
  // SetCard()
  //
  setCard(index: number, card: Card): void {
    this.cards[index] = card;
  }

  //
  // Clear()
  //
  // clear the holding of all cards
  //
  clear(): void {
    this.cards = [];
    this.sorted = false;
    this.strHoldings = '---';
  }

  add(card: Card, sort = false): void {
    // check for duplicates
    if (this.has(card)) {
      throw new Error(`Duplicate card ${card.name}`);
    }
    if (this.cards.length >= MAXHOLDING) {
      return;
    }

    if (sort || this.autoSort) {
      // insert the card in its proper place
      const nValue = card.deckValue;
      let i = 0;
      for (i = 0; i < this.cards.length; i++) {
        if (!this.reverseSort) {
          if (nValue > this.cards[i].deckValue) break;
        } else {
          if (this.cards[i].deckValue > nValue) break;
        }
      }
      this.cards.splice(i, 0, card);
      this.sorted = true;
      this.formatHoldingsString();
    } else {
      this.cards.push(card);
      this.sorted = false;
    }
  }

  //
  // Merge()
  //
  merge(srcList: CardList): void {
    for (let i = 0; i < srcList.length; i++) {
      const card = srcList.at(i);
      if (card) this.add(card);
    }
    this.sort();
  }

  //
  // FormatHoldingsString()
  //
  formatHoldingsString(): void {
    // format the holdings string
    // first verify that the hand is sorted
    if (!this.sorted) {
      this.sort();
    }
    if (this.cards.length > 0) {
      this.strHoldings = this.cards.map(card => card.name).join(' ');
    } else {
      this.strHoldings = '---';
    }
  }

  //
  // GetHoldingsCommaDelimited()
  //
  // - format holdings as in "HA, HK, and H8"
  //
  getHoldingsCommaDelimited(): string {
    if (this.cards.length === 0) return '';
    if (this.cards.length === 1) return this.cards[0].name;
    if (this.cards.length === 2) {
      return `${this.cards[0].name} and ${this.cards[1].name}`;
    }
    const leading = this.cards.slice(0, -1).map(card => card.name).join(', ');
    return `${leading}, and ${this.cards[this.cards.length - 1].name}`;
  }

  //
  // TurnCardsFaceUp()
  //
  protected turnCardsFaceUp(faceUp: boolean): void {
    for (const card of this.cards) {
      card.setFaceUp(faceUp);
    }
  }

  //
  // RemoveByIndex()
  //
  // this is the main removal routine, called by all others
  // derived classes should only redefine this version of the operation
  //
  removeByIndex(index: number): Card | null {
    if (index < 0 || index >= this.cards.length) {
      return null;
    }
    const [card] = this.cards.splice(index, 1);
    if (this.autoSort) {
      this.formatHoldingsString();
    }
    return card ?? null;
  }

  removeByValue(deckValue: number): Card | null {
    if (!isDeckVal(deckValue)) {
      throw new RangeError(`Invalid deck value ${deckValue}`);
    }
    if (this.cards.length <= 0) return null;
    const index = this.getCardIndex(deckValue);
    return this.removeByIndex(index);
  }

  removeByDeckValue(deckValue: number): Card | null {
    return this.removeByValue(deckValue);
  }

  remove(card: Card): Card | null {
    if (this.cards.length <= 0) return null;
    const index = this.getCardIndex(card);
    if (index < 0) return null;
    return this.removeByIndex(index);
  }

  sort(): void {
    if (this.sorted) return;
    this.cards.sort((a, b) => {
      if (this.reverseSort) return a.deckValue - b.deckValue;
      return b.deckValue - a.deckValue;
    });
    this.sorted = true;
    this.formatHoldingsString();
  }

  reverseSortOrder(reverse = true): void {
    if (this.reverseSort !== reverse) {
      this.reverseSort = reverse;
      this.sorted = false;
    }
  }

  rangeCovers(faceValueOrCard: number | Card): boolean {
    if (this.cards.length === 0) return false;
    const faceValue = typeof faceValueOrCard === 'number'
      ? faceValueOrCard
      : faceValueOrCard.faceValue;
    return faceValue >= this.cards[this.cards.length - 1].faceValue &&
      faceValue <= this.cards[0].faceValue;
  }

  //
  // Misc routines
  //

  //
  // comparison operator
  //
  equals(other: CardList): boolean {
    if (this.cards.length !== other.length) return false;
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].deckValue !== other.at(i)?.deckValue) {
        return false;
      }
    }
    // everything checks out OK
    return true;
  }

  findCard(suit: Suit, faceValue: number): Card | undefined {
    return this.findCardByDeckValue(makeDeckValue(suit, faceValue));
  }

  findBySuitAndFace(suit: number, faceValue: number): Card | undefined {
    return this.findCard(suit as Suit, faceValue);
  }

  findCardByDeckValue(deckValue: number): Card | undefined {
    // searches for a card of a specific suit and face value
    if (this.cards.length === 0) return undefined;
    if (this.sorted && !this.reverseSort) {
      for (let i = 0; i < this.cards.length; i++) {
        // change this later to a binary search
        if (this.cards[i].deckValue === deckValue) return this.cards[i];
        if (this.cards[i].deckValue < deckValue) return undefined; // passed where it should have been
      }
    } else {
      // do a simple linear search
      for (let i = 0; i < this.cards.length; i++) {
        if (this.cards[i].deckValue === deckValue) return this.cards[i];
      }
    }
    return undefined;
  }

  findByDeckValue(deckValue: number): Card | undefined {
    return this.findCardByDeckValue(deckValue);
  }

  findCardByFaceValue(faceValue: number): Card | undefined {
    // searches for a card of the face value, any suit
    if (this.cards.length === 0) return undefined;
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].faceValue === faceValue) return this.cards[i];
    }
    return undefined;
  }

  hasCard(cardOrDeckValue: Card | number): boolean {
    const deckValue = typeof cardOrDeckValue === 'number'
      ? cardOrDeckValue
      : cardOrDeckValue.deckValue;
    return this.findCardByDeckValue(deckValue) !== undefined;
  }

  hasDeckValue(deckValue: number): boolean {
    return this.hasCard(deckValue);
  }

  has(card: Card): boolean {
    return this.hasCard(card);
  }

  hasCardOfFaceValue(faceValue: number): boolean {
    // searches for a card of the face value, any suit
    return this.findCardByFaceValue(faceValue) !== undefined;
  }

  //
  // ContainsCards()
  //
  // tests whether the cards in the specified list are contained
  // within this list
  //
  containsCards(cards: CardList): boolean {
    for (let i = 0; i < cards.length; i++) {
      const card = cards.at(i);
      // abort if any are missing
      if (!card || !this.findCardByDeckValue(card.deckValue)) {
        return false;
      }
    }
    // all there
    return true;
  }

  //
  // ContainsAtLeastOneOf()
  //
  // tests whether at least one card from the specified list
  // is contained within this list
  //
  containsAtLeastOneOf(cards: CardList): boolean {
    for (let i = 0; i < cards.length; i++) {
      const card = cards.at(i);
      // return if a card is found
      if (card && this.findCardByDeckValue(card.deckValue)) {
        return true;
      }
    }
    // nuttin' found
    return false;
  }

  //
  // return card index if it's in the holding, else return -1
  //
  getCardIndex(cardOrDeckValue: Card | number): number {
    if (this.cards.length === 0) return -1;
    const deckValue = typeof cardOrDeckValue === 'number'
      ? cardOrDeckValue
      : cardOrDeckValue.deckValue;
    // do a linear search
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].deckValue === deckValue) return i;
    }
    return -1;
  }

  //
  // GetNumCardsAbove()
  //
  // return the number of cards held above a certain face value
  //
  getNumCardsAbove(faceValueOrCard: number | Card): number {
    const faceValue = typeof faceValueOrCard === 'number'
      ? faceValueOrCard
      : faceValueOrCard.faceValue;
    if (faceValue < 2 || faceValue > ACE) {
      throw new RangeError(`Invalid face value ${faceValue}`);
    }
    if (this.cards.length === 0 || faceValue >= this.cards[0].faceValue) {
      return 0;
    }
    let count = 0;
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].faceValue <= faceValue) break;
      count++;
    }
    return count;
  }

  //
  // GetNumCardsBelow()
  //
  // return the number of cards held below a certain face value
  //
  getNumCardsBelow(faceValueOrCard: number | Card): number {
    const faceValue = typeof faceValueOrCard === 'number'
      ? faceValueOrCard
      : faceValueOrCard.faceValue;
    if (faceValue < 2 || faceValue > ACE) {
      throw new RangeError(`Invalid face value ${faceValue}`);
    }
    if (this.cards.length === 0 || faceValue <= this.cards[this.cards.length - 1].faceValue) {
      return 0;
    }
    let count = 0;
    for (let i = this.cards.length - 1; i >= 0; i--) {
      if (this.cards[i].faceValue >= faceValue) break;
      count++;
    }
    return count;
  }

  //
  // GetLowestCardAbove()
  //
  getLowestCardAbove(faceValueOrCard: number | Card): Card | null {
    const numCardsAbove = this.getNumCardsAbove(faceValueOrCard);
    if (numCardsAbove === 0) return null;
    return this.cards[numCardsAbove - 1] ?? null;
  }

  //
  // GetHighestCardBelow()
  //
  getHighestCardBelow(faceValueOrCard: number | Card): Card | null {
    const numCardsBelow = this.getNumCardsBelow(faceValueOrCard);
    if (numCardsBelow === 0) return null;
    const cardIndex = this.cards.length - numCardsBelow;
    return this.cards[cardIndex] ?? null;
  }

  //
  // GetAllCardsAbove()
  //
  getAllCardsAbove(faceValueOrCard: number | Card, cards: CardList): number {
    const numCardsAbove = this.getNumCardsAbove(faceValueOrCard);
    if (numCardsAbove === 0) return 0;
    cards.clear();
    for (let i = 0; i < numCardsAbove; i++) {
      cards.add(this.cards[i]);
    }
    return numCardsAbove;
  }

  //
  // GetAllCardsBelow()
  //
  getAllCardsBelow(faceValueOrCard: number | Card, cards: CardList): number {
    const numCardsBelow = this.getNumCardsBelow(faceValueOrCard);
    if (numCardsBelow === 0) return 0;
    const cardIndex = this.cards.length - numCardsBelow;
    cards.clear();
    for (let i = cardIndex; i < this.cards.length; i++) {
      cards.add(this.cards[i]);
    }
    return numCardsBelow;
  }

  //
  // GetEquivalentCards()
  //
  // - returns a list of touching cards
  //
  getEquivalentCards(card: Card, cardList: CardList, includeCard = false): number {
    if (!this.has(card)) return 0;
    if (!this.sorted) this.sort();
    cardList.clear();

    // add card if desired
    if (includeCard) {
      cardList.add(card);
    }

    // first add higher cards
    let val = card.faceValue + 1;
    let index = this.getCardIndex(card) - 1;
    for (let i = index; i >= 0; i--, val++) {
      if (this.cards[i].faceValue === val) {
        cardList.add(this.cards[i]);
      } else {
        break;
      }
    }

    // then add lower cards
    val = card.faceValue - 1;
    index = this.getCardIndex(card) + 1;
    for (let i = index; i < this.cards.length; i++, val--) {
      if (this.cards[i].faceValue === val) {
        cardList.add(this.cards[i]);
      } else {
        break;
      }
    }

    // done
    return cardList.length;
  }

  //
  // AreEquivalentCards()
  //
  // determines whether two cards are more or less equivalent in rank
  // i.e., if we have continuous sequence covering the two cards
  // assume the cards are of the same suit
  //
  areEquivalentCards(card1: Card, card2: Card): boolean {
    const index1 = this.getCardIndex(card1);
    const index2 = this.getCardIndex(card2);
    if (index1 < 0 || index2 < 0) return false; // oops

    // check distance versus face value difference
    const val1 = card1.faceValue;
    const val2 = card2.faceValue;
    return (val1 - val2) === (index2 - index1);
  }

  //
  // GetHighestEquivalentCard()
  //
  // - returns the highest touching card
  //   assume the cards are of the same suit
  //
  getHighestEquivalentCard(card: Card): Card | null {
    if (!this.has(card)) return null;
    if (!this.sorted) this.sort();

    let val = card.faceValue + 1;
    const index = this.getCardIndex(card) - 1;
    let i = index;
    for (i = index; i >= 0; i--, val++) {
      if (this.cards[i].faceValue !== val) break;
    }
    return this.cards[i + 1] ?? null;
  }

  //
  // GetLowestEquivalentCard()
  //
  // - returns the lowest card of the sequence this card belongs to
  //
  getLowestEquivalentCard(card: Card): Card | null {
    if (!this.has(card)) return null;
    if (!this.sorted) this.sort();

    let val = card.faceValue - 1;
    const index = this.getCardIndex(card) + 1;
    let i = index;
    for (i = index; i < this.cards.length; i++, val--) {
      if (this.cards[i].faceValue !== val) break;
    }
    return this.cards[i - 1] ?? null;
  }
}
