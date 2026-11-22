import { Convention } from './convention.js';
import { ConventionPool } from './conventionPool.js';
import { ConventionId } from './biddingCodes.js';

export interface ConventionSetOptions {
  name?: string;
  fiveCardMajors?: boolean;
  artificial2Club?: boolean;
  weakTwoBids?: boolean;
  weakJumpOvercalls?: boolean;
  shutoutBids?: boolean;
  fourthSuitForcing?: boolean;
  splinterBids?: boolean;
  unusualNT?: boolean;
  jacoby2NT?: boolean;
  gambling3NT?: boolean;
  drury?: boolean;
  takeoutDoubles?: boolean;
  negativeDoubles?: boolean;
  stayman?: boolean;
  jacobyTransfers?: boolean;
  blackwood?: boolean;
  cueBids?: boolean;
  gerber?: boolean;
  michaels?: boolean;
  oneNTRange?: [number, number];
  twoNTRange?: [number, number];
  threeNTRange?: [number, number];
  twoClubOpenRange?: number;
}

export class ConventionSet {
  readonly name: string;
  readonly options: Required<Omit<ConventionSetOptions, 'name'>>;
  private conventions: Convention[] = [];

  constructor(options: ConventionSetOptions = {}) {
    this.name = options.name ?? 'Standard';
    this.options = {
      fiveCardMajors: options.fiveCardMajors ?? true,
      artificial2Club: options.artificial2Club ?? true,
      weakTwoBids: options.weakTwoBids ?? true,
      weakJumpOvercalls: options.weakJumpOvercalls ?? false,
      shutoutBids: options.shutoutBids ?? true,
      fourthSuitForcing: options.fourthSuitForcing ?? false,
      splinterBids: options.splinterBids ?? false,
      unusualNT: options.unusualNT ?? false,
      jacoby2NT: options.jacoby2NT ?? false,
      gambling3NT: options.gambling3NT ?? false,
      drury: options.drury ?? false,
      takeoutDoubles: options.takeoutDoubles ?? true,
      negativeDoubles: options.negativeDoubles ?? true,
      stayman: options.stayman ?? true,
      jacobyTransfers: options.jacobyTransfers ?? false,
      blackwood: options.blackwood ?? true,
      cueBids: options.cueBids ?? true,
      gerber: options.gerber ?? false,
      michaels: options.michaels ?? false,
      oneNTRange: options.oneNTRange ?? [15, 17],
      twoNTRange: options.twoNTRange ?? [22, 24],
      threeNTRange: options.threeNTRange ?? [25, 27],
      twoClubOpenRange: options.twoClubOpenRange ?? 20,
    };
  }

  initialize(pool: ConventionPool): void {
    this.conventions = [];
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
    this.add(pool.overcalls);
    if (this.options.negativeDoubles) this.add(pool.negativeDoubles);
    if (this.options.takeoutDoubles) this.add(pool.takeoutDoubles);
    this.add(this.options.weakTwoBids ? pool.weakTwoBids : pool.strongTwoBids);
  }

  private add(convention: Convention): void {
    convention.enable();
    this.conventions.push(convention);
  }

  clearState(): void {
    for (const convention of this.conventions) convention.clearState();
  }

  get conventionsList(): readonly Convention[] {
    return this.conventions;
  }

  isConventionEnabled(id: ConventionId): boolean {
    return this.conventions.some(convention => convention.id === id);
  }

  getNTRange(level: 1 | 2 | 3): [number, number] {
    if (level === 1) return this.options.oneNTRange;
    if (level === 2) return this.options.twoNTRange;
    return this.options.threeNTRange;
  }
}
