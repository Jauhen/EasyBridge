//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CPlayer (Player.h / player.cpp)
//

import { Card } from './card.js';
import {
  ACE,
  Bid,
  bidSuit,
  contractToFullString,
  isBid,
  isSuit,
  KING,
  NONE,
  Position,
  positionToString,
  Suit,
  Team,
} from './constants.js';
import { Hand } from './hand.js';
import { CardLocation } from './cardLocation.js';
import { PlayerStatus } from './playerStatus.js';
import { BidEngine } from './bidding/bidEngine.js';
import { GuessedHandHoldings } from './play/guessedHandHoldings.js';
import { PlayEngine } from './play/playEngine.js';
import { DeclarerPlayEngine } from './play/declarerPlayEngine.js';
import { DummyPlayEngine } from './play/dummyPlayEngine.js';
import { DefenderPlayEngine } from './play/defenderPlayEngine.js';

export interface PlayerDealView {
  declarerPosition: Position;
  dummyPosition: Position;
  contract: number;
  contractModifier: number;
  roundLead: Position;
  numCardsPlayedInGame?: number;
  currentTrickCardLed?: Card | null;
  getBidByPlayer?: (position: Position, turnIndex: number) => number;
}

export class Player {
  // player info
  position: Position;
  skillLevel = 0;
  private declarerFlag = false;
  private dummyFlag = false;
  teamIsVulnerable = false;
  partner: Player | null = null;
  lhOpponent: Player | null = null;
  rhOpponent: Player | null = null;

  // owned member objects
  readonly hand = new Hand();
  readonly bidEngine = new BidEngine();
  playEngine: PlayEngine | null = null;
  readonly declarerEngine = new DeclarerPlayEngine();
  readonly dummyEngine = new DummyPlayEngine();
  readonly defenderEngine = new DefenderPlayEngine();

  // derived information
  readonly cardLocation = new CardLocation();
  readonly guessedHands: [
    GuessedHandHoldings,
    GuessedHandHoldings,
    GuessedHandHoldings,
    GuessedHandHoldings,
  ] = [
    new GuessedHandHoldings(),
    new GuessedHandHoldings(),
    new GuessedHandHoldings(),
    new GuessedHandHoldings(),
  ];

  readonly status = new PlayerStatus();

  private bids: number[] = [];
  private exposed = false;
  private testBiddingMode = false;
  private openingPosition: Position = Position.Unknown;

  constructor(position: Position = Position.South) {
    this.position = position;
    this.status.setPosition(position);
  }

  //
  // Initialization routines
  //

  initializePlayer(
    pos: Position,
    partner: Player | null,
    lhOpponent: Player | null,
    rhOpponent: Player | null,
  ): void {
    // init settings
    this.position = pos;
    this.partner = partner;
    this.lhOpponent = lhOpponent;
    this.rhOpponent = rhOpponent;
    this.playEngine = null;
    //
    this.skillLevel = 0;
    this.declarerFlag = false;
    this.dummyFlag = false;
    this.teamIsVulnerable = false;

    // init member objects
    this.status.setPosition(pos);
  }

  initializeEngines(): void {
    // init player engines
    const context = {
      player: this,
      partner: this.partner ?? this,
      leftOpponent: this.lhOpponent ?? this,
      rightOpponent: this.rhOpponent ?? this,
      hand: this.hand,
      cardLocation: this.cardLocation,
      guessedHands: this.guessedHands,
      status: this.status,
    };
    this.declarerEngine.initialize(context);
    this.dummyEngine.initialize(context);
    this.defenderEngine.initialize(context);

    // clear hand at this point, after the engines have been initialized
    this.clearHand();
  }

  //
  // Hand-related routines
  // (mostly delegated to the m_pHand object)
  //

  getGuessedHand(playerIndex: number): GuessedHandHoldings {
    return this.guessedHands[playerIndex];
  }

  restoreInitialHand(): void {
    this.hand.clear();
    for (const card of this.hand.initialHand.cardsInAscendingDeckOrder) {
      this.hand.add(card);
    }
  }

  addCard(card: Card, sort = true): void {
    this.hand.add(card, sort);
  }

  addCardToHand(card: Card, sort = false): void {
    this.hand.add(card, sort);
  }

  addCardToInitialHand(card: Card): void {
    this.hand.addToInitialHand(card);
  }

  removeCard(card: Card): Card | null {
    return this.hand.remove(card);
  }

  removeCardFromHand(cardOrIndex: Card | number): Card | null {
    if (typeof cardOrIndex === 'number') {
      return this.hand.removeByIndex(cardOrIndex);
    }
    return this.hand.remove(cardOrIndex);
  }

  removeCardFromInitialHand(cardOrIndex: Card | number): Card | null {
    if (typeof cardOrIndex === 'number') {
      return this.hand.initialHand.removeByIndex(cardOrIndex);
    }
    return this.hand.initialHand.remove(cardOrIndex);
  }

  // remove all cards without clearing the player's internal state
  removeAllCardsFromHand(): void {
    this.hand.clear();
  }

  setCard(index: number, card: Card): void {
    this.hand.cardsList.setCard(index, card);
  }

  setInitialHandCard(index: number, card: Card): void {
    this.hand.initialHand.setCard(index, card);
  }

  sortHand(): void {
    this.hand.sort();
  }

  initialEvaluateHand(): void {
    this.hand.countPoints(true);
  }

  countCardPoints(forceCount = false): number {
    return this.hand.countPoints(forceCount);
  }

  getNumCards(): number {
    return this.hand.length;
  }

  getNumCardsInSuit(suit: Suit): number {
    return this.hand.getSuitLength(suit);
  }

  getSuitLength(suit: Suit): number {
    return this.getNumCardsInSuit(suit);
  }

  hasCard(cardOrDeckValue: Card | number): boolean {
    return typeof cardOrDeckValue === 'number'
      ? this.hand.hasDeckValue(cardOrDeckValue)
      : this.hand.hasCard(cardOrDeckValue);
  }

  getCardByValue(deckValue: number): Card | null {
    return this.hand.findCardByDeckValue(deckValue) ?? null;
  }

  getCardByPosition(index: number): Card | null {
    return this.hand.cardsList.at(index) ?? null;
  }

  getCardInSuit(suit: Suit, index: number): Card | null {
    return this.hand.getCardsInSuit(suit)[index] ?? null;
  }

  getInitialHandCard(index: number): Card | null {
    return this.hand.initialHand.at(index) ?? null;
  }

  areCardsExposed(): boolean {
    return this.exposed;
  }

  getNumCardsOf(faceValue: number): number {
    if (faceValue === ACE) return this.hand.numAces;
    if (faceValue === KING) return this.hand.numKings;
    return 0;
  }

  suitHasCard(suit: Suit, cardFaceValue: number): boolean {
    return this.hand.getCardsInSuit(suit).some(card => card.faceValue === cardFaceValue);
  }

  get hcp(): number {
    return this.hand.highCardPoints;
  }

  getHCPoints(): number {
    return this.hand.highCardPoints;
  }

  getTotalPoints(): number {
    return this.hand.totalPoints;
  }

  getBalanceValue(): number {
    return this.hand.balanceValue;
  }

  getNumQuickTricks(): number {
    return this.hand.numQuickTricks;
  }

  getNumSuitsStopped(): number {
    let count = 0;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      const cards = this.hand.getCardsInSuit(suit as Suit);
      const hasAce = cards.some(card => card.faceValue === 14);
      const hasKing = cards.length >= 2 && cards.some(card => card.faceValue === 13);
      const hasQueen = cards.length >= 3 && cards.some(card => card.faceValue === 12);
      if (hasAce || hasKing || hasQueen) count++;
    }
    return count;
  }

  get longestSuit(): Suit {
    let longest = Suit.Clubs;
    for (let suit = Suit.Clubs + 1; suit <= Suit.Spades; suit++) {
      if (this.hand.getSuitLength(suit as Suit) > this.hand.getSuitLength(longest)) {
        longest = suit as Suit;
      }
    }
    return longest;
  }

  //
  // InitializeHand()
  //
  // Called after the player has been dealt a hand
  //
  initializeHand(): void {
    this.declarerFlag = false;
    this.dummyFlag = false;
    this.hand.sort();
    this.hand.initializeInitialHand();
    for (let i = 0; i < 4; i++) {
      this.guessedHands[i].clear();
      this.guessedHands[i].initNewHand(this.hand, this.position);
    }
    // and clear the analysis dialog
    this.clearAnalysis();
  }

  //
  // InitializeRestoredHand()
  //
  // Called after the player's hand has been loaded from a file
  //
  initializeRestoredHand(deal: PlayerDealView): void {
    // set internal variables
    this.declarerFlag = deal.declarerPosition === this.position;
    this.dummyFlag = deal.dummyPosition === this.position;

    // clear the analysis dialog
    this.clearAnalysis();
    this.status.stream('3Starting play from restored game.\n------------------------\n');

    // determine the proper player algorithm to use
    if (this.declarerFlag) this.playEngine = this.declarerEngine;
    else if (this.dummyFlag) this.playEngine = this.dummyEngine;
    else this.playEngine = this.defenderEngine;

    // and init
    this.hand.sort();
    this.hand.initializeInitialHand();
    this.hand.countPoints(true);

    // mark game position
    const contract = deal.contract;
    const modifier = deal.contractModifier;
    if (isBid(contract)) {
      this.status
        .stream('4The contract is ')
        .addStream(contractToFullString(contract, modifier))
        .addStream(' by ')
        .addStream(positionToString(deal.declarerPosition))
        .addStream('.\n');
      this.status
        .stream('4')
        .addStream(positionToString(deal.roundLead))
        .addStream(' leads.\n');
      this.status.stream('4====================\n');
    }

    // finally, expose cards if necessary
    if (
      this.position === Position.South ||
      (deal.declarerPosition === Position.North && this.position === Position.North)
    ) {
      this.exposeCards(true);
    } else {
      this.exposeCards(false);
    }
  }

  //
  // InitializeSwappedHand()
  //
  // Called after the player's hand has been swapped with another player's in midgame
  //
  initializeSwappedHand(deal: PlayerDealView): void {
    // set internal variables
    this.declarerFlag = deal.declarerPosition === this.position;
    this.dummyFlag = deal.dummyPosition === this.position;

    // clear the analysis dialog
    this.clearAnalysis();
    this.status.stream('3Swapped into a new hand.\n------------------------\n');

    // determine the proper player algorithm to use
    if (this.declarerFlag) this.playEngine = this.declarerEngine;
    else if (this.dummyFlag) this.playEngine = this.dummyEngine;
    else this.playEngine = this.defenderEngine;

    // and init
    this.hand.countPoints(true);

    // finally, expose cards if necessary
    if (
      this.position === Position.South ||
      (deal.declarerPosition === Position.North && this.position === Position.North)
    ) {
      this.exposeCards(true);
    } else if (this.dummyFlag && (deal.numCardsPlayedInGame ?? 0) > 0) {
      this.exposeCards(true);
    } else {
      this.exposeCards(false);
    }
  }

  //
  // ClearHand()
  //
  // - called to clear and empty out the hand
  //
  clearHand(): void {
    this.hand.clear();
    this.bids = [];
    this.declarerEngine.clear();
    this.dummyEngine.clear();
    this.defenderEngine.clear();
    this.cardLocation.clear();
    for (let i = 0; i < 4; i++) {
      this.guessedHands[i].clear();
    }
    this.declarerFlag = false;
    this.dummyFlag = false;
    this.status.clear();
  }

  //
  // ExposeCards()
  //
  // turns the cards face up (or down)
  //
  exposeCards(code = true): void {
    this.exposed = code;
    for (const card of this.hand.cardsList.cardsInAscendingDeckOrder) {
      card.setFaceUp(code);
    }
  }

  //
  // Bidding-related routines
  // (mostly delegated to the m_pBidder object)
  //

  recordBid(bid: Bid): void {
    this.bids.push(bid);
  }

  get bidsMade(): readonly number[] {
    return this.bids;
  }

  getNumBidsMade(): number {
    return this.bids.filter(bid => bid !== Bid.Pass).length;
  }

  getNumBidTurns(): number {
    return this.bids.length;
  }

  //
  // GetPriorBid()
  //
  // if index = 0, returns the most recently made bid
  // if index = 1, returns the bid before the most recent made bid
  // if index = 2, returns the bid two turns before the most recent bid
  // etc...
  //
  getPriorBid(index = 1): number {
    if (index < 0) return 0;
    const entry = this.bids.length - index - 1;
    if (entry < 0) return Bid.None;
    return this.bids[entry];
  }

  getPriorSuit(index = 1): Suit | -1 {
    return bidSuit(this.getPriorBid(index));
  }

  makeOpeningBid(): Bid {
    // Delegates opening thresholds and convention tests to the C++-mapped
    // BiddingOpen/BidEngine behavior instead of duplicating them here.
    return this.bidEngine.makeOpeningBid(this.hand, this.position);
  }

  makeResponse(partnerBid: Bid): Bid {
    // Delegates to BiddingResponse.cpp / CBidEngine::MakeRespondingBid.
    return this.bidEngine.makeResponse(this.hand, partnerBid);
  }

  //
  // BiddingFinished()
  //
  // bidding is finished, so prepare to play the hand
  //
  biddingFinished(): void {
    // determine the proper player
    if (this.declarerFlag) this.playEngine = this.declarerEngine;
    else if (this.dummyFlag) this.playEngine = this.dummyEngine;
    else this.playEngine = this.defenderEngine;
  }

  clearBiddingInfo(): void {
    this.bids = [];
  }

  restartBidding(): void {
    this.bids = [];
    this.hand.countPoints(true);
  }

  setTestBiddingMode(mode: boolean): void {
    this.testBiddingMode = mode;
  }

  getTestBiddingMode(): boolean {
    return this.testBiddingMode;
  }

  setOpeningPosition(pos: Position): void {
    this.openingPosition = pos;
  }

  getOpeningPosition(): Position {
    return this.openingPosition;
  }

  getMinimumOpeningValue(): number {
    const openingPos = this.getOpeningPosition();
    if (openingPos < 0 || openingPos > 3) return 10;
    const is3rd4thPos = openingPos === 2 || openingPos === 3;
    return is3rd4thPos ? 10 : 12;
  }

  //
  // Play-related routines
  // (mostly delegated to the m_pPlayEngine object)
  //

  playCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    return this.playEngine?.playCard(ledSuit) ?? null;
  }

  recordCardPlay(pos: Position, card: Card): void {
    this.playEngine?.recordCardPlay(pos, card);
  }

  recordCardUndo(pos: Position, card: Card): void {
    this.playEngine?.recordCardUndo(pos, card);
  }

  getNumClaimableTricks(): number {
    return this.playEngine?.getNumClaimableTricks() ?? 0;
  }

  //
  // RestartPlay()
  //
  // restart play of the current hand
  //
  restartPlay(): void {
    // reset guessed hands
    for (let i = 0; i < 4; i++) {
      this.guessedHands[i].clear();
      this.guessedHands[i].initNewHand(this.hand, this.position);
    }
    // reset hand
    this.restoreInitialHand();
    if (this.position !== Position.South) {
      this.exposeCards(false);
    }
    this.initialEvaluateHand();
  }

  //
  // TestForAutoPlayLastCard()
  //
  testForAutoPlayLastCard(
    leadCard: Card | null,
    autoHintMode = 0,
  ): Card | null {
    const suitLed = leadCard ? leadCard.suit : NONE;
    if (isSuit(suitLed) && this.getNumCardsInSuit(suitLed) === 1) {
      // auto play last card in suit
      const playCard = this.getCardInSuit(suitLed, 0);
      if (!playCard) return null;

      // note the play in the hint window
      if (autoHintMode > 0) {
        this.status.clearHints();
        this.status.beginHintBlock();
        this.status
          .stream('Follow with our only ')
          .addStream(Card.suitToSingularString(suitLed))
          .addStream(', the ')
          .addStream(playCard.faceName)
          .addStream('.\n');
        this.status.endHintBlock();
      }
      // done
      return playCard;
    } else if (this.getNumCards() === 1) {
      // auto play last card in hand
      const playCard = this.getCardByPosition(0);
      if (!playCard) return null;

      // note the play in the hint window
      if (autoHintMode > 0) {
        this.status.clearHints();
        this.status.beginHintBlock();
        this.status
          .stream('Follow with our last card, the ')
          .addStream(playCard.faceName)
          .addStream('.\n');
        this.status.endHintBlock();
      }
      // done
      return playCard;
    }

    // nothing to autoplay here
    return null;
  }

  //
  // Feedback routines (using m_pStatusDlg)
  //

  suspendTrace(): void {
    this.status.enableTrace(false);
  }

  resumeTrace(): void {
    this.status.enableTrace(true);
  }

  trace(text: string): void {
    this.status.stream(text).addStream('\n');
  }

  addTrace(message: string, temp: string): void {
    this.status.stream(message).stream(temp);
  }

  clearAnalysis(): void {
    this.status.clear();
  }

  showAnalysis(show = true): void {
    this.status.show(show);
  }

  setAnalysis(str: string): void {
    this.status.clear();
    this.status.stream(str);
  }

  getAnalysis(): string {
    return this.status.text;
  }

  //
  // Misc other routines
  //

  get isDeclarer(): boolean {
    return this.declarerFlag;
  }

  get isDummy(): boolean {
    return this.dummyFlag;
  }

  get isDefending(): boolean {
    return !this.declarerFlag && !this.dummyFlag;
  }

  //
  // IsHumanPlayer()
  //
  // determines whether this is a human player or not
  //
  isHumanPlayer(declarerPosition: Position): boolean {
    // a player is human if it's south, or if it's north AND
    // declarer is north or south
    return (
      this.position === Position.South ||
      (this.position === Position.North &&
        (declarerPosition === Position.North || declarerPosition === Position.South))
    );
  }

  get team(): Team {
    return this.position === Position.South || this.position === Position.North
      ? Team.NorthSouth
      : Team.EastWest;
  }

  setDeclarerFlag(value = true): void {
    this.declarerFlag = value;
  }

  setDummyFlag(value = true): void {
    this.dummyFlag = value;
  }
}
