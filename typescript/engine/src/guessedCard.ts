import { Card } from './card.js';
import { NONE, Position, Suit } from './constants.js';

export class GuessedCard {
  private outstanding = true;
  private probableLocationValue: Position | typeof NONE = NONE;
  private fixProbability = 0;

  constructor(
    readonly card: Card,
    options: {
      outstanding?: boolean;
      location?: Position | typeof NONE;
      fixProbability?: number;
    } = {},
  ) {
    this.outstanding = options.outstanding ?? true;
    this.probableLocationValue = options.location ?? NONE;
    this.fixProbability = this.clampProbability(options.fixProbability ?? 0);
  }

  get suit(): Suit {
    return this.card.suit;
  }

  get faceValue(): number {
    return this.card.faceValue;
  }

  get deckValue(): number {
    return this.card.deckValue;
  }

  get name(): string {
    return this.card.name;
  }

  clear(): void {
    this.probableLocationValue = NONE;
    this.outstanding = true;
    this.fixProbability = 0;
  }

  setProbableLocation(location: Position): void {
    this.probableLocationValue = location;
  }

  get probableLocation(): Position | typeof NONE {
    return this.probableLocationValue;
  }

  setDefiniteLocation(location: Position): void {
    this.probableLocationValue = location;
    this.fixProbability = 1;
  }

  get definiteLocation(): Position | typeof NONE {
    return this.fixProbability === 1 ? this.probableLocationValue : NONE;
  }

  get locationIdentified(): boolean {
    return this.fixProbability === 1;
  }

  markAsPlayed(hand: Position): void {
    this.outstanding = false;
    this.probableLocationValue = hand;
    this.fixProbability = 1;
  }

  setPlayed(played = true): void {
    this.outstanding = !played;
  }

  setOutstanding(outstanding = true): void {
    this.outstanding = outstanding;
  }

  get isOutstanding(): boolean {
    return this.outstanding;
  }

  get wasPlayed(): boolean {
    return !this.outstanding;
  }

  clearFixProbability(): void {
    this.fixProbability = 0;
  }

  setFixProbability(probability: number): void {
    if (probability < 0) return;
    this.fixProbability = this.clampProbability(probability);
  }

  get fixProbabilityValue(): number {
    return this.fixProbability;
  }

  scaleFixProbability(adjustment: number): number {
    if (this.fixProbability === 0) return 0;
    if (adjustment > 0) this.fixProbability *= adjustment;
    return this.clampFixProbability();
  }

  adjustFixProbability(adjustment: number): number {
    this.fixProbability += Math.max(adjustment, -1);
    return this.clampFixProbability();
  }

  adjustFixProbabilityIncremental(adjustment: number): number {
    const bounded = Math.max(-1, Math.min(1, adjustment));
    if (bounded > 0) {
      this.fixProbability += (1 - this.fixProbability) * bounded;
    } else if (bounded < 0) {
      this.fixProbability -= this.fixProbability * bounded;
    }
    return this.clampFixProbability();
  }

  clampFixProbability(): number {
    if (this.fixProbability >= 1) this.fixProbability = 0.9999;
    else if (this.fixProbability < 0) this.fixProbability = 0;
    return this.fixProbability;
  }

  private clampProbability(probability: number): number {
    if (probability >= 1) return 1;
    if (probability < 0) return 0;
    return probability;
  }
}
