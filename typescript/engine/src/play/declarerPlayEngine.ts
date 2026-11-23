import { Card } from '../card.js';
import { CombinedHoldings } from './combinedHoldings.js';
import { Hand } from '../hand.js';
import { PlayEngine, PlayEngineContext } from './playEngine.js';
import { NONE, Suit } from '../constants.js';
import { PlayList } from './playList.js';
import { Cash } from './cash.js';
import { TrumpPull } from './trumpPull.js';
import { Finesse } from './finesse.js';
import { Ruff } from './ruff.js';

export class DeclarerPlayEngine extends PlayEngine {
  combinedHand: CombinedHoldings | null = null;
  dummyHand: Hand | null = null;
  readonly playPlan = new PlayList();

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

  getOutstandingCards(suit: Suit): Card[] {
    if (!this.combinedHand) return [];
    return this.combinedHand.getSuit(suit).cardsInAscendingDeckOrder as Card[];
  }

  getHighestOutstandingCard(suit: Suit): Card | null {
    return this.getOutstandingCards(suit)[0] ?? null;
  }

  addCardToCombinedHand(card: Card, fromDeclarer: boolean): void {
    this.combinedHand?.addCard(card, fromDeclarer);
  }

  removeCardFromCombinedHand(card: Card, fromDeclarer: boolean): void {
    this.combinedHand?.removeCard(card, fromDeclarer);
  }

  buildPlayPlan(trumpSuit: Suit | typeof NONE): void {
    this.playPlan.clear();
    if (!this.combinedHand) return;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      const combinedSuit = this.combinedHand.getSuit(suit as Suit);
      if (combinedSuit.length >= 5) {
        this.playPlan.append(new Cash(suit as Suit));
      }
      if (combinedSuit.length > 0 && combinedSuit.declarerLength >= 2 &&
        combinedSuit.dummyLength >= 2) {
        this.playPlan.append(new Finesse(suit as Suit));
      }
      if (trumpSuit !== NONE && combinedSuit.length > 0 &&
        suit !== trumpSuit) {
        this.playPlan.append(new Ruff(trumpSuit));
      }
    }
    if (trumpSuit !== NONE) {
      this.playPlan.append(new TrumpPull(trumpSuit));
    }
  }
}
