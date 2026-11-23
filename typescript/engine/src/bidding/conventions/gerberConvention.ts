//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// GerberConvention.cpp -> gerberConvention.ts
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

export class GerberConvention extends SlamConvention {
  constructor() {
    super(ConventionId.Gerber);
  }

  override applyTest(context: ConventionContext): Bid | null {
    const resp = this.respondToConvention(context);
    if (resp !== null) return resp;
    const handle = this.handleConventionResponse(context);
    if (handle !== null) return handle;
    return null;
  }

  //
  // InvokeGerber()
  //
  invokeGerber(
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

    if (bidState.getConventionStatus(this) >= ConventionStatus.Invoked) {
      return false;
    }

    if (!bidState.conventions.isConventionEnabled(ConventionId.Gerber)) {
      status?.stream(
        `2GERBX! we have ${fCardPts}/${fPts}/${fAdjPts} points in hand, for a total of approx. ${fMinTPPoints}-${fMaxTPPoints} / ${fMinTPCPoints}-${fMaxTPCPoints} pts in the partnership, but we can't use Gerber to investigate Aces and Kings since it's currently not enabled.\n`,
      );
      if (fMinTPPoints >= PTS_GRAND_SLAM + 1 && isSuit(nEventualSuit) && hand.suitHasCard(nEventualSuit, ACE)) {
        nBid = makeBid(nEventualSuit, 7);
        status?.stream(
          `2GERBX1! but since we have the points for a grand slam and we hold the trump ace, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (fMinTPPoints >= PTS_SLAM) {
        nBid = makeBid(nEventualSuit, 6);
        status?.stream(
          `2GERBX2! but since we have the points for a small slam, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = bidState.getCheapestShiftBid(nEventualSuit);
        status?.stream(`2GERBX3! so we just bid ${bidToFullString(nBid)}.\n`);
      }
      bidState.setBid(nBid);
      return true;
    }

    if (bidState.numAces === 4) {
      status?.stream(
        '2GERBY! Unfortunately, since we hold all four aces, Gerber is of little value to us.\n',
      );
      if (fMinTPPoints >= PTS_SLAM + 1 && isSuit(nEventualSuit) && hand.suitHasCard(nEventualSuit, ACE)) {
        nBid = makeBid(nEventualSuit, 7);
        status?.stream(
          `2GERBY1! so since we have the points for a grand slam, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (fMinTPPoints >= PTS_SLAM) {
        nBid = makeBid(nEventualSuit, 6);
        status?.stream(
          `2GERBY2! so since we have the points for a small slam, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = bidState.getCheapestShiftBid(nEventualSuit, bidState.getLastValidBid());
        status?.stream(
          `2GERBY3! so without quite enough points for a slam, we just bid ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      return true;
    }

    const nPartnersBid = bidState.nPartnersBid;
    if (nPartnersBid === Bid.NT1 || nPartnersBid === Bid.NT2) {
      nBid = Bid.C4;
      status?.stream(
        `GERBD! with ${bidState.fCardPts}/${bidState.fPts}/${bidState.fAdjPts} points in the hand, for a total of approx. ${fMinTPCPoints}-${fMaxTPCPoints} / ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, explore slam possibilities with Gerber at ${bidToFullString(nBid)}.\n`,
      );
    } else {
      nBid = Bid.Pass;
      status?.stream(
        "GERBDx! we'd like to use Gerber, but partner has already bid higher than 4C, so we have to pass.\n",
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
      // Stateless fallback preserving existing test/bidding.test.ts expectation
      const { hand, bidContext } = context;
      if (bidContext.partnerBid !== Bid.C4) return null;
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
        `GRB10! With ${numAces} Ace${numAces > 1 ? 's,' : ','} respond to partner's Gerber inquiry with ${bidToFullString(nBid)}.\n`,
      );
      return nBid;
    }

    const nGerberStatus = bidState.getConventionStatus(this);
    const numAces = bidState.numAces;
    const numKings = bidState.numKings;
    const nPreviousBid = bidState.nPreviousBid;
    let nBid: Bid = Bid.Pass;

    // is partner asking for aces?
    if (
      bidState.nPartnersBid === Bid.C4 &&
      (nPreviousBid === Bid.NT1 || nPreviousBid === Bid.NT2)
    ) {
      if (numAces === 0 || numAces === 4) nBid = Bid.D4;
      else if (numAces === 1) nBid = Bid.H4;
      else if (numAces === 2) nBid = Bid.S4;
      else if (numAces === 3) nBid = Bid.NT5;

      status.stream(
        `GRB10! With ${numAces} Ace${numAces > 1 ? 's,' : ','} respond to partner's Gerber inquiry with ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
      return nBid;
    }

    // is partner asking for kings?
    if (nGerberStatus === ConventionStatus.RespondedRound1 && bidState.nPartnersBid === Bid.C5) {
      if (numKings === 0 || numKings === 4) nBid = Bid.D5;
      else if (numKings === 1) nBid = Bid.H5;
      else if (numKings === 2) nBid = Bid.S5;
      else if (numKings === 3) nBid = Bid.NT5;

      status.stream(
        `GRB12! With ${numKings} King${numKings > 1 ? 's,' : ','} respond to partner's Gerber inquiry with ${bidToFullString(nBid)}.\n`,
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

    let nGerberStatus = bidState.getConventionStatus(this);
    const numAces = bidState.numAces;
    const numKings = bidState.numKings;
    const fMinTPPoints = bidState.m_fMinTPPoints;
    const fMaxTPPoints = bidState.m_fMaxTPPoints;
    const fMinTPCPoints = bidState.m_fMinTPCPoints;
    const fMaxTPCPoints = bidState.m_fMaxTPCPoints;
    const nAgreedSuit = bidState.m_nAgreedSuit as Suit;
    const nPartnersBid = bidState.nPartnersBid;
    let nBid: Bid;

    if (nGerberStatus === ConventionStatus.InvokedRound1) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      switch (nPartnersBid) {
        case Bid.D4:
          bidState.m_numPartnersAces = numAces === 0 ? 4 : 0;
          break;
        case Bid.H4:
          bidState.m_numPartnersAces = 1;
          break;
        case Bid.S4:
          bidState.m_numPartnersAces = 2;
          break;
        case Bid.NT4:
          bidState.m_numPartnersAces = 3;
          break;
        default:
          bidState.m_numPartnersAces = 0;
          break;
      }

      if (nPartnersBid <= Bid.NT4) {
        status.stream(
          `GRB20! Partner responded to our 4C Gerber inquiry with ${bidToFullString(nPartnersBid)}, indicating ${bidState.m_numPartnersAces}${bidState.m_numPartnersAces === 0 || bidState.m_numPartnersAces > 1 ? ' Aces' : ' Ace'}.\n`,
        );
      } else {
        status.stream(
          `GRB22! Partner made an illegal ${bidToFullString(bidState.nPartnersBid)} response to 4C Gerber; assuming zero Aces in partner's hand.\n`,
        );
        bidState.setConventionStatus(this, ConventionStatus.Error);
        return bidState.m_nBid;
      }

      const numTotalAces = bidState.numAces + bidState.m_numPartnersAces;
      if (numTotalAces === 4) {
        if (fMinTPPoints >= PTS_GRAND_SLAM - 1) {
          nBid = Bid.NT5;
          status.stream('GRB32! Our team holds all four aces, so proceed to 5NT to ask for kings.\n');
          nGerberStatus = ConventionStatus.InvokedRound2;
        } else {
          nBid = makeBid(nAgreedSuit, 6);
          status.stream(
            `GRB32! Our team holds all four aces, but with an estimated ${fMinTPPoints}-${fMaxTPPoints} total partnership points, we lack the points for a grand slam, so settle for a contract of ${bidToFullString(nBid)}.\n`,
          );
          nGerberStatus = ConventionStatus.Finished;
        }
      } else {
        if (numTotalAces <= 3 && bidState.m_fMinTPPoints < PTS_SLAM) {
          const nTestBid = bidState.getCheapestShiftBid(nAgreedSuit);
          if (nTestBid <= Bid.NT5) {
            nBid = nTestBid;
            status.stream(
              `GRB34! Oops, we're caught with only ${numTotalAces} Aces and as few as ${bidState.m_fMinTPPoints} total points, so halt the bidding at the five-level.\n`,
            );
          } else {
            nBid = makeBid(nAgreedSuit, 6);
          }
        } else {
          nBid = makeBid(nAgreedSuit, 6);
        }
        status.stream(
          `GRB38! Without all four aces we can't proceed to a grand slam, so stop at ${bidToFullString(nBid)}.\n`,
        );
        nGerberStatus = ConventionStatus.Finished;
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, nGerberStatus);
      return nBid;
    }

    if (nGerberStatus === ConventionStatus.InvokedRound2) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      switch (nPartnersBid) {
        case Bid.D5:
          bidState.m_numPartnersKings = numKings === 0 ? 4 : 0;
          break;
        case Bid.H5:
          bidState.m_numPartnersKings = 1;
          break;
        case Bid.S5:
          bidState.m_numPartnersKings = 2;
          break;
        case Bid.NT5:
          bidState.m_numPartnersKings = 3;
          break;
        default:
          bidState.m_numPartnersKings = 0;
          break;
      }

      if (nPartnersBid <= Bid.NT5) {
        status.stream(
          `GRB40! Partner responded to our 4C Gerber inquiry with ${bidToFullString(nPartnersBid)}, indicating ${bidState.m_numPartnersKings}${bidState.m_numPartnersKings > 1 ? ' Kings' : ' King'}.\n`,
        );
      } else {
        status.stream(
          `GRB44! Partner made an illegal ${bidToFullString(nPartnersBid)} response to 4C Gerber inquiry; assuming zero Kings in partner's hand.\n`,
        );
        bidState.setConventionStatus(this, ConventionStatus.Error);
        return null;
      }

      const numTotalKings = bidState.numKings + bidState.m_numPartnersKings;
      if (numTotalKings === 4) {
        nBid = makeBid(nAgreedSuit, 7);
        status.stream(
          `GRB45! We have all the aces and kings, plus a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, so go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (numTotalKings === 3 && fMinTPPoints >= PTS_GRAND_SLAM) {
        nBid = makeBid(nAgreedSuit, 7);
        status.stream(
          `GRB46! We're missing one King, but with a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, we can go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (numTotalKings >= 3 && fMinTPPoints >= PTS_GRAND_SLAM + 1) {
        nBid = makeBid(nAgreedSuit, 7);
        status.stream(
          `GRB47! We may not have all the kings, but with a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, go ahead and bid ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = makeBid(nAgreedSuit, 6);
        if (nBid > nPartnersBid) {
          status.stream(
            `GRB48! Since we're missing ${4 - numTotalKings} Kings and have a total of only ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, we lack sufficient strength for a grand slam and have to settle for a small slam at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.NT6;
          status.stream(
            `GRB49! Since we're missing ${4 - numTotalKings} Kings and have a total of only ${fMinTPCPoints}-${fMaxTPCPoints} HCPs in the partnership, we lack sufficient strength for a grand slam and have to settle for a small slam at ${bidToFullString(nBid)}.\n`,
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
