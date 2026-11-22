import { NONE, Suit } from '../constants.js';
import { GuessedCard } from '../guessedCard.js';
import { GuessedCardHoldings } from './guessedCardHoldings.js';
import { GuessedSuitHoldings } from './guessedSuitHoldings.js';
import { Hand } from '../hand.js';
import { Position } from '../constants.js';

export class GuessedHandHoldings extends GuessedCardHoldings {
  readonly suits: GuessedSuitHoldings[] = [
    new GuessedSuitHoldings(),
    new GuessedSuitHoldings(),
    new GuessedSuitHoldings(),
    new GuessedSuitHoldings(),
  ];
  private allCardsIdentified = false;

  constructor() {
    super();
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      this.suits[suit].setSuit(suit as Suit);
    }
  }

  init(): void {
    super.init();
    for (const suit of this.suits) suit.init();
    this.allCardsIdentified = false;
  }

  clear(): void {
    this.init();
  }

  initNewHand(hand: Hand, position: Position): void {
    for (const card of hand.cardsList.cardsInAscendingDeckOrder) {
      this.add(new GuessedCard(card, {
        outstanding: true,
        location: position,
        fixProbability: 1,
      }));
    }
  }

  override add(card: GuessedCard, sort = true): void {
    super.add(card, sort);
    this.suits[card.suit].add(card, sort);
  }

  override removeByIndex(index: number): GuessedCard | null {
    const card = super.removeByIndex(index);
    if (card) this.suits[card.suit].remove(card);
    return card;
  }

  getSuit(suit: Suit): GuessedSuitHoldings {
    if (suit < Suit.Clubs || suit > Suit.Spades) throw new RangeError('Invalid suit');
    return this.suits[suit];
  }

  markSuitShownOut(suit: Suit, shownOut = true): void {
    this.suits[suit].markSuitShownOut(shownOut);
  }

  isSuitShownOut(suit: Suit): boolean {
    return this.suits[suit].isSuitShownOut;
  }

  wasSuitVoid(suit: Suit): boolean {
    return this.suits[suit].wasSuitVoid;
  }

  markAllCardsIdentified(allCardsIdentified = true): void {
    this.allCardsIdentified = allCardsIdentified;
  }

  get areAllCardsIdentified(): boolean {
    return this.allCardsIdentified;
  }

  get numSuitsFullyIdentified(): number {
    return this.suits.filter(suit => suit.areAllCardsIdentified).length;
  }

  override get holdingsString(): string {
    return `S:${this.suits[Suit.Spades].holdingsString}  H:${this.suits[Suit.Hearts].holdingsString}  D:${this.suits[Suit.Diamonds].holdingsString}  C:${this.suits[Suit.Clubs].holdingsString}`;
  }

  get topCard(): GuessedCard | null {
    return super.topCard;
  }
}
