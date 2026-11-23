//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CConventionSet (ConventionSet.h / ConventionSet.cpp)
//

import { Bid } from '../constants.js';
import { Convention, ConventionContext } from './convention.js';
import { ConventionPool } from './conventionPool.js';
import { ConventionId } from './biddingCodes.js';

export interface MinMax {
  min: number;
  max: number;
}

// default bidding settings (from ConventionSet.cpp)
export const NT_RANGE_TABLE: readonly (readonly MinMax[])[] = [
  [{ min: 12, max: 14 }, { min: 15, max: 17 }, { min: 16, max: 18 }],
  [{ min: 20, max: 21 }, { min: 21, max: 22 }, { min: 22, max: 24 }],
  [{ min: 25, max: 27 }, { min: 99, max: 99 }, { min: 99, max: 99 }],
];

export const TWO_CLUB_OPEN_TABLE: readonly number[] = [20, 21, 22, 23];

export interface ConventionSetOptions {
  name?: string;
  description?: string;
  biddingStyle?: number;
  fiveCardMajors?: boolean;
  artificial2Club?: boolean;
  weakTwoBids?: boolean;
  weakJumpOvercalls?: boolean;
  shutoutBids?: boolean;
  ogust?: boolean;
  limitRaises?: boolean;
  fourthSuitForcing?: boolean;
  splinterBids?: boolean;
  unusualNT?: boolean;
  jacoby2NT?: boolean;
  gambling3NT?: boolean;
  gambling3NTVersion?: number;
  drury?: boolean;
  lebensohl?: boolean;
  dont?: boolean;
  takeoutDoubles?: boolean;
  negativeDoubles?: boolean;
  stayman?: boolean;
  jacobyTransfers?: boolean;
  fourSuitTransfers?: boolean;
  structuredReverses?: boolean;
  threeLevelTakeouts?: boolean;
  blackwood?: boolean;
  rkcb?: boolean;
  cueBids?: boolean;
  gerber?: boolean;
  michaels?: boolean;
  allowable1Openings?: number;
  oneNTRange?: [number, number];
  twoNTRange?: [number, number];
  threeNTRange?: [number, number];
  oneNTRangeIndex?: number;
  twoNTRangeIndex?: number;
  threeNTRangeIndex?: number;
  twoClubOpenRange?: number;
  twoClubOpenRangeIndex?: number;
}

export class ConventionSet {
  name: string;
  description: string;
  biddingStyle: number;
  readonly options: Required<
    Omit<
      ConventionSetOptions,
      | 'name'
      | 'description'
      | 'biddingStyle'
      | 'oneNTRangeIndex'
      | 'twoNTRangeIndex'
      | 'threeNTRangeIndex'
      | 'twoClubOpenRangeIndex'
    >
  >;

  ntRangeIndices: [number, number, number];
  twoClubOpenRangeIndex: number;

  private conventions: Convention[] = [];
  private pool: ConventionPool | null = null;

  constructor(options: ConventionSetOptions = {}) {
    this.name = options.name ?? 'Standard';
    this.description = options.description ?? '';
    this.biddingStyle = options.biddingStyle ?? 2;

    this.ntRangeIndices = [
      options.oneNTRangeIndex ?? 1, // 15-17
      options.twoNTRangeIndex ?? 2, // 22-24
      options.threeNTRangeIndex ?? 0, // 25-27
    ];
    this.twoClubOpenRangeIndex = options.twoClubOpenRangeIndex ?? 0; // 20+

    const default1NT = NT_RANGE_TABLE[0][this.ntRangeIndices[0]];
    const default2NT = NT_RANGE_TABLE[1][this.ntRangeIndices[1]];
    const default3NT = NT_RANGE_TABLE[2][this.ntRangeIndices[2]];

    this.options = {
      fiveCardMajors: options.fiveCardMajors ?? true,
      artificial2Club: options.artificial2Club ?? true,
      weakTwoBids: options.weakTwoBids ?? true,
      weakJumpOvercalls: options.weakJumpOvercalls ?? false,
      shutoutBids: options.shutoutBids ?? true,
      ogust: options.ogust ?? false,
      limitRaises: options.limitRaises ?? false,
      fourthSuitForcing: options.fourthSuitForcing ?? false,
      splinterBids: options.splinterBids ?? false,
      unusualNT: options.unusualNT ?? false,
      jacoby2NT: options.jacoby2NT ?? false,
      gambling3NT: options.gambling3NT ?? false,
      gambling3NTVersion: options.gambling3NTVersion ?? 0,
      drury: options.drury ?? false,
      lebensohl: options.lebensohl ?? false,
      dont: options.dont ?? false,
      takeoutDoubles: options.takeoutDoubles ?? true,
      negativeDoubles: options.negativeDoubles ?? true,
      stayman: options.stayman ?? true,
      jacobyTransfers: options.jacobyTransfers ?? false,
      fourSuitTransfers: options.fourSuitTransfers ?? true,
      structuredReverses: options.structuredReverses ?? false,
      threeLevelTakeouts: options.threeLevelTakeouts ?? false,
      blackwood: options.blackwood ?? true,
      rkcb: options.rkcb ?? false,
      cueBids: options.cueBids ?? true,
      gerber: options.gerber ?? false,
      michaels: options.michaels ?? false,
      allowable1Openings: options.allowable1Openings ?? 0,
      oneNTRange: options.oneNTRange ?? [default1NT.min, default1NT.max],
      twoNTRange: options.twoNTRange ?? [default2NT.min, default2NT.max],
      threeNTRange: options.threeNTRange ?? [default3NT.min, default3NT.max],
      twoClubOpenRange: options.twoClubOpenRange ?? TWO_CLUB_OPEN_TABLE[this.twoClubOpenRangeIndex],
    };
  }

  //
  // InitConventions() / Initialize()
  //
  // gather up all the conventions used in this convention set in C++ registry order
  //
  initialize(pool: ConventionPool): void {
    this.pool = pool;
    this.initConventions();
  }

  getPool(): ConventionPool | null {
    return this.pool;
  }

  initConventions(): void {
    if (!this.pool) return;
    const pool = this.pool;
    this.conventions = [];

    // in general, put the most esoteric conventions first
    if (this.options.cueBids) this.add(pool.cueBids);
    if (this.options.blackwood) this.add(pool.blackwood);
    if (this.options.gerber) this.add(pool.gerber);
    if (this.options.splinterBids) this.add(pool.splinterBids);
    if (this.options.unusualNT) this.add(pool.unusualNT);
    if (this.options.jacoby2NT) this.add(pool.jacoby2NT);
    if (this.options.gambling3NT) this.add(pool.gambling3NT);
    if (this.options.jacobyTransfers) this.add(pool.jacobyTransfers);
    if (this.options.stayman) this.add(pool.stayman);
    if (this.options.artificial2Club) this.add(pool.artificial2Club);
    if (this.options.shutoutBids) this.add(pool.shutoutBids);
    if (this.options.fourthSuitForcing) this.add(pool.fourthSuitForcing);
    if (this.options.michaels) this.add(pool.michaels);
    if (this.options.drury) this.add(pool.drury);
    // simple overcalls are always used
    this.add(pool.overcalls);
    if (this.options.negativeDoubles) this.add(pool.negativeDoubles);
    if (this.options.takeoutDoubles) this.add(pool.takeoutDoubles);
    // only one of weak twos or strong twos can be active
    this.add(this.options.weakTwoBids ? pool.weakTwoBids : pool.strongTwoBids);
  }

  private add(convention: Convention): void {
    convention.enable();
    this.conventions.push(convention);
  }

  //
  // ApplyConventionTests()
  //
  applyConventionTests(context: ConventionContext): Bid | null {
    if (this.conventions.length === 0) return null;
    for (const convention of this.conventions) {
      const bid = convention.applyTest(context);
      if (bid !== null) return bid;
    }
    return null;
  }

  clearState(): void {
    for (const convention of this.conventions) convention.clearState();
  }

  get conventionsList(): readonly Convention[] {
    return this.conventions;
  }

  //
  // IsConventionEnabled()
  //
  isConventionEnabled(id: ConventionId): boolean {
    if (this.conventions.some(convention => convention.id === id)) {
      return true;
    }
    switch (id) {
      case ConventionId.FiveCardMajors:
        return this.options.fiveCardMajors;
      case ConventionId.LimitRaises:
        return this.options.limitRaises;
      case ConventionId.WeakJumpOvercalls:
        return this.options.weakJumpOvercalls;
      case ConventionId.FourSuitTransfers:
        return this.options.fourSuitTransfers;
      case ConventionId.Ogust:
        return this.options.ogust;
      case ConventionId.StructuredReverses:
        return this.options.structuredReverses;
      case ConventionId.ThreeLevelTakeouts:
        return this.options.threeLevelTakeouts;
      default:
        return false;
    }
  }

  //
  // IsOptionEnabled()
  //
  isOptionEnabled(id: ConventionId): boolean {
    switch (id) {
      case ConventionId.FourSuitTransfers:
        return this.options.fourSuitTransfers;
      case ConventionId.StructuredReverses:
        return this.options.structuredReverses;
      case ConventionId.ThreeLevelTakeouts:
        return this.options.threeLevelTakeouts;
      default:
        return false;
    }
  }

  //
  // GetValue() / SetValue()
  //
  getValue(item: ConventionId): number {
    switch (item) {
      case ConventionId.BiddingStyle:
        return this.biddingStyle;
      case ConventionId.FiveCardMajors:
        return this.options.fiveCardMajors ? 1 : 0;
      case ConventionId.Artificial2Club:
        return this.options.artificial2Club ? 1 : 0;
      case ConventionId.WeakTwoBids:
        return this.options.weakTwoBids ? 1 : 0;
      case ConventionId.WeakJumpOvercalls:
        return this.options.weakJumpOvercalls ? 1 : 0;
      case ConventionId.StrongTwoBids:
        return this.options.weakTwoBids ? 0 : 1;
      case ConventionId.ShutoutBids:
        return this.options.shutoutBids ? 1 : 0;
      case ConventionId.FourthSuitForcing:
        return this.options.fourthSuitForcing ? 1 : 0;
      case ConventionId.Ogust:
        return this.options.ogust ? 1 : 0;
      case ConventionId.Blackwood:
        return this.options.blackwood ? 1 : 0;
      case ConventionId.CueBids:
        return this.options.cueBids ? 1 : 0;
      case ConventionId.Gerber:
        return this.options.gerber ? 1 : 0;
      case ConventionId.Stayman:
        return this.options.stayman ? 1 : 0;
      case ConventionId.JacobyTransfers:
        return this.options.jacobyTransfers ? 1 : 0;
      case ConventionId.LimitRaises:
        return this.options.limitRaises ? 1 : 0;
      case ConventionId.TakeoutDoubles:
        return this.options.takeoutDoubles ? 1 : 0;
      case ConventionId.NegativeDoubles:
        return this.options.negativeDoubles ? 1 : 0;
      case ConventionId.SplinterBids:
        return this.options.splinterBids ? 1 : 0;
      case ConventionId.Michaels:
        return this.options.michaels ? 1 : 0;
      case ConventionId.UnusualNT:
        return this.options.unusualNT ? 1 : 0;
      case ConventionId.Jacoby2NT:
        return this.options.jacoby2NT ? 1 : 0;
      case ConventionId.Gambling3NT:
        return this.options.gambling3NT ? 1 : 0;
      case ConventionId.Gambling3NTVersion:
        return this.options.gambling3NTVersion;
      case ConventionId.Drury:
        return this.options.drury ? 1 : 0;
      case ConventionId.Lebensohl:
        return this.options.lebensohl ? 1 : 0;
      case ConventionId.DONT:
        return this.options.dont ? 1 : 0;
      case ConventionId.FourSuitTransfers:
        return this.options.fourSuitTransfers ? 1 : 0;
      case ConventionId.StructuredReverses:
        return this.options.structuredReverses ? 1 : 0;
      case ConventionId.ThreeLevelTakeouts:
        return this.options.threeLevelTakeouts ? 1 : 0;
      case ConventionId.OneNTRange:
        return this.ntRangeIndices[0];
      case ConventionId.TwoNTRange:
        return this.ntRangeIndices[1];
      case ConventionId.ThreeNTRange:
        return this.ntRangeIndices[2];
      case ConventionId.TwoClubOpenRange:
        return this.twoClubOpenRangeIndex;
      case ConventionId.Allowable1Openings:
        return this.options.allowable1Openings;
      case ConventionId.OneNTRangeMinPts:
        return this.options.oneNTRange[0];
      case ConventionId.OneNTRangeMaxPts:
        return this.options.oneNTRange[1];
      case ConventionId.TwoNTRangeMinPts:
        return this.options.twoNTRange[0];
      case ConventionId.TwoNTRangeMaxPts:
        return this.options.twoNTRange[1];
      case ConventionId.ThreeNTRangeMinPts:
        return this.options.threeNTRange[0];
      case ConventionId.ThreeNTRangeMaxPts:
        return this.options.threeNTRange[1];
      case ConventionId.TwoClubOpeningPoints:
        return this.options.twoClubOpenRange;
      default:
        return 0;
    }
  }

  setValue(item: ConventionId, value: number): number {
    const bVal = value !== 0;
    switch (item) {
      case ConventionId.BiddingStyle:
        this.biddingStyle = value;
        break;
      case ConventionId.FiveCardMajors:
        this.options.fiveCardMajors = bVal;
        this.initConventions();
        break;
      case ConventionId.Artificial2Club:
        this.options.artificial2Club = bVal;
        this.initConventions();
        break;
      case ConventionId.WeakTwoBids:
        this.options.weakTwoBids = bVal;
        this.initConventions();
        break;
      case ConventionId.WeakJumpOvercalls:
        this.options.weakJumpOvercalls = bVal;
        break;
      case ConventionId.StrongTwoBids:
        this.options.weakTwoBids = !bVal;
        this.initConventions();
        break;
      case ConventionId.ShutoutBids:
        this.options.shutoutBids = bVal;
        this.initConventions();
        break;
      case ConventionId.FourthSuitForcing:
        this.options.fourthSuitForcing = bVal;
        this.initConventions();
        break;
      case ConventionId.Ogust:
        this.options.ogust = bVal;
        this.initConventions();
        break;
      case ConventionId.Blackwood:
        this.options.blackwood = bVal;
        this.initConventions();
        break;
      case ConventionId.CueBids:
        this.options.cueBids = bVal;
        this.initConventions();
        break;
      case ConventionId.Gerber:
        this.options.gerber = bVal;
        this.initConventions();
        break;
      case ConventionId.Stayman:
        this.options.stayman = bVal;
        this.initConventions();
        break;
      case ConventionId.JacobyTransfers:
        this.options.jacobyTransfers = bVal;
        this.initConventions();
        break;
      case ConventionId.LimitRaises:
        this.options.limitRaises = bVal;
        this.initConventions();
        break;
      case ConventionId.TakeoutDoubles:
        this.options.takeoutDoubles = bVal;
        this.initConventions();
        break;
      case ConventionId.NegativeDoubles:
        this.options.negativeDoubles = bVal;
        this.initConventions();
        break;
      case ConventionId.SplinterBids:
        this.options.splinterBids = bVal;
        this.initConventions();
        break;
      case ConventionId.Michaels:
        this.options.michaels = bVal;
        this.initConventions();
        break;
      case ConventionId.UnusualNT:
        this.options.unusualNT = bVal;
        this.initConventions();
        break;
      case ConventionId.Jacoby2NT:
        this.options.jacoby2NT = bVal;
        this.initConventions();
        break;
      case ConventionId.Gambling3NT:
        this.options.gambling3NT = bVal;
        this.initConventions();
        break;
      case ConventionId.Gambling3NTVersion:
        this.options.gambling3NTVersion = value;
        break;
      case ConventionId.Drury:
        this.options.drury = bVal;
        this.initConventions();
        break;
      case ConventionId.Lebensohl:
        this.options.lebensohl = bVal;
        this.initConventions();
        break;
      case ConventionId.DONT:
        this.options.dont = bVal;
        this.initConventions();
        break;
      case ConventionId.FourSuitTransfers:
        this.options.fourSuitTransfers = bVal;
        break;
      case ConventionId.StructuredReverses:
        this.options.structuredReverses = bVal;
        break;
      case ConventionId.ThreeLevelTakeouts:
        this.options.threeLevelTakeouts = bVal;
        break;
      case ConventionId.OneNTRange: {
        this.ntRangeIndices[0] = value;
        const r = NT_RANGE_TABLE[0][value];
        if (r) this.options.oneNTRange = [r.min, r.max];
        break;
      }
      case ConventionId.TwoNTRange: {
        this.ntRangeIndices[1] = value;
        const r = NT_RANGE_TABLE[1][value];
        if (r) this.options.twoNTRange = [r.min, r.max];
        break;
      }
      case ConventionId.ThreeNTRange: {
        this.ntRangeIndices[2] = value;
        const r = NT_RANGE_TABLE[2][value];
        if (r) this.options.threeNTRange = [r.min, r.max];
        break;
      }
      case ConventionId.TwoClubOpenRange:
        this.twoClubOpenRangeIndex = value;
        if (TWO_CLUB_OPEN_TABLE[value] !== undefined) {
          this.options.twoClubOpenRange = TWO_CLUB_OPEN_TABLE[value];
        }
        break;
      case ConventionId.Allowable1Openings:
        this.options.allowable1Openings = value;
        break;
      default:
        return -1;
    }
    return 0;
  }

  getNTRange(level: 1 | 2 | 3): [number, number] {
    if (level === 1) return this.options.oneNTRange;
    if (level === 2) return this.options.twoNTRange;
    return this.options.threeNTRange;
  }

  getNTRangeMin(level: number): number {
    if (level < 1 || level > 3) return 0;
    return this.getNTRange(level as 1 | 2 | 3)[0];
  }

  getNTRangeMax(level: number): number {
    if (level < 1 || level > 3) return 0;
    return this.getNTRange(level as 1 | 2 | 3)[1];
  }
}
