import { Card } from '../card.js';
import { CombinedHoldings } from './combinedHoldings.js';
import { Hand } from '../hand.js';
import { PlayEngine, PlayEngineContext } from './playEngine.js';
import { NONE, Suit } from '../constants.js';

export class DeclarerPlayEngine extends PlayEngine {
  combinedHand: CombinedHoldings | null = null;
  dummyHand: Hand | null = null;

  initializeCombinedHand(dummyHand: Hand): void {
    this.dummyHand = dummyHand;
    this.combinedHand = new CombinedHoldings();
    if (this.hand) this.combinedHand.initialize(this.hand, dummyHand);
  }

  override chooseCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    if (ledSuit !== NONE && this.hand) {
      const following = this.hand.getCardsInSuit(ledSuit);
      if (following.length > 0) return following[0];
      if (this.dummyHand) {
        const dummyFollowing = this.dummyHand.getCardsInSuit(ledSuit);
        if (dummyFollowing.length > 0) return dummyFollowing[0];
      }
    }
    if (this.combinedHand) {
      for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
        const combined = this.combinedHand.getSuit(suit as Suit).cardsInAscendingDeckOrder;
        if (combined.length > 0) return combined[0];
      }
    }
    return super.chooseCard(ledSuit);
  }

  override playCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    const card = this.chooseCard(ledSuit);
    if (!card) return null;
    if (this.hand?.hasCard(card)) this.hand.remove(card);
    else this.dummyHand?.remove(card);
    return card;
  }

  override getNumClaimableTricks(): number {
    if (!this.combinedHand) return 0;
    return this.combinedHand.suits.reduce((sum, suit) =>
      sum + Math.min(suit.declarerLength, suit.dummyLength),
    0);
  }
}
