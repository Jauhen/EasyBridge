import { NONE, Suit } from '../constants.js';
import { GuessedCard } from '../guessedCard.js';
import { GuessedCardHoldings } from './guessedCardHoldings.js';

export class GuessedSuitHoldings extends GuessedCardHoldings {
  suit: Suit = NONE as Suit;
  private shownOut = false;
  private suitWasVoid = false;
  private allCardsIdentified = false;

  setSuit(suit: Suit): void {
    this.suit = suit;
  }

  init(): void {
    super.init();
    this.shownOut = false;
    this.suitWasVoid = false;
    this.allCardsIdentified = false;
  }

  get holdingsString(): string {
    return this.cards.length > 0
      ? this.cards.map(card => card.card.name[1]).join('')
      : '---';
  }

  markSuitShownOut(shownOut = true): void {
    if (this.shownOut === shownOut) return;
    this.shownOut = shownOut;
    if (this.numPlayedCards === 0) this.suitWasVoid = true;
    this.cards = this.cards.filter(card => card.wasPlayed);
    this.likelyCards = 0;
    this.remainingCards = 0;
    this.minRemainingCards = 0;
    this.maxRemainingCards = 0;
    this.originalCards = this.playedCards;
    this.minOriginalCards = this.playedCards;
    this.maxOriginalCards = this.playedCards;
    this.allCardsIdentified = true;
  }

  get isSuitShownOut(): boolean {
    return this.shownOut;
  }

  markSuitVoid(suitWasVoid = true): void {
    this.suitWasVoid = suitWasVoid;
  }

  get wasSuitVoid(): boolean {
    return this.suitWasVoid;
  }

  markAllCardsIdentified(allCardsIdentified = true): void {
    this.allCardsIdentified = allCardsIdentified;
  }

  get areAllCardsIdentified(): boolean {
    return this.allCardsIdentified;
  }

  override removeByIndex(index: number): GuessedCard | null {
    const card = super.removeByIndex(index);
    if (card?.wasPlayed && this.shownOut) this.shownOut = false;
    return card;
  }

  override get numRemainingCards(): number {
    if (this.allCardsIdentified) {
      return Math.max(0, this.originalCards - this.playedCards);
    }
    return NONE;
  }
}
