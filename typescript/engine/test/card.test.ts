import { describe, expect, it } from 'vitest';
import { Card, CardList, Deck, Suit } from '../src/index.js';

describe('Card', () => {
  it('maps suits and face values to and from deck values', () => {
    const card = Card.fromDeckValue(50);
    expect(card.suit).toBe(Suit.Spades);
    expect(card.faceValue).toBe(13);
    expect(card.name).toBe('SK');
  });

  it('keeps sorted card lists descending by deck value', () => {
    const list = new CardList([
      new Card(Suit.Hearts, 2),
      new Card(Suit.Hearts, 14),
      new Card(Suit.Hearts, 11),
    ]);
    expect(list.at(0)?.name).toBe('HA');
    expect(list.at(1)?.name).toBe('HJ');
  });

  it('creates a 52-card deck', () => {
    const deck = new Deck();
    deck.initializeCards();
    expect(deck.cards).toHaveLength(52);
  });
});
