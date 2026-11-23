//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// BiddingRebid.cpp -> biddingRebid.ts
//
// Opener rebidding routines (MakeRebidAsOpener)
//

import { Card } from '../card.js';
import { Bid, bidLevel, bidToFullString, isMajor, isMinor, isSuit, makeBid, NONE, Suit } from '../constants.js';
import { REVALUE_DUMMY } from '../hand.js';
import { ConventionId } from './biddingCodes.js';
import {
  PTS_GAME,
  PTS_GRAND_SLAM,
  PTS_MAJOR_GAME,
  PTS_MINOR_GAME,
  PTS_NT_GAME,
  PTS_SLAM,
  RaiseTarget,
  SuitStrength,
  SuitType,
  SupportLength,
} from './bidParameters.js';
import type { BidEngine } from './bidEngine.js';

//
// MakeRebidAsOpener()
//
// Rebid after partner's response
//
export function makeRebidAsOpenerEngine(e: BidEngine): Bid {
  const status = e.status;

  if (e.nPartnersBid === Bid.Pass) {
    status?.stream(`2Rebidding after opening bid of ${e.szPVB} and partner's pass.\n`);
  } else {
    status?.stream(
      `2Rebidding after opening bid of ${e.szPVB} and partner's response of ${e.szPB}.\n`,
    );
  }

  // First check for a convention response
  if (e.applyConventionTestsInternal()) {
    return e.validateBid(e.m_nBid);
  }

  //
  // Rebidding after partner has passed
  //
  if (e.nPartnersBid === Bid.Pass) {
    e.m_fPartnersMin = 0;
    e.m_fPartnersMax = 5;
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (
      e.m_fMinTPPoints >= PTS_SLAM &&
      (e.hand?.numWinners ?? 0) >= 10 &&
      isSuit(e.nPrefSuit) &&
      e.nSuitStrength[e.nPrefSuit] >= SuitStrength.Absolute
    ) {
      status?.stream(
        `B3A00! Partner passed, but with ${e.fCardPts}/${e.fPts} points, ${e.numLikelyWinners} playing tricks and a solid ${e.szPrefS} suit, we have enough to try for a slam.\n`,
      );
      if (isSuit(e.nPreviousSuit)) e.invokeBlackwood(e.nPreviousSuit);
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints >= PTS_GAME - 1 && e.numLikelyWinners >= 9 && isSuit(e.nPrefSuit)) {
      e.m_nBid = e.getCheapestShiftBid(e.nPrefSuit, e.nLastBid);
      if (e.m_nBid < Bid.NT3) {
        status?.stream(
          `B3A10! Partner passed, but with ${e.fCardPts}/${e.fPts} points, ${e.numLikelyWinners} playing tricks and a solid ${e.szPrefS} suit, we still want to try for game, so rebid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    e.m_nBid = Bid.Pass;
    status?.stream(
      `B3A20! Partner passed, showing < 6 points, so with ${e.fCardPts}/${e.fPts} points in hand and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total partnership points, we have no choice but to pass.\n`,
    );
    return e.validateBid(e.m_nBid);
  }

  //
  // Rebidding after partner bid 1NT (negative)
  //
  if (e.nPartnersBid === Bid.NT1) {
    e.m_fPartnersMin = e.openPts(6);
    e.m_fPartnersMax = e.openPts(10);
    status?.stream(
      `B3J00! With a 1NT response, partner is showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points, a lack of good support for our ${e.szPVSS} suit, and no other suit available to bid at an appropriate level.\n`,
    );

    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.bBalanced) {
      status?.stream('2B3J10! And with a balanced hand, we want to steer towards a contract in No Trumps.\n');

      if (e.m_fMinTPCPoints <= PTS_GAME - 4) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B3J14! Have ${e.fCardPts} HCPS with a balanced hand, and ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} pts in the partnership, so we have to pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
      if (e.m_fMinTPCPoints >= PTS_NT_GAME - 3 && e.m_fMinTPCPoints < PTS_GAME) {
        e.m_nBid = Bid.NT2;
        status?.stream(
          `B3J18! Have ${e.fCardPts} HCPS with a balanced hand, and ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} pts in the partnership, so raise to 2NT.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
      if (e.m_fMinTPCPoints >= PTS_NT_GAME && e.m_fMinTPCPoints <= PTS_GAME + 4) {
        if (e.bAllSuitsStopped) {
          e.m_nBid = Bid.NT3;
          status?.stream(
            `B3J22! Have ${e.fCardPts} HCPS with a balanced hand, and ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} pts in the partnership, with all suits stopped, so jump to 3NT.\n`,
          );
        } else {
          e.m_nBid = Bid.NT2;
          status?.stream(
            `B3J23! Have ${e.fCardPts} HCPS with a balanced hand, and ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} pts in the partnership, but not all suits are stopped, so just bid 2NT.\n`,
          );
        }
        return e.validateBid(e.m_nBid);
      }
      if (e.m_fMinTPCPoints >= PTS_SLAM - 2) {
        if (e.m_fMinTPCPoints >= PTS_GRAND_SLAM) {
          e.m_nBid = Bid.NT7;
          status?.stream(
            `B3J26! Have ${e.fCardPts} HCPS with a balanced hand, and  approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, so go directly to a grand slam at ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else if (e.m_fMinTPCPoints >= PTS_SLAM) {
          e.m_nBid = Bid.NT6;
          status?.stream(
            `B3J28! Have ${e.fCardPts} HCPS with a balanced hand, and  approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, so go directly to a small slam at ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.m_nBid = Bid.NT4;
          status?.stream(
            `B3J30! Have ${e.fCardPts} HCPS with a balanced hand, and approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, so invite a slam by bidding ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
        return e.validateBid(e.m_nBid);
      }
    }

    // unbalanced hand over 1NT
    let nSuit = e.getRebidSuit(e.nPreviousSuit);
    nSuit = e.testReverseRules(nSuit).suit;
    if (!isSuit(nSuit)) nSuit = e.nPrefSuit;

    if (e.m_fMinTPPoints <= PTS_GAME - 3 && isSuit(nSuit)) {
      e.m_nBid = e.getCheapestShiftBid(nSuit, Bid.NT1);
      if (nSuit === e.nPreviousSuit) {
        status?.stream(
          `B3K10! Partner doesn't like our ${e.szPVS}, but we don't have another suit we can bid, so rebid the suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        status?.stream(
          `B3K12! Since partner doesn't like our ${e.szPVS}, try ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints >= PTS_GAME - 2 && e.m_fMinTPPoints < PTS_GAME && isSuit(nSuit)) {
      e.m_nBid = e.getJumpShiftBid(nSuit, Bid.NT1);
      if (nSuit === e.nPreviousSuit) {
        status?.stream(
          `B3K20! Partner doesn't like our ${e.szPVS}, but with ${e.fCardPts}/${e.fPts} points and no other good suit, jump rebid to ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        status?.stream(
          `B3K22! Partner doesn't like our ${e.szPVS}; but with ${e.fCardPts}/${e.fPts} points, jump shift to ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // 26+ TPs: jump shift to 3 of a new suit or jump rebid own suit
    const newSuit = e.getNextBestSuit(e.nPartnersSuit, e.nPreviousSuit);
    if (isSuit(newSuit) && e.nSuitStrength[newSuit] >= SuitStrength.Openable) {
      e.m_nBid = e.getJumpShiftBid(newSuit, e.nPartnersBid);
      status?.stream(
        `B3K30! With ${e.fCardPts}/${e.fPts} points, jump shift to ${bidToFullString(e.m_nBid)} (forcing to game).\n`,
      );
      e.m_bGameForceActive = true;
    } else if (isSuit(nSuit)) {
      e.m_nBid = e.getJumpShiftBid(nSuit, e.nPartnersBid);
      status?.stream(
        `B3K30a! With ${e.fCardPts}/${e.fPts} points and no other good suits, jump rebid the ${Card.suitToSingularString(nSuit)} suit at ${bidToFullString(e.m_nBid)}.\n`,
      );
    }
    return e.validateBid(e.m_nBid);
  }

  //
  // Rebidding after partner bid 2NT or 3NT (or 4NT-7NT over opening NT)
  //
  if (
    (e.nPreviousBidLevel === 1 && e.nPartnersBid === Bid.NT2) ||
    e.nPartnersBid === Bid.NT3 ||
    ((e.nPartnersBid === Bid.NT4 ||
      e.nPartnersBid === Bid.NT5 ||
      e.nPartnersBid === Bid.NT6 ||
      e.nPartnersBid === Bid.NT7) &&
      e.nPreviousSuit === Suit.NoTrump)
  ) {
    e.calcNoTrumpPoints();

    if (e.bSemiBalanced) {
      if (e.nPreviousSuit !== Suit.NoTrump) {
        status?.stream('2B3N10! With a balanced hand, we want to steer towards a contract in No Trumps.\n');
      }

      if (e.m_fMinTPCPoints < PTS_GAME && !e.m_bGameForceActive) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B3N12! But with only about ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPS in the partnership, we don't have enough for game, so pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.m_fMinTPCPoints >= PTS_GAME && e.m_fMinTPCPoints <= PTS_SLAM - 2) {
        if (e.nPartnersBid >= Bid.NT4) {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `B3N14! With a total of approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPS in the partnership, we have to${e.m_bInvitedToSlam ? ' turn down the slam invitation and ' : ' '}pass partner's ${e.szPB} bid.\n`,
          );
        } else if (e.nPartnersBid === Bid.NT2) {
          e.m_nBid = Bid.NT3;
          status?.stream(
            `B3N16! With a total of approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPS in the partnership, try for game at a ${bidToFullString(e.m_nBid)} contract.\n`,
          );
        } else if (e.nPartnersBid === Bid.NT3) {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `B3N18! With approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPS in the partnership, partner's game bid of 3NT seems appropriate, so pass.\n`,
          );
        }
        return e.validateBid(e.m_nBid);
      }

      if (e.m_fMinTPCPoints >= PTS_SLAM - 1) {
        if (e.nPartnersBid >= Bid.NT4) {
          if (e.nPartnersBid === Bid.NT4 || e.nPartnersBid === Bid.NT5) {
            if (e.m_fMinTPCPoints >= PTS_GRAND_SLAM) {
              e.m_nBid = Bid.NT7;
              status?.stream(
                `B3N20! Partner's invitational bid of ${e.szPB} indicates a minimum of ${e.m_fMinTPCPoints}+ points in the partnership, which is enough for a grand slam, so bid ${bidToFullString(e.m_nBid)}.\n`,
              );
            } else if (e.m_fMinTPCPoints >= PTS_SLAM) {
              e.m_nBid = Bid.NT6;
              status?.stream(
                `B3N22! Partner's invitational bid of ${e.szPB} indicates a minimum of ${e.m_fMinTPCPoints}+ points in the partnership, which is enough for a small slam, so bid ${bidToFullString(e.m_nBid)}.\n`,
              );
            } else {
              e.m_nBid = Bid.Pass;
              status?.stream(
                `B3N24! Partner's invitational bid of ${e.szPB} indicates approx. ${e.m_fMinTPCPoints}+ points in the partnership, which is not quite enough for a small slam, so pass.\n`,
              );
            }
          } else if (e.nPartnersBid === Bid.NT6) {
            if (e.m_fMinTPCPoints >= PTS_GRAND_SLAM) {
              e.m_nBid = Bid.NT7;
              status?.stream(
                `B3N30! Partner has bid a small slam, and with ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints}HCPs in the partnership, we raise to ${bidToFullString(e.m_nBid)}.\n`,
              );
            } else {
              e.m_nBid = Bid.Pass;
              status?.stream(
                `B3N32! Partner has bid a small slam, and with ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints}HCPs in the partnership, pass.\n`,
              );
            }
          } else {
            e.m_nBid = Bid.Pass;
            status?.stream('B3N34! Partner has already bid a grand slam, so just pass.\n');
          }
        } else {
          if (e.m_fMinTPCPoints >= PTS_GRAND_SLAM) {
            e.m_nBid = Bid.NT7;
            status?.stream(
              `B3N40! With a total of approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPS in the partnership, bid a grand slam directly at ${bidToFullString(e.m_nBid)}.\n`,
            );
          } else if (e.m_fMinTPCPoints >= PTS_SLAM) {
            e.m_nBid = Bid.NT6;
            status?.stream(
              `B3N42! With a total of approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPS in the partnership, bid a small slam directly at ${bidToFullString(e.m_nBid)}.\n`,
            );
          } else {
            e.m_nBid = Bid.NT4;
            status?.stream(
              `B3N44! With a total of approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPS in the partnership, make an invitation towards slam at ${bidToFullString(e.m_nBid)}.\n`,
            );
          }
        }
        return e.validateBid(e.m_nBid);
      }
    }

    // unbalanced hand over 2NT/3NT
    let nSuit = e.getRebidSuit(e.nPreviousSuit);
    if (!isSuit(nSuit)) nSuit = e.nPrefSuit;

    if (e.nPartnersBid === Bid.NT2) {
      if (e.m_fMinTPCPoints >= PTS_SLAM && e.numSuitsStopped === 4 && e.numVoids === 0 && e.numSingletons === 0) {
        e.m_nBid = e.m_fMinTPCPoints >= PTS_GRAND_SLAM ? Bid.NT7 : Bid.NT6;
        status?.stream(
          `B3N50! With a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership and a reasonably balanced distribution, and all suits stopped, we can jump to slam at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.m_fMinTPPoints >= PTS_SLAM && e.numPrefSuitCards >= 6 && e.nPrefSuitStrength >= SuitStrength.Strong && isSuit(e.nPrefSuit)) {
        e.m_nBid = makeBid(e.nPrefSuit, 6);
        status?.stream(
          `B3N50a! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, plus a strong ${e.numPrefSuitCards}-card ${e.szPrefSS} suit, go ahead and jump to slam at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.m_fMinTPCPoints >= PTS_GAME && e.numSuitsStopped === 4 && e.numVoids === 0 && e.numSingletons === 0) {
        e.m_nBid = Bid.NT3;
        status?.stream(
          `B3N51! With ${e.fCardPts} HCPs, reasonably balanced distribution, and all suits stopped, we can safely bid game at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.m_fMinTPPoints >= PTS_GAME && isSuit(nSuit)) {
        e.m_nBid = e.getCheapestShiftBid(nSuit);
        if (nSuit === e.nPreviousSuit) {
          status?.stream(
            `B3N52! Partner wants to play in No Trumps, but we don't have a balanced distribution, so rebid ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          status?.stream(
            `B3N54! Partner wants to play in No Trumps, but we don't have a balanced distribution, so try bidding ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
      } else if (e.m_bGameForceActive) {
        if (e.numVoids === 0) {
          e.m_nBid = Bid.NT3;
          status?.stream(
            `B3N56! As partner's 2NT bid was forcing to game, we have no choice but to bid ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        } else {
          const rs = e.getRebidSuit(e.nPreviousSuit);
          e.m_nBid = isSuit(rs) ? e.getCheapestShiftBid(rs) : Bid.NT3;
          status?.stream(
            `B3N58! Partner's 2NT bid was forcing to game -- and with ${e.numVoids === 1 ? 'a void suit' : e.numVoids === 2 ? '2 void suits' : '3 void suits'}, we have no choice but to rebid ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B3N62! Partner wants to play in No Trumps, which we don't like, but with only ${e.fCardPts}/${e.fPts} points, we can't argue and have to pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // partner bid 3NT over 1-suit
    if (e.m_fMinTPPoints >= PTS_SLAM - 1) {
      if (e.m_fMinTPCPoints >= PTS_GRAND_SLAM) {
        e.m_nBid = Bid.NT7;
        status?.stream(
          `B3N70! Partner's 3NT response indicates a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, so bid a grand slam directly at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else if (e.m_fMinTPCPoints >= PTS_SLAM) {
        e.m_nBid = Bid.NT6;
        status?.stream(
          `B3N72! Partner's 3NT response indicates a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, so bid a small slam directly at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.NT4;
        status?.stream(
          `B3N74! Partner's 3NT response indicates a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, so make an invitation towards slam at ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (
      isMajor(e.nPreviousSuit) &&
      e.nPreviousSuitStrength >= SuitStrength.Strong &&
      e.bPreviousSuitIsSolid
    ) {
      e.m_nBid = e.getCheapestShiftBid(e.nPreviousSuit as Suit);
      status?.stream(
        `B3N80! Partner wants to play at 3NT, but with a solid major in ${e.szPVS}, we prefer to play in the suit, so bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (!e.m_bGameForceActive) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        "B3N85! Partner wants to play at 3NT, which we can't argue with since we lack a solid suit of our own.\n",
      );
      return e.validateBid(e.m_nBid);
    } else {
      const rs = e.getRebidSuit(e.nPreviousSuit);
      e.m_nBid = isSuit(rs) ? e.getCheapestShiftBid(rs) : Bid.Pass;
      status?.stream(
        `B3N90! In response to partner's game forcing bid, we have no choice but to express dislike for NT by bidding ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
  }

  // Triple raise
  if (e.nPartnersSuit === e.nPreviousSuit && e.nPreviousBidLevel === 1 && e.nPartnersBidLevel === 4) {
    return e.respondToTripleRaiseEngine();
  }

  // Single raise
  if (e.nPartnersSuit === e.nPreviousSuit && e.nPartnersBidLevel === 2) {
    return e.respondToSingleRaiseEngine(e.nPartnersBid);
  }

  // Double raise
  if (e.nPartnersSuit === e.nPreviousSuit && e.nPartnersBidLevel === 3) {
    return e.respondToDoubleRaiseEngine(e.nPartnersBid);
  }

  // Raise of 4+ levels
  if (e.nPartnersSuit === e.nPreviousSuit && e.nPartnersBidLevel - e.nPreviousBidLevel >= 4 && isSuit(e.nPartnersSuit)) {
    e.m_nAgreedSuit = e.nPreviousSuit;
    if (e.nPartnersBidLevel <= 5 && e.m_fMinTPPoints >= PTS_SLAM && e.numSupportCards >= 3) {
      e.m_nBid = makeBid(e.nPartnersSuit, 6);
      status?.stream(
        `B3X1! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, go ahead and raise partner to a small slam at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
    if (e.nPartnersBidLevel <= 6 && e.m_fMinTPPoints >= PTS_GRAND_SLAM && e.numSupportCards >= 3) {
      e.m_nBid = makeBid(e.nPartnersSuit, 7);
      status?.stream(
        `B3X2! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, go ahead and raise partner to a grand slam at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
    e.m_nBid = Bid.Pass;
    status?.stream(
      `B3X3! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we have to defer to partner's unusual jump rebid and pass.\n`,
    );
    return e.validateBid(e.m_nBid);
  }

  //
  // 1 over 1 response
  //
  if (e.nPartnersSuit !== e.nPreviousSuit && e.nPartnersBidLevel === 1 && isSuit(e.nPartnersSuit)) {
    e.m_fPartnersMin = e.openPts(6);
    e.m_fPartnersMax = e.openPts(18);
    if (e.nPartnersPrevBid === Bid.Pass) {
      e.m_fPartnersMax = e.openPts(12);
      status?.stream(
        `2B3U00a! Partner has made a 1 over 1 bid after an earlier pass, ${e.szPS} over ${e.szPVS}, which shows ${e.m_fPartnersMin}-${e.m_fPartnersMax} points and is forcing for one round.\n`,
      );
    } else {
      status?.stream(
        `2B3U00! Partner has made a 1 over 1 bid, ${e.szPS} over ${e.szPVS}, which shows ${e.m_fPartnersMin}-${e.m_fPartnersMax} points and is forcing for one round.\n`,
      );
    }

    if (e.hand) e.fAdjPts = e.hand.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.m_fMinTPPoints <= PTS_GAME - 3) {
      if (isMajor(e.nPartnersSuit) && e.nPartnersSuitSupport >= SuitStrength.WeakSupport) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 2);
        status?.stream(
          `B3U14! With decent ${e.numSupportCards}-card support for partner's major ${e.szPSS} suit (holding ${e.szHP}), no rebiddable suit, and no openable second suit, raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      let nSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit);
      nSuit = e.testReverseRules(nSuit).suit;
      if (isSuit(nSuit) && e.isSuitOpenable(nSuit)) {
        e.m_nBid = e.getCheapestShiftBid(nSuit);
        if (nSuit !== e.nPreviousSuit) {
          status?.stream(
            `B3U18! With ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}), and a second openable suit in ${Card.suitToString(nSuit)} (holding ${e.suitHoldingsToString(nSuit)}), show it in a ${bidToFullString(e.m_nBid)} bid.\n`,
          );
        } else {
          status?.stream(
            `B3U18a! With ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}), and no other suit available to bid, rebid the ${e.szPVSS} suit at ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
        return e.validateBid(e.m_nBid);
      }

      if (e.bPreviousSuitIsRebiddable && isSuit(e.nPreviousSuit)) {
        e.m_nBid = makeBid(e.nPreviousSuit, 2);
        const code = isMajor(e.nPartnersSuit) ? 'B3U22' : isMajor(e.nPreviousSuit) ? 'B3U24' : 'B3U26';
        status?.stream(`${code}! With a rebiddable ${e.szPVSS} suit, rebid at ${bidToFullString(e.m_nBid)}.\n`);
        return e.validateBid(e.m_nBid);
      }

      if (e.bBalanced) {
        e.m_nBid = Bid.NT1;
        status?.stream(
          isMinor(e.nPartnersSuit)
            ? `B3U30! With a balanced distribution, bid ${bidToFullString(e.m_nBid)} in preference to partner's minor.\n`
            : `B3U34! With a balanced distribution and weak support for partner's ${e.szPSS} suit (holding ${e.szHP}), bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMinor(e.nPartnersSuit) && e.nPartnersSuitSupport >= SuitStrength.WeakSupport) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 2);
        status?.stream(
          `B3U40! With ${e.numSupportCards}-card support for partner's minor ${e.szPS} suit (holding ${e.szHP}), no rebiddable suit or openable second suit, and unbalanced distribution, raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      e.m_nBid = Bid.NT1;
      status?.stream(
        `B3U44! With weak support for partner's ${e.szPS} (holding ${e.szHP}), and no other available bid, bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints >= PTS_GAME - 3 && e.m_fMinTPPoints <= PTS_GAME - 1) {
      if (isMajor(e.nPartnersSuit) && e.numSupportCards >= 4) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `B3U50! With ${e.numSupportCards}-card support for partner's ${e.szPS} (holding ${e.szHP}) and ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, jump raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      let nSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit);
      nSuit = e.testReverseRules(nSuit).suit;
      if (isSuit(nSuit) && e.isSuitOpenable(nSuit)) {
        e.m_nBid = e.getCheapestShiftBid(nSuit);
        status?.stream(
          `B3U54! With weak support for partner's ${e.szPSS} suit (holding ${e.szHP}), ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, and a second openable suit in ${Card.suitToString(nSuit)} (holding ${e.suitHoldingsToString(nSuit)}), show it in a ${bidToFullString(e.m_nBid)} bid.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        isSuit(e.nPreviousSuit) &&
        e.nPreviousSuitStrength >= SuitStrength.Strong &&
        e.bPreviousSuitIsSolid &&
        e.numPreviousSuitCards >= 6
      ) {
        e.m_nBid = e.getJumpShiftBid(e.nPreviousSuit, e.nPartnersBid);
        status?.stream(
          `B3U58! With a solid ${e.numPreviousSuitCards}-card suit of our own in ${e.szPVS}, and only ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPS} (holding ${e.szHP}), jump rebid our suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.bBalanced && e.m_fMinTPCPoints >= PTS_GAME - 2) {
        e.m_nBid = Bid.NT2;
        status?.stream(
          `B3U62! With weak support for partner's ${e.szPS} (holding ${e.szHP}) and a balanced hand with ${e.fCardPts} HCPs, for a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMinor(e.nPartnersSuit) && e.nPartnersSuitSupport >= SuitStrength.GoodSupport) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `B3U64! With ${e.numSupportCards}-card support for partner's minor ${e.szPS} suit (holding ${e.szHP}), no rebiddable suit or second suit of our own, and ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, jump raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      nSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit);
      if (e.nPartnersSuitSupport >= SuitStrength.ModerateSupport) e.m_nIntendedSuit = e.nPartnersSuit;
      nSuit = e.testReverseRules(nSuit).suit;
      if (isSuit(nSuit) && e.isSuitShiftable(nSuit)) {
        e.m_nBid = e.getCheapestShiftBid(nSuit);
        status?.stream(
          `B3U68! With ${e.numSupportCards}-card support for partner's ${e.szPS} (holding ${e.szHP}), ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, an unbalanced hand, and our primary ${e.szPVSS} suit not jump rebiddable, we have to show our strength by shifting to ${bidToFullString(e.m_nBid)}, regardless of that suit's strength.\n`,
        );
      } else {
        e.m_nBid = Bid.NT2;
        status?.stream(
          `B3U69! With ${e.numSupportCards}-card support for partner's ${e.szPS} (holding ${e.szHP}), ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, an unbalanced hand, our primary ${e.szPVSS} suit not jump rebiddable, and no second suit available, bid 2NT.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // 26+ team points
    if (isMajor(e.nPartnersSuit) && e.numSupportCards >= 4) {
      e.m_nAgreedSuit = e.nPartnersSuit;
      e.m_nBid = makeBid(e.nPartnersSuit, 4);
      status?.stream(
        `B3U72! With ${e.numSupportCards}-card support for partner's ${e.szPS} (holding ${e.szHP}) and ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in hand (for ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership), we have enough for game, so bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    const nSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit);
    if (isSuit(nSuit) && e.nSuitStrength[nSuit] >= SuitStrength.Openable) {
      e.m_nBid = e.getJumpShiftBid(nSuit, e.nPartnersBid);
      status?.stream(
        `B3U74! With less than game-level support for partner's ${e.szPSS} suit (holding ${e.szHP}), but with ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points and a second suit in ${Card.suitToString(nSuit)} (holding ${e.suitHoldingsToString(nSuit)}), show it by jump shifting to ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.bBalanced) {
      if (e.m_fMinTPCPoints >= PTS_NT_GAME && e.hand?.allOtherSuitsStopped(e.nPartnersSuit)) {
        e.m_nBid = Bid.NT3;
        status?.stream(
          `B3U76! With a balanced hand, approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, and stoppers in all${e.numSuitsStopped === 4 ? ' ' : ' unbid '}suits, we can make game at No Trumps, so bid ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.NT2;
        status?.stream(
          `B3U78! With a balanced hand and approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, we can bid ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (
      isMinor(e.nPreviousSuit) &&
      e.m_fMinTPCPoints >= PTS_GAME - 1 &&
      e.numLikelyWinners >= 7 &&
      e.nPreviousSuitStrength >= SuitStrength.Strong &&
      e.bPreviousSuitIsSolid &&
      e.hand?.allOtherSuitsStopped(e.nPartnersSuit)
    ) {
      e.m_nBid = Bid.NT3;
      status?.stream(
        `B3U80! With a solid minor suit, all${e.numSuitsStopped === 4 ? ' ' : ' unbid '}suits stopped, ${e.fCardPts} HCPs, and ${e.numLikelyWinners} playing tricks, bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.bPreviousSuitIsSelfSupporting && isSuit(e.nPreviousSuit)) {
      if (isMajor(e.nPreviousSuit)) {
        e.m_nBid = makeBid(e.nPreviousSuit, 4);
        status?.stream(
          `B3U82! With our solid ${e.szPVSS} suit with ${e.numPreviousSuitCards} cards and ${e.numHonorsInPreviousSuit} honors, and ${e.fCardPts}/${e.fPts} points in hand, we should be able to make a game with little help, so bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
      if (e.m_fMinTPPoints >= PTS_MINOR_GAME) {
        e.m_nBid = makeBid(e.nPreviousSuit, 5);
        status?.stream(
          `B3U84! With our solid ${e.szPVSS} suit with ${e.numPreviousSuitCards} cards and ${e.numHonorsInPreviousSuit} honors, and ${e.fCardPts}/${e.fPts} points in hand, we should be able to make a minor suit game with little help, so bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    if (isMinor(e.nPartnersSuit) && e.m_fMinTPPoints >= PTS_GAME && e.numSupportCards >= 3) {
      e.m_nAgreedSuit = e.nPartnersSuit;
      e.m_nBid = e.m_fMinTPPoints >= PTS_MINOR_GAME && e.numSupportCards >= 4
        ? makeBid(e.nPartnersSuit, 5)
        : makeBid(e.nPartnersSuit, 4);
      status?.stream(
        `B3U86! With ${e.numSupportCards}-card support for partner's minor ${e.szPS} suit (holding ${e.szHP}), no rebiddable suit or second suit of our own, and ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points (for a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership), raise to${e.m_nBid === e.getGameBid(e.nPartnersSuit) ? ' game at ' : ' '}${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.bPreviousSuitIsRebiddable && isSuit(e.nPreviousSuit)) {
      let jumpRebid = false;
      const resp = e.getCheapestShiftBid(e.nPreviousSuit);
      if (bidLevel(resp) <= 3) {
        e.m_nBid = e.getJumpShiftBid(e.nPreviousSuit, e.nPartnersBid);
        jumpRebid = true;
      } else {
        e.m_nBid = resp;
      }
      if (bidLevel(e.m_nBid) <= 4) {
        status?.stream(
          `B3U90! We have ${e.m_fMinTPPoints}- pts in the partnership, but don't like partner's suit, don't have a good second suit, and NT is not a good option, so ${jumpRebid ? 'jump rebid' : 'rebid'} the ${e.szPVSS} suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    if (isSuit(nSuit) && e.isSuitShiftable(nSuit)) {
      e.m_nBid = e.getJumpShiftBid(nSuit, e.nPartnersBid);
      status?.stream(
        `B3U94! With unsatisfactory support for partner's ${e.szPS} (holding ${e.szHP}), an unbalanced hand, and ${e.fCardPts}/${e.fPts} points, we have to show the hand's strength by jump shifting to the next best suit at ${bidToFullString(e.m_nBid)}, regardless of that suit's strength.\n`,
      );
    } else {
      e.m_nBid = e.m_fMinTPCPoints >= PTS_NT_GAME ? Bid.NT3 : Bid.NT2;
      status?.stream(
        `B3U96! With unsatisfactory support for partner's ${e.szPS} (holding ${e.szHP}), ${e.fCardPts}/${e.fPts} points, and no good second suit, we have to show our strength by jump shifting to ${bidToFullString(e.m_nBid)}, despite having an unbalanced hand.\n`,
      );
    }
    return e.validateBid(e.m_nBid);
  }

  //
  // 2 over 1 response (non-jump)
  //
  if (
    e.nPartnersSuit !== e.nPreviousSuit &&
    e.nPreviousBidLevel === 1 &&
    e.nPartnersBidLevel === 2 &&
    !e.bJumpResponseByPartner &&
    isSuit(e.nPartnersSuit)
  ) {
    e.m_fPartnersMin = e.openPts(10);
    e.m_fPartnersMax = e.openPts(18);
    if (e.nPartnersPrevBid === Bid.Pass) {
      e.m_fPartnersMax = e.openPts(12);
      status?.stream(
        `2B3W00a! Partner has made a 2 over 1 bid following an earlier pass, ${e.szPS} over ${e.szPVS}, which shows ${e.m_fPartnersMin}-${e.m_fPartnersMax} points and is forcing for one round.\n`,
      );
    } else {
      status?.stream(
        `2B3W00! Partner has made a 2 over 1 bid, ${e.szPS} over ${e.szPVS}, which shows ${e.m_fPartnersMin}-${e.m_fPartnersMax} points and is forcing for one round.\n`,
      );
    }

    if (e.hand) e.fAdjPts = e.hand.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.m_fMinTPPoints <= PTS_MINOR_GAME) {
      if (isMajor(e.nPartnersSuit) && e.numSupportCards >= 4) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = e.nPartnersSuitSupport >= SuitStrength.GoodSupport && e.m_fMinTPPoints >= PTS_GAME
          ? makeBid(e.nPartnersSuit, 4)
          : makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `B3W10! With ${e.numSupportCards}-card support for partner's ${e.szPS} (holding ${e.szHP}) and ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points (for a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership), raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.bBalanced && e.m_fMinTPCPoints >= PTS_NT_GAME - 2) {
        e.m_nBid = e.m_fMinTPCPoints >= PTS_NT_GAME && e.hand?.allOtherSuitsStopped(e.nPartnersSuit)
          ? Bid.NT3
          : Bid.NT2;
        const code = isMinor(e.nPartnersSuit) ? 'B3W14' : 'B3W16';
        status?.stream(
          `${code}! With a balanced distribution, approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.bPreviousSuitIsSelfSupporting && isSuit(e.nPreviousSuit)) {
        if (isMajor(e.nPreviousSuit) && e.m_fMinTPPoints >= PTS_MAJOR_GAME) {
          e.m_nBid = makeBid(e.nPreviousSuit, 4);
          status?.stream(
            `B3W20! With our self-supporting ${e.szPVSS} suit with ${e.numPreviousSuitCards} cards and ${e.numHonorsInPreviousSuit} honors, and ${e.fCardPts}/${e.fPts} points in hand, we can make a game contract in the suit with little help from partner, so bid ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
        if (isMinor(e.nPreviousSuit) && e.m_fMinTPPoints >= PTS_MINOR_GAME) {
          e.m_nBid = makeBid(e.nPreviousSuit, 5);
          status?.stream(
            `B3W24! With our solid ${e.szPVSS} suit with ${e.numPreviousSuitCards} cards and ${e.numHonorsInPreviousSuit} honors, and ${e.fCardPts}/${e.fPts} points in hand, we should be able to make a game in minors with little help, so bid ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      let nSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit);
      const revCheck = e.testReverseRules(nSuit);
      if (isSuit(revCheck.suit) && e.isSuitOpenable(revCheck.suit) && revCheck.ok) {
        e.m_nBid = e.getCheapestShiftBid(revCheck.suit);
        status?.stream(
          `B3W28! With weak ${e.numSupportCards}-card support for partner's ${e.szPS} (holding ${e.szHP}) and a ${e.suitStrengthToString(revCheck.suit)} second suit in ${Card.suitToString(revCheck.suit)} (holding ${e.suitHoldingsToString(revCheck.suit)}), show it in a ${bidToFullString(e.m_nBid)} bid.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMinor(e.nPartnersSuit) && e.numSupportCards >= 4) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = e.m_fMinTPPoints >= PTS_MINOR_GAME - 3
          ? makeBid(e.nPartnersSuit, 4)
          : makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `B3W32! With ${e.numSupportCards}-card support for partner's minor ${e.szPS} suit (holding ${e.szHP}), no rebiddable suit or good second suit, and unbalanced distribution, raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.bPreviousSuitIsRebiddable && isSuit(e.nPreviousSuit)) {
        e.m_nBid = e.getCheapestShiftBid(e.nPreviousSuit);
        status?.stream(
          `B3W36! With a rebiddable ${e.szPVSS} suit and ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPS} (holding ${e.szHP}), rebid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      nSuit = e.testReverseRules(e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit)).suit;
      if (e.nPartnersSuitSupport >= SuitStrength.ModerateSupport) e.m_nIntendedSuit = e.nPartnersSuit;
      if (isSuit(nSuit) && nSuit !== e.nPreviousSuit && e.isSuitShiftable(nSuit)) {
        e.m_nBid = e.getCheapestShiftBid(nSuit);
        status?.stream(
          `B3W40! With ${e.supportLevelToString(e.nPartnersSuit)} support for partner's${isMinor(e.nPartnersSuit) ? ' minor ' : ' '}${e.szPSS} suit (holding ${e.szHP}), and our first suit not rebiddable, we have to shift to another suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else if (isSuit(e.nPreviousSuit)) {
        e.m_nBid = e.getCheapestShiftBid(e.nPreviousSuit);
        status?.stream(
          `B3W41! With ${e.supportLevelToString(e.nPartnersSuit)} support for partner's${isMinor(e.nPartnersSuit) ? 'minor ' : ' '}${e.szPSS} suit (holding ${e.szHP}), and no other good suits, we're forced to rebid our ${e.szPVS} suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // 29+ TPs over 2/1
    if (e.m_fMinTPPoints < PTS_SLAM && e.numSupportCards >= 4) {
      e.m_nAgreedSuit = e.nPartnersSuit;
      e.m_nBid = isMajor(e.nPartnersSuit) ? makeBid(e.nPartnersSuit, 4) : makeBid(e.nPartnersSuit, 5);
      status?.stream(
        `B3W44! With ${e.numSupportCards}-card support for partner's ${e.szPS} (holding ${e.szHP}) and ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points (for a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership), raise to ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints >= PTS_SLAM && e.nPartnersSuitSupport >= SuitStrength.GoodSupport) {
      e.invokeBlackwood(e.nPartnersSuit);
      return e.validateBid(e.m_nBid);
    }

    if (
      e.m_fMinTPCPoints >= PTS_NT_GAME &&
      e.m_fMinTPCPoints < PTS_SLAM &&
      e.bBalanced &&
      e.hand?.allOtherSuitsStopped(e.nPartnersSuit)
    ) {
      e.m_nBid = Bid.NT3;
      const code = isMinor(e.nPartnersSuit) ? 'B3W48' : 'B3W50';
      status?.stream(
        `${code}! With a balanced distribution and all unbid suits stopped, along with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} HCPs in the partnership, bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.bPreviousSuitIsSelfSupporting && isSuit(e.nPreviousSuit)) {
      e.m_nBid = isMajor(e.nPreviousSuit) ? makeBid(e.nPreviousSuit, 4) : makeBid(e.nPreviousSuit, 5);
      status?.stream(
        `B3W54! With our self-supporting ${e.szPVSS} suit with ${e.numPreviousSuitCards} cards and ${e.numHonorsInPreviousSuit} honors, and ${e.fCardPts}/${e.fPts} points in hand, we should be able to make a game contract in the suit with little help from partner, so bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (isSuit(e.nPreviousSuit) && e.numPreviousSuitCards >= 6 && e.nPreviousSuitStrength >= SuitStrength.Strong) {
      e.m_nBid = e.getJumpShiftBid(e.nPreviousSuit, e.nPartnersBid, 1);
      status?.stream(
        `B3W56! With our strong ${e.numPreviousSuitCards}-card ${e.szPVSS} suit and ${e.fCardPts}/${e.fPts} points in hand, we can make a jump rebid at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    const nSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit);
    if (isSuit(nSuit) && e.nSuitStrength[nSuit] >= SuitStrength.Openable) {
      e.m_nBid = e.getJumpShiftBid(nSuit, e.nPartnersBid);
      status?.stream(
        `B3W58! With weak support for partner's ${e.szPS} (holding ${e.szHP}), an unbalanced hand, and a ${e.suitStrengthToString(nSuit)} second ${Card.suitToSingularString(nSuit)} suit (holding ${e.suitHoldingsToString(nSuit)}), show it by jump shifting to ${bidToFullString(e.m_nBid)}.\n`,
      );
    } else {
      e.m_nBid = e.getJumpShiftBid(Suit.NoTrump, e.nPartnersBid);
      status?.stream(
        `B3W59! With weak support for partner's ${e.szPS} (holding ${e.szHP}) and no good second suit, we have show our strength by jump shifting in Notrumps to ${bidToFullString(e.m_nBid)}, despite the unbalanced hand.\n`,
      );
    }
    return e.validateBid(e.m_nBid);
  }

  //
  // Jump shift in a new suit
  //
  if (
    isSuit(e.nPartnersSuit) &&
    ((e.nPartnersSuit > e.nPreviousSuit && e.nPartnersBidLevel > e.nPreviousBidLevel) ||
      (e.nPartnersSuit < e.nPreviousSuit && e.nPartnersBidLevel > e.nPreviousBidLevel + 1))
  ) {
    if (e.nPreviousSuit === Suit.NoTrump) {
      const lvl = Math.min(3, Math.max(1, e.nPreviousBidLevel));
      const credited = e.conventions.getNTRangeMin(lvl);
      e.m_fPartnersMin = PTS_NT_GAME - credited;
      e.m_fPartnersMax = Math.min(22, 40 - e.fCardPts);
    } else {
      e.m_fPartnersMin = e.openPts(19);
      e.m_fPartnersMax = Math.min(
        e.openPts(e.conventions.getValue(ConventionId.TwoClubOpeningPoints)),
        40 - e.fCardPts,
      );
    }
    status?.stream(
      `2B3Y00! Partner has made a jump shift to ${e.szPB} after our opening ${e.szPVB} bid, which indicates ${e.m_fPartnersMin}+ points and is forcing to game (and points to a possible slam).\n`,
    );

    e.m_bGameForceActive = true;
    if (e.hand && e.nPartnersSuitSupport >= SuitStrength.WeakSupport) {
      e.fAdjPts = e.hand.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
    }
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.m_fMinTPPoints < PTS_SLAM) {
      if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.RelativeByOne, 0, PTS_SLAM - 1, SupportLength.Four)) {
        return e.validateBid(e.m_nBid);
      }

      if (e.bBalanced && e.nPartnersBidLevel <= 3 && e.hand?.allOtherSuitsStopped(e.nPartnersSuit)) {
        e.m_nBid = Bid.NT3;
        status?.stream(
          `B3Y14! With a balanced distribution and all unbid suits stopped, bid ${bidToFullString(e.m_nBid)} in preference to partner's minor.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.bPreviousSuitIsSelfSupporting && isSuit(e.nPreviousSuit)) {
        e.m_nBid = isMajor(e.nPreviousSuit) ? makeBid(e.nPreviousSuit, 4) : makeBid(e.nPreviousSuit, 5);
        status?.stream(
          `B3Y18! With our self-supporting ${e.szPVSS} suit with ${e.numPreviousSuitCards} cards and ${e.numHonorsInPreviousSuit} honors, and ${e.fCardPts}/${e.fPts} points in hand, we should be able to make a game contract in the suit with little help from partner, so bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.nPPrevSuitSupport >= e.nPartnersSuitSupport) {
        if (e.raisePartnersSuitEngine(SuitType.Previous, RaiseTarget.ToGame, 0, 0, SupportLength.Three)) {
          return e.validateBid(e.m_nBid);
        }
      } else {
        if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.ToGame, 0, 0, SupportLength.Three)) {
          return e.validateBid(e.m_nBid);
        }
      }

      if (isSuit(e.nPreviousSuit)) {
        const rebid = e.getCheapestShiftBid(e.nPreviousSuit);
        if (e.bPreviousSuitIsRebiddable && e.isBidSafe(rebid)) {
          e.m_nBid = rebid;
          status?.stream(
            `B3Y22! With a rebiddable ${e.szPVS} suit and ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPS} (holding ${e.szHP}), rebid our suit at ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      if (e.nPreviousSuit === Suit.NoTrump && e.nPartnersBid >= e.getGameBid(e.nPartnersSuit)) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B3Y23! Partner's jump to game in ${e.szPS} implies a 6+ card holding in the suit, so with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, pass with  our ${e.numSupportCards}-card support.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      const nSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit);
      if (isSuit(nSuit) && e.isSuitShiftable(nSuit)) {
        e.m_nBid = e.getCheapestShiftBid(nSuit);
        status?.stream(
          `B3Y24! With weak support for partner's ${e.szPS} (holding ${e.szHP}) and no rebiddable suit, we have to show our strength by shifting to ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = e.getCheapestShiftBid(Suit.NoTrump);
        status?.stream(
          `B3Y28! With weak support for partner's ${e.szPS} (holding ${e.szHP}), no rebiddable suit, and no good second suit, we have to show our strength by shifting to ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // 33+ pts over jump shift
    const nextBestSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersSuit);
    if (e.numSupportCards >= 3) {
      if (e.nPartnersBid < e.getGameBid(e.nPartnersSuit)) {
        e.m_nBid = e.getCheapestShiftBid(e.nPartnersSuit, e.nLastBid);
        status?.stream(
          `B3Y40! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, move towards slam in partner's ${e.szPSS} suit by raising to ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else if (e.nPartnersBidLevel < 6) {
        e.m_nBid = makeBid(e.nPartnersSuit, 6);
        status?.stream(
          `B3Y40a! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, bid a slam in partner's ${e.szPSS} suit with a bid of ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else if (e.nPartnersBidLevel === 6 && e.m_fMinTPPoints >= PTS_GRAND_SLAM) {
        e.m_nBid = makeBid(e.nPartnersSuit, 7);
        status?.stream(
          `B3Y40b! Partner has bid a small slam at ${e.szPB}, but with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, go ahead and raise to a grand slam at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B3Y40c! Partner has bid slam, and with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, we sign off and pass..\n`,
        );
      }
    } else if (e.bPreviousSuitIsSelfSupporting && isSuit(e.nPreviousSuit)) {
      e.m_nBid = e.getCheapestShiftBid(e.nPreviousSuit, e.nLastBid);
      status?.stream(
        `B3Y41! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership but poor support for partner's suits, move towards slam in our own self-supporting ${Card.suitToSingularString(e.nPreviousSuit)} suit with a bid of ${bidToFullString(e.m_nBid)}.\n`,
      );
    } else if (isSuit(nextBestSuit) && e.isSuitOpenable(nextBestSuit)) {
      e.m_nBid = e.getCheapestShiftBid(nextBestSuit, e.nLastBid);
      status?.stream(
        `B3Y42! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership but poor support for partner's suits, bid our next best suit of ${Card.suitToString(nextBestSuit)} at ${bidToFullString(e.m_nBid)}.\n`,
      );
    } else if (e.bSemiBalanced) {
      e.m_nBid = e.getCheapestShiftBid(Suit.NoTrump, e.nLastBid);
      status?.stream(
        `B3Y43! With a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, a ${e.bBalanced ? ' ' : 'reasonably '}balanced hand, and poor support for partner's suits, and no strong suit of our own, push towards a slam in notrumps with a bid of ${bidToFullString(e.m_nBid)}.\n`,
      );
    } else if (e.bPreviousSuitIsRebiddable && isSuit(e.nPreviousSuit)) {
      e.m_nBid = e.getCheapestShiftBid(e.nPreviousSuit, e.nLastBid);
      status?.stream(
        `B3Y44! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership but poor support for partner's suits, move towards slam in our own ${Card.suitToSingularString(e.nPreviousSuit)} suit with a bid of ${bidToFullString(e.m_nBid)}.\n`,
      );
    } else {
      e.m_nBid = e.getCheapestShiftBid(Suit.NoTrump, e.nLastBid);
      status?.stream(
        `B3Y45! With a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership but poor support for partner's suits, and no strong suit of our own, push towards a slam in notrumps with a bid of ${bidToFullString(e.m_nBid)}.\n`,
      );
    }
    return e.validateBid(e.m_nBid);
  }

  e.m_nBid = Bid.Pass;
  status?.stream("B3Z00! Partner made a response which we don't understand; simply pass.\n");
  return e.validateBid(e.m_nBid);
}
