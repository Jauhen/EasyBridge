import { Card } from './card.js';
import { Suit } from './constants.js';

export class Deck {
  private readonly orderedCards: Card[];
  private shuffledCards: Card[] = [];

  constructor() {
    const cards: Card[] = [];
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      for (let face = 2; face <= 14; face++) {
        cards.push(new Card(suit as Suit, face));
      }
    }
    this.orderedCards = cards;
    this.shuffledCards = [...cards];
  }

  initializeCards(): void {
    this.shuffledCards = [...this.orderedCards];
  }

  clear(): void {
    this.shuffledCards = [...this.orderedCards];
  }

  get cards(): readonly Card[] {
    return this.shuffledCards;
  }

  getCard(deckValue: number): Card | null {
    if (deckValue < 0 || deckValue > 51) return null;
    return this.orderedCards[deckValue] ?? null;
  }

  getCardByName(name: string): Card | null {
    const upper = name.trim().toUpperCase();
    if (!/^[CDHS][2-9TJQKA]$/.test(upper)) return null;
    const suit = ({ C: Suit.Clubs, D: Suit.Diamonds, H: Suit.Hearts, S: Suit.Spades } as Record<string, Suit>)[upper[0]];
    const face = ({ T: 10, J: 11, Q: 12, K: 13, A: 14 } as Record<string, number>)[upper[1]] ??
      Number(upper[1]);
    return this.getCard(suit * 13 + face - 2);
  }

  shuffle(seed: number | undefined = undefined): number {
    this.initializeCards();
    const actualSeed = seed === undefined || seed === 0
      ? Math.floor(Math.random() * 0x7ffffff)
      : seed;
    let state = actualSeed >>> 0;
    // Mirrors Visual C++'s srand/rand implementation used by CDeck::Shuffle:
    // rand() is 15-bit and advances with state = state * 214013 + 2531011.
    const rand = (): number => {
      state = (Math.imul(state, 214013) + 2531011) >>> 0;
      return (state >>> 16) & 0x7fff;
    };
    const getRandomValue = (max: number): number => {
      const value = ((rand() / 32768) * (max + 1) - 0.4999);
      let rounded = Math.round(value);
      if (rounded < 0) rounded = 0;
      if (rounded > max) rounded = max;
      return rounded;
    };

    for (let round = 0; round < 10; round++) {
      for (let index = 0; index < 52; index++) {
        let other = getRandomValue(51);
        if (other === index) other = getRandomValue(51);
        [this.shuffledCards[index], this.shuffledCards[other]] =
          [this.shuffledCards[other], this.shuffledCards[index]];
      }
    }
    return actualSeed;
  }
}
