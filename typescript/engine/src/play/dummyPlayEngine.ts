import { Card } from '../card.js';
import { Hand } from '../hand.js';
import { PlayEngine } from './playEngine.js';
import { NONE, Suit } from '../constants.js';

export class DummyPlayEngine extends PlayEngine {
  override playCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    if (!this.hand) return null;
    if (ledSuit !== NONE) {
      const following = this.hand.getCardsInSuit(ledSuit);
      if (following.length > 0) {
        const card = following[0];
        this.hand.remove(card);
        return card;
      }
    }
    return super.playCard(ledSuit);
  }

  playForSelf(ledSuit: Suit | typeof NONE = NONE): Card | null {
    return this.playCard(ledSuit);
  }
}
