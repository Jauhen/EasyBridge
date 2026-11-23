//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CGuessedCardHoldings (GuessedCardHoldings.H / GuessedCardHoldings.cpp)
//

import { Card } from '../card.js';
import { isCard, MAXHOLDING } from '../constants.js';
import { GuessedCard } from '../guessedCard.js';

export class GuessedCardHoldings {
  protected cards: GuessedCard[] = [];
  protected definiteCards = 0;       // definitely ID'd cards
  protected likelyCards = 0;         // cards the player prob'ly holds
  protected playedCards = 0;         // cards that have been played
  protected remainingCards = 0;      // cards the player has remaining
  protected minRemainingCards = 0;   // min remaining cards
  protected maxRemainingCards = 0;   // max remaining cards
  protected originalCards = 0;       // probable original cards
  protected minOriginalCards = 0;    // min prob original cards
  protected maxOriginalCards = 0;    // max prob original cards
  //
  protected sorted = false;
  protected autoSort = true;
  protected reverseSort = false;
  protected strHoldings = '---';

  //
  // Construction/Destruction
  //
  constructor() {
    this.autoSort = true;
    this.reverseSort = false;
  }

  init(): void {
    // total cards = definite cards + likely cards
    this.cards = [];
    this.definiteCards = 0;
    this.likelyCards = 0;
    //
    this.playedCards = 0;
    this.remainingCards = 0;
    this.minRemainingCards = 0;
    this.maxRemainingCards = 0;
    this.originalCards = 0;
    this.minOriginalCards = 0;
    this.maxOriginalCards = 0;
    //
    this.sorted = false;
    this.strHoldings = '---';
  }

  clear(_deleteCards = true): void {
    this.init();
  }

  formatHoldingsString(): void {
    // format the holdings string
    if (this.cards.length > 0) {
      this.strHoldings = this.cards.map(card => card.name).join(' ');
    } else {
      this.strHoldings = '---';
    }
  }

  add(card: GuessedCard, sort = false): void {
    if (this.cards.length >= MAXHOLDING) return;

    // see if we have a duplicate card value
    if (this.hasCard(card.deckValue)) {
      // remove and delete the old card
      this.deleteByValue(card.deckValue);
    }

    // now add
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
      // add without sorting
      this.cards.push(card);
      this.sorted = false;
    }

    // update specific counts
    if (card.locationIdentified) this.definiteCards++;
    else this.likelyCards++;

    // if this is a record of a card play,
    // update the count of cards remaining
    if (card.wasPlayed) {
      this.playedCards++;
      this.remainingCards--;
      this.minRemainingCards--;
      this.maxRemainingCards--;
      this.originalCards++;
    } else {
      // the card wasn't played, but we think the player has it
      this.minRemainingCards++;
      this.maxRemainingCards++;
    }

    // adjust min & max original card count
    this.minOriginalCards++;
    this.maxOriginalCards++;

    // check limits
    if (this.minOriginalCards < 0) this.minOriginalCards = 0;
    if (this.maxOriginalCards < 0) this.maxOriginalCards = 0;
    if (this.minRemainingCards < 0) this.minRemainingCards = 0;
    if (this.maxRemainingCards < 0) this.maxRemainingCards = 0;
  }

  //
  // RemoveByIndex()
  //
  // this is the main removal routine, called by all others
  // derived classes should only redefine this version of the operation
  //
  removeByIndex(index: number): GuessedCard | null {
    if (index < 0 || index >= this.cards.length) return null;
    const [card] = this.cards.splice(index, 1);

    // update count
    if (card.locationIdentified) this.definiteCards--;
    else this.likelyCards--;
    //
    this.minOriginalCards--;
    this.maxOriginalCards--;
    //
    if (card.wasPlayed) {
      this.playedCards--;
      this.remainingCards++;
      this.minRemainingCards++;
      this.maxRemainingCards++;
      this.originalCards--;
    } else {
      this.minRemainingCards--;
      this.maxRemainingCards--;
    }
    //
    if (this.definiteCards < 0) this.definiteCards = 0;
    if (this.likelyCards < 0) this.likelyCards = 0;
    if (this.playedCards < 0) this.playedCards = 0;
    if (this.minOriginalCards < 0) this.minOriginalCards = 0;
    if (this.maxOriginalCards < 0) this.maxOriginalCards = 0;
    if (this.minRemainingCards < 0) this.minRemainingCards = 0;
    if (this.maxRemainingCards < 0) this.maxRemainingCards = 0;

    // reform holdings string
    this.formatHoldingsString();
    return card;
  }

  removeByValue(deckValue: number): GuessedCard | null {
    if (!isCard(deckValue)) return null;
    if (this.cards.length <= 0) return null;
    const index = this.getCardIndex(deckValue);
    return this.removeByIndex(index);
  }

  remove(card: GuessedCard | Card): GuessedCard | null {
    if (this.cards.length <= 0) return null;
    const index = this.getCardIndex(card);
    if (index < 0) return null;
    return this.removeByIndex(index);
  }

  deleteByIndex(index: number): void {
    this.removeByIndex(index);
  }

  deleteByValue(deckValue: number): void {
    this.removeByValue(deckValue);
  }

  delete(card: GuessedCard | Card): boolean {
    return this.remove(card) !== null;
  }

  merge(source: GuessedCardHoldings): void {
    for (const card of source.all) {
      this.add(card);
    }
    this.sort();
    this.formatHoldingsString();
  }

  sort(): void {
    if (this.sorted) return;
    this.cards.sort((a, b) =>
      this.reverseSort ? a.deckValue - b.deckValue : b.deckValue - a.deckValue,
    );
    this.sorted = true;
    this.formatHoldingsString();
  }

  reverseSortOrder(reverse: boolean): void {
    if (this.reverseSort !== reverse) {
      this.reverseSort = reverse;
      this.sorted = false;
    }
  }

  enableAutoSort(mode: boolean): void {
    this.autoSort = mode;
  }

  //
  // Misc routines
  //

  hasCard(cardOrDeckValue: GuessedCard | number): boolean {
    const deckValue = typeof cardOrDeckValue === 'number'
      ? cardOrDeckValue
      : cardOrDeckValue.deckValue;
    if (!isCard(deckValue) || this.cards.length === 0) return false;
    if (this.sorted && !this.reverseSort) {
      for (let i = 0; i < this.cards.length; i++) {
        if (this.cards[i].deckValue === deckValue) return true;
        if (this.cards[i].deckValue < deckValue) return false; // passed where it should have been
      }
      return false;
    }
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].deckValue === deckValue) return true;
    }
    return false;
  }

  hasCardOfFaceValue(faceValue: number): boolean {
    if (this.cards.length === 0) return false;
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].faceValue === faceValue) return true;
    }
    return false;
  }

  //
  // return card index if it's in the holding, else return -1
  //
  getCardIndex(cardOrDeckValue: GuessedCard | Card | number): number {
    if (this.cards.length === 0) return -1;
    const deckValue = typeof cardOrDeckValue === 'number'
      ? cardOrDeckValue
      : cardOrDeckValue.deckValue;
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].deckValue === deckValue) return i;
    }
    return -1;
  }

  at(index: number): GuessedCard | undefined {
    return this.cards[index];
  }

  get all(): readonly GuessedCard[] {
    return this.cards;
  }

  get length(): number {
    return this.cards.length;
  }

  get numTotalCards(): number {
    return this.cards.length;
  }

  get topCard(): GuessedCard | null {
    return this.cards[0] ?? null;
  }

  get bottomCard(): GuessedCard | null {
    return this.cards[this.cards.length - 1] ?? null;
  }

  get secondHighestCard(): GuessedCard | null {
    return this.cards.length > 1 ? this.cards[1] : null;
  }

  get secondLowestCard(): GuessedCard | null {
    return this.cards.length > 1 ? this.cards[this.cards.length - 2] : null;
  }

  get topCardVal(): number {
    if (this.cards.length === 0) throw new RangeError('GuessedCardHoldings is empty');
    return this.cards[0].faceValue;
  }

  get bottomCardVal(): number {
    if (this.cards.length === 0) throw new RangeError('GuessedCardHoldings is empty');
    return this.cards[this.cards.length - 1].faceValue;
  }

  get holdingsString(): string {
    return this.strHoldings;
  }

  get numDefiniteCards(): number {
    return this.definiteCards;
  }

  setNumDefiniteCards(val: number): void {
    this.definiteCards = val;
  }

  get numLikelyCards(): number {
    return this.likelyCards;
  }

  setNumLikelyCards(val: number): void {
    this.likelyCards = val;
  }

  get numPlayedCards(): number {
    return this.playedCards;
  }

  get numRemainingCards(): number {
    return this.remainingCards;
  }

  setRemainingCards(count: number): void {
    this.remainingCards = count;
    this.minRemainingCards = count;
    this.maxRemainingCards = count;
  }

  get numMinRemainingCards(): number {
    return this.minRemainingCards;
  }

  setNumMinRemainingCards(val: number): void {
    this.minRemainingCards = val;
  }

  get numMaxRemainingCards(): number {
    return this.maxRemainingCards;
  }

  setNumMaxRemainingCards(val: number): void {
    this.maxRemainingCards = val;
  }

  get numOriginalCards(): number {
    return this.originalCards;
  }

  setOriginalCards(count: number): void {
    this.originalCards = count;
    this.minOriginalCards = count;
    this.maxOriginalCards = count;
  }

  get numMinOriginalCards(): number {
    return this.minOriginalCards;
  }

  setNumMinOriginalCards(val: number): void {
    this.minOriginalCards = val;
  }

  get numMaxOriginalCards(): number {
    return this.maxOriginalCards;
  }

  setNumMaxOriginalCards(val: number): void {
    this.maxOriginalCards = val;
  }

  //
  // GetPlayedCardsList()
  //
  getPlayedCardsList(cardList: GuessedCardHoldings): number {
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].wasPlayed) cardList.add(this.cards[i]);
    }
    cardList.sort();
    return cardList.length;
  }

  //
  // GetIdentifiedCardsList()
  //
  getIdentifiedCardsList(cardList: GuessedCardHoldings): number {
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].locationIdentified) cardList.add(this.cards[i]);
    }
    cardList.sort();
    return cardList.length;
  }

  //
  // GetRemainingCardsList()
  //
  getRemainingCardsList(cardList: GuessedCardHoldings): number {
    // remaining cards are identified cards that have not been played yet
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].locationIdentified && !this.cards[i].wasPlayed) {
        cardList.add(this.cards[i]);
      }
    }
    cardList.sort();
    return cardList.length;
  }

  get playedCardsList(): GuessedCardHoldings {
    const result = new GuessedCardHoldings();
    this.getPlayedCardsList(result);
    return result;
  }

  get identifiedCardsList(): GuessedCardHoldings {
    const result = new GuessedCardHoldings();
    this.getIdentifiedCardsList(result);
    return result;
  }

  get remainingCardsList(): GuessedCardHoldings {
    const result = new GuessedCardHoldings();
    this.getRemainingCardsList(result);
    return result;
  }

  get isSorted(): boolean {
    return this.sorted;
  }
}
