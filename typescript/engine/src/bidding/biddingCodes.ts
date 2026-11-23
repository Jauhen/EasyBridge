//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// ConvCodes.h / Convention.h status & convention codes
//

export enum ConventionStatus {
  Inactive = 0,
  Invoked = 1,
  InvokedRound1 = 1,
  InvokedRound2 = 2,
  InvokedRound3 = 3,
  Responded = 10,
  RespondedRound1 = 10,
  RespondedRound2 = 11,
  Finished = -1,
  Rejected = -10,
  Subsumed = -20,
  Error = -99,
}

export enum ConventionId {
  // unique convention IDs (existing numeric values preserved for backward compatibility)
  FiveCardMajors = 101,
  Artificial2Club = 102,
  WeakTwoBids = 103,
  WeakJumpOvercalls = 104,
  StrongTwoBids = 105,
  ShutoutBids = 106,
  FourthSuitForcing = 107,
  Ogust = 108,
  Blackwood = 109,
  RKCB = 110,
  CueBids = 111,
  Gerber = 112,
  Stayman = 113,
  JacobyTransfers = 114,
  LimitRaises = 115,
  TakeoutDoubles = 116,
  NegativeDoubles = 117,
  SplinterBids = 118,
  Michaels = 119,
  UnusualNT = 120,
  Jacoby2NT = 121,
  Gambling3NT = 122,
  Drury = 123,
  Lebensohl = 124,
  DONT = 125,
  Overcalls = 126,

  // generic "conventions"
  NoTrumpBids = 127,
  NaturalBids = 128,

  // convention mode switches & options
  BiddingStyle = 200,
  JumpOvercallsMode = 201,
  FourSuitTransfers = 202,
  StructuredReverses = 203,
  ThreeLevelTakeouts = 204,

  // convention info
  OneNTRange = 210,
  TwoNTRange = 211,
  ThreeNTRange = 212,
  TwoClubOpenRange = 213,
  TwoClubOpeningPoints = 214,
  Gambling3NTVersion = 215,
  Allowable1Openings = 216,

  // misc info
  OneNTRangeMinPts = 220,
  OneNTRangeMaxPts = 221,
  TwoNTRangeMinPts = 222,
  TwoNTRangeMaxPts = 223,
  ThreeNTRangeMinPts = 224,
  ThreeNTRangeMaxPts = 225,
}

export const BiddingOption = ConventionId;
