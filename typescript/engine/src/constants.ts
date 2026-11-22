export enum Suit {
  Clubs = 0,
  Diamonds = 1,
  Hearts = 2,
  Spades = 3,
  NoTrump = 4,
}

export enum Position {
  South = 0,
  West = 1,
  North = 2,
  East = 3,
}

export enum Team {
  Neither = -1,
  NorthSouth = 0,
  EastWest = 1,
  Both = 2,
}

export enum Vulnerability {
  None = 0,
  NorthSouth = 1,
  EastWest = 2,
  Both = 3,
}

export const NONE = -1;
export const TEN = 10;
export const JACK = 11;
export const QUEEN = 12;
export const KING = 13;
export const ACE = 14;

export enum Bid {
  Pass = 0,
  C1 = 1,
  D1 = 2,
  H1 = 3,
  S1 = 4,
  NT1 = 5,
  C2 = 6,
  D2 = 7,
  H2 = 8,
  S2 = 9,
  NT2 = 10,
  C3 = 11,
  D3 = 12,
  H3 = 13,
  S3 = 14,
  NT3 = 15,
  C4 = 16,
  D4 = 17,
  H4 = 18,
  S4 = 19,
  NT4 = 20,
  C5 = 21,
  D5 = 22,
  H5 = 23,
  S5 = 24,
  NT5 = 25,
  C6 = 26,
  D6 = 27,
  H6 = 28,
  S6 = 29,
  NT6 = 30,
  C7 = 31,
  D7 = 32,
  H7 = 33,
  S7 = 34,
  NT7 = 35,
  Double = 36,
  Redouble = 37,
}

export function isSuit(value: number): value is Suit {
  return value >= Suit.Clubs && value <= Suit.Spades;
}

export function isPosition(value: number): value is Position {
  return value >= Position.South && value <= Position.East;
}

export function isBid(value: number): boolean {
  return value >= Bid.C1 && value <= Bid.NT7;
}

export function isCard(deckValue: number): boolean {
  return deckValue >= 0 && deckValue <= 51;
}

export function cardSuit(deckValue: number): Suit {
  return Math.floor(deckValue / 13) as Suit;
}

export function faceValue(deckValue: number): number {
  return (deckValue % 13) + 2;
}

export function makeDeckValue(suit: Suit, value: number): number {
  return suit * 13 + value - 2;
}

export function bidSuit(bid: number): Suit | -1 {
  if (bid <= Bid.Pass || bid >= Bid.Double) return -1;
  return ((bid - 1) % 5) as Suit;
}

export function bidLevel(bid: number): number {
  if (bid <= Bid.Pass || bid >= Bid.Double) return -1;
  return Math.floor((bid - 1) / 5) + 1;
}

export function makeBid(suit: Suit, level: number): Bid {
  return (Bid.Pass + (level - 1) * 5 + suit + 1) as Bid;
}

export function nextPosition(position: Position): Position {
  return ((position + 1) % 4) as Position;
}

export function prevPosition(position: Position): Position {
  return ((position + 3) % 4) as Position;
}

export function partnerPosition(position: Position): Position {
  return ((position + 2) % 4) as Position;
}

export function positionToChar(position: Position): string {
  return ['S', 'W', 'N', 'E'][position] ?? '?';
}

export function charToPosition(value: string): Position {
  const index = ['S', 'W', 'N', 'E'].indexOf(value.toUpperCase());
  return index === -1 ? (NONE as Position) : (index as Position);
}

export function suitToChar(suit: Suit): string {
  return ['C', 'D', 'H', 'S', 'N'][suit] ?? '?';
}

export function charToSuit(value: string): Suit {
  const index = ['C', 'D', 'H', 'S', 'N'].indexOf(value.toUpperCase());
  return index === -1 ? (NONE as Suit) : (index as Suit);
}

export function faceValueToChar(value: number): string {
  if (value >= 2 && value <= 9) return String(value);
  return ({ 10: 'T', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[value] ?? '?';
}

export function charToFaceValue(value: string): number {
  const upper = value.toUpperCase();
  if (/^\d$/.test(upper)) return Number(upper);
  return ({ T: TEN, J: JACK, Q: QUEEN, K: KING, A: ACE } as Record<string, number>)[upper] ?? NONE;
}

export function bidToPbn(bid: number): string {
  if (bid === Bid.Pass) return 'Pass';
  if (bid === Bid.Double) return 'X';
  if (bid === Bid.Redouble) return 'XX';
  if (!isBid(bid)) return '??';
  const suit = bidSuit(bid);
  const level = bidLevel(bid);
  return suit === Suit.NoTrump ? `${level}NT` : `${level}${suitToChar(suit as Suit)}`;
}

export function contractToPbn(contract: number, modifier = 0): string {
  if (!isBid(contract)) return '?';
  const suffix = modifier === 1 ? ' X' : modifier === 2 ? ' XX' : '';
  const suit = bidSuit(contract);
  const level = bidLevel(contract);
  return `${level}${suit === Suit.NoTrump ? 'NT' : suitToChar(suit as Suit)}${suffix}`;
}
