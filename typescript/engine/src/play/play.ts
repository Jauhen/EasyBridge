import { Card } from '../card.js';
import { NONE, Position, Suit } from '../constants.js';

export enum PlayResult {
  Error = -4,
  Failed = -3,
  NotViable = -2,
  Postpone = -1,
  Inactive = 0,
  InProgress = 1,
  Complete = 2,
  CompleteAndRepeat = 3,
}

export enum PlayType {
  TrumpPull,
  Cash,
  Ruff,
  Drop,
  Force,
  Finesse,
  HoldUp,
  Develop,
  Discard,
  Exit,
}

export enum PlayProspect {
  Unknown = 0,
  Loser = 1,
  Speculative = 2,
  LikelyWinner = 3,
  GuaranteedWinner = 4,
}

export interface PlayDependencies {
  cardLocation?: unknown;
  guessedHands?: unknown[];
  status?: unknown;
  combinedHand?: unknown;
}

export class Play {
  // Mirrors CPlay: every play is identified once, has an active result,
  // target/starting/ending hands, optional key/target cards, and a unique ID.
  private static nextId = 1;
  readonly id: number;
  status = PlayResult.Inactive;
  startingHand: Position | typeof NONE = NONE;
  endingHand: Position | typeof NONE = NONE;
  targetHand: Position | typeof NONE = NONE;
  targetCard: Card | null = null;
  consumedCard: Card | null = null;

  constructor(
    readonly type: PlayType,
    targetHand: Position | typeof NONE = NONE,
    readonly suit: Suit | typeof NONE = NONE,
    readonly prospect = PlayProspect.Unknown,
    readonly opportunistic = false,
  ) {
    this.id = Play.obtainUniqueId();
    this.targetHand = targetHand;
  }

  private static obtainUniqueId(): number {
    return Play.nextId++;
  }

  clear(): void {
    this.status = PlayResult.Inactive;
  }

  reset(): void {
    this.status = PlayResult.Inactive;
  }

  init(): void {}

  get isValid(): boolean {
    return this.id > 0;
  }

  get isGuaranteedWinner(): boolean {
    return this.prospect === PlayProspect.GuaranteedWinner;
  }

  get isWinner(): boolean {
    return this.prospect >= PlayProspect.LikelyWinner;
  }

  get name(): string {
    return PlayType[this.type];
  }

  perform(_dependencies: PlayDependencies): PlayResult {
    this.status = PlayResult.Inactive;
    return this.status;
  }
}
