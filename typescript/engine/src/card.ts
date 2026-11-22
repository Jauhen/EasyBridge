import {
  ACE,
  faceValue as deckFaceValue,
  faceValueToChar,
  Suit,
  suitToChar,
} from './constants.js';

export class Card {
  constructor(
    readonly suit: Suit,
    readonly faceValue: number,
  ) {
    if (suit < Suit.Clubs || suit > Suit.Spades || faceValue < 2 || faceValue > ACE) {
      throw new RangeError(`Invalid card: suit=${suit}, face=${faceValue}`);
    }
  }

  get deckValue(): number {
    return this.suit * 13 + this.faceValue - 2;
  }

  get name(): string {
    return `${suitToChar(this.suit)}${faceValueToChar(this.faceValue)}`;
  }

  get isHonor(): boolean {
    return this.faceValue >= 11;
  }

  get honorPoints(): number {
    if (this.faceValue === ACE) return 4;
    if (this.faceValue === 13) return 3;
    if (this.faceValue === 12) return 2;
    if (this.faceValue === 11) return 1;
    return 0;
  }

  static fromDeckValue(deckValue: number): Card {
    if (deckValue < 0 || deckValue > 51) throw new RangeError(`Invalid deck value ${deckValue}`);
    return new Card(
      Math.floor(deckValue / 13) as Suit,
      deckFaceValue(deckValue),
    );
  }

  static compare(a: Card, b: Card): number {
    return b.deckValue - a.deckValue;
  }
}
