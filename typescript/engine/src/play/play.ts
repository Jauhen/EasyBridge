//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CPlay (Play.h / Play.cpp)
//
// abstract base class
//
// Current list of plays are:
//    Cash
//    Discard
//    Drop
//    Finesse
//    Force
//    Ruff
//    Sluff
//    TrumpPull
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { CardLocation } from '../cardLocation.js';
import { NONE, Position, Suit } from '../constants.js';
import { Hand } from '../hand.js';
import { PlayerStatus } from '../playerStatus.js';
import { CombinedHoldings } from './combinedHoldings.js';
import { GuessedHandHoldings } from './guessedHandHoldings.js';

export const PLAY_TYPE_NAMES: readonly string[] = [
  'Trump Pull',
  'Cash',
  'Ruff',
  'Drop',
  'Force',
  'Finesse',
  'Hold Up',
  'Develop Suit',
  'Discard',
  'Exit',
];

// play status
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

// play type
export enum PlayType {
  NullPlay = -1,
  TrumpPull = 0,
  Cash = 1,
  Ruff = 2,
  Drop = 3,
  Force = 4,
  Finesse = 5,
  HoldUp = 6,
  Develop = 7,
  Discard = 8,
  Exit = 9,
}

// play location
export const IN_HAND = 0;
export const IN_DUMMY = 1;
export const IN_EITHER = -1;

// which entry the play uses up, if any
export const ENTRY_NONE = 0;
export const ENTRY_HAND = 1;
export const ENTRY_DUMMY = 2;

// play prospect
export enum PlayProspect {
  Unknown = 0,
  Loser = 1,
  Speculative = 2,
  LikelyWinner = 3,
  GuaranteedWinner = 4,
}

export interface PlayDependencies {
  cardLocation?: CardLocation;
  guessedHands?: GuessedHandHoldings[];
  status?: PlayerStatus;
  combinedHand?: CombinedHoldings;
  declarerHand?: Hand;
  dummyHand?: Hand;
  outstandingCards?: Card[];
  partnershipCards?: Card[];
  alreadyPlayedCards?: Card[];
  usedPlays?: readonly Play[];
  // trick & round context for full C++ Perform() execution
  numCardsPlayedInRound?: number;
  leadCard?: Card | null;
  currentBestCard?: Card | null;
  trumpSuit?: Suit | typeof NONE;
  isDummyTurn?: boolean;
  playerPosition?: Position;
  dummyPosition?: Position;
  partnerPosition?: Position;
  isCardOutstanding?: (card: Card) => boolean;
  getDiscard?: (hand: Hand) => Card | null;
  // output slot populated by Perform()
  selectedCard?: Card | null;
}

export class Play {
  // Mirrors CPlay: every play is identified once, has an active result,
  // target/starting/ending hands, optional key/target cards, and a unique ID.
  private static nextId = 1;
  readonly id: number;

  protected strName = '';
  protected strDescription = '';
  status: PlayResult = PlayResult.Inactive;
  startingHand: number = IN_EITHER;
  endingHand: number = IN_EITHER;
  targetHand: number = IN_EITHER;
  suit2: Suit | typeof NONE = NONE;

  numPrerequisites = 0;
  numPostrequisites = 0;
  prerequisite: Play | null = null;
  postrequisite: Play | null = null;
  prerequisiteList: Play[] = [];
  postrequisiteList: Play[] = [];

  consumedCard: Card | null = null;         // card that will be used up, if any
  targetCard: Card | null = null;           // enemy card that is the target of the play
  targetCards: Card[] = [];                 // enemy target cards
  keyCards: Card[] = [];                    // key cards required for the play
  alternativeKeyCards: Card[] = [];         // one or more of these key cards are rq'd
  alternativeKeyCards2: Card[] = [];        // one or more of these key cards are also rq'd
  enemyKeyCards: Card[] = [];               // key cards required to be held by opponents
  enemyAlternativeKeyCards: Card[] = [];    // one or more cards rq'd held by opponents
  requiredPlayedCards: Card[] = [];         // cards that must already have been played

  constructor(
    readonly type: PlayType,
    targetHand: number = IN_EITHER,
    public suit: Suit | typeof NONE = NONE,
    public prospect: PlayProspect = PlayProspect.Unknown,
    public opportunistic = false,
  ) {
    this.id = Play.obtainUniqueId();
    this.targetHand = targetHand;
    this.strName = PLAY_TYPE_NAMES[type] ?? PlayType[type] ?? 'Play';
  }

  private static obtainUniqueId(): number {
    return Play.nextId++;
  }

  static resetIdCounter(): void {
    Play.nextId = 1;
  }

  init(): void {
    // empty for now
  }

  clear(): void {
    this.status = PlayResult.Inactive;
    this.targetHand = IN_EITHER;
    this.startingHand = IN_EITHER;
    this.endingHand = IN_EITHER;
    this.suit = NONE;
    this.suit2 = NONE;
  }

  //
  // Reset()
  //
  // - called when a play is called back from the dead upon an "undo trick"
  //
  reset(): void {
    this.status = PlayResult.Inactive;
  }

  get isValid(): boolean {
    if (this.id < 0 || this.numPostrequisites < 0 || this.numPrerequisites < 0) {
      return false;
    }
    return true;
  }

  get isGuaranteedWinner(): boolean {
    return this.prospect === PlayProspect.GuaranteedWinner;
  }

  get isWinner(): boolean {
    return this.prospect >= PlayProspect.LikelyWinner;
  }

  get name(): string {
    return this.strName || PlayType[this.type];
  }

  get description(): string {
    return this.strDescription;
  }

  getPlayTypeName(): string {
    return PLAY_TYPE_NAMES[this.type] ?? 'Unknown';
  }

  getFullDescription(): string {
    return this.strDescription || this.name;
  }

  usesUpEntry(): number {
    return ENTRY_NONE;
  }

  setTargetCard(card: Card | null): void {
    this.targetCard = card;
  }

  setConsumedCard(card: Card | null): void {
    this.consumedCard = card;
  }

  setTargetCards(cards: Card[] | CardList): void {
    this.targetCards = cards instanceof CardList ? [...cards.cardsInAscendingDeckOrder] : [...cards];
  }

  setKeyCards(cards: Card[] | CardList): void {
    this.keyCards = cards instanceof CardList ? [...cards.cardsInAscendingDeckOrder] : [...cards];
  }

  setAlternativeKeyCards(cards: Card[] | CardList): void {
    this.alternativeKeyCards = cards instanceof CardList
      ? [...cards.cardsInAscendingDeckOrder]
      : [...cards];
  }

  setAlternativeKeyCards2(cards: Card[] | CardList): void {
    this.alternativeKeyCards2 = cards instanceof CardList
      ? [...cards.cardsInAscendingDeckOrder]
      : [...cards];
  }

  setEnemyKeyCards(cards: Card[] | CardList): void {
    this.enemyKeyCards = cards instanceof CardList
      ? [...cards.cardsInAscendingDeckOrder]
      : [...cards];
  }

  setEnemyAlternativeKeyCards(cards: Card[] | CardList): void {
    this.enemyAlternativeKeyCards = cards instanceof CardList
      ? [...cards.cardsInAscendingDeckOrder]
      : [...cards];
  }

  setRequiredPlayedCards(cards: Card[] | CardList): void {
    this.requiredPlayedCards = cards instanceof CardList
      ? [...cards.cardsInAscendingDeckOrder]
      : [...cards];
  }

  getNumKeyCards(): number {
    return this.keyCards.length;
  }

  getNumOrKeyCards(): number {
    return this.alternativeKeyCards.length;
  }

  getNumOrKeyCards2(): number {
    return this.alternativeKeyCards2.length;
  }

  //
  // RequiresCard()
  //
  // returns whether a card is required for the play to be performed
  //
  requiresCard(card: Card | null): boolean {
    if (!card) return false;
    // a card is required for this play if it is either consumed
    // in the play, or is a key card for the play (e.g., a cover card)
    if (
      this.consumedCard?.deckValue === card.deckValue ||
      this.keyCards.some(c => c.deckValue === card.deckValue)
    ) {
      return true;
    }
    return false;
  }

  //
  // LookupORCard()
  //
  // returns the index of a card in the OR-Key cards list, or -1 if not found
  //
  lookupORCard(card: Card): number {
    return this.alternativeKeyCards.findIndex(c => c.deckValue === card.deckValue);
  }

  //
  // LookupORCard2()
  //
  // returns the index of a card in the second OR-cards list, or -1 if not found
  //
  lookupORCard2(card: Card): number {
    return this.alternativeKeyCards2.findIndex(c => c.deckValue === card.deckValue);
  }

  //
  // IsPlayUsable() / isViable()
  //
  // perform some basic tests to see that the play is still usable
  //
  isViable(dependencies: PlayDependencies): boolean {
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    // only check if this is position #0 or 1
    if (ordinal >= 2) return true;

    const status = dependencies.status;
    const hasPartnershipCard = (card: Card): boolean => {
      if (dependencies.combinedHand) {
        return dependencies.combinedHand.hasCard(card);
      }
      const partnership = dependencies.partnershipCards ?? [];
      return partnership.some(c => c.deckValue === card.deckValue);
    };

    const isOutstanding = (card: Card): boolean => {
      if (dependencies.isCardOutstanding) {
        return dependencies.isCardOutstanding(card);
      }
      if (dependencies.cardLocation) {
        return dependencies.cardLocation.at(card.deckValue).isOutstanding;
      }
      const outstanding = dependencies.outstandingCards ?? [];
      return outstanding.some(c => c.deckValue === card.deckValue);
    };

    const isAlreadyPlayed = (card: Card): boolean => {
      if (dependencies.alreadyPlayedCards) {
        return dependencies.alreadyPlayedCards.some(c => c.deckValue === card.deckValue);
      }
      return !isOutstanding(card);
    };

    const formatCards = (cards: readonly Card[]): string =>
      cards.length > 0 ? cards.map(c => c.name).join(' ') : '---';

    // 1: check if we still have the required consumable card
    if (this.consumedCard && !hasPartnershipCard(this.consumedCard)) {
      status?.stream(
        `5PLYTEST1! The play <${this.name}> is no longer viable as the ${this.consumedCard.name} has already been played.\n`,
      );
      this.status = PlayResult.NotViable;
      return false;
    }

    // 2: check if the target card is still outstanding
    if (this.targetCard && !isOutstanding(this.targetCard)) {
      status?.stream(
        `5PLYTEST2! The play <${this.name}> is no longer viable as the target card [${this.targetCard.name}] has already been played.\n`,
      );
      this.status = PlayResult.NotViable;
      return false;
    }

    // 3: check if we still have the required key cards
    if (this.keyCards.length > 0 && !this.keyCards.every(hasPartnershipCard)) {
      status?.stream(
        `5PLYTEST3! The play <${this.name}> is no longer viable as the partnership no longer holds all the required cards of [${formatCards(this.keyCards)}].\n`,
      );
      this.status = PlayResult.NotViable;
      return false;
    }

    // 4: check if we have at least one OR-Key cards
    if (
      this.alternativeKeyCards.length > 0 &&
      !this.alternativeKeyCards.some(hasPartnershipCard)
    ) {
      status?.stream(
        `5PLYTEST4! The play <${this.name}> is no longer viable as the partnership no longer holds any of the alternative required cards of [${formatCards(this.alternativeKeyCards)}].\n`,
      );
      this.status = PlayResult.NotViable;
      return false;
    }

    // 5: check the second OR-Key cards list
    if (
      this.alternativeKeyCards2.length > 0 &&
      !this.alternativeKeyCards2.some(hasPartnershipCard)
    ) {
      status?.stream(
        `5PLYTST5! The play <${this.name}> is no longer viable as the partnership no longer holds any of the second set of alternative required cards of [${formatCards(this.alternativeKeyCards2)}].\n`,
      );
      this.status = PlayResult.NotViable;
      return false;
    }

    // 6: check the enemy key cards list
    if (this.enemyKeyCards.length > 0) {
      for (const card of this.enemyKeyCards) {
        if (!isOutstanding(card)) {
          status?.stream(
            `5PLYTST6! The play <${this.name}> is no longer viable as the opponents no longer hold the ${card.name}, which is one of the cards required for the play.\n`,
          );
          this.status = PlayResult.NotViable;
          return false;
        }
      }
    }

    // 7: check the enemy OR-Key cards list
    if (this.enemyAlternativeKeyCards.length > 0) {
      const found = this.enemyAlternativeKeyCards.some(isOutstanding);
      if (!found) {
        status?.stream(
          `5PLYTST7! The play <${this.name}> is no longer viable as the opponents no longer hold any of the required alternative cards of [${formatCards(this.enemyAlternativeKeyCards)}].\n`,
        );
        this.status = PlayResult.NotViable;
        return false;
      }
    }

    // 8: see if there are any cards that need to have been played already
    if (this.requiredPlayedCards.length > 0) {
      for (const card of this.requiredPlayedCards) {
        if (!isAlreadyPlayed(card)) {
          status?.stream(
            `5PLYTST8! The play <${this.name}> is not yet viable as the card [${card.faceName}] is still outstanding.\n`,
          );
          this.status = PlayResult.NotViable;
          return false;
        }
      }
    }

    // 9: see if there are plays that need to have been used already
    if (this.prerequisiteList.length > 0) {
      const usedPlays = dependencies.usedPlays ?? [];
      for (const reqPlay of this.prerequisiteList) {
        if (!usedPlays.includes(reqPlay)) {
          status?.stream(
            `5PLYTST9! The play <${this.name}> is not yet viable as the precursor play [${reqPlay.name}] has not neen used yet.\n`,
          );
          this.status = PlayResult.NotViable;
          return false;
        }
      }
    }

    // else all's OK
    return true;
  }

  //
  // Perform()
  //
  // called to do the deed
  //
  perform(dependencies?: PlayDependencies): PlayResult {
    // this "play" is empty
    dependencies?.status?.stream('3PLYXX! Play base class default play routine called.\n');
    this.status = PlayResult.Error;
    return this.status;
  }
}
