import { Bid, bidLevel, bidSuit, charToPosition, contractToPbn, isBid, nextPosition, Position, positionToChar, Suit, Team, Vulnerability, bidToPbn } from '../constants.js';
import { Card } from '../card.js';
import { Deck } from '../deck.js';
import { Player } from '../player.js';
import { PbnDocument, parsePbnDealTag } from './pbn.js';

export interface DealOptions {
  dealer?: Position;
  vulnerability?: Vulnerability;
  date?: string;
  southHuman?: boolean;
}

export class Deal {
  readonly players: readonly Player[];
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
  private tricksPlayed = 0;
  private tricksWon: [number, number] = [0, 0];
  private gameTricks: (Card | null)[][] = [];
  private trickLeads: Position[] = [];
  private trickWinners: Position[] = [];
  private northSouthScore = 0;
  private eastWestScore = 0;

  constructor(options: DealOptions = {}) {
    this.players = [
      new Player(Position.South),
      new Player(Position.West),
      new Player(Position.North),
      new Player(Position.East),
    ];
    this.dealer = options.dealer ?? Position.South;
    this.currentPlayer = this.dealer;
    this.roundLead = this.dealer;
    this.vulnerability = options.vulnerability ?? Vulnerability.None;
    this.currentDate = options.date ?? '2016.07.12';
  }

  initializeNewHand(): void {
    for (const player of this.players) player.clearHand();
  }

  assignCards(hands: readonly (readonly Card[])[]): void {
    if (hands.length !== 4) throw new Error('Deal requires exactly four hands');
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
    if (specialDealCode !== 0) {
      throw new Error('Special deal codes are not yet supported in TypeScript');
    }
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
    this.biddingHistory = [];
    this.validBidHistory = [];
    this.validBidPositions = [];
    this.bidsByPosition = [[], [], [], []];
    this.passes = 0;
    this.lastValidBid = Bid.Pass;
    this.lastValidBidTeam = Team.Neither;
    this.contract = Bid.Pass;
    this.contractModifier = 0;
    this.tricksPlayed = 0;
    this.tricksWon = [0, 0];
    this.gameTricks = [];
    this.trickLeads = [];
    this.trickWinners = [];
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
    this.players[position].recordBid(bid);
    this.bidsByPosition[position].push(bid);
    this.currentPlayer = nextPosition(this.currentPlayer);

    if (this.passes >= 3 && isBid(this.lastValidBid)) {
      this.contract = this.lastValidBid;
      const suit = bidSuit(this.contract);
      this.declarer = this.findDeclarer(this.lastValidBidTeam, suit);
      this.dummy = nextPosition(nextPosition(nextPosition(this.declarer)));
      this.gameLead = nextPosition(this.declarer);
      this.roundLead = this.gameLead;
      this.currentPlayer = this.gameLead;
      return 1;
    }
    return 0;
  }

  bidAutomatically(): void {
    while (this.passes < 3) {
      const position = this.currentPlayer;
      const priorBid = this.validBidHistory[this.validBidHistory.length - 1];
      let bid: Bid;
      if (this.biddingHistory.length === 0) {
        bid = this.players[position].makeOpeningBid();
      } else if (priorBid !== undefined) {
        bid = this.players[position].makeResponse(priorBid);
      } else {
        bid = Bid.Pass;
      }
      if (isBid(bid) && bid <= this.lastValidBid) bid = Bid.Pass;
      this.enterBid(position, bid);
    }
  }

  beginRound(): void {
    this.currentPlayer = this.roundLead;
  }

  enterCardPlay(position: Position, card: Card): void {
    if (position !== this.currentPlayer) throw new Error(`It is ${positionToChar(this.currentPlayer)}'s turn`);
    const owner = this.players[position].removeCard(card);
    if (!owner) throw new Error(`${card.name} is not held by ${positionToChar(position)}`);
    if (this.cardsPlayedInRound === 0) this.suitLed = card.suit;
    if (this.cardsPlayedInRound > 0 &&
      card.suit !== this.suitLed &&
      this.players[position].hand.getSuitLength(this.suitLed as Suit) > 0) {
      throw new Error('You must follow suit');
    }
    this.currentTrick[position] = card;
    this.cardsPlayedInRound++;
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
      if (winningCard.suit !== contractSuit && card.suit === contractSuit) {
        winner = position as Position;
        winningCard = card;
      } else if (card.suit === winningCard.suit && card.faceValue > winningCard.faceValue) {
        winner = position as Position;
        winningCard = card;
      }
    }
    this.trickWinners.push(winner);
    const winnerTeam = winner === Position.South || winner === Position.North
      ? 0
      : 1;
    this.tricksWon[winnerTeam]++;
    this.tricksPlayed++;
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
    this.beginRound();
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
    const hand = this.players[position].hand;
    if (this.cardsPlayedInRound === 0) {
      for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
        const cards = hand.getCardsInSuit(suit as Suit);
        if (cards.length > 0) return cards[0];
      }
    }
    const led = this.suitLed;
    if (led !== -1) {
      const following = hand.getCardsInSuit(led as Suit);
      if (following.length > 0) return following[0];
    }
    let lowest: Card | null = null;
    for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
      const cards = hand.getCardsInSuit(suit as Suit);
      if (cards.length > 0) {
        lowest = cards[cards.length - 1];
        break;
      }
    }
    if (!lowest) throw new Error(`Player ${positionToChar(position)} has no cards`);
    return lowest;
  }

  updateDuplicateScore(): void {
    const team = this.contractTeam;
    const required = bidLevel(this.contract) + 6;
    const teamIndex = team === Team.NorthSouth ? 0 : 1;
    const made = this.tricksWon[teamIndex];
    if (made >= required) {
      const suit = bidSuit(this.contract);
      let points = suit === Suit.NoTrump
        ? 40 + (bidLevel(this.contract) - 1) * 30
        : bidLevel(this.contract) * (suit === Suit.Clubs || suit === Suit.Diamonds ? 20 : 30);
      if (this.contractModifier === 1) points *= 2;
      if (this.contractModifier === 2) points *= 4;
      this.northSouthScore = team === Team.NorthSouth ? points : 0;
      this.eastWestScore = team === Team.EastWest ? points : 0;
    } else {
      const short = required - made;
      const vulnerable = this.isTeamVulnerable(team);
      const points = short * (vulnerable ? 100 : 50);
      if (team === Team.NorthSouth) this.eastWestScore = points;
      else this.northSouthScore = points;
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
    const formatSuitLine = (holding: string) => holding.split('.').map(suit => suit ? ` ${suit.split('').join(' ')}` : '').join('\n');
    void formatSuitLine;
    const split = (holding: string) => holding.split('.');
    const ns = split(north);
    const ws = split(west);
    const es = split(east);
    const ss = split(south);
    return [
      '{',
      `                S: ${ns[0].split('').join(' ')}`,
      `                H: ${ns[1].split('').join(' ')}`,
      `                D: ${ns[2].split('').join(' ')}`,
      `                C: ${ns[3].split('').join(' ')}`,
      `S: ${ws[0].split('').join(' ')}                    S: ${es[0].split('').join(' ')}`,
      `H: ${ws[1].split('').join(' ')}                    H: ${es[1].split('').join(' ')}`,
      `D: ${ws[2].split('').join(' ')}                    D: ${es[2].split('').join(' ')}`,
      `C: ${ws[3].split('').join(' ')}                    C: ${es[3].split('').join(' ')}`,
      `                S: ${ss[0].split('').join(' ')}`,
      `                H: ${ss[1].split('').join(' ')}`,
      `                D: ${ss[2].split('').join(' ')}`,
      `                C: ${ss[3].split('').join(' ')}`,
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
