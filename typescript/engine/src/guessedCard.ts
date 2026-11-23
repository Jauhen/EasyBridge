//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CGuessedCard (GuessedCard.H / GuessedCard.CPP)
//

import { Card } from './card.js';
import { NONE, Position, Suit } from './constants.js';

export class GuessedCard {
  private _card: Card;
  private _suit: Suit;
  private _faceValue: number;
  private _name: string;
  private _outstanding = true;
  private _location: Position | typeof NONE = NONE;
  private _fixProbability = 0;

  //
  // construction / destruction
  //
  constructor(
    card: Card,
    options: {
      outstanding?: boolean;
      location?: Position | typeof NONE;
      fixProbability?: number;
    } = {},
  ) {
    this._card = card;
    this._suit = card.suit;
    this._faceValue = card.faceValue;
    this._name = card.name;
    this._outstanding = options.outstanding ?? true;
    this._location = options.location ?? NONE;
    this._fixProbability = this.clampInitialProbability(options.fixProbability ?? 0);
  }

  //
  // Init()
  //
  // call this if the default constructor is used
  //
  init(suit: Suit, faceValue: number): void {
    this._suit = suit;
    this._faceValue = faceValue;
    this._card = new Card(suit, faceValue);
    this._name = this._card.name;
    this.clear();
  }

  //
  // Inline accessors from GuessedCard.H
  //

  get card(): Card {
    return this._card;
  }

  get suit(): Suit {
    return this._suit;
  }

  get cardLetter(): string {
    return Card.getCardLetter(this._faceValue);
  }

  get suitLetter(): string {
    return Card.getSuitLetter(this._suit);
  }

  get name(): string {
    return this._name;
  }

  get fullName(): string {
    return Card.cardToString(this.deckValue);
  }

  get reverseFullName(): string {
    return Card.cardToReverseString(this.deckValue);
  }

  get faceName(): string {
    return Card.getCardName(this._faceValue);
  }

  get faceValue(): number {
    return this._faceValue;
  }

  get deckValue(): number {
    return this._suit * 13 + this._faceValue - 2;
  }

  //
  // Main routines
  //

  //
  // Clear()
  //
  clear(): void {
    this._location = NONE;
    this._outstanding = true;
    this._fixProbability = 0;
  }

  setProbableLocation(pos: Position): void {
    this._location = pos;
  }

  get probableLocation(): Position | typeof NONE {
    return this._location;
  }

  setDefiniteLocation(pos: Position): void {
    this._location = pos;
    this._fixProbability = 1;
  }

  get definiteLocation(): Position | typeof NONE {
    return this._fixProbability === 1 ? this._location : NONE;
  }

  get locationIdentified(): boolean {
    return this._fixProbability === 1;
  }

  markAsPlayed(hand: Position): void {
    this._outstanding = false;
    this._location = hand;
    this._fixProbability = 1;
  }

  setPlayed(played = true): void {
    this._outstanding = !played;
  }

  setOutstanding(outstanding = true): void {
    this._outstanding = outstanding;
  }

  get isOutstanding(): boolean {
    return this._outstanding;
  }

  get wasPlayed(): boolean {
    return !this._outstanding;
  }

  clearFixProbability(): void {
    this._fixProbability = 0;
  }

  setFixProbability(probability: number): void {
    if (probability < 0) return;
    this._fixProbability = probability > 1 ? 1 : probability;
  }

  get fixProbabilityValue(): number {
    return this._fixProbability;
  }

  //
  // ScaleFixProbability
  //
  // scale the fix probability by a factor, 0 to +n
  // results are clamped to the range 0f, 1.0f
  // e.g., 30% scaled by 0.5 is 15%
  // e.g., 30% scaled by 1.5 is 45%
  // e.g., 30% scaled by 0.0 is 30%  (0% adj has no effect)
  // e.g.,  0% scaled by 1.5 is  0%  (0% scaled always stays at zero)
  //
  scaleFixProbability(adjustment: number): number {
    if (this._fixProbability === 0) return 0;
    // adjust only if scalar is > 0
    if (adjustment > 0) this._fixProbability *= adjustment;
    // adjust the probability to make sense
    return this.clampFixProbability();
  }

  //
  // AdjustFixProbability
  //
  // input is in the range -1.0 to +n
  // adds the input value to the existing probability
  // results are clamped to the range 0f, 0.9999f
  // e.g., 30% adjusted by  0.5 (+50%) is 80%
  // e.g., 60% adjusted by -0.5 (-50%) is 10%
  //
  adjustFixProbability(adjustment: number): number {
    const bounded = adjustment < -1 ? -1 : adjustment;
    this._fixProbability += bounded;
    return this.clampFixProbability();
  }

  //
  // AdjustFixProbabilityIncremental
  //
  // input is in the range -1.0 to +1.0
  // if the input is positive, adjusts the probability figure by
  // adding the equivalent of n% of the difference between the
  // current probability and 1.0%
  // if input is negative, subtracts the equivalent of ABS(n%) from the
  // existing probability
  // e.g., 40% adjusted by  0.5 (+ 50% increment of 60% gap) is 70%
  // e.g., 40% adjusted by  1.0 (+100% increment of 60% gap) is 100%
  // e.g., 40% adjusted by -0.5 (- 50% of probability) is 20%
  //
  adjustFixProbabilityIncremental(adjustment: number): number {
    let bounded = adjustment;
    if (bounded > 1) bounded = 1;
    if (bounded < -1) bounded = -1;
    if (bounded > 0) {
      this._fixProbability += (1 - this._fixProbability) * bounded;
    } else if (bounded < 0) {
      // Preserves exact C++ GuessedCard.CPP line 151 behavior
      this._fixProbability -= this._fixProbability * bounded;
    }
    return this.clampFixProbability();
  }

  clampFixProbability(): number {
    if (this._fixProbability >= 1) this._fixProbability = 0.9999;
    else if (this._fixProbability < 0) this._fixProbability = 0;
    return this._fixProbability;
  }

  private clampInitialProbability(probability: number): number {
    if (probability >= 1) return 1;
    if (probability < 0) return 0;
    return probability;
  }
}
