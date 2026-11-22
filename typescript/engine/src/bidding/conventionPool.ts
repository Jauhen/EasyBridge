import {
  Artificial2ClubConvention,
  BlackwoodConvention,
  CueBidConvention,
  DruryConvention,
  FourthSuitForcingConvention,
  Gambling3NTConvention,
  GerberConvention,
  Jacoby2NTConvention,
  JacobyTransferConvention,
  MichaelsCueBidConvention,
  NegativeDoublesConvention,
  OvercallsConvention,
  SplinterBidsConvention,
  StaymanConvention,
  ShutoutBidsConvention,
  StrongTwoBidsConvention,
  TakeoutDoublesConvention,
  UnusualNTConvention,
  WeakTwoBidsConvention,
} from './conventionImplementations.js';

export class ConventionPool {
  readonly strongTwoBids = new StrongTwoBidsConvention();
  readonly weakTwoBids = new WeakTwoBidsConvention();
  readonly shutoutBids = new ShutoutBidsConvention();
  readonly artificial2Club = new Artificial2ClubConvention();
  readonly fourthSuitForcing = new FourthSuitForcingConvention();
  readonly stayman = new StaymanConvention();
  readonly jacobyTransfers = new JacobyTransferConvention();
  readonly blackwood = new BlackwoodConvention();
  readonly gerber = new GerberConvention();
  readonly cueBids = new CueBidConvention();
  readonly splinterBids = new SplinterBidsConvention();
  readonly michaels = new MichaelsCueBidConvention();
  readonly jacoby2NT = new Jacoby2NTConvention();
  readonly unusualNT = new UnusualNTConvention();
  readonly gambling3NT = new Gambling3NTConvention();
  readonly drury = new DruryConvention();
  readonly overcalls = new OvercallsConvention();
  readonly negativeDoubles = new NegativeDoublesConvention();
  readonly takeoutDoubles = new TakeoutDoublesConvention();

  get all() {
    return [
      this.strongTwoBids,
      this.weakTwoBids,
      this.shutoutBids,
      this.artificial2Club,
      this.fourthSuitForcing,
      this.stayman,
      this.jacobyTransfers,
      this.blackwood,
      this.gerber,
      this.cueBids,
      this.splinterBids,
      this.michaels,
      this.jacoby2NT,
      this.unusualNT,
      this.gambling3NT,
      this.drury,
      this.overcalls,
      this.negativeDoubles,
      this.takeoutDoubles,
    ];
  }
}
