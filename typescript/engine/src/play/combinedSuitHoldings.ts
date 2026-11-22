import { Card } from '../card.js';
import { NONE, Suit } from '../constants.js';
import { SuitHoldings } from './suitHoldings.js';

export class CombinedSuitHoldings extends SuitHoldings {
  readonly declarerCards = new SuitHoldings();
  readonly dummyCards = new SuitHoldings();
  private declarerEntries = 0;
  private dummyEntryCount = 0;

  setSuit(suit: Suit): void {
    super.setSuit(suit);
    this.declarerCards.setSuit(suit);
    this.dummyCards.setSuit(suit);
  }

  clear(): void {
    super.clear();
    this.declarerCards.clear();
    this.dummyCards.clear();
    this.declarerEntries = 0;
    this.dummyEntryCount = 0;
  }

  addFromSource(card: Card, fromDeclarer: boolean, sort = true): void {
    super.add(card, sort);
    if (fromDeclarer) this.declarerCards.add(card, sort);
    else this.dummyCards.add(card, sort);
  }

  removeFromSource(card: Card, fromDeclarer: boolean): Card | null {
    super.remove(card);
    if (fromDeclarer) this.declarerCards.remove(card);
    else this.dummyCards.remove(card);
    return card;
  }

  get declarerLength(): number {
    return this.declarerCards.length;
  }

  get dummyLength(): number {
    return this.dummyCards.length;
  }

  get minLength(): number {
    return Math.min(this.declarerLength, this.dummyLength);
  }

  get maxLength(): number {
    return Math.max(this.declarerLength, this.dummyLength);
  }

  get lengthDifference(): number {
    return this.declarerLength - this.dummyLength;
  }

  get declaredEntries(): number {
    return this.declarerEntries;
  }

  setDeclarerEntries(count: number): void {
    this.declarerEntries = count;
  }

  get dummyEntries(): number {
    return this.dummyEntryCount;
  }

  setDummyEntries(count: number): void {
    this.dummyEntryCount = count;
  }

  get outstandingCardCount(): number {
    return this.length;
  }

  get holdingsDescription(): string {
    const dummy = this.dummyCards.cardsInAscendingDeckOrder.map(card => card.name[1]).join('');
    const declarer = this.declarerCards.cardsInAscendingDeckOrder.map(card => card.name[1]).join('');
    const combined = this.cardsInAscendingDeckOrder.map(card => card.name[1]).join('');
    return combined.length > 0 ? `${combined} (${dummy}/${declarer})` : '---';
  }
}
