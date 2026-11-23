import { Card } from '../card.js';
import { PlayEngine } from './playEngine.js';
import { NONE, Suit } from '../constants.js';

export class DefenderPlayEngine extends PlayEngine {
  partnerSuitPreference: (Suit | typeof NONE)[] = [NONE, NONE, NONE, NONE];
  signalledSuit: Suit | typeof NONE = NONE;
  suitPreference: Record<Suit, number> = {
    [Suit.Clubs]: 0,
    [Suit.Diamonds]: 0,
    [Suit.Hearts]: 0,
    [Suit.Spades]: 0,
  } as Record<Suit, number>;

  reviewBiddingHistory(): void {
    // Placeholder hook for full bidding-history analysis.
  }

  findLeadCardFromPartnerPreference(): Card | null {
    for (const suit of this.partnerSuitPreference) {
      if (suit === NONE || !this.hand) continue;
      const cards = this.hand.getCardsInSuit(suit);
      if (cards.length > 0) return cards[0];
    }
    return null;
  }

  getFourthBestLeadCard(): Card | null {
    if (!this.hand) return null;
    for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
      const cards = this.hand.getCardsInSuit(suit as Suit);
      if (cards.length >= 4) return cards[3];
    }
    return null;
  }

  cashWinners(): Card | null {
    if (!this.hand) return null;
    for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
      const cards = this.hand.getCardsInSuit(suit as Suit);
      if (cards.length > 0) return cards[0];
    }
    return null;
  }

  override chooseCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    if (ledSuit !== NONE) {
      const following = this.hand?.getCardsInSuit(ledSuit) ?? [];
      if (following.length > 0) return following[0];
    }
    return super.chooseCard(ledSuit);
  }

  recordSuitPreference(suit: Suit, preference: number): void {
    this.suitPreference[suit] = preference;
  }

  getPreferredSuit(): Suit | typeof NONE {
    let preferred: Suit | typeof NONE = NONE;
    let best = -1;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      if (this.suitPreference[suit] > best) {
        best = this.suitPreference[suit];
        preferred = suit as Suit;
      }
    }
    return preferred;
  }
}
