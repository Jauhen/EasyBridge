//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// Bidparams.H
//
// parms used for bidding info
//

import { Suit } from '../constants.js';

// Game / slam point defaults (from C++ Settings::c_tfDefault*Pts in settings.cpp)
export const PTS_2LEVEL = 20;
export const PTS_3LEVEL = 23;
export const PTS_4LEVEL = 26;
export const PTS_GAME = 26;
export const PTS_MAJOR_GAME = 26;
export const PTS_MINOR_GAME = 29;
export const PTS_NT_GAME = 26;
export const PTS_SLAM = 33;
export const PTS_SMALL_SLAM = 33;
export const PTS_GRAND_SLAM = 37;

// Opening/bidding points adjustment for aggressiveness
// deduct 0.5 pts for each aggressiveness tick
export function openPts(pts: number, aggressiveness = 0): number {
  return pts - aggressiveness * 0.5;
}

export function ptCount(pts: number, aggressiveness = 0): number {
  return pts - aggressiveness * 0.5;
}

export function singleRaise(bid: number): number {
  return bid + 5;
}

export function suitsTouching(suit1: Suit, suit2: Suit): boolean {
  return suit1 === suit2 + 1 || suit2 === suit1 + 1;
}

//
// codes used to convey the strength of a suit
//
export enum SuitStrength {
  Void = 0,
  None = 0,
  Unusable = 0,
  Any = 0,
  Poor = 1,
  WeakSupport = 2,
  ModerateSupport = 3,
  GoodSupport = 4,
  MarginalOpener = 4,
  Openable = 5,
  StrongSupport = 5,
  Strong = 6,
  Absolute = 7,
  Solid = 0x4000,
  SelfSupporting = 0x8000,
}

//
// codes used in raising partner or rebidding/shifting
//
export enum RaiseTarget {
  RelativeByOne = 1,
  One = 1,
  RelativeByTwo = 2,
  Two = 2,
  RelativeByThree = 3,
  Three = 3,
  RelativeByFour = 4,
  RelativeByFive = 5,
  RelativeBySix = 6,
  ToTwo = -2,
  To2 = -2,
  ToThree = -3,
  To3 = -3,
  ToFour = -4,
  To4 = -4,
  ToFive = -5,
  To5 = -5,
  ToSix = -6,
  To6 = -6,
  ToSeven = -7,
  To7 = -7,
  ToNoMoreThanGame = -9,
  ToGame = -10,
  ToSlam = -11,
}

export enum SupportLength {
  Any = 0,
  One = 1,
  Len1 = 1,
  Two = 2,
  Len2 = 2,
  Three = 3,
  Len3 = 3,
  Four = 4,
  Len4 = 4,
  Five = 5,
  Len5 = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
}

export enum SuitLength {
  Any = 0,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
}

export enum RebidTarget {
  Cheapest = 0,
  Jump1 = 1,
  Jump2 = 2,
  At1 = -1,
  At2 = -2,
  At3 = -3,
  At4 = -4,
  At5 = -5,
  At6 = -6,
  At7 = -7,
}

export enum ShiftTarget {
  Cheapest = 0,
  Jump1 = 1,
  Jump2 = 2,
}

export enum HonorsCount {
  Any = 0,
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Ace = 1,
  King = 2,
  Queen = 3,
  Jack = 4,
  Ten = 5,
  All = 5,
}

export enum StoppedCode {
  DontCare = 0,
  None = 0,
  All = 1,
  Some = 1,
  AllOther = 2,
  One = 3,
  Unbid = 4,
}

export enum RebidLevel {
  Cheapest = 0,
  ShiftCheapest = 0,
  JumpOne = 1,
  JumpTwo = 2,
  JumpThree = 3,
  JumpFour = 4,
  JumpFive = 5,
  JumpSix = 6,
  AbsoluteOne = -1,
  AbsoluteTwo = -2,
  AbsoluteThree = -3,
  AbsoluteFour = -4,
  AbsoluteFive = -5,
  AbsoluteSix = -6,
  AbsoluteSeven = -7,
}

export enum SuitType {
  Any = 0,
  Minor = 1,
  Major = 2,
  Previous = 3,
  Prev = 3,
  PreviousMajor = 4,
  PrevMajor = 4,
  PreviousMinor = 5,
  PrevMinor = 5,
  Preferred = 6,
  Direct = -10,
  Clubs = -10,
  Diamonds = -11,
  Hearts = -12,
  Spades = -13,
  NoTrump = -14,
}

export const SUIT_DIRECT = SuitType.Direct;
export const SUITS_ANY = 0;
export const SUITS_MINORS = 1;
export const SUITS_MAJORS = 2;

export function makeDirectSuit(suit: Suit): number {
  return SuitType.Direct - suit;
}

export enum StoppingLevel {
  DoNotCare = 0,
  All = 1,
  AllOther = 2,
  One = 3,
  Unbid = 4,
}

// codes used for type of opening desired
export const OT_ANY = 0;
export const OT_OPENER = 1;
export const OT_STRONG = 2;
export const OT_ABSOLUTE = 3;

// codes used to indicate next intended bid
export const NIB_NONE = 0;
export const NIB_NT = 5;
export const NIB_JUMP_NT = 10;

// codes used to categorize cards
export const CV_LOSER = 0;
export const CV_PROBABLE = 1;
export const CV_WINNER = 2;

// codes used for selecting superior suits
export const SP_NONE = 0;
export const SP_FIRST = 1;
export const SP_SECOND = 2;
export const SP_THIRD = 3;
export const SP_FOURTH = 4;
export const SP_LAST = 5;

// codes used for opening options
export const OB_11_HCPS_RBS_LM = 0x0001;
export const OB_11_HCPS_6CS = 0x0002;
export const OB_14_TCPS_GS = 0x0004;
export const OB_14_TCPS_LS = 0x0008;
export const OB_13_TCPS_LS = 0x0010;

// params used in determining whether a suit can be opened
export const POS_ANY = 0;
export const POS_12 = 1;
export const POS_34 = 2;
export const POS_4 = 3;

// Blackwood codes
export const BLACKWOOD_ACES = 0;
export const BLACKWOOD_KINGS = 1;

export function suitStrengthMinimum(suit: Suit, strength: SuitStrength): boolean {
  void suit;
  return strength >= SuitStrength.MarginalOpener;
}
