import { Card } from './card.js';
import { isCard } from './constants.js';
import { GuessedCard } from './guessedCard.js';

export class CardLocation {
  private readonly cards: GuessedCard[];

  constructor() {
    this.cards = Array.from({ length: 52 }, (_, deckValue) =>
      new GuessedCard(Card.fromDeckValue(deckValue)),
    );
  }

  clear(): void {
    for (const card of this.cards) card.clear();
  }

  at(deckValue: number): GuessedCard {
    if (!isCard(deckValue)) throw new RangeError(`Invalid deck value ${deckValue}`);
    return this.cards[deckValue];
  }

  get all(): readonly GuessedCard[] {
    return this.cards;
  }
}
