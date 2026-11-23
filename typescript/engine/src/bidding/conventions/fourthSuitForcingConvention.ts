//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// 4thSuitForcingConvention.cpp -> fourthSuitForcingConvention.ts
//

import { Bid, bidToFullString, isMajor, isSuit, makeBid, NONE, Suit } from '../../constants.js';
import { ConventionId } from '../biddingCodes.js';
import {
  PTS_GAME,
  PTS_NT_GAME,
  RaiseTarget,
  SuitStrength,
  SuitType,
  SupportLength,
} from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class FourthSuitForcingConvention extends Convention {
  constructor() {
    super(ConventionId.FourthSuitForcing);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersPrevSuit = bidState.nPartnersPrevSuit;
    const nFirstRoundSuit = bidState.nFirstRoundSuit;
    const nPreviousSuit = bidState.nPreviousSuit;

    if (
      bidState.m_numBidsMade === 1 &&
      bidState.m_numPartnerBidsMade === 2 &&
      nPartnersSuit !== nPartnersPrevSuit &&
      nPartnersPrevSuit !== NONE &&
      nFirstRoundSuit !== nPreviousSuit &&
      nFirstRoundSuit !== NONE &&
      isSuit(nPartnersSuit)
    ) {
      status.stream(
        "SF0! Since we're playing fourth-suit forcing, we are required to respond to partner's bid of the 4th suit.\n",
      );

      const nPartnersBidLevel = bidState.nPartnersBidLevel;
      const nPrefSuit = bidState.nPrefSuit;
      const nPrefSuitStrength = bidState.nPrefSuitStrength;
      const fMinTPPoints = bidState.m_fMinTPPoints;
      const fMaxTPPoints = bidState.m_fMaxTPPoints;
      const fMinTPCPoints = bidState.m_fMinTPCPoints;
      const fMaxTPCPoints = bidState.m_fMaxTPCPoints;
      let nBid: Bid;

      // choice 1: rebid a strong major, if it's our preferred suit, with 22+ pts
      if (isSuit(nPrefSuit) && isMajor(nPrefSuit) && nPrefSuitStrength >= SuitStrength.Strong && fMinTPPoints >= 22) {
        nBid = bidState.getCheapestShiftBid(nPrefSuit);
        status.stream(
          `SF2! With no agreement in suits, along with ${fMinTPPoints}-${fMaxTPPoints} partnership points, return to our preferred ${bidState.szPrefSS} suit at ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        return nBid;
      }

      // bid 3NT with no voids and 26+ HCPs
      if (bidState.numVoids === 0 && nPartnersBidLevel <= 3 && fMinTPCPoints >= PTS_NT_GAME) {
        nBid = Bid.NT3;
        status.stream(
          `SF4! With no agreement in suits, but with ${fMinTPCPoints}-${fMaxTPCPoints} high card points in the partnership and no void suits, bid ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        return nBid;
      }

      // raise to game level with 26+ total pts
      if (
        bidState.raisePartnersSuitEngine(
          SuitType.Prev,
          RaiseTarget.ToNoMoreThanGame,
          PTS_GAME,
          99,
          SupportLength.Len2,
        )
      ) {
        return bidState.m_nBid;
      }

      // raise to 3-level with 23 pts
      if (
        bidState.raisePartnersSuitEngine(
          SuitType.Prev,
          RaiseTarget.To3,
          PTS_GAME - 3,
          99,
          SupportLength.Len2,
        )
      ) {
        return bidState.m_nBid;
      }

      // bid 2NT with no voids
      if (bidState.numVoids === 0 && nPartnersBidLevel <= 2) {
        nBid = Bid.NT2;
        status.stream(
          `SF4! With no agreement in suits, but with ${fMinTPCPoints}-${fMaxTPCPoints} high card points in the partnership and no void suits, bid ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        return nBid;
      }

      // raise partner's first or second suit with single-card support
      if (isSuit(nPartnersPrevSuit) && bidState.numCardsInSuit[nPartnersPrevSuit] >= 1) {
        nBid = bidState.getCheapestShiftBid(nPartnersPrevSuit);
        status.stream(
          `SF20! With no better options, raise partner's first suit to ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = makeBid(nPartnersSuit, nPartnersBidLevel + 1);
        status.stream(
          `SF24! With no better options, raise partner's second suit to ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      return nBid;
    }

    return null;
  }
}
