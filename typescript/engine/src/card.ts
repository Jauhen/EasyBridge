//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CCard (CARD.H, card.cpp, card_static.cpp)
//
// Note: MFC/GDI drawing, bitmap, drag, and animation routines are intentionally omitted.
//

import {
  ACE,
  CARD_CHARS,
  CARD_NAMES,
  cardSuit,
  FACE_VALUE_NAMES,
  faceValue as deckFaceValue,
  isCard,
  isFaceVal,
  isSuit,
  JACK,
  KING,
  makeDeckValue,
  NONE,
  QUEEN,
  Suit,
  SUIT_CHARS,
  SUIT_NAMES,
  SUIT_NAMES_SINGULAR,
  TEN,
} from './constants.js';

export class Card {
  private _suit: Suit;
  private _faceValue: number;
  private _deckValue: number;
  private _name: string;
  private _faceName: string;
  private _fullName: string;
  private _reverseFullName: string;

  // non-GDI card state from CCard
  private _posX = 0;
  private _posY = 0;
  private _owner = -1;
  private _handIndex = -1;
  private _displayPosition = -1;
  private _suitPosition = -1;
  private _faceUp = false;
  private _assigned = false;

  constructor(suit: Suit, faceValue: number) {
    // check limits
    if (suit < Suit.Clubs || suit > Suit.Spades || faceValue < 2 || faceValue > ACE) {
      throw new RangeError(
        `Illegal call to card's initialize routine; suit = ${suit}, value = ${faceValue}`,
      );
    }

    this._suit = suit;
    this._faceValue = faceValue;
    this._deckValue = makeDeckValue(suit, faceValue);
    this._name = Card.cardToShortString(this._deckValue);
    this._faceName = Card.getCardName(this._faceValue);
    this._fullName = Card.cardToString(this._deckValue);
    this._reverseFullName = Card.cardToReverseString(this._deckValue);
    this._assigned = false;
  }

  //
  // Static utility methods from card_static.cpp
  //

  static charToSuit(c: string): number {
    if (!c) return -1;
    const upper = c[0].toUpperCase();
    for (let i = 0; i < 5; i++) {
      if (c[0] === SUIT_CHARS[i] || upper === SUIT_CHARS[i]) {
        return i;
      }
    }
    return -1;
  }

  static charToFaceValue(c: string): number {
    if (!c) return 0;
    let nValue = 0;
    const t = c[0].toUpperCase();
    if (t >= '0' && t <= '9') {
      nValue = t.charCodeAt(0) - '0'.charCodeAt(0);
    } else {
      switch (t) {
        case 'T':
          nValue = TEN;
          break;
        case 'J':
          nValue = JACK;
          break;
        case 'Q':
          nValue = QUEEN;
          break;
        case 'K':
          nValue = KING;
          break;
        case 'A':
          nValue = ACE;
          break;
      }
    }
    return nValue;
  }

  static getSuitLetter(suit: number): string {
    if (suit < Suit.Clubs || suit > Suit.Spades) {
      return ' ';
    }
    return SUIT_CHARS[suit];
  }

  static getCardLetter(faceValue: number): string {
    if (faceValue < 2 || faceValue > ACE) {
      return '?';
    }
    return CARD_CHARS[faceValue];
  }

  static getSuitName(suit: number): string {
    if (!isSuit(suit)) {
      throw new RangeError(`Invalid suit ${suit}`);
    }
    return SUIT_NAMES[suit] ?? '????';
  }

  static getCardName(faceValue: number): string {
    if (!isFaceVal(faceValue)) {
      throw new RangeError(`Invalid face value ${faceValue}`);
    }
    return FACE_VALUE_NAMES[faceValue];
  }

  static cardValToString(faceValue: number): string {
    if (!isFaceVal(faceValue)) {
      return '???';
    }
    return CARD_NAMES[faceValue];
  }

  //
  // CardToString()
  //
  // eg., Queen of Hearts
  //
  static cardToString(deckValue: number): string {
    if (!isCard(deckValue)) {
      return '???';
    }
    return `${CARD_NAMES[deckFaceValue(deckValue)]} of ${SUIT_NAMES[cardSuit(deckValue)]}`;
  }

  //
  // CardToShortString()
  //
  // e.g., HQ
  //
  static cardToShortString(deckValue: number): string {
    if (!isCard(deckValue)) {
      return '??';
    }
    return `${SUIT_CHARS[cardSuit(deckValue)]}${CARD_CHARS[deckFaceValue(deckValue)]}`;
  }

  //
  // CardToReverseString()
  //
  // e.g., Heart Queen
  //
  static cardToReverseString(deckValue: number): string {
    if (!isCard(deckValue)) {
      return '???';
    }
    return `${Card.suitToSingularString(cardSuit(deckValue))} ${CARD_NAMES[deckFaceValue(deckValue)]}`;
  }

  static suitToString(suit: number): string {
    if (suit < Suit.Clubs || suit > Suit.NoTrump) {
      return '????';
    }
    return SUIT_NAMES[suit];
  }

  //
  // same as above, but truncate ending 's'
  //
  static suitToSingularString(suit: number): string {
    if (suit < Suit.Clubs || suit > Suit.NoTrump) {
      return '????';
    }
    return SUIT_NAMES_SINGULAR[suit];
  }

  static fromDeckValue(deckValue: number): Card {
    if (!isCard(deckValue)) {
      throw new RangeError(`Invalid deck value ${deckValue}`);
    }
    return new Card(
      cardSuit(deckValue),
      deckFaceValue(deckValue),
    );
  }

  static compare(a: Card, b: Card): number {
    return b.deckValue - a.deckValue;
  }

  //
  // Lifecycle / reset
  //

  initialize(suit: Suit, faceValue: number): void {
    // check limits
    if (suit < Suit.Clubs || suit > Suit.Spades || faceValue < 2 || faceValue > ACE) {
      throw new RangeError(
        `Illegal call to card's initialize routine; suit = ${suit}, value = ${faceValue}`,
      );
    }

    this._suit = suit;
    this._faceValue = faceValue;
    this._deckValue = makeDeckValue(suit, faceValue);
    this._name = Card.cardToShortString(this._deckValue);
    this._faceName = Card.getCardName(this._faceValue);
    this._fullName = Card.cardToString(this._deckValue);
    this._reverseFullName = Card.cardToReverseString(this._deckValue);
    this._assigned = false;
  }

  clear(): void {
    this._assigned = false;
    this._faceUp = false;
    this._owner = -1;
    this._displayPosition = -1;
    this._suitPosition = -1;
    this._handIndex = -1;
    this._posX = 0;
    this._posY = 0;
  }

  isValid(): boolean {
    if (this._deckValue < 0 || this._deckValue >= 52) return false;
    if (this._suit < Suit.Clubs || this._suit > Suit.Spades) return false;
    return true;
  }

  //
  // Identity getters
  //

  get suit(): Suit {
    return this._suit;
  }

  get faceValue(): number {
    return this._faceValue;
  }

  get deckValue(): number {
    return this._deckValue;
  }

  get sortedDeckIndex(): number {
    return this._suit * 13 + this._faceValue - 2;
  }

  // GetName() -- "D7"
  get name(): string {
    return this._name;
  }

  // GetFullName() -- "Seven of Diamonds"
  get fullName(): string {
    return this._fullName;
  }

  // GetReverseFullName() -- "Diamond Seven"
  get reverseFullName(): string {
    return this._reverseFullName;
  }

  // GetFaceName() -- "seven"
  get faceName(): string {
    return this._faceName;
  }

  // GetCardLetter() -- "7"
  get cardLetter(): string {
    return CARD_CHARS[this._faceValue];
  }

  // GetSuitLetter() -- "D"
  get suitLetter(): string {
    return SUIT_CHARS[this._suit] ?? ' ';
  }

  get isHonor(): boolean {
    return this._faceValue >= JACK;
  }

  get honorPoints(): number {
    if (this._faceValue === ACE) return 4;
    if (this._faceValue === KING) return 3;
    if (this._faceValue === QUEEN) return 2;
    if (this._faceValue === JACK) return 1;
    return 0;
  }

  //
  // Display / ownership / hand metadata
  //

  //
  // GetDisplayValue()
  //
  // the card's display order onscreen
  // the highest card (the one that appears first) has the lowest code
  //
  getDisplayValue(suitToScreenIndex: (suit: Suit) => number = s => 3 - s): number {
    const suitIndex = suitToScreenIndex(this._suit);
    return suitIndex * 13 + (14 - this._faceValue);
  }

  //
  // GetDummyDisplayValue()
  //
  getDummyDisplayValue(dummySuitToScreenIndex: (suit: Suit) => number = s => 3 - s): number {
    const suitIndex = dummySuitToScreenIndex(this._suit);
    return suitIndex * 13 + (14 - this._faceValue);
  }

  get displayPosition(): number {
    return this._displayPosition;
  }

  setDisplayPosition(pos: number): void {
    this._displayPosition = pos;
  }

  decrementDisplayPosition(): void {
    this._displayPosition--;
  }

  get suitPosition(): number {
    return this._suitPosition;
  }

  setSuitPosition(pos: number): void {
    this._suitPosition = pos;
  }

  decrementSuitPosition(): void {
    this._suitPosition--;
  }

  get xPosition(): number {
    return this._posX;
  }

  get yPosition(): number {
    return this._posY;
  }

  setXPosition(pos = -1): void {
    this._posX = pos;
  }

  setYPosition(pos = -1): void {
    this._posY = pos;
  }

  get owner(): number {
    return this._owner;
  }

  setOwner(player: number): void {
    this._owner = player;
    if (this._owner === NONE) this._assigned = false;
  }

  get handIndex(): number {
    return this._handIndex;
  }

  setHandIndex(index: number): void {
    this._handIndex = index;
  }

  decrementHandIndex(): void {
    this._handIndex--;
  }

  get isCardAssigned(): boolean {
    return this._assigned;
  }

  setAssigned(assign = true): void {
    this._assigned = assign;
  }

  clearAssignment(): void {
    this._assigned = false;
  }

  get isCardFaceUp(): boolean {
    return this._faceUp;
  }

  setFaceUp(faceUp = true): void {
    this._faceUp = faceUp;
  }

  setFaceDown(): void {
    this._faceUp = false;
  }

  //
  // Comparison helpers mirroring CCard overloaded operators
  //

  equals(other: Card): boolean {
    return this._deckValue === other._deckValue;
  }

  isHigherThan(other: Card): boolean {
    return this._deckValue > other._deckValue;
  }

  isLowerThan(other: Card): boolean {
    return this._deckValue < other._deckValue;
  }
}
