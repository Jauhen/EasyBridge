import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { NONE, Suit } from '../constants.js';

export class SuitHoldings extends CardList {
  private suitValue: Suit = NONE as Suit;
  private rankValue = NONE;
  private strengthValue = 0;
  private quickTricksValue = 0;
  private likelyWinners = 0;
  private likelyLosers = 0;

  setSuit(suit: Suit): void {
    this.suitValue = suit;
  }

  get suit(): Suit {
    return this.suitValue;
  }

  setRank(rank: number): void {
    this.rankValue = rank;
  }

  get rank(): number {
    return this.rankValue;
  }

  setStrength(strength: number): void {
    this.strengthValue = strength;
  }

  get strength(): number {
    return this.strengthValue;
  }

  get lengthInSuit(): number {
    return this.length;
  }

  get isVoid(): boolean {
    return this.length === 0;
  }

  get isSingleton(): boolean {
    return this.length === 1;
  }

  get isDoubleton(): boolean {
    return this.length === 2;
  }

  hasAce(): boolean {
    return this.cardsInAscendingDeckOrder.some(card => card.faceValue === 14);
  }

  hasKing(): boolean {
    return this.cardsInAscendingDeckOrder.some(card => card.faceValue === 13);
  }

  get hcp(): number {
    return this.cardsInAscendingDeckOrder.reduce((sum, card) => sum + card.honorPoints, 0);
  }

  get quickTricks(): number {
    return this.quickTricksValue;
  }

  setQuickTricks(value: number): void {
    this.quickTricksValue = value;
  }

  get likelyWinnerCount(): number {
    return this.likelyWinners;
  }

  setLikelyWinnerCount(value: number): void {
    this.likelyWinners = value;
  }

  get likelyLoserCount(): number {
    return this.likelyLosers;
  }

  setLikelyLoserCount(value: number): void {
    this.likelyLosers = value;
  }

  get compressedHoldings(): string {
    return this.length === 0
      ? 'void'
      : this.cardsInAscendingDeckOrder.map(card => card.name[1]).join('');
  }

  addCard(card: Card): void {
    this.add(card);
  }
}
