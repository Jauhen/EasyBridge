import { Card } from './card.js';
import { CardList } from './cardList.js';
import { Suit } from './constants.js';

export class Hand {
  readonly suits: CardList[] = [
    new CardList(),
    new CardList(),
    new CardList(),
    new CardList(),
  ];
  readonly initialHand = new CardList();
  private cards: CardList = new CardList();
  private hcp = 0;

  clear(): void {
    this.cards.clear();
    this.initialHand.clear();
    for (const suit of this.suits) suit.clear();
    this.hcp = 0;
  }

  add(card: Card, sort = true): void {
    this.cards.add(card, sort);
    this.suits[card.suit].add(card, sort);
  }

  addToInitialHand(card: Card): void {
    this.initialHand.add(card);
  }

  remove(card: Card): Card | null {
    this.suits[card.suit].remove(card);
    return this.cards.remove(card);
  }

  removeByIndex(index: number): Card | null {
    const card = this.cards.at(index);
    if (!card) return null;
    this.suits[card.suit].remove(card);
    return this.cards.remove(card);
  }

  sort(): void {
    this.cards.sort();
    for (const suit of this.suits) suit.sort();
  }

  initializeInitialHand(): void {
    this.initialHand.clear();
    for (const card of this.cards.cardsInAscendingDeckOrder) {
      this.initialHand.add(card);
    }
  }

  countPoints(force = true): number {
    if (!force && this.hcp > 0) return this.hcp;
    this.hcp = this.cards.cardsInAscendingDeckOrder.reduce(
      (sum, card) => sum + card.honorPoints,
      0,
    );
    return this.hcp;
  }

  get cardsList(): CardList {
    return this.cards;
  }

  get length(): number {
    return this.cards.length;
  }

  get highCardPoints(): number {
    return this.countPoints();
  }

  getCardsInSuit(suit: Suit): readonly Card[] {
    return this.suits[suit].cardsInAscendingDeckOrder;
  }

  getSuitLength(suit: Suit): number {
    return this.suits[suit].length;
  }

  hasCard(card: Card): boolean {
    return this.cards.has(card);
  }

  hasDeckValue(deckValue: number): boolean {
    return this.cards.hasDeckValue(deckValue);
  }

  findCard(deckValue: number): Card | null {
    return this.cards.findByDeckValue(deckValue) ?? null;
  }

  get isBalanced(): boolean {
    const lengths = [0, 1, 2, 3].map(suit => this.getSuitLength(suit as Suit)).sort((a, b) => b - a);
    return lengths[0] <= 5 && (lengths.filter(length => length === 0).length === 0);
  }

  getPbnHoldings(): string {
    return [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
      .map(suit => this.suits[suit].cardsInAscendingDeckOrder
        .map(card => card.name[1])
        .join(''))
      .join('.');
  }

  getInitialPbnHoldings(): string {
    const suits: CardList[] = [new CardList(), new CardList(), new CardList(), new CardList()];
    for (const card of this.initialHand.cardsInAscendingDeckOrder) suits[card.suit].add(card);
    return [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
      .map(suit => suits[suit].cardsInAscendingDeckOrder
        .map(card => card.name[1])
        .join(''))
      .join('.');
  }
}
