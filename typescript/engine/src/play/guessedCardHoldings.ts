import { GuessedCard } from '../guessedCard.js';
import { NONE, isCard } from '../constants.js';

export class GuessedCardHoldings {
  protected cards: GuessedCard[] = [];
  protected sorted = false;
  protected reverseSort = false;
  protected definiteCards = 0;
  protected likelyCards = 0;
  protected playedCards = 0;
  protected remainingCards = 0;
  protected minRemainingCards = 0;
  protected maxRemainingCards = 0;
  protected originalCards = 0;
  protected minOriginalCards = 0;
  protected maxOriginalCards = 0;

  init(): void {
    this.cards = [];
    this.sorted = false;
    this.definiteCards = 0;
    this.likelyCards = 0;
    this.playedCards = 0;
    this.remainingCards = 0;
    this.minRemainingCards = 0;
    this.maxRemainingCards = 0;
    this.originalCards = 0;
    this.minOriginalCards = 0;
    this.maxOriginalCards = 0;
  }

  clear(): void {
    this.init();
  }

  add(card: GuessedCard, sort = true): void {
    const existing = this.cards.findIndex(item => item.deckValue === card.deckValue);
    if (existing >= 0) this.removeByIndex(existing);
    this.cards.push(card);
    if (sort) this.sort();

    if (card.locationIdentified) this.definiteCards++;
    else this.likelyCards++;
    if (card.wasPlayed) {
      this.playedCards++;
      this.originalCards++;
      this.remainingCards = Math.max(0, this.remainingCards - 1);
      this.minRemainingCards = Math.max(0, this.minRemainingCards - 1);
      this.maxRemainingCards = Math.max(0, this.maxRemainingCards - 1);
    } else {
      this.remainingCards++;
      this.minRemainingCards++;
      this.maxRemainingCards++;
    }
    this.minOriginalCards++;
    this.maxOriginalCards++;
  }

  merge(source: GuessedCardHoldings): void {
    for (const card of source.all) this.add(card);
  }

  removeByIndex(index: number): GuessedCard | null {
    if (index < 0 || index >= this.cards.length) return null;
    const [card] = this.cards.splice(index, 1);
    if (card.locationIdentified) this.definiteCards = Math.max(0, this.definiteCards - 1);
    else this.likelyCards = Math.max(0, this.likelyCards - 1);
    if (card.wasPlayed) {
      this.playedCards = Math.max(0, this.playedCards - 1);
      this.originalCards = Math.max(0, this.originalCards - 1);
      this.remainingCards++;
    } else {
      this.remainingCards = Math.max(0, this.remainingCards - 1);
    }
    this.minOriginalCards = Math.max(0, this.minOriginalCards - 1);
    this.maxOriginalCards = Math.max(0, this.maxOriginalCards - 1);
    return card;
  }

  removeByValue(deckValue: number): GuessedCard | null {
    return this.removeByIndex(this.getCardIndex(deckValue));
  }

  remove(card: GuessedCard): GuessedCard | null {
    return this.removeByIndex(this.cards.indexOf(card));
  }

  sort(): void {
    this.cards.sort((a, b) => this.reverseSort
      ? a.deckValue - b.deckValue
      : b.deckValue - a.deckValue);
    this.sorted = true;
  }

  reverseSortOrder(reverse: boolean): void {
    this.reverseSort = reverse;
  }

  hasCard(deckValue: number): boolean {
    return isCard(deckValue) && this.cards.some(card => card.deckValue === deckValue);
  }

  getCardIndex(deckValue: number): number {
    return this.cards.findIndex(card => card.deckValue === deckValue);
  }

  at(index: number): GuessedCard | undefined {
    return this.cards[index];
  }

  get all(): readonly GuessedCard[] {
    return this.cards;
  }

  get length(): number {
    return this.cards.length;
  }

  get topCard(): GuessedCard | null {
    return this.cards[0] ?? null;
  }

  get bottomCard(): GuessedCard | null {
    return this.cards[this.cards.length - 1] ?? null;
  }

  get holdingsString(): string {
    return this.cards.length > 0
      ? `${this.cards.map(card => card.name).join(' ')}`
      : '---';
  }

  get numDefiniteCards(): number {
    return this.definiteCards;
  }

  get numLikelyCards(): number {
    return this.likelyCards;
  }

  get numPlayedCards(): number {
    return this.playedCards;
  }

  get numRemainingCards(): number {
    return this.remainingCards;
  }

  get numOriginalCards(): number {
    return this.originalCards;
  }

  setRemainingCards(count: number): void {
    this.remainingCards = count;
    this.minRemainingCards = count;
    this.maxRemainingCards = count;
  }

  setOriginalCards(count: number): void {
    this.originalCards = count;
    this.minOriginalCards = count;
    this.maxOriginalCards = count;
  }

  get playedCardsList(): GuessedCardHoldings {
    const result = new GuessedCardHoldings();
    for (const card of this.cards.filter(item => item.wasPlayed)) result.add(card);
    return result;
  }

  get identifiedCardsList(): GuessedCardHoldings {
    const result = new GuessedCardHoldings();
    for (const card of this.cards.filter(item => item.locationIdentified)) result.add(card);
    return result;
  }

  get remainingCardsList(): GuessedCardHoldings {
    const result = new GuessedCardHoldings();
    for (const card of this.cards.filter(item => item.isOutstanding)) result.add(card);
    return result;
  }

  get isSorted(): boolean {
    return this.sorted;
  }
}
