import { Bid, makeBid, Suit } from '../constants.js';
import { Convention, ConventionContext } from './convention.js';
import { ConventionId, ConventionStatus } from './biddingCodes.js';

function countFace(hand: ConventionContext['hand'], faceValue: number): number {
  let count = 0;
  for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
    for (const card of hand.getCardsInSuit(suit as Suit)) {
      if (card.faceValue === faceValue) count++;
    }
  }
  return count;
}

export class StaymanConvention extends Convention {
  constructor() { super(ConventionId.Stayman); }

  override tryConvention(context: ConventionContext): Bid | null {
    const { bidContext, hand } = context;
    if (!bidContext.partnerOpenedForTeam) return null;
    if (![5, 10, 15].includes(bidContext.partnerBid)) return null;
    if (!bidContext.rightHandOpponentPassed) return null;
    if (hand.highCardPoints < 8) return null;
    if (hand.getSuitLength(Suit.Hearts) < 4 && hand.getSuitLength(Suit.Spades) < 4) return null;
    bidContext.status = ConventionStatus.Invoked;
    bidContext.agreedSuit = Suit.NoTrump;
    this.recordStatusLog(
      'STY0',
      `We have ${hand.highCardPoints} HCP and at least one 4+ card major, so bid 2C (Stayman).`,
    );
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return Bid.C2;
  }

  override respondToConvention(context: ConventionContext): Bid | null {
    if (context.bidContext.partnerBid !== Bid.C2) return null;
    if (context.hand.getSuitLength(Suit.Hearts) >= 4) return Bid.H2;
    if (context.hand.getSuitLength(Suit.Spades) >= 4) return Bid.S2;
    return Bid.D2;
  }
}

export class WeakTwoBidsConvention extends Convention {
  constructor() { super(ConventionId.WeakTwoBids); }

  override tryConvention(context: ConventionContext): Bid | null {
    const hcp = context.hand.highCardPoints;
    if (hcp < 6 || hcp > 10) return null;
    for (const suit of [Suit.Hearts, Suit.Spades, Suit.Diamonds]) {
      if (context.hand.getSuitLength(suit) >= 6) {
        const bid = suit === Suit.Hearts ? Bid.H2 : suit === Suit.Spades ? Bid.S2 : Bid.D2;
        context.bidContext.status = ConventionStatus.Invoked;
        context.bidContext.agreedSuit = suit;
        return bid;
      }
    }
    return null;
  }
}

export class StrongTwoBidsConvention extends Convention {
  constructor() { super(ConventionId.StrongTwoBids); }

  override tryConvention(context: ConventionContext): Bid | null {
    if (context.hand.highCardPoints < 20) return null;
    context.bidContext.status = ConventionStatus.Invoked;
    return Bid.C2;
  }
}

export class Artificial2ClubConvention extends Convention {
  constructor() { super(ConventionId.Artificial2Club); }

  override tryConvention(context: ConventionContext): Bid | null {
    if (context.hand.highCardPoints < 22) return null;
    context.bidContext.status = ConventionStatus.Invoked;
    return Bid.C2;
  }
}

export class FourthSuitForcingConvention extends Convention {
  constructor() { super(ConventionId.FourthSuitForcing); }
  override tryConvention(context: ConventionContext): Bid | null {
    const suitsBid = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]
      .filter(suit => context.hand.getSuitLength(suit) >= 4).length;
    if (context.hand.highCardPoints >= 10 && suitsBid >= 3) {
      context.bidContext.status = ConventionStatus.Invoked;
      this.recordStatusLog('SF4', 'Fourth suit is forcing with at least 10 HCP.');
      context.status.trace(`${this.statusLog.at(-1)}\n`);
      return Bid.C2;
    }
    return null;
  }
}

export class BlackwoodConvention extends Convention {
  constructor() { super(ConventionId.Blackwood); }

  override tryConvention(context: ConventionContext): Bid | null {
    const hcp = context.hand.highCardPoints;
    if (hcp < 20) return null;
    const aceCount = countFace(context.hand, 14);
    if (aceCount === 4) return null;
    context.bidContext.status = ConventionStatus.InvokedRound1;
    this.recordStatusLog('BLKWD', `With ${hcp} HCP and ${aceCount} aces, explore slam with 4NT.`);
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return Bid.NT4;
  }

  override respondToConvention(context: ConventionContext): Bid | null {
    if (context.bidContext.status === ConventionStatus.RespondedRound1 &&
      context.bidContext.partnerBid === Bid.NT5) {
      const kingCount = countFace(context.hand, 13);
      const response = kingCount === 0 || kingCount === 4
        ? Bid.C6
        : kingCount === 1
          ? Bid.D6
          : kingCount === 2
            ? Bid.H6
            : Bid.S6;
      context.bidContext.status = ConventionStatus.RespondedRound2;
      this.recordStatusLog('BK12', `With ${kingCount} king(s), respond to the RKCB 5NT king inquiry.`);
      context.status.trace(`${this.statusLog.at(-1)}\n`);
      return response;
    }
    if (context.bidContext.partnerBid !== Bid.NT4) return null;
    const aceCount = countFace(context.hand, 14);
    const response = aceCount === 0 || aceCount === 4
      ? Bid.C5
      : aceCount === 1
        ? Bid.D5
        : aceCount === 2
          ? Bid.H5
          : Bid.S5;
    context.bidContext.status = ConventionStatus.RespondedRound1;
    this.recordStatusLog('BK10', `With ${aceCount} ace(s), respond to partner's 4NT Blackwood.`);
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return response;
  }
}

export class GerberConvention extends Convention {
  constructor() { super(ConventionId.Gerber); }
  override tryConvention(context: ConventionContext): Bid | null {
    if (context.hand.highCardPoints < 20) return null;
    context.bidContext.status = ConventionStatus.InvokedRound1;
    this.recordStatusLog('GBR0', 'Explore slam aces with Gerber 4C.');
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return Bid.C4;
  }

  override respondToConvention(context: ConventionContext): Bid | null {
    if (context.bidContext.partnerBid !== Bid.C4) return null;
    const aceCount = countFace(context.hand, 14);
    const response = aceCount === 0
      ? Bid.C5
      : aceCount === 1
        ? Bid.D5
        : aceCount === 2
          ? Bid.H5
          : aceCount === 3
            ? Bid.S5
            : Bid.NT5;
    context.bidContext.status = ConventionStatus.RespondedRound1;
    this.recordStatusLog('GB10', `With ${aceCount} ace(s), respond to Gerber.`);
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return response;
  }
}

export class CueBidConvention extends Convention {
  constructor() { super(ConventionId.CueBids); }
  override tryConvention(context: ConventionContext): Bid | null {
    if (context.hand.highCardPoints < 20) return null;
    for (const suit of [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]) {
      if (context.hand.getSuitLength(suit) >= 4) {
        context.bidContext.status = ConventionStatus.InvokedRound1;
        context.bidContext.agreedSuit = suit;
        this.recordStatusLog('CUET10', `Cue-bid with slam interest in ${Suit[suit]}.`);
        context.status.trace(`${this.statusLog.at(-1)}\n`);
        return makeBid(suit, 4);
      }
    }
    return null;
  }
}

export class SplinterBidsConvention extends Convention {
  constructor() { super(ConventionId.SplinterBids); }
  override tryConvention(context: ConventionContext): Bid | null {
    for (const suit of [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]) {
      if (context.hand.getSuitLength(suit) <= 0) {
        context.bidContext.status = ConventionStatus.Invoked;
        context.bidContext.agreedSuit = suit;
        this.recordStatusLog('SPLINT', `Splinter void/singleton detected in ${Suit[suit]}.`);
        context.status.trace(`${this.statusLog.at(-1)}\n`);
        return makeBid(suit, 4);
      }
    }
    return null;
  }
}

export class MichaelsCueBidConvention extends Convention {
  constructor() { super(ConventionId.Michaels); }
  override tryConvention(context: ConventionContext): Bid | null {
    const majorCount = Math.max(
      context.hand.getSuitLength(Suit.Hearts),
      context.hand.getSuitLength(Suit.Spades),
    );
    const minorCount = Math.max(
      context.hand.getSuitLength(Suit.Clubs),
      context.hand.getSuitLength(Suit.Diamonds),
    );
    if (majorCount < 5 || minorCount < 5) return null;
    context.bidContext.status = ConventionStatus.Invoked;
    this.recordStatusLog('MCH0', 'Two-suited 5-5 major/minor Michaels cue-bid is available.');
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return makeBid(Suit.NoTrump, 2);
  }

  override respondToConvention(context: ConventionContext): Bid | null {
    if (context.bidContext.partnerBid !== Bid.H2 &&
      context.bidContext.partnerBid !== Bid.S2 &&
      context.bidContext.partnerBid !== Bid.D2 &&
      context.bidContext.partnerBid !== Bid.C2) return null;
    const major = context.hand.getSuitLength(Suit.Spades) >=
      context.hand.getSuitLength(Suit.Hearts)
      ? Suit.Spades
      : Suit.Hearts;
    if (context.hand.getSuitLength(major) >= 3) {
      context.bidContext.agreedSuit = major;
      context.bidContext.status = ConventionStatus.Responded;
      this.recordStatusLog('MCLR', `With 3+ ${Suit[major]} support, respond in the Michaels major.`);
      context.status.trace(`${this.statusLog.at(-1)}\n`);
      return makeBid(major, 3);
    }
    return Bid.Pass;
  }
}

export class Jacoby2NTConvention extends Convention {
  constructor() { super(ConventionId.Jacoby2NT); }
  override tryConvention(context: ConventionContext): Bid | null {
    const fourCardMajor = context.hand.getSuitLength(Suit.Hearts) >= 4
      ? Suit.Hearts
      : context.hand.getSuitLength(Suit.Spades) >= 4
        ? Suit.Spades
        : -1;
    if (fourCardMajor === -1 || context.hand.highCardPoints < 12) return null;
    context.bidContext.status = ConventionStatus.Invoked;
    context.bidContext.agreedSuit = fourCardMajor as Suit;
    this.recordStatusLog('J2NT', 'Jacoby 2NT shows game-forcing major-suit support.');
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return Bid.NT2;
  }

  override respondToConvention(context: ConventionContext): Bid | null {
    if (context.bidContext.partnerBid !== Bid.NT2) return null;
    const hcp = context.hand.highCardPoints;
    const major = context.hand.getSuitLength(Suit.Spades) >=
      context.hand.getSuitLength(Suit.Hearts)
      ? Suit.Spades
      : Suit.Hearts;
    if (hcp >= 18) {
      context.bidContext.status = ConventionStatus.Responded;
      return makeBid(major, 3);
    }
    return hcp >= 15 ? Bid.NT3 : makeBid(major, 4);
  }
}

export class UnusualNTConvention extends Convention {
  constructor() { super(ConventionId.UnusualNT); }
  override tryConvention(context: ConventionContext): Bid | null {
    const twoLowLongest = [Suit.Clubs, Suit.Diamonds, Suit.Hearts]
      .sort((a, b) => context.hand.getSuitLength(b) - context.hand.getSuitLength(a))
      .slice(0, 2);
    if (twoLowLongest.every(suit => context.hand.getSuitLength(suit) >= 5)) {
      context.bidContext.status = ConventionStatus.Invoked;
      this.recordStatusLog('UNT9', 'Unusual NT shows two 5-card lower suits.');
      context.status.trace(`${this.statusLog.at(-1)}\n`);
      return Bid.NT2;
    }
    return null;
  }
}

export class Gambling3NTConvention extends Convention {
  constructor() { super(ConventionId.Gambling3NT); }
  override tryConvention(context: ConventionContext): Bid | null {
    const solidMinor = [Suit.Clubs, Suit.Diamonds].find(suit =>
      context.hand.getSuitLength(suit) >= 7,
    );
    if (solidMinor === undefined || context.hand.highCardPoints >= 10) return null;
    context.bidContext.status = ConventionStatus.Invoked;
    context.bidContext.agreedSuit = solidMinor;
    this.recordStatusLog('G3NT', 'Gambling 3NT shows a solid minor and little outside strength.');
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return Bid.NT3;
  }

  override respondToConvention(context: ConventionContext): Bid | null {
    if (context.bidContext.partnerBid !== Bid.NT3) return null;
    const stopped = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]
      .filter(suit => context.hand.getSuitLength(suit) >= 2).length;
    context.bidContext.status = stopped >= 3
      ? ConventionStatus.Responded
      : ConventionStatus.Inactive;
    return stopped >= 3 ? Bid.Pass : Bid.C4;
  }
}

export class DruryConvention extends Convention {
  constructor() { super(ConventionId.Drury); }
  override tryConvention(context: ConventionContext): Bid | null {
    const hcp = context.hand.highCardPoints;
    if (hcp < 6 || hcp > 12) return null;
    if (context.hand.getSuitLength(Suit.Hearts) < 3 &&
      context.hand.getSuitLength(Suit.Spades) < 3) return null;
    context.bidContext.status = ConventionStatus.Invoked;
    this.recordStatusLog('DRURY', 'Drury shows passed-hand support for partner.');
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return Bid.C2;
  }

  override respondToConvention(context: ConventionContext): Bid | null {
    if (context.bidContext.partnerBid !== Bid.C2) return null;
    const hcp = context.hand.highCardPoints;
    const major = context.hand.getSuitLength(Suit.Spades) >
      context.hand.getSuitLength(Suit.Hearts)
      ? Suit.Spades
      : Suit.Hearts;
    if (hcp <= 12) return makeBid(major, 2);
    return makeBid(major, 3);
  }
}

export class NegativeDoublesConvention extends Convention {
  constructor() { super(ConventionId.NegativeDoubles); }
  override tryConvention(context: ConventionContext): Bid | null {
    if (context.hand.highCardPoints < 8) return null;
    const major = context.hand.getSuitLength(Suit.Hearts) >=
      context.hand.getSuitLength(Suit.Spades)
      ? Suit.Hearts
      : Suit.Spades;
    if (context.hand.getSuitLength(major) >= 4) {
      context.bidContext.status = ConventionStatus.Invoked;
      this.recordStatusLog('NEGDBL', `Negative double shows 4+ ${Suit[major]}s.`);
      context.status.trace(`${this.statusLog.at(-1)}\n`);
      return Bid.Double;
    }
    return null;
  }
}

export class TakeoutDoublesConvention extends Convention {
  constructor() { super(ConventionId.TakeoutDoubles); }
  override tryConvention(context: ConventionContext): Bid | null {
    if (context.hand.highCardPoints < 12) return null;
    const suits = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]
      .filter(suit => context.hand.getSuitLength(suit) >= 3);
    if (suits.length < 3) return null;
    context.bidContext.status = ConventionStatus.Invoked;
    this.recordStatusLog('TODBL', 'Takeout double shows support for three suits.');
    context.status.trace(`${this.statusLog.at(-1)}\n`);
    return Bid.Double;
  }
}

export class OvercallsConvention extends Convention {
  constructor() { super(ConventionId.Overcalls); }

  override tryConvention(context: ConventionContext): Bid | null {
    if (context.hand.highCardPoints < 8) return null;
    let longest = Suit.Clubs;
    for (let suit = Suit.Clubs + 1; suit <= Suit.Spades; suit++) {
      if (context.hand.getSuitLength(suit as Suit) > context.hand.getSuitLength(longest)) {
        longest = suit as Suit;
      }
    }
    if (context.hand.getSuitLength(longest) >= 5) {
      context.bidContext.status = ConventionStatus.Invoked;
      context.bidContext.agreedSuit = longest;
      return makeBid(longest, 1);
    }
    return null;
  }
}

export class JacobyTransferConvention extends Convention {
  constructor() { super(ConventionId.JacobyTransfers); }

  override tryConvention(context: ConventionContext): Bid | null {
    if (context.bidContext.partnerOpenedForTeam && context.hand.getSuitLength(Suit.Hearts) >= 5) {
      return Bid.D2;
    }
    if (context.bidContext.partnerOpenedForTeam && context.hand.getSuitLength(Suit.Spades) >= 5) {
      return Bid.H2;
    }
    return null;
  }
}

export class ShutoutBidsConvention extends Convention {
  constructor() { super(ConventionId.ShutoutBids); }

  override tryConvention(context: ConventionContext): Bid | null {
    if (context.hand.highCardPoints > 12) return null;
    for (const suit of [Suit.Hearts, Suit.Spades, Suit.Diamonds, Suit.Clubs]) {
      const length = context.hand.getSuitLength(suit);
      if (length >= 7) return makeBid(suit, 3);
    }
    return null;
  }
}
