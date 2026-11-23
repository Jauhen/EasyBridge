import { Card } from './card.js';
import { Bid, Position, Suit } from './constants.js';
import { Hand } from './hand.js';
import { CardLocation } from './cardLocation.js';
import { PlayerStatus } from './playerStatus.js';
import { BidEngine } from './bidding/bidEngine.js';

export class Player {
  readonly hand = new Hand();
  readonly cardLocation = new CardLocation();
  readonly status = new PlayerStatus();
  readonly bidEngine = new BidEngine();
  private bids: number[] = [];

  constructor(readonly position: Position) {}

  clearHand(): void {
    this.hand.clear();
    this.bids = [];
    this.cardLocation.clear();
    this.status.clear();
  }

  addCard(card: Card): void {
    this.hand.add(card);
  }

  removeCard(card: Card): Card | null {
    return this.hand.remove(card);
  }

  initializeHand(): void {
    this.hand.sort();
    this.hand.initializeInitialHand();
  }

  recordBid(bid: Bid): void {
    this.bids.push(bid);
  }

  get bidsMade(): readonly number[] {
    return this.bids;
  }

  get hcp(): number {
    return this.hand.highCardPoints;
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

  makeOpeningBid(): Bid {
    // Delegates opening thresholds and convention tests to the C++-mapped
    // BiddingOpen/BidEngine behavior instead of duplicating them here.
    return this.bidEngine.makeOpeningBid(this.hand, this.position);
  }

  makeResponse(partnerBid: Bid): Bid {
    // Delegates to BiddingResponse.cpp / CBidEngine::MakeRespondingBid.
    return this.bidEngine.makeResponse(this.hand, partnerBid);
  }
}
