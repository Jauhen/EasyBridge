//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CCombinedHoldings (CombinedHoldings.H / CombinedHoldings.cpp)
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import {
  cardSuit,
  faceValue,
  isMajor,
  isMinor,
  isSuit,
  NONE,
  Suit,
} from '../constants.js';
import { SuitType } from '../bidding/bidParameters.js';
import { Hand } from '../hand.js';
import { PlayerStatus } from '../playerStatus.js';
import { CardHoldings } from './cardHoldings.js';
import { CombinedSuitHoldings } from './combinedSuitHoldings.js';
import { GuessedCardHoldings } from './guessedCardHoldings.js';
import { SuitEvaluationOptions } from './suitHoldings.js';

export class CombinedHoldings extends CardHoldings {
  readonly suits: CombinedSuitHoldings[] = [
    new CombinedSuitHoldings(),
    new CombinedSuitHoldings(),
    new CombinedSuitHoldings(),
    new CombinedSuitHoldings(),
  ];

  private statusDlg: PlayerStatus | null = null;
  private declarerHand: Hand | null = null;
  private dummyHand: Hand | null = null;

  private strHolding = ''; // description of hand

  // basic hand statistics
  private numAcesValue = 0;         // # of Aces in hand
  private numKingsValue = 0;        // # of Kings in hand
  private numDistPointsValue = 0;   // distribution pts
  private numTotalPointsValue = 0;  // # of total points in hand
  private numAdjustedPointsValue = 0; // adjusted points for suit contract

  // more detailed hand analysis
  private numQuickTricksValue = 0;  // # of quick tricks
  private numSuitsStoppedValue = 0; // # of stoppers
  private numSuitsProbStoppedValue = 0; // # of probable stoppers
  private numSuitsUnstoppedValue = 0;
  private suitsStopped: number[] = [NONE, NONE, NONE, NONE];
  private suitsProbStopped: number[] = [NONE, NONE, NONE, NONE];
  private suitsUnstopped: number[] = [NONE, NONE, NONE, NONE];
  private strSuitsStopped = '';
  private strSuitsProbStopped = '';
  private strSuitsUnstopped = '';

  private contractSuit: Suit | typeof NONE = NONE;
  private preferredSuit: Suit | typeof NONE = NONE; // always have a preferred suit
  private longestSuitValue: Suit | typeof NONE = NONE;
  private suitsByPreference: number[] = [NONE, NONE, NONE, NONE, NONE]; // ranked in order of preference
  private suitsByLength: number[] = [NONE, NONE, NONE, NONE];
  private numSuitsOfAtLeast: number[] = Array<number>(14).fill(0); // # of suits of >=x # cards

  private numMaxWinnersValue = 0;
  private numMaxLikelyWinnersValue = 0;
  private numMaxTopCardsValue = 0;
  private numDeclarerWinnersValue = 0;
  private numDummyWinnersValue = 0;
  private numDeclarerTopCardsValue = 0;
  private numDummyTopCardsValue = 0;
  private numWinnersValue = 0;       // sure winning cards
  private numLosersValue = 0;        // sure losers
  private numLikelyWinnersValue = 0; // likely winning cards
  private numLikelyLosersValue = 0;  // likely losers

  private numTopCardsValue = 0;
  private numTopHonorsValue = 0;
  private numSecondaryHonorsValue = 0;
  private numMissingHonorsValue = 0;
  private numMissingTopHonorsValue = 0;
  private numMissingInternalHonorsValue = 0;
  private numMissingBottomHonorsValue = 0;

  constructor() {
    super();
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      this.suits[suit].setSuit(suit as Suit);
    }
  }

  initialize(declarerHand: Hand, dummyHand: Hand, statusDlg: PlayerStatus | null = null): void {
    super.init();
    for (let i = 0; i < 4; i++) {
      this.suits[i].init();
      this.suits[i].setSuit(i as Suit);
    }
    this.statusDlg = statusDlg;
    this.declarerHand = declarerHand;
    this.dummyHand = dummyHand;
    this.initNewHand();
  }

  //
  // InitNewHand()
  //
  // initializes the combined holdings of declarer & dummy
  // called right after dummy exposes his hand
  //
  initNewHand(): void {
    // first clear the current hand
    this.clearHand();
    if (!this.declarerHand || !this.dummyHand) return;

    // then copy the cards from both source hands
    for (const card of this.declarerHand.cardsList.cardsInAscendingDeckOrder) {
      this.addFromSource(card, true);
    }
    for (const card of this.dummyHand.cardsList.cardsInAscendingDeckOrder) {
      this.addFromSource(card, false);
    }

    // now sort hand & suits
    this.sort();
    for (let i = 0; i < 4; i++) {
      this.suits[i].sort();
    }

    // then count the card points
    this.countPoints();
  }

  clearHand(): void {
    super.clear();
    for (let i = 0; i < 4; i++) {
      this.suits[i].clear();
    }

    // clear hand holdings variables
    this.numAcesValue = 0;
    this.numKingsValue = 0;
    this.numDistPointsValue = 0;
    this.numTotalPointsValue = 0;
    this.numAdjustedPointsValue = 0;
    this.numQuickTricksValue = 0;
    this.numSuitsStoppedValue = 0;
    this.numSuitsProbStoppedValue = 0;
    this.numSuitsUnstoppedValue = 0;
    this.suitsStopped = [NONE, NONE, NONE, NONE];
    this.suitsProbStopped = [NONE, NONE, NONE, NONE];
    this.suitsUnstopped = [NONE, NONE, NONE, NONE];
    this.strSuitsStopped = '';
    this.strSuitsProbStopped = '';
    this.strSuitsUnstopped = '';
    this.contractSuit = NONE;
    this.preferredSuit = NONE;
    this.longestSuitValue = NONE;
    this.suitsByPreference = [NONE, NONE, NONE, NONE, NONE];
    this.suitsByLength = [NONE, NONE, NONE, NONE];
    this.numSuitsOfAtLeast.fill(0);
    this.numMaxWinnersValue = 0;
    this.numMaxLikelyWinnersValue = 0;
    this.numMaxTopCardsValue = 0;
    this.numDeclarerWinnersValue = 0;
    this.numDummyWinnersValue = 0;
    this.numDeclarerTopCardsValue = 0;
    this.numDummyTopCardsValue = 0;
    this.numLikelyWinnersValue = 0;
    this.numLikelyLosersValue = 0;
    this.numWinnersValue = 0;
    this.numLosersValue = 0;
    this.numTopCardsValue = 0;
    this.numTopHonorsValue = 0;
    this.numSecondaryHonorsValue = 0;
    this.numMissingHonorsValue = 0;
    this.numMissingTopHonorsValue = 0;
    this.numMissingInternalHonorsValue = 0;
    this.numMissingBottomHonorsValue = 0;
  }

  override formatHoldingsString(): void {
    this.strHoldings = `S:${this.suits[3].holdingsString} H:${this.suits[2].holdingsString} D:${this.suits[1].holdingsString} C:${this.suits[0].holdingsString}`;
    this.formatGIBHoldingsString();
  }

  addFromSource(card: Card, fromDeclarer: boolean, sort = true): void {
    super.add(card, sort);
    this.suits[card.suit].addFromSource(card, fromDeclarer, sort);
    this.formatHoldingsString();
  }

  addCard(card: Card, fromDeclarer: boolean): void {
    this.addFromSource(card, fromDeclarer);
  }

  removeFromSource(card: Card, fromDeclarer: boolean): Card | null {
    super.remove(card);
    this.suits[card.suit].removeFromSource(card, fromDeclarer);
    this.formatHoldingsString();
    return card;
  }

  removeCard(card: Card, fromDeclarer: boolean): Card | null {
    return this.removeFromSource(card, fromDeclarer);
  }

  override removeByIndex(index: number): Card | null {
    const card = super.removeByIndex(index);
    if (!card) return null;

    // reorganize ordered suit holding
    for (let i = index; i < this.cards.length; i++) {
      this.cards[i].decrementHandIndex();
    }

    // then update the suit
    this.suits[card.suit].remove(card);

    // and update card info
    card.clearAssignment();
    this.formatHoldingsString();
    return card;
  }

  override sort(): void {
    // first call base class to sort the cards in S-H-D-C order
    super.sort();

    // and then be sure to sort each of the suits individually
    for (let i = 0; i < 4; i++) {
      this.suits[i].sort();
    }

    // and set the literal hand description
    const parts: string[] = [];
    for (let i = 3; i >= 0; i--) {
      const prefix = `${Card.getSuitLetter(i)}:`;
      if (this.suits[i].length === 0) {
        parts.push(`${prefix}void`);
      } else {
        parts.push(`${prefix}${this.suits[i].cardsInAscendingDeckOrder.map(c => c.cardLetter).join('')}`);
      }
    }
    this.strHolding = parts.join(' ');
  }

  //
  // CountPoints()
  //
  // called right after the deal to count points in the hand
  //
  override countPoints(forceCount = false, options: SuitEvaluationOptions = {}): number {
    // first call the base class to count HC points
    super.countPoints(forceCount);

    // sort the hand
    if (!this.sorted) this.sort();

    // count the points for each suit
    this.numTotalPointsValue = 0;
    for (let i = 0; i < 4; i++) {
      this.suits[i].countPoints(forceCount, options);
      this.numTotalPointsValue += this.suits[i].hcPoints;
    }
    const playerDist = this.declarerHand ? (this.declarerHand.shortPoints + this.declarerHand.longPoints) : 0;
    const partnerDist = this.dummyHand ? (this.dummyHand.shortPoints + this.dummyHand.longPoints) : 0;
    this.numDistPointsValue = playerDist + partnerDist;
    this.numTotalPointsValue += this.numDistPointsValue;
    this.numAdjustedPointsValue = this.numTotalPointsValue;

    // count aces and kings, and top/secondary honors
    this.numAcesValue = 0;
    this.numKingsValue = 0;
    this.numTopCardsValue = 0;
    this.numTopHonorsValue = 0;
    this.numSecondaryHonorsValue = 0;
    this.numMissingHonorsValue = 0;
    this.numMissingTopHonorsValue = 0;
    this.numMissingInternalHonorsValue = 0;
    this.numMissingBottomHonorsValue = 0;

    for (let i = 0; i < 4; i++) {
      if (this.suits[i].hasAce()) this.numAcesValue++;
      if (this.suits[i].hasKing()) this.numKingsValue++;
      this.numTopCardsValue += this.suits[i].numTopCards;
      this.numTopHonorsValue += this.suits[i].numTopHonors;
      this.numSecondaryHonorsValue += this.suits[i].numSecondaryHonors;
      this.numMissingHonorsValue += this.suits[i].numMissingHonors;
      this.numMissingTopHonorsValue += this.suits[i].numMissingTopHonors;
      this.numMissingInternalHonorsValue += this.suits[i].numMissingInternalHonors;
      this.numMissingBottomHonorsValue += this.suits[i].numMissingBottomHonors;
    }

    // mark indicators of how many suits have at least x # of cards in them
    for (let i = 13; i >= 0; i--) {
      this.numSuitsOfAtLeast[i] = 0;
      for (let j = 0; j < 4; j++) {
        if (this.suits[j].length >= i) this.numSuitsOfAtLeast[i]++;
      }
    }

    // now summarize the QTs & stoppers
    this.numQuickTricksValue = 0;
    this.numSuitsStoppedValue = 0;
    this.numSuitsProbStoppedValue = 0;
    this.numSuitsUnstoppedValue = 0;
    const stoppedNames: string[] = [];
    const probStoppedNames: string[] = [];
    const unstoppedNames: string[] = [];
    this.suitsStopped.fill(NONE);
    this.suitsProbStopped.fill(NONE);
    this.suitsUnstopped.fill(NONE);

    // count stoppers & quick tricks
    for (let i = 0; i < 4; i++) {
      this.numQuickTricksValue += this.suits[i].quickTricks;
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

    return this.numTotalPointsValue;
  }

  //
  // EvaluateHoldings()
  //
  // called after hand is dealt and before play
  //
  override evaluateHoldings(contractLevel = 0, options: SuitEvaluationOptions = {}): void {
    const status = this.statusDlg;

    // first report the hand
    if (status) {
      status.setStreamOutputLevel(2);
      status
        .stream('Combined hand (Dummy/Hand):\n')
        .addStream('  S:')
        .addStream(this.suits[3].holdingsString)
        .addStream('\n  H:')
        .addStream(this.suits[2].holdingsString)
        .addStream('\n  D:')
        .addStream(this.suits[1].holdingsString)
        .addStream('\n  C:')
        .addStream(this.suits[0].holdingsString)
        .addStream('\n');
    }

    // first evaluate the individual suits
    for (let i = 0; i < 4; i++) {
      this.suits[i].evaluateHoldings(options);
    }

    // sort suits by length (and also by suit rank)
    this.sortSuitsByLength();

    // count winners among the suits
    this.numWinnersValue = 0;
    this.numLikelyWinnersValue = 0;
    this.numMaxWinnersValue = 0;
    this.numMaxTopCardsValue = 0;
    this.numMaxLikelyWinnersValue = 0;
    for (let i = 0; i < 4; i++) {
      this.numWinnersValue += this.suits[i].numWinners;
      this.numLikelyWinnersValue += this.suits[i].likelyWinnerCount;
      this.numMaxWinnersValue += this.suits[i].numMaxWinners;
      this.numMaxLikelyWinnersValue += this.suits[i].numMaxLikelyWinners;
      this.numMaxTopCardsValue += this.suits[i].numMaxTopCards;
    }
    if (this.numWinnersValue > 13) this.numWinnersValue = 13;
    if (this.numLikelyWinnersValue > 13) this.numLikelyWinnersValue = 13;
    this.numLosersValue = 13 - this.numWinnersValue;
    this.numLikelyLosersValue = 13 - this.numLikelyWinnersValue;

    // determine the declarer/dummy split of winners
    this.numDeclarerWinnersValue = 0;
    this.numDummyWinnersValue = 0;
    this.numDeclarerTopCardsValue = 0;
    this.numDummyTopCardsValue = 0;
    for (let i = 0; i < 4; i++) {
      this.numDeclarerWinnersValue += this.suits[i].numDeclarerWinners;
      this.numDummyWinnersValue += this.suits[i].numDummyWinners;
      this.numDeclarerTopCardsValue += this.suits[i].numDeclarerTopCards;
      this.numDummyTopCardsValue += this.suits[i].numDummyTopCards;
    }

    // and finally report on the quality of the hand
    if (status) {
      let strLine = 'Combined hand evaluation:\n';
      strLine += `  HCPs = ${this.numHCPoints.toFixed(1)}, Distn pts = ${this.numDistPointsValue.toFixed(1)};\n  Total pts = ${this.numTotalPointsValue.toFixed(1)}.\n`;
      strLine += `  QT's = ${this.numQuickTricksValue.toFixed(1)},\n`;
      if (this.numSuitsStoppedValue > 0) {
        const stopped: string[] = [];
        for (let i = 3; i >= 0; i--) {
          if (this.suits[i].isSuitStopped) stopped.push(Card.getSuitLetter(i));
        }
        strLine += `  Stoppers in: ${stopped.join(', ')}\n`;
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
      strLine += `  ${this.numMaxTopCardsValue} Sure Winner${this.numMaxTopCardsValue > 1 ? 's ' : ' '}(${this.suits[3].numMaxTopCards}/${this.suits[2].numMaxTopCards}/${this.suits[1].numMaxTopCards}/${this.suits[0].numMaxTopCards})\n`;
      strLine += `  ${this.numMaxWinnersValue} Eventual Winner${this.numMaxWinnersValue > 1 ? 's ' : ' '}(${this.suits[3].numMaxWinners}/${this.suits[2].numMaxWinners}/${this.suits[1].numMaxWinners}/${this.suits[0].numMaxWinners})\n`;
      strLine += `  ${this.numLosersValue} Possible Loser${this.numLosersValue > 1 ? 's ' : ' '}(vs. ${7 - contractLevel} allowable)\n`;
      status.stream(strLine);
      status.clearStreamOutputLevel();
    }
  }

  //
  // ReevaluateHoldings()
  //
  // called after a card has been played in the round
  //
  reevaluateHoldings(card: Card | null = null, playedCards?: GuessedCardHoldings): void {
    if (card) {
      this.suits[card.suit].reevaluateHoldings(card, playedCards);
    } else {
      for (let i = 0; i < 4; i++) {
        this.suits[i].reevaluateHoldings(card, playedCards);
      }
    }

    // re-count the points
    this.countPoints(true, { playedCards });

    // re-sort suits by length (and also by suit rank)
    this.sortSuitsByLength();

    // adjust winners count
    this.numWinnersValue = 0;
    this.numLikelyWinnersValue = 0;
    this.numMaxWinnersValue = 0;
    this.numMaxTopCardsValue = 0;
    this.numMaxLikelyWinnersValue = 0;
    for (let i = 0; i < 4; i++) {
      this.numWinnersValue += this.suits[i].numWinners;
      this.numLikelyWinnersValue += this.suits[i].likelyWinnerCount;
      this.numMaxWinnersValue += this.suits[i].numMaxWinners;
      this.numMaxLikelyWinnersValue += this.suits[i].numMaxLikelyWinners;
      this.numMaxTopCardsValue += this.suits[i].numMaxTopCards;
    }

    // adjust max winners
    // e.g., AK/Q Q/AK = 3 cards in each hand, 2+2 max winners? no!
    this.numMaxWinnersValue = Math.min(this.numMaxWinnersValue, this.cards.length);
    this.numLosersValue = this.cards.length - this.numWinnersValue;
    this.numLikelyLosersValue = this.cards.length - this.numLikelyWinnersValue;

    // determine the declarer/dummy split of winners
    this.numDeclarerWinnersValue = 0;
    this.numDummyWinnersValue = 0;
    this.numDeclarerTopCardsValue = 0;
    this.numDummyTopCardsValue = 0;
    for (let i = 0; i < 4; i++) {
      this.numDeclarerWinnersValue += this.suits[i].numDeclarerWinners;
      this.numDummyWinnersValue += this.suits[i].numDummyWinners;
      this.numDeclarerTopCardsValue += this.suits[i].numDeclarerTopCards;
      this.numDummyTopCardsValue += this.suits[i].numDummyTopCards;
    }
  }

  private sortSuitsByLength(): void {
    for (let i = 0; i < 4; i++) {
      this.suitsByLength[i] = 3 - i; // init, high suit to low suit
    }
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        // move the suit back if it's shorter
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
          // suits identical; sort by suit order
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
  // determines whether all suits are stopped in the hand
  //
  allSuitsStopped(includeProbStoppers = false): boolean {
    if (includeProbStoppers) {
      return this.numSuitsStoppedValue + this.numSuitsProbStoppedValue >= 4;
    }
    return this.numSuitsStoppedValue >= 4;
  }

  //
  // GetLongestSuit()
  //
  getLongestSuit(type: SuitType = SuitType.Any): Suit | typeof NONE {
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
  // Accessors
  //

  getCardBySuitAndPos(suit: Suit, pos: number): Card | undefined {
    return this.suits[suit].at(pos);
  }

  getCardByDeckValue(deckValue: number): Card | undefined {
    return this.suits[cardSuit(deckValue)].findCardByFaceValue(faceValue(deckValue));
  }

  getSuit(suit: Suit): CombinedSuitHoldings {
    if (!isSuit(suit)) throw new RangeError(`Invalid suit ${suit}`);
    return this.suits[suit];
  }

  getNumCardsInSuit(suit: Suit): number {
    return this.suits[suit].length;
  }

  getNumDeclarerCardsInSuit(suit: Suit): number {
    return this.suits[suit].declarerLength;
  }

  getNumDummyCardsInSuit(suit: Suit): number {
    return this.suits[suit].dummyLength;
  }

  getNumTrumps(trumpSuit: Suit | typeof NONE): number {
    if (!isSuit(trumpSuit)) return 0;
    return this.getNumCardsInSuit(trumpSuit);
  }

  getNumDeclarerTrumps(trumpSuit: Suit | typeof NONE): number {
    if (!isSuit(trumpSuit) || !this.declarerHand) return 0;
    return this.declarerHand.getSuitLength(trumpSuit);
  }

  getNumDummyTrumps(trumpSuit: Suit | typeof NONE): number {
    if (!isSuit(trumpSuit) || !this.dummyHand) return 0;
    return this.dummyHand.getSuitLength(trumpSuit);
  }

  override hasCard(cardOrDeckValue: Card | number): boolean {
    if (typeof cardOrDeckValue === 'number') {
      return super.hasCard(cardOrDeckValue);
    }
    return this.suits[cardOrDeckValue.suit].has(cardOrDeckValue);
  }

  override containsCards(cards: readonly Card[] | CardList): boolean {
    if (cards instanceof CardList) {
      return super.containsCards(cards);
    }
    return cards.every(card => this.hasCard(card));
  }

  containsAtLeastOne(cards: readonly Card[]): boolean {
    return cards.some(card => this.hasCard(card));
  }

  get longestSuit(): Suit {
    if (isSuit(this.longestSuitValue)) return this.longestSuitValue;
    let longest = Suit.Clubs;
    for (let suit = Suit.Clubs + 1; suit <= Suit.Spades; suit++) {
      if (this.getNumCardsInSuit(suit as Suit) > this.getNumCardsInSuit(longest)) {
        longest = suit as Suit;
      }
    }
    return longest;
  }

  getSuitsByLength(index: number): number {
    return this.suitsByLength[index] ?? NONE;
  }

  get hcp(): number {
    return this.suits.reduce((sum, suit) => sum + suit.hcp, 0);
  }

  get totalPoints(): number {
    return this.numTotalPointsValue;
  }

  get totalAdjustedPoints(): number {
    return this.numAdjustedPointsValue;
  }

  get numQuickTricks(): number {
    return this.numQuickTricksValue;
  }

  get numWinners(): number {
    return this.numWinnersValue;
  }

  get numLosers(): number {
    return this.numLosersValue;
  }

  get numLikelyWinners(): number {
    return this.numLikelyWinnersValue;
  }

  get numLikelyLosers(): number {
    return this.numLikelyLosersValue;
  }

  get numMaxWinners(): number {
    return this.numMaxWinnersValue;
  }

  get numMaxLikelyWinners(): number {
    return this.numMaxLikelyWinnersValue;
  }

  get numMaxTopCards(): number {
    return this.numMaxTopCardsValue;
  }

  get numDeclarerWinners(): number {
    return this.numDeclarerWinnersValue;
  }

  get numDummyWinners(): number {
    return this.numDummyWinnersValue;
  }

  get numDeclarerTopCards(): number {
    return this.numDeclarerTopCardsValue;
  }

  get numDummyTopCards(): number {
    return this.numDummyTopCardsValue;
  }

  get numAces(): number {
    return this.numAcesValue;
  }

  get numKings(): number {
    return this.numKingsValue;
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

  get stoppedSuitNames(): string {
    return this.strSuitsStopped;
  }

  get probStoppedSuitNames(): string {
    return this.strSuitsProbStopped;
  }

  get unstoppedSuitNames(): string {
    return this.strSuitsUnstopped;
  }

  get handDescription(): string {
    return this.strHolding;
  }
}
