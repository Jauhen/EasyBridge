//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CSuitHoldings (SuitHoldings.H / SuitHoldings.cpp)
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { ACE, isSuit, JACK, KING, NONE, QUEEN, Suit, TEN } from '../constants.js';
import { SuitStrength } from '../bidding/bidParameters.js';
import { CardHoldings } from './cardHoldings.js';
import { GuessedCardHoldings } from './guessedCardHoldings.js';

export interface SuitEvaluationOptions {
  fiveCardMajors?: boolean;
  countShortSuits?: boolean;
  penalizeUGHonors?: boolean;
  playedCards?: GuessedCardHoldings;
}

export class SuitHoldings extends CardHoldings {
  protected suitValue: Suit = NONE as Suit;
  protected rankValue = NONE;
  protected strengthValue: number = SuitStrength.None;
  protected numLengthPoints = 0;
  protected numShortPoints = 0;
  protected numBonusPoints = 0;
  protected numPenaltyPoints = 0;
  protected numTotalPoints = 0;

  // honors & tenace info
  protected numHonorsValue = 0;
  protected numPseudoHonorsValue = 0;
  protected numBodyCardsValue = 0;
  protected highestHonor = NONE;
  protected lowestHonor = NONE;
  protected lowestPseudoHonor = NONE;
  protected missingHonors: number[] = [NONE, NONE, NONE, NONE, NONE];
  protected numMissingHonorsValue = 0;          // e.g., in AQx, 3 (counting the Jack)
  protected numMissingTopHonorsValue = 0;       // e.g., in QJT, 2
  protected numMissingInternalHonorsValue = 0;  // e.g., in AKT, 2
  protected numMissingBottomHonorsValue = 0;    // e.g., in AQx, 2
  protected numTopHonorsValue = 0;              // e.g., in AKxx, 2 (the AK)
  protected numSecondaryHonorsValue = 0;        // e.g., in AQTx, 2 (the QT)
  protected numTopCardsValue = 0;               // e.g., in AKQJT9, 6
  protected numSequencesValue = 0;
  protected numMissingSequencesValue = 0;

  protected readonly honorsList = new CardHoldings();
  protected readonly bodyCardsList = new CardHoldings();
  protected readonly likelyWinnersList = new CardHoldings();
  protected readonly likelyLosersList = new CardHoldings();
  protected sequenceList: CardList[] = [];
  protected missingSequenceList: CardList[] = [];

  protected haveAce = false;
  protected haveKing = false;
  protected quickTricksValue = 0;
  protected numStoppersValue = 0;
  protected likelyWinners = 0;
  protected likelyLosers = 0;
  protected numWinnersValue = 0;  // likely winning cards
  protected numLosersValue = 0;   // likely losers

  protected enableSuitSortingFlag = true; // sorting within a suit

  protected solid = false;
  protected preferred = false;
  protected rebiddable = false;
  protected selfSupporting = false;
  protected suitStopped = false;
  protected suitProbablyStopped = false;

  protected strCompressedHoldings = 'void';

  constructor() {
    super();
  }

  override init(): void {
    // base no-op
  }

  override clear(): void {
    super.clear();

    this.enableSuitSortingFlag = true;
    this.rankValue = NONE;
    this.strengthValue = SuitStrength.None;
    this.numLengthPoints = 0;
    this.numShortPoints = 0;
    this.numBonusPoints = 0;
    this.numPenaltyPoints = 0;
    this.numTotalPoints = 0;

    this.numTopCardsValue = 0;
    this.numHonorsValue = 0;
    this.numPseudoHonorsValue = 0;
    this.numBodyCardsValue = 0;
    this.highestHonor = NONE;
    this.lowestHonor = NONE;
    this.lowestPseudoHonor = NONE;
    this.missingHonors = [NONE, NONE, NONE, NONE, NONE];
    this.numMissingHonorsValue = 0;
    this.numMissingTopHonorsValue = 0;
    this.numMissingInternalHonorsValue = 0;
    this.numMissingBottomHonorsValue = 0;
    this.numTopHonorsValue = 0;
    this.numSecondaryHonorsValue = 0;

    // clear card lists
    this.honorsList.clear();
    this.bodyCardsList.clear();
    this.likelyWinnersList.clear();
    this.likelyLosersList.clear();

    // clear the sequence list
    this.numSequencesValue = 0;
    this.sequenceList = [];
    this.numMissingSequencesValue = 0;
    this.missingSequenceList = [];

    this.haveAce = false;
    this.haveKing = false;

    this.quickTricksValue = 0;
    this.numStoppersValue = 0;
    this.likelyWinners = 0;
    this.likelyLosers = 0;
    this.numWinnersValue = 0;
    this.numLosersValue = 0;

    this.solid = false;
    this.preferred = false;
    this.rebiddable = false;
    this.selfSupporting = false;
    this.suitStopped = false;
    this.suitProbablyStopped = false;
    this.strCompressedHoldings = 'void';
  }

  override formatHoldingsString(): void {
    // format the holdings string
    // don't use the base class implementation
    if (this.cards.length > 0) {
      this.strHoldings = this.cards.map(card => card.cardLetter).join('');
    } else {
      this.strHoldings = '---';
    }

    // and format the compressed holdings string
    // same as above for now, but may change later
    if (this.cards.length === 0) {
      this.strCompressedHoldings = 'void';
    } else {
      this.strCompressedHoldings = this.cards.map(card => card.cardLetter).join('');
    }

    this.formatGIBHoldingsString();
  }

  override add(card: Card, sort = false): void {
    super.add(card, sort);
    if (sort || this.autoSort) {
      // reassign cards' suit positions
      if (this.enableSuitSortingFlag) {
        for (let i = 0; i < this.cards.length; i++) {
          this.cards[i].setSuitPosition(i);
        }
      }
    }
  }

  addCard(card: Card): void {
    this.add(card);
  }

  override removeByIndex(index: number): Card | null {
    // call base class operation
    const card = super.removeByIndex(index);
    // then reset suit indices
    if (this.enableSuitSortingFlag) {
      for (let i = 0; i < this.cards.length; i++) {
        this.cards[i].setSuitPosition(i);
      }
    }
    this.formatHoldingsString();
    return card;
  }

  override sort(): void {
    // first call base class
    super.sort();

    // now reassign cards' suit positions
    if (this.enableSuitSortingFlag) {
      for (let i = 0; i < this.cards.length; i++) {
        this.cards[i].setSuitPosition(i);
      }
    }
  }

  //
  // GetLowestCardAbove()
  //
  // returns the lowest card in the suit above the specified card
  //
  override getLowestCardAbove(faceValueOrCard: number | Card): Card | null {
    const faceValue = typeof faceValueOrCard === 'number'
      ? faceValueOrCard
      : faceValueOrCard.faceValue;
    if (this.getNumCardsAbove(faceValue) === 0) return null;
    for (let i = this.cards.length - 1; i >= 0; i--) {
      if (this.cards[i].faceValue > faceValue) {
        return this.cards[i];
      }
    }
    return null;
  }

  enableSuitSorting(value = true): void {
    this.enableSuitSortingFlag = value;
  }

  //
  // CountCards()
  //
  // called to count basic items in the suit
  // separated out from the point count cuz the card count can be done many times
  // during the course of a hand, while the point count is only done once, for bidding
  //
  countCards(): void {
    // do a basic honors check
    this.haveAce = false;
    this.haveKing = false;
    this.numHonorsValue = 0;
    this.numPseudoHonorsValue = 0;

    for (let i = 0; i < this.cards.length; i++) {
      const fv = this.cards[i].faceValue;
      if (fv === ACE) this.haveAce = true;
      else if (fv === KING) this.haveKing = true;
      if (fv >= JACK) this.numHonorsValue++;
      if (fv >= TEN) this.numPseudoHonorsValue++;
    }
  }

  //
  // CountPoints()
  //
  // called right after the deal to count points in the hand
  //
  override countPoints(forceCount = false, options: SuitEvaluationOptions = {}): number {
    // avoid repeating the count unless forced to do so
    if (this.countPerformed && !forceCount) {
      return this.numTotalPoints;
    }

    const fiveCardMajors = options.fiveCardMajors ?? true;
    const countShortSuits = options.countShortSuits ?? false;
    const penalizeUGHonors = options.penalizeUGHonors ?? true;

    // first call the base class
    super.countPoints(forceCount);

    // then sort the suit
    if (!this.sorted) this.sort();

    // check key holdings and form sequences
    this.checkKeyHoldings(options.playedCards);

    // count long points if the suit is good
    // i.e., 2+ honors of KJ or better (i.e., 4+ HCPs)
    this.numLengthPoints = 0;
    if (fiveCardMajors) {
      // if playing 5-card majors, add 1 pt for the sixth card + 2 per extra card
      if (this.cards.length > 5 && this.numHonorsValue >= 2 && this.numHCPoints >= 4) {
        this.numLengthPoints = 1 + 2 * (this.cards.length - 6);
      }
    } else {
      // if playing 4-card majors, 5th card = 1 pts and each add'l = 2 pts
      if (this.cards.length > 4 && this.numHonorsValue >= 2 && this.numHCPoints >= 4) {
        this.numLengthPoints = 1 + 2 * (this.cards.length - 5);
      }
    }

    // and set the total points tally
    if (countShortSuits) {
      this.numTotalPoints = this.numHCPoints + this.numLengthPoints + this.numShortPoints;
    } else {
      this.numTotalPoints = this.numHCPoints + this.numLengthPoints;
    }

    // check for unguarded/poorly guarded honors
    this.numPenaltyPoints = 0;
    if (penalizeUGHonors) {
      if (this.cards.length === 1) {
        // singleton King = -1.5 pts
        if (this.cards[0].faceValue === KING) this.numPenaltyPoints += 1.5;
        // singleton Queen = -1 pts
        if (this.cards[0].faceValue === QUEEN) this.numPenaltyPoints += 1;
        // singleton Jack = -0.5 pts
        if (this.cards[0].faceValue === JACK) this.numPenaltyPoints += 0.5;
      }
      if (this.cards.length === 2 && this.cards[1].faceValue < 10) {
        // Qx = -1 pts
        if (this.cards[0].faceValue === QUEEN) this.numPenaltyPoints += 1;
        // Jx = -0.5 pts
        if (this.cards[0].faceValue === JACK) this.numPenaltyPoints += 0.5;
      }
      if (
        this.cards.length === 3 &&
        this.cards[0].faceValue === JACK &&
        this.cards[1].faceValue < 10
      ) {
        // Jxx = -0.5 pts
        this.numPenaltyPoints += 0.5;
      }
    }

    // now check the suit for QTs and stoppers
    this.suitStopped = false;
    this.suitProbablyStopped = false;
    this.numStoppersValue = 0;
    this.quickTricksValue = 0;

    // first count quick tricks
    if (
      this.cards.length >= 2 &&
      this.cards[0].faceValue === ACE &&
      this.cards[1].faceValue === KING
    ) {
      // AK == 2 quick tricks & a stopper
      this.quickTricksValue = 2;
      this.numStoppersValue = 2;
      this.suitStopped = true;
      this.suitProbablyStopped = true;
    } else if (
      this.cards.length >= 2 &&
      this.cards[0].faceValue === ACE &&
      this.cards[1].faceValue === QUEEN
    ) {
      // AQ == 1-1/2 quick tricks & a stopper
      this.quickTricksValue = 1.5;
      this.numStoppersValue = 2;
      this.suitStopped = true;
      this.suitProbablyStopped = true;
    } else if (this.cards.length >= 1 && this.cards[0].faceValue === ACE) {
      // A == 1 quick trick & a stopper
      this.quickTricksValue = 1;
      this.numStoppersValue = 1;
      this.suitStopped = true;
      this.suitProbablyStopped = true;
    } else if (
      this.cards.length >= 2 &&
      this.cards[0].faceValue === KING &&
      this.cards[1].faceValue === QUEEN
    ) {
      // KQ == 1 quick trick & a stopper
      this.quickTricksValue = 1;
      this.numStoppersValue = 2;
      this.suitStopped = true;
      this.suitProbablyStopped = true;
    } else if (this.cards.length >= 2 && this.cards[0].faceValue === KING) {
      // Kx == 1/2 quick trick & a stopper
      this.quickTricksValue = 0.5;
      this.numStoppersValue = 1;
      this.suitStopped = true;
      this.suitProbablyStopped = true;
    } else if (
      this.cards.length >= 3 &&
      this.cards[0].faceValue === QUEEN &&
      this.cards[1].faceValue === JACK &&
      this.cards[2].faceValue === TEN
    ) {
      // QJT == no quick tricks, but a stopper
      this.numStoppersValue = 3;
      this.suitStopped = true;
      this.suitProbablyStopped = true;
    } else if (this.cards.length >= 3 && this.cards[0].faceValue === QUEEN) {
      // Qxx = no QTs, but a stopper
      this.numStoppersValue = 1;
      this.suitStopped = true;
      this.suitProbablyStopped = true;
    } else if (
      this.cards.length >= 4 &&
      this.cards[0].faceValue === JACK &&
      this.cards[1].faceValue === TEN &&
      this.cards[2].faceValue === 9 &&
      this.cards[3].faceValue === 8
    ) {
      // JT98 = no QTs, but a stopper
      this.numStoppersValue = 4;
      this.suitStopped = true;
      this.suitProbablyStopped = true;
    } else if (this.cards.length >= 4 && this.cards[0].faceValue === JACK) {
      // Jxxx = no QTs, but a probable stopper
      this.suitProbablyStopped = true;
      this.numStoppersValue = 1;
    }

    // done
    return this.numTotalPoints;
  }

  //
  // CheckKeyHoldings()
  //
  // check key cards and form sequences
  //
  checkKeyHoldings(playedCards?: GuessedCardHoldings): number {
    this.countCards();

    // clear existing sequences
    this.sequenceList = [];
    this.numSequencesValue = 0;
    this.missingSequenceList = [];
    this.numMissingSequencesValue = 0;

    this.honorsList.clear();
    this.bodyCardsList.clear();
    this.likelyWinnersList.clear();
    this.likelyLosersList.clear();

    // clear values
    this.numBodyCardsValue = 0;
    this.highestHonor = NONE;
    this.lowestHonor = NONE;
    this.lowestPseudoHonor = NONE;
    this.missingHonors = [NONE, NONE, NONE, NONE, NONE];
    this.numMissingHonorsValue = 0;
    this.numMissingTopHonorsValue = 0;
    this.numMissingBottomHonorsValue = 0;
    this.numMissingInternalHonorsValue = 0;
    this.numTopCardsValue = 0;
    this.numTopHonorsValue = 0;
    this.numSecondaryHonorsValue = 0;
    this.likelyWinners = 0;
    this.likelyLosers = 0;
    this.numWinnersValue = 0;
    this.numLosersValue = 0;

    // sort honors & body cards
    let i = 0;
    for (i = 0; i < this.numPseudoHonorsValue; i++) {
      this.honorsList.add(this.cards[i]);
    }
    for (; i < this.cards.length; i++) {
      this.bodyCardsList.add(this.cards[i]);
    }
    this.numBodyCardsValue = this.cards.length - this.numPseudoHonorsValue;

    if (this.numHonorsValue > 0) {
      this.highestHonor = this.cards[0].faceValue;
      this.lowestHonor = this.cards[this.numHonorsValue - 1].faceValue;
      this.lowestPseudoHonor = this.cards[this.numPseudoHonorsValue - 1].faceValue;
    }

    const playedCardsList = playedCards ?? new GuessedCardHoldings();

    // check for cards missing from an AKQJT sequence
    for (i = 0; i < 5; i++) {
      const cardVal = ACE - i;
      if (!this.honorsList.hasCardOfFaceValue(cardVal)) {
        // see if the card has been played
        if (!playedCardsList.hasCardOfFaceValue(cardVal)) {
          // card is still outstanding
          this.missingHonors[this.numMissingHonorsValue] = cardVal;
          this.numMissingHonorsValue++;
        }
      }
    }

    if (this.cards.length > 0) {
      this.numMissingTopHonorsValue = Math.min(5, ACE - this.cards[0].faceValue);
    }
    if (this.lowestPseudoHonor > TEN) {
      this.numMissingBottomHonorsValue = Math.min(4, this.lowestPseudoHonor - TEN);
    }
    this.numMissingInternalHonorsValue =
      this.numMissingHonorsValue -
      this.numMissingTopHonorsValue -
      this.numMissingBottomHonorsValue;
    if (this.numMissingInternalHonorsValue < 0) {
      this.numMissingInternalHonorsValue = 0;
    }

    let prevCardVal = ACE;
    for (let idx = 0; idx < this.cards.length; idx++) {
      // consecutive high cards = sure winners
      // e.g., in AKTxx, AK are the top cards
      if (playedCardsList.hasCardOfFaceValue(prevCardVal)) {
        // skip cards that have been played
        prevCardVal--;
        idx--;
        continue;
      }
      if (this.cards[idx].faceValue === prevCardVal) {
        this.numTopCardsValue++;
        if (this.cards[idx].faceValue >= TEN) {
          this.numTopHonorsValue++;
        }
        prevCardVal--;
      }
    }
    this.numSecondaryHonorsValue = this.numPseudoHonorsValue - this.numTopHonorsValue;

    // build the sequence list
    for (let idx = 0; idx < this.cards.length;) {
      const list = new CardList();
      this.sequenceList.push(list);
      this.numSequencesValue++;
      do {
        list.add(this.cards[idx++]);
      } while (
        idx < this.cards.length &&
        this.cards[idx].faceValue === this.cards[idx - 1].faceValue - 1
      );
      list.formatHoldingsString();
    }

    // and form the list of missing card sequences
    if (isSuit(this.suitValue)) {
      for (let val = ACE; val >= 2; val--) {
        if (!this.hasCardOfFaceValue(val) && !playedCardsList.hasCardOfFaceValue(val)) {
          const list = new CardList();
          this.missingSequenceList.push(list);
          this.numMissingSequencesValue++;
          while (val >= 2 && !this.hasCardOfFaceValue(val)) {
            list.add(new Card(this.suitValue, val));
            val--;
          }
          list.formatHoldingsString();
        }
      }
    }

    // adjust winners & losers counts
    this.numWinnersValue = this.numTopCardsValue;
    const numCardsOutstanding = 13 - this.cards.length - playedCardsList.numDefiniteCards;
    if (this.cards.length > this.numTopCardsValue) {
      // see if we have more cards than those left outstanding
      if (this.numTopCardsValue >= numCardsOutstanding) {
        this.numWinnersValue += this.cards.length - this.numTopCardsValue;
      }
    }
    this.numLosersValue = this.cards.length - this.numWinnersValue;

    // adjust likely winners & losers
    this.likelyWinners = this.numWinnersValue;
    this.likelyLosers = this.numLosersValue;

    // adjust winner & loser lists
    for (i = 0; i < this.likelyWinners; i++) {
      this.likelyWinnersList.add(this.cards[i]);
    }
    for (; i < this.cards.length; i++) {
      this.likelyLosersList.add(this.cards[i]);
    }

    return 0;
  }

  //
  // EvaluateHoldings()
  //
  // called to evaluate the strength of this suit and estimate
  // the numbers of winners and losers
  //
  override evaluateHoldings(options: SuitEvaluationOptions = {}): void {
    const fiveCardMajors = options.fiveCardMajors ?? true;

    // first clear variables
    this.solid = false;
    this.rebiddable = false;
    this.selfSupporting = false;
    this.preferred = false;
    this.likelyWinners = 0;
    this.likelyLosers = 0;
    this.numWinnersValue = 0;
    this.numLosersValue = 0;
    this.rankValue = NONE;

    // first check length of suit
    const len = this.cards.length;
    if (len === 0) {
      this.strengthValue = SuitStrength.Void;
    } else if (len < 2) {
      // 1 card == suit is unusable except opposite a great holding by partner
      this.strengthValue = SuitStrength.Unusable;
    } else if (len === 2) {
      // 2 cards == poor holding; may be usable opposite a rebid suit
      this.strengthValue = SuitStrength.Poor;
    } else if (len === 3) {
      // if playing 5-card majors, suit is weak to moderate support with 3 cards
      if (fiveCardMajors) {
        if (this.numHCPoints >= 2) this.strengthValue = SuitStrength.ModerateSupport; // Qxx
        else this.strengthValue = SuitStrength.WeakSupport;
      } else {
        // else with 4-card majors, the suit is nominally unusable in the support role
        // unless it has >= 2 HCPs (a Queen or better)
        if (this.numHCPoints >= 2) this.strengthValue = SuitStrength.WeakSupport;
        else this.strengthValue = SuitStrength.Unusable;
      }
    } else if (len === 4) {
      // if all small cards, it's a moderate support suit;
      // else, with 1-3 honor pts, a good support suit
      // & with 4+ honor points, is an openable suit
      if (this.numHCPoints === 0) this.strengthValue = SuitStrength.ModerateSupport;
      else if (this.numHCPoints <= 3) this.strengthValue = SuitStrength.GoodSupport; // == SS_MARGINAL_OPENER
      else this.strengthValue = SuitStrength.Openable; // == SS_STRONG_SUPPORT
    } else if (len === 5) {
      // if it has 0-2 pts, it's a good support suit
      // if it has 3-7 pts, it's an openable suit
      // else with 8+ HCPs, it's a strong suit
      if (this.numHCPoints >= 0 && this.numHCPoints <= 2) {
        this.strengthValue = SuitStrength.GoodSupport;
      } else if (this.numHCPoints >= 3 && this.numHCPoints <= 7) {
        this.strengthValue = SuitStrength.Openable;
      } else {
        this.strengthValue = SuitStrength.Strong;
      }
    } else if (len === 6) {
      // with 0-4 honor pts, it's an opener
      // with 5-7 honor points, it's a strong suit
      // else with 8+ pts, it's an absolute suit
      if (this.numHCPoints <= 4) this.strengthValue = SuitStrength.Openable;
      else if (this.numHCPoints >= 5 && this.numHCPoints <= 7) this.strengthValue = SuitStrength.Strong;
      else this.strengthValue = SuitStrength.Absolute;
    } else if (len >= 7) {
      // with 0-4 honor pts, it's an openable suit
      // with 5-6 honor points, it's a strong suit
      // else with 7+ honor points, it's an absolute suit
      if (this.numHCPoints <= 4) this.strengthValue = SuitStrength.Openable;
      else if (this.numHCPoints >= 5 && this.numHCPoints <= 6) this.strengthValue = SuitStrength.Strong;
      else this.strengthValue = SuitStrength.Absolute;
    }

    // perform some quality test on the suit

    // see if the suit is "Solid"
    // need 3 honors with a minimum of AKQ
    if (len >= 5 && this.numHCPoints >= 9 && this.numHonorsValue >= 3) {
      this.solid = true;
    }

    // see if the suit is self-supporting
    // for a suit to be self-supporting, it needs either
    // 6+ cards with 4 honors or 7+ cards with 3 honors
    if ((len >= 6 && this.numHonorsValue === 4) || (len >= 7 && this.numHonorsValue === 3)) {
      this.selfSupporting = true;
    }

    // see if the suit is rebiddable
    // any six-card suit or a 5-card suit with 2 honors is rebiddable
    if (len >= 6 || (len === 5 && this.numHonorsValue >= 2)) {
      this.rebiddable = true;
    }

    // now count the likely winners & losers by subtracting for missing key cards
    if (len === 0) {
      // no winners or losers here
    } else if (len === 1) {
      // if the card is not an ace, 1 loser
      if (this.cards[0].faceValue !== ACE) this.likelyLosers++;
    } else if (len === 2) {
      // need AK to have 2 winners
      if (this.cards[0].faceValue !== ACE) {
        // 1 loser already; check if the top card is a king
        if (this.cards[0].faceValue !== KING) {
          // the first card is not an Ace, and not a King = 2 losers
          this.likelyLosers += 2;
        } else {
          // Kx = 1 loser
          this.likelyLosers++;
        }
      } else {
        // first card is an Ace; check the second card
        if (this.cards[1].faceValue !== KING) {
          // 2nd card is not a King; 1 loser
          this.likelyLosers++;
        }
      }
    } else if (len < 10) {
      // with 10 or fewer cards, a missing ace, king, or queen each represents a loser
      if (!this.hasCardOfFaceValue(ACE)) this.likelyLosers++;
      if (!this.hasCardOfFaceValue(KING)) this.likelyLosers++;
      if (!this.hasCardOfFaceValue(QUEEN)) this.likelyLosers++;
      // the remaining cards are all winners if we hold at least one honor; else add 1 loser
      if (len >= 4 && this.numHCPoints === 0) {
        this.likelyLosers++;
      }
    }

    // and set the winners/losers count
    this.likelyWinners = len - this.likelyLosers;
    this.numLosersValue = this.likelyLosers;
    this.numWinnersValue = len - this.numLosersValue;

    // and form the winners and losers sequences
    this.likelyWinnersList.clear();
    this.likelyLosersList.clear();
    let i = 0;
    for (i = 0; i < this.likelyWinners; i++) {
      this.likelyWinnersList.add(this.cards[i]);
    }
    for (; i < len; i++) {
      this.likelyLosersList.add(this.cards[i]);
    }
  }

  //
  // ReevaluateHoldings()
  //
  // called to re-evaluate the suit after a card has been played from our hand
  //
  reevaluateHoldings(_card: Card | null = null, playedCards?: GuessedCardHoldings): void {
    // reset key holdings
    this.checkKeyHoldings(playedCards);
  }

  //
  // GetQualityTest()
  //
  // performs a basic quality test on the suit
  //
  getQualityTest(): number {
    return this.cards.length + this.numHonorsValue;
  }

  //
  // Accessors (C++ parity + backward-compatible TS properties)
  //

  setSuit(suit: Suit): void {
    this.suitValue = suit;
  }

  get suit(): Suit {
    return this.suitValue;
  }

  setRank(rank: number): void {
    this.rankValue = rank;
  }

  get rank(): number {
    return this.rankValue;
  }

  setStrength(strength: number): void {
    this.strengthValue = strength;
  }

  get strength(): number {
    return this.strengthValue;
  }

  get lengthInSuit(): number {
    return this.length;
  }

  get lengthPoints(): number {
    return this.numLengthPoints;
  }

  get shortPoints(): number {
    return this.numShortPoints;
  }

  get bonusPoints(): number {
    return this.numBonusPoints;
  }

  get penaltyPoints(): number {
    return this.numPenaltyPoints;
  }

  get totalPoints(): number {
    return this.numTotalPoints;
  }

  get numHonors(): number {
    return this.numHonorsValue;
  }

  get numPseudoHonors(): number {
    return this.numPseudoHonorsValue;
  }

  get numBodyCards(): number {
    return this.numBodyCardsValue;
  }

  get numTopCards(): number {
    return this.numTopCardsValue;
  }

  get numTopHonors(): number {
    return this.numTopHonorsValue;
  }

  get numSecondaryHonors(): number {
    return this.numSecondaryHonorsValue;
  }

  get numMissingHonors(): number {
    return this.numMissingHonorsValue;
  }

  get numMissingTopHonors(): number {
    return this.numMissingTopHonorsValue;
  }

  get numMissingInternalHonors(): number {
    return this.numMissingInternalHonorsValue;
  }

  get numMissingBottomHonors(): number {
    return this.numMissingBottomHonorsValue;
  }

  get lowestTopHonor(): Card | null {
    return this.numTopHonorsValue > 0 ? this.cards[this.numTopHonorsValue - 1] ?? null : null;
  }

  get highestSecondaryHonor(): Card | null {
    return this.numTopHonorsValue > 0 ? this.cards[this.numTopHonorsValue] ?? null : null;
  }

  get numSequences(): number {
    return this.numSequencesValue;
  }

  getSequence(index: number): CardList {
    return this.sequenceList[index];
  }

  get topSequence(): CardList | undefined {
    return this.sequenceList[0];
  }

  get secondSequence(): CardList | undefined {
    return this.sequenceList[1];
  }

  get numMissingSequences(): number {
    return this.numMissingSequencesValue;
  }

  getMissingSequence(index: number): CardList {
    return this.missingSequenceList[index];
  }

  get topMissingSequence(): CardList | undefined {
    return this.missingSequenceList[0];
  }

  get secondMissingSequence(): CardList | undefined {
    return this.missingSequenceList[1];
  }

  get likelyWinnersHoldings(): CardHoldings {
    return this.likelyWinnersList;
  }

  get likelyLosersHoldings(): CardHoldings {
    return this.likelyLosersList;
  }

  get isVoid(): boolean {
    return this.length === 0;
  }

  get isSingleton(): boolean {
    return this.length === 1;
  }

  get isDoubleton(): boolean {
    return this.length === 2;
  }

  hasAce(): boolean {
    return this.cards.some(card => card.faceValue === ACE);
  }

  hasKing(): boolean {
    return this.cards.some(card => card.faceValue === KING);
  }

  hasQueen(): boolean {
    return this.hasCardOfFaceValue(QUEEN);
  }

  hasJack(): boolean {
    return this.hasCardOfFaceValue(JACK);
  }

  hasTen(): boolean {
    return this.hasCardOfFaceValue(TEN);
  }

  get hcp(): number {
    return this.cards.reduce((sum, card) => sum + card.honorPoints, 0);
  }

  get quickTricks(): number {
    return this.quickTricksValue;
  }

  setQuickTricks(value: number): void {
    this.quickTricksValue = value;
  }

  get likelyWinnerCount(): number {
    return this.likelyWinners;
  }

  setLikelyWinnerCount(value: number): void {
    this.likelyWinners = value;
  }

  get likelyLoserCount(): number {
    return this.likelyLosers;
  }

  setLikelyLoserCount(value: number): void {
    this.likelyLosers = value;
  }

  get numWinners(): number {
    return this.numWinnersValue;
  }

  get numLosers(): number {
    return this.numLosersValue;
  }

  get isMarginal(): boolean {
    return this.strengthValue >= SuitStrength.MarginalOpener;
  }

  get isOpenable(): boolean {
    return this.strengthValue >= SuitStrength.Openable;
  }

  get isStrong(): boolean {
    return this.strengthValue >= SuitStrength.Absolute;
  }

  get isAbsolute(): boolean {
    return this.strengthValue >= SuitStrength.Absolute;
  }

  get isSelfSupporting(): boolean {
    return this.selfSupporting;
  }

  get isSolid(): boolean {
    return this.solid;
  }

  get isPreferred(): boolean {
    return this.preferred;
  }

  setPreferred(value = true): void {
    this.preferred = value;
  }

  get isRebiddable(): boolean {
    return this.rebiddable;
  }

  get isSuitStopped(): boolean {
    return this.suitStopped;
  }

  get isSuitProbablyStopped(): boolean {
    return this.suitProbablyStopped;
  }

  get numStoppers(): number {
    return this.numStoppersValue;
  }

  get compressedHoldings(): string {
    return this.length === 0
      ? 'void'
      : this.cards.map(card => card.cardLetter).join('');
  }
}
