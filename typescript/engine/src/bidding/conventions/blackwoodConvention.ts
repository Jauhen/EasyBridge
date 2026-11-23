//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// BlackwoodConvention.cpp -> blackwoodConvention.ts
//

import {
  ACE,
  Bid,
  bidToFullString,
  isSuit,
  makeBid,
  NONE,
  Suit,
} from '../../constants.js';
import { Hand } from '../../hand.js';
import { PlayerStatus } from '../../playerStatus.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_GRAND_SLAM, PTS_SLAM } from '../bidParameters.js';
import { ConventionContext } from '../convention.js';
import { SlamConvention } from '../slamConvention.js';
import type { BidEngine } from '../bidEngine.js';

export class BlackwoodConvention extends SlamConvention {
  constructor() {
    super(ConventionId.Blackwood);
  }

  //
  // ApplyTest()
  //
  // Blackwood can't be started automatically from within this test routine;
  // rather, it has to be triggered by the general bidding code under
  // certain specific circumstances.
  // But responding to Blackwood can take place here.
  //
  override applyTest(context: ConventionContext): Bid | null {
    const resp = this.respondToConvention(context);
    if (resp !== null) return resp;
    const handle = this.handleConventionResponse(context);
    if (handle !== null) return handle;
    return null;
  }

  //
  // InvokeBlackwood()
  //
  // Start the Blackwood convention
  //
  invokeBlackwood(
    hand: Hand,
    bidState: BidEngine,
    status: PlayerStatus | null,
    nEventualSuit: Suit,
  ): boolean {
    if ((nEventualSuit as number) === NONE) return false;
    bidState.m_nAgreedSuit = nEventualSuit;
    const fMinTPPoints = bidState.m_fMinTPPoints;
    const fMaxTPPoints = bidState.m_fMaxTPPoints;
    const fMinTPCPoints = bidState.m_fMinTPCPoints;
    const fMaxTPCPoints = bidState.m_fMaxTPCPoints;
    const fCardPts = bidState.fCardPts;
    const fPts = bidState.fPts;
    const fAdjPts = bidState.fAdjPts;
    let nBid: Bid;

    // if Blackwood has already been used, return
    if (bidState.getConventionStatus(this) >= ConventionStatus.Invoked) {
      return false;
    }

    // if Blackwood is not enabled, just bid slam directly
    if (!bidState.conventions.isConventionEnabled(ConventionId.Blackwood)) {
      status?.stream(
        `BKWDX! we have ${fCardPts}/${fPts}/${fAdjPts} points in hand, for a total of approx. ${fMinTPPoints}-${fMaxTPPoints} / ${fMinTPCPoints}-${fMaxTPCPoints} pts in the partnership, but we can't use Blackwood to investigate Aces and Kings since it's currently not enabled.\n`,
      );
      if (fMinTPPoints >= PTS_GRAND_SLAM + 1 && isSuit(nEventualSuit) && hand.suitHasCard(nEventualSuit, ACE)) {
        nBid = makeBid(nEventualSuit, 7);
        status?.stream(
          `BKWDX1! but since we have the points for a grand slam and we hold the trump ace, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (fMinTPPoints >= PTS_SLAM) {
        nBid = makeBid(nEventualSuit, 6);
        status?.stream(
          `BKWDX2! but since we have the points for a small slam, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = bidState.getCheapestShiftBid(nEventualSuit);
        status?.stream(`BKWDX3! so we just bid ${bidToFullString(nBid)}.\n`);
      }
      bidState.setBid(nBid);
      return true;
    }

    // shouldn't use Blackwood if we have all four aces
    if (bidState.numAces === 4) {
      status?.stream(
        'BKWDY! Unfortunately, since we hold all four aces, Blackwood is of little value to us.\n',
      );
      if (fMinTPPoints >= PTS_SLAM + 1 && isSuit(nEventualSuit) && hand.suitHasCard(nEventualSuit, ACE)) {
        nBid = makeBid(nEventualSuit, 7);
        status?.stream(
          `BKWDY1! so since we have the points for a grand slam, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (fMinTPPoints >= PTS_SLAM) {
        nBid = makeBid(nEventualSuit, 6);
        status?.stream(
          `BKWDY2! so since we have the points for a small slam, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = bidState.getCheapestShiftBid(nEventualSuit, bidState.getLastValidBid());
        status?.stream(
          `BKWDY3! so without quite enough points for a slam, we just bid ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      return true;
    }

    // else we're playing Blackwood and do not hold all four aces
    if (bidState.nPartnersBid < Bid.NT4) {
      nBid = Bid.NT4;
      status?.stream(
        `BLKWD! with ${bidState.fCardPts}/${bidState.fPts}/${bidState.fAdjPts} points in the hand, for a total of approx. ${fMinTPCPoints}-${fMaxTPCPoints} / ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, explore slam possibilities with Blackwood at ${bidToFullString(nBid)}.\n`,
      );
    } else {
      nBid = Bid.Pass;
      status?.stream(
        "BLKWDx! we'd like to use Blackwood, but partner has already bid higher than 4NT, so we have to pass.\n",
      );
    }
    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.InvokedRound1);
    return true;
  }

  //
  // RespondToConvention()
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    const status = context.status;

    if (!bidState) {
      // Stateless fallback for standalone unit tests
      const { hand, bidContext } = context;
      if (bidContext.status === ConventionStatus.RespondedRound1 && bidContext.partnerBid === Bid.NT5) {
        const numKings = hand.numKings;
        const nBid =
          numKings === 0 || numKings === 4
            ? Bid.C6
            : numKings === 1
              ? Bid.D6
              : numKings === 2
                ? Bid.H6
                : Bid.S6;
        bidContext.status = ConventionStatus.RespondedRound2;
        status.stream(
          `BK12! With ${numKings} King${numKings > 1 ? 's,' : ','} respond to partner's Blackwood inquiry with ${bidToFullString(nBid)}.\n`,
        );
        return nBid;
      }
      if (bidContext.partnerBid !== Bid.NT4) return null;
      const numAces = hand.numAces;
      const nBid =
        numAces === 0 || numAces === 4
          ? Bid.C5
          : numAces === 1
            ? Bid.D5
            : numAces === 2
              ? Bid.H5
              : Bid.S5;
      bidContext.status = ConventionStatus.RespondedRound1;
      status.stream(
        `BK10! With ${numAces} Ace${numAces > 1 ? 's,' : ','} respond to partner's Blackwood inquiry with ${bidToFullString(nBid)}.\n`,
      );
      return nBid;
    }

    const nBlackwoodStatus = bidState.getConventionStatus(this);
    const numAces = bidState.numAces;
    const numKings = bidState.numKings;
    let nBid: Bid = Bid.Pass;

    // is partner asking for aces?
    if (bidState.nPartnersBid === Bid.NT4 && bidState.nPreviousSuit !== Suit.NoTrump) {
      if (numAces === 0 || numAces === 4) nBid = Bid.C5;
      else if (numAces === 1) nBid = Bid.D5;
      else if (numAces === 2) nBid = Bid.H5;
      else if (numAces === 3) nBid = Bid.S5;

      status.stream(
        `BK10! With ${numAces} Ace${numAces > 1 ? 's,' : ','} respond to partner's Blackwood inquiry with ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
      return nBid;
    }

    // is partner asking for kings?
    if (nBlackwoodStatus === ConventionStatus.RespondedRound1 && bidState.nPartnersBid === Bid.NT5) {
      if (numKings === 0 || numKings === 4) nBid = Bid.C6;
      else if (numKings === 1) nBid = Bid.D6;
      else if (numKings === 2) nBid = Bid.H6;
      else if (numKings === 3) nBid = Bid.S6;

      status.stream(
        `BK12! With ${numKings} King${numKings > 1 ? 's,' : ','} respond to partner's Blackwood inquiry with ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
      return nBid;
    }

    return null;
  }

  //
  // HandleConventionResponse()
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const status = context.status;

    let nBlackwoodStatus = bidState.getConventionStatus(this);
    const numAces = bidState.numAces;
    const numKings = bidState.numKings;
    const fMinTPPoints = bidState.m_fMinTPPoints;
    const fMaxTPPoints = bidState.m_fMaxTPPoints;
    const fMinTPCPoints = bidState.m_fMinTPCPoints;
    const fMaxTPCPoints = bidState.m_fMaxTPCPoints;
    const nAgreedSuit = bidState.m_nAgreedSuit as Suit;
    const nPartnersBid = bidState.nPartnersBid;
    let nBid: Bid;

    // Did we ask partner for aces in our last bid?
    if (nBlackwoodStatus === ConventionStatus.InvokedRound1) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      switch (nPartnersBid) {
        case Bid.C5:
          bidState.m_numPartnersAces = numAces === 0 ? 4 : 0;
          break;
        case Bid.D5:
          bidState.m_numPartnersAces = 1;
          break;
        case Bid.H5:
          bidState.m_numPartnersAces = 2;
          break;
        case Bid.S5:
          bidState.m_numPartnersAces = 3;
          break;
        default:
          bidState.m_numPartnersAces = 0;
          break;
      }

      if (nPartnersBid <= Bid.S5) {
        status.stream(
          `BK20! Partner responded to our 4NT Blackwood inquiry with ${bidToFullString(nPartnersBid)}, indicating ${bidState.m_numPartnersAces}${bidState.m_numPartnersAces === 0 || bidState.m_numPartnersAces > 1 ? ' Aces' : ' Ace'}.\n`,
        );
      } else {
        status.stream(
          `BK22! Partner made an illegal ${bidToFullString(bidState.nPartnersBid)} response to 4NT Blackwood; assuming zero Aces in partner's hand.\n`,
        );
        bidState.setConventionStatus(this, ConventionStatus.Error);
        return bidState.m_nBid;
      }

      const numTotalAces = bidState.numAces + bidState.m_numPartnersAces;

      if (numTotalAces === 4) {
        if (fMinTPPoints >= PTS_GRAND_SLAM - 1) {
          nBid = Bid.NT5;
          status.stream('BK32! Our team holds all four aces, so proceed to 5NT to ask for kings.\n');
          nBlackwoodStatus = ConventionStatus.InvokedRound2;
        } else {
          nBid = makeBid(nAgreedSuit, 6);
          status.stream(
            `BK32! Our team holds all four aces, but with an estimated ${fMinTPPoints}-${fMaxTPPoints} total partnership points, we lack the points for a grand slam, so settle for a contract of ${bidToFullString(nBid)}.\n`,
          );
          nBlackwoodStatus = ConventionStatus.Finished;
        }
      } else {
        if (numTotalAces < 3 || bidState.m_fMinTPPoints < PTS_SLAM) {
          const nTestBid = bidState.getCheapestShiftBid(nAgreedSuit);
          if (nTestBid <= Bid.NT5) {
            nBid = nTestBid;
            if (numTotalAces < 3)
              status.stream(
                `BK33! Oops, we're caught with only ${numTotalAces} Aces, so halt the bidding at the five-level.\n`,
              );
            else
              status.stream(
                `BK34! Oops, we're caught with as few as ${bidState.m_fMinTPPoints} total points, so halt the bidding at the five-level.\n`,
              );
          } else {
            nBid = makeBid(nAgreedSuit, 6);
          }
        } else {
          nBid = makeBid(nAgreedSuit, 6);
        }
        status.stream(
          `BK38! Without all four aces we can't proceed to a grand slam, so stop at ${bidToFullString(nBid)}.\n`,
        );
        nBlackwoodStatus = ConventionStatus.Finished;
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, nBlackwoodStatus);
      return nBid;
    }

    // Did we ask for kings?
    if (nBlackwoodStatus === ConventionStatus.InvokedRound2) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      switch (nPartnersBid) {
        case Bid.C6:
          bidState.m_numPartnersKings = numKings === 0 ? 4 : 0;
          break;
        case Bid.D6:
          bidState.m_numPartnersKings = 1;
          break;
        case Bid.H6:
          bidState.m_numPartnersKings = 2;
          break;
        case Bid.S6:
          bidState.m_numPartnersKings = 3;
          break;
        default:
          bidState.m_numPartnersKings = 0;
          break;
      }

      if (nPartnersBid <= Bid.S6) {
        status.stream(
          `BK40! Partner responded to our 4NT Blackwood inquiry with ${bidToFullString(nPartnersBid)}, indicating ${bidState.m_numPartnersKings}${bidState.m_numPartnersKings > 1 ? ' Kings' : ' King'}.\n`,
        );
      } else {
        status.stream(
          `BK44! Partner made an illegal ${bidToFullString(nPartnersBid)} response to 4NT Blackwood inquiry; assuming zero Kings in partner's hand.\n`,
        );
        bidState.setConventionStatus(this, ConventionStatus.Error);
        return null;
      }

      const numTotalKings = bidState.numKings + bidState.m_numPartnersKings;
      if (numTotalKings === 4) {
        nBid = makeBid(nAgreedSuit, 7);
        status.stream(
          `BK45! We have all the aces and kings, plus a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, so go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (numTotalKings === 3 && fMinTPPoints >= PTS_GRAND_SLAM) {
        nBid = makeBid(nAgreedSuit, 7);
        status.stream(
          `BK46! We're missing one King, but with a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, we can go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (numTotalKings >= 3 && fMinTPPoints >= PTS_GRAND_SLAM + 1) {
        nBid = makeBid(nAgreedSuit, 7);
        status.stream(
          `BK47! We may not have all the kings, but with a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = makeBid(nAgreedSuit, 6);
        if (nBid > nPartnersBid) {
          status.stream(
            `BK48! Since we're missing ${4 - numTotalKings} Kings and have a total of only ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, we lack sufficient strength for a grand slam and have to settle for a small slam at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.NT6;
          status.stream(
            `BK49! Since we're missing ${4 - numTotalKings} Kings and have a total of only ${fMinTPCPoints}-${fMaxTPCPoints} HCPs in the partnership, we lack sufficient strength for a grand slam and have to settle for a small slam at ${bidToFullString(nBid)}.\n`,
          );
        }
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    return null;
  }
}
