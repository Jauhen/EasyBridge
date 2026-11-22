import { Card } from './card.js';
import { Bid, Position, Suit } from './constants.js';
import { Hand } from './hand.js';

export class Player {
  readonly hand = new Hand();
  private bids: number[] = [];

  constructor(readonly position: Position) {}

  clearHand(): void {
    this.hand.clear();
    this.bids = [];
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
    if (this.hcp < 12) return Bid.Pass;
    if (this.hcp >= 15 && this.hcp <= 17 && this.hand.isBalanced) {
      return Bid.NT1;
    }
    const suit = this.longestSuit;
    if (suit === Suit.NoTrump) return Bid.Pass;
    const openingBySuit: Partial<Record<Suit, Bid>> = {
      [Suit.Clubs]: Bid.C1,
      [Suit.Diamonds]: Bid.D1,
      [Suit.Hearts]: Bid.H1,
      [Suit.Spades]: Bid.S1,
    };
    return openingBySuit[suit] ?? Bid.Pass;
  }

  makeResponse(partnerBid: Bid): Bid {
    if (partnerBid === Bid.NT1) {
      if (this.hcp >= 10) return Bid.NT3;
      if (this.hcp >= 8) return Bid.NT2;
      return Bid.Pass;
    }
    if (this.hcp >= 6) {
      const suit = this.longestSuit;
      if (this.hand.getSuitLength(suit) >= 4) {
        const responseBySuit: Partial<Record<Suit, Bid>> = {
          [Suit.Clubs]: Bid.C2,
          [Suit.Diamonds]: Bid.D2,
          [Suit.Hearts]: Bid.H2,
          [Suit.Spades]: Bid.S2,
        };
        return responseBySuit[suit] ?? Bid.Pass;
      }
    }
    return Bid.Pass;
  }
}
