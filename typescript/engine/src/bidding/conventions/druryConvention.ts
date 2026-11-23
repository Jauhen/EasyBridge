//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// DruryConvention.cpp -> druryConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidLevel,
  bidSuit,
  bidToFullString,
  isBid,
  isMajor,
  isSuit,
  makeBid,
  Suit,
} from '../../constants.js';
import { REVALUE_DECLARER, REVALUE_DUMMY } from '../../hand.js';
import { BiddingOption, ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_MAJOR_GAME } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class DruryConvention extends Convention {
  constructor() {
    super(ConventionId.Drury);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    const nOpeningBid = bidState.getOpeningBid();
    const nPartnersBid = bidState.nPartnersBid;
    const numTotalBidTurns = bidState.nBiddingOrder;

    if (
      bidState.m_numBidTurns === 1 &&
      bidState.nPreviousBid === Bid.Pass &&
      isBid(nOpeningBid) &&
      nOpeningBid === nPartnersBid &&
      (numTotalBidTurns === 4 || numTotalBidTurns === 5) &&
      isMajor(bidSuit(nPartnersBid)) &&
      bidState.nPartnersBidLevel === 1
    ) {
      // passed conditions 1-4
    } else {
      return null;
    }

    const nSuit = bidSuit(nPartnersBid) as Suit;
    const fPts = hand.revalueHand(REVALUE_DUMMY, nSuit, true);
    if (fPts >= 11 && fPts <= 12 && bidState.numSupportCards >= 3) {
      // passed condition 5
    } else {
      return null;
    }

    status.stream(
      `DRUR1! Partner opened ${bidToFullString(nPartnersBid)} in ${numTotalBidTurns === 4 ? '3rd' : '4th'} position after our initial pass, so with ${fPts} pts and ${bidState.numSupportCards}-card trump support, we can bid Drury at 2C.\n`,
    );
    bidState.setBid(Bid.C2);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return Bid.C2;
  }

  //
  // RespondToConvention()
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    const nPartnersBid = bidState.nPartnersBid;
    const nPreviousBid = bidState.nPreviousBid;
    const nStatus = bidState.getConventionStatus(this);

    if (nStatus === ConventionStatus.Inactive) {
      const nOpeningBid = bidState.getOpeningBid();
      const numTotalBidTurns = bidState.nBiddingOrder;

      if (
        bidState.m_numBidTurns === 1 &&
        isMajor(bidSuit(nPreviousBid)) &&
        bidLevel(nPreviousBid) === 1 &&
        nOpeningBid === nPreviousBid &&
        (numTotalBidTurns === 6 || numTotalBidTurns === 7) &&
        bidState.m_numPartnerBidTurns === 2 &&
        bidState.nPartnersOpeningBid === Bid.Pass &&
        nPartnersBid === Bid.C2
      ) {
        // passed
      } else {
        return null;
      }

      status.stream(
        `DRUR10! Partner has made a Drury bid of 2 Club, indicating ${bidState.openPts(11)}-${bidState.openPts(12)} pts and 3+ card support.\n`,
      );

      const nSuit = bidState.nPreviousSuit as Suit;
      bidState.setAgreedSuit(nSuit);
      bidState.adjustPartnershipPoints(11, 12);

      let nBid: Bid;
      if (bidState.fCardPts <= bidState.openPts(12)) {
        nBid = makeBid(nSuit, 2);
        status.stream(
          `DRUR12! But since we opened light with only ${bidState.fCardPts} HCPs, we have to respond in the original ${Card.suitToSingularString(nSuit)} suit at the 2-level and bid ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = Bid.D2;
        status.stream(
          `DRUR14! And since we opened with a legitemate ${bidState.fCardPts} HCPs, we can respond to Partner's Drury with 2 Diamonds.\n`,
        );
      }

      bidState.fPts = hand.revalueHand(REVALUE_DECLARER, nSuit, true);
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
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
    const { hand, status } = context;

    const nStatus = bidState.getConventionStatus(this);
    if (nStatus !== ConventionStatus.InvokedRound1 && nStatus !== ConventionStatus.InvokedRound2) {
      return null;
    }

    const nSuit = bidState.nPartnersPrevSuit as Suit;
    if (nStatus === ConventionStatus.Invoked && isSuit(nSuit)) {
      let nBid: Bid;
      if (bidState.nPartnersBid === Bid.D2) {
        status.stream(
          `DRUR40! Partner responded to our Drury with a bid of 2D, indicating a normal opening hand of ${bidState.openPts(12)}+ HCPs.\n`,
        );
        bidState.fAdjPts = hand.revalueHand(REVALUE_DUMMY, nSuit, true);
        bidState.adjustPartnershipPoints(
          12,
          bidState.conventions.getValue(BiddingOption.TwoClubOpeningPoints),
        );

        if (bidState.m_fMinTPPoints >= PTS_MAJOR_GAME) {
          nBid = makeBid(nSuit, 4);
          status.stream(
            `DRUR42! And with an adjusted count of  pts in hand, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts, we can go ahead and bid game at ${bidToFullString(nBid)}.\n`,
          );
        } else if (bidState.m_fMinTPPoints >= PTS_MAJOR_GAME - 3) {
          nBid = makeBid(nSuit, 3);
          status.stream(
            `DRUR43! With an adjusted point of  pts in hand, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts, we can push to a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = makeBid(nSuit, 2);
          status.stream(
            `DRUR44! But with an adjusted count of only  pts in hand, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts, we have to stop at ${bidToFullString(nBid)}.\n`,
          );
        }
      } else if (bidState.nPartnersBid === makeBid(nSuit, 2)) {
        nBid = Bid.Pass;
        status.stream(
          `DRUR46! Partner did his original ${Card.suitToSingularString(nSuit)} at the 2-level, indicating subpar opening values, so we have to pass.\n`,
        );
      } else {
        nBid = Bid.Pass;
        status.stream(
          `DRUR49! Partner did not respond with 2D or 2${Card.getSuitLetter(nSuit)} to our Drury bid, so the convention is off and we have to pass.\n`,
        );
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    bidState.setConventionStatus(this, ConventionStatus.Error);
    return null;
  }
}
