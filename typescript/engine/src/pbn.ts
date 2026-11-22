import { Card } from './card.js';
import { charToFaceValue, charToSuit, Position, positionToChar, Suit } from './constants.js';

export interface PbnDealInput {
  dealer: Position;
  vulnerability: string;
  hands: readonly (readonly string[])[];
  auction: readonly number[];
  declarer: Position;
  contract: number;
  contractModifier: number;
  result: number;
  plays: readonly (readonly (Card | null)[])[];
}

export function parsePbnDealTag(value: string): Card[][] {
  const colon = value.indexOf(':');
  if (colon === -1) throw new Error('PBN DEAL tag must contain W:...');
  const northEastSouth = value.slice(colon + 1).trim().split(/\s+/);
  if (northEastSouth.length !== 4) throw new Error('PBN DEAL tag must contain four hands');

  const hands = northEastSouth.map(parsePbnHand);
  return hands.map(hand => hand);
}

export function parsePbnHand(value: string): Card[] {
  const parts = value.split('.');
  if (parts.length !== 4) throw new Error(`Invalid PBN hand: ${value}`);
  const cards: Card[] = [];
  const suitOrder = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
  for (let index = 0; index < suitOrder.length; index++) {
    const suit = suitOrder[index];
    for (const letter of parts[index]) {
      const face = charToFaceValue(letter);
      const parsedSuit = charToSuit(['S', 'H', 'D', 'C'][index]);
      if (face < 2 || parsedSuit !== suit) throw new Error(`Invalid PBN card ${letter}${['S', 'H', 'D', 'C'][index]}`);
      cards.push(new Card(suit, face));
    }
  }
  return cards;
}
