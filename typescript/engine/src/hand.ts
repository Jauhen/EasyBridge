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
  private shortPointsValue = 0;
  private longPointsValue = 0;
  private bonusPointsValue = 0;
  private penaltyPointsValue = 0;
  private totalPointsValue = 0;
  private balanceValueValue = 0;
  private quickTricks = 0;
  private aces = 0;
  private kings = 0;
  private queens = 0;
  private jacks = 0;
  private tens = 0;

  clear(): void {
    this.cards.clear();
    this.initialHand.clear();
    for (const suit of this.suits) suit.clear();
    this.hcp = 0;
    this.shortPointsValue = 0;
    this.longPointsValue = 0;
    this.bonusPointsValue = 0;
    this.penaltyPointsValue = 0;
    this.totalPointsValue = 0;
    this.balanceValueValue = 0;
    this.quickTricks = 0;
    this.aces = 0;
    this.kings = 0;
    this.queens = 0;
    this.jacks = 0;
    this.tens = 0;
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
    this.aces = this.cards.cardsInAscendingDeckOrder.filter(card => card.faceValue === 14).length;
    this.kings = this.cards.cardsInAscendingDeckOrder.filter(card => card.faceValue === 13).length;
    this.queens = this.cards.cardsInAscendingDeckOrder.filter(card => card.faceValue === 12).length;
    this.jacks = this.cards.cardsInAscendingDeckOrder.filter(card => card.faceValue === 11).length;
    this.tens = this.cards.cardsInAscendingDeckOrder.filter(card => card.faceValue === 10).length;

    this.longPointsValue = 0;
    this.shortPointsValue = 0;
    this.bonusPointsValue = 0;
    this.penaltyPointsValue = 0;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      const length = this.getSuitLength(suit);
      if (length >= 5) this.longPointsValue += length - 4;
      if (length === 0) this.shortPointsValue += 3;
      else if (length === 1) this.shortPointsValue += 2;
      else if (length === 2) this.shortPointsValue += 1;
    }
    if (this.aces === 0) this.penaltyPointsValue += 1;
    if (this.aces === 4) this.bonusPointsValue += 1;
    this.totalPointsValue = this.hcp + this.longPointsValue + this.bonusPointsValue - this.penaltyPointsValue;

    this.balanceValueValue = 0;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      const length = this.getSuitLength(suit);
      if (length < 3) this.balanceValueValue += 3 - length;
      else if (length > 4) this.balanceValueValue += length - 4;
    }
    if (this.numSingletons > 0) this.balanceValueValue = 3;

    this.quickTricks = this.cards.cardsInAscendingDeckOrder.reduce((sum, card) => {
      if (card.faceValue === 14) return sum + 1;
      if (card.faceValue === 13) return sum + 0.5;
      if (card.faceValue === 12) return sum + 0.25;
      return sum;
    }, 0);
    return this.totalPointsValue;
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

  get numVoids(): number {
    return [0, 1, 2, 3].filter(suit => this.getSuitLength(suit) === 0).length;
  }

  get numSingletons(): number {
    return [0, 1, 2, 3].filter(suit => this.getSuitLength(suit) === 1).length;
  }

  get numDoubletons(): number {
    return [0, 1, 2, 3].filter(suit => this.getSuitLength(suit) === 2).length;
  }

  get numAces(): number {
    this.countPoints(true);
    return this.aces;
  }

  get numKings(): number {
    this.countPoints(true);
    return this.kings;
  }

  get numQueens(): number {
    this.countPoints(true);
    return this.queens;
  }

  get numJacks(): number {
    this.countPoints(true);
    return this.jacks;
  }

  get numTens(): number {
    this.countPoints(true);
    return this.tens;
  }

  get balanceValue(): number {
    this.countPoints(true);
    return this.balanceValueValue;
  }

  get shortPoints(): number {
    this.countPoints(true);
    return this.shortPointsValue;
  }

  get longPoints(): number {
    this.countPoints(true);
    return this.longPointsValue;
  }

  get bonusPoints(): number {
    this.countPoints(true);
    return this.bonusPointsValue;
  }

  get penaltyPoints(): number {
    this.countPoints(true);
    return this.penaltyPointsValue;
  }

  get totalPoints(): number {
    this.countPoints(true);
    return this.totalPointsValue;
  }

  get numQuickTricks(): number {
    this.countPoints(true);
    return this.quickTricks;
  }

  allSuitsStopped(): boolean {
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      const cards = this.getCardsInSuit(suit);
      const hasAce = cards.some(card => card.faceValue === 14);
      const hasKing = cards.length >= 2 && cards.some(card => card.faceValue === 13);
      const hasQueen = cards.length >= 3 && cards.some(card => card.faceValue === 12);
      if (!hasAce && !hasKing && !hasQueen) return false;
    }
    return true;
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
