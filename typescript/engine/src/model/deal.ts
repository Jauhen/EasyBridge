import {
  Bid,
  bidLevel,
  bidSuit,
  bidToPbn,
  charToPosition,
  contractToPbn,
  isBid,
  isMajor,
  isMinor,
  isSuit,
  nextPosition,
  NONE,
  partnerPosition,
  Position,
  positionToChar,
  Suit,
  Team,
  Vulnerability,
} from '../constants.js';
import { Card } from '../card.js';
import { Deck } from '../deck.js';
import { Player } from '../player.js';
import type { BiddingRoundContext } from '../bidding/bidEngine.js';
import { ConventionSet } from '../bidding/conventionSet.js';
import type { PlayRoundContext, TrickRecord } from '../play/playEngine.js';
import { PbnDocument, parsePbnDealTag } from './pbn.js';

export interface DealOptions {
  dealer?: Position;
  vulnerability?: Vulnerability;
  date?: string;
  southHuman?: boolean;
  conventionSet?: ConventionSet;
}

export class Deal {
  readonly players: readonly Player[];
  readonly conventionSet: ConventionSet;
  private currentDate: string;
  dealer: Position;
  vulnerability: Vulnerability;
  private biddingHistory: Bid[] = [];
  private validBidHistory: Bid[] = [];
  private validBidPositions: Position[] = [];
  private bidsByPosition: Bid[][] = [[], [], [], []];
  private passes = 0;
  private lastValidBid: Bid = Bid.Pass;
  private lastValidBidTeam: Team = Team.Neither;
  private partnershipLead: Team[] = [Team.NorthSouth, Team.EastWest];
  contract: Bid = Bid.Pass;
  contractModifier = 0;
  declarer: Position = Position.South;
  dummy: Position = Position.North;
  gameLead: Position = Position.West;
  currentPlayer: Position;
  private currentTrick: (Card | null)[] = [null, null, null, null];
  private cardsPlayedInRound = 0;
  private suitLed: Suit | -1 = -1;
  private roundLead: Position;
  private dummyExposed = false;
  private tricksPlayed = 0;
  private tricksWon: [number, number] = [0, 0];
  private gameTricks: (Card | null)[][] = [];
  private trickRecords: TrickRecord[] = [];
  private trickLeads: Position[] = [];
  private trickWinners: Position[] = [];
  private northSouthScore = 0;
  private eastWestScore = 0;
  private specialDealCode = 0;

  constructor(options: DealOptions = {}) {
    this.players = [
      new Player(Position.South),
      new Player(Position.West),
      new Player(Position.North),
      new Player(Position.East),
    ];
    this.conventionSet = options.conventionSet ?? new ConventionSet();
    this.conventionSet.initConventions();
    this.dealer = options.dealer ?? Position.South;
    this.currentPlayer = this.dealer;
    this.roundLead = this.dealer;
    this.vulnerability = options.vulnerability ?? Vulnerability.None;
    this.currentDate = options.date ?? '2016.07.12';

    const biddingContext = this.createBiddingRoundContext();
    for (let pos = Position.South; pos <= Position.East; pos++) {
      const p = pos as Position;
      const partner = this.players[partnerPosition(p)];
      const lho = this.players[nextPosition(p)];
      const rho = this.players[prevPosition(p)];
      this.players[p].initializePlayer(p, partner, lho, rho);
      this.players[p].initializeEngines();
      this.players[p].initializeBidEngine(biddingContext, this.conventionSet);
    }
  }

  private createBiddingRoundContext(): BiddingRoundContext {
    const deal = this;
    return {
      get biddingRound(): number {
        return Math.floor(deal.biddingHistory.length / 4);
      },
      get lastValidBid(): Bid {
        return deal.lastValidBid;
      },
      get lastValidBidTeam(): number {
        return deal.lastValidBidTeam === Team.NorthSouth ? 0 : deal.lastValidBidTeam === Team.EastWest ? 1 : -1;
      },
      get numBidsMade(): number {
        return deal.biddingHistory.length;
      },
      get dealer(): Position {
        return deal.dealer;
      },
      get contractModifier(): number {
        return deal.contractModifier;
      },
      get contract(): Bid {
        return deal.contract;
      },
      get declarerPosition(): Position {
        return deal.declarer;
      },
      get roundLead(): Position {
        return deal.roundLead;
      },
      get numValidBidsMade(): number {
        return deal.validBidHistory.length;
      },
      get openingBid(): Bid {
        return deal.validBidHistory[0] ?? Bid.Pass;
      },
      get openingBidder(): Position {
        return deal.validBidPositions[0] ?? Position.Unknown;
      },
      isBidValid(bid: Bid): boolean {
        if (bid === Bid.Pass) return true;
        if (bid === Bid.Double) {
          return isBid(deal.lastValidBid) && deal.contractModifier === 0;
        }
        if (bid === Bid.Redouble) {
          return isBid(deal.lastValidBid) && deal.contractModifier === 1;
        }
        return isBid(bid) && bid > deal.lastValidBid;
      },
      getBidByPlayer(position: Position, round: number): Bid {
        return deal.bidsByPosition[position]?.[round] ?? Bid.None;
      },
      getBidByIndex(index: number): Bid {
        return deal.biddingHistory[index] ?? Bid.None;
      },
      getValidBidRecord(index: number): Bid {
        return deal.validBidHistory[index] ?? Bid.Pass;
      },
    };
  }

  private resetAuctionAndPlayState(): void {
    this.biddingHistory = [];
    this.validBidHistory = [];
    this.validBidPositions = [];
    this.bidsByPosition = [[], [], [], []];
    this.passes = 0;
    this.lastValidBid = Bid.Pass;
    this.lastValidBidTeam = Team.Neither;
    this.contract = Bid.Pass;
    this.contractModifier = 0;
    this.dummyExposed = false;
    this.tricksPlayed = 0;
    this.tricksWon = [0, 0];
    this.gameTricks = [];
    this.trickRecords = [];
    this.trickLeads = [];
    this.trickWinners = [];
    this.currentTrick = [null, null, null, null];
    this.cardsPlayedInRound = 0;
    this.suitLed = -1;
    this.northSouthScore = 0;
    this.eastWestScore = 0;
    this.currentPlayer = this.dealer;
    this.roundLead = this.dealer;
    for (const player of this.players) {
      player.clearBiddingInfo();
      player.bidEngine.clear();
    }
  }

  initializeNewHand(): void {
    for (const player of this.players) player.clearHand();
  }

  assignCards(hands: readonly (readonly Card[])[]): void {
    if (hands.length !== 4) throw new Error('Deal requires exactly four hands');
    this.resetAuctionAndPlayState();
    for (let position = Position.South; position <= Position.East; position++) {
      this.players[position].clearHand();
      for (const card of hands[position]) this.players[position].addCard(card);
      this.players[position].initializeHand();
    }
  }

  assignPbnHands(pbn: readonly (readonly string[])[]): void {
    const hands: Card[][] = [[], [], [], []];
    const positionOrder = [Position.West, Position.North, Position.East, Position.South];
    for (let pbnIndex = 0; pbnIndex < 4; pbnIndex++) {
      const position = positionOrder[pbnIndex];
      const suitNames = ['S', 'H', 'D', 'C'];
      const suitValues = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
      for (let suitIndex = 0; suitIndex < 4; suitIndex++) {
        for (const letter of pbn[pbnIndex][suitIndex] ?? '') {
          const faceMap: Record<string, number> = { T: 10, J: 11, Q: 12, K: 13, A: 14 };
          const face = faceMap[letter.toUpperCase()] ?? Number(letter);
          if (!Number.isInteger(face) || face < 2 || face > 14) {
            throw new Error(`Invalid PBN card ${letter}${suitNames[suitIndex]}`);
          }
          hands[position].push(new Card(suitValues[suitIndex], face));
        }
      }
    }
    this.assignCards(hands);
  }

  loadPbnDocument(document: PbnDocument): void {
    this.biddingHistory = [];
    this.validBidHistory = [];
    this.validBidPositions = [];
    this.bidsByPosition = [[], [], [], []];
    this.passes = 0;
    this.lastValidBid = Bid.Pass;
    this.lastValidBidTeam = Team.Neither;
    this.contract = Bid.Pass;
    this.contractModifier = 0;

    const dealerText = document.tags.DEALER;
    if (dealerText) this.dealer = charToPosition(dealerText);
    const vulnerableText = document.tags.VULNERABLE?.toUpperCase();
    this.vulnerability =
      vulnerableText === 'BOTH' ? Vulnerability.Both :
      vulnerableText === 'NS' ? Vulnerability.NorthSouth :
      vulnerableText === 'EW' ? Vulnerability.EastWest :
      Vulnerability.None;
    if (document.tags.DEAL) {
      const hands = parsePbnDealTag(document.tags.DEAL);
      this.assignPbnHands(hands.map(cardsToPbnSuitStrings));
    }
    this.currentPlayer = this.dealer;
    this.roundLead = this.dealer;
    for (const bid of document.auction) {
      if (this.passes >= 3) break;
      this.enterBid(this.currentPlayer, bid as Bid);
    }
  }

  /**
   * Mirrors Deal::DealNumberedHand plus Deck::Shuffle for specialDealCode 0.
   * Cards are dealt 13 rounds with position order S, W, N, E, matching C++.
   */
  dealNumberedHand(
    dealer: Position,
    vulnerability: Vulnerability,
    specialDealCode: number,
    dealNumber: number,
  ): number {
    this.specialDealCode = specialDealCode;
    this.dealer = dealer;
    this.vulnerability = vulnerability;
    this.currentPlayer = dealer;
    this.roundLead = dealer;

    const deck = new Deck();
    const actualSeed = deck.shuffle(dealNumber);
    for (const player of this.players) player.clearHand();
    let deckIndex = 0;
    for (let round = 0; round < 13; round++) {
      for (const position of [Position.South, Position.West, Position.North, Position.East]) {
        const card = deck.cards[deckIndex++];
        this.players[position].addCard(card);
      }
    }
    for (const player of this.players) player.initializeHand();
    this.resetAuctionAndPlayState();
    return actualSeed;
  }

  enterBid(position: Position, bid: Bid): number {
    if (position !== this.currentPlayer) throw new Error(`It is ${positionToChar(this.currentPlayer)}'s turn, not ${positionToChar(position)}`);
    if (bid === Bid.Pass) {
      this.passes++;
    } else if (bid === Bid.Double || bid === Bid.Redouble) {
      this.passes = 0;
      this.contractModifier = bid === Bid.Double ? 1 : 2;
    } else {
      if (isBid(bid) && bid <= this.lastValidBid) {
        throw new Error('Bid must be higher than the last valid bid');
      }
      this.passes = 0;
      this.lastValidBid = bid;
      const team = position === Position.South || position === Position.North
        ? Team.NorthSouth
        : Team.EastWest;
      this.lastValidBidTeam = team;
      this.validBidHistory.push(bid);
      this.validBidPositions.push(position);
      this.contractModifier = 0;
    }
    this.biddingHistory.push(bid);
    this.bidsByPosition[position].push(bid);
    for (const player of this.players) {
      player.recordBid(position, bid);
    }
    this.currentPlayer = nextPosition(this.currentPlayer);

    if (this.passes >= 4 && !isBid(this.lastValidBid)) {
      return -1;
    }

    if (this.passes >= 3 && isBid(this.lastValidBid)) {
      this.contract = this.lastValidBid;
      const suit = bidSuit(this.contract);
      this.declarer = this.findDeclarer(this.lastValidBidTeam, suit);
      this.dummy = partnerPosition(this.declarer);
      this.gameLead = nextPosition(this.declarer);
      this.roundLead = this.gameLead;
      this.currentPlayer = this.gameLead;
      this.notifyBiddingFinished();
      return 1;
    }
    return 0;
  }

  private notifyBiddingFinished(): void {
    const suit = bidSuit(this.contract);
    const trumpSuit: Suit | typeof NONE = isSuit(suit) ? suit : NONE;
    for (const player of this.players) {
      const team = player.team;
      const oppTeam = team === Team.NorthSouth ? Team.EastWest : Team.NorthSouth;
      player.biddingFinished({
        contract: this.contract,
        contractModifier: this.contractModifier,
        declarerPosition: this.declarer,
        dummyPosition: this.dummy,
        trumpSuit,
        vulnerable: this.isTeamVulnerable(team),
        opponentsVulnerable: this.isTeamVulnerable(oppTeam),
      });
    }
  }

  bidAutomatically(): void {
    let safety = 0;
    while (safety++ < 200) {
      if (this.passes >= 3 && isBid(this.lastValidBid)) break;
      if (this.passes >= 4 && !isBid(this.lastValidBid)) break;
      const position = this.currentPlayer;
      let bid = this.players[position].bid();
      if (isBid(bid) && bid <= this.lastValidBid) bid = Bid.Pass;
      if (bid === Bid.Double && (!isBid(this.lastValidBid) || this.contractModifier !== 0)) bid = Bid.Pass;
      if (bid === Bid.Redouble && (!isBid(this.lastValidBid) || this.contractModifier !== 1)) bid = Bid.Pass;
      const result = this.enterBid(position, bid);
      if (result !== 0) break;
    }
  }

  beginRound(): void {
    this.dummyExposed = false;
    this.currentPlayer = this.roundLead;
    if (isBid(this.contract) && !this.players[this.declarer].playEngine) {
      this.notifyBiddingFinished();
    }
  }

  exposeDummy(expose = true): void {
    this.dummyExposed = expose;
    this.players[this.dummy].exposeCards(expose);
  }

  private getCurrentTrickHigh(): { card: Card | null; position: Position | typeof NONE } {
    if (this.cardsPlayedInRound === 0) return { card: null, position: NONE };
    const contractSuit = bidSuit(this.contract);
    let winner: Position | typeof NONE = this.roundLead;
    let winningCard = this.currentTrick[this.roundLead];
    if (!winningCard) return { card: null, position: NONE };
    let pos = nextPosition(this.roundLead);
    for (let step = 1; step < this.cardsPlayedInRound; step++) {
      const card = this.currentTrick[pos];
      if (card) {
        if (isSuit(contractSuit) && winningCard.suit !== contractSuit && card.suit === contractSuit) {
          winner = pos;
          winningCard = card;
        } else if (card.suit === winningCard.suit && card.faceValue > winningCard.faceValue) {
          winner = pos;
          winningCard = card;
        }
      }
      pos = nextPosition(pos);
    }
    return { card: winningCard, position: winner };
  }

  private buildPlayRoundContext(position: Position): PlayRoundContext {
    const suit = bidSuit(this.contract);
    const trumpSuit: Suit | typeof NONE = isSuit(suit) ? suit : NONE;
    const high = this.getCurrentTrickHigh();
    const leadCard = this.cardsPlayedInRound > 0 ? this.currentTrick[this.roundLead] : null;
    const partnerPos = partnerPosition(position);
    const rhoPos = prevPosition(position);
    const lhoPos = nextPosition(position);
    const declarerTeamIdx = this.contractTeam === Team.NorthSouth ? 0 : 1;
    const defenderTeamIdx = 1 - declarerTeamIdx;
    const teamIdx = position === Position.South || position === Position.North ? 0 : 1;

    const bidSuits = new Set<Suit>();
    for (const b of this.validBidHistory) {
      const s = bidSuit(b);
      if (isSuit(s)) bidSuits.add(s);
    }
    const unbidSuits = ([Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades] as Suit[]).filter(
      s => !bidSuits.has(s),
    );

    return {
      numCardsPlayedInRound: this.cardsPlayedInRound,
      playRound: this.tricksPlayed,
      numTricksPlayed: this.tricksPlayed,
      numTricksRemaining: 13 - this.tricksPlayed,
      roundLead: this.roundLead,
      leadCard,
      currentHighCard: high.card,
      currentHighPos: high.position,
      partnersCard: this.currentTrick[partnerPos],
      rhoCard: this.currentTrick[rhoPos],
      declarersCard: this.currentTrick[this.declarer],
      dummysCard: this.currentTrick[this.dummy],
      trumpSuit,
      wasTrumpPlayed: isSuit(trumpSuit) && this.currentTrick.some(c => c !== null && c.suit === trumpSuit),
      dummyHand: this.players[this.dummy].hand,
      dummyPosition: this.dummy,
      declarerPosition: this.declarer,
      dummyExposed: this.dummyExposed,
      unbidSuits,
      contract: this.contract,
      contractLevel: isBid(this.contract) ? bidLevel(this.contract) : 0,
      numTricksWonByTeam: this.tricksWon[teamIdx],
      numTricksWonByDeclarer: this.tricksWon[declarerTeamIdx],
      numTricksWonByDefenders: this.tricksWon[defenderTeamIdx],
      gameTrickHistory: this.trickRecords,
      partnerBids: this.bidsByPosition[partnerPos],
      lhoBids: this.bidsByPosition[lhoPos],
      rhoBids: this.bidsByPosition[rhoPos],
      currentPlayerPosition: position,
      isDummyTurn: position === this.dummy,
    };
  }

  enterCardPlay(position: Position, card: Card): void {
    if (position !== this.currentPlayer) throw new Error(`It is ${positionToChar(this.currentPlayer)}'s turn`);
    if (this.cardsPlayedInRound > 0 &&
      card.suit !== this.suitLed &&
      this.players[position].hand.getSuitLength(this.suitLed as Suit) > 0) {
      throw new Error('You must follow suit');
    }
    const owner = this.players[position].removeCard(card);
    if (!owner) throw new Error(`${card.name} is not held by ${positionToChar(position)}`);
    if (this.cardsPlayedInRound === 0) this.suitLed = card.suit;
    this.currentTrick[position] = card;
    this.cardsPlayedInRound++;
    if (this.tricksPlayed === 0 && this.cardsPlayedInRound === 1) {
      this.exposeDummy(true);
    }
    for (let pos = Position.South; pos <= Position.East; pos++) {
      const ctx = this.buildPlayRoundContext(pos as Position);
      this.players[pos].recordCardPlay(position, card, ctx);
    }
    this.currentPlayer = nextPosition(position);
  }

  evaluateTrick(): Position {
    if (this.cardsPlayedInRound !== 4) throw new Error('Cannot evaluate an incomplete trick');
    const contractSuit = bidSuit(this.contract);
    let winner = this.roundLead;
    let winningCard = this.currentTrick[winner];
    if (!winningCard) throw new Error('Missing led card');
    for (let position = 0; position < 4; position++) {
      const card = this.currentTrick[position];
      if (!card) continue;
      if (isSuit(contractSuit) && winningCard.suit !== contractSuit && card.suit === contractSuit) {
        winner = position as Position;
        winningCard = card;
      } else if (card.suit === winningCard.suit && card.faceValue > winningCard.faceValue) {
        winner = position as Position;
        winningCard = card;
      }
    }
    this.trickWinners.push(winner);
    const cardsMap: Partial<Record<Position, Card>> = {};
    for (let p = Position.South; p <= Position.East; p++) {
      const c = this.currentTrick[p];
      if (c) cardsMap[p as Position] = c;
    }
    this.trickRecords.push({ lead: this.roundLead, winner, cards: cardsMap });
    const winnerTeam = winner === Position.South || winner === Position.North
      ? 0
      : 1;
    this.tricksWon[winnerTeam]++;
    this.tricksPlayed++;
    for (const player of this.players) {
      player.recordRoundComplete(winner, winningCard);
    }
    if (this.tricksPlayed === 13) {
      const declarerTeam = this.contractTeam;
      const declarerTricks = this.tricksWon[declarerTeam === Team.NorthSouth ? 0 : 1];
      const result = declarerTricks - (bidLevel(this.contract) + 6);
      for (const player of this.players) {
        player.recordHandComplete(result, declarerTeam);
      }
    }
    return winner;
  }

  clearTrick(): void {
    this.gameTricks.push([...this.currentTrick]);
    this.trickLeads.push(this.roundLead);
    this.currentTrick = [null, null, null, null];
    this.cardsPlayedInRound = 0;
    this.suitLed = -1;
    this.roundLead = this.trickWinners[this.trickWinners.length - 1] ?? this.roundLead;
    this.currentPlayer = this.roundLead;
  }

  playOneTrick(): Position {
    let position = this.roundLead;
    this.currentPlayer = this.roundLead;
    for (let index = 0; index < 4; index++) {
      position = this.currentPlayer;
      const card = this.chooseCard(position);
      this.enterCardPlay(position, card);
    }
    const winner = this.evaluateTrick();
    this.clearTrick();
    return winner;
  }

  playAllTricks(): void {
    for (let trick = 0; trick < 13; trick++) {
      if (this.players.every(player => player.hand.length === 0)) break;
      this.playOneTrick();
    }
  }

  chooseCard(position: Position): Card {
    const player = this.players[position];
    const hand = player.hand;
    const ledSuit: Suit | typeof NONE = this.cardsPlayedInRound > 0 && this.suitLed !== -1
      ? (this.suitLed as Suit)
      : NONE;

    if (player.playEngine) {
      const roundContext = this.buildPlayRoundContext(position);
      const engineCard = player.playCard(ledSuit, roundContext);
      if (engineCard) {
        const heldCard = hand.findCardByDeckValue(engineCard.deckValue);
        if (heldCard) {
          const mustFollow = ledSuit !== NONE && hand.getSuitLength(ledSuit) > 0;
          if (!mustFollow || heldCard.suit === ledSuit) {
            return heldCard;
          }
        }
      }
    }

    // Legal fallback if play engine did not select a legal card in hand
    if (ledSuit !== NONE) {
      const following = hand.getCardsInSuit(ledSuit);
      if (following.length > 0) return following[following.length - 1];
    }
    for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
      const cards = hand.getCardsInSuit(suit as Suit);
      if (cards.length > 0) return cards[cards.length - 1];
    }
    throw new Error(`Player ${positionToChar(position)} has no cards`);
  }

  updateDuplicateScore(): void {
    if (!isBid(this.contract)) {
      this.northSouthScore = 0;
      this.eastWestScore = 0;
      return;
    }
    const team = this.contractTeam;
    const level = bidLevel(this.contract);
    const suit = bidSuit(this.contract);
    const required = level + 6;
    const teamIndex = team === Team.NorthSouth ? 0 : 1;
    const made = this.tricksWon[teamIndex];
    const vulnerable = this.isTeamVulnerable(team);

    if (made >= required) {
      const overtricks = made - required;
      let basePoints =
        suit === Suit.NoTrump
          ? 40 + (level - 1) * 30
          : level * (isMinor(suit) ? 20 : 30);
      if (this.contractModifier === 1) basePoints *= 2;
      else if (this.contractModifier === 2) basePoints *= 4;

      let bonus = basePoints >= 100 ? (vulnerable ? 500 : 300) : 50;
      if (level === 6) bonus += vulnerable ? 750 : 500;
      else if (level === 7) bonus += vulnerable ? 1500 : 1000;
      if (this.contractModifier === 1) bonus += 50;
      else if (this.contractModifier === 2) bonus += 100;

      let overtrickPoints = 0;
      if (overtricks > 0) {
        if (this.contractModifier === 0) {
          overtrickPoints = overtricks * (isMinor(suit) ? 20 : 30);
        } else if (this.contractModifier === 1) {
          overtrickPoints = overtricks * (vulnerable ? 200 : 100);
        } else {
          overtrickPoints = overtricks * (vulnerable ? 400 : 200);
        }
      }

      const total = basePoints + bonus + overtrickPoints;
      this.northSouthScore = team === Team.NorthSouth ? total : 0;
      this.eastWestScore = team === Team.EastWest ? total : 0;
    } else {
      const down = required - made;
      let penalty = 0;
      if (this.contractModifier === 0) {
        penalty = down * (vulnerable ? 100 : 50);
      } else if (this.contractModifier === 1) {
        if (vulnerable) {
          penalty = 200 + Math.max(0, down - 1) * 300;
        } else {
          penalty = 100 + Math.min(2, Math.max(0, down - 1)) * 200 + Math.max(0, down - 3) * 300;
        }
      } else {
        if (vulnerable) {
          penalty = 400 + Math.max(0, down - 1) * 600;
        } else {
          penalty = 200 + Math.min(2, Math.max(0, down - 1)) * 400 + Math.max(0, down - 3) * 600;
        }
      }
      this.northSouthScore = team === Team.NorthSouth ? 0 : penalty;
      this.eastWestScore = team === Team.NorthSouth ? penalty : 0;
    }
  }

  get contractTeam(): Team {
    return this.declarer === Position.South || this.declarer === Position.North
      ? Team.NorthSouth
      : Team.EastWest;
  }

  getTotalScoreNS(): number {
    return this.northSouthScore - this.eastWestScore;
  }

  get playedTricks(): readonly (readonly (Card | null)[])[] {
    return this.gameTricks;
  }

  get biddingHistoryPublic(): readonly Bid[] {
    return this.biddingHistory;
  }

  get tricksWonByTeam(): readonly [number, number] {
    return this.tricksWon;
  }

  get numTricksPlayed(): number {
    return this.tricksPlayed;
  }

  get specialDealCodeValue(): number {
    return this.specialDealCode;
  }

  get date(): string {
    return this.currentDate;
  }

  setDate(date: string): void {
    this.currentDate = date;
  }

  writeFilePbn(): string {
    const vulnerable = this.vulnerabilityName;
    const deal = this.formatDealTag();
    const declarer = positionToChar(this.declarer);
    const contract = contractToPbn(this.contract, this.contractModifier);
    const result = this.tricksPlayed === 13
      ? String(this.tricksWon[this.contractTeam === Team.NorthSouth ? 0 : 1])
      : '?';
    const lines: string[] = [
      '%% ',
      '%% EXPORT',
      '%% PBN Format 1.0',
      '%% File generated by Easy Bridge version Version 4.0.2',
      '%% ',
      '[EVENT " Game"]',
      '[SITE ""]',
      `[DATE "${this.date}"]`,
      '[BOARD ""]',
      '[WEST "Computer"]',
      '[NORTH "Computer"]',
      '[EAST "Computer"]',
      '[SOUTH "Human Player"]',
      `[DEALER "${positionToChar(this.dealer)}"]`,
      `[VULNERABLE "${vulnerable}"]`,
      `[DEAL "${deal}"]`,
      '[SCORING "None"]',
      `[DECLARER "${declarer}"]`,
      `[CONTRACT "${contract}"]`,
      `[RESULT "${result}"]`,
    ];

    lines.push(this.formatHandsComment());
    lines.push(this.formatAuctionTag());
    lines.push(this.formatPlayTag());
    lines.push('[GENERATOR "Easy Bridge version Version 4.0.2"]');
    lines.push('[DESCRIPTION ""]');
    return `${lines.join('\n')}\n`;
  }

  private get vulnerabilityName(): string {
    if (this.vulnerability === Vulnerability.Both) return 'Both';
    if (this.vulnerability === Vulnerability.NorthSouth) return 'NS';
    if (this.vulnerability === Vulnerability.EastWest) return 'EW';
    return 'None';
  }

  private isTeamVulnerable(team: Team): boolean {
    return this.vulnerability === Vulnerability.Both ||
      (team === Team.NorthSouth && this.vulnerability === Vulnerability.NorthSouth) ||
      (team === Team.EastWest && this.vulnerability === Vulnerability.EastWest);
  }

  private findDeclarer(team: Team, suit: Suit | -1): Position {
    // Declarer is the player who first bid the contract suit or No Trump,
    // in auction order. Position-order scanning can select a later bidder
    // from the same partnership (for example, South instead of North).
    for (let index = 0; index < this.validBidHistory.length; index++) {
      const bid = this.validBidHistory[index];
      const position = this.validBidPositions[index];
      const bidderTeam = position === Position.South || position === Position.North
        ? Team.NorthSouth
        : Team.EastWest;
      if (bidderTeam !== team) continue;
      const isMatchingContract =
        suit === Suit.NoTrump
          ? bid === Bid.NT1 || bid === Bid.NT2 || bid === Bid.NT3
          : bidSuit(bid) === suit;
      if (isMatchingContract) return position;
    }
    return team === Team.NorthSouth ? Position.South : Position.West;
  }

  private formatDealTag(): string {
    const wneSPositions = [Position.West, Position.North, Position.East, Position.South];
    return `W:${wneSPositions.map(position => this.players[position].hand.getInitialPbnHoldings()).join(' ')}`;
  }

  private formatHandsComment(): string {
    const north = this.players[Position.North].hand.getInitialPbnHoldings();
    const west = this.players[Position.West].hand.getInitialPbnHoldings();
    const east = this.players[Position.East].hand.getInitialPbnHoldings();
    const south = this.players[Position.South].hand.getInitialPbnHoldings();
    const ns = north.split('.');
    const ws = west.split('.');
    const es = east.split('.');
    const ss = south.split('.');
    const formatCards = (cards: string) => (cards ? `${cards.split('').join(' ')} ` : '');
    const formatWestEast = (label: string, westCards: string, eastCards: string) => {
      const left = `${label}: ${formatCards(westCards)}`;
      const padded = left.length < 32 ? left.padEnd(32, ' ') : `${left} `;
      return `${padded}${label}: ${formatCards(eastCards)}`;
    };
    return [
      '{',
      `                S: ${formatCards(ns[0])}`,
      `                H: ${formatCards(ns[1])}`,
      `                D: ${formatCards(ns[2])}`,
      `                C: ${formatCards(ns[3])}`,
      formatWestEast('S', ws[0], es[0]),
      formatWestEast('H', ws[1], es[1]),
      formatWestEast('D', ws[2], es[2]),
      formatWestEast('C', ws[3], es[3]),
      `                S: ${formatCards(ss[0])}`,
      `                H: ${formatCards(ss[1])}`,
      `                D: ${formatCards(ss[2])}`,
      `                C: ${formatCards(ss[3])}`,
      '}',
    ].join('\n');
  }

  private formatAuctionTag(): string {
    let position = this.dealer;
    const bids: string[] = [];
    for (const bid of this.biddingHistory) {
      bids.push(bidToPbn(bid));
      position = nextPosition(position);
    }
    const rows: string[] = [];
    for (let index = 0; index < bids.length; index += 4) {
      rows.push(`${bids.slice(index, index + 4).join(' ')} `);
    }
    return `[AUCTION "${positionToChar(this.dealer)}"]\n${rows.join('\n')}`;
  }

  private formatPlayTag(): string {
    if (this.gameTricks.length === 0) return `[PLAY "${positionToChar(this.gameLead)}"]`;
    const rows: string[] = [];
    for (const trick of this.gameTricks) {
      const cards: string[] = [];
      let position = this.gameLead;
      for (let step = 0; step < 4; step++) {
        const card = trick[position];
        cards.push(card ? card.name : '-');
        position = nextPosition(position);
      }
      rows.push(`${cards.join(' ')} `);
    }
    return `[PLAY "${positionToChar(this.gameLead)}"]\n${rows.join('\n')}`;
  }
}

function prevPosition(position: Position): Position {
  return (position + 3) % 4 as Position;
}

function cardsToPbnSuitStrings(cards: readonly Card[]): readonly [string, string, string, string] {
  const faces = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
    .map(suit => cards
      .filter(card => card.suit === suit)
      .sort((a, b) => b.faceValue - a.faceValue)
      .map(card => card.name[1])
      .join(''));
  return faces as unknown as readonly [string, string, string, string];
}
