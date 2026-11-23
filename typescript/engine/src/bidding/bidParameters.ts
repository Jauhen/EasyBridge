import { Suit } from '../constants.js';

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

export enum RaiseTarget {
  RelativeByOne = 1,
  RelativeByTwo = 2,
  RelativeByThree = 3,
  RelativeByFour = 4,
  RelativeByFive = 5,
  RelativeBySix = 6,
  ToTwo = -2,
  ToThree = -3,
  ToFour = -4,
  ToFive = -5,
  ToSix = -6,
  ToSeven = -7,
  ToNoMoreThanGame = -9,
  ToGame = -10,
  ToSlam = -11,
}

export enum SupportLength {
  Any = 0,
  One = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
}

export enum HonorsCount {
  Any = 0,
  Ace = 1,
  King = 2,
  Queen = 3,
  Jack = 4,
  Ten = 5,
  All = 5,
}

export enum StoppedCode {
  None = 0,
  Some = 1,
  All = 2,
}

export enum RebidLevel {
  Cheapest = 0,
  JumpOne = 1,
  JumpTwo = 2,
  JumpThree = 3,
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
  PreviousMajor = 4,
  PreviousMinor = 5,
  Preferred = 6,
  Clubs = -10,
  Diamonds = -11,
  Hearts = -12,
  Spades = -13,
  NoTrump = -14,
}

export enum StoppingLevel {
  DoNotCare = 0,
  All = 1,
  AllOther = 2,
  One = 3,
  Unbid = 4,
}

export function suitStrengthMinimum(suit: Suit, strength: SuitStrength): boolean {
  void suit;
  return strength >= SuitStrength.MarginalOpener;
}
