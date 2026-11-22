import { Card } from '../card.js';
import { PlayEngine } from './playEngine.js';
import { NONE, Suit } from '../constants.js';

export class DefenderPlayEngine extends PlayEngine {
  partnerSuitPreference: (Suit | typeof NONE)[] = [NONE, NONE, NONE, NONE];
  signalledSuit: Suit | typeof NONE = NONE;

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

  override chooseCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    if (ledSuit !== NONE) {
      const following = this.hand?.getCardsInSuit(ledSuit) ?? [];
      if (following.length > 0) return following[0];
    }
    return super.chooseCard(ledSuit);
  }
}
