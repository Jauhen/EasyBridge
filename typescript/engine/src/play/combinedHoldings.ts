import { Card } from '../card.js';
import { CombinedSuitHoldings } from './combinedSuitHoldings.js';
import { Hand } from '../hand.js';
import { NONE, Suit } from '../constants.js';

export class CombinedHoldings {
  readonly suits: CombinedSuitHoldings[] = [
    new CombinedSuitHoldings(),
    new CombinedSuitHoldings(),
    new CombinedSuitHoldings(),
    new CombinedSuitHoldings(),
  ];
  private declarerHand: Hand | null = null;
  private dummyHand: Hand | null = null;

  constructor() {
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      this.suits[suit].setSuit(suit as Suit);
    }
  }

  initialize(declarerHand: Hand, dummyHand: Hand): void {
    this.declarerHand = declarerHand;
    this.dummyHand = dummyHand;
    this.initNewHand();
  }

  clearHand(): void {
    for (const suit of this.suits) suit.clear();
  }

  initNewHand(): void {
    this.clearHand();
    if (!this.declarerHand || !this.dummyHand) return;
    for (const card of this.declarerHand.cardsList.cardsInAscendingDeckOrder) {
      this.suits[card.suit].addFromSource(card, true);
    }
    for (const card of this.dummyHand.cardsList.cardsInAscendingDeckOrder) {
      this.suits[card.suit].addFromSource(card, false);
    }
  }

  addCard(card: Card, fromDeclarer: boolean): void {
    this.suits[card.suit].addFromSource(card, fromDeclarer);
  }

  removeCard(card: Card, fromDeclarer: boolean): Card | null {
    return this.suits[card.suit].removeFromSource(card, fromDeclarer);
  }

  getSuit(suit: Suit): CombinedSuitHoldings {
    if (suit < Suit.Clubs || suit > Suit.Spades) throw new RangeError('Invalid suit');
    return this.suits[suit];
  }

  getNumCardsInSuit(suit: Suit): number {
    return this.suits[suit].length;
  }

  getNumDeclarerCardsInSuit(suit: Suit): number {
    return this.suits[suit].declarerLength;
  }

  getNumDummyCardsInSuit(suit: Suit): number {
    return this.suits[suit].dummyLength;
  }

  hasCard(card: Card): boolean {
    return this.suits[card.suit].has(card);
  }

  containsCards(cards: readonly Card[]): boolean {
    return cards.every(card => this.hasCard(card));
  }

  containsAtLeastOne(cards: readonly Card[]): boolean {
    return cards.some(card => this.hasCard(card));
  }

  get longestSuit(): Suit {
    let longest = Suit.Clubs;
    for (let suit = Suit.Clubs + 1; suit <= Suit.Spades; suit++) {
      if (this.getNumCardsInSuit(suit as Suit) > this.getNumCardsInSuit(longest)) {
        longest = suit as Suit;
      }
    }
    return longest;
  }

  get hcp(): number {
    return this.suits.reduce((sum, suit) => sum + suit.hcp, 0);
  }
}
