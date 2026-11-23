//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// card_constants.h -> constants.ts
//

// limits
export const MAX_CARDBACKS = 32;
// const MAXHOLDING = 13;
export const MAXHOLDING = 26;

// commonly used values
export const NONE = -1;

// card suits
export enum Suit {
  Any = -1,
  Clubs = 0,
  Diamonds = 1,
  Hearts = 2,
  Spades = 3,
  NoTrump = 4,
}

// majors vs. minors selection
export const SUITS_ANY = 0;
export const SUITS_MINORS = 1;
export const SUITS_MAJORS = 2;

// honor card values
export const TEN = 10;
export const JACK = 11;
export const QUEEN = 12;
export const KING = 13;
export const ACE = 14;

// positions
export enum Position {
  Unknown = -1,
  South = 0,
  West = 1,
  North = 2,
  East = 3,
  Table = 4,
}
export const ANY_POS = Position.Unknown;

// teams
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

// bids
export enum Bid {
  None = -1,
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

// string and character tables from card_constants.h
export const POSITION_NAMES: readonly string[] = ['South', 'West', 'North', 'East'];
export const POSITION_NAMES_SHORT: readonly string[] = ['Sou.', 'West', 'Nor.', 'East'];
export const TEAM_NAMES: readonly string[] = ['North/South', 'East/West', 'Both', 'Neither'];
export const TEAM_NAMES_BRIEF: readonly string[] = ['N/S', 'E/W', 'Both', 'Neither'];
export const CARD_NAMES: readonly string[] = [
  '',
  '',
  'Deuce',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Jack',
  'Queen',
  'King',
  'Ace',
];
export const SUIT_NAMES: readonly string[] = ['Clubs', 'Diamonds', 'Hearts', 'Spades', 'No Trump'];
export const SUIT_NAMES_SINGULAR: readonly string[] = ['Club', 'Diamond', 'Heart', 'Spade', 'No Trump'];
export const SUIT_NAMES_SHORT: readonly string[] = ['C', 'D', 'H', 'S', 'NT'];
export const FACE_VALUE_NAMES: readonly string[] = [
  '',
  '',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'Jack',
  'Queen',
  'King',
  'Ace',
];

export const SUIT_CHARS: readonly string[] = ['C', 'D', 'H', 'S', 'N'];
export const CARD_CHARS: readonly string[] = [
  ' ',
  ' ',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'J',
  'Q',
  'K',
  'A',
];
export const FACE_CARD_CHARS: readonly string[] = ['T', 'J', 'Q', 'K', 'A'];

export const NUM_DEF_CARD_BACKS = 1;

// suit / bid / card macro equivalents
export function isMajor(suit: number): boolean {
  return suit === Suit.Hearts || suit === Suit.Spades;
}

export function isMinor(suit: number): boolean {
  return suit === Suit.Clubs || suit === Suit.Diamonds;
}

export function isNoTrump(suit: number): boolean {
  return suit === Suit.NoTrump;
}

export function isSuit(value: number): value is Suit {
  return value >= Suit.Clubs && value <= Suit.Spades;
}

export function getNextSuit(suit: Suit): Suit {
  return ((suit + 1) % 4) as Suit;
}

export function isPosition(value: number): value is Position {
  return value >= Position.South && value <= Position.East;
}

export function isPlayer(value: number): value is Position {
  return isPosition(value);
}

export function isTeam(value: number): boolean {
  return value === Team.NorthSouth || value === Team.EastWest;
}

export function isBid(value: number): boolean {
  return value >= Bid.C1 && value <= Bid.NT7;
}

export function isCard(deckValue: number): boolean {
  return deckValue >= 0 && deckValue <= 51;
}

export function isDeckVal(deckValue: number): boolean {
  return isCard(deckValue);
}

export function isFaceVal(value: number): boolean {
  return value >= 2 && value <= ACE;
}

export function isHonor(value: number): boolean {
  return value >= JACK && value <= ACE;
}

export function otherMajor(suit: Suit): Suit {
  return suit === Suit.Hearts ? Suit.Spades : Suit.Hearts;
}

export function otherMinor(suit: Suit): Suit {
  return suit === Suit.Clubs ? Suit.Diamonds : Suit.Clubs;
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

export function suitName(suit: Suit): string {
  return SUIT_NAMES[suit] ?? '????';
}

export function singularSuitName(suit: Suit): string {
  return SUIT_NAMES_SINGULAR[suit] ?? '????';
}

export function faceName(value: number): string {
  return FACE_VALUE_NAMES[value] ?? '???';
}

export function positionToString(position: Position): string {
  if (!isPosition(position)) return 'Unknown';
  return POSITION_NAMES[position] ?? 'Unknown';
}

export function positionToChar(position: Position): string {
  return ['S', 'W', 'N', 'E'][position] ?? '?';
}

export function charToPosition(value: string): Position {
  const index = ['S', 'W', 'N', 'E'].indexOf(value.toUpperCase());
  return index === -1 ? (NONE as Position) : (index as Position);
}

export function suitToChar(suit: Suit): string {
  return SUIT_CHARS[suit] ?? '?';
}

export function charToSuit(value: string): Suit {
  const index = SUIT_CHARS.indexOf(value.toUpperCase());
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

//
// StringToDeckValue()
//
// return deck value (0..51) matching given string
// returns -1 if error
//
export function stringToDeckValue(input: string): number {
  const trimmed = input.trimStart();
  if (trimmed.length < 2) return -1;
  const c1 = trimmed[0].toUpperCase();
  const c2 = trimmed[1].toUpperCase();

  let nSuit = -1;
  let nValue = -1;

  if (c1 === 'C' || c1 === 'D' || c1 === 'H' || c1 === 'S') {
    // suit-number order
    nSuit = SUIT_CHARS.slice(0, 4).indexOf(c1 as 'C' | 'D' | 'H' | 'S');
    if (c2 >= '0' && c2 <= '9') {
      nValue = c2.charCodeAt(0) - '0'.charCodeAt(0);
    } else {
      const idx = FACE_CARD_CHARS.indexOf(c2);
      if (idx === -1) return -1;
      nValue = idx + 10;
    }
  } else {
    // number-suit order
    if (c1 >= '0' && c1 <= '9') {
      nValue = c1.charCodeAt(0) - '0'.charCodeAt(0);
    } else {
      const idx = FACE_CARD_CHARS.indexOf(c1);
      if (idx === -1) return -1;
      nValue = idx + 10;
    }
    nSuit = SUIT_CHARS.slice(0, 4).indexOf(c2 as 'C' | 'D' | 'H' | 'S');
    if (nSuit === -1) return -1;
  }

  // sanity check
  if (nValue < 2 || nValue > 14 || nSuit < Suit.Clubs || nSuit > Suit.Spades) {
    return -1;
  }
  return nSuit * 13 + nValue - 2;
}

export function bidToShortString(bid: number): string {
  if (bid === Bid.Pass) return 'Pass';
  if (bid === Bid.Double) return 'X';
  if (bid === Bid.Redouble) return 'XX';
  if (!isBid(bid)) return '??';
  const suit = bidSuit(bid) as Suit;
  const level = bidLevel(bid);
  return suit === Suit.NoTrump ? `${level}NT` : `${level}${suitToChar(suit)}`;
}

export function bidToFullString(bid: number): string {
  if (bid === Bid.Pass) return 'Pass';
  if (bid === Bid.Double) return 'Double';
  if (bid === Bid.Redouble) return 'Redouble';
  if (!isBid(bid)) return '????';
  const suit = bidSuit(bid) as Suit;
  const level = bidLevel(bid);
  if (suit === Suit.NoTrump) return `${level} No Trump`;
  return level === 1 ? `1 ${singularSuitName(suit)}` : `${level} ${suitName(suit)}`;
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

export function contractToFullString(contract: number, modifier = 0): string {
  if (!isBid(contract)) return '?';
  const suit = bidSuit(contract) as Suit;
  const level = bidLevel(contract);
  const suitStr = suit === Suit.NoTrump
    ? 'No Trump'
    : level === 1
      ? singularSuitName(suit)
      : suitName(suit);
  const modStr = modifier === 1 ? ' (doubled)' : modifier === 2 ? ' (redoubled)' : '';
  return `${level} ${suitStr}${modStr}`;
}
