import { Card } from './card.js';

export class CardList {
  private cards: Card[] = [];
  private reverseSort = false;

  constructor(cards: Card[] = []) {
    for (const card of cards) this.add(card);
  }

  get length(): number {
    return this.cards.length;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  get holdingsString(): string {
    return this.cards.length === 0 ? '---' : this.cards.map(card => card.name).join(' ');
  }

  get cardsInAscendingDeckOrder(): readonly Card[] {
    return [...this.cards];
  }

  add(card: Card, sort = true): void {
    if (this.cards.some(existing => existing.deckValue === card.deckValue)) {
      throw new Error(`Duplicate card ${card.name}`);
    }
    this.cards.push(card);
    if (sort) this.sort();
  }

  merge(source: CardList): void {
    for (const card of source.cardsInAscendingDeckOrder) this.add(card);
  }

  clear(): void {
    this.cards = [];
  }

  sort(): void {
    this.cards.sort((a, b) => {
      if (this.reverseSort) return a.deckValue - b.deckValue;
      return b.deckValue - a.deckValue;
    });
  }

  reverseSortOrder(reverse = true): void {
    this.reverseSort = reverse;
  }

  removeByIndex(index: number): Card | null {
    if (index < 0 || index >= this.cards.length) return null;
    return this.cards.splice(index, 1)[0] ?? null;
  }

  removeByDeckValue(deckValue: number): Card | null {
    const index = this.cards.findIndex(card => card.deckValue === deckValue);
    return index === -1 ? null : this.removeByIndex(index);
  }

  remove(card: Card): Card | null {
    return this.removeByDeckValue(card.deckValue);
  }

  at(index: number): Card | undefined {
    return this.cards[index];
  }

  findByDeckValue(deckValue: number): Card | undefined {
    return this.cards.find(card => card.deckValue === deckValue);
  }

  findBySuitAndFace(suit: number, faceValue: number): Card | undefined {
    return this.cards.find(card => card.suit === suit && card.faceValue === faceValue);
  }

  hasDeckValue(deckValue: number): boolean {
    return this.findByDeckValue(deckValue) !== undefined;
  }

  has(card: Card): boolean {
    return this.hasDeckValue(card.deckValue);
  }

  get topCard(): Card | null {
    return this.cards[0] ?? null;
  }

  get bottomCard(): Card | null {
    return this.cards[this.cards.length - 1] ?? null;
  }

  getNumCardsAbove(faceValue: number): number {
    return this.cards.filter(card => card.faceValue > faceValue).length;
  }

  getNumCardsBelow(faceValue: number): number {
    return this.cards.filter(card => card.faceValue < faceValue).length;
  }

  equals(other: CardList): boolean {
    if (this.cards.length !== other.length) return false;
    return this.cards.every((card, index) =>
      card.deckValue === other.at(index)?.deckValue,
    );
  }
}
