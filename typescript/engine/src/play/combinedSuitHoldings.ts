//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CCombinedSuitHoldings (CombinedSuitHoldings.H / CombinedSuitHoldings.cpp)
//
// this subclass of CSuitHoldings is used to combine suit holdings
// of the declarer and dummy
//
//===========================================================

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { ACE, KING, NONE, Suit } from '../constants.js';
import { SuitStrength } from '../bidding/bidParameters.js';
import { GuessedCardHoldings } from './guessedCardHoldings.js';
import { SuitEvaluationOptions, SuitHoldings } from './suitHoldings.js';

export class CombinedSuitHoldings extends SuitHoldings {
  readonly declarerCards = new SuitHoldings();
  readonly dummyCards = new SuitHoldings();

  private declarerLengthValue = 0;
  private dummyLengthValue = 0;
  private minLengthValue = 0;
  private maxLengthValue = 0;
  private longHandIndex = -1; // 0 = declarer, 1 = dummy
  private longHandRef: SuitHoldings | null = null;

  private numMaxWinnersValue = 0;
  private numMaxLikelyWinnersValue = 0;
  private numMaxTopCardsValue = 0;
  private numDeclarerWinnersValue = 0;
  private numDummyWinnersValue = 0;
  private numExcessWinnersValue = 0;
  private numDeclarerExcessWinnersValue = 0;
  private numDummyExcessWinnersValue = 0;
  private numDeclarerLosersValue = 0;
  private numDummyLosersValue = 0;
  private numDeclarerTopCardsValue = 0;
  private numDummyTopCardsValue = 0;
  private numOutstandingCardsValue = 0;
  private missingCards: number[] = Array<number>(13).fill(NONE);

  private declarerEntries = 0;
  private dummyEntryCount = 0;

  readonly winners = new CardList();
  readonly losers = new CardList();
  readonly declarerWinners = new CardList();
  readonly declarerLosers = new CardList();
  readonly dummyWinners = new CardList();
  readonly dummyLosers = new CardList();

  constructor() {
    super();
    this.enableSuitSortingFlag = false;
  }

  override init(): void {
    // base no-op
  }

  override clear(): void {
    super.clear();
    this.declarerCards.clear();
    this.dummyCards.clear();

    // clear variables
    this.declarerLengthValue = 0;
    this.dummyLengthValue = 0;
    this.minLengthValue = 0;
    this.maxLengthValue = 0;
    this.longHandIndex = -1;
    this.longHandRef = null;
    this.numMaxWinnersValue = 0;
    this.numMaxLikelyWinnersValue = 0;
    this.numMaxTopCardsValue = 0;
    this.numDeclarerWinnersValue = 0;
    this.numDummyWinnersValue = 0;
    this.numExcessWinnersValue = 0;
    this.numDeclarerExcessWinnersValue = 0;
    this.numDummyExcessWinnersValue = 0;
    this.numDeclarerLosersValue = 0;
    this.numDummyLosersValue = 0;
    this.numDeclarerTopCardsValue = 0;
    this.numDummyTopCardsValue = 0;
    this.numOutstandingCardsValue = 0;

    this.winners.clear();
    this.losers.clear();
    this.declarerWinners.clear();
    this.declarerLosers.clear();
    this.dummyWinners.clear();
    this.dummyLosers.clear();

    // set base class flag
    this.enableSuitSortingFlag = false;

    this.declarerEntries = 0;
    this.dummyEntryCount = 0;
    this.missingCards = Array<number>(13).fill(NONE);
  }

  override setSuit(suit: Suit): void {
    super.setSuit(suit);
    this.declarerCards.setSuit(suit);
    this.dummyCards.setSuit(suit);
  }

  override formatHoldingsString(): void {
    if (this.cards.length > 0) {
      const combined = this.cards.map(card => card.cardLetter).join('');
      const dummy = this.dummyCards.cardsInAscendingDeckOrder.map(card => card.cardLetter).join('');
      const declarer = this.declarerCards.cardsInAscendingDeckOrder.map(card => card.cardLetter).join('');
      this.strHoldings = `${combined} (${dummy}/${declarer})`;
    } else {
      this.strHoldings = '---';
    }
    this.formatGIBHoldingsString();
  }

  //
  // AddFromSource()
  //
  // - this is called upon a card/trick undo to add the card to both
  //   the combined suit and the proper declarer/dummy card lists
  //
  addFromSource(card: Card, fromDeclarer: boolean, sort = true): void {
    super.add(card, sort);
    if (fromDeclarer) {
      this.declarerCards.add(card, sort);
      this.declarerLengthValue = this.declarerCards.length;
    } else {
      this.dummyCards.add(card, sort);
      this.dummyLengthValue = this.dummyCards.length;
    }
    this.compareHands();
    this.formatHoldingsString();
  }

  //
  // RemoveFromSource()
  //
  // - this is called when a card is pulled from the combined hand for a play
  //
  removeFromSource(card: Card, fromDeclarer: boolean): Card | null {
    super.remove(card);
    if (fromDeclarer) {
      this.declarerCards.remove(card);
      this.declarerLengthValue = this.declarerCards.length;
    } else {
      this.dummyCards.remove(card);
      this.dummyLengthValue = this.dummyCards.length;
    }
    this.compareHands();
    this.formatHoldingsString();
    return card;
  }

  override removeByIndex(index: number): Card | null {
    // call base class operation
    const card = super.removeByIndex(index);
    if (!card) return null;

    // perform additional processing
    if (this.declarerCards.hasCard(card)) {
      this.declarerCards.remove(card);
      this.declarerLengthValue = this.declarerCards.length;
    } else {
      this.dummyCards.remove(card);
      this.dummyLengthValue = this.dummyCards.length;
    }
    this.compareHands();
    this.formatHoldingsString();
    return card;
  }

  private compareHands(): void {
    this.maxLengthValue = Math.max(this.declarerLengthValue, this.dummyLengthValue);
    this.minLengthValue = Math.min(this.declarerLengthValue, this.dummyLengthValue);
    if (this.declarerLengthValue >= this.dummyLengthValue) {
      this.longHandIndex = 0;
      this.longHandRef = this.declarerCards;
    } else {
      this.longHandIndex = 1;
      this.longHandRef = this.dummyCards;
    }
  }

  override sort(): void {
    super.sort();
    this.declarerCards.sort();
    this.dummyCards.sort();
  }

  //
  // CountPoints()
  //
  // called right after the deal to count points in the hand
  //
  override countPoints(forceCount = false, options: SuitEvaluationOptions = {}): number {
    // first call the base class
    super.countPoints(forceCount, options);
    this.declarerCards.countPoints(forceCount, options);
    this.dummyCards.countPoints(forceCount, options);

    // now erase certain inappropriate variables
    this.strengthValue = SuitStrength.None;

    // and form the list of missing cards
    let i = 0;
    let index = 0;
    for (let val = ACE; val >= 2; val--) {
      if (i >= this.cards.length || this.cards[i].faceValue !== val) {
        this.missingCards[index++] = val;
      } else {
        i++;
      }
    }
    this.numOutstandingCardsValue = 13 - this.cards.length;
    return this.numTotalPoints;
  }

  //
  // CheckKeyHoldings()
  //
  // check key cards and form sequences
  //
  override checkKeyHoldings(playedCards?: GuessedCardHoldings): number {
    // first call base class
    super.checkKeyHoldings(playedCards);

    // then for the members
    this.declarerCards.checkKeyHoldings(playedCards);
    this.dummyCards.checkKeyHoldings(playedCards);

    const playedCardsList = playedCards ?? new GuessedCardHoldings();

    // reset count of outstanding cards
    this.numOutstandingCardsValue = 0;
    this.missingCards.fill(NONE);

    for (let val = ACE; val >= 2; val--) {
      // a card is considered "outstanding" if it's not in our (combined)
      // hand and has not been played yet
      if (!this.hasCardOfFaceValue(val) && !playedCardsList.hasCardOfFaceValue(val)) {
        this.missingCards[this.numOutstandingCardsValue] = val;
        this.numOutstandingCardsValue++;
      }
    }

    // and re-determine winners & losers
    this.numLosersValue = 0;
    this.likelyLosers = 0;
    this.numOutstandingCardsValue = 13 - this.cards.length;

    // use a different algorithm for finding winners here
    // deduct one winner for each outstanding higher card
    let numWinners = this.maxLengthValue;
    let theirOffset = 0;
    let ourOffset = 0;
    const numComparisons = this.maxLengthValue;
    for (let i = 0; i < numComparisons; i++) {
      // see if there are outstanding cards matching up against this one
      if (this.numOutstandingCardsValue > i && ourOffset < this.cards.length) {
        // see if their next card is higher than our next card
        if (this.missingCards[theirOffset] > this.cards[ourOffset].faceValue) {
          // if so, then deduct a winner and compare their next card
          // against our current card
          numWinners--;
          theirOffset++;
        } else {
          // else ours is higher, so compare their card against our next card
          ourOffset++;
        }
      }
    }
    this.numWinnersValue = numWinners;
    this.likelyWinners = numWinners;
    this.numLosersValue = this.cards.length - this.numWinnersValue;
    this.likelyLosers = this.numLosersValue;

    // adjust winner counts for declarer/dummy length
    this.numMaxTopCardsValue = Math.min(this.numTopCardsValue, this.maxLengthValue);
    this.numMaxWinnersValue = Math.min(this.numWinnersValue, this.maxLengthValue);
    this.numMaxLikelyWinnersValue = Math.min(this.likelyWinners, this.maxLengthValue);

    this.rebuildWinnerLoserLists();

    // check entries
    // improve this code later
    this.declarerEntries = this.declarerCards.numWinners;
    this.dummyEntryCount = this.dummyCards.numWinners;

    return 0;
  }

  //
  // EvaluateHoldings()
  //
  // called to evaluate the strength of this suit
  //
  override evaluateHoldings(options: SuitEvaluationOptions = {}): void {
    this.declarerCards.evaluateHoldings(options);
    this.dummyCards.evaluateHoldings(options);

    // first count the number of likely winners adjusted for a combined holding
    this.numLosersValue = 0;
    this.likelyLosers = 0;
    this.numOutstandingCardsValue = 13 - this.cards.length;

    const len = this.cards.length;
    if (len === 0) {
      // special case
      this.numWinnersValue = 0;
      this.likelyWinners = 0;
    } else if (len === 13) {
      // no losers in the suit
      this.numWinnersValue = 13;
      this.likelyWinners = 13;
    } else if (len === 12) {
      // no losers in the suit, unless we're missing the ace
      if (this.cards[0].faceValue !== ACE) this.numLosersValue = 1;
      this.numWinnersValue = 12 - this.numLosersValue;
      this.likelyWinners = this.numWinnersValue;
    } else if (len === 11) {
      // missing ace and/or king represents loser
      if (!this.hasCardOfFaceValue(ACE)) this.numLosersValue++;
      if (!this.hasCardOfFaceValue(KING)) this.numLosersValue++;
      this.numWinnersValue = 11 - this.numLosersValue;
      this.likelyWinners = this.numWinnersValue;
    } else {
      // with 10 or fewer cards, use a more sophisticated winner
      // counting algorithm, counting sure winners & likely winners
      let numSecondaryWinners = this.numSecondaryHonorsValue - this.numMissingInternalHonorsValue;
      if (numSecondaryWinners < 0) numSecondaryWinners = 0;
      this.numWinnersValue =
        this.numTopHonorsValue - this.numMissingTopHonorsValue + numSecondaryWinners;
      if (this.numWinnersValue < 0) this.numWinnersValue = 0;

      // if we have as many winners as outstanding cards, all
      // remaining cards in the long hand are winners
      const numForceRounds = this.numMissingTopHonorsValue + this.numMissingInternalHonorsValue;
      let numRemainingCards = this.maxLengthValue - this.numWinnersValue - numForceRounds;
      if (numRemainingCards < 0) numRemainingCards = 0;

      if (
        this.numWinnersValue + numForceRounds >= this.numOutstandingCardsValue &&
        numRemainingCards > 0
      ) {
        this.numWinnersValue += numRemainingCards;
        this.likelyWinners = this.numWinnersValue;
      } else if (
        this.maxLengthValue >= 5 &&
        len >= 8 &&
        this.numWinnersValue >= this.numOutstandingCardsValue - 1 &&
        numRemainingCards > 0
      ) {
        // if we have 5 or more cards in the long hand, 8 or more
        // cards combined, and enough winners, then the remaining cards are likely winners
        this.likelyWinners = this.numWinnersValue + numRemainingCards;
      } else {
        // else the likely winners is the same as the sure winners
        this.likelyWinners = this.numWinnersValue;
      }

      // and adjust again
      if (this.numWinnersValue > this.maxLengthValue) this.numWinnersValue = this.maxLengthValue;
      if (this.likelyWinners > this.maxLengthValue) this.likelyWinners = this.maxLengthValue;
      this.numLosersValue = Math.max(0, this.maxLengthValue - this.numWinnersValue);
      this.likelyLosers = this.maxLengthValue - this.likelyWinners;
    }

    // adjust winner counts for declarer/dummy length
    this.numMaxTopCardsValue = Math.min(this.numTopCardsValue, this.maxLengthValue);
    this.numMaxWinnersValue = Math.min(this.numWinnersValue, this.maxLengthValue);
    this.numMaxLikelyWinnersValue = Math.min(this.likelyWinners, this.maxLengthValue);

    this.rebuildWinnerLoserLists();
  }

  private rebuildWinnerLoserLists(): void {
    // clear lists
    this.winners.clear();
    this.losers.clear();
    this.declarerWinners.clear();
    this.declarerLosers.clear();
    this.dummyWinners.clear();
    this.dummyLosers.clear();

    // determine declarer's & dummy's winners & losers
    this.numDeclarerWinnersValue = 0;
    this.numDummyWinnersValue = 0;
    for (let i = 0; i < this.numWinnersValue && i < this.cards.length; i++) {
      this.winners.add(this.cards[i]);
      if (this.declarerCards.hasCard(this.cards[i])) {
        this.numDeclarerWinnersValue++;
        this.declarerWinners.add(this.cards[i]);
      } else {
        this.numDummyWinnersValue++;
        this.dummyWinners.add(this.cards[i]);
      }
    }
    this.numDeclarerLosersValue = Math.max(0, this.declarerLengthValue - this.numDeclarerWinnersValue);
    this.numDummyLosersValue = Math.max(0, this.dummyLengthValue - this.numDummyWinnersValue);

    // determine excess winners & losers
    // "excess" winners are winners in one hand where there are no cards
    // to discard in the suit in the opposite hand
    this.numExcessWinnersValue = 0;
    this.numDeclarerExcessWinnersValue = 0;
    this.numDummyExcessWinnersValue = 0;
    if (this.numTopCardsValue > this.minLengthValue) {
      this.numExcessWinnersValue = this.numTopCardsValue - this.minLengthValue;
      if (this.declarerLengthValue > this.dummyLengthValue) {
        this.numDeclarerExcessWinnersValue = this.numExcessWinnersValue;
      } else {
        this.numDummyExcessWinnersValue = this.numExcessWinnersValue;
      }
    }

    this.numDeclarerTopCardsValue = 0;
    this.numDummyTopCardsValue = 0;
    for (let i = 0; i < this.numTopCardsValue && i < this.cards.length; i++) {
      if (this.declarerCards.hasCard(this.cards[i])) this.numDeclarerTopCardsValue++;
      else this.numDummyTopCardsValue++;
    }

    // fill the losers lists
    let index = this.numWinnersValue;
    for (let i = 0; i < this.numLosersValue && index < this.cards.length; i++, index++) {
      this.losers.add(this.cards[index]);
      if (this.declarerCards.hasCard(this.cards[index])) {
        this.declarerLosers.add(this.cards[index]);
      } else {
        this.dummyLosers.add(this.cards[index]);
      }
    }
  }

  //
  // ReevaluateHoldings()
  //
  // called to re-evaluate the suit after a card has been played
  //
  override reevaluateHoldings(card: Card | null = null, playedCards?: GuessedCardHoldings): void {
    super.reevaluateHoldings(card, playedCards);
    this.declarerCards.reevaluateHoldings(card, playedCards);
    this.dummyCards.reevaluateHoldings(card, playedCards);
    this.countPoints(true, { playedCards });
  }

  //
  // Accessors
  //

  getDeclarerCard(index: number): Card | undefined {
    return this.declarerCards.at(index);
  }

  getDummyCard(index: number): Card | undefined {
    return this.dummyCards.at(index);
  }

  get declarerLength(): number {
    return this.declarerLengthValue;
  }

  get dummyLength(): number {
    return this.dummyLengthValue;
  }

  get minLength(): number {
    return this.minLengthValue;
  }

  get maxLength(): number {
    return this.maxLengthValue;
  }

  get lengthDifference(): number {
    return this.declarerLengthValue - this.dummyLengthValue;
  }

  get longHand(): SuitHoldings | null {
    return this.longHandRef;
  }

  get isDeclarerLongHand(): boolean {
    return this.longHandIndex === 0;
  }

  get numOutstandingCards(): number {
    return this.numOutstandingCardsValue;
  }

  get outstandingCardCount(): number {
    return this.numOutstandingCardsValue;
  }

  getMissingCardVal(index: number): number {
    return this.missingCards[index] ?? NONE;
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

  get numExcessWinners(): number {
    return this.numExcessWinnersValue;
  }

  get numDeclarerExcessWinners(): number {
    return this.numDeclarerExcessWinnersValue;
  }

  get numDummyExcessWinners(): number {
    return this.numDummyExcessWinnersValue;
  }

  get numDeclarerLosers(): number {
    return this.numDeclarerLosersValue;
  }

  get numDummyLosers(): number {
    return this.numDummyLosersValue;
  }

  get numDeclarerTopCards(): number {
    return this.numDeclarerTopCardsValue;
  }

  get numDummyTopCards(): number {
    return this.numDummyTopCardsValue;
  }

  get topCardsDiff(): number {
    return this.numDeclarerTopCardsValue - this.numDummyTopCardsValue;
  }

  get winnersDiff(): number {
    return this.numDeclarerWinnersValue - this.numDummyLosersValue;
  }

  get declaredEntries(): number {
    return this.declarerEntries;
  }

  setDeclarerEntries(count: number): void {
    this.declarerEntries = count;
  }

  get dummyEntries(): number {
    return this.dummyEntryCount;
  }

  setDummyEntries(count: number): void {
    this.dummyEntryCount = count;
  }

  get holdingsDescription(): string {
    return this.holdingsString;
  }
}
