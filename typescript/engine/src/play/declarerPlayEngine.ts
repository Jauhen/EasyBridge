//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//=====================================================================
//
// CDeclarerPlayEngine (DeclarerPlayEngine.H / DeclarerPlayEngine.cpp)
//
// - encapsulates the declarer play engine and its status variables
//
//=====================================================================

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import {
  ACE,
  bidLevel,
  bidSuit,
  contractToFullString,
  isBid,
  isPosition,
  isSuit,
  KING,
  nextPosition,
  NONE,
  Position,
  positionToString,
  prevPosition,
  Suit,
} from '../constants.js';
import { Hand } from '../hand.js';
import { Cash } from './cash.js';
import { CombinedHoldings } from './combinedHoldings.js';
import { CombinedSuitHoldings } from './combinedSuitHoldings.js';
import { AGAINST_EITHER, Drop } from './drop.js';
import { ExitPlay } from './exitPlay.js';
import { Finesse, FinesseSubType } from './finesse.js';
import { Type1Finesse, Type2Finesse, Type3Finesse, TypeAFinesse } from './finesseVariants.js';
import { Force } from './force.js';
import { HoldUp } from './holdUp.js';
import {
  ENTRY_DUMMY,
  ENTRY_HAND,
  ENTRY_NONE,
  IN_DUMMY,
  IN_EITHER,
  IN_HAND,
  Play,
  PlayDependencies,
  PlayProspect,
  PlayResult,
  PlayType,
} from './play.js';
import { PlayEngine, PlayEngineContext, PlayRoundContext } from './playEngine.js';
import { PlayList } from './playList.js';
import { Ruff } from './ruff.js';
import { SuitHoldings } from './suitHoldings.js';
import { TrumpPull } from './trumpPull.js';

function getNextSuit(suit: Suit): Suit {
  return ((suit + 1) % 4) as Suit;
}

function getPrevSuit(suit: Suit): Suit {
  return ((suit + 3) % 4) as Suit;
}

interface RuffInfo {
  numRuffs: number;
  numDiscardsRequired: number;
  suit: Suit;
  discardSuit: Suit;
  direction: number;
}

interface DevOpportunity {
  suit: Suit;
  numForces: number;
  numWinners: number;
  numResiduals: number;
  longHand: number;
}

export class DeclarerPlayEngine extends PlayEngine {
  combinedHand: CombinedHoldings | null = new CombinedHoldings();
  initialCombinedHand: CombinedHoldings = new CombinedHoldings();
  dummyHand: Hand | null = null;
  currentPlay: Play | null = null;
  failedPlayName = '';
  claimDisabled = false;
  crossedOnLastPlay = false;

  readonly playPlan = new PlayList();
  readonly usedPlays = new PlayList();
  readonly discardedPlays = new PlayList();
  readonly dummyPriorityDiscards = new CardList();
  readonly declarerPriorityDiscards = new CardList();
  readonly declarerDiscardedPriorityDiscards = new CardList();
  readonly dummyDiscardedPriorityDiscards = new CardList();
  readonly declarerEntries = new CardList();
  readonly dummyEntries = new CardList();
  readonly declarerRuffingEntries = new CardList();
  readonly dummyRuffingEntries = new CardList();

  // data initialized once per hand
  numRequiredTricks = 0;
  numTricksLeftToBeMade = 0;
  numSureTricks = 0;
  numTricksShort = 0;
  numTricksMade = 0;
  numDeclarerTrumps = 0;
  numDummyTrumps = 0;
  numTotalTrumps = 0;

  // data initialized every round
  numOutstandingTrumps = 0;
  numDeclarerEntries = 0;
  numDummyEntries = 0;
  numDeclarerRuffingEntries = 0;
  numDummyRuffingEntries = 0;
  numDeclarerEntriesInSuit: number[] = [0, 0, 0, 0];
  numDummyEntriesInSuit: number[] = [0, 0, 0, 0];

  // play planning
  numPlannedHoldUps = 0;
  numPlannedCashingTricks = 0;
  numPlannedDummyRuffingTricks = 0;
  numPlannedDeclarerRuffingTricks = 0;
  numPlannedDummyRuffsInSuit: number[] = [0, 0, 0, 0];
  numPlannedDeclarerRuffsInSuit: number[] = [0, 0, 0, 0];
  numPlannedTotalRuffsInSuit: number[] = [0, 0, 0, 0];
  numPlannedRuffingTricks = 0;
  numPlannedDropPlays = 0;
  numPlannedDropPlaysInSuit: number[] = [0, 0, 0, 0];
  numPlannedFinesses = 0;
  numPlannedFinessesInSuit: number[] = [0, 0, 0, 0];
  numPlannedForcePlays = 0;
  numPlannedForcePlaysInSuit: number[] = [0, 0, 0, 0];
  numPlannedSecondaryCashPlays = 0;
  numPlannedSecondaryCashPlaysInSuit: number[] = [0, 0, 0, 0];
  numPlannedSluffTricks = 0;
  numPlannedTrumpPulls = 0;
  numTotalPlannedTricks = 0;
  numPlannedRounds = 0;

  constructor() {
    super();
    this.declarerPriorityDiscards.reverseSortOrder();
    this.dummyPriorityDiscards.reverseSortOrder();
  }

  //
  // Initialize()
  //
  override initialize(context: PlayEngineContext): void {
    super.initialize(context);
    this.partnersHand = context.partner.hand;
    this.dummyHand = context.partner.hand;
    this.combinedHand = new CombinedHoldings();
    this.combinedHand.initialize(context.hand, context.partner.hand, context.status);
    this.initialCombinedHand.initialize(context.hand, context.partner.hand, context.status);
    this.currentPlay = null;
  }

  // Backward-compatible helper used by unit tests
  initializeCombinedHand(dummyHand: Hand): void {
    this.dummyHand = dummyHand;
    this.partnersHand = dummyHand;
    this.combinedHand = new CombinedHoldings();
    if (this.hand) {
      this.combinedHand.initialize(this.hand, dummyHand, this.status);
      this.combinedHand.evaluateHoldings(this.trumpSuit);
    }
  }

  //
  // Clear()
  //
  override clear(): void {
    super.clear();

    this.numSureTricks = 0;
    this.numTricksShort = 0;
    this.numTricksMade = 0;
    this.numDeclarerTrumps = 0;
    this.numDummyTrumps = 0;
    this.numTotalTrumps = 0;
    this.numOutstandingTrumps = 0;
    this.numDeclarerEntries = 0;
    this.numDummyEntries = 0;
    this.numDeclarerRuffingEntries = 0;
    this.numDummyRuffingEntries = 0;
    for (let i = 0; i < 4; i++) {
      this.numDeclarerEntriesInSuit[i] = 0;
      this.numDummyEntriesInSuit[i] = 0;
      this.suitPriorityList[i] = NONE;
      this.numPlannedDummyRuffsInSuit[i] = 0;
      this.numPlannedDeclarerRuffsInSuit[i] = 0;
      this.numPlannedTotalRuffsInSuit[i] = 0;
      this.numPlannedDropPlaysInSuit[i] = 0;
      this.numPlannedFinessesInSuit[i] = 0;
      this.numPlannedForcePlaysInSuit[i] = 0;
      this.numPlannedSecondaryCashPlaysInSuit[i] = 0;
    }

    this.numRequiredTricks = 0;
    this.numTricksLeftToBeMade = 0;
    this.numPlannedHoldUps = 0;
    this.numPlannedCashingTricks = 0;
    this.numPlannedRuffingTricks = 0;
    this.numPlannedDummyRuffingTricks = 0;
    this.numPlannedDeclarerRuffingTricks = 0;
    this.numPlannedDropPlays = 0;
    this.numPlannedFinesses = 0;
    this.numPlannedForcePlays = 0;
    this.numPlannedSecondaryCashPlays = 0;
    this.numPlannedSluffTricks = 0;
    this.numPlannedTrumpPulls = 0;
    this.numTotalPlannedTricks = 0;
    this.numPlannedRounds = 0;

    this.combinedHand?.clearHand();
    this.initialCombinedHand.clearHand();
    this.playPlan.clear();
    this.usedPlays.clear();
    this.discardedPlays.clear();
    this.declarerPriorityDiscards.clear();
    this.dummyPriorityDiscards.clear();
    this.declarerDiscardedPriorityDiscards.clear();
    this.dummyDiscardedPriorityDiscards.clear();
    this.declarerEntries.clear();
    this.dummyEntries.clear();
    this.declarerRuffingEntries.clear();
    this.dummyRuffingEntries.clear();
    this.currentPlay = null;
    this.failedPlayName = '';
    this.claimDisabled = false;
    this.crossedOnLastPlay = false;
    this.inHintMode = false;
  }

  //
  // AddCardToCombinedHand()
  //
  addCardToCombinedHand(card: Card, playerCard: boolean, sort = true): void {
    this.combinedHand?.addFromSource(card, playerCard, sort);
    this.combinedHand?.reevaluateHoldings(null);
  }

  //
  // RemoveCardFromCombinedHand()
  //
  removeCardFromCombinedHand(card: Card, fromDeclarer?: boolean): void {
    if (!this.combinedHand) return;
    if (typeof fromDeclarer === 'boolean') {
      this.combinedHand.removeFromSource(card, fromDeclarer);
      this.combinedHand.reevaluateHoldings(null);
      return;
    }
    const pos = card.owner;
    if (pos === this.position) {
      this.combinedHand.removeFromSource(card, true);
      this.combinedHand.reevaluateHoldings(null);
    } else if (pos === this.partnerPosition) {
      this.combinedHand.removeFromSource(card, false);
      this.combinedHand.reevaluateHoldings(null);
    }
  }

  //
  // InitNewHand()
  //
  override initNewHand(
    contract = this.contract,
    contractModifier = this.contractModifier,
    trumpSuit: Suit | typeof NONE = this.trumpSuit,
  ): void {
    super.initNewHand(contract, contractModifier, trumpSuit);
    this.numRequiredTricks = 6 + bidLevel(this.contract);
    this.numTricksLeftToBeMade = this.numRequiredTricks;
  }

  //
  // InitSwappedHand()
  //
  override initSwappedHand(
    contract = this.contract,
    contractModifier = this.contractModifier,
    trumpSuit: Suit | typeof NONE = this.trumpSuit,
  ): void {
    this.initNewHand(contract, contractModifier, trumpSuit);
  }

  //
  // InitCombinedHand()
  //
  // called when dummy first lays down his hand
  //
  initCombinedHand(): void {
    if (!this.combinedHand) {
      this.combinedHand = new CombinedHoldings();
    }
    if (this.hand && this.partnersHand) {
      this.combinedHand.initialize(this.hand, this.partnersHand, this.status);
    } else {
      this.combinedHand.initNewHand();
    }
    this.combinedHand.evaluateHoldings(this.trumpSuit);

    this.declarerPriorityDiscards.clear();
    this.declarerDiscardedPriorityDiscards.clear();
    this.dummyDiscardedPriorityDiscards.clear();
    this.dummyPriorityDiscards.clear();
    this.declarerEntries.clear();
    this.dummyEntries.clear();
    this.declarerRuffingEntries.clear();
    this.dummyRuffingEntries.clear();

    if (isSuit(this.trumpSuit) && this.hand && this.partnersHand) {
      this.numDeclarerTrumps = this.hand.getNumCardsInSuit(this.trumpSuit);
      this.numDummyTrumps = this.partnersHand.getNumCardsInSuit(this.trumpSuit);
      this.numTotalTrumps = this.numDeclarerTrumps + this.numDummyTrumps;
      this.numOutstandingTrumps = 13 - this.numTotalTrumps;
    } else {
      this.numDeclarerTrumps = 0;
      this.numDummyTrumps = 0;
      this.numTotalTrumps = 0;
      this.numOutstandingTrumps = 0;
    }
  }

  //
  // GetNumClaimableTricks()
  //
  override getNumClaimableTricks(context: PlayRoundContext = {}): number {
    if (!this.combinedHand) return 0;

    let numWinners = 0;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    if (isSuit(trumpSuit)) {
      const trumpHoldings = this.combinedHand.getSuit(trumpSuit);
      numWinners = Math.min(trumpHoldings.numTopCards, trumpHoldings.maxLength);
      const numOutstandingTrumps = this.getNumOutstandingCards(trumpSuit);
      if (numWinners >= trumpHoldings.maxLength && numWinners >= numOutstandingTrumps) {
        for (let i = 0; i < 4; i++) {
          if (i !== trumpSuit) {
            numWinners += this.combinedHand.getSuit(i as Suit).numMaxWinners;
          }
        }
      }
    } else {
      numWinners = this.combinedHand.numMaxWinners;
    }

    return numWinners;
  }

  //
  // RecordCardPlay()
  //
  override recordCardPlay(pos: Position, card: Card, context: PlayRoundContext = {}): void {
    super.recordCardPlay(pos, card, context);

    if (pos === this.position || pos === this.partnerPosition) {
      this.combinedHand?.remove(card);
    }

    this.combinedHand?.reevaluateHoldings(card);
    this.evaluateEntries();
  }

  //
  // RecordCardUndo()
  //
  override recordCardUndo(pos: Position, card: Card): void {
    super.recordCardUndo(pos, card);

    if (pos === this.position) {
      this.addCardToCombinedHand(card, true, true);
    } else if (pos === this.partnerPosition) {
      this.addCardToCombinedHand(card, false, true);
    }

    if (this.declarerDiscardedPriorityDiscards.hasCard(card)) {
      this.declarerDiscardedPriorityDiscards.remove(card);
      this.declarerPriorityDiscards.add(card);
    } else if (this.dummyDiscardedPriorityDiscards.hasCard(card)) {
      this.dummyDiscardedPriorityDiscards.remove(card);
      this.dummyPriorityDiscards.add(card);
    }
  }

  //
  // RecordTrickUndo()
  //
  override recordTrickUndo(): void {
    super.recordTrickUndo();

    if (this.currentPlay && this.currentPlay.status === PlayResult.InProgress) {
      this.currentPlay.reset();
    } else if (this.usedPlays.size > 0) {
      const prev = this.usedPlays.popTail();
      if (prev) {
        prev.reset();
        this.playPlan.push(prev);
      }
    }

    this.crossedOnLastPlay = false;
  }

  //
  // RecordRoundComplete()
  //
  override recordRoundComplete(pos: Position, card: Card): void {
    super.recordRoundComplete(pos, card);

    if (this.currentPlay) {
      const index = this.playPlan.find(this.currentPlay);
      if (index >= 0) {
        this.playPlan.remove(index);
      }
      this.usedPlays.append(this.currentPlay);
      this.currentPlay = null;
    }
  }

  //
  // AdjustCardCountFromPlay()
  //
  override adjustCardCountFromPlay(pos: Position, card: Card, context: PlayRoundContext = {}): void {
    if (pos !== this.position && pos !== this.partnerPosition) {
      super.adjustCardCountFromPlay(pos, card, context);
    }
  }

  //
  // AdjustCardCountFromUndo()
  //
  override adjustCardCountFromUndo(pos: Position, card: Card): void {
    if (pos !== this.position && pos !== this.partnerPosition) {
      super.adjustCardCountFromUndo(pos, card);
    }
  }

  //
  // GetOutstandingCards()
  //
  override getOutstandingCards(suit: Suit): Card[] {
    if (this.guessedHands.length > 0) {
      return [...super.getOutstandingCards(suit)];
    }
    if (!this.combinedHand) return [];
    return this.combinedHand.getSuit(suit).cardsInAscendingDeckOrder as Card[];
  }

  override getHighestOutstandingCard(suit: Suit): Card | null {
    return this.getOutstandingCards(suit)[0] ?? null;
  }

  //
  // EvaluateEntries()
  //
  // counts the # of entries into each hand
  //
  evaluateEntries(): void {
    this.declarerEntries.clear();
    this.dummyEntries.clear();
    this.declarerRuffingEntries.clear();
    this.dummyRuffingEntries.clear();
    this.numDeclarerEntries = 0;
    this.numDummyEntries = 0;
    this.numDeclarerRuffingEntries = 0;
    this.numDummyRuffingEntries = 0;
    for (let i = 0; i < 4; i++) {
      this.numDeclarerEntriesInSuit[i] = 0;
      this.numDummyEntriesInSuit[i] = 0;
    }

    if (!this.combinedHand) return;

    // first count # of entries into declarer
    if (isSuit(this.trumpSuit) && this.hand) {
      const trumpHoldings = this.combinedHand.getSuit(this.trumpSuit);
      const numDeclarerTrumps = trumpHoldings.declarerLength;

      let numSluffs = 0;
      let s = getNextSuit(this.trumpSuit);
      for (let i = 0; i < 3; i++) {
        const suit = this.combinedHand.getSuit(s);
        if (suit.dummyLength > suit.declarerLength) {
          numSluffs += suit.dummyLength - suit.declarerLength;
        }
        s = getNextSuit(s);
      }
      const numRuffs = Math.min(numDeclarerTrumps, numSluffs);
      this.numDeclarerEntries += numRuffs;
      this.numDeclarerEntriesInSuit[this.trumpSuit] = numRuffs;
      this.numDeclarerRuffingEntries = this.numDeclarerEntries;

      const trumps = this.hand.getSuit(this.trumpSuit);
      for (let j = 0, n = trumps.length - 1; j < numRuffs && n >= 0; j++, n--) {
        const c = trumps.at(n);
        if (c) this.declarerRuffingEntries.add(c);
      }
    }

    // check cashing entries in each suit for declarer
    for (let i = 0; i < 4; i++) {
      const combinedSuit = this.combinedHand.getSuit(i as Suit);
      if (combinedSuit.dummyLength === 0) continue;

      const declarer = combinedSuit.declarerCards;
      const dummy = combinedSuit.dummyCards;
      const numDeclarerWinners = combinedSuit.numDeclarerWinners;
      const numDummyCards = dummy.length;
      let numEntries = 0;

      for (let j = numDeclarerWinners - 1, k = numDummyCards - 1; j >= 0 && k >= 0; j--, k--) {
        const dCard = declarer.at(j);
        const mCard = dummy.at(k);
        if (dCard && mCard && dCard.faceValue > mCard.faceValue) {
          numEntries++;
          this.declarerEntries.add(dCard);
        }
      }

      this.numDeclarerEntries += numEntries;
      this.numDeclarerEntriesInSuit[i] += numEntries;
    }

    // now do the same for dummy
    if (isSuit(this.trumpSuit) && this.partnersHand) {
      const trumpHoldings = this.combinedHand.getSuit(this.trumpSuit);
      const numDummyTrumps = trumpHoldings.dummyLength;

      let numSluffs = 0;
      let s = getNextSuit(this.trumpSuit);
      for (let i = 0; i < 3; i++) {
        const suit = this.combinedHand.getSuit(s);
        if (suit.declarerLength > suit.dummyLength) {
          numSluffs += suit.declarerLength - suit.dummyLength;
        }
        s = getNextSuit(s);
      }
      const numRuffs = Math.min(numDummyTrumps, numSluffs);
      this.numDummyEntries += numRuffs;
      this.numDummyEntriesInSuit[this.trumpSuit] = numRuffs;
      this.numDummyRuffingEntries = this.numDummyEntries;

      const trumps = this.partnersHand.getSuit(this.trumpSuit);
      for (let j = 0, n = trumps.length - 1; j < numRuffs && n >= 0; j++, n--) {
        const c = trumps.at(n);
        if (c) this.dummyRuffingEntries.add(c);
      }
    }

    // check cashing entries in each suit for dummy
    for (let i = 0; i < 4; i++) {
      const combinedSuit = this.combinedHand.getSuit(i as Suit);
      if (combinedSuit.dummyLength === 0) continue;

      const declarer = combinedSuit.declarerCards;
      const dummy = combinedSuit.dummyCards;
      const numDummyWinners = combinedSuit.numDummyWinners;
      const numDeclarerCards = declarer.length;
      let numEntries = 0;

      for (let j = numDummyWinners - 1, k = numDeclarerCards - 1; j >= 0 && k >= 0; j--, k--) {
        const mCard = dummy.at(j);
        const dCard = declarer.at(k);
        if (mCard && dCard && mCard.faceValue > dCard.faceValue) {
          numEntries++;
          this.dummyEntries.add(mCard);
        }
      }

      this.numDummyEntries += numEntries;
      this.numDummyEntriesInSuit[i] += numEntries;
    }
  }

  getNumDeclarerEntriesInSuit(suit: Suit): number {
    return this.numDeclarerEntriesInSuit[suit] ?? 0;
  }

  getNumDummyEntriesInSuit(suit: Suit): number {
    return this.numDummyEntriesInSuit[suit] ?? 0;
  }

  getCurrentPlay(): Play | null {
    return this.currentPlay;
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // Main operations
  //
  ////////////////////////////////////////////////////////////////////////////

  override getLeadCard(context: PlayRoundContext = {}): Card | null {
    return super.getLeadCard(context);
  }

  private buildPlayDependencies(context: PlayRoundContext = {}, isDummyTurn = false): PlayDependencies {
    return {
      cardLocation: this.cardLocation ?? undefined,
      guessedHands: this.guessedHands,
      status: this.status ?? undefined,
      combinedHand: this.combinedHand ?? undefined,
      declarerHand: this.hand ?? undefined,
      dummyHand: this.partnersHand ?? this.dummyHand ?? undefined,
      usedPlays: this.usedPlays.all,
      numCardsPlayedInRound: context.numCardsPlayedInRound ?? this.numCardsPlayed,
      leadCard: context.leadCard ?? this.leadCard,
      currentBestCard: context.currentHighCard ?? context.leadCard ?? this.leadCard,
      trumpSuit: context.trumpSuit ?? this.trumpSuit,
      isDummyTurn,
      playerPosition: this.position,
      dummyPosition: this.partnerPosition,
      partnerPosition: this.partnerPosition,
      isCardOutstanding: card => this.isCardOutstanding(card),
      getDiscard: () => this.getDiscard({ ...context, isDummyTurn }),
    };
  }

  //
  // PlayCard()
  //
  // Supports both PlayRoundContext (C++ parity) and legacy ledSuit argument.
  //
  override playCard(contextOrSuit: PlayRoundContext | Suit | typeof NONE = {}): Card | null {
    if (typeof contextOrSuit === 'number') {
      const card = this.chooseCard(contextOrSuit);
      if (!card) return null;
      if (this.hand?.hasCard(card)) this.hand.remove(card);
      else this.dummyHand?.remove(card);
      return card;
    }

    const context = contextOrSuit;
    this.assessPosition(context);

    const playRound = context.playRound ?? this.round;
    const cardsInRound = context.numCardsPlayedInRound ?? this.numCardsPlayed;
    if (playRound > 0 && cardsInRound < 2) {
      this.reviewPlayPlan(context);
    }

    let card = this.trySelectedPlays(context, false);
    if (card === null) {
      card = super.playCard(context);
    }
    return card;
  }

  //
  // PlayForDummy()
  //
  playForDummy(context: PlayRoundContext = {}): Card | null {
    this.assessPosition(context);
    this.status?.stream('2PLDM! Playing card from dummy.\n');

    const playRound = context.playRound ?? this.round;
    const cardsInRound = context.numCardsPlayedInRound ?? this.numCardsPlayed;
    if (playRound === 0) {
      this.initCombinedHand();
      this.planPlay(context);
    } else if (cardsInRound < 2) {
      this.reviewPlayPlan(context);
    }

    let card = this.trySelectedPlays(context, true);
    if (card === null) {
      card = super.playCard({ ...context, isDummyTurn: true });
    }
    return card;
  }

  //
  // ScreenIneligiblePlays()
  //
  // go through the play list & remove those that are now invalid
  //
  screenIneligiblePlays(): number {
    this.status?.stream('3PLYSCN! Reviewing available plays...\n');
    if (!this.combinedHand) return 0;

    let numPlaysDeleted = 0;
    const numPlays = this.playPlan.size;
    for (let i = 0; i < numPlays; i++) {
      const play = this.playPlan.pop();
      if (!play) continue;

      if (play.status === PlayResult.InProgress) {
        this.playPlan.append(play);
        continue;
      }

      const consumedCard = play.consumedCard;
      if (consumedCard && !this.combinedHand.hasCard(consumedCard)) {
        this.status?.stream(
          `5PLYSCN1! The play <${play.name}> is no longer viable as the ${consumedCard.name} has already been played.\n`,
        );
        this.adjustPlayCountForDeletedPlay(play);
        numPlaysDeleted++;
        continue;
      }

      const targetCard = play.targetCard;
      if (targetCard && !this.isCardOutstanding(targetCard)) {
        this.status?.stream(
          `5PLYSCN2! The play <${play.name}> is no longer viable as the target card [${targetCard.name}] has already been played.\n`,
        );
        this.adjustPlayCountForDeletedPlay(play);
        numPlaysDeleted++;
        continue;
      }

      const keyCards = play.keyCards;
      if (keyCards.length > 0 && !this.combinedHand.containsCards(new CardList(keyCards))) {
        this.status?.stream(
          `5PLYSCN4! The play <${play.name}> is no longer viable as the partnership no longer holds all the required cards of [${new CardList(keyCards).holdingsString}].\n`,
        );
        this.adjustPlayCountForDeletedPlay(play);
        numPlaysDeleted++;
        continue;
      }

      const orKeyCards = play.alternativeKeyCards;
      if (orKeyCards.length > 0 && !this.combinedHand.containsAtLeastOneOf(new CardList(orKeyCards))) {
        this.status?.stream(
          `5PLYSCN6! The play <${play.name}> is no longer viable as the partnership no longer holds any of the alternative required cards of [${new CardList(orKeyCards).holdingsString}].\n`,
        );
        this.adjustPlayCountForDeletedPlay(play);
        numPlaysDeleted++;
        continue;
      }

      const orKeyCards2 = play.alternativeKeyCards2;
      if (orKeyCards2.length > 0 && !this.combinedHand.containsAtLeastOneOf(new CardList(orKeyCards2))) {
        this.status?.stream(
          `5PLYSCN7! The play <${play.name}> is no longer viable as the partnership no longer holds any of the second set of alternative required cards of [${new CardList(orKeyCards2).holdingsString}].\n`,
        );
        this.adjustPlayCountForDeletedPlay(play);
        numPlaysDeleted++;
        continue;
      }

      const enemyKeyCards = play.enemyKeyCards;
      let broken = false;
      for (const ec of enemyKeyCards) {
        if (!this.isCardOutstanding(ec)) {
          this.status?.stream(
            `5PLYSCN8! The play <${play.name}> is no longer viable as the opponents no longer hold the ${ec.name}, which is one of the cards required for the play.\n`,
          );
          this.adjustPlayCountForDeletedPlay(play);
          numPlaysDeleted++;
          broken = true;
          break;
        }
      }
      if (broken) continue;

      const enemyOrKeyCards = play.enemyAlternativeKeyCards;
      if (enemyOrKeyCards.length > 0) {
        const cardFound = enemyOrKeyCards.some(ec => this.isCardOutstanding(ec));
        if (!cardFound) {
          this.status?.stream(
            `5PLYSCN9! The play <${play.name}> is no longer viable as the opponents no longer hold any of the required alternative cards of [${new CardList(enemyOrKeyCards).holdingsString}].\n`,
          );
          this.adjustPlayCountForDeletedPlay(play);
          numPlaysDeleted++;
          continue;
        }
      }

      this.playPlan.append(play);
    }

    if (numPlaysDeleted > 0) {
      this.status?.stream(
        `4PLYSCNX! ${numPlaysDeleted} play(s) have been deleted as they are no longer viable.\n`,
      );
    }

    return this.playPlan.size;
  }

  //
  // AdjustPlayCountForDeletedPlay()
  //
  adjustPlayCountForDeletedPlay(play: Play): void {
    if (play.isWinner) this.numTotalPlannedTricks--;
    switch (play.type) {
      case PlayType.TrumpPull:
        this.numPlannedTrumpPulls--;
        break;
      case PlayType.Cash:
        this.numPlannedCashingTricks--;
        break;
      case PlayType.Ruff:
        this.numPlannedRuffingTricks--;
        break;
      case PlayType.Drop:
        this.numPlannedDropPlays--;
        break;
      case PlayType.Force:
        this.numPlannedForcePlays--;
        break;
      case PlayType.Finesse:
        this.numPlannedFinesses--;
        break;
      default:
        break;
    }
  }

  //
  // IsPlayUsable()
  //
  isPlayUsable(play: Play, context: PlayRoundContext = {}, isDummyTurn = false): boolean {
    const deps = this.buildPlayDependencies(context, isDummyTurn);
    const prevTrace = this.status?.isTraceEnabled ?? true;
    this.status?.enableTrace(false);
    const code = play.perform(deps);
    this.status?.enableTrace(prevTrace);
    play.reset();
    return code === PlayResult.InProgress || code === PlayResult.Complete;
  }

  //
  // TrySelectedPlays()
  //
  trySelectedPlays(context: PlayRoundContext = {}, isDummyTurn = false): Card | null {
    if (!this.playPlan.active || this.playPlan.isEmpty) return null;
    if (!this.combinedHand) return null;

    let playIndex = 0;
    let wrap = false;
    this.failedPlayName = '';

    if (this.currentPlay) {
      const idx = this.playPlan.find(this.currentPlay);
      if (idx >= 0) {
        playIndex = idx;
        wrap = true;
      }
    }

    let card: Card | null = null;
    let numAvailablePlays = this.playPlan.size;
    for (let i = 0, numPlaysExamined = 0; numPlaysExamined < numAvailablePlays && playIndex < this.playPlan.size; i++, numPlaysExamined++, playIndex++) {
      const play = this.playPlan.at(playIndex);
      if (!play) continue;
      this.currentPlay = play;

      let usingUpLastEntry = false;
      let entryCode = ENTRY_NONE;
      const numDeclarerWinners = this.combinedHand.numDeclarerWinners;
      const numDummyWinners = this.combinedHand.numDummyWinners;

      const s = play.suit;
      if (
        isSuit(s) &&
        this.numDeclarerEntries === 1 &&
        this.numDummyEntries > 1 &&
        numDeclarerWinners > 1 &&
        play.endingHand === IN_DUMMY &&
        this.numDeclarerEntriesInSuit[s] === 1
      ) {
        usingUpLastEntry = true;
        entryCode = ENTRY_HAND;
      } else if (
        isSuit(s) &&
        this.numDummyEntries === 1 &&
        this.numDeclarerEntries > 1 &&
        numDummyWinners > 1 &&
        play.endingHand === IN_HAND &&
        this.numDummyEntriesInSuit[s] === 1
      ) {
        usingUpLastEntry = true;
        entryCode = ENTRY_DUMMY;
      }

      if (usingUpLastEntry && i < numAvailablePlays - 1) {
        this.playPlan.moveToEnd(play);
        numPlaysExamined--;
        playIndex--;
        continue;
      }

      const deps = this.buildPlayDependencies(context, isDummyTurn);
      const code = play.perform(deps);
      card = deps.selectedCard ?? null;

      if (code === PlayResult.Postpone) {
        card = null;
      } else if (code === PlayResult.NotViable) {
        this.failedPlayName = `${play.name} (abandoned)`;
        this.playPlan.remove(playIndex);
        this.discardedPlays.append(play);
        playIndex--;
        numAvailablePlays--;
        card = null;
      } else if (code === PlayResult.Failed) {
        this.failedPlayName = `${play.name} (failed)`;
        this.playPlan.remove(playIndex);
        this.discardedPlays.append(play);
        playIndex--;
        numAvailablePlays--;
        card = null;
      } else if (code === PlayResult.InProgress) {
        this.failedPlayName = '';
        break;
      } else if (code === PlayResult.Complete) {
        break;
      } else if (code === PlayResult.Inactive) {
        card = null;
      } else if (code <= 0) {
        this.failedPlayName = `${play.name} (unusable)`;
        this.playPlan.remove(playIndex);
        this.discardedPlays.append(play);
        playIndex--;
        numAvailablePlays--;
        card = null;
      }

      if (playIndex === this.playPlan.size - 1 && wrap) {
        playIndex = -1;
        wrap = false;
      }
    }

    if (card) return card;

    this.status?.stream('3PLYTRY! No usable plays found for the current situation.\n');
    this.currentPlay = null;
    return null;
  }

  //
  // PlayFirst()
  //
  override playFirst(context: PlayRoundContext = {}): Card | null {
    return super.playFirst(context);
  }

  //
  // PlaySecond()
  //
  // - default declarer/dummy code for playing in second position
  //
  override playSecond(context: PlayRoundContext = {}): Card | null {
    if (!this.combinedHand || !this.hand) return super.playSecond(context);

    const playingInHand = !(context.isDummyTurn ?? false);
    this.status?.stream(
      `3PLAYDC2! Playing second in ${playingInHand ? 'hand' : 'dummy'}, using default player logic.\n`,
    );

    const cardLed = context.leadCard ?? this.leadCard;
    if (!cardLed) return super.playSecond(context);

    const suitLed = cardLed.suit;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    let card: Card | null = null;

    const playerHand = this.hand;
    const dummyHand = this.partnersHand ?? this.dummyHand ?? this.hand;
    const combinedSuit = this.combinedHand.getSuit(suitLed);
    const playerSuit = playerHand.getSuit(suitLed);
    const dummySuit = dummyHand.getSuit(suitLed);

    const hand = playingInHand ? playerHand : dummyHand;
    const suit = playingInHand ? playerSuit : dummySuit;

    const numCardsInSuit = suit.length;
    if (numCardsInSuit === 1) {
      card = suit.at(0) ?? null;
      if (card) {
        this.status?.stream(`PLDC2A0! Play our only card in the suit, the ${card.faceName}.\n`);
      }
    } else if (numCardsInSuit >= 2) {
      const winnersList = new CardList();
      let haveHighCard = false;

      if (playingInHand) {
        if (combinedSuit.numDeclarerWinners > 0) {
          haveHighCard = true;
          winnersList.addList(combinedSuit.declarerWinners);
        }
      } else {
        if (combinedSuit.numDummyWinners > 0) {
          haveHighCard = true;
          winnersList.addList(combinedSuit.dummyWinners);
        }
      }

      if (haveHighCard && (winnersList.at(0)?.faceValue ?? 0) < cardLed.faceValue) {
        haveHighCard = false;
      }

      if (haveHighCard) {
        card = winnersList.bottomCard;
        if (card) {
          this.status?.stream(
            `PLDC2A1! We have a winner in the suit in ${playingInHand ? 'hand' : 'dummy'}, so play the ${card.faceName}.\n`,
          );
        }
      } else {
        card = this.getDiscard(context);
        if (card) {
          this.status?.stream(
            `PLDC2A2! We don't have a winner in the suit in ${playingInHand ? 'hand' : 'dummy'}, so discard the ${card.faceName}.\n`,
          );
        }
      }
    } else {
      if (isSuit(trumpSuit) && hand.getNumCardsInSuit(trumpSuit) > 0) {
        let haveOppositeHighCard = false;
        let oppositeWinner: Card | null = null;
        if (playingInHand) {
          if (combinedSuit.numDummyWinners > 0) {
            haveOppositeHighCard = true;
            oppositeWinner = combinedSuit.dummyWinners.bottomCard;
          }
        } else {
          if (combinedSuit.numDeclarerWinners > 0) {
            haveOppositeHighCard = true;
            oppositeWinner = combinedSuit.declarerWinners.bottomCard;
          }
        }

        if (haveOppositeHighCard && oppositeWinner) {
          card = this.getDiscard(context);
          if (card) {
            this.status?.stream(
              `PLDC2B2! We can win the trick in ${playingInHand ? 'dummy' : 'hand'} with the ${oppositeWinner.faceName}, so discard the ${card.faceName} here.\n`,
            );
          }
        } else {
          const trumpHoldings = hand.getSuit(trumpSuit);
          card = trumpHoldings.bottomCard;
          if (card) {
            this.status?.stream(
              `PLDC2B4! We don't have a winner in ths suit in ${playingInHand ? 'dummy' : 'hand'}, so trump here with the ${card.faceName}.\n`,
            );
          }
        }
      } else {
        card = this.getDiscard(context);
        if (card) {
          if (isSuit(trumpSuit)) {
            this.status?.stream(
              `PLDC2C1! We don't have any more ${Card.suitToString(suitLed)} or trumps in ${playingInHand ? 'hand' : 'dummy'}, so discard the ${card.faceName}.\n`,
            );
          } else {
            this.status?.stream(
              `PLDC2C2! We have no more cards in the suit in ${playingInHand ? 'hand' : 'dummy'}, so discard the ${card.name}.\n`,
            );
          }
        }
      }
    }

    return card;
  }

  //
  // PlayThird()
  //
  // default code for playing in third position as declarer/dummy
  //
  override playThird(context: PlayRoundContext = {}): Card | null {
    if (!this.combinedHand || !this.hand) return super.playThird(context);

    const playingInHand = !(context.isDummyTurn ?? false);
    const leadCard = context.leadCard ?? this.leadCard;
    if (!leadCard) return super.playThird(context);

    const rhoCard = context.rhoCard ?? null;
    const suitLed = leadCard.suit;
    const topPos = context.currentHighPos ?? Position.Unknown;
    const currTopCard = context.currentHighCard ?? leadCard;
    const topCardPosStr = positionToString(topPos);
    const declarersCard = context.declarersCard ?? null;
    const dummysCard = context.dummysCard ?? null;
    const partnersCard = playingInHand ? (dummysCard ?? context.partnersCard ?? this.partnersCard) : (declarersCard ?? context.partnersCard ?? this.partnersCard);
    let partnerHigh = Boolean(partnersCard && currTopCard === partnersCard);

    const hand = playingInHand ? this.hand : (this.partnersHand ?? this.dummyHand ?? this.hand);
    const combinedSuit = this.combinedHand.getSuit(suitLed);
    const suit = playingInHand ? combinedSuit.declarerCards : combinedSuit.dummyCards;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const numCardsInSuitLed = suit.length;
    const numOutstandingTrumps = isSuit(trumpSuit) ? this.getNumOutstandingCards(trumpSuit) : 0;
    let card: Card | null = null;

    if (partnerHigh && partnersCard) {
      const outstandingCards = new CardList();
      this.getOutstandingCardsList(suitLed, outstandingCards);
      if (outstandingCards.getNumCardsAbove(partnersCard.faceValue) > 0) {
        partnerHigh = false;
      }
    }

    if (rhoCard && isSuit(trumpSuit) && rhoCard.suit === trumpSuit && trumpSuit !== suitLed) {
      const trumpHoldings = hand.getSuit(trumpSuit);
      const topTrump = trumpHoldings.length > 0 ? trumpHoldings.topCard : null;
      if (numCardsInSuitLed === 0 && topTrump && topTrump.faceValue > currTopCard.faceValue) {
        if (trumpHoldings.numTopCards > numOutstandingTrumps) {
          card = trumpHoldings.topSequence?.bottomCard ?? trumpHoldings.topCard;
          if (card) {
            this.status?.stream(
              `PLYD2A20! We can overtrump ${topCardPosStr}'s ${currTopCard.name} with the ${card.faceName}.\n`,
            );
          }
        } else {
          const numTopCards = trumpHoldings.getNumCardsAbove(currTopCard);
          card = trumpHoldings.at(numTopCards - 1) ?? null;
          if (card) {
            this.status?.stream(
              `PLYD2A21! We can overtrump ${topCardPosStr}'s ${currTopCard.name} with the ${card.faceName}.\n`,
            );
          }
        }
      } else {
        card = this.getDiscard(context);
        if (card) {
          if (numCardsInSuitLed === 0 && trumpHoldings.length > 0) {
            this.status?.stream(
              `PLYD2A22! We can't overtrump ${topCardPosStr}'s ${currTopCard.faceName}, so discard the ${card.name}.\n`,
            );
          } else {
            this.status?.stream(
              `PLYD2A3! We can't beat the opponent's ${currTopCard.faceName} of trumps, so discard the ${card.name}.\n`,
            );
          }
        }
      }
    } else {
      if (numCardsInSuitLed === 1) {
        card = suit.at(0) ?? null;
        if (card) {
          this.status?.stream(`PLYD2A20! Play our only card in the suit, ${card.faceName}.\n`);
        }
      } else if (numCardsInSuitLed >= 2) {
        if ((suit.at(0)?.faceValue ?? 0) > currTopCard.faceValue) {
          const outstandingCards = new CardList();
          const numOutstandingCards = this.getOutstandingCardsList(suitLed, outstandingCards);
          const topOutstandingCard = numOutstandingCards > 0 ? outstandingCards.at(0) : null;
          const p2Pos = (playingInHand ? this.rightOpponent?.position : this.leftOpponent?.position) ?? Position.Unknown;
          const p4Pos = (playingInHand ? this.leftOpponent?.position : this.rightOpponent?.position) ?? Position.Unknown;
          const player2Suit = isPosition(p2Pos) ? this.guessedHands[p2Pos]?.getSuit(suitLed) : undefined;
          const player4Suit = isPosition(p4Pos) ? this.guessedHands[p4Pos]?.getSuit(suitLed) : undefined;
          const strPlayer2 = playingInHand ? this.szRHO : this.szLHO;
          const strPlayer4 = playingInHand ? this.szLHO : this.szRHO;

          if (
            player2Suit?.isSuitShownOut &&
            topOutstandingCard &&
            topOutstandingCard.faceValue > (suit.at(0)?.faceValue ?? 0)
          ) {
            card = suit.topSequence?.bottomCard ?? suit.topCard;
            if (card) {
              this.status?.stream(
                `PLYD2A30! Since ${strPlayer2} has shown out, we know ${strPlayer4} holds a winner in the suit, so play our second highest card (the ${card.faceName}.\n`,
              );
            }
          } else if (player4Suit?.isSuitShownOut) {
            if (partnerHigh) {
              card = this.getDiscard(context);
              if (card) {
                this.status?.stream(
                  `PLYD2A32! Since ${strPlayer4} has shown out, partner's ${currTopCard.faceName} is high, so discard the ${card.faceName}.\n`,
                );
              }
            } else {
              card = suit.getLowestCardAbove(currTopCard);
              if (card) {
                this.status?.stream(
                  `PLYD2A34! Since ${strPlayer2} has shown out, play high to top the ${currTopCard.faceName} with the ${card.faceName}.\n`,
                );
              }
            }
          } else {
            if (partnerHigh) {
              card = this.getDiscard(context);
              if (card) {
                this.status?.stream(
                  `PLYD2A40! Let the ${leadCard.name} ride and discard the ${card.name}.\n`,
                );
              }
            } else if (numOutstandingCards === 0 || !topOutstandingCard) {
              card = suit.getLowestCardAbove(currTopCard);
              if (card) {
                this.status?.stream(`PLYD2A42! Play high to win with the ${card.faceName}.\n`);
              }
            } else {
              const cardToBeat =
                topOutstandingCard.faceValue > currTopCard.faceValue ? topOutstandingCard : currTopCard;
              card =
                suit.getNumCardsAbove(cardToBeat) > 0
                  ? suit.getLowestCardAbove(cardToBeat)
                  : (suit.at(0) ?? null);
              if (card) {
                this.status?.stream(`PLYD2A44! Play high to win with the ${card.faceName}.\n`);
              }
            }
          }
        } else {
          card = this.getDiscard(context);
          if (card) {
            this.status?.stream(
              `PLYD2A50! With nothing higher in ${playingInHand ? 'hand' : 'dummy'}, discard the ${card.faceName}.\n`,
            );
          }
        }
      } else if (isSuit(trumpSuit) && suitLed !== trumpSuit && hand.getNumCardsInSuit(trumpSuit) > 0) {
        if (partnerHigh && partnersCard) {
          card = this.getDiscard(context);
          if (card) {
            this.status?.stream(
              `PLYD2A51! Partner's ${partnersCard.name} is high, so discard the ${card.name}.\n`,
            );
          }
        } else {
          const trumpHoldings = hand.getSuit(trumpSuit);
          if (trumpHoldings.numTopCards > numOutstandingTrumps) {
            card = trumpHoldings.topSequence?.bottomCard ?? trumpHoldings.topCard;
            if (card) {
              this.status?.stream(
                `PLYD2A52! With no cards in the ${Card.suitToString(suitLed)} suit, trump with the ${card.faceName}.\n`,
              );
            }
          } else {
            card = trumpHoldings.bottomCard;
            if (card) {
              this.status?.stream(
                `PLYD2A55! With no cards in ${Card.suitToString(suitLed)}, trump with the ${card.name}.\n`,
              );
            }
          }
        }
      } else {
        card = this.getDiscard(context);
        if (card) {
          this.status?.stream(
            `PLYD2A62! With no cards in the suit led ${isSuit(trumpSuit) ? 'and no trumps' : ''}, we discard the ${card.name}.\n`,
          );
        }
      }
    }

    return card;
  }

  //
  // PlayFourth()
  //
  override playFourth(context: PlayRoundContext = {}): Card | null {
    return super.playFourth(context);
  }

  //
  // GetDiscard()
  //
  override getDiscard(context: PlayRoundContext = {}): Card | null {
    if (!this.hand) return null;

    const leadCard = context.leadCard ?? this.leadCard;
    const suitLed = leadCard?.suit ?? this.leadSuit;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const playingInHand = !(context.isDummyTurn ?? false);
    const declarerHand = this.hand;
    const dummyHand = this.partnersHand ?? this.dummyHand ?? this.hand;

    // first see if we have priority discards
    if (playingInHand && this.declarerPriorityDiscards.length > 0 && isSuit(suitLed)) {
      if (declarerHand.getNumCardsInSuit(suitLed) === 0) {
        const card = this.declarerPriorityDiscards.removeAt(0);
        if (card) {
          this.status?.stream(`3PLYDCS0! Use this opportunity to discard the ${card.name}.\n`);
          this.declarerDiscardedPriorityDiscards.add(card);
          return card;
        }
      } else {
        for (let i = 0; i < this.declarerPriorityDiscards.length; i++) {
          const c = this.declarerPriorityDiscards.at(i);
          if (c && c.suit === suitLed && !this.declarerDiscardedPriorityDiscards.hasCard(c)) {
            this.declarerPriorityDiscards.removeAt(i);
            if (declarerHand.getSuit(c.suit).length > 1) {
              this.status?.stream(`3PLYDCS1! Use this opportunity to discard the ${c.name}.\n`);
            }
            this.declarerDiscardedPriorityDiscards.add(c);
            return c;
          }
        }
      }
    } else if (!playingInHand && this.dummyPriorityDiscards.length > 0 && isSuit(suitLed)) {
      if (dummyHand.getNumCardsInSuit(suitLed) === 0) {
        const card = this.dummyPriorityDiscards.removeAt(0);
        if (card) {
          this.status?.stream(`3PLYDCS5! Use this opportunity to discard the ${card.name}.\n`);
          this.dummyDiscardedPriorityDiscards.add(card);
          return card;
        }
      } else {
        for (let i = 0; i < this.dummyPriorityDiscards.length; i++) {
          const c = this.dummyPriorityDiscards.at(i);
          if (c && c.suit === suitLed && !this.dummyDiscardedPriorityDiscards.hasCard(c)) {
            this.dummyPriorityDiscards.removeAt(i);
            if (dummyHand.getSuit(c.suit).length > 1) {
              this.status?.stream(`3PLYDCS6! Use this opportunity to discard the ${c.name}.\n`);
            }
            this.dummyDiscardedPriorityDiscards.add(c);
            return c;
          }
        }
      }
    }

    const hand = playingInHand ? declarerHand : dummyHand;
    if (isSuit(suitLed)) {
      const suit = hand.getSuit(suitLed);
      const oppositeSuit = (playingInHand ? dummyHand : declarerHand).getSuit(suitLed);
      const combinedSuit = this.combinedHand?.getSuit(suitLed);
      if (suit.length > 0) {
        if (combinedSuit && combinedSuit.numLosers === 0 && oppositeSuit.length >= suit.length && leadCard) {
          if (suit.getNumCardsBelow(leadCard) > 0) {
            const card = suit.getHighestCardBelow(leadCard);
            if (card) {
              this.status?.stream(`3PLYDCS2! Discard the ${card.name} to unblock the suit.\n`);
              return card;
            }
          }
        }
        return suit.bottomCard;
      }
    }

    return this.getFinalDiscard(context, playingInHand);
  }

  //
  // GetFinalDiscard()
  //
  getFinalDiscard(context: PlayRoundContext = {}, playingInHand = !(context.isDummyTurn ?? false)): Card | null {
    const declarerHand = this.hand;
    const dummyHand = this.partnersHand ?? this.dummyHand ?? this.hand;
    const hand = playingInHand ? declarerHand : dummyHand;
    if (!hand) return null;
    if (!this.combinedHand) return hand.getSuit(this.pickFinalDiscardSuit(hand)).bottomCard;

    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    let discardSuit: SuitHoldings | null = null;

    const suitsByLosers: Suit[] = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        let swap = false;
        const s1 = this.combinedHand.getSuit(suitsByLosers[j]);
        const s2 = this.combinedHand.getSuit(suitsByLosers[j + 1]);
        const numWinners1 = playingInHand ? s1.numDeclarerWinners : s1.numDummyWinners;
        const numWinners2 = playingInHand ? s2.numDeclarerWinners : s2.numDummyWinners;
        const numLosers1 = playingInHand ? s1.numDeclarerLosers : s1.numDummyLosers;
        const numLosers2 = playingInHand ? s2.numDeclarerLosers : s2.numDummyLosers;
        const numCards1 = playingInHand ? s1.declarerLength : s1.dummyLength;
        const numCards2 = playingInHand ? s2.declarerLength : s2.dummyLength;
        const numOppositeCards1 = playingInHand ? s1.dummyLength : s1.declarerLength;
        const numOppositeCards2 = playingInHand ? s2.dummyLength : s2.declarerLength;

        if (
          (numLosers2 > numLosers1 && numWinners2 <= numWinners1) ||
          (numLosers1 === numLosers2 && numWinners1 > numWinners2) ||
          (numWinners1 > 0 && numWinners2 === 0)
        ) {
          swap = true;
        }
        if (numLosers2 > 0 && numOppositeCards2 === 0 && numOppositeCards1 >= 1 && numWinners1 >= 1) {
          swap = true;
        }
        if (numLosers1 === 0 && numLosers2 === 0 && numCards1 > numCards2) {
          swap = true;
        }

        if (swap) {
          const temp = suitsByLosers[j];
          suitsByLosers[j] = suitsByLosers[j + 1];
          suitsByLosers[j + 1] = temp;
        }
      }
    }

    const discardSuits: Suit[] = [];
    for (let i = 0; i < 4; i++) {
      const s = suitsByLosers[i];
      if (hand.getNumCardsInSuit(s) === 0) continue;
      if (s === trumpSuit) continue;

      const combinedSuit = this.combinedHand.getSuit(s);
      const numLosers = playingInHand ? combinedSuit.numDeclarerLosers : combinedSuit.numDummyLosers;
      if (s === this.prioritySuit || s === this.partnersPrioritySuit || numLosers === 0) continue;

      const suit = playingInHand ? combinedSuit.declarerCards : combinedSuit.dummyCards;
      const oppositeSuit = playingInHand ? combinedSuit.dummyCards : combinedSuit.declarerCards;
      const numEntries = playingInHand ? this.numDummyEntriesInSuit[s] : this.numDeclarerEntriesInSuit[s];
      if (suit.length === 1 && oppositeSuit.numWinners > 0 && numEntries === 1) continue;

      if (numLosers > 0) {
        discardSuits.push(s);
      }
    }

    if (discardSuits.length > 1) {
      let chosen: Suit | null = null;
      for (const s of discardSuits) {
        const hasWinningPlay = this.playPlan.all.some(p => p.suit === s && p.isWinner);
        if (!hasWinningPlay) {
          chosen = s;
          break;
        }
      }
      discardSuit = hand.getSuit(chosen ?? discardSuits[0]);
    } else if (discardSuits.length === 1) {
      discardSuit = hand.getSuit(discardSuits[0]);
    }

    if (discardSuit === null) {
      discardSuit = hand.getSuit(this.pickFinalDiscardSuit(hand));
    }

    return discardSuit.bottomCard ?? hand.bottomCard;
  }

  ////////////////////////////////////////////////////////////////////////////////
  //
  // Planning routines
  //
  ////////////////////////////////////////////////////////////////////////////////

  //
  // PlanPlay()
  //
  planPlay(context: PlayRoundContext = {}): void {
    const contract = context.contract ?? this.contract;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    this.trumpSuit = trumpSuit;
    this.contract = contract;
    if (this.numRequiredTricks === 0 && contract > 0) {
      this.numRequiredTricks = 6 + bidLevel(contract);
      this.numTricksLeftToBeMade = this.numRequiredTricks;
    }

    this.status?.stream(
      `2PLN00! Dummy's hand has been laid down; now planning the play with a contract of ${contractToFullString(contract, this.contractModifier)}.\n---------------------------\nPlanning the play...\n`,
    );

    this.initCombinedHand();
    this.playPlan.clear();
    this.currentPlay = null;

    this.numSureTricks = this.combinedHand?.numMaxWinners ?? 0;
    this.status?.stream(
      `2PLN10! We have${this.numSureTricks < this.numRequiredTricks ? ' only ' : ' '}${this.numSureTricks} sure ${this.numSureTricks > 1 ? 'tricks' : 'trick'} against a requirement of ${this.numRequiredTricks} for the ${contractToFullString(contract, this.contractModifier)} contract.\n`,
    );

    if (isSuit(trumpSuit)) {
      this.createSuitContractPlayPlan(context);
    } else {
      this.createNoTrumpPlayPlan(context);
    }

    this.pickPrioritySuit();
    this.sequencePlays(true, context);

    this.playPlan.activate();
    this.status?.setStreamOutputLevel(3);
    this.status?.stream('3PLN90! The tentative list of available plays is as follows:\n------>\n');
    this.numPlannedRounds = this.playPlan.size;
    for (let i = 0; i < this.numPlannedRounds; i++) {
      const desc = this.playPlan.at(i)?.getFullDescription() ?? '';
      this.status?.stream(` Play ${i + 1}: ${desc}\n`);
    }
    this.status?.stream('3PLN95! The planning is complete.\n');
    this.status?.stream('---------------------------\n');
    this.status?.clearStreamOutputLevel();
  }

  //
  // ReviewPlayPlan()
  //
  reviewPlayPlan(context: PlayRoundContext = {}): void {
    const tricksPlayed = context.numTricksPlayed ?? context.playRound ?? this.round;
    this.status?.stream(`2PLNADJ! Reviewing play plan for round ${tricksPlayed + 1}...\n`);

    this.declarerPriorityDiscards.clear();
    this.dummyPriorityDiscards.clear();
    this.declarerDiscardedPriorityDiscards.clear();
    this.dummyDiscardedPriorityDiscards.clear();
    this.playPlan.clear();
    this.currentPlay = null;

    this.numTricksMade = context.numTricksWonByDeclarer ?? context.numTricksWonByTeam ?? this.numTricksMade;
    this.numTricksLeftToBeMade = this.numRequiredTricks - this.numTricksMade;
    this.numSureTricks = this.combinedHand?.numMaxTopCards ?? 0;
    this.numTricksShort = this.numTricksLeftToBeMade - this.numSureTricks;

    if (this.numTricksLeftToBeMade > 0) {
      if (this.numSureTricks < this.numTricksLeftToBeMade) {
        this.status?.stream(
          `2PLRV10! We have only ${this.numSureTricks} reasonably sure ${this.numSureTricks > 1 ? 'tricks' : 'trick'} left vs. ${this.numTricksLeftToBeMade} more trick(s) required for the contract.\n`,
        );
      } else {
        this.status?.stream(
          `2PLRV11! We have ${this.numSureTricks} reasonably sure ${this.numSureTricks > 1 ? 'tricks' : 'trick'} left vs. ${this.numTricksLeftToBeMade} more trick(s) required for the contract.\n`,
        );
      }
    } else {
      if (this.numSureTricks > 0) {
        this.status?.stream(
          `2PLRV12! We have ${this.numSureTricks} sure ${this.numSureTricks > 1 ? 'tricks' : 'trick'} left, though the contract has been fulfilled.\n`,
        );
      } else {
        this.status?.stream(
          '2PLRV13! We have no more sure tricks left, but the contract has been fulfilled.\n',
        );
      }
    }

    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    if (isSuit(trumpSuit)) {
      this.createSuitContractPlayPlan(context);
    } else {
      this.createNoTrumpPlayPlan(context);
    }

    this.sequencePlays(false, context);

    this.playPlan.activate();
    this.status?.setStreamOutputLevel(4);
    this.status?.stream('PLRV90! The revised list of available plays is as follows:\n------>\n');
    this.numPlannedRounds = this.playPlan.size;
    for (let i = 0; i < this.numPlannedRounds; i++) {
      const desc = this.playPlan.at(i)?.getFullDescription() ?? '';
      this.status?.stream(` Play ${i + 1}: ${desc}\n`);
    }
    this.status?.stream('PLRV95! The play plan review is complete.\n');
    this.status?.stream('---------------------------\n');
    this.status?.clearStreamOutputLevel();
  }

  //
  // CreateNoTrumpPlayPlan()
  //
  createNoTrumpPlayPlan(context: PlayRoundContext = {}): number {
    const tricksPlayed = context.numTricksPlayed ?? context.playRound ?? this.round;
    this.status?.setStreamOutputLevel(tricksPlayed === 0 ? 4 : 5);
    this.numTotalPlannedTricks = 0;

    // 1) Hold up
    const holdUpPlays = new PlayList();
    this.findHoldUpPlays(holdUpPlays, false, context);
    this.filterPlays(holdUpPlays);
    this.playPlan.appendList(holdUpPlays);
    this.numPlannedHoldUps += holdUpPlays.size;

    // 2) Play for a drop
    const dropPlays = new PlayList();
    this.findDropPlays(dropPlays);
    this.filterPlays(dropPlays);
    this.playPlan.appendList(dropPlays);
    this.numPlannedDropPlays = dropPlays.size;
    this.numTotalPlannedTricks += dropPlays.size;

    // 3) Finesses
    const finessePlays = new PlayList();
    this.findFinessePlays(finessePlays, context);
    this.filterPlays(finessePlays);
    this.playPlan.appendList(finessePlays);
    this.numPlannedFinesses += finessePlays.size;

    // 4) Suit development
    const forcePlays = new PlayList();
    const secondaryCashPlays = new PlayList();
    this.findSuitDevelopmentPlays(forcePlays, secondaryCashPlays);
    this.filterPlays(forcePlays);
    this.playPlan.appendList(forcePlays);
    this.numPlannedForcePlays = forcePlays.size;
    this.numTotalPlannedTricks += forcePlays.size;

    this.filterPlays(secondaryCashPlays);
    this.numPlannedSecondaryCashPlays = secondaryCashPlays.size;
    this.playPlan.appendList(secondaryCashPlays);
    this.numTotalPlannedTricks += this.numPlannedSecondaryCashPlays;

    // 5) Top-card cashing tricks
    const cashingPlays = new PlayList();
    this.numPlannedCashingTricks = this.findCashingPlays(cashingPlays, false, context);
    this.playPlan.appendList(cashingPlays);
    this.numPlannedCashingTricks -= this.numPlannedDropPlays;
    this.numTotalPlannedTricks += this.numPlannedCashingTricks;

    this.screenIneligiblePlays();
    this.testPlaysAgainstBiddingHistory(context);
    this.testPlaysAgainstPlayHistory(context);

    this.numPlannedRounds = this.playPlan.size;
    this.numTricksShort = this.numRequiredTricks - this.numTotalPlannedTricks;
    this.status?.stream('4PLNF1! Done examining plays...\n>>>>>>>>>>>>>>>>>>>>\n');

    const numRemainingTricks = 13 - tricksPlayed;
    if (this.numTotalPlannedTricks < 13) {
      this.status?.stream(
        `2PLNNT90A! We have ${this.playPlan.size} plays and approx. ${this.numTotalPlannedTricks}+ possible tricks including ${this.numSureTricks} sure tricks (vs. ${this.numRequiredTricks} required) accounted for in the plan.\n`,
      );
    } else {
      this.status?.stream(
        `2PLNNT90B! We have ${this.playPlan.size} plays and up to ${numRemainingTricks} possible tricks including ${this.numSureTricks} sure tricks (vs. ${this.numRequiredTricks} required) accounted for in the plan.\n`,
      );
    }
    this.status?.clearStreamOutputLevel();
    return this.numTotalPlannedTricks;
  }

  //
  // CreateSuitContractPlayPlan()
  //
  createSuitContractPlayPlan(context: PlayRoundContext = {}): number {
    const tricksPlayed = context.numTricksPlayed ?? context.playRound ?? this.round;
    this.status?.setStreamOutputLevel(tricksPlayed === 0 ? 4 : 5);
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    this.numTotalPlannedTricks = 0;

    // drop plays
    const dropPlays = new PlayList();
    this.findDropPlays(dropPlays);

    // finesses
    const finessePlays = new PlayList();
    this.findFinessePlays(finessePlays, context);

    // suit development
    const forcePlays = new PlayList();
    const secondaryCashPlays = new PlayList();
    this.findSuitDevelopmentPlays(forcePlays, secondaryCashPlays);
    secondaryCashPlays.clear();

    // ruffing tricks
    const ruffingPlays = new PlayList();
    this.findRuffingPlays(ruffingPlays, context);

    // sequence into m_playPlan
    this.filterPlays(dropPlays);
    this.playPlan.appendList(dropPlays);
    this.numPlannedDropPlays = dropPlays.size;
    this.numTotalPlannedTricks += this.numPlannedDropPlays;

    this.filterPlays(ruffingPlays);
    this.playPlan.appendList(ruffingPlays);
    this.numPlannedRuffingTricks = ruffingPlays.size;
    this.numTotalPlannedTricks += this.numPlannedRuffingTricks;

    this.filterPlays(finessePlays);
    this.playPlan.appendList(finessePlays);
    this.numPlannedFinesses = finessePlays.size;

    this.filterPlays(forcePlays);
    this.playPlan.appendList(forcePlays);

    // cashing tricks
    const cashingPlays = new PlayList();
    this.numPlannedCashingTricks = this.findCashingPlays(cashingPlays, false, context);
    this.playPlan.appendList(cashingPlays);
    this.numPlannedCashingTricks -= this.numPlannedDropPlays;
    this.numTotalPlannedTricks += this.numPlannedCashingTricks;
    this.numSureTricks = this.numPlannedCashingTricks;

    // trump pulls
    const trumpPullingPlays = new PlayList();
    this.formTrumpPullingPlan(this.playPlan, trumpPullingPlays);
    this.numPlannedTrumpPulls = trumpPullingPlays.size;
    for (let i = 0, idx = this.numPlannedTrumpPulls - 1; i < this.numPlannedTrumpPulls; i++, idx--) {
      const p = trumpPullingPlays.at(idx);
      if (p) this.playPlan.add(i, p);
    }

    if (isSuit(trumpSuit) && this.combinedHand) {
      const trumpHoldings = this.combinedHand.getSuit(trumpSuit);
      this.numPlannedTrumpPulls = Math.min(this.numPlannedTrumpPulls, trumpHoldings.numMaxWinners);
      this.numTotalPlannedTricks += this.numPlannedTrumpPulls;
    }

    // trump finesses
    const trumpFinessePlays = new PlayList();
    this.formTrumpFinessePlan(this.playPlan, trumpFinessePlays, context);
    for (let i = 0; i < trumpFinessePlays.size; i++) {
      const p = trumpFinessePlays.at(i);
      if (p) this.playPlan.add(i, p);
    }

    this.screenIneligiblePlays();
    this.testPlaysAgainstPlayHistory(context);

    this.numPlannedRounds = this.playPlan.size;
    this.numTricksShort = this.numRequiredTricks - this.numTotalPlannedTricks;
    this.status?.stream('4PLNF1! Done examining plays...\n>>>>>>>>>>>>>>>>>>>>\n');

    const numRemainingTricks = 13 - tricksPlayed;
    if (this.numTotalPlannedTricks < 13) {
      this.status?.stream(
        `2PLNST90A! We have ${this.playPlan.size} possible plays and approx. ${this.numTotalPlannedTricks}+ possible tricks including ${this.numSureTricks} sure tricks (vs. ${this.numRequiredTricks} required) accounted for in the plan.\n`,
      );
    } else {
      this.status?.stream(
        `2PLNST90B! We have ${this.playPlan.size} possible plays and up to ${numRemainingTricks} possible tricks including ${this.numSureTricks} sure tricks (vs. ${this.numRequiredTricks} required) accounted for in the plan.\n`,
      );
    }
    this.status?.clearStreamOutputLevel();
    return this.numTotalPlannedTricks;
  }

  //
  // PickPrioritySuit()
  //
  pickPrioritySuit(): void {
    if (!this.combinedHand) return;

    const suitsList: Suit[] = [];
    const suitHasPlays: boolean[] = [false, false, false, false];
    const suitMerit: number[] = [0, 0, 0, 0];
    const suitConsidered: boolean[] = [false, false, false, false];

    for (const play of this.playPlan.all) {
      const s = play.suit;
      if (!isSuit(s)) continue;
      if (
        play.type === PlayType.Drop ||
        play.type === PlayType.Finesse ||
        play.type === PlayType.Force ||
        play.type === PlayType.Ruff
      ) {
        if (!suitHasPlays[s]) {
          suitHasPlays[s] = true;
          suitsList.push(s);
          if (!suitConsidered[s]) {
            switch (play.type) {
              case PlayType.Drop:
              case PlayType.Force: {
                const cs = this.combinedHand.getSuit(s);
                suitMerit[s] = cs.maxLength + Math.floor(cs.minLength / 2);
                suitConsidered[s] = true;
                break;
              }
              case PlayType.Finesse: {
                const depth = (play as Finesse).depth ?? 0;
                suitMerit[s] += Math.max(3 - depth, 0);
                break;
              }
              case PlayType.Ruff: {
                const discards = (play as Ruff).numDiscardsRequired ?? 0;
                suitMerit[s] += Math.max(4 - discards, 0);
                break;
              }
            }
          }
        }
      }
    }

    for (let i = 0; i < 4; i++) {
      if (i !== this.trumpSuit) {
        const cs = this.combinedHand.getSuit(i as Suit);
        suitMerit[i] += cs.numSecondaryHonors + cs.numBodyCards;
        suitMerit[i] -= cs.numMissingTopHonors;
      }
    }

    if (suitsList.length === 0) {
      let idx = 0;
      if (this.combinedHand.getSuitsByLength(idx) === this.trumpSuit) idx++;
      for (; idx < 4; idx++) {
        const s = this.hand ? this.hand.getSuitsByLength(idx) : (idx as Suit);
        suitsList.push(s);
        const cs = this.combinedHand.getSuit(s);
        suitMerit[s] = cs.maxLength + Math.floor(cs.minLength / 2);
      }
    }

    if (suitsList.length === 0) {
      this.prioritySuit = NONE;
      return;
    }

    let topMerit = -Infinity;
    for (const s of suitsList) {
      if (suitMerit[s] > topMerit && s !== this.trumpSuit) {
        topMerit = suitMerit[s];
        this.prioritySuit = s;
      }
    }

    if (isSuit(this.prioritySuit)) {
      this.status?.stream(
        `2PLNPRI! The ${Card.suitToSingularString(this.prioritySuit)} suit looks the most promising for further development.\n`,
      );
    }
  }

  //
  // TestPlaysAgainstBiddingHistory()
  //
  testPlaysAgainstBiddingHistory(context: PlayRoundContext = {}): void {
    this.status?.stream('3PLTSTB! Checking logic of selected plays against bidding history...\n');
    const lhoBids = context.lhoBids ?? [];
    const rhoBids = context.rhoBids ?? [];
    if (lhoBids.length === 0 && rhoBids.length === 0) return;

    for (let i = 0; i < this.playPlan.size; i++) {
      const play = this.playPlan.at(i);
      if (!play || play.type !== PlayType.Finesse) continue;
      const finesse = play as Finesse;
      const s = play.suit;

      const lhoBidSuit = lhoBids.some(b => isBid(b) && bidSuit(b) === s);
      const rhoBidSuit = rhoBids.some(b => isBid(b) && bidSuit(b) === s);

      if (
        (finesse.targetPos === this.leftOpponent?.position && lhoBidSuit) ||
        (finesse.targetPos === this.rightOpponent?.position && rhoBidSuit)
      ) {
        this.status?.stream(
          `3PLTSTB! The ${play.consumedCard?.name ?? ''} finesse is targeted against ${positionToString(finesse.targetPos)}, who had earlier bid the ${Card.suitToSingularString(s)}, so postpone the play.\n`,
        );
        this.playPlan.moveToEnd(i);
      }
    }
  }

  //
  // TestPlaysAgainstPlayHistory()
  //
  testPlaysAgainstPlayHistory(context: PlayRoundContext = {}): void {
    this.status?.stream('3PLTSTP! Checking logic of selected plays against play history...\n');

    for (let i = 0; i < this.playPlan.size; i++) {
      let skip = false;
      const play = this.playPlan.at(i);
      if (!play || play.type !== PlayType.Finesse) continue;
      const newFinesse = play as Finesse;

      for (let j = 0; j < this.usedPlays.size; j++) {
        const usedPlay = this.usedPlays.at(j);
        if (!usedPlay || usedPlay.type !== PlayType.Finesse) continue;
        const oldFinesse = usedPlay as Finesse;
        if (newFinesse.suit !== oldFinesse.suit) continue;

        const newGap = new CardList(newFinesse.enemyAlternativeKeyCards);
        const oldGap = new CardList(oldFinesse.enemyAlternativeKeyCards);
        if (!oldGap.containsAtLeastOneOf(newGap) && !newGap.containsAtLeastOneOf(oldGap)) continue;

        const trickWinner = context.gameTrickHistory?.[j]?.winner;
        if (trickWinner === this.position || trickWinner === this.partnerPosition) {
          if (newFinesse.targetPos !== oldFinesse.targetPos) {
            this.status?.stream(
              `!5PLTST1! The [${newFinesse.name}] targets ${positionToString(newFinesse.targetPos)}, while we successfully finessed against ${positionToString(oldFinesse.targetPos)} earlier, so delete this play.\n`,
            );
            this.adjustPlayCountForDeletedPlay(play);
            this.playPlan.remove(i);
            this.discardedPlays.append(play);
            i--;
            skip = true;
            break;
          }
        }
      }

      if (skip) continue;

      if (isPosition(this.position) && isSuit(newFinesse.suit)) {
        const opponent =
          newFinesse.targetHand === IN_DUMMY ? nextPosition(this.position) : prevPosition(this.position);
        const oppHand = this.guessedHands[opponent];
        if (oppHand?.isSuitShownOut(newFinesse.suit)) {
          this.status?.stream(
            `!5PLTST4! The [${newFinesse.name}] will not suceed because ${positionToString(opponent)} has shown out of the suit, so delete the play.\n`,
          );
          this.adjustPlayCountForDeletedPlay(play);
          this.playPlan.remove(i);
          this.discardedPlays.append(play);
          i--;
        }
      }
    }
  }

  //
  // SequencePlays()
  //
  sequencePlays(_initialPlan = false, context: PlayRoundContext = {}): void {
    this.status?.stream('!3PLSEQ! Checking play sequencing...\n');
    let sequenced = false;
    let skipOpportunisticPlays = false;

    const numPlays = this.playPlan.size;
    if (numPlays === 0 || !this.combinedHand) return;

    const playingInHand = !(context.isDummyTurn ?? false);
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const numOutstandingTrumps = isSuit(trumpSuit) ? this.getNumOutstandingCards(trumpSuit) : 0;

    // *** Straight Cashing ***
    this.evaluateEntries();
    let sufficientEntries = true;
    const numRemainingTricks = this.numTricksLeftToBeMade;
    if (
      this.combinedHand.numDeclarerWinners < numRemainingTricks &&
      this.combinedHand.numDummyWinners < numRemainingTricks
    ) {
      if (this.numDeclarerEntries === 0 || this.numDummyEntries === 0) {
        sufficientEntries = false;
      }
    }
    if (
      !playingInHand &&
      this.combinedHand.numDummyTopCards < numRemainingTricks &&
      this.numDeclarerEntries === 0
    ) {
      sufficientEntries = false;
    }
    if (
      playingInHand &&
      this.combinedHand.numDeclarerTopCards < numRemainingTricks &&
      this.numDummyEntries === 0
    ) {
      sufficientEntries = false;
    }

    const numTopCards = this.combinedHand.numMaxTopCards;
    let enoughCashes = false;
    const numTrumpWinners = isSuit(trumpSuit) ? this.combinedHand.getSuit(trumpSuit).numMaxWinners : 0;

    if (!sequenced) {
      if (isSuit(trumpSuit) && numTrumpWinners - numOutstandingTrumps >= this.numTricksLeftToBeMade) {
        // leave room to try for extra tricks
      } else if (
        numTopCards >= this.numTricksLeftToBeMade &&
        sufficientEntries &&
        (!isSuit(trumpSuit) || numOutstandingTrumps === 0)
      ) {
        enoughCashes = true;
        if (
          this.numPlannedFinesses ||
          this.numPlannedForcePlays ||
          this.numPlannedHoldUps ||
          this.numPlannedDropPlays
        ) {
          this.status?.stream(
            `!2PLSEQ1! Since we have enough cashing tricks (${this.numPlannedCashingTricks}) to fulfill the contract, we can just proceed with the cashing.\n`,
          );
        }
        for (let i = 1; i < this.playPlan.size; i++) {
          const play = this.playPlan.at(i);
          if (play && play.type === PlayType.Cash) {
            for (let j = 0; j < i; j++) {
              if (this.playPlan.at(j)?.type !== PlayType.Cash) {
                this.playPlan.move(i, j);
                break;
              }
            }
          }
        }
        sequenced = true;
      }
    }

    // *** Cashes + Ruffs + Trump Pulls ***
    const cashes = this.playPlan.getPlaysOfType(PlayType.Cash);
    const trumpPulls = this.playPlan.getPlaysOfType(PlayType.TrumpPull);
    if (cashes) cashes.removeSameCardPlays(trumpPulls);
    const numUniqueCashes = cashes ? Math.min(cashes.size, this.combinedHand.numMaxTopCards) : 0;
    let numSolidPlays = numUniqueCashes + this.numPlannedTrumpPulls;
    let numUsableRuffs = 0;

    if (isSuit(trumpSuit)) {
      const trumps = this.combinedHand.getSuit(trumpSuit);
      const numShortTrumps = trumps.minLength - this.numPlannedTrumpPulls;
      if (trumps.lengthDiff > 0) {
        numUsableRuffs = Math.min(numShortTrumps, this.playPlan.getNumPlaysOfType(PlayType.Ruff, IN_DUMMY));
      } else {
        numUsableRuffs = Math.min(numShortTrumps, this.playPlan.getNumPlaysOfType(PlayType.Ruff, IN_HAND));
      }
      if (cashes) {
        for (const c of cashes.all) {
          if (c.suit === trumpSuit) numUsableRuffs--;
        }
      }
      if (numUsableRuffs < 0) numUsableRuffs = 0;
      numSolidPlays += numUsableRuffs;
    }

    if (!sequenced && numSolidPlays >= this.numTricksLeftToBeMade && this.numTricksLeftToBeMade > 0) {
      const parts: string[] = [];
      if (this.numPlannedTrumpPulls > 0) {
        parts.push(`pulling ${this.numPlannedTrumpPulls} round(s) of trumps`);
      }
      if (numUniqueCashes > 0 && cashes) {
        const cashNames: string[] = [];
        const numCashesInSuit = [0, 0, 0, 0];
        for (const c of cashes.all) {
          if (cashNames.length >= numUniqueCashes) break;
          const card = c.consumedCard;
          if (!card) continue;
          numCashesInSuit[card.suit]++;
          if (numCashesInSuit[card.suit] > this.combinedHand.getSuit(card.suit).maxLength) continue;
          if (
            card.suit === trumpSuit &&
            numCashesInSuit[card.suit] + this.numPlannedTrumpPulls > this.combinedHand.getSuit(card.suit).maxLength
          ) {
            continue;
          }
          cashNames.push(card.name);
        }
        if (cashNames.length > 0) {
          const joined =
            cashNames.length === 1
              ? cashNames[0]
              : `${cashNames.slice(0, -1).join(', ')} and ${cashNames[cashNames.length - 1]}`;
          parts.push(`cashing the ${joined}`);
        }
      }
      if (numUsableRuffs > 0) {
        parts.push(`ruffing ${numUsableRuffs} card(s)`);
      }

      // push non-cash/trump/ruff plays to the end
      let idx = 0;
      for (let i = 0; i < this.playPlan.size; i++) {
        const pt = this.playPlan.at(idx)?.type;
        if (pt !== PlayType.TrumpPull && pt !== PlayType.Cash && pt !== PlayType.Ruff) {
          this.playPlan.moveToEnd(idx);
        } else {
          idx++;
        }
      }

      const planStr =
        parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
      this.status?.stream(`2PLSEQ20! We can fulfill the contract by ${planStr}.\n`);
      sequenced = true;
    }

    // *** Throwing opponents into the lead (ExitPlay) ***
    const numDeclarerTrumps = isSuit(trumpSuit) && this.hand ? this.hand.getNumCardsInSuit(trumpSuit) : 0;
    if (!sequenced && isSuit(trumpSuit) && numDeclarerTrumps > 0) {
      let numFinesseSuits = 0;
      const suitHasFinesses = [false, false, false, false];
      for (let i = 0; i < 4; i++) {
        if (i === trumpSuit) continue;
        if (this.playPlan.all.some(p => p.type === PlayType.Finesse && p.suit === i)) {
          suitHasFinesses[i] = true;
          numFinesseSuits++;
        }
      }

      let numExcessWinners = 0;
      for (let i = 0; i < 4; i++) {
        if (i === trumpSuit || suitHasFinesses[i]) continue;
        numExcessWinners += this.combinedHand.getSuit(i as Suit).numExcessWinners;
      }

      const clearSuits: Suit[] = [];
      const exitSuits: Suit[] = [];
      for (let i = 0; i < 4; i++) {
        if (i === trumpSuit) continue;
        const s = i as Suit;
        const cs = this.combinedHand.getSuit(s);
        const numLosers = cs.numLosers;
        if (numLosers === 0 && cs.length > 0) {
          clearSuits.push(s);
        } else if (numLosers === 1 || (numLosers === 2 && numExcessWinners > 0)) {
          exitSuits.push(s);
          if (suitHasFinesses[i]) {
            suitHasFinesses[i] = false;
            numFinesseSuits--;
          }
        }
      }

      let exitOK = false;
      if (numFinesseSuits + clearSuits.length + exitSuits.length === 3) {
        if (exitSuits.length === 1) {
          exitOK = true;
        } else if (exitSuits.length === 2) {
          const s0 = this.combinedHand.getSuit(exitSuits[0]);
          const s1 = this.combinedHand.getSuit(exitSuits[1]);
          const firstInDeclarer = s0.declarerLength > 0;
          if ((firstInDeclarer && s1.dummyLength > 0) || (!firstInDeclarer && s1.declarerLength > 0)) {
            exitOK = true;
          }
        }
      }

      if (exitOK) {
        let insertPos = 0;
        while (insertPos < this.playPlan.size && this.playPlan.at(insertPos)?.type === PlayType.TrumpPull) {
          insertPos++;
        }
        const prerequisites: Play[] = [];
        for (let j = this.playPlan.size - 1; j > insertPos; j--) {
          const play = this.playPlan.at(j);
          if (play && play.type === PlayType.Cash && (clearSuits.includes(play.suit as Suit) || exitSuits.includes(play.suit as Suit))) {
            prerequisites.push(play);
            this.playPlan.move(j, insertPos);
            j++;
            insertPos++;
          }
        }

        const exitPlay = new ExitPlay(exitSuits[0], exitSuits.length === 2 ? exitSuits[1] : NONE, prerequisites);
        this.playPlan.add(insertPos, exitPlay);
        if (exitSuits.length === 1) {
          this.status?.stream(
            `3PLSEQ44! We want to eventualy exit with a ${Card.suitToSingularString(exitSuits[0])}.\n`,
          );
        } else {
          this.status?.stream(
            `3PLSEQ45! We want to eventualy exit with a ${Card.suitToSingularString(exitSuits[0])} and a ${Card.suitToSingularString(exitSuits[1])}.\n`,
          );
        }
        sequenced = true;
        skipOpportunisticPlays = true;
      }
    }

    // *** Opportunistic Play Handling ***
    const tricksRemaining = context.numTricksRemaining ?? (13 - (context.numTricksPlayed ?? this.round));
    if (!skipOpportunisticPlays && tricksRemaining > this.numTricksLeftToBeMade) {
      const oppIdx = this.playPlan.all.findIndex(p => p.opportunistic);
      if (oppIdx >= 0) {
        const oppPlay = this.playPlan.at(oppIdx)!;
        if (oppPlay.isViable(this.buildPlayDependencies(context, !playingInHand))) {
          this.playPlan.moveToFront(oppIdx);
          this.status?.stream(`4PLSEQ50! Move the opportunistic ${oppPlay.name} to the front.\n`);
          sequenced = true;
        }
      }
    }

    // *** Priority Suit Handling ***
    if (!sequenced && isSuit(this.prioritySuit) && !enoughCashes) {
      this.status?.stream(
        `3PLSEQ6! We want to work on developing the ${Card.suitToSingularString(this.prioritySuit)} suit first, so move its plays up to the front if possible.\n`,
      );
      for (let i = 1; i < this.playPlan.size; i++) {
        const play = this.playPlan.at(i);
        if (play && play.suit === this.prioritySuit) {
          for (let j = 0; j < i; j++) {
            const existing = this.playPlan.at(j);
            if (existing && existing.suit !== this.prioritySuit && existing.suit !== trumpSuit) {
              this.playPlan.move(i, j);
              break;
            }
          }
        }
      }
      sequenced = true;
    }

    this.interleavePlays(context);
  }

  //
  // InterleavePlays()
  //
  interleavePlays(context: PlayRoundContext = {}): void {
    this.status?.stream('!3PINTLV! Interleaving plays...\n');
    const numPlays = this.playPlan.size;
    if (numPlays === 0 || !this.combinedHand) return;

    const playingInHand = !(context.isDummyTurn ?? false);
    const currentHand = playingInHand ? IN_HAND : IN_DUMMY;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;

    this.evaluateEntries();

    // *** Long/Short Hand Handling ***
    for (let s = 0; s < 4; s++) {
      const suit = this.combinedHand.getSuit(s as Suit);
      const declarerSuit = suit.declarerCards;
      const dummySuit = suit.dummyCards;
      if (suit.numDeclarerWinners > 0 && suit.numDummyWinners > 0 && declarerSuit.length !== dummySuit.length) {
        if (
          (declarerSuit.length >= 2 && dummySuit.length === 1 && (declarerSuit.at(0)?.faceValue ?? 0) > (dummySuit.at(0)?.faceValue ?? 0)) ||
          (dummySuit.length >= 2 && declarerSuit.length === 1 && (dummySuit.at(0)?.faceValue ?? 0) > (declarerSuit.at(0)?.faceValue ?? 0))
        ) {
          continue;
        }
        const declarerLong = declarerSuit.length > dummySuit.length;
        let numPlaysToExamine = this.playPlan.size - 1;
        for (let j = 0; j < numPlaysToExamine; j++) {
          const play = this.playPlan.at(j);
          if (!play || play.type !== PlayType.Cash || play.suit !== s) continue;
          let oppHand: number;
          if (play.targetHand === IN_HAND && declarerLong) oppHand = IN_DUMMY;
          else if (play.targetHand === IN_DUMMY && !declarerLong) oppHand = IN_HAND;
          else continue;

          let pos = -1;
          for (let k = j; k < this.playPlan.size; k++) {
            const secondPlay = this.playPlan.at(k);
            if (secondPlay && secondPlay.type === PlayType.Cash && secondPlay.suit === s && secondPlay.targetHand === oppHand) {
              pos = k;
            }
          }
          if (pos > j) {
            this.playPlan.move(j, pos);
            j--;
            numPlaysToExamine--;
            this.status?.stream(
              `4PINTLV10! Postpone the ${play.name} so the suit winners in ${declarerLong ? 'dummy' : 'hand'} are cashed first, to avoid possible stranding.\n`,
            );
          }
        }
      }
    }

    // *** Crossover Sequencing ***
    let crossForNextPlay = false;
    let strandedWinners = false;
    const firstPlay = this.playPlan.at(0);
    if (firstPlay) {
      const startingHand = firstPlay.startingHand;
      if (startingHand !== IN_EITHER && startingHand !== currentHand) {
        if (!(firstPlay.type === PlayType.Ruff && (firstPlay as Ruff).numDiscardsRequired > 0)) {
          crossForNextPlay = true;
        }
      }
    }

    let numStranded = 0;
    let numOppStranded = 0;
    for (let i = 0; i < 4; i++) {
      const cs = this.combinedHand.getSuit(i as Suit);
      const winners = playingInHand ? cs.numDeclarerWinners : cs.numDummyWinners;
      const noEntries = playingInHand ? cs.dummyLength === 0 : cs.declarerLength === 0;
      if (winners > 0 && noEntries) numStranded++;

      const oppWinners = playingInHand ? cs.numDummyWinners : cs.numDeclarerWinners;
      const oppNoEntries = playingInHand ? cs.declarerLength === 0 : cs.dummyLength === 0;
      if (oppWinners > 0 && oppNoEntries) numOppStranded++;
    }

    const haveEntryBack = playingInHand ? this.numDeclarerEntries > 0 : this.numDummyEntries > 0;
    if ((numStranded === 0 && numOppStranded > 0) || (numOppStranded > numStranded && haveEntryBack)) {
      strandedWinners = true;
    }
    if (numOppStranded > numStranded) {
      if (currentHand === IN_HAND && this.numDummyEntries > 1) strandedWinners = false;
      else if (currentHand === IN_DUMMY && this.numDeclarerEntries > 1) strandedWinners = false;
    }

    if ((crossForNextPlay || strandedWinners) && !this.crossedOnLastPlay && firstPlay) {
      const oppositeHand = playingInHand ? IN_DUMMY : IN_HAND;
      let foundIdx = -1;
      for (let i = 0; i < this.playPlan.size; i++) {
        const cp = this.playPlan.at(i)!;
        if (
          (cp.type === PlayType.TrumpPull || cp.type === PlayType.Ruff) &&
          cp.targetHand === oppositeHand &&
          cp.isWinner &&
          cp.suit !== firstPlay.suit &&
          this.isPlayUsable(cp, context, !playingInHand)
        ) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx === -1) {
        for (let i = 0; i < this.playPlan.size; i++) {
          const cp = this.playPlan.at(i)!;
          if (
            cp.type === PlayType.Cash &&
            cp.suit !== trumpSuit &&
            cp.targetHand === oppositeHand &&
            cp.isWinner &&
            cp.suit !== firstPlay.suit &&
            this.isPlayUsable(cp, context, !playingInHand)
          ) {
            foundIdx = i;
            break;
          }
        }
      }

      if (foundIdx >= 0) {
        const chosen = this.playPlan.at(foundIdx)!;
        if (chosen.type === PlayType.Cash) {
          let j = 0;
          while (j < foundIdx && this.playPlan.at(j)?.type === PlayType.TrumpPull) j++;
          if (j < foundIdx) {
            if (crossForNextPlay) {
              this.status?.stream(
                `3PINTLV70! Try to cross over to ${playingInHand ? 'dummy' : 'hand'} with the [${chosen.name}] when possible to use the [${firstPlay.name}].\n`,
              );
            } else {
              this.status?.stream(
                `3PINTLV70A! Try to cross over to ${playingInHand ? 'dummy' : 'hand'} with the [${chosen.name}] when possible to cash the stranded winners..\n`,
              );
            }
            this.playPlan.move(foundIdx, j);
            this.crossedOnLastPlay = true;
          }
        } else {
          if (crossForNextPlay) {
            this.status?.stream(
              `3PINTLV30! Use the [${chosen.name}] to cross over to ${playingInHand ? 'dummy' : 'hand'} to use the [${firstPlay.name}].\n`,
            );
          } else {
            this.status?.stream(
              `3PINTLV31! Use the [${chosen.name}] to cross over to ${playingInHand ? 'dummy' : 'hand'} to cash the stranded winners.\n`,
            );
          }
          this.playPlan.moveToFront(foundIdx);
          this.crossedOnLastPlay = true;
        }
      }
    } else {
      this.crossedOnLastPlay = false;
    }

    // *** Cash Sequencing ***
    let numIters = this.playPlan.size - 1;
    for (let i = this.playPlan.size - 1; i > 0 && numIters > 0; i--, numIters--) {
      const play = this.playPlan.at(i);
      if (!play || play.type !== PlayType.Cash || play.suit === trumpSuit || !isSuit(play.suit)) continue;
      const targetHand = play.targetHand;
      const suit = this.combinedHand.getSuit(play.suit);
      if (
        (targetHand === IN_HAND && currentHand === IN_HAND && suit.dummyLength === 0) ||
        (targetHand === IN_DUMMY && currentHand === IN_DUMMY && suit.declarerLength === 0)
      ) {
        this.status?.stream(
          `4PINTLV50! The cash of the ${play.consumedCard?.name ?? ''} can only be used here in ${currentHand === IN_HAND ? 'the hand' : 'dummy'} since there are no lead cards in the opposite hand -- so move up the play.\n`,
        );
        let behindTrump = false;
        let j = i;
        for (; j >= 0; j--) {
          if (this.playPlan.at(j)?.suit === trumpSuit) {
            behindTrump = true;
            break;
          }
        }
        if (j < 0) j = 0;
        if (j < i) {
          if (behindTrump) {
            if (j < i - 1) this.playPlan.move(i, j + 1);
          } else {
            this.playPlan.move(i, j);
          }
          i++;
        }
      }
    }
  }

  //
  // FilterPlays()
  //
  filterPlays(_playList: PlayList): number {
    // Matches C++: currently bypassed as it limits options
    return 0;
  }

  //
  // FindHoldUpPlays()
  //
  findHoldUpPlays(playList: PlayList, _excludeTrumpSuit = false, context: PlayRoundContext = {}): number {
    if (!this.combinedHand) return 0;
    const round = context.numTricksPlayed ?? context.playRound ?? this.round;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;

    if (isSuit(trumpSuit) || round >= 2) return 0;

    let previousHoldUp = 0;
    if (round === 1) {
      if (this.usedPlays.size === 0) return 0;
      const prevPlay = this.usedPlays.at(0);
      if (!prevPlay || prevPlay.type !== PlayType.HoldUp) return 0;
      previousHoldUp = 1;
    }

    const cardsInRound = context.numCardsPlayedInRound ?? this.numCardsPlayed;
    if (cardsInRound === 0) return 0;

    const leadCard = context.leadCard ?? this.leadCard;
    if (!leadCard) return 0;
    const suitLed = leadCard.suit;
    const suit = this.combinedHand.getSuit(suitLed);
    if (suit.length === 0) return 0;

    const topFace = suit.at(0)?.faceValue ?? 0;
    if (topFace !== ACE && topFace !== KING) return 0;
    if (suit.numMaxTopCards > 1 || suit.numWinners === 0) return 0;
    if ((round === 0 && suit.length < 6) || (round === 1 && suit.length < 4)) return 0;

    let numHoldUps = 2 - round;
    const contractLevel = context.contractLevel ?? bidLevel(this.contract);
    numHoldUps = Math.min(numHoldUps, 7 - contractLevel);
    if (numHoldUps <= 0) return 0;

    for (let i = 0; i < numHoldUps; i++) {
      playList.append(new HoldUp(suitLed));
    }

    this.status?.stream(
      `4PLNHLD5! ${numHoldUps}${previousHoldUp ? ' more' : ''} hold-up${numHoldUps > 1 ? 's' : ''} may be appropriate.\n`,
    );
    return numHoldUps;
  }

  //
  // FindCashingPlays()
  //
  findCashingPlays(playList: PlayList, excludeTrumpSuit = false, context: PlayRoundContext = {}): number {
    if (!this.combinedHand) return 0;

    const numTotalTopCards = this.combinedHand.numWinners;
    let tricksCount = 0;
    let numMaxCashes = 0;

    if (numTotalTopCards === 0) {
      this.status?.stream('4PLNCSH0! The hand has no top cards that can be cashed.\n');
      return 0;
    }

    let s: Suit = isSuit(this.trumpSuit) ? getNextSuit(this.trumpSuit) : Suit.Spades;
    this.status?.stream('4PLNCSH1! Looking at the hand for cashes...\n');

    const numOutstandingTrumps = isSuit(this.trumpSuit) ? this.getNumOutstandingCards(this.trumpSuit) : 0;
    const prospect = numOutstandingTrumps === 0 ? PlayProspect.GuaranteedWinner : PlayProspect.LikelyWinner;

    const numMaxSuitCashes = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      if (s === this.trumpSuit && excludeTrumpSuit) {
        s = getNextSuit(s);
        continue;
      }

      const suit = this.combinedHand.getSuit(s);
      const numSuitTopCards = suit.numWinners;
      numMaxSuitCashes[s] = Math.min(numSuitTopCards, suit.maxLength);
      numMaxCashes += numMaxSuitCashes[s];

      const outstandingCards = new CardList();
      this.getOutstandingCardsList(s, outstandingCards);

      const localPlayList = new PlayList();
      for (let j = 0; j < numSuitTopCards; j++) {
        const card = suit.at(j);
        if (!card) continue;
        const numHigherCards = outstandingCards.getNumCardsAbove(card);
        let reqPlayed: CardList | undefined;
        if (numHigherCards > 0) {
          reqPlayed = new CardList();
          for (let k = 0; k < numHigherCards; k++) {
            const oc = outstandingCards.at(k);
            if (oc) reqPlayed.add(oc);
          }
        }
        let startingHand = IN_EITHER;
        if (suit.declarerLength > 0 && suit.dummyLength === 0) startingHand = IN_HAND;
        else if (suit.dummyLength > 0 && suit.declarerLength === 0) startingHand = IN_DUMMY;

        localPlayList.append(new Cash(card, prospect, this.getCardOwner(card), startingHand, reqPlayed));
        tricksCount++;
      }

      if (numSuitTopCards > 0) {
        if (numMaxSuitCashes[s] === tricksCount) {
          this.status?.stream(
            `5PLNCSH3! We can cash ${numMaxSuitCashes[s]} ${numSuitTopCards > 1 ? 'cards' : 'card'} in ${Card.suitToString(s)}`,
          );
        } else {
          this.status?.stream(` ${numMaxSuitCashes[s]} in ${Card.suitToString(s)}`);
        }
        const limit = excludeTrumpSuit && isSuit(this.trumpSuit)
          ? numTotalTopCards - this.combinedHand.getSuit(this.trumpSuit).numTopCards
          : numTotalTopCards;
        if (tricksCount < limit) {
          this.status?.addTrace(', plus');
        }
      }

      playList.appendList(localPlayList);
      s = getNextSuit(s);
    }

    if (tricksCount > 0) {
      this.status?.addTrace('.\n');
    }

    // look for a delayed cashing trick
    let delayedTricksCount = 0;
    const cardsInRound = context.numCardsPlayedInRound ?? this.numCardsPlayed;
    const cardLed = context.leadCard ?? this.leadCard;
    if (cardsInRound === 1 && cardLed) {
      const suitLed = cardLed.suit;
      const suit = this.combinedHand.getSuit(suitLed);
      const dummy = suit.dummyCards;
      const declarer = suit.declarerCards;
      const missingTop = suit.topMissingSequence;
      const numTricksLeft = 13 - (context.numTricksPlayed ?? this.round);
      const isDummyTurn = context.isDummyTurn ?? false;

      if (suit.numMissingSequences > 0 && missingTop && missingTop.length === 1) {
        const missingCard = missingTop.at(0)!;
        if (
          isDummyTurn &&
          dummy.numWinners === 0 &&
          declarer.length >= 2 &&
          missingCard.faceValue - (declarer.at(0)?.faceValue ?? 0) === 1 &&
          numTricksLeft > this.numTricksLeftToBeMade
        ) {
          if (!playList.all.some(p => p.consumedCard?.deckValue === missingCard.deckValue)) {
            playList.append(
              new Cash(declarer.at(0)!, PlayProspect.LikelyWinner, IN_HAND, IN_DUMMY, undefined, NONE, true),
            );
            delayedTricksCount++;
          }
        } else if (
          !isDummyTurn &&
          declarer.numWinners === 0 &&
          dummy.length >= 2 &&
          missingCard.faceValue - (dummy.at(0)?.faceValue ?? 0) === 1 &&
          numTricksLeft > this.numTricksLeftToBeMade
        ) {
          if (!playList.all.some(p => p.consumedCard?.deckValue === missingCard.deckValue)) {
            playList.append(
              new Cash(dummy.at(0)!, PlayProspect.LikelyWinner, IN_DUMMY, IN_HAND, undefined, NONE, true),
            );
            delayedTricksCount++;
          }
        }
      }
    }

    if (numMaxCashes > 1) {
      this.status?.stream(`4PLNCSH30! A total of ${numMaxCashes} maximum cashing tricks are immediately available.\n`);
    } else if (numMaxCashes === 0) {
      this.status?.stream('4PLNCSH31! Only one cashing trick is immediately available.\n');
    }

    if (delayedTricksCount === 1) {
      const tailCard = playList.tail?.consumedCard;
      if (numMaxCashes > 0) {
        this.status?.stream(
          `4PLNCSH32! In addition, one delayed cash is also available with the ${tailCard?.name ?? ''}.\n`,
        );
      } else {
        this.status?.stream(
          `4PLNCSH22! One delayed cashing trick is available with the ${tailCard?.name ?? ''}.\n`,
        );
      }
    }

    return numMaxCashes + delayedTricksCount;
  }

  //
  // FormTrumpPullingPlan()
  //
  formTrumpPullingPlan(_mainPlayList: PlayList, trumpPlayList: PlayList): number {
    if (!this.combinedHand || !isSuit(this.trumpSuit)) return 0;

    this.status?.stream('4PLNTRMP! Evaluating the trumps situation...\n');

    const missingTrumps = new CardList();
    this.getOutstandingCardsList(this.trumpSuit, missingTrumps);
    this.numOutstandingTrumps = missingTrumps.length;

    const trumpHoldings = this.combinedHand.getSuit(this.trumpSuit);
    const numTrumpWinners = trumpHoldings.numWinners;
    const numDummyRuffs = this.numPlannedDummyRuffingTricks;
    const numDeclarerRuffs = this.numPlannedDeclarerRuffingTricks;
    const numTotalRuffs = this.numPlannedRuffingTricks;

    let numRequiredRuffs = Math.min(this.numTricksLeftToBeMade - this.numSureTricks, numTotalRuffs);
    let numPrevRequiredRuffs = numRequiredRuffs;
    let numRequiredDummyRuffs = 0;
    let numRequiredDeclarerRuffs = 0;
    let numSureTricks = this.numSureTricks;

    while (numRequiredRuffs > 0) {
      numRequiredRuffs = Math.min(numRequiredRuffs, numTotalRuffs);
      const diff = trumpHoldings.lengthDiff;
      if (diff >= 0) {
        numRequiredDummyRuffs = Math.min(numDummyRuffs, numRequiredRuffs);
        numRequiredRuffs -= numRequiredDummyRuffs;
        numRequiredDeclarerRuffs = Math.min(numDeclarerRuffs, numRequiredRuffs);
        if (numRequiredDeclarerRuffs <= diff) {
          numSureTricks = this.numSureTricks - numRequiredDeclarerRuffs;
        }
      } else {
        numRequiredDeclarerRuffs = Math.min(numDeclarerRuffs, numRequiredRuffs);
        numRequiredRuffs -= numRequiredDeclarerRuffs;
        numRequiredDummyRuffs = Math.min(numDummyRuffs, numRequiredRuffs);
        if (numRequiredDummyRuffs <= Math.abs(diff)) {
          numSureTricks = this.numSureTricks - numRequiredDummyRuffs;
        }
      }

      numRequiredRuffs = this.numTricksLeftToBeMade - numSureTricks;
      if (numRequiredRuffs === numPrevRequiredRuffs) break;
      numPrevRequiredRuffs = numRequiredRuffs;
    }

    const numDummyExcessTrumps = this.numDummyTrumps - numRequiredDummyRuffs;
    const numDeclarerExcessTrumps = this.numDeclarerTrumps - numRequiredDeclarerRuffs;

    let numSafeTrumpRounds: number;
    if (numSureTricks >= this.numTricksLeftToBeMade) {
      numSafeTrumpRounds = Math.max(this.numDeclarerTrumps, this.numDummyTrumps);
    } else {
      if (numDummyRuffs > 0 && numDeclarerRuffs > 0) {
        numSafeTrumpRounds = Math.min(numDummyExcessTrumps, numDeclarerExcessTrumps);
      } else if (numDummyRuffs > 0) {
        numSafeTrumpRounds = numDummyExcessTrumps;
      } else if (numDeclarerRuffs > 0) {
        numSafeTrumpRounds = numDeclarerExcessTrumps;
      } else {
        numSafeTrumpRounds = 0;
      }
      numSafeTrumpRounds = Math.min(numSafeTrumpRounds, numTrumpWinners);
    }

    const numTrumpPulls = Math.max(0, Math.min(numSafeTrumpRounds, this.numOutstandingTrumps));

    if (numSafeTrumpRounds <= 0) {
      this.status?.stream('3PLNTRMP4! We cannot safely play any trumps without endangering the contract.\n');
    } else {
      this.status?.stream(
        `3PLNTRMP5! We can safely play up to ${numSafeTrumpRounds} ${numSafeTrumpRounds > 1 ? 'rounds' : 'round'} of trumps without endangering the contract.\n`,
      );
      if (numSafeTrumpRounds > this.numOutstandingTrumps) {
        if (this.numOutstandingTrumps === 1) {
          this.status?.stream(
            '3PLNTRMP6! However, we only need to pull one round to collect the single outstanding trump.\n',
          );
        } else {
          this.status?.stream(
            `3PLNTRMP6! However, we only need to pull a maximum of ${this.numOutstandingTrumps} rounds to collect all the outstanding trumps.\n`,
          );
        }
      } else if (numSafeTrumpRounds === this.numOutstandingTrumps) {
        if (this.numOutstandingTrumps === 1) {
          this.status?.stream('3PLNTRMP7! This will pull in the single outstanding trump.\n');
        } else {
          this.status?.stream(
            `3PLNTRMP7! This will pull in all ${this.numOutstandingTrumps} outstanding trumps.\n`,
          );
        }
      } else {
        this.status?.stream(
          `3PLNTRMP8! However, this may not pull in all ${this.numOutstandingTrumps} outstanding trump(s).\n`,
        );
      }
    }

    const numSideCashingTricks = this.numPlannedCashingTricks - trumpHoldings.numMaxWinners;
    this.status?.stream(
      `3PLNTRMP9! This will result in ${numTrumpPulls === 1 ? ' ' : '(up to) '}${numTrumpPulls} round${numTrumpPulls === 1 ? ' ' : 's '}of trumps`,
    );
    if (numSideCashingTricks > 0) {
      this.status?.addTrace(
        `, ${numSideCashingTricks} cashing trick${numSideCashingTricks > 1 ? 's ' : ' '}in the side suits,`,
      );
    }
    this.status?.addTrace(` and up to ${numTotalRuffs} ruffing trick${numTotalRuffs === 1 ? '.\n' : 's.\n'}`);

    const minReqdTrumpRounds = Math.ceil(this.numOutstandingTrumps / 2);
    for (let i = 0; i < numTrumpPulls; i++) {
      const card = trumpHoldings.at(i);
      if (!card) continue;
      const numHigherTrumps = missingTrumps.getNumCardsAbove(card);
      let reqPlayed: CardList | undefined;
      if (numHigherTrumps > 0) {
        reqPlayed = new CardList();
        for (let k = 0; k < numHigherTrumps; k++) {
          const mt = missingTrumps.at(k);
          if (mt) reqPlayed.add(mt);
        }
      }
      trumpPlayList.append(
        new TrumpPull(
          card,
          this.getCardOwner(card),
          NONE,
          reqPlayed,
          new CardList(missingTrumps.all),
          i < numTrumpWinners,
          i >= minReqdTrumpRounds,
        ),
      );
    }

    return numTrumpPulls;
  }

  //
  // FormTrumpFinessePlan()
  //
  formTrumpFinessePlan(_mainPlayList: PlayList, trumpPlayList: PlayList, context: PlayRoundContext = {}): number {
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    if (!isSuit(trumpSuit) || !this.combinedHand) return 0;

    const suit = this.combinedHand.getSuit(trumpSuit);
    let numTrumpFinesses = this.findFinessesInSuit(suit, trumpPlayList, context);

    for (let i = 0; i < trumpPlayList.size; i++) {
      const play = trumpPlayList.at(i) as Finesse;
      if (play.subType !== FinesseSubType.TypeI && play.subType !== FinesseSubType.TypeII) {
        trumpPlayList.remove(i);
        i--;
        numTrumpFinesses--;
      }
    }

    for (let i = 0; i < trumpPlayList.size; i++) {
      const play = trumpPlayList.at(i) as Finesse;
      const targetPos = play.targetPos;
      if (!isPosition(targetPos) || !this.guessedHands[targetPos]?.getSuit(trumpSuit).isSuitShownOut) {
        trumpPlayList.remove(i);
        i--;
        numTrumpFinesses--;
      }
    }

    return numTrumpFinesses;
  }

  //
  // FindRuffingPlays()
  //
  findRuffingPlays(playList: PlayList, context: PlayRoundContext = {}): number {
    if (!this.combinedHand || !this.hand || !this.partnersHand || !isSuit(this.trumpSuit)) return 0;

    const ruffCandidates: RuffInfo[] = [];
    let numTotalPossibleRuffs = 0;
    this.numDeclarerTrumps = this.hand.getNumCardsInSuit(this.trumpSuit);
    this.numDummyTrumps = this.partnersHand.getNumCardsInSuit(this.trumpSuit);

    this.status?.stream('4PLNRF0! Looking for ruffing tricks...\n');

    const cardLed = context.leadCard ?? this.leadCard;
    if (cardLed && cardLed.suit !== this.trumpSuit) {
      const suitLed = cardLed.suit;
      if (this.partnersHand.getSuit(suitLed).length === 0 && this.numDummyTrumps > 0) {
        ruffCandidates.push({
          numRuffs: 1,
          numDiscardsRequired: 0,
          suit: suitLed,
          discardSuit: suitLed,
          direction: IN_DUMMY,
        });
        numTotalPossibleRuffs++;
      }
      if (this.hand.getSuit(suitLed).length === 0 && this.numDeclarerTrumps > 0) {
        ruffCandidates.push({
          numRuffs: 1,
          numDiscardsRequired: 0,
          suit: suitLed,
          discardSuit: suitLed,
          direction: IN_HAND,
        });
        numTotalPossibleRuffs++;
      }
    }

    let s: Suit = Suit.Clubs;
    for (let i = 0; i < 4; i++) {
      if (s === this.trumpSuit) {
        s = getPrevSuit(s);
        continue;
      }

      const suit = this.combinedHand.getSuit(s);
      const lengthDiff = suit.lengthDiff;
      if (suit.numLosers > 0) {
        let numRuffsFromHand = 0;
        let numRuffsFromDummy = 0;
        let numPossibleRuffs = Math.min(Math.abs(lengthDiff), suit.numLosers);
        if (numPossibleRuffs > 0) {
          numPossibleRuffs = Math.min(
            numPossibleRuffs,
            lengthDiff > 0 ? this.numDummyTrumps : this.numDeclarerTrumps,
          );
          if (numPossibleRuffs > 0) {
            if (lengthDiff > 0) {
              const discardsReq = Math.max(0, suit.dummyLength - suit.numWinners);
              ruffCandidates.push({
                numRuffs: numPossibleRuffs,
                numDiscardsRequired: discardsReq,
                suit: s,
                discardSuit: s,
                direction: IN_DUMMY,
              });
              numRuffsFromHand = numPossibleRuffs;
            } else {
              const discardsReq = Math.max(0, suit.declarerLength - suit.numWinners);
              ruffCandidates.push({
                numRuffs: numPossibleRuffs,
                numDiscardsRequired: discardsReq,
                suit: s,
                discardSuit: s,
                direction: IN_HAND,
              });
              numRuffsFromDummy = numPossibleRuffs;
            }
            numTotalPossibleRuffs += numPossibleRuffs;
          }
        }

        const numLeft = suit.maxLength - numPossibleRuffs;
        let numDummyLosers = suit.numDummyLosers - numRuffsFromDummy;
        let numDeclarerLosers = suit.numDeclarerLosers - numRuffsFromHand;
        if (numLeft > 0 && numDummyLosers > 0 && numDeclarerLosers > 0) {
          const ruffFromHand = !(lengthDiff < 0 || this.numDummyTrumps > this.numDeclarerTrumps);
          for (let j = Suit.Clubs; j <= Suit.Spades; j++) {
            if (j === this.trumpSuit) continue;
            const testSuit = this.combinedHand.getSuit(j as Suit);
            const outsideLenDiff = testSuit.lengthDiff;
            const outsideWinDiff = testSuit.winnersDiff;
            if (outsideLenDiff > 0 && outsideWinDiff > 0 && numDeclarerLosers > 0 && numDummyLosers > 0 && ruffFromHand) {
              const maxRuffs = Math.min(numDeclarerLosers, this.numDummyTrumps);
              ruffCandidates.push({
                numRuffs: maxRuffs,
                numDiscardsRequired: numDummyLosers,
                suit: s,
                discardSuit: s,
                direction: IN_DUMMY,
              });
              numDummyLosers -= maxRuffs;
              numDeclarerLosers -= maxRuffs;
              numTotalPossibleRuffs += maxRuffs;
            } else if (
              outsideLenDiff < 0 &&
              outsideWinDiff < 0 &&
              numDeclarerLosers > 0 &&
              numDummyLosers > 0 &&
              !ruffFromHand
            ) {
              const maxRuffs = Math.min(numDummyLosers, this.numDeclarerTrumps);
              ruffCandidates.push({
                numRuffs: maxRuffs,
                numDiscardsRequired: numDeclarerLosers,
                suit: s,
                discardSuit: s,
                direction: IN_HAND,
              });
              numDeclarerLosers -= maxRuffs;
              numDummyLosers -= maxRuffs;
              numTotalPossibleRuffs += maxRuffs;
            }
          }
        }
      }

      s = getPrevSuit(s);
    }

    // deduplicate by (suit, direction)
    const uniqueCandidates: RuffInfo[] = [];
    for (const rc of ruffCandidates) {
      if (!uniqueCandidates.some(u => u.suit === rc.suit && u.direction === rc.direction)) {
        uniqueCandidates.push(rc);
      }
    }

    // sort by fewer discards required
    uniqueCandidates.sort((a, b) => a.numDiscardsRequired - b.numDiscardsRequired);

    let numDummyTrumpsLeft = Math.max(0, this.numDummyTrumps);
    let numDeclarerTrumpsLeft = Math.max(0, this.numDeclarerTrumps);
    let numDummyRuffs = 0;
    let numDeclarerRuffs = 0;
    let numTotalRuffs = 0;
    let numTotalSluffs = 0;
    let lastMaxRuffs = 0;

    const numOutstandingTrumps = this.getNumOutstandingCards(this.trumpSuit);
    const prospect = numOutstandingTrumps === 0 ? PlayProspect.GuaranteedWinner : PlayProspect.LikelyWinner;

    for (const rc of uniqueCandidates) {
      let maxRuffs = 0;
      if (rc.direction === IN_DUMMY) {
        maxRuffs = Math.min(rc.numRuffs, numDummyTrumpsLeft);
        rc.numRuffs = maxRuffs;
        numDummyTrumpsLeft -= maxRuffs;
        numDummyRuffs += maxRuffs;
        this.numPlannedDummyRuffsInSuit[rc.suit]++;
        this.numPlannedTotalRuffsInSuit[rc.suit]++;

        const suit = this.partnersHand.getSuit(rc.discardSuit);
        for (let j = 0; j < rc.numDiscardsRequired; j++) {
          const c = suit.at(suit.length - 1 - j);
          if (c && !this.dummyPriorityDiscards.hasCard(c) && !this.dummyDiscardedPriorityDiscards.hasCard(c)) {
            this.dummyPriorityDiscards.add(c);
          }
        }
      } else {
        maxRuffs = Math.min(rc.numRuffs, numDeclarerTrumpsLeft);
        rc.numRuffs = maxRuffs;
        numDeclarerTrumpsLeft -= maxRuffs;
        numDeclarerRuffs += maxRuffs;
        this.numPlannedDeclarerRuffsInSuit[rc.suit]++;
        this.numPlannedTotalRuffsInSuit[rc.suit]++;

        const suit = this.hand.getSuit(rc.discardSuit);
        for (let j = 0; j < rc.numDiscardsRequired; j++) {
          const c = suit.at(suit.length - 1 - j);
          if (c && !this.declarerPriorityDiscards.hasCard(c) && !this.declarerDiscardedPriorityDiscards.hasCard(c)) {
            this.declarerPriorityDiscards.add(c);
          }
        }
      }

      lastMaxRuffs = maxRuffs;
      for (let j = 0; j < maxRuffs; j++) {
        playList.append(new Ruff(rc.suit, rc.direction, rc.numDiscardsRequired, prospect));
      }

      this.status?.stream(
        `4PLNRF1! We can potentially ruff up to ${rc.numRuffs} ${rc.numRuffs > 1 ? Card.suitToString(rc.suit) : Card.suitToSingularString(rc.suit)}`,
      );
      this.status?.addTrace(rc.direction === IN_DUMMY ? ' in dummy' : ' in hand');
      if (rc.numDiscardsRequired > 0) {
        this.status?.addTrace(
          ` after discarding the ${rc.numDiscardsRequired} ${rc.numDiscardsRequired > 1 ? 'losers' : 'loser'} from ${rc.direction === IN_DUMMY ? 'dummy' : 'hand'}.\n`,
        );
      } else {
        this.status?.addTrace('.\n');
      }

      numTotalRuffs += maxRuffs;
      numTotalSluffs += rc.numDiscardsRequired;
    }

    this.numPlannedDeclarerRuffingTricks = numDeclarerRuffs;
    this.numPlannedDummyRuffingTricks = numDummyRuffs;

    if (numTotalRuffs === 0) {
      this.status?.stream('5PLNRF4! No immediate ruffing tricks are available.\n');
    } else if (numTotalRuffs !== lastMaxRuffs) {
      this.status?.stream(
        `4PLNRF5! Up to ${numTotalRuffs} ruffs can be used (${numDummyRuffs} in dummy/${numDeclarerRuffs} in hand) out of a total of ${numTotalPossibleRuffs} available`,
      );
      if (numTotalSluffs === 0) {
        this.status?.addTrace('.\n');
      } else {
        this.status?.addTrace(`, but require ${numTotalSluffs} discard(s) first.\n`);
        this.status?.stream('5PLNRF8! This consists of the { ');
        if (this.dummyPriorityDiscards.length > 0) {
          this.status?.addTrace(`${this.dummyPriorityDiscards.holdingsString}} from dummy`);
        }
        if (this.declarerPriorityDiscards.length > 0) {
          if (this.dummyPriorityDiscards.length > 0) this.status?.addTrace(' and the { ');
          this.status?.addTrace(`${this.declarerPriorityDiscards.holdingsString}} from hand.\n`);
        } else {
          this.status?.addTrace('.\n');
        }
      }
    }

    return numTotalRuffs;
  }

  //
  // FindSuitDevelopmentPlays()
  //
  findSuitDevelopmentPlays(forcePlayList: PlayList, secondaryCashList: PlayList): number {
    if (!this.combinedHand) return 0;

    let numTotalForces = 0;
    let numSecondaryCashes = 0;
    const opportunities: DevOpportunity[] = [];

    this.status?.stream('4PLNDEV0! Looking for ways to force out enemy top cards and promote our own......\n');

    let s: Suit = Suit.Spades;
    for (let z = 0; z < 4; z++) {
      s = getNextSuit(s);
      if (s === this.trumpSuit) continue;

      const suit = this.combinedHand.getSuit(s);
      if (suit.length === 0) continue;

      const numWinners = suit.numTopCards;
      const longHand = Math.max(suit.declarerLength, suit.dummyLength);
      const extra = longHand - numWinners;

      const outstandingCards = new CardList();
      let numOutstandingCards = this.getOutstandingCardsList(s, outstandingCards);
      for (let i = 0; i < numWinners; i++) {
        if (numOutstandingCards > 0) {
          const bottom = outstandingCards.bottomCard;
          if (bottom) outstandingCards.remove(bottom);
          numOutstandingCards--;
        } else {
          break;
        }
      }
      if (numOutstandingCards === 0) continue;

      const numOpponentWinners = Math.min(suit.maxLength - suit.numMaxWinners, numOutstandingCards);
      let numForces = extra > numOpponentWinners ? numOpponentWinners : 0;
      const numResiduals = suit.length - numWinners - numForces;

      const firstRemPos = numWinners + numForces;
      if (
        numForces > 0 &&
        numOutstandingCards > numForces &&
        (suit.at(firstRemPos)?.faceValue ?? 0) < (outstandingCards.at(numForces)?.faceValue ?? 0)
      ) {
        numForces = 0;
      }

      let singletonWinner = false;
      const declarerSuit = suit.declarerCards;
      const dummySuit = suit.dummyCards;
      if (suit.numTopCards > 0 && suit.topSequence) {
        if (
          (declarerSuit.length === 1 && declarerSuit.at(0) && suit.topSequence.hasCard(declarerSuit.at(0)!)) ||
          (dummySuit.length === 1 && dummySuit.at(0) && suit.topSequence.hasCard(dummySuit.at(0)!))
        ) {
          singletonWinner = true;
        }
      }
      if (singletonWinner) continue;

      if (numForces > 0) {
        opportunities.push({ suit: s, numForces, numWinners, numResiduals, longHand });
      }
    }

    opportunities.sort((a, b) => {
      if (a.numForces !== b.numForces) return a.numForces - b.numForces;
      return b.numResiduals - a.numResiduals;
    });

    // for now, try to develop only one suit at a time
    const selected = opportunities.slice(0, 1);
    const numOutstandingTrumps = isSuit(this.trumpSuit) ? this.getNumOutstandingCards(this.trumpSuit) : 0;
    const prospect = numOutstandingTrumps === 0 ? PlayProspect.GuaranteedWinner : PlayProspect.LikelyWinner;

    for (const opp of selected) {
      const suit = this.combinedHand.getSuit(opp.suit);
      const outstandingCards = new CardList();
      this.getOutstandingCardsList(opp.suit, outstandingCards);
      if (outstandingCards.length === 0) continue;

      const lastCard = suit.getHighestCardBelow(outstandingCards.at(0)!);
      for (let j = 0; j < opp.numForces; j++) {
        const targetCard = outstandingCards.at(j);
        const card = lastCard ? suit.getHighestCardBelow(lastCard) : suit.bottomCard;
        if (!targetCard || !card) continue;
        forcePlayList.append(new Force(card, this.getCardOwner(card), targetCard.faceValue));
        this.status?.stream(
          `5PLNDEV30! We can play the ${card.fullName} to force out the opponents' ${targetCard.faceName}.\n`,
        );
      }

      numTotalForces += opp.numForces;
      this.numPlannedForcePlaysInSuit[opp.suit] = opp.numForces;

      this.status?.stream('5PLNDEV31! This will promote the ');
      const startIdx = opp.numWinners + opp.numForces;
      const numLeftOver = opp.longHand - startIdx;
      for (let j = startIdx; j < opp.longHand; j++) {
        const card = suit.at(j);
        if (!card) continue;
        const numHigherCards = outstandingCards.getNumCardsAbove(card);
        let reqPlayed: CardList | undefined;
        if (numHigherCards > 0) {
          reqPlayed = new CardList();
          for (let k = 0; k < numHigherCards; k++) {
            const oc = outstandingCards.at(k);
            if (oc) reqPlayed.add(oc);
          }
        }
        secondaryCashList.append(new Cash(card, prospect, this.getCardOwner(card), IN_EITHER, reqPlayed));
        numSecondaryCashes++;
        this.numPlannedSecondaryCashPlays++;
        this.numPlannedSecondaryCashPlaysInSuit[opp.suit]++;
        this.status?.addTrace(card.faceName);
        if (numLeftOver > 2 && j < opp.longHand - 2) this.status?.addTrace(', ');
        else if (numLeftOver > 2 && j === opp.longHand - 2) this.status?.addTrace(', and ');
        else if (j === opp.longHand - 2) this.status?.addTrace(' and ');
        else if (numLeftOver > 1) this.status?.addTrace(' to winners.\n');
        else this.status?.addTrace(' to a winner.\n');
      }
    }

    if (numTotalForces > 1) {
      this.status?.stream(
        `4PLNDEV90! A total of ${numTotalForces} forcing plays have been found, which will promote ${numSecondaryCashes} lower card${numSecondaryCashes > 1 ? 's.\n' : '.\n'}`,
      );
    } else if (numTotalForces === 1) {
      this.status?.stream(
        `4PLNDEV91! One forcing play has been found, which will promote ${numSecondaryCashes} lower card${numSecondaryCashes > 1 ? 's.\n' : '.\n'}`,
      );
    } else {
      this.status?.stream('4PLNDEV95! No suit development plays have been found.\n');
    }

    return numTotalForces;
  }

  //
  // FindDropPlays()
  //
  findDropPlays(playList: PlayList): number {
    if (!this.combinedHand) return 0;

    let tricksCount = 0;
    let s: Suit = isSuit(this.trumpSuit) ? getNextSuit(this.trumpSuit) : Suit.Spades;
    this.status?.stream('5PLNDRP1! Looking at the hand for drop plays...\n');

    for (let z = 0; z < 4; z++, s = getNextSuit(s)) {
      if (s === this.trumpSuit) continue;
      if (isPosition(this.position) && this.getNumCardsPlayedInSuit(this.position, s) >= 2) continue;

      const suit = this.combinedHand.getSuit(s);
      const declarer = suit.declarerCards;
      const numSuitTopCards = suit.numTopCards;
      if (numSuitTopCards === 0 || numSuitTopCards > 2) continue;

      const numMissingHonors = suit.numMissingHonors;
      if (numMissingHonors === 0) continue;

      const missingCards = new CardList();
      const numOutstandingCards = this.getOutstandingCardsList(s, missingCards);
      if (numOutstandingCards > numSuitTopCards * 2 || numOutstandingCards > 4) continue;

      const numPlays = Math.min(numSuitTopCards, numMissingHonors);
      const bottomTopCard = suit.at(numSuitTopCards - 1);
      if (!bottomTopCard) continue;

      for (let j = 0; j < numPlays; j++) {
        const enemyOrCards = new CardList();
        for (let k = 0; k < numMissingHonors; k++) {
          const deckVal = bottomTopCard.deckValue - 1 - k;
          if (deckVal >= 0) enemyOrCards.add(Card.fromDeckValue(deckVal));
        }

        const consumedCard = suit.at(j);
        if (!consumedCard) continue;
        const targetHand = declarer.hasCard(consumedCard) ? IN_HAND : IN_DUMMY;
        playList.append(new Drop(consumedCard, targetHand, AGAINST_EITHER, enemyOrCards));
        tricksCount++;

        if (numMissingHonors === 1) {
          this.status?.stream(
            `5PLNDRP1! Can play the ${consumedCard.fullName} in ${targetHand === IN_HAND ? 'hand' : 'dummy'} to try and drop the opponents' ${enemyOrCards.at(0)?.faceName ?? ''}.\n`,
          );
        } else {
          this.status?.stream(
            `5PLNDRP1a! Can play the ${consumedCard.fullName} in ${targetHand === IN_HAND ? 'hand' : 'dummy'} to try and drop one or more of the opponents' { ${enemyOrCards.holdingsString} }.\n`,
          );
        }
      }

      this.numPlannedDropPlaysInSuit[s] = numPlays;
    }

    if (tricksCount > 1) {
      this.status?.stream(`4PLNDRP5! A total of ${tricksCount} possible drop plays are available.\n`);
    } else if (tricksCount === 1) {
      this.status?.stream('4PLNDRP5! One drop play is available.\n');
    } else {
      this.status?.stream('4PLNDRP5! No drop plays are available.\n');
    }

    return tricksCount;
  }

  //
  // FindFinessePlays()
  //
  findFinessePlays(playList: PlayList, context: PlayRoundContext = {}): number {
    if (!this.combinedHand) return 0;

    let numTotalFinesses = 0;
    this.status?.stream('4PLNFNS0! Looking for possible finesses...\n');
    if (this.combinedHand.numMissingHonors === 0) {
      this.status?.stream('4PLNFNS1! The hand offers no apparent finessing opportunities.\n');
      return 0;
    }

    let s: Suit = Suit.Clubs;
    for (let z = 0; z < 4; z++) {
      if (s === this.trumpSuit) {
        s = getPrevSuit(s);
        continue;
      }
      const suit = this.combinedHand.getSuit(s);
      const suitPlayList = new PlayList();
      const nSuitFinesses = this.findFinessesInSuit(suit, suitPlayList, context);
      if (nSuitFinesses > 0) {
        numTotalFinesses += nSuitFinesses;
        playList.appendList(suitPlayList);
      }
      s = getPrevSuit(s);
    }

    if (numTotalFinesses > 1) {
      this.status?.stream(`4PLNFNS90! A total of ${numTotalFinesses} possible finesses exist.\n`);
    } else if (numTotalFinesses === 1) {
      this.status?.stream('4PLNFNS91! One possible finesse has been found.\n');
    } else {
      this.status?.stream('4PLNFNS95! No immediate finesses have been found.\n');
    }

    return numTotalFinesses;
  }

  //
  // FindFinessesInSuit()
  //
  findFinessesInSuit(suit: CombinedSuitHoldings, playList: PlayList, context: PlayRoundContext = {}): number {
    const dummy = suit.dummyCards;
    const declarer = suit.declarerCards;
    const s = suit.suit;
    if (!isSuit(s)) return 0;

    if (suit.numMissingHonors === 0) return 0;
    if (suit.isVoid) return 0;

    let numFinesses = 0;
    const topSequence = suit.topSequence;
    let dummyCoverCards: CardList | null = null;
    let declarerCoverCards: CardList | null = null;
    let dummyHasCommandingCard = false;
    let declarerHasCommandingCard = false;

    const highestOut = this.getHighestOutstandingCard(s);
    if (topSequence && topSequence.length > 0 && highestOut && (topSequence.at(0)?.faceValue ?? 0) > highestOut.faceValue) {
      if (dummy.length > 0 && dummy.topCard && topSequence.rangeCovers(dummy.topCard)) {
        dummyHasCommandingCard = true;
        dummyCoverCards = dummy.topSequence ?? null;
      }
      if (declarer.length > 0 && declarer.topCard && topSequence.rangeCovers(declarer.topCard)) {
        declarerHasCommandingCard = true;
        declarerCoverCards = declarer.topSequence ?? null;
      }
    }

    const numDeclarerLosers = suit.numDeclarerLosers;
    const numDummyLosers = suit.numDummyLosers;
    const maxLength = Math.max(suit.declarerLength, suit.dummyLength);
    const haveLosers = suit.numWinners < maxLength;

    if (haveLosers && suit.numMissingInternalHonors > 0) {
      // Type I Finesse in dummy
      if (dummyHasCommandingCard && dummyCoverCards && dummy.numMissingInternalHonors > 0 && declarer.numBodyCards > 0) {
        const lhoShownOut = isPosition(this.position)
          ? (this.guessedHands[nextPosition(this.position)]?.isSuitShownOut(s) ?? false)
          : false;
        if (!lhoShownOut && dummy.topSequence?.bottomCard) {
          const seq = new CardList();
          const numCandidates = dummy.getAllCardsBelow(dummy.topSequence.bottomCard, seq);
          const numMaxFinesses = Math.min(numCandidates, numDeclarerLosers);
          for (let i = numMaxFinesses - 1; i >= 0; i--) {
            const finesseCard = seq.at(i);
            const coverBottom = dummyCoverCards.bottomCard;
            if (!finesseCard || !coverBottom) continue;
            const gap = coverBottom.faceValue - finesseCard.faceValue - 1;
            const gapCards = new CardList();
            for (let j = 0; j < gap; j++) {
              gapCards.add(Card.fromDeckValue(finesseCard.deckValue + 1 + j));
            }
            const numGapCards = this.getNumGapCardsOutstanding(s, gapCards);
            if (numGapCards === 0) break;
            if (numGapCards > 2) continue;

            const leadCards = new CardList();
            const startIdx = Math.max(0, declarer.length - numDeclarerLosers);
            for (let k = startIdx; k < declarer.length; k++) {
              const lc = declarer.at(k);
              if (lc && !suit.areEquivalentCards(finesseCard, lc)) leadCards.add(lc);
            }
            if (leadCards.isEmpty) break;

            playList.append(
              new Type1Finesse(finesseCard, {
                playerPosition: this.position,
                targetHand: IN_DUMMY,
                gapCards,
                coverCards: new CardList(dummyCoverCards.all),
                leadCards,
                trumpSuit: this.trumpSuit,
              }),
            );
            this.numPlannedFinessesInSuit[s]++;
            if (dummyCoverCards.length === 1) {
              this.status?.stream(
                `5PSFNS10! Can finesse the ${finesseCard.fullName} in dummy with the ${dummyCoverCards.at(0)?.faceName ?? ''} as the potential cover card.\n`,
              );
            } else {
              this.status?.stream(
                `5PSFNS10! Can finesse the ${finesseCard.fullName} in dummy with the { ${dummyCoverCards.holdingsString} } as the potential cover carsd.\n`,
              );
            }
            numFinesses++;
          }
        }
      }

      // Type I Finesse in hand
      if (declarerHasCommandingCard && declarerCoverCards && declarer.numMissingInternalHonors > 0 && dummy.numBodyCards > 0) {
        if (declarer.topSequence?.bottomCard) {
          const seq = new CardList();
          const numCandidates = declarer.getAllCardsBelow(declarer.topSequence.bottomCard, seq);
          const numMaxFinesses = Math.min(numCandidates, numDummyLosers);
          for (let i = numMaxFinesses - 1; i >= 0; i--) {
            const finesseCard = seq.at(i);
            const coverBottom = declarerCoverCards.bottomCard;
            if (!finesseCard || !coverBottom) continue;
            const gap = coverBottom.faceValue - finesseCard.faceValue - 1;
            const gapCards = new CardList();
            for (let j = 0; j < gap; j++) {
              gapCards.add(Card.fromDeckValue(finesseCard.deckValue + 1 + j));
            }
            const numGapCards = this.getNumGapCardsOutstanding(s, gapCards);
            if (numGapCards === 0) break;
            if (numGapCards > 2) continue;

            const leadCards = new CardList();
            const startIdx = Math.max(0, dummy.length - numDummyLosers);
            for (let k = startIdx; k < dummy.length; k++) {
              const lc = dummy.at(k);
              if (lc && !suit.areEquivalentCards(finesseCard, lc)) leadCards.add(lc);
            }
            if (leadCards.isEmpty) break;

            playList.append(
              new Type1Finesse(finesseCard, {
                playerPosition: this.position,
                targetHand: IN_HAND,
                gapCards,
                coverCards: new CardList(declarerCoverCards.all),
                leadCards,
                trumpSuit: this.trumpSuit,
              }),
            );
            this.numPlannedFinessesInSuit[s]++;
            if (declarerCoverCards.length === 1) {
              this.status?.stream(
                `5PSFNS11! Can finesse the ${finesseCard.fullName} in hand with the ${declarerCoverCards.at(0)?.faceName ?? ''} as the potential cover card.\n`,
              );
            } else {
              this.status?.stream(
                `5PSFNS11! Can finesse the ${finesseCard.fullName} in hand with the { ${declarerCoverCards.holdingsString} } as the potential cover cards.\n`,
              );
            }
            numFinesses++;
          }
        }
      }

      // Type II Finesse from hand towards dummy
      if (dummyHasCommandingCard && dummyCoverCards && declarer.length > 0 && topSequence) {
        let sourceSeq: CardList | null = null;
        if (declarer.topCard && topSequence.rangeCovers(declarer.topCard)) {
          if (declarer.numSequences > 1 && (declarer.secondSequence?.length ?? 0) > 1) {
            sourceSeq = declarer.secondSequence ?? null;
          }
        } else if ((declarer.topSequence?.length ?? 0) > 1) {
          sourceSeq = declarer.topSequence ?? null;
        }
        if (sourceSeq && dummyCoverCards.bottomCard) {
          for (let i = sourceSeq.length - 2; i >= 0; i--) {
            const finesseCard = sourceSeq.at(i);
            if (!finesseCard) continue;
            const topEquiv = suit.getHighestEquivalentCard(finesseCard) ?? finesseCard;
            const gap = dummyCoverCards.bottomCard.faceValue - topEquiv.faceValue - 1;
            const gapCards = new CardList();
            for (let j = 0; j < gap; j++) {
              gapCards.add(Card.fromDeckValue(topEquiv.deckValue + 1 + j));
            }
            if (this.getNumGapCardsOutstanding(s, gapCards) === 0) break;

            playList.append(
              new Type2Finesse(finesseCard, {
                playerPosition: this.position,
                targetHand: IN_HAND,
                gapCards,
                coverCards: new CardList(dummyCoverCards.all),
                trumpSuit: this.trumpSuit,
              }),
            );
            this.numPlannedFinessesInSuit[s]++;
            if (dummyCoverCards.length === 1) {
              this.status?.stream(
                `5PSFNS20! Can finesse the ${finesseCard.fullName} by leading it from hand, with the ${dummyCoverCards.at(0)?.faceName ?? ''} as the potential cover card in dummy.\n`,
              );
            } else {
              this.status?.stream(
                `5PSFNS20! Can finesse the ${finesseCard.fullName} by leading it from hand, with the { ${dummyCoverCards.holdingsString} } as the potential cover cards in dummy.\n`,
              );
            }
            numFinesses++;
          }
        }
      }

      // Type II Finesse from dummy towards hand
      if (declarerHasCommandingCard && declarerCoverCards && dummy.length > 0 && topSequence) {
        let sourceSeq: CardList | null = null;
        if (dummy.topCard && topSequence.rangeCovers(dummy.topCard)) {
          if (dummy.numSequences > 1 && (dummy.secondSequence?.length ?? 0) > 1) {
            sourceSeq = dummy.secondSequence ?? null;
          }
        } else if ((dummy.topSequence?.length ?? 0) > 1) {
          sourceSeq = dummy.topSequence ?? null;
        }
        if (sourceSeq && declarerCoverCards.bottomCard) {
          for (let i = sourceSeq.length - 2; i >= 0; i--) {
            const finesseCard = sourceSeq.at(i);
            if (!finesseCard) continue;
            const topEquiv = suit.getHighestEquivalentCard(finesseCard) ?? finesseCard;
            const gap = declarerCoverCards.bottomCard.faceValue - topEquiv.faceValue - 1;
            const gapCards = new CardList();
            for (let j = 0; j < gap; j++) {
              gapCards.add(Card.fromDeckValue(topEquiv.deckValue + 1 + j));
            }
            if (this.getNumGapCardsOutstanding(s, gapCards) === 0) break;

            playList.append(
              new Type2Finesse(finesseCard, {
                playerPosition: this.position,
                targetHand: IN_DUMMY,
                gapCards,
                coverCards: new CardList(declarerCoverCards.all),
                trumpSuit: this.trumpSuit,
              }),
            );
            this.numPlannedFinessesInSuit[s]++;
            if (declarerCoverCards.length === 1) {
              this.status?.stream(
                `5PSFNS21! Can finesse the ${finesseCard.fullName} by leading it from dummy, with the ${declarerCoverCards.at(0)?.faceName ?? ''} as the potential cover card in hand.\n`,
              );
            } else {
              this.status?.stream(
                `5PSFNS21! Can finesse the ${finesseCard.fullName} by leading it from dummy, with the { ${declarerCoverCards.holdingsString} } as the potential cover cards in hand.\n`,
              );
            }
            numFinesses++;
          }
        }
      }
    }

    // Type III Finesse in dummy
    if (!dummyHasCommandingCard && haveLosers && dummy.numHonors >= 1 && dummy.topSequence) {
      const seq = dummy.topSequence;
      const numMaxFinesses = Math.min(seq.length, numDeclarerLosers);
      for (let i = numMaxFinesses - 1; i >= 0; i--) {
        const finesseCard = seq.at(i);
        if (!finesseCard) continue;
        const topEquiv = suit.getHighestEquivalentCard(finesseCard) ?? finesseCard;
        const gapCards = new CardList();
        let gap = 0;
        for (let ix = topEquiv.faceValue + 1; ix <= ACE; ix++) {
          if (suit.hasCardOfFaceValue(ix)) break;
          gap++;
        }
        for (let j = 0; j < gap; j++) {
          const gc = Card.fromDeckValue(topEquiv.deckValue + 1 + j);
          if (gc.faceValue > finesseCard.faceValue) gapCards.add(gc);
        }
        if (this.getNumGapCardsOutstanding(s, gapCards) === 0) break;

        const leadCards = new CardList();
        const startIdx = Math.max(0, declarer.length - numDeclarerLosers);
        for (let k = startIdx; k < declarer.length; k++) {
          const lc = declarer.at(k);
          if (lc && !suit.areEquivalentCards(finesseCard, lc)) leadCards.add(lc);
        }
        if (leadCards.isEmpty) break;

        playList.append(
          new Type3Finesse(finesseCard, {
            playerPosition: this.position,
            targetHand: IN_DUMMY,
            gapCards,
            leadCards,
            trumpSuit: this.trumpSuit,
          }),
        );
        this.numPlannedFinessesInSuit[s]++;
        const oppName = isPosition(this.partnerPosition) ? positionToString(nextPosition(this.partnerPosition)) : 'opponent';
        this.status?.stream(
          `5PSFNS30! Can finesse the ${finesseCard.fullName} by leading it from dummy against ${oppName}.\n`,
        );
        numFinesses++;
      }
    }

    // Type III Finesse in hand
    if (!declarerHasCommandingCard && haveLosers && declarer.numHonors >= 1 && declarer.topSequence) {
      const seq = declarer.topSequence;
      const numMaxFinesses = Math.min(seq.length, numDummyLosers);
      for (let i = numMaxFinesses - 1; i >= 0; i--) {
        const finesseCard = seq.at(i);
        if (!finesseCard) continue;
        const topEquiv = suit.getHighestEquivalentCard(finesseCard) ?? finesseCard;
        const gapCards = new CardList();
        let gap = 0;
        for (let ix = topEquiv.faceValue + 1; ix <= ACE; ix++) {
          if (suit.hasCardOfFaceValue(ix)) break;
          gap++;
        }
        for (let j = 0; j < gap; j++) {
          const gc = Card.fromDeckValue(topEquiv.deckValue + 1 + j);
          if (gc.faceValue > finesseCard.faceValue) gapCards.add(gc);
        }
        if (this.getNumGapCardsOutstanding(s, gapCards) === 0) break;

        const leadCards = new CardList();
        const startIdx = Math.max(0, dummy.length - numDummyLosers);
        for (let k = startIdx; k < dummy.length; k++) {
          const lc = dummy.at(k);
          if (lc && !suit.areEquivalentCards(finesseCard, lc)) leadCards.add(lc);
        }
        if (leadCards.isEmpty) break;

        playList.append(
          new Type3Finesse(finesseCard, {
            playerPosition: this.position,
            targetHand: IN_HAND,
            gapCards,
            leadCards,
            trumpSuit: this.trumpSuit,
          }),
        );
        this.numPlannedFinessesInSuit[s]++;
        const oppName = isPosition(this.position) ? positionToString(nextPosition(this.position)) : 'opponent';
        this.status?.stream(
          `5PSFNS31! Can finesse the ${finesseCard.fullName} by leading it from hand against ${oppName}.\n`,
        );
        numFinesses++;
      }
    }

    // Type A Finesse (opportunistic finesse in 2nd seat)
    const cardLed = context.leadCard ?? this.leadCard;
    const cardsInRound = context.numCardsPlayedInRound ?? this.numCardsPlayed;
    const isDummyTurn = context.isDummyTurn ?? false;
    if (cardsInRound === 1 && cardLed && cardLed.suit === s && haveLosers && suit.numMissingHonors > 0) {
      const targetSuit = isDummyTurn ? dummy : declarer;
      const otherSuit = isDummyTurn ? declarer : dummy;
      const otherHasCommanding = isDummyTurn ? declarerHasCommandingCard : dummyHasCommandingCard;
      if (
        targetSuit.length > 0 &&
        targetSuit.numMissingHonors > 0 &&
        !otherHasCommanding &&
        targetSuit.getNumCardsAbove(cardLed) > 0
      ) {
        let finesseCard: Card | null = null;
        let topEquivCard: Card | null = null;
        if (suit.numWinners > 0 && topSequence) {
          for (let i = 0; i < targetSuit.length; i++) {
            const c = targetSuit.at(i);
            if (c && !topSequence.hasCard(c)) {
              finesseCard = c;
              break;
            }
          }
          if (finesseCard) {
            topEquivCard = finesseCard;
            finesseCard = targetSuit.getLowestEquivalentCard(finesseCard) ?? finesseCard;
          }
        } else {
          finesseCard = targetSuit.topSequence?.bottomCard ?? targetSuit.topCard;
          topEquivCard = targetSuit.topCard;
        }

        const oppositeHigher = finesseCard ? otherSuit.getNumCardsAbove(finesseCard) > 0 : false;
        const oppositeEquivSingleton = Boolean(
          finesseCard &&
            targetSuit.length > 1 &&
            otherSuit.length === 1 &&
            otherSuit.at(0) &&
            suit.areEquivalentCards(finesseCard, otherSuit.at(0)!),
        );

        if (finesseCard && topEquivCard && finesseCard.faceValue > cardLed.faceValue && !oppositeHigher && !oppositeEquivSingleton) {
          const gapCards = new CardList();
          const maxSteps = ACE - topEquivCard.faceValue;
          for (let j = 0; j < maxSteps; j++) {
            const dv = topEquivCard.deckValue + 1 + j;
            if (!suit.hasCard(dv)) gapCards.add(Card.fromDeckValue(dv));
            else break;
          }
          if (this.getNumGapCardsOutstanding(s, gapCards) > 0) {
            const lhoPos = this.leftOpponent?.position ?? (isPosition(this.position) ? nextPosition(this.position) : Position.Unknown);
            const lhoShownOut = isPosition(lhoPos) ? (this.guessedHands[lhoPos]?.isSuitShownOut(s) ?? false) : false;
            if (lhoShownOut) {
              this.status?.stream(
                `5PSFNS${isDummyTurn ? '42' : '46'}! We'd like to finesse the ${finesseCard.fullName} in ${isDummyTurn ? 'dummy' : 'hand'} against ${positionToString(lhoPos)}, but he's shown out of ${Card.suitToString(s)}.\n`,
              );
            } else {
              playList.append(
                new TypeAFinesse(finesseCard, {
                  playerPosition: this.position,
                  targetHand: isDummyTurn ? IN_DUMMY : IN_HAND,
                  gapCards,
                  trumpSuit: this.trumpSuit,
                }),
              );
              this.numPlannedFinessesInSuit[s]++;
              const oppName = isPosition(this.partnerPosition) ? positionToString(nextPosition(this.partnerPosition)) : 'opponent';
              this.status?.stream(
                `5PSFNS${isDummyTurn ? '44' : '48'}! Can opportunistically finesse the ${finesseCard.fullName} in ${isDummyTurn ? 'dummy' : 'hand'} against ${oppName}.\n`,
              );
              numFinesses++;
            }
          }
        }
      }
    }

    return numFinesses;
  }

  //
  // GetNumGapCardsOutstanding()
  //
  getNumGapCardsOutstanding(suit: Suit, gapCards: CardList): number {
    if (this.guessedHands.length === 0) return gapCards.length;

    const outstandingCards = new CardList();
    this.getOutstandingCardsList(suit, outstandingCards);
    for (let i = gapCards.length - 1; i >= 0; i--) {
      const gc = gapCards.at(i);
      if (!gc || !outstandingCards.hasCard(gc)) {
        gapCards.removeAt(i);
      }
    }
    return gapCards.length;
  }

  override getPlayHint(context: PlayRoundContext = {}): Card | null {
    return this.playCard(context);
  }

  getPlayHintForDummy(context: PlayRoundContext = {}): Card | null {
    return this.playForDummy(context);
  }

  //
  // GetCardOwner()
  //
  // returns the card's owner (IN_HAND=0=declarer, IN_DUMMY=1=dummy)
  //
  getCardOwner(card: Card): number {
    if (card.owner === this.position || this.hand?.hasCard(card)) {
      return IN_HAND;
    }
    if (card.owner === this.partnerPosition || this.partnersHand?.hasCard(card) || this.dummyHand?.hasCard(card)) {
      return IN_DUMMY;
    }
    return IN_HAND;
  }

  // Backward-compatible helpers used by existing unit tests
  override chooseCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    if (ledSuit !== NONE && this.hand) {
      const following = this.hand.getCardsInSuit(ledSuit);
      if (following.length > 0) return following[0];
      if (this.dummyHand) {
        const dummyFollowing = this.dummyHand.getCardsInSuit(ledSuit);
        if (dummyFollowing.length > 0) return dummyFollowing[0];
      }
    }
    if (this.combinedHand) {
      for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
        const combined = this.combinedHand.getSuit(suit as Suit).cardsInAscendingDeckOrder;
        if (combined.length > 0) return combined[0];
      }
    }
    return super.chooseCard(ledSuit);
  }

  buildPlayPlan(trumpSuit: Suit | typeof NONE): void {
    this.trumpSuit = trumpSuit;
    this.playPlan.clear();
    if (!this.combinedHand) return;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      const combinedSuit = this.combinedHand.getSuit(suit as Suit);
      if (combinedSuit.length >= 5) {
        this.playPlan.append(new Cash(suit as Suit));
      }
      if (combinedSuit.length > 0 && combinedSuit.declarerLength >= 2 && combinedSuit.dummyLength >= 2) {
        this.playPlan.append(new Finesse(suit as Suit));
      }
      if (trumpSuit !== NONE && combinedSuit.length > 0 && suit !== trumpSuit) {
        this.playPlan.append(new Ruff(trumpSuit));
      }
    }
    if (trumpSuit !== NONE) {
      this.playPlan.append(new TrumpPull(trumpSuit));
    }
  }
}
