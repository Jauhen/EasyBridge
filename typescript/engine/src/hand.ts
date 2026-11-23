//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CHandHoldings (HandHoldings.H / HandHoldings.cpp)
//

import { Card } from './card.js';
import { CardList } from './cardList.js';
import {
  cardSuit,
  faceValue,
  isMajor,
  isMinor,
  isSuit,
  KING,
  NONE,
  Position,
  Suit,
} from './constants.js';
import { SuitStrength, SuitType } from './bidding/bidParameters.js';
import { PlayerStatus } from './playerStatus.js';
import { CardHoldings } from './play/cardHoldings.js';
import { DisplayHoldings } from './play/displayHoldings.js';
import { GuessedCardHoldings } from './play/guessedCardHoldings.js';
import { SuitEvaluationOptions, SuitHoldings } from './play/suitHoldings.js';

export const REVALUE_DUMMY = 0;
export const REVALUE_DECLARER = 1;
export const REVALUE_NOPENALTY_SHORTTRUMP = 2;

export interface HandEvaluationOptions extends SuitEvaluationOptions {
  acelessPenalty?: boolean;
  fourAceBonus?: boolean;
}

export class Hand extends CardHoldings {
  readonly suits: SuitHoldings[] = [
    new SuitHoldings(),
    new SuitHoldings(),
    new SuitHoldings(),
    new SuitHoldings(),
  ];
  readonly initialHand = new CardHoldings();
  readonly displayHand = new DisplayHoldings();

  private statusDlg: PlayerStatus | null = null;
  private ownerPosition: Position = Position.Unknown;
  private cardsExposed = false;

  // basic hand statistics
  private aces = 0;                 // # of Aces in hand
  private kings = 0;                // # of Kings in hand
  private queens = 0;               // # of Queens in hand
  private jacks = 0;                // # of Jacks in hand
  private tens = 0;                 // # of Tens in hand
  private shortPointsValue = 0;     // # of short suit points in hand
  private longPointsValue = 0;      // # of long suit points in hand
  private distPointsValue = 0;      // short points + long points
  private bonusPointsValue = 0;     // bonuses (e.g., long trump suit)
  private penaltyPointsValue = 0;   // negatives (e.g., aceless hand)
  private totalPointsValue = 0;     // # of total points in hand
  private adjustedPointsValue = 0;  // adjusted points for suit contract
  private balanceValueValue = 0;    // A measure of hand balance: 0=3/3/3/4, 1=4/4/3/2, 2=5/3/3/2

  // more detailed hand analysis
  private quickTricks = 0;          // # of quick tricks
  private numSuitsStoppedValue = 0; // # of stoppers
  private numSuitsProbStoppedValue = 0; // # of probable stoppers
  private numSuitsUnstoppedValue = 0;
  private suitsStopped: number[] = [NONE, NONE, NONE, NONE];
  private suitsProbStopped: number[] = [NONE, NONE, NONE, NONE];
  private suitsUnstopped: number[] = [NONE, NONE, NONE, NONE];
  private strSuitsStopped = '';
  private strSuitsProbStopped = '';
  private strSuitsUnstopped = '';

  private numRebiddableSuitsValue = 0;
  private numMarginalSuitsValue = 0;
  private numOpenableSuitsValue = 0;
  private numStrongSuitsValue = 0;
  private numAbsoluteSuitsValue = 0;
  private numPreferredSuitsValue = 0;
  private numSolidSuitsValue = 0;

  private lowestMarginalSuit = NONE;
  private lowestOpenableSuit = NONE;
  private lowestStrongSuit = NONE;
  private lowestAbsoluteSuit = NONE;
  private lowestPreferredSuit = NONE;
  private lowestSolidSuit = NONE;

  private highestMarginalSuit = NONE;
  private highestOpenableSuit = NONE;
  private highestStrongSuit = NONE;
  private highestAbsoluteSuit = NONE;
  private highestPreferredSuit = NONE;
  private highestSolidSuit = NONE;

  private marginalSuitList: number[] = [NONE, NONE, NONE, NONE, NONE];
  private openableSuitList: number[] = [NONE, NONE, NONE, NONE, NONE];
  private strongSuitList: number[] = [NONE, NONE, NONE, NONE, NONE];
  private absoluteSuitList: number[] = [NONE, NONE, NONE, NONE, NONE];
  private preferredSuitList: number[] = [NONE, NONE, NONE, NONE, NONE];
  private solidSuitList: number[] = [NONE, NONE, NONE, NONE, NONE];

  private preferredSuitValue: Suit | typeof NONE = NONE;
  private suitsByPreference: number[] = [NONE, NONE, NONE, NONE, NONE];
  private longestSuitValue: Suit | typeof NONE = NONE;
  private suitsByLength: number[] = [NONE, NONE, NONE, NONE];

  private numVoidsValue = 0;
  private voidSuits: number[] = [NONE, NONE, NONE, NONE];
  private numSingletonsValue = 0;
  private singletonSuits: number[] = [NONE, NONE, NONE, NONE];
  private numDoubletonsValue = 0;
  private doubletonSuits: number[] = [NONE, NONE, NONE, NONE];
  private numSuitsOfAtLeast: number[] = Array<number>(14).fill(0);

  private numLikelyWinnersValue = 0;
  private numLikelyLosersValue = 0;
  private numWinnersValue = 0;
  private numLosersValue = 0;
  private numTopCardsValue = 0;

  private revaluedForSuit: boolean[] = [false, false, false, false];

  constructor() {
    super();
    for (let i = 0; i < 4; i++) {
      this.suits[i].setSuit(i as Suit);
    }
  }

  initialize(position: Position, statusDlg: PlayerStatus | null = null): void {
    this.ownerPosition = position;
    this.statusDlg = statusDlg;
    super.init();
    this.initialHand.init();
    this.displayHand.init();
    for (let i = 0; i < 4; i++) {
      this.suits[i].init();
      this.suits[i].setSuit(i as Suit);
    }
  }

  //
  // InitNewHand()
  //
  initNewHand(options: HandEvaluationOptions = {}): void {
    // first sort the hand & suits
    this.sort();

    // then assign card ranks and hide the cards if not the player
    if (this.ownerPosition === Position.South) {
      for (const card of this.cards) card.setFaceUp(true);
    } else if (this.ownerPosition !== Position.Unknown) {
      for (const card of this.cards) card.setFaceDown();
    }

    // now save the cards as the initial hand
    this.initializeInitialHand();

    // then count cards and points
    this.countPerformed = false;
    this.countCards();
    this.countPoints(true, options);
  }

  //
  // InitSwappedHand()
  //
  // Called after the player's hand has been swapped with another player's in midgame
  //
  initSwappedHand(options: HandEvaluationOptions = {}): void {
    this.sort();
    if (this.ownerPosition === Position.South) {
      for (const card of this.cards) card.setFaceUp(true);
    } else if (this.ownerPosition !== Position.Unknown) {
      for (const card of this.cards) card.setFaceDown();
    }
    this.initialHand.sort();
    this.countPerformed = false;
    this.countCards();
    this.countPoints(true, options);
  }

  clearHand(clearInitialHand = true): void {
    super.clear();
    this.displayHand.clear();
    for (let i = 0; i < 4; i++) {
      this.suits[i].clear();
    }
    if (clearInitialHand) {
      this.initialHand.clear();
    }

    // clear hand holdings variables
    this.numHCPoints = 0;
    this.shortPointsValue = 0;
    this.longPointsValue = 0;
    this.distPointsValue = 0;
    this.bonusPointsValue = 0;
    this.penaltyPointsValue = 0;
    this.totalPointsValue = 0;
    this.adjustedPointsValue = 0;
    this.aces = 0;
    this.kings = 0;
    this.queens = 0;
    this.jacks = 0;
    this.tens = 0;
    this.balanceValueValue = 0;
    this.quickTricks = 0;
    this.numVoidsValue = 0;
    this.numSingletonsValue = 0;
    this.numDoubletonsValue = 0;
    this.voidSuits = [NONE, NONE, NONE, NONE];
    this.singletonSuits = [NONE, NONE, NONE, NONE];
    this.doubletonSuits = [NONE, NONE, NONE, NONE];
    this.numSuitsOfAtLeast.fill(0);
    this.revaluedForSuit = [false, false, false, false];
    this.cardsExposed = false;
  }

  override clear(): void {
    this.clearHand(true);
  }

  exposeCards(expose = true): void {
    for (const card of this.cards) {
      card.setFaceUp(expose);
    }
    this.cardsExposed = expose;
  }

  get areCardsExposed(): boolean {
    return this.cardsExposed;
  }

  setDummyFlag(value = true): void {
    this.displayHand.setDummyFlag(value);
  }

  //
  // clear variables used during the bidding process
  //
  restartBidding(): void {
    this.revaluedForSuit = [false, false, false, false];
  }

  override formatHoldingsString(): void {
    // format the normal ordered holdings
    this.strHoldings = `S:${this.suits[3].holdingsString}  H:${this.suits[2].holdingsString}  D:${this.suits[1].holdingsString}  C:${this.suits[0].holdingsString}`;
    // and also in GIB format
    this.formatGIBHoldingsString();
    this.displayHand.formatGIBHoldingsString();
    this.initialHand.formatHoldingsString();
  }

  override add(card: Card, sort = true): void {
    super.add(card, sort);
    // mark the card as ours
    card.setAssigned(true);
    if (this.ownerPosition !== Position.Unknown) {
      card.setOwner(this.ownerPosition);
    }
    this.displayHand.add(card, sort);
    this.suits[card.suit].add(card, sort);
    this.countPerformed = false;
    this.formatHoldingsString();
  }

  addToInitialHand(card: Card, sort = false): void {
    this.initialHand.add(card, sort);
  }

  override removeByIndex(index: number): Card | null {
    const card = super.removeByIndex(index);
    if (!card) return null;
    this.displayHand.remove(card);

    // reorganize ordered suit holding
    for (let i = index; i < this.cards.length; i++) {
      this.cards[i].decrementHandIndex();
    }

    // then update the suit
    this.suits[card.suit].remove(card);

    // and update card info
    card.clearAssignment();
    this.countPerformed = false;
    this.formatHoldingsString();
    return card;
  }

  override sort(): void {
    // first call base class to sort the cards in S-H-D-C order
    super.sort();

    // then assign card ranks
    for (let i = 0; i < this.cards.length; i++) {
      this.cards[i].setHandIndex(i);
      if (this.ownerPosition !== Position.Unknown) {
        this.cards[i].setOwner(this.ownerPosition);
      }
      this.cards[i].setAssigned(true);
    }

    // and then be sure to sort each of the suits individually
    for (let i = 0; i < 4; i++) {
      this.suits[i].sort();
    }

    // and also sort the display hand
    this.displayHand.sort();
  }

  initializeInitialHand(): void {
    this.initialHand.clear();
    for (const card of this.cards) {
      this.initialHand.add(card);
    }
    this.initialHand.sort();
  }

  //
  // RestoreInitialHand()
  //
  // restores the hand that was dealt, before play began
  //
  restoreInitialHand(): void {
    super.clear();
    this.displayHand.clear();
    for (let i = 0; i < 4; i++) {
      this.suits[i].clear();
    }
    for (const card of this.initialHand.cardsInAscendingDeckOrder) {
      this.add(card);
    }
    this.initNewHand();
  }

  //
  // CountCards()
  //
  // called to count length in the hand's suits
  // separated out from the point count cuz the card count can be done many times
  // during the course of a hand, while the point count is only done once, for bidding
  //
  countCards(): void {
    for (let i = 0; i < 4; i++) {
      this.suits[i].countCards();
    }

    this.voidSuits = [NONE, NONE, NONE, NONE];
    this.singletonSuits = [NONE, NONE, NONE, NONE];
    this.doubletonSuits = [NONE, NONE, NONE, NONE];

    // then check for voids, singletons, & doubletons
    this.numVoidsValue = 0;
    this.numSingletonsValue = 0;
    this.numDoubletonsValue = 0;
    for (let i = 0; i < 4; i++) {
      if (this.suits[i].isVoid) {
        this.voidSuits[this.numVoidsValue++] = i;
      }
      if (this.suits[i].isSingleton) {
        this.singletonSuits[this.numSingletonsValue++] = i;
      }
      if (this.suits[i].isDoubleton) {
        this.doubletonSuits[this.numDoubletonsValue++] = i;
      }
    }

    // count aces and kings
    this.aces = 0;
    this.kings = 0;
    this.queens = 0;
    this.jacks = 0;
    this.tens = 0;
    for (let i = 0; i < 4; i++) {
      if (this.suits[i].hasAce()) this.aces++;
      if (this.suits[i].hasKing()) this.kings++;
      if (this.suits[i].hasQueen()) this.queens++;
      if (this.suits[i].hasJack()) this.jacks++;
      if (this.suits[i].hasTen()) this.tens++;
    }

    // mark indicators of how many suits have at least x # of cards in them
    for (let i = 13; i >= 0; i--) {
      this.numSuitsOfAtLeast[i] = 0;
      for (let j = 0; j < 4; j++) {
        if (this.suits[j].length >= i) this.numSuitsOfAtLeast[i]++;
      }
    }
  }

  //
  // CountPoints()
  //
  // called right after the deal to count points in the hand
  //
  override countPoints(forceCount = true, options: HandEvaluationOptions = {}): number {
    // avoid repeating the count unless forced to do so
    if (this.countPerformed && !forceCount) {
      return this.totalPointsValue;
    }

    const acelessPenalty = options.acelessPenalty ?? true;
    const fourAceBonus = options.fourAceBonus ?? true;

    // first call the base class to count HC points
    super.countPoints(forceCount);

    // sort the hand
    if (!this.sorted) this.sort();

    // ensure card counts (aces, voids, singletons, doubletons) are up to date
    this.countCards();

    // count the points for each suit
    this.shortPointsValue = 0;
    this.longPointsValue = 0;
    this.bonusPointsValue = 0;
    this.penaltyPointsValue = 0;

    for (let i = 0; i < 4; i++) {
      this.suits[i].countPoints(forceCount, options);
      this.shortPointsValue += this.suits[i].shortPoints;
      this.longPointsValue += this.suits[i].lengthPoints;
      this.bonusPointsValue += this.suits[i].bonusPoints;
      this.penaltyPointsValue += this.suits[i].penaltyPoints;
    }
    this.distPointsValue = this.longPointsValue;

    // determine hand-level bonuses and penalties
    // deduct 1 point for an aceless hand
    if (acelessPenalty && this.aces === 0) {
      this.penaltyPointsValue++;
    }
    // and add 1 point for holding all 4 aces
    if (fourAceBonus && this.aces === 4) {
      this.bonusPointsValue++;
    }

    // now add up all the points (but don't count short points yet)
    this.totalPointsValue =
      this.numHCPoints + this.longPointsValue + this.bonusPointsValue - this.penaltyPointsValue;
    this.adjustedPointsValue = this.totalPointsValue;

    // determine balanced-ness of each suit & the overall hand
    this.balanceValueValue = 0;
    for (let i = 0; i < 4; i++) {
      const numSuitCards = this.suits[i].length;
      if (numSuitCards < 3) this.balanceValueValue += 3 - numSuitCards;
      else if (numSuitCards > 4) this.balanceValueValue += numSuitCards - 4;
    }
    // a 5/4/3/1 distribution violates the balanced hand rule
    if (this.numSingletonsValue > 0) {
      this.balanceValueValue = 3;
    }

    // now summarize the QTs & stoppers
    this.quickTricks = 0;
    this.numSuitsStoppedValue = 0;
    this.numSuitsProbStoppedValue = 0;
    this.numSuitsUnstoppedValue = 0;
    this.suitsStopped.fill(NONE);
    this.suitsProbStopped.fill(NONE);
    this.suitsUnstopped.fill(NONE);
    const stoppedNames: string[] = [];
    const probStoppedNames: string[] = [];
    const unstoppedNames: string[] = [];

    for (let i = 0; i < 4; i++) {
      this.quickTricks += this.suits[i].quickTricks;
      if (this.suits[i].isSuitStopped) {
        this.suitsStopped[this.numSuitsStoppedValue++] = i;
        stoppedNames.push(Card.suitToString(i));
      } else if (this.suits[i].isSuitProbablyStopped) {
        this.suitsProbStopped[this.numSuitsProbStoppedValue++] = i;
        probStoppedNames.push(Card.suitToString(i));
      } else {
        this.suitsUnstopped[this.numSuitsUnstoppedValue++] = i;
        unstoppedNames.push(Card.suitToString(i));
      }
    }
    this.strSuitsStopped = stoppedNames.join(', ');
    this.strSuitsProbStopped = probStoppedNames.join(', ');
    this.strSuitsUnstopped = unstoppedNames.join(', ');

    return this.totalPointsValue;
  }

  //
  // EvaluateHoldings()
  //
  // called after hand is dealt and before bidding
  //
  override evaluateHoldings(options: HandEvaluationOptions = {}): void {
    const fiveCardMajors = options.fiveCardMajors ?? true;
    const status = this.statusDlg;

    // clear the hand's analysis info
    this.marginalSuitList.fill(NONE);
    this.openableSuitList.fill(NONE);
    this.strongSuitList.fill(NONE);
    this.absoluteSuitList.fill(NONE);
    this.preferredSuitList.fill(NONE);
    this.solidSuitList.fill(NONE);
    this.suitsByPreference.fill(NONE);
    this.suitsByLength.fill(NONE);
    this.revaluedForSuit = [false, false, false, false];

    this.numMarginalSuitsValue = 0;
    this.numOpenableSuitsValue = 0;
    this.numStrongSuitsValue = 0;
    this.numAbsoluteSuitsValue = 0;
    this.numPreferredSuitsValue = 0;
    this.numSolidSuitsValue = 0;
    this.lowestMarginalSuit = NONE;
    this.lowestOpenableSuit = NONE;
    this.lowestStrongSuit = NONE;
    this.lowestAbsoluteSuit = NONE;
    this.lowestPreferredSuit = NONE;
    this.lowestSolidSuit = NONE;
    this.highestMarginalSuit = NONE;
    this.highestOpenableSuit = NONE;
    this.highestStrongSuit = NONE;
    this.highestAbsoluteSuit = NONE;
    this.highestPreferredSuit = NONE;
    this.highestSolidSuit = NONE;
    this.preferredSuitValue = NONE;
    this.longestSuitValue = NONE;

    // first report the hand
    if (status) {
      status.stream('4=====================================\n');
      status.stream('4Received hand:\n  ').addStream(this.strHoldings).addStream('\n');
    }

    // first evaluate the individual suits
    for (let i = 0; i < 4; i++) {
      this.suits[i].evaluateHoldings(options);
    }

    // sort suits by length (and also by suit rank)
    this.sortSuitsByLength();

    // summarize info about the suit holdings
    for (let i = 0; i < 4; i++) {
      const strength = this.suits[i].strength;
      if (strength >= SuitStrength.MarginalOpener) {
        if (this.numMarginalSuitsValue === 0) this.lowestMarginalSuit = i;
        this.marginalSuitList[this.numMarginalSuitsValue++] = i;
        if (i > this.highestMarginalSuit) this.highestMarginalSuit = i;
      }
      if (strength >= SuitStrength.Openable) {
        if (this.numOpenableSuitsValue === 0) this.lowestOpenableSuit = i;
        this.openableSuitList[this.numOpenableSuitsValue++] = i;
        if (i > this.highestOpenableSuit) this.highestOpenableSuit = i;
      }
      if (strength >= SuitStrength.Strong) {
        if (this.numStrongSuitsValue === 0) this.lowestStrongSuit = i;
        this.strongSuitList[this.numStrongSuitsValue++] = i;
        if (i > this.highestStrongSuit) this.highestStrongSuit = i;
      }
      if (strength >= SuitStrength.Absolute) {
        if (this.numAbsoluteSuitsValue === 0) this.lowestAbsoluteSuit = i;
        this.absoluteSuitList[this.numAbsoluteSuitsValue++] = i;
        // set this suit as preferred
        this.preferredSuitList[this.numPreferredSuitsValue++] = i;
        if (this.lowestPreferredSuit === NONE) this.lowestPreferredSuit = i;
        if (i > this.highestPreferredSuit) this.highestPreferredSuit = i;
      }
    }

    // if there were no absolute suits found, set the preferred suit among strong/openable/marginal
    if (this.numPreferredSuitsValue === 0) {
      for (let i = 0; i < 4; i++) {
        if (this.suits[i].strength >= SuitStrength.Strong) {
          this.preferredSuitList[this.numPreferredSuitsValue++] = i;
          this.suits[i].setPreferred(true);
          if (this.lowestPreferredSuit === NONE) this.lowestPreferredSuit = i;
          if (i > this.highestPreferredSuit) this.highestPreferredSuit = i;
        }
      }
    }
    if (this.numPreferredSuitsValue === 0) {
      for (let i = 0; i < 4; i++) {
        if (this.suits[i].strength === SuitStrength.Openable) {
          this.preferredSuitList[this.numPreferredSuitsValue++] = i;
          this.suits[i].setPreferred(true);
          if (this.lowestPreferredSuit === NONE) this.lowestPreferredSuit = i;
          if (i > this.highestPreferredSuit) this.highestPreferredSuit = i;
        }
      }
    }
    if (this.numPreferredSuitsValue === 0) {
      for (let i = 0; i < 4; i++) {
        if (this.suits[i].strength === SuitStrength.MarginalOpener) {
          this.preferredSuitList[this.numPreferredSuitsValue++] = i;
          this.suits[i].setPreferred(true);
          if (this.lowestPreferredSuit === NONE) this.lowestPreferredSuit = i;
          if (i > this.highestPreferredSuit) this.highestPreferredSuit = i;
        }
      }
    }

    // else just pick the longest suit
    if (this.numPreferredSuitsValue === 0 && isSuit(this.longestSuitValue)) {
      this.preferredSuitList[0] = this.longestSuitValue;
      this.numPreferredSuitsValue = 1;
      this.suits[this.longestSuitValue].setPreferred(true);
      this.highestPreferredSuit = this.longestSuitValue;
      this.lowestPreferredSuit = this.longestSuitValue;
      const len = this.suits[this.longestSuitValue].length;
      for (let i = 3; i >= 0; i--) {
        if (i === this.longestSuitValue || this.suits[i].length < len) continue;
        this.preferredSuitList[this.numPreferredSuitsValue++] = i;
        this.suits[i].setPreferred(true);
        this.lowestPreferredSuit = i;
      }
    }

    // test for solid suits
    for (let i = 0; i < 4; i++) {
      if (this.suits[i].isSolid) {
        this.solidSuitList[this.numSolidSuitsValue++] = i;
        if (this.lowestSolidSuit === NONE || i < this.lowestSolidSuit) this.lowestSolidSuit = i;
        if (i > this.highestSolidSuit) this.highestSolidSuit = i;
      }
    }

    // now rank the suits in order of preference
    this.preferredSuitValue = this.rankSuits(
      4,
      0,
      Suit.Clubs,
      Suit.Diamonds,
      Suit.Hearts,
      Suit.Spades,
      this.suitsByPreference,
    ) as Suit;
    for (let i = 0; i < 4; i++) {
      this.suits[this.suitsByPreference[i]].setRank(i);
    }

    // and see which suits (if any) are rebiddable
    this.numRebiddableSuitsValue = 0;
    for (let i = 0; i < 4; i++) {
      if (this.suits[i].isRebiddable) this.numRebiddableSuitsValue++;
    }

    // count winners among the suits
    this.numWinnersValue = 0;
    this.numLikelyWinnersValue = 0;
    this.numTopCardsValue = 0;
    for (let i = 0; i < 4; i++) {
      this.numWinnersValue += this.suits[i].numWinners;
      this.numLikelyWinnersValue += this.suits[i].likelyWinnerCount;
      this.numTopCardsValue += this.suits[i].numTopCards;
    }
    this.numLosersValue = this.cards.length - this.numWinnersValue;
    this.numLikelyLosersValue = 13 - this.numLikelyWinnersValue;

    // and finally report on the quality of the hand
    if (status) {
      let strLine = 'Hand evaluation:\n';
      const pen = this.penaltyPointsValue === 0 ? 0 : -this.penaltyPointsValue;
      strLine += `  HCPs = ${this.numHCPoints.toFixed(1)}, Distn pts = ${this.distPointsValue.toFixed(1)}, Bonus/Penalty = ${this.bonusPointsValue.toFixed(1)}/${pen.toFixed(1)};\nTotal pts = ${this.totalPointsValue.toFixed(1)}.\n`;
      strLine += `  QT's = ${this.quickTricks.toFixed(1)},\n`;
      if (this.numSuitsStoppedValue > 0) {
        const stopped: string[] = [];
        for (let i = 3; i >= 0; i--) {
          if (this.suits[i].isSuitStopped) stopped.push(Card.getSuitLetter(i));
        }
        strLine += `  Sure Stoppers in: ${stopped.join(', ')}\n`;
      } else {
        strLine += '  Sure Stoppers:\n';
      }
      const probOnly: string[] = [];
      for (let i = 3; i >= 0; i--) {
        if (this.suits[i].isSuitProbablyStopped && !this.suits[i].isSuitStopped) {
          probOnly.push(Card.getSuitLetter(i));
        }
      }
      if (probOnly.length > 0) {
        strLine += `  Probable Stoppers in: ${probOnly.join(', ')}\n`;
      } else {
        strLine += '  Probable Stoppers in:\n';
      }
      strLine += `  ${this.numLikelyWinnersValue} Likely Winners (${this.suits[3].likelyWinnerCount}/${this.suits[2].likelyWinnerCount}/${this.suits[1].likelyWinnerCount}/${this.suits[0].likelyWinnerCount})\n`;
      strLine += `  ${this.numLikelyLosersValue} Likely Losers (${this.suits[3].likelyLoserCount}/${this.suits[2].likelyLoserCount}/${this.suits[1].likelyLoserCount}/${this.suits[0].likelyLoserCount})\n`;

      if (fiveCardMajors) {
        strLine += 'Playing five-card majors, ';
        if (this.suits[Suit.Hearts].length >= 5 && this.suits[Suit.Spades].length >= 5) {
          strLine += 'both majors qualify for opening.\n';
        } else if (this.suits[Suit.Hearts].length >= 5) {
          strLine += 'Hearts can be opened.\n';
        } else if (this.suits[Suit.Spades].length >= 5) {
          strLine += 'Spades can be opened.\n';
        } else {
          strLine += 'neither major suit qualifies for opening.\n';
        }
      }

      if (this.numAbsoluteSuitsValue > 0) {
        if (this.numAbsoluteSuitsValue === 1) {
          strLine += `Have a powerful suit in ${Card.suitToString(this.absoluteSuitList[0])}.\n`;
        } else {
          const names = this.absoluteSuitList.slice(0, this.numAbsoluteSuitsValue).map(s => Card.suitToString(s));
          strLine += `Have powerful suits in ${names.join(', ')}\n`;
        }
      }

      const strongOnly: number[] = [];
      for (let i = 0; i < this.numStrongSuitsValue; i++) {
        const s = this.strongSuitList[i];
        if (!this.suits[s].isAbsolute) strongOnly.push(s);
      }
      if (strongOnly.length > 0) {
        if (strongOnly.length === 1) {
          strLine += `Have a strong suit in ${Card.suitToString(strongOnly[0])}.\n`;
        } else {
          strLine += `Have strong suits in ${strongOnly.map(s => Card.suitToString(s)).join(', ')}\n`;
        }
      }

      if (this.numPreferredSuitsValue === 1) {
        strLine += `Preferred suit is ${Card.suitToString(this.preferredSuitList[0])}.`;
      } else {
        const names = this.preferredSuitList.slice(0, this.numPreferredSuitsValue).map(s => Card.suitToString(s));
        strLine += `Preferred suits are  ${names.join(', ')}\n`;
        strLine += `The best suit is ${Card.suitToString(this.preferredSuitValue)}.`;
      }
      strLine += '\n====================\n';
      status.stream(strLine);
    }
  }

  //
  // ReevaluateHoldings()
  //
  // called after a card has been played
  //
  reevaluateHoldings(card: Card | null = null, playedCards?: GuessedCardHoldings): void {
    if (card) {
      this.suits[card.suit].reevaluateHoldings(card, playedCards);
    } else {
      for (let i = 0; i < 4; i++) {
        this.suits[i].reevaluateHoldings(card, playedCards);
      }
    }

    // count the cards
    this.countCards();

    // then re-rank suits by general preference
    this.preferredSuitValue = this.rankSuits(
      4,
      0,
      Suit.Clubs,
      Suit.Diamonds,
      Suit.Hearts,
      Suit.Spades,
      this.suitsByPreference,
    ) as Suit;
    for (let i = 0; i < 4; i++) {
      this.suits[this.suitsByPreference[i]].setRank(i);
    }

    // then sort the suits by length
    this.sortSuitsByLength();

    // and finally adjust the winners count
    this.numWinnersValue = 0;
    this.numLikelyWinnersValue = 0;
    this.numTopCardsValue = 0;
    for (let i = 0; i < 4; i++) {
      this.numWinnersValue += this.suits[i].numWinners;
      this.numLikelyWinnersValue += this.suits[i].likelyWinnerCount;
      this.numTopCardsValue += this.suits[i].numTopCards;
    }
    this.numLosersValue = this.cards.length - this.numWinnersValue;
    this.numLikelyLosersValue = this.cards.length - this.numLikelyWinnersValue;
  }

  //
  // RevalueHand()
  //
  // revalues a hand's points with respect to a trump suit
  //
  // mode: REVALUE_DUMMY (0), REVALUE_DECLARER (1), REVALUE_NOPENALTY_SHORTTRUMP (2)
  //
  revalueHand(
    mode: number,
    trumpSuit: Suit,
    trace = true,
    forceRevalue = false,
    fiveCardMajors = true,
  ): number {
    let shortPts = 0;
    let bonusPts = 0;
    let adjPts = this.totalPointsValue;
    const longSuits: number[] = [];

    if (trumpSuit === Suit.NoTrump) return this.numHCPoints;
    if (!isSuit(trumpSuit)) return this.totalPointsValue;

    // see if the hand has already been revalued
    if (this.revaluedForSuit[trumpSuit] && !forceRevalue) {
      return this.adjustedPointsValue;
    }
    this.revaluedForSuit[trumpSuit] = true;

    const isDeclarer = (mode & REVALUE_DECLARER) !== 0;
    let strMessage = `3REVAL1: Revaluing hand as ${isDeclarer ? 'declarer' : 'dummy'}...\n`;

    // boost points for trumps and any solid side suits
    this.longPointsValue = 0;
    const minTrumpLength = isDeclarer
      ? (fiveCardMajors ? 5 : 4)
      : (fiveCardMajors ? 3 : 4);
    const numTrumps = this.suits[trumpSuit].length;

    for (let i = 0; i < 4; i++) {
      if (i === trumpSuit) {
        // trump suit -- add length pts for a long suit
        const extra = numTrumps - minTrumpLength;
        if (extra >= 2) {
          // 2 or more than necessary? add 1 pt for 1st, 2 pts each extra
          this.longPointsValue += 1 + (extra - 1) * 2;
        } else if (extra === 1) {
          this.longPointsValue += 1;
        } else if (extra < 0) {
          // oops, fewer than required trumps -- deduct 2 pts for each
          if ((mode & REVALUE_NOPENALTY_SHORTTRUMP) === 0) {
            this.longPointsValue -= (-extra) * 2;
          }
        }
        if (this.longPointsValue > 0) {
          strMessage += `3REVAL5: Adding ${this.longPointsValue.toFixed(0)} point(s) for the ${extra} extra trump(s).\n`;
        } else if (this.longPointsValue < 0) {
          strMessage += `3REVAL6: Deducting ${(-this.longPointsValue).toFixed(0)} point(s) for the ${-extra} trump(s) short of ${minTrumpLength}.\n`;
        }
      } else if (this.suits[i].isSolid) {
        // non-trump but solid suits -- 1 pt for a card over 4, plus 2 pts for each add'l
        longSuits.push(i);
        let solidPts = 0;
        if (this.suits[i].length >= 6) solidPts = (this.suits[i].length - 5) * 2 + 1;
        else if (this.suits[i].length === 5) solidPts = 1;
        strMessage += `3REVAL7: Adding ${solidPts} point(s) for the solid ${Card.suitToSingularString(i)} suit.\n`;
        this.longPointsValue += solidPts;
      }
    }

    // also remove any penalty points in the trump suit
    this.penaltyPointsValue = 0;
    for (let i = 0; i < 4; i++) {
      if (i !== trumpSuit) this.penaltyPointsValue += this.suits[i].penaltyPoints;
    }

    if (isDeclarer) {
      // we're declarer; so deduct points if we have poor trump honors
      // i.e., if the suit is topped by less than a King
      if (numTrumps > 0) {
        const topCard = this.suits[trumpSuit].at(0)!;
        if (topCard.faceValue < KING) {
          bonusPts -= KING - topCard.faceValue;
          strMessage += `3REVAL8: Since the trump suit is only topped by a ${topCard.faceName}, deduct ${-bonusPts} points.\n`;
        }
      }

      adjPts =
        this.numHCPoints +
        this.bonusPointsValue -
        this.penaltyPointsValue +
        bonusPts +
        this.longPointsValue;
      this.adjustedPointsValue = adjPts;

      if (adjPts > this.totalPointsValue) {
        if (numTrumps > minTrumpLength) {
          strMessage = `2REVAL10: (with a ${numTrumps}-card trump suit in ${Card.suitToString(trumpSuit)},`;
          if (longSuits.length === 1) {
            strMessage += ` plus a solid ${this.suits[longSuits[0]].length}-card second suit in ${Card.suitToString(longSuits[0])},`;
          } else if (longSuits.length > 1) {
            strMessage += ` plus long outside suits in ${longSuits.map(s => Card.getSuitName(s)).join(' and ')}, `;
          }
        } else if (longSuits.length === 1) {
          strMessage += `2REVAL12: (with a solid ${this.suits[longSuits[0]].length}-card second suit in ${Card.suitToString(longSuits[0])},`;
        } else if (longSuits.length > 1) {
          strMessage = `2REVAL14: (with long outside suits in ${longSuits.map(s => Card.getSuitName(s)).join(' and ')}, `;
        } else {
          strMessage += '2REVAL16: (after re-evaluation for distribution,';
        }
        strMessage += ` declarer's hand is revalued for a suit contract from ${this.totalPointsValue.toFixed(1)} ${adjPts < this.totalPointsValue ? 'down ' : ''}to ${adjPts.toFixed(1)} points)\n`;
      } else if (adjPts < this.totalPointsValue) {
        strMessage += `2REVAL18: Declarer's hand is revalued for a suit contract from ${this.totalPointsValue.toFixed(1)} down to ${adjPts.toFixed(1)} points)\n`;
      }

      if (trace && this.statusDlg) {
        this.statusDlg.stream(strMessage);
      }
      this.adjustedPointsValue = adjPts;
      return adjPts;
    } else {
      // here we are dummy; boost points for specific support holdings
      if (numTrumps >= minTrumpLength) {
        if (numTrumps >= 4) {
          // w/ 4+ trumps, void = 5 pts, singleton = 3, & doubleton = 1
          shortPts = this.numVoidsValue * 5 + this.numSingletonsValue * 3 + this.numDoubletonsValue;
        } else if (numTrumps === 3) {
          // with only 3 trumps, bonus schedule is 3/2/1
          shortPts = this.numVoidsValue * 3 + this.numSingletonsValue * 2 + this.numDoubletonsValue;
        }

        // add 1 pt for holding an honor in the trump suit
        if (this.suits[trumpSuit].hcPoints > 0) bonusPts++;

        adjPts =
          this.numHCPoints +
          this.bonusPointsValue -
          this.penaltyPointsValue +
          bonusPts +
          shortPts +
          this.longPointsValue;
        this.adjustedPointsValue = adjPts;

        if (adjPts > this.totalPointsValue) {
          strMessage = `2REVAL38! (with ${numTrumps}-card ${Card.suitToSingularString(trumpSuit)} trump support`;
          if (this.suits[trumpSuit].hcPoints > 0) {
            strMessage += ' including a trump honor';
          }
          if (this.numDoubletonsValue > 0) {
            if (this.numDoubletonsValue > 1) {
              const names = this.doubletonSuits.slice(0, this.numDoubletonsValue).map(s => Card.suitToString(s));
              strMessage += ` & doubletons in ${names.join(' and ')}`;
            } else {
              strMessage += ` & a doubleton in ${Card.suitToString(this.doubletonSuits[0])}`;
            }
            if (this.numSingletonsValue > 0 || this.numVoidsValue > 0) strMessage += ', ';
          }
          if (this.numSingletonsValue > 0) {
            if (this.numSingletonsValue > 1) {
              const names = this.singletonSuits.slice(0, this.numSingletonsValue).map(s => Card.suitToString(s));
              strMessage += ` & singletons in ${names.join(' and ')}`;
            } else {
              strMessage += ` & a singleton in ${Card.suitToString(this.singletonSuits[0])}`;
            }
            if (this.numVoidsValue > 0) strMessage += ', ';
          }
          if (this.numVoidsValue > 0) {
            if (this.numVoidsValue > 1) {
              const names = this.voidSuits.slice(0, this.numVoidsValue).map(s => Card.suitToString(s));
              strMessage += ` & voids in ${names.join(' and ')}`;
            } else {
              strMessage += ` & a void in ${Card.suitToString(this.voidSuits[0])}`;
            }
          }
          strMessage += `, the hand is revalued for a suit contract as dummy from ${this.totalPointsValue.toFixed(1)} ${adjPts < this.totalPointsValue ? 'down ' : ''}to ${adjPts.toFixed(1)} points)\n`;
        }
      } else if (adjPts < this.totalPointsValue) {
        strMessage += `2REVAL40: Dummy's hand is revalued for a suit contract from ${this.totalPointsValue.toFixed(1)} down to ${adjPts.toFixed(1)} points)\n`;
      }

      if (trace && this.statusDlg) {
        this.statusDlg.stream(strMessage);
      }
      this.adjustedPointsValue = adjPts;
      return adjPts;
    }
  }

  private sortSuitsByLength(): void {
    for (let i = 0; i < 4; i++) {
      this.suitsByLength[i] = 3 - i; // init, high suit to low suit
    }
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        if (this.suits[this.suitsByLength[j]].length < this.suits[this.suitsByLength[j + 1]].length) {
          const temp = this.suitsByLength[j];
          this.suitsByLength[j] = this.suitsByLength[j + 1];
          this.suitsByLength[j + 1] = temp;
        }
      }
    }
    this.longestSuitValue = this.suitsByLength[0] as Suit;
  }

  //
  // RankSuits()
  //
  // compare up to 4 suits and select the best one
  //
  rankSuits(
    numSuits: number,
    _arbitrate: number,
    suit1: number,
    suit2: number,
    suit3: number = NONE,
    suit4: number = NONE,
    orderOut?: number[],
  ): number {
    const suitArr = [suit1, suit2, suit3, suit4];

    // first sort the suits by length
    for (let i = 0; i < numSuits; i++) {
      for (let j = 0; j < numSuits - 1; j++) {
        if (this.suits[suitArr[j + 1]].length > this.suits[suitArr[j]].length) {
          [suitArr[j], suitArr[j + 1]] = [suitArr[j + 1], suitArr[j]];
        }
      }
    }

    // and then by high cards
    // a suit must have at least as many cards & more HCPs
    // in order to be superior, OR four HCPs per card that it's short.
    for (let i = 0; i < numSuits; i++) {
      for (let j = 0; j < numSuits - 1; j++) {
        const len1 = this.suits[suitArr[j]].length;
        const len2 = this.suits[suitArr[j + 1]].length;
        const ld = len1 - len2;
        const pts1 = this.suits[suitArr[j]].hcPoints;
        const pts2 = this.suits[suitArr[j + 1]].hcPoints;
        if ((pts2 > pts1 && len2 >= len1) || pts2 > pts1 + ld * 4) {
          [suitArr[j], suitArr[j + 1]] = [suitArr[j + 1], suitArr[j]];
        } else if ((pts2 === pts1 && len2 === len1) || pts2 === pts1 + ld * 4) {
          if (suitArr[j + 1] > suitArr[j]) {
            [suitArr[j], suitArr[j + 1]] = [suitArr[j + 1], suitArr[j]];
          }
        }
      }
    }

    if (orderOut) {
      for (let i = 0; i < numSuits; i++) orderOut[i] = suitArr[i];
      for (let i = numSuits; i < 4; i++) orderOut[i] = NONE;
    }
    return suitArr[0];
  }

  //
  // AllSuitsStopped()
  //
  allSuitsStopped(includeProbStoppers = false): boolean {
    if (!this.countPerformed) this.countPoints(true);
    if (includeProbStoppers) {
      return this.numSuitsStoppedValue + this.numSuitsProbStoppedValue >= 4;
    }
    return this.numSuitsStoppedValue >= 4;
  }

  //
  // AllOtherSuitsStopped()
  //
  // determines whether all suits other than the ones given are stopped.
  // useful when deciding whether to go for a NT contract
  //
  allOtherSuitsStopped(
    suit1: number,
    suit2: number = NONE,
    suit3: number = NONE,
    includeProbStoppers = false,
  ): boolean {
    if (!this.countPerformed) this.countPoints(true);
    for (let i = 0; i < 4; i++) {
      if (i === suit1 || i === suit2 || i === suit3) continue;
      if (includeProbStoppers) {
        if (!this.suits[i].isSuitProbablyStopped) return false;
      } else {
        if (!this.suits[i].isSuitStopped) return false;
      }
    }
    return true;
  }

  //
  // Balanced hand test
  //
  get isBalanced(): boolean {
    if (!this.countPerformed) this.countPoints(true);
    if (this.cards.length < 13) {
      const lengths = [0, 1, 2, 3].map(s => this.getSuitLength(s as Suit)).sort((a, b) => b - a);
      return lengths[0] <= 5 && lengths.filter(l => l === 0).length === 0;
    }
    // a hand is considered balanced if it has no voids,
    // no singletons, and no more than one doubleton.
    // e.g., 4/3/3/3, 4/4/3/2, and 5/3/3/2
    return this.balanceValueValue <= 2 && this.numDoubletonsValue <= 1;
  }

  //
  // Semi-balanced test
  //
  get isSemiBalanced(): boolean {
    if (!this.countPerformed) this.countPoints(true);
    // basic rqmt is no voids, no more than one singleton, and no 7-card suits.
    // e.g., 6/4/2/1, 5/4/2/2, and 4/4/4/1
    return (
      this.numSuitsOfAtLeast[7] === 0 &&
      this.numVoidsValue === 0 &&
      this.numSingletonsValue <= 1
    );
  }

  //
  // GetLongestSuit()
  //
  getLongestSuit(type: SuitType = SuitType.Any): Suit | typeof NONE {
    if (this.suitsByLength[0] === NONE) this.sortSuitsByLength();
    switch (type) {
      case SuitType.Any:
        return this.longestSuitValue;
      case SuitType.Major:
        for (let i = 0; i < 4; i++) {
          if (isMajor(this.suitsByLength[i])) return this.suitsByLength[i] as Suit;
        }
        break;
      case SuitType.Minor:
        for (let i = 0; i < 4; i++) {
          if (isMinor(this.suitsByLength[i])) return this.suitsByLength[i] as Suit;
        }
        break;
    }
    return NONE;
  }

  //
  // GetDiscard()
  //
  getDiscard(
    leadCard: Card | null,
    trumpSuit: Suit | typeof NONE = NONE,
    prioritySuit: Suit | typeof NONE = NONE,
    partnersPrioritySuit: Suit | typeof NONE = NONE,
  ): Card | null {
    if (this.suitsByLength[0] === NONE) this.sortSuitsByLength();
    if (this.suitsByPreference[0] === NONE) {
      this.rankSuits(4, 0, Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades, this.suitsByPreference);
    }

    let discardSuit: SuitHoldings | null = null;
    const suitLed = leadCard ? leadCard.suit : NONE;

    // see if we have cards in the suit led
    if (isSuit(suitLed) && this.suits[suitLed].length > 0) {
      // we have no choice but to follow suit, so return the lowest card in the suit
      return this.suits[suitLed].bottomCard;
    }

    // here we have no more cards in the suit, so discard from another suit
    if (isSuit(trumpSuit)) {
      if (this.suits[trumpSuit].length > 0) {
        // first find the shortest suit with no winners, if there is one
        for (let i = 3; i >= 0; i--) {
          const suit = this.suitsByLength[i] as Suit;
          // protect high honors, even if they're not sure winners
          if (
            this.suits[suit].hasKing() ||
            (this.suits[suit].hasQueen() && this.suits[suit].length >= 2)
          ) {
            continue;
          }
          if (
            suit !== trumpSuit &&
            this.suits[suit].length > 0 &&
            this.suits[suit].numWinners === 0
          ) {
            discardSuit = this.suits[suit];
            break;
          }
        }
        // pick the shortest non-void, non-trump suit that has at least one loser
        if (!discardSuit) {
          for (let i = 3; i >= 0; i--) {
            const suit = this.suitsByLength[i] as Suit;
            if (
              suit !== trumpSuit &&
              this.suits[suit].length > 0 &&
              this.suits[suit].numLosers > 0
            ) {
              discardSuit = this.suits[suit];
              break;
            }
          }
        }
        if (!discardSuit) {
          if (this.cards.length === this.suits[trumpSuit].length) {
            // no cards outside the trump suit? then we have no choice -- "discard" a trump
            discardSuit = this.suits[trumpSuit];
          } else {
            for (let i = 3; i >= 0; i--) {
              const suit = this.suitsByLength[i] as Suit;
              if (this.suits[suit].length > 0 && suit !== trumpSuit) {
                discardSuit = this.suits[suit];
                break;
              }
            }
          }
        }
        return discardSuit?.bottomCard ?? this.bottomCard;
      } else {
        // out of trumps: return the bottom card of the worst suit
        for (let i = 3; i >= 0; i--) {
          const suit = this.suitsByPreference[i] as Suit;
          if (this.suits[suit].length > 0 && this.suits[suit].length > this.suits[suit].numWinners) {
            discardSuit = this.suits[suit];
            break;
          }
        }
        if (!discardSuit) {
          for (let i = 3; i >= 0; i--) {
            const suit = this.suitsByPreference[i] as Suit;
            if (this.suits[suit].length > 0) {
              discardSuit = this.suits[suit];
              break;
            }
          }
        }
        return discardSuit?.bottomCard ?? this.bottomCard;
      }
    } else {
      // playing no trumps: generally return the bottom card of the longest suit
      let suit = this.suitsByLength[0] as Suit;
      if (
        (isSuit(suit) && (suit === prioritySuit || suit === partnersPrioritySuit)) ||
        (isSuit(suit) && this.suits[suit].numLosers === 0)
      ) {
        let found = false;
        for (let i = 1; i < 4; i++) {
          const candidate = this.suitsByLength[i] as Suit;
          if (!isSuit(candidate)) break;
          if (this.suits[candidate].numLosers > 0) {
            suit = candidate;
            found = true;
            break;
          }
        }
        if (!found) suit = this.suitsByLength[0] as Suit;
      }
      return isSuit(suit) ? this.suits[suit].bottomCard : this.bottomCard;
    }
  }

  //
  // Compatibility & C++ inline accessors
  //

  get cardsList(): CardList {
    return this;
  }

  get highCardPoints(): number {
    if (!this.countPerformed) this.countPoints(true);
    return this.numHCPoints;
  }

  getCardsInSuit(suit: Suit): readonly Card[] {
    return this.suits[suit].cardsInAscendingDeckOrder;
  }

  getSuit(suit: Suit): SuitHoldings {
    return this.suits[suit];
  }

  getSuitLength(suit: Suit): number {
    return this.suits[suit].length;
  }

  getNumCardsInSuit(suit: Suit): number {
    return this.suits[suit].length;
  }

  isSuitVoid(suit: Suit): boolean {
    return this.suits[suit].length === 0;
  }

  getSuitStrength(suit: Suit): number {
    return this.suits[suit].strength;
  }

  getSuitRank(suit: Suit): number {
    return this.suits[suit].rank;
  }

  getSuitHCPoints(suit: Suit): number {
    return this.suits[suit].hcPoints;
  }

  getNumHonorsInSuit(suit: Suit): number {
    return this.suits[suit].numHonors;
  }

  isSuitSolid(suit: Suit): boolean {
    return this.suits[suit].isSolid;
  }

  isSuitRebiddable(suit: Suit): boolean {
    return this.suits[suit].isRebiddable;
  }

  isSuitSelfSupporting(suit: Suit): boolean {
    return this.suits[suit].isSelfSupporting;
  }

  isSuitStopped(suit: Suit): boolean {
    return this.suits[suit].isSuitStopped;
  }

  isSuitProbablyStopped(suit: Suit): boolean {
    return this.suits[suit].isSuitProbablyStopped;
  }

  getUnstoppedSuitNames(): string {
    return this.strSuitsUnstopped;
  }

  suitHasAce(suit: Suit): boolean {
    return this.suits[suit].hasAce();
  }

  suitHasKing(suit: Suit): boolean {
    return this.suits[suit].hasKing();
  }

  suitHasCard(suit: Suit, faceValue: number): boolean {
    return this.suits[suit].hasCardOfFaceValue(faceValue);
  }

  getCardInSuit(suit: Suit, index: number): Card | undefined {
    return this.suits[suit].at(index);
  }

  getLowestMarginalSuit(): Suit | typeof NONE {
    return this.lowestMarginalSuit as Suit | typeof NONE;
  }

  getLowestOpenableSuit(): Suit | typeof NONE {
    return this.lowestOpenableSuit as Suit | typeof NONE;
  }

  getLowestSolidSuit(): Suit | typeof NONE {
    return this.lowestSolidSuit as Suit | typeof NONE;
  }

  getLowestAbsoluteSuit(): Suit | typeof NONE {
    return this.lowestAbsoluteSuit as Suit | typeof NONE;
  }

  getCardByValue(deckValue: number): Card | undefined {
    return this.suits[cardSuit(deckValue)].findCardByFaceValue(faceValue(deckValue));
  }

  get numVoids(): number {
    return [0, 1, 2, 3].filter(suit => this.getSuitLength(suit as Suit) === 0).length;
  }

  get numSingletons(): number {
    return [0, 1, 2, 3].filter(suit => this.getSuitLength(suit as Suit) === 1).length;
  }

  get numDoubletons(): number {
    return [0, 1, 2, 3].filter(suit => this.getSuitLength(suit as Suit) === 2).length;
  }

  get numAces(): number {
    this.countPoints(true);
    return this.aces;
  }

  get numKings(): number {
    this.countPoints(true);
    return this.kings;
  }

  get numQueens(): number {
    this.countPoints(true);
    return this.queens;
  }

  get numJacks(): number {
    this.countPoints(true);
    return this.jacks;
  }

  get numTens(): number {
    this.countPoints(true);
    return this.tens;
  }

  get balanceValue(): number {
    this.countPoints(true);
    return this.balanceValueValue;
  }

  get shortPoints(): number {
    this.countPoints(true);
    return this.shortPointsValue;
  }

  get longPoints(): number {
    this.countPoints(true);
    return this.longPointsValue;
  }

  get distPoints(): number {
    this.countPoints(true);
    return this.distPointsValue;
  }

  get bonusPoints(): number {
    this.countPoints(true);
    return this.bonusPointsValue;
  }

  get penaltyPoints(): number {
    this.countPoints(true);
    return this.penaltyPointsValue;
  }

  get totalPoints(): number {
    this.countPoints(true);
    return this.totalPointsValue;
  }

  get totalAdjustedPoints(): number {
    return this.adjustedPointsValue;
  }

  get numQuickTricks(): number {
    this.countPoints(true);
    return this.quickTricks;
  }

  get numSuitsStopped(): number {
    if (!this.countPerformed) this.countPoints(true);
    return this.numSuitsStoppedValue;
  }

  get numSuitsProbStopped(): number {
    if (!this.countPerformed) this.countPoints(true);
    return this.numSuitsProbStoppedValue;
  }

  get preferredSuit(): Suit | typeof NONE {
    return this.preferredSuitValue;
  }

  getSuitsByPreference(index: number): number {
    return this.suitsByPreference[index] ?? NONE;
  }

  getSuitsByLength(index: number): number {
    return this.suitsByLength[index] ?? NONE;
  }

  getNumSuitsOfAtLeast(length: number): number {
    return this.numSuitsOfAtLeast[length] ?? 0;
  }

  get numOpenableSuits(): number { return this.numOpenableSuitsValue; }
  get numPreferredSuits(): number { return this.numPreferredSuitsValue; }
  get numSolidSuits(): number { return this.numSolidSuitsValue; }
  get numAbsoluteSuits(): number { return this.numAbsoluteSuitsValue; }
  get numRebiddableSuits(): number { return this.numRebiddableSuitsValue; }
  get numWinners(): number { return this.numWinnersValue; }
  get numLosers(): number { return this.numLosersValue; }
  get numLikelyWinners(): number { return this.numLikelyWinnersValue; }
  get numLikelyLosers(): number { return this.numLikelyLosersValue; }
  get numTopCards(): number { return this.numTopCardsValue; }

  getPbnHoldings(): string {
    return [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
      .map(suit => this.suits[suit].cardsInAscendingDeckOrder
        .map(card => card.cardLetter)
        .join(''))
      .join('.');
  }

  getInitialPbnHoldings(): string {
    const suits: CardList[] = [new CardList(), new CardList(), new CardList(), new CardList()];
    for (const card of this.initialHand.cardsInAscendingDeckOrder) suits[card.suit].add(card);
    return [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
      .map(suit => suits[suit].cardsInAscendingDeckOrder
        .map(card => card.cardLetter)
        .join(''))
      .join('.');
  }
}

export { Hand as HandHoldings };
