//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// OvercallsConvention.cpp -> overcallsConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidLevel,
  bidSuit,
  bidToFullString,
  isMajor,
  isMinor,
  NONE,
  Suit,
} from '../../constants.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import type { BidEngine } from '../bidEngine.js';
import {
  PTS_GAME,
  PTS_MINOR_GAME,
  PTS_NT_GAME,
  PTS_SLAM,
  RaiseTarget,
  StoppedCode,
  SuitStrength,
  SuitType,
  SupportLength,
} from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class OvercallsConvention extends Convention {
  constructor() {
    super(ConventionId.Overcalls);
  }

  //
  // TryConvention()
  //
  // check if we can overcall the opponents' bid
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status, conventions } = context;

    // see if we can overcall here
    // - this must be the first round
    // - partner must not have bid yet
    if (
      (bidState.nLHOBid > Bid.Pass || bidState.nRHOBid > Bid.Pass) &&
      bidState.nPartnersBid <= Bid.Pass &&
      bidState.m_numBidTurns === 0
    ) {
      status.stream('2OVRCL0! Opponents have opened the bidding; see if we can overcall.\n');
    } else {
      return null;
    }

    // basic requirements for a simple overcall
    if (bidState.fPts >= bidState.openPts(8) && bidState.numLikelyWinners >= 5) {
      // passed the initial tests
    } else {
      status.stream('2OVRCL3! But we lack the strength for a simple overcall.\n');
      return null;
    }

    // first see what the opponents have bid
    let nSuit: Suit;
    let nOppSuit: Suit | typeof NONE;
    let nOppBid: Bid;
    let nOppBidLevel: number;
    let nOppSuit2: Suit | typeof NONE = NONE;

    if (bidState.nLHOBid > Bid.Pass) {
      nOppSuit = bidState.nLHOSuit;
      nOppBid = bidState.nLHOBid;
      nOppBidLevel = bidState.nLHOBidLevel;
      if (bidState.nRHOBid > Bid.Pass) {
        if (bidSuit(bidState.nRHOBid) !== nOppSuit) {
          nOppSuit2 = bidState.nRHOSuit;
        }
        nOppBid = bidState.nRHOBid;
        nOppBidLevel = bidState.nRHOBidLevel;
      }
    } else {
      nOppSuit = bidState.nRHOSuit;
      nOppBid = bidState.nRHOBid;
      nOppBidLevel = bidState.nRHOBidLevel;
    }

    // see if opponents have bid too high for us to overcall
    if (nOppBidLevel >= 3) return null;

    // see if we have a good 5-card suit that has not been bid yet
    nSuit = bidState.nPrefSuit as Suit;
    if (
      bidState.numCardsInSuit[nSuit] >= 5 &&
      this.applySuitStrengthTest(nSuit, nOppBid, bidState) &&
      bidState.nPrefSuit !== nOppSuit &&
      bidState.nPrefSuit !== nOppSuit2
    ) {
      // okeedokee, got a suit
    } else {
      // try the second-best suit
      nSuit = hand.getSuitsByPreference(1);
      if (
        bidState.numCardsInSuit[nSuit] >= 5 &&
        this.applySuitStrengthTest(nSuit, nOppBid, bidState) &&
        bidState.nPrefSuit !== nOppSuit &&
        bidState.nPrefSuit !== nOppSuit2
      ) {
        // we'll use the second suit
      } else {
        const nLevel = nSuit > bidSuit(nOppBid) ? bidLevel(nOppBid) : bidLevel(nOppBid) + 1;
        if (nLevel === 1) {
          status.stream("2OVRCL6! But we don't have a sufficiently strong overcall suit.\n");
        } else {
          status.stream(
            `2OVRCL6a! But we don't have a suit strong enough to overcall with at the ${nLevel}-level.\n`,
          );
        }
        return null;
      }
    }

    // see if we should bid a jump overcall, strong or weak
    let nBid = bidState.getJumpShiftBid(nSuit, nOppBid);
    if (bidLevel(nBid) < 3) {
      if (conventions?.isConventionEnabled(ConventionId.WeakJumpOvercalls)) {
        if (
          bidState.fPts >= bidState.openPts(6) &&
          bidState.fPts <= bidState.openPts(10) &&
          bidState.numCardsInSuit[nSuit] >= 6 &&
          bidState.nSuitStrength[nSuit] >= SuitStrength.Openable
        ) {
          status.stream(
            `OVRCW1! With ${bidState.fPts} pts and a ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit, make a weak jump overcall to ${bidToFullString(nBid)}.\n`,
          );
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.Invoked);
          bidState.setConventionParameter(this, 1);
          return nBid;
        }
      } else {
        if (
          bidState.fPts >= bidState.openPts(15) &&
          bidState.fPts <= bidState.openPts(18) &&
          bidState.numCardsInSuit[nSuit] >= 6 &&
          bidState.nSuitStrength[nSuit] >= SuitStrength.Openable &&
          bidState.numLikelyWinners >= 7
        ) {
          status.stream(
            `OVRCS1! With ${bidState.fPts} pts, a ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit, and ${bidState.numLikelyWinners} likely winners in the hand, make a strong jump overcall to ${bidToFullString(nBid)}.\n`,
          );
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.Invoked);
          bidState.setConventionParameter(this, 1);
          return nBid;
        }
      }
    }

    // here, forget about jump overcalls
    bidState.clearConventionParameter(this);
    nBid = bidState.getCheapestShiftBid(nSuit, nOppBid);
    const nBidLevel = bidLevel(nBid);

    if (nBidLevel >= 3) return null;

    // need 10+ pts and 6 winners to overcall at the 2-level
    if (nBidLevel === 2 && (bidState.fPts < bidState.openPts(10) || bidState.numLikelyWinners < 6)) {
      return null;
    }
    // need 8+ pts and 5 winners to overcall at the 1-level
    if (nBidLevel === 1 && (bidState.fPts < bidState.openPts(8) || bidState.numLikelyWinners < 5)) {
      return null;
    }

    // we're normally restricted to overcalling with 17 or fewer points
    if (bidState.fPts > bidState.openPts(17)) {
      if (conventions?.isConventionEnabled(ConventionId.TakeoutDoubles)) {
        status.stream(
          `OVRCTK! With ${bidState.fCardPts}/${bidState.fPts} points, the hand is too strong for a simple overcall, so start by doubling.\n`,
        );
        bidState.setBid(Bid.Double);
        bidState.setConventionStatus(this, ConventionStatus.Subsumed);
        if (bidState.pool?.takeoutDoubles) {
          bidState.setConventionStatus(bidState.pool.takeoutDoubles, ConventionStatus.Invoked);
        }
        return Bid.Double;
      }
    }

    // whew! we've passed all the tests, so bid
    const strOppBid = bidToFullString(nOppBid);
    status.stream(
      `OVERCL8! Have a good ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit with ${bidState.fPts}/${bidState.fPts} points and ${bidState.numLikelyWinners} playing tricks, so overcall the opponents' ${strOppBid} with a bid of ${bidToFullString(nBid)}.\n`,
    );
    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return nBid;
  }

  //
  // ApplySuitStrengthTest()
  //
  applySuitStrengthTest(nSuit: Suit, nOppBid: Bid, bidState: BidEngine): boolean {
    const fCount =
      bidState.numCardsInSuit[nSuit] +
      bidState.numHonorsInSuit[nSuit] +
      bidState.openPts(bidState.numSuitPoints[nSuit]);
    const nLevel = nSuit > bidSuit(nOppBid) ? bidLevel(nOppBid) : bidLevel(nOppBid) + 1;
    if (nLevel > 2) return false;
    return (
      (nLevel === 1 && fCount >= bidState.openPts(12)) ||
      (nLevel === 2 && fCount >= bidState.openPts(14))
    );
  }

  //
  // RespondToConvention()
  //
  // see if partner made an overcall
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status, conventions } = context;

    if (bidState.getActiveConvention()) return null;

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const numPartnerBidsMade = bidState.m_numPartnerBidsMade;
    const nFirstBid = bidState.getValidBidRecord(0);

    if (
      bidState.m_bPartnerOpenedForTeam &&
      numPartnerBidsMade === 1 &&
      nPartnersBidLevel >= 1 &&
      nPartnersBidLevel <= 2 &&
      nPartnersSuit !== Suit.NoTrump &&
      nPartnersBid !== nFirstBid
    ) {
      bidState.m_bPartnerOvercalled = true;
    } else {
      return null;
    }

    const fPts = bidState.fPts;
    const fAdjPts = bidState.fAdjPts;
    const fCardPts = bidState.fCardPts;
    const nPrefSuit = bidState.nPrefSuit as Suit;

    // state expectations
    if (nPartnersBidLevel === 1) {
      bidState.m_fPartnersMin = bidState.openPts(8);
      bidState.m_fPartnersMax = bidState.openPts(15);
      status.stream(
        `ROVRC1! Partner overcalled at the 1-level, indicating a good 5+ card ${Card.suitToSingularString(nPartnersSuit as Suit)} suit, 8-15 points, and probably 5+ playing tricks.\n`,
      );
    } else if (nPartnersBidLevel === 2) {
      const nGap = nPartnersBid - bidState.nLHOBid;
      if (nGap > 5) {
        if (conventions?.isConventionEnabled(ConventionId.WeakJumpOvercalls)) {
          bidState.m_fPartnersMin = bidState.openPts(6);
          bidState.m_fPartnersMax = bidState.openPts(10);
          status.stream(
            `ROVRC3! Partner made a weak jump overcall of ${bidState.szPB}, indicating ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} pts and a good 6+ card ${Card.suitToSingularString(nPartnersSuit as Suit)} suit.\n`,
          );
        } else {
          bidState.m_fPartnersMin = bidState.openPts(15);
          bidState.m_fPartnersMax = bidState.openPts(18);
          status.stream(
            `ROVRC5! Partner made a strong jump overcall of ${bidState.szPB}, indicating ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} pts, a good 6+ card ${Card.suitToSingularString(nPartnersSuit as Suit)} suit, and probably 6+ playing tricks.\n`,
          );
        }
      } else {
        bidState.m_fPartnersMin = bidState.openPts(10);
        bidState.m_fPartnersMax = bidState.openPts(15);
        status.stream(
          `ROVRC5! Partner overcalled at the 2-level, indicating a good 5+ card ${Card.suitToSingularString(nPartnersSuit as Suit)} suit, ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} points, and probably 6+ playing tricks.\n`,
        );
      }
    } else {
      return null;
    }

    bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;
    const fMinTPPoints = bidState.m_fMinTPPoints;
    const fMaxTPPoints = bidState.m_fMaxTPPoints;
    const fMinTPCPoints = bidState.m_fMinTPCPoints;
    status.stream(
      `ROVRC8! The total point count in the partnership is therefore ${fMinTPPoints}-${fMaxTPPoints} points.\n`,
    );

    // with < 6 points, pass
    if (fPts < 6) {
      status.stream('ROVRC10! This is not enough to bid any higher, so pass.\n');
      bidState.setBid(Bid.Pass);
      return Bid.Pass;
    }

    // see if we have decent support for partner
    if (bidState.nPartnersSuitSupport >= SuitStrength.WeakSupport) {
      if (fMinTPPoints < PTS_GAME - 5) {
        status.stream('ROVRC20! This is insufficient to raise partner, so pass.\n');
        bidState.setBid(Bid.Pass);
        return Bid.Pass;
      }
      if (bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To2, PTS_GAME - 6, PTS_GAME - 4, SupportLength.Len3)) {
        return bidState.m_nBid;
      }
      if (bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To3, PTS_GAME - 3, PTS_GAME - 1, SupportLength.Len3)) {
        return bidState.m_nBid;
      }
      if (bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To4, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3)) {
        return bidState.m_nBid;
      }
      if (bidState.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To5, PTS_MINOR_GAME, PTS_SLAM - 1, SupportLength.Len4)) {
        return bidState.m_nBid;
      }
      if (fPts >= PTS_SLAM && bidState.numSupportCards >= 3) {
        bidState.invokeBlackwood(nPartnersSuit as Suit);
        return bidState.m_nBid;
      }
    }

    // support for partner's suit was inadequate, see if we have a strong 6-card suit
    let nBid: Bid;
    const nLastBid = bidState.nLastValidBid;
    let bJumped = false;

    if (
      bidState.numPrefSuitCards >= 6 &&
      bidState.nPrefSuitStrength >= SuitStrength.Strong &&
      nPrefSuit !== nPartnersSuit &&
      nPrefSuit !== bidState.nLHOSuit &&
      nPrefSuit !== bidState.nRHOSuit
    ) {
      if (fPts < 16) {
        nBid = bidState.getCheapestShiftBid(nPrefSuit, nLastBid);
      } else {
        nBid = bidState.getJumpShiftBid(nPrefSuit, nLastBid, 1);
        if (nBid >= bidState.getGameBid(nPrefSuit)) {
          nBid = bidState.getCheapestShiftBid(nPrefSuit, nLastBid);
        }
        if (nBid - nLastBid > 5) {
          bJumped = true;
        }
      }
      if (!bidState.isBidSafe(nBid)) {
        status.stream(
          `ROVRC20! And although we want to bid our own ${bidState.numPrefSuitCards}-card ${Card.suitToSingularString(nPrefSuit)} suit, we can't bid it at the ${bidLevel(nBid)} with only ${fPts} points, so pass.\n`,
        );
        bidState.setBid(Bid.Pass);
        return Bid.Pass;
      } else {
        if (!bJumped) {
          status.stream(
            `ROVRC24! With a ${bidState.numPrefSuitCards}-card ${Card.suitToSingularString(nPrefSuit)} suit, we bid it in preference to partner's ${Card.suitToString(nPartnersSuit as Suit)} at a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else {
          status.stream(
            `ROVRC26! With a ${bidState.numPrefSuitCards}-card ${Card.suitToSingularString(nPrefSuit)} suit and ${fPts} points, we jump in it in preference to partner's ${Card.suitToString(nPartnersSuit as Suit)} at a bid of ${bidToFullString(nBid)}.\n`,
          );
        }
        bidState.setBid(nBid);
        return nBid;
      }
    }

    // see if we can bid NT
    if (bidState.bidNoTrumpEngine(1, 16, PTS_NT_GAME - 4, false, StoppedCode.DontCare)) {
      return bidState.m_nBid;
    }
    if (bidState.bidNoTrumpEngine(2, PTS_NT_GAME - 3, PTS_GAME - 1, true, StoppedCode.AllOther, nPartnersSuit as Suit)) {
      return bidState.m_nBid;
    }
    if (bidState.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_SLAM - 1, true, StoppedCode.AllOther, nPartnersSuit as Suit)) {
      return bidState.m_nBid;
    }
    if (fMinTPCPoints >= PTS_SLAM && bidState.bSemiBalanced) {
      bidState.invokeBlackwood(Suit.NoTrump);
      return bidState.m_nBid;
    }

    // else with 16+ pts, poor support for partner, cue bid the enemy suit
    if (fPts >= 16) {
      let nOppSuit = bidState.nLHOSuit;
      if (nOppSuit === NONE) nOppSuit = bidState.nRHOSuit;
      nBid = bidState.getCheapestShiftBid(nOppSuit as Suit, nLastBid);
      status.stream(
        `ROVRC60! With poor support for partner's ${Card.suitToString(nPartnersSuit as Suit)} (holding ${bidState.szHP}), no good 6-card suit of our own to bid, and a hand unsuited for NT, cue bid the opponents' ${Card.suitToSingularString(nOppSuit as Suit)} suit at ${bidToFullString(nBid)}.  This bid is forcing.\n`,
      );
    }

    // Otherwise we've fallen through, so pass
    status.stream(
      'ROVRC99! We have insufficient strength for either a raise, suit shift, or NT bid, so pass.\n',
    );
    bidState.setBid(Bid.Pass);
    return Bid.Pass;
  }

  //
  // HandleConventionResponse()
  //
  // Rebidding as opener after an overcall
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status, conventions } = context;

    if (bidState.getConventionStatus(this) !== ConventionStatus.Invoked) {
      return null;
    }
    bidState.clearConventionStatus(this);

    let nBid: Bid = Bid.Pass;
    const fAdjPts = bidState.fAdjPts;
    const fCardPts = bidState.fCardPts;
    const nPrefSuit = bidState.nPrefSuit as Suit;
    const nPreviousBid = bidState.nPreviousBid;
    const nPreviousSuit = bidState.nPreviousSuit;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPreviousBidLevel = bidLevel(nPreviousBid);
    let nPresumedPts: number;

    if (nPreviousBidLevel === 1) {
      nPresumedPts = 8;
    } else {
      if (bidState.getConventionParameter(this) === 1) {
        nPresumedPts = conventions?.isConventionEnabled(ConventionId.WeakJumpOvercalls) ? 10 : 15;
      } else {
        nPresumedPts = 10;
      }
    }

    if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
      return super.handleConventionResponse(context);
    }

    // see what partner bid
    if (nPartnersBid === Bid.Pass) {
      bidState.m_fPartnersMin = 0;
      bidState.m_fPartnersMax = 19 - nPresumedPts;
    } else if (nPartnersSuit === nPreviousSuit) {
      if (nPartnersBidLevel === 2) {
        bidState.m_fPartnersMin = PTS_GAME - 6 - nPresumedPts;
        bidState.m_fPartnersMax = PTS_GAME - 4 - nPresumedPts;
      } else if (nPartnersBidLevel === 3) {
        bidState.m_fPartnersMin = PTS_GAME - 3 - nPresumedPts;
        bidState.m_fPartnersMax = PTS_GAME - 1 - nPresumedPts;
      } else if (nPartnersBidLevel >= 4) {
        bidState.m_fPartnersMin = PTS_GAME - nPresumedPts;
        bidState.m_fPartnersMax = PTS_SLAM - nPresumedPts;
      }
      status.stream(
        `OVRRB10! Partner raised our initial ${bidState.szPVB} overcall to ${bidState.szPB}, indicating 3+ trumps and ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} points.\n`,
      );
    } else if (
      nPartnersSuit !== nPreviousSuit &&
      nPartnersSuit !== Suit.NoTrump &&
      nPartnersSuit !== bidState.nLHOSuit &&
      nPartnersSuit !== bidState.nRHOSuit
    ) {
      if (
        (nPartnersBid - nPreviousBid > 5 && bidState.bLHOPassed) ||
        (!bidState.bLHOPassed && nPartnersBid - bidState.nLHOBid > 5)
      ) {
        bidState.m_fPartnersMin = 16;
        bidState.m_fPartnersMax = Math.min(22, 40 - bidState.fCardPts);
        status.stream(
          `OVRRB20! Partner jumped in his ${bidState.szPS} suit in response to our ${bidState.szPVB} overcall, indicating 6+ cards and approx. ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} points.\n`,
        );
      } else {
        if (nPartnersBidLevel === 1) {
          bidState.m_fPartnersMin = 16 - nPresumedPts;
          bidState.m_fPartnersMax = 19 - nPresumedPts;
        } else if (nPartnersBidLevel === 2) {
          bidState.m_fPartnersMin = 20 - nPresumedPts;
          bidState.m_fPartnersMax = 22 - nPresumedPts;
        } else if (nPartnersBidLevel >= 3) {
          bidState.m_fPartnersMin = 23 - nPresumedPts;
          bidState.m_fPartnersMax = Math.min(22, 40 - bidState.fCardPts);
        }
        status.stream(
          `OVRRB22! Partner bid his own ${bidState.szPS} suit at the ${nPartnersBidLevel} level in response to our ${bidState.szPVB} overcall, indicating 6+ cards and approx. ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} points.\n`,
        );
      }
    } else if (
      nPartnersSuit !== nPreviousSuit &&
      (nPartnersSuit === bidState.nLHOSuit || nPartnersSuit === bidState.nRHOSuit)
    ) {
      bidState.m_fPartnersMin = 16;
      bidState.m_fPartnersMax = Math.min(22, 40 - bidState.fCardPts);
      status.stream(
        `OVRRB30! Partner cue bid the enemy ${bidState.szPS} suit in sresponse to our ${bidState.szPVB} overcall, indicating poor trump support but 16+ points.\n`,
      );
    } else if (nPartnersSuit === Suit.NoTrump) {
      if (nPartnersBidLevel === 1) {
        bidState.m_fPartnersMin = 16 - nPresumedPts;
        bidState.m_fPartnersMax = PTS_GAME - 4 - nPresumedPts;
      } else if (nPartnersBidLevel === 2) {
        bidState.m_fPartnersMin = PTS_GAME - 3 - nPresumedPts;
        bidState.m_fPartnersMax = PTS_GAME - 1 - nPresumedPts;
      } else if (nPartnersBidLevel >= 3) {
        bidState.m_fPartnersMin = PTS_GAME - nPresumedPts;
        bidState.m_fPartnersMax = PTS_SLAM - 1 - nPresumedPts;
      }
      status.stream(
        `OVRRB40! Partner bid ${bidState.szPB} in response to our ${bidState.szPVB} overcall, indicating a balanced hand with approx. ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} HPCs.\n`,
      );
    }

    bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;
    const fMinTPPoints = bidState.m_fMinTPPoints;
    const fMaxTPPoints = bidState.m_fMaxTPPoints;
    const fMinTPCPoints = bidState.m_fMinTPCPoints;
    const fMaxTPCPoints = bidState.m_fMaxTPCPoints;

    // Now determine a plan of action!
    const nLastBid = bidState.nLastValidBid;

    if (nPartnersBid === Bid.Pass) {
      nBid = bidState.getCheapestShiftBid(nPrefSuit, nLastBid);
      if (bidState.numPrefSuitCards < 6) {
        nBid = Bid.Pass;
      } else if (bidState.isBidSafe(nBid)) {
        status.stream(
          `OVRRB50! Despite partner's pass, we have the strength to rebid the suit, so rebid at ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = Bid.Pass;
      }
    } else if (nPartnersSuit === nPreviousSuit) {
      if (fMinTPPoints >= PTS_SLAM) {
        bidState.invokeBlackwood(nPrefSuit);
        nBid = bidState.m_nBid;
      } else if (
        (isMajor(nPartnersSuit) && fMinTPPoints >= PTS_GAME) ||
        (isMinor(nPartnersSuit) && fMinTPPoints >= PTS_MINOR_GAME)
      ) {
        nBid = bidState.getGameBid(nPreviousSuit as Suit);
        status.stream(
          `OVRRB60! With a total of approx. ${fMinTPPoints}-${fMinTPPoints} pts in the partnership, we can raise to game at ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = bidState.getCheapestShiftBid(nPreviousSuit as Suit, nLastBid);
        if (bidState.isBidSafe(nBid)) {
          status.stream(
            `OVRRB66! With a total of approx. ${fMinTPPoints}-${fMinTPPoints} pts in the partnership, we can raise to${
              nBid >= bidState.getGameBid(nPreviousSuit as Suit) ? ' game at ' : ' '
            }${bidToFullString(nBid)}.\n`,
          );
        } else {
          status.stream('OVRRB68! But we lack the strength to raise further, so pass.\n');
          nBid = Bid.Pass;
        }
      }
    } else if (nPartnersSuit === Suit.NoTrump) {
      if (bidState.bSemiBalanced) {
        if (bidState.bidNoTrumpAsAppropriateEngine(false, StoppedCode.DontCare)) {
          nBid = bidState.m_nBid;
          status.stream(
            `OVRRB70! We have a reasonably balanced hand and a total of ${fMinTPCPoints}-${fMaxTPCPoints} HPCs in the partnership, so raise to ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          status.stream(
            `OVRRB72! We can accept a NT contract, and with a total of ${fMinTPCPoints}-${fMaxTPCPoints} HPCs n the partnership, we accept partner's ${bidState.szPB}bid and pass.\n`,
          );
        }
      } else if (bidState.numPrefSuitCards >= 6) {
        nBid = bidState.getCheapestShiftBid(nPrefSuit, nLastBid);
        if (bidState.isBidSafe(nBid)) {
          status.stream(
            `OVRRB76! We don't have a balanced hand, but do have a ${bidState.numPrefSuitCards}-card ${bidState.szPVSS} suit, so rebid it at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          status.stream(
            "OVRRB78! We don't have a balanced hand, but also lack the strength to rebid our suit, so we have to pass.\n",
          );
        }
      } else {
        nBid = Bid.Pass;
        status.stream(
          "OVRRB79! We don't have a balanced hand, but also lack the strength to rebid our suit or another suit, so we have to pass.\n",
        );
      }
    } else {
      const nRebidBid = bidState.getCheapestShiftBid(nPrefSuit, nLastBid);
      const nRebidLevel = bidLevel(nRebidBid);
      if (
        nPartnersBidLevel === 1 &&
        bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.One, PTS_GAME - 5, PTS_SLAM - 1, SupportLength.Len2)
      ) {
        nBid = bidState.m_nBid;
        status.stream(
          `OVRRB80! With a lack of better options, we begrudgingly raise partner to the 2-level with ${bidState.numSupportCards} at a bid of ${bidToFullString(nBid)}.\n`,
        );
      } else if (
        nPartnersBidLevel === 2 &&
        bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.One, PTS_GAME - 3, PTS_SLAM - 1, SupportLength.Len2)
      ) {
        nBid = bidState.m_nBid;
      } else if (
        (nRebidLevel === 2 && fMinTPPoints >= PTS_GAME - 3 && bidState.numPrefSuitCards >= 6) ||
        (nRebidLevel === 3 && fMinTPPoints >= PTS_GAME - 1 && bidState.numPrefSuitCards >= 6)
      ) {
        nBid = nRebidBid;
        status.stream(
          `OVRRB82! We lack the strength to raise partner, so rebid our own ${bidState.numPrefSuitCards}-card suit at ${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.bidNoTrumpAsAppropriateEngine(true, StoppedCode.AllOther, nPartnersSuit as Suit)) {
        nBid = bidState.m_nBid;
      } else {
        nBid = Bid.Pass;
        status.stream(
          `OVRRB80! As we lack agreement in suits and have only ${fMinTPPoints}-${fMaxTPPoints} team points, we have no good options other than to pass.\n`,
        );
      }
    }

    bidState.setBid(nBid);
    return nBid;
  }
}
