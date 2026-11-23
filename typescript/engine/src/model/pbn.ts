import { Card } from '../card.js';
import { charToFaceValue, charToPosition, charToSuit, Position, Suit } from '../constants.js';

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

export interface PbnDocument {
  tags: Record<string, string>;
  comments: string[];
  auction: number[];
  auctionNotes: Map<number, number>;
  playNotes: Map<number, number>;
  nags: number[];
  plays: Array<Position[] | null>;
  playCards: Card[][];
}

export function parseBidPbn(value: string): number | null {
  const normalized = value.trim();
  if (/^pass$/i.test(normalized)) return 0;
  if (/^x$/i.test(normalized)) return 36;
  if (/^xx$/i.test(normalized)) return 37;
  const match = /^([1-7])(C|D|H|S|NT)$/i.exec(normalized);
  if (!match) return null;
  const level = Number(match[1]);
  const suit = charToSuit(match[2].replace('NT', 'N'));
  return 1 + (level - 1) * 5 + suit;
}

export function parsePbnDocument(source: string): PbnDocument {
  const tags: Record<string, string> = {};
  const previousTags: Record<string, string> = {};
  const comments: string[] = [];
  const auction: number[] = [];
  const auctionNotes = new Map<number, number>();
  const playNotes = new Map<number, number>();
  const nags: number[] = [];
  const plays: Array<Position[] | null> = [];
  const playCards: Card[][] = [];
  let auctionTag = false;
  let playTag = false;
  let auctionPosition: Position | null = null;
  let playPosition: Position | null = null;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('%%')) {
      comments.push(line.replace(/^%%\s*/, '').trim());
      continue;
    }
    const tagMatch = /^\[([A-Za-z]+)\s+"(.*)"\]\s*$/.exec(line);
    if (tagMatch) {
      const [, name, value] = tagMatch;
      const tagName = name.toUpperCase();
      if (value === '#' && previousTags[tagName] !== undefined) {
        tags[tagName] = previousTags[tagName];
      } else {
        tags[tagName] = value;
        previousTags[tagName] = value;
      }
      if (name.toUpperCase() === 'AUCTION') {
        auctionTag = true;
        playTag = false;
        auctionPosition = charToPosition(value);
      } else if (name.toUpperCase() === 'PLAY') {
        auctionTag = false;
        playTag = true;
        playPosition = charToPosition(value);
      } else {
        auctionTag = false;
        playTag = false;
      }
      continue;
    }

    if (auctionTag) {
      let auctionIndex = auction.length;
      for (const token of line.split(/\s+/)) {
        if (/^\$\d+$/.test(token)) {
          nags.push(Number(token.slice(1)));
          continue;
        }
        if (/^=\d+$/.test(token)) {
          auctionNotes.set(auctionIndex, Number(token.slice(1)));
          continue;
        }
        const bid = parseBidPbn(token);
        if (bid !== null) {
          auction.push(bid);
          auctionIndex = auction.length;
        }
      }
      continue;
    }

    if (playTag && playPosition !== null) {
      const trick: Position[] = [];
      const cards: Card[] = [];
      const tokens = line.split(/\s+/).filter(Boolean);
      let playIndex = playCards.reduce((sum, trickCards) => sum + trickCards.length, 0);
      for (let index = 0; index < 4; index++) {
        const position = ((playPosition + index) % 4) as Position;
        trick.push(position);
        const token = tokens[index];
        if (!token) continue;
        if (/^\$\d+$/.test(token)) {
          nags.push(Number(token.slice(1)));
          continue;
        }
        if (/^=\d+$/.test(token)) {
          playNotes.set(playIndex, Number(token.slice(1)));
          continue;
        }
        if (token === '-') continue;
        const suitLetter = token[0].toUpperCase();
        const faceLetter = token.slice(1).toUpperCase();
        const suit = charToSuit(suitLetter);
        const face = charToFaceValue(faceLetter);
        if (suit >= Suit.Clubs && suit <= Suit.Spades && face >= 2 && face <= 14) {
          cards.push(new Card(suit, face));
        }
        playIndex++;
      }
      plays.push(trick);
      playCards.push(cards);
    }
  }

  const deal = tags.DEAL ? parsePbnDealTag(tags.DEAL) : null;
  if (deal) {
    tags.HANDS = deal.map(hand => hand.map(card => card.name).join('')).join('|');
  }
  return { tags, comments, auction, auctionNotes, playNotes, nags, plays, playCards };
}
