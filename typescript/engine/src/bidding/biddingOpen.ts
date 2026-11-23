//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// BiddingOpen.cpp -> biddingOpen.ts
//
// Opening bidding routines
//

import { Card } from '../card.js';
import { Bid, bidToFullString, makeBid, Suit } from '../constants.js';
import { ConventionId } from './biddingCodes.js';
import {
  NIB_JUMP_NT,
  NIB_NT,
  OB_11_HCPS_6CS,
  OB_11_HCPS_RBS_LM,
  OB_13_TCPS_LS,
  OB_14_TCPS_GS,
  OB_14_TCPS_LS,
  OT_OPENER,
  SuitStrength,
  SuitType,
} from './bidParameters.js';
import type { BidEngine } from './bidEngine.js';

//
// MakeOpeningBid()
//
// make initial bid
//
export function makeOpeningBidEngine(e: BidEngine): Bid {
  const status = e.status;
  status?.stream('2Opening bid for team.\n');

  //
  // First check to see if we can open using a convention
  // e.g., weak 2, strong 2, preemptive 3/4, etc.
  //
  if (e.applyConventionTestsInternal()) {
    return e.validateBid(e.m_nBid);
  }

  //
  // see if we can open No Trumps
  //
  const ntMin = [
    e.conventions.getValue(ConventionId.OneNTRangeMinPts),
    e.conventions.getValue(ConventionId.TwoNTRangeMinPts),
    e.conventions.getValue(ConventionId.ThreeNTRangeMinPts),
  ];
  const ntMax = [
    e.conventions.getValue(ConventionId.OneNTRangeMaxPts),
    e.conventions.getValue(ConventionId.TwoNTRangeMaxPts),
    e.conventions.getValue(ConventionId.ThreeNTRangeMaxPts),
  ];

  let skipNT = false;
  if (e.bBalanced && e.fCardPts >= e.openPts(ntMin[0])) {
    status?.stream(`A00! Have ${e.fCardPts} HCP's with a balanced hand.\n`);

    // but if we have a good 5-card major, open it in a suit
    // but not if we have to overcall to do so
    const needToOvercall = (e.nLHOBid > Bid.Pass || e.nRHOBid > Bid.Pass) && e.nPartnersBid <= Bid.Pass;
    if (e.isSuitOpenable(Suit.Hearts) && !needToOvercall) {
      status?.stream(
        `A02! But with an openable ${e.numCardsInSuit[Suit.Hearts]}-card Heart suit, prefer to open in the major instead of in No Trump.\n`,
      );
      skipNT = true;
    } else if (e.isSuitOpenable(Suit.Spades) && !needToOvercall) {
      status?.stream(
        `A04! But with an openable ${e.numCardsInSuit[Suit.Spades]}-card Spade suit, prefer to open in the major instead of in No Trump.\n`,
      );
      skipNT = true;
    }

    if (!skipNT) {
      // check range for 1NT
      if (e.fCardPts >= e.openPts(ntMin[0]) && e.fCardPts <= ntMax[0]) {
        e.m_nBid = Bid.NT1;
        status?.stream(
          `A08! This meet the rqmts for the 1NT opening range (${ntMin[0]}-${ntMax[0]}), so bid 1NT.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else if (e.fCardPts > e.openPts(ntMax[0]) && e.fCardPts < ntMin[1]) {
        // in-between 1 & 2 situation; bid interim suit
        e.m_nNextIntendedBid = NIB_JUMP_NT;
        if (e.numOpenableSuits > 0) {
          e.m_nBid = e.getLowestOpenableBid(SuitType.Any, OT_OPENER, 1);
          status?.stream(
            `A10! This exceeds the max pts for a 1NT opening (${ntMax[0]}), but is less than min pts for 2NT (${ntMin[1]}).  So bid the lowest openable suit of ${bidToFullString(e.m_nBid)} for now, then try for a jump shift to 2NT later.\n`,
          );
        } else {
          if (!e.playingConvention(ConventionId.FiveCardMajors)) {
            e.m_nBid = makeBid(e.nPrefSuit as Suit, 1);
          } else {
            e.m_nBid = Bid.C1;
          }
          status?.stream(
            `A14! This exceeds the max pts for a 1NT opening (${ntMax[0]}), but is less than min pts for 2NT (${ntMin[1]} and we have no good openable suit, so just bid ${bidToFullString(e.m_nBid)} for now.\n`,
          );
        }
        return e.validateBid(e.m_nBid);
      } else if (e.fCardPts >= e.openPts(ntMin[1]) && e.fCardPts <= ntMax[1]) {
        e.m_nBid = Bid.NT2;
        status?.stream(
          `A20! This meets the rqmts for a 2NT opening (${ntMin[1]}-${ntMax[1]}), so bid 2NT.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else if (e.fCardPts >= e.openPts(ntMax[1]) && ntMin[2] < 0) {
        e.m_nBid = Bid.C2;
        status?.stream(
          `A30! This exceeds the max pts for a 2NT opening (${ntMax[1]}), but a 3NT opening has been disallowed, so open with ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else if (e.fCardPts > e.openPts(ntMax[1]) && e.fCardPts < ntMin[2]) {
        e.m_nNextIntendedBid = NIB_NT;
        if (e.numOpenableSuits > 0) {
          e.m_nBid = e.getLowestOpenableBid(SuitType.Any, OT_OPENER, 1);
          status?.stream(
            `A40! This exceeds the max pts for a 2NT opening (${ntMax[1]}), but is less than min pts for 3NT (${ntMin[2]}).  So bid the lowest openable suit of ${bidToFullString(e.m_nBid)} for now, then jump shift to NT later.\n`,
          );
        } else {
          e.m_nBid = makeBid(e.nPrefSuit as Suit, 1);
          status?.stream(
            `A42! This exceeds the max pts for a 2NT opening (${ntMax[1]}), but is less than min pts for 3NT (${ntMin[2]}), and have no good openable suit, so bid ${bidToFullString(e.m_nBid)} for now.\n`,
          );
        }
        return e.validateBid(e.m_nBid);
      } else if (e.fCardPts >= e.openPts(ntMin[2]) && e.fCardPts <= ntMax[2]) {
        e.m_nBid = Bid.NT3;
        status?.stream('A50! Bid 3NT.\n');
        return e.validateBid(e.m_nBid);
      } else {
        e.m_nBid = Bid.NT3;
        status?.stream('A60! bid 3NT.\n');
        return e.validateBid(e.m_nBid);
      }
    }
  }

  //
  // See if we can open at the 1-level
  //
  if (e.nLHOBid > Bid.Pass || e.nRHOBid > Bid.Pass) {
    status?.stream('B00! We cannot overcall and the hand is not appropriate for any other bid, so pass.\n');
    e.m_nBid = Bid.Pass;
    return e.validateBid(e.m_nBid);
  }

  const nSuit = e.getBestOpeningSuit();
  e.nSuit = nSuit;

  // case 1: 14+ points in high cards
  if (e.fCardPts >= e.openPts(14)) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(`E01! Have ${e.fCardPts} points in high cards, so bid ${bidToFullString(e.m_nBid)}.\n`);
    return e.validateBid(e.m_nBid);
  }
  // case 2: 13+ HCP's && 2 QT's
  if (e.fCardPts >= e.openPts(13) && e.numQuickTricks >= 2) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E02! Have ${e.fCardPts} points in high cards and ${e.numQuickTricks} quick tricks, so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  // case 3: 12+ HCP's, 2 QT's, & a rebiddable suit
  if (e.fCardPts >= e.openPts(12) && e.numQuickTricks >= 2 && e.numRebiddableSuits > 0) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E03! Have ${e.fCardPts} points in high cards, ${e.numQuickTricks} quick tricks, and a rebiddable suit in ${Card.suitToString(nSuit)}, so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  // case 4: 12+ HCP's, 2 QT's, & a 5-card suit
  if (e.fCardPts >= e.openPts(12) && e.numQuickTricks >= 2 && (e.hand?.getNumSuitsOfAtLeast(5) ?? 0) > 0) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E04! Have ${e.fCardPts} points in high cards, ${e.numQuickTricks} quick tricks, and a ${e.numCardsInSuit[nSuit]}-card suit, so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  // case 5: 12+ HCP's & a balanced dist in Weak NTs
  if (e.fCardPts >= e.openPts(12) && e.bBalanced && e.conventions.getValue(ConventionId.OneNTRange) === 0) {
    e.m_nBid = Bid.NT1;
    status?.stream(
      `E05! Have ${e.fCardPts} points in high cards, a balanced hand, and playing Weak No Trumps, so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  // case 6: 10+ HCPs opening in 3rd or 4th seat & a good suit
  if (e.fCardPts >= e.openPts(10) && (e.nBiddingOrder === 2 || e.nBiddingOrder === 3) && e.numOpenableSuits > 0) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E07! Have ${e.fCardPts} points in high cards in ${e.nBiddingOrder === 2 ? '3rd' : '4th'} position and a ${e.suitStrengthToString(nSuit)} ${Card.suitToSingularString(nSuit)} suit, so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  // case 7: 15+ Total points and 10 HCPs, with 2 QTs
  if (e.fPts >= e.openPts(15) && e.fCardPts >= e.openPts(10) && e.numQuickTricks >= 2) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E08! Have ${e.fCardPts}/${e.fPts} total points with ${e.numQuickTricks} QT's, so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  // case 8: 14+ Total points with 10+ HCPs, 2 QTs and a rebiddable suit
  if (e.fPts >= e.openPts(14) && e.fCardPts >= e.openPts(10) && e.numQuickTricks >= 2 && e.numRebiddableSuits > 0) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E09! Have ${e.fCardPts}/${e.fPts} total points with ${e.numQuickTricks} QT's and a rebiddable suit, so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  // case 9: 13+ Total points with 10+ HCPs, 2 QTs and a rebiddable suit of 6+ cards
  if (
    e.fPts >= e.openPts(13) &&
    e.fCardPts >= e.openPts(10) &&
    e.numQuickTricks >= 2 &&
    e.numRebiddableSuits > 0 &&
    e.numPrefSuitCards >= 6 &&
    e.nSuitStrength[e.nPrefSuit] > SuitStrength.Openable
  ) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E10! Have ${e.fCardPts}/${e.fPts} total points with ${e.numQuickTricks} QT's and a ${e.numCardsInSuit[nSuit]}-card rebiddable suit, so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }

  //
  // now test for optional 1-level openings
  //
  const allowed1Opens = e.conventions.getValue(ConventionId.Allowable1Openings);
  if (
    (allowed1Opens & OB_11_HCPS_RBS_LM) !== 0 &&
    e.fCardPts >= e.openPts(11) &&
    e.numQuickTricks >= 2 &&
    e.numRebiddableSuits > 0 &&
    e.numCardsInSuit[Suit.Hearts] >= 4 &&
    e.numCardsInSuit[Suit.Spades] >= 4
  ) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E21! Have ${e.fCardPts} points in high cards, ${e.numQuickTricks} quick tricks, a rebiddable suit, and length in both majors (optional opening condition #1), so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  if (
    (allowed1Opens & OB_11_HCPS_6CS) !== 0 &&
    e.fCardPts >= e.openPts(11) &&
    e.numQuickTricks >= 2 &&
    (e.hand?.getNumSuitsOfAtLeast(6) ?? 0) > 0
  ) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E22! Have ${e.fCardPts} points in high cards with ${e.numQuickTricks} QT's and a ${e.numCardsInSuit[nSuit]}-card suit (optional opening condition #2), so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  if (
    (allowed1Opens & OB_14_TCPS_GS) !== 0 &&
    e.fPts >= e.openPts(14) &&
    e.fCardPts >= e.openPts(10) &&
    e.numQuickTricks >= 2 &&
    e.numSolidSuits > 0
  ) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E23! Have ${e.fCardPts}/${e.fPts}total points with ${e.numQuickTricks} QT's and a ${e.suitStrengthToString(nSuit)} ${Card.suitToSingularString(nSuit)} suit (optional opening condition #3), so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  if (
    (allowed1Opens & OB_14_TCPS_LS) !== 0 &&
    e.fPts >= e.openPts(14) &&
    e.fCardPts >= e.openPts(10) &&
    e.numQuickTricks >= 2 &&
    (e.hand?.getNumSuitsOfAtLeast(6) ?? 0) > 0
  ) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E24! Have ${e.fCardPts}/${e.fPts} total points with ${e.numQuickTricks} QT's and a ${e.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit (optional opening condition #4), so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }
  if (
    (allowed1Opens & OB_13_TCPS_LS) !== 0 &&
    e.fPts >= e.openPts(13) &&
    e.fCardPts >= e.openPts(10) &&
    e.numQuickTricks >= 2 &&
    (e.hand?.getNumSuitsOfAtLeast(6) ?? 0) > 0
  ) {
    e.m_nBid = makeBid(nSuit, 1);
    status?.stream(
      `E25! Have ${e.fCardPts}/${e.fPts} total points with ${e.numQuickTricks} QT's and a ${e.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit (optional opening condition #5), so bid ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  }

  // All attempts at opening failed, so return a PASS
  status?.stream('Z00! Hand is insufficient for any opening, so pass.\n');
  e.m_nBid = Bid.Pass;
  return e.validateBid(e.m_nBid);
}
