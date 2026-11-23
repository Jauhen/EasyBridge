//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// SplinterBidsConvention.cpp -> splinterBidsConvention.ts
//

import { Card } from '../../card.js';
import { Bid, bidToFullString, isMinor, isSuit, Suit } from '../../constants.js';
import { REVALUE_DECLARER } from '../../hand.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_SLAM, ShiftTarget } from '../bidParameters.js';
import { ConventionContext } from '../convention.js';
import { SlamConvention } from '../slamConvention.js';

export class SplinterBidsConvention extends SlamConvention {
  constructor() {
    super(ConventionId.SplinterBids);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;

    if (
      nPartnersBidLevel === 1 &&
      nPartnersBid !== Bid.NT1 &&
      bidState.m_bPartnerOpenedForTeam &&
      bidState.m_numPartnerBidsMade === 1 &&
      bidState.bRHOPassed &&
      bidState.m_numBidTurns === 0 &&
      bidState.numSupportCards >= 4 &&
      bidState.fAdjPts >= 13 &&
      bidState.fAdjPts <= 18 &&
      (bidState.numVoids >= 1 || bidState.numSingletons >= 1) &&
      isSuit(nPartnersSuit)
    ) {
      // met rqmts
    } else {
      return null;
    }

    if (isMinor(nPartnersSuit)) return null;

    let nSuit: Suit = Suit.Clubs;
    if (bidState.numVoids >= 1) {
      for (let i = 0; i < 4; i++) {
        if (bidState.numCardsInSuit[i] === 0) {
          nSuit = i as Suit;
          break;
        }
      }
    } else {
      for (let i = 0; i < 4; i++) {
        if (bidState.numCardsInSuit[i] === 1) {
          nSuit = i as Suit;
          break;
        }
      }
    }

    const nBid = bidState.getJumpShiftBid(nSuit, nPartnersBid, ShiftTarget.Jump2);
    status.stream(
      `SPLINT! With ${bidState.fCardPts}/${bidState.fPts}/${bidState.fAdjPts} points and ${bidState.numSupportCards}-card trump support  (holding ${bidState.szHP}), bid a splinter at ${bidToFullString(nBid)} to show possible interest in slam.\n`,
    );

    bidState.m_nAgreedSuit = nPartnersSuit;
    bidState.setBid(nBid);
    return nBid;
  }

  //
  // RespondToConvention()
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    if (bidState.getActiveConvention()) return null;

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPreviousBid = bidState.nPreviousBid;
    const nPreviousBidLevel = bidState.nPreviousBidLevel;
    const nPreviousSuit = bidState.nPreviousSuit;
    const nJumpLevel = Math.trunc((nPartnersBid - nPreviousBid) / 5);

    if (
      nPreviousBidLevel === 1 &&
      nPreviousBid !== Bid.NT1 &&
      bidState.bLHOPassed &&
      bidState.m_numPartnerBidsMade === 1 &&
      bidState.m_numPartnerBidTurns === 1 &&
      nJumpLevel === 2 &&
      nPartnersSuit !== nPreviousSuit &&
      isSuit(nPartnersSuit) &&
      isSuit(nPreviousSuit)
    ) {
      // splinter response found
    } else {
      return null;
    }

    bidState.m_fPartnersMin = 13;
    bidState.m_fPartnersMax = Math.min(22, 40 - bidState.fCardPts);
    bidState.m_nAgreedSuit = nPreviousSuit;

    let fAdjPts = (bidState.fAdjPts = hand.revalueHand(REVALUE_DECLARER, nPreviousSuit, true));
    fAdjPts += hand.getSuit(nPartnersSuit).numLosers;

    bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = bidState.fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = bidState.fCardPts + bidState.m_fPartnersMax;

    const fMinTPPoints = bidState.m_fMinTPPoints;
    const fMaxTPPoints = bidState.m_fMaxTPPoints;

    status.stream(
      `SPLNTR! Partner's ${bidState.szPB} bid is a splinter, indicating 13+ points, 4+ trumps, and a singleton or void in ${Card.suitToString(nPartnersSuit)}.  The bid is invitational towards slam.\n`,
    );
    status.stream(
      `2SPLNTRa! After adjusting for the fit with partner, we have a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership.\n`,
    );

    if (bidState.m_fMaxTPPoints < PTS_SLAM) {
      const nBid = bidState.getGameBid(nPreviousSuit);
      status.stream(
        `SPLNTR10! But with our weak hand, the maximum adjusted point count for both hands is ${fMinTPPoints}-${fMaxTPPoints} points, so stop at a game bid of ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
    } else {
      status.stream(
        `SPLNTR20! The total strength of both hands is ${fMinTPPoints}-${fMaxTPPoints} points, plus good distribution, so push on towards a slam.\n`,
      );
      bidState.invokeBlackwood(nPreviousSuit);
    }
    bidState.setConventionStatus(this, ConventionStatus.Finished);
    return bidState.m_nBid;
  }

  //
  // HandleConventionResponse()
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    if (bidState.getConventionStatus(this) !== ConventionStatus.Invoked) {
      return null;
    }

    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersPrevSuit = bidState.nPartnersPrevSuit;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;

    if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
      return super.handleConventionResponse(context);
    }

    if (nPartnersSuit === nPartnersPrevSuit && nPartnersBidLevel < 6) {
      status.stream(
        `SPLNTRb1! Partner returned to his ${bidState.szPPSS} suit, showing no interest in slam, so sign off and pass.\n`,
      );
      bidState.setBid(Bid.Pass);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return Bid.Pass;
    }

    bidState.setConventionStatus(this, ConventionStatus.Finished);
    return null;
  }
}
