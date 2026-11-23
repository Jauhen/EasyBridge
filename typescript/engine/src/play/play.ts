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
  outstandingCards?: Card[];
  partnershipCards?: Card[];
  alreadyPlayedCards?: Card[];
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
  targetCards: Card[] = [];
  keyCards: Card[] = [];
  alternativeKeyCards: Card[] = [];
  enemyKeyCards: Card[] = [];
  enemyAlternativeKeyCards: Card[] = [];
  requiredPlayedCards: Card[] = [];

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

  setTargetCard(card: Card | null): void {
    this.targetCard = card;
  }

  setConsumedCard(card: Card | null): void {
    this.consumedCard = card;
  }

  setKeyCards(cards: Card[]): void {
    this.keyCards = [...cards];
  }

  setAlternativeKeyCards(cards: Card[]): void {
    this.alternativeKeyCards = [...cards];
  }

  setEnemyKeyCards(cards: Card[]): void {
    this.enemyKeyCards = [...cards];
  }

  setEnemyAlternativeKeyCards(cards: Card[]): void {
    this.enemyAlternativeKeyCards = [...cards];
  }

  setRequiredPlayedCards(cards: Card[]): void {
    this.requiredPlayedCards = [...cards];
  }

  isViable(dependencies: PlayDependencies): boolean {
    const outstanding = dependencies.outstandingCards ?? [];
    const partnership = dependencies.partnershipCards ?? [];
    const alreadyPlayed = dependencies.alreadyPlayedCards ?? [];

    if (this.consumedCard &&
      !partnership.some(card => card.deckValue === this.consumedCard?.deckValue)) {
      this.status = PlayResult.NotViable;
      return false;
    }
    if (this.targetCard &&
      !outstanding.some(card => card.deckValue === this.targetCard?.deckValue)) {
      this.status = PlayResult.NotViable;
      return false;
    }
    if (this.keyCards.length > 0 &&
      !this.keyCards.every(card =>
        partnership.some(partnershipCard => partnershipCard.deckValue === card.deckValue),
      )) {
      this.status = PlayResult.NotViable;
      return false;
    }
    if (this.alternativeKeyCards.length > 0 &&
      !this.alternativeKeyCards.some(card =>
        partnership.some(partnershipCard => partnershipCard.deckValue === card.deckValue),
      )) {
      this.status = PlayResult.NotViable;
      return false;
    }
    if (this.enemyKeyCards.length > 0 &&
      !this.enemyKeyCards.every(card =>
        outstanding.some(outstandingCard => outstandingCard.deckValue === card.deckValue),
      )) {
      this.status = PlayResult.NotViable;
      return false;
    }
    if (this.enemyAlternativeKeyCards.length > 0 &&
      !this.enemyAlternativeKeyCards.some(card =>
        outstanding.some(outstandingCard => outstandingCard.deckValue === card.deckValue),
      )) {
      this.status = PlayResult.NotViable;
      return false;
    }
    if (this.requiredPlayedCards.length > 0 &&
      !this.requiredPlayedCards.every(card =>
        alreadyPlayed.some(playedCard => playedCard.deckValue === card.deckValue),
      )) {
      this.status = PlayResult.NotViable;
      return false;
    }
    return true;
  }

  perform(_dependencies: PlayDependencies): PlayResult {
    this.status = PlayResult.Inactive;
    return this.status;
  }
}
