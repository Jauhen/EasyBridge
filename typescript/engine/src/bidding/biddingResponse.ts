//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// BiddingResponse.cpp -> biddingResponse.ts
//
// Responding bidding routines
//

import { Card } from '../card.js';
import { Bid, bidToFullString, isMajor, isMinor, isSuit, makeBid, Suit } from '../constants.js';
import { REVALUE_DUMMY } from '../hand.js';
import { ConventionId } from './biddingCodes.js';
import { PTS_GAME, PTS_NT_GAME, PTS_SLAM, SP_FIRST, SP_SECOND, SuitStrength } from './bidParameters.js';
import type { BidEngine } from './bidEngine.js';

//
// MakeRespondingBid()
//
// respond to partner's opening-round bid
//
export function makeRespondingBidEngine(e: BidEngine): Bid {
  const status = e.status;

  if (e.nPartnersBid !== Bid.Double) {
    status?.stream(
      `Responding to partner's${e.m_numPartnerBidTurns === 1 ? ' opening' : ' '} bid of ${bidToFullString(e.nPartnersBid)}.\n`,
    );
  } else {
    status?.stream(
      `Responding to partner's${e.m_numPartnerBidTurns === 1 ? ' opening' : ' '} double.\n`,
    );
  }

  // calculate adjusted dist points
  if (
    e.hand &&
    isSuit(e.nPartnersSuit) &&
    e.nPartnersBid !== Bid.C2 &&
    e.nPartnersBid < Bid.Double
  ) {
    e.fAdjPts = e.hand.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
  } else {
    e.fAdjPts = e.fPts;
  }

  // first check if a convention is appropriate
  if (e.applyConventionTestsInternal()) {
    return e.validateBid(e.m_nBid);
  }

  //
  // Responding to a 1NT, 2NT, or 3NT bid by partner
  //
  if (e.nPartnersBid === Bid.NT1 || e.nPartnersBid === Bid.NT2 || e.nPartnersBid === Bid.NT3) {
    let nMin = 0;
    let nMax = 0;
    if (e.nPartnersBid === Bid.NT1) {
      nMin = e.conventions.getValue(ConventionId.OneNTRangeMinPts);
      nMax = e.conventions.getValue(ConventionId.OneNTRangeMaxPts);
      status?.stream(`2A10! Partner's bid indicates ${nMin}-${nMax} points with balanced hand.\n`);
    } else if (e.nPartnersBid === Bid.NT2) {
      nMin = e.conventions.getValue(ConventionId.TwoNTRangeMinPts);
      nMax = e.conventions.getValue(ConventionId.TwoNTRangeMaxPts);
      status?.stream(`2A20! Partner's bid indicates ${nMin}-${nMax} points with balanced hand.\n`);
    } else {
      nMin = e.conventions.getValue(ConventionId.ThreeNTRangeMinPts);
      nMax = e.conventions.getValue(ConventionId.ThreeNTRangeMaxPts);
      if (nMin > 0) {
        status?.stream(`2A30! Partner's bid indicates ${nMin}-${nMax} points with balanced hand.\n`);
      } else {
        status?.stream(
          `2A31! Partner's bid is suspect given that the 3NT opening was precluded; assuming ${nMin}-${nMax} pts.\n`,
        );
      }
    }

    e.m_fMinTPPoints = nMin + e.fPts;
    e.m_fMaxTPPoints = nMax + e.fPts;
    e.m_fMinTPCPoints = nMin + e.fCardPts;
    e.m_fMaxTPCPoints = nMax + e.fCardPts;

    if (e.bSemiBalanced) {
      status?.stream(
        `2B00! Responding with a${e.bBalanced ? ' ' : ' reasonably'} balanced hand and ${e.fCardPts} HCP's, for a total in partnership of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs.\n`,
      );
      if (e.m_fMinTPCPoints <= PTS_GAME - 2) {
        e.m_nBid = Bid.Pass;
        status?.stream('B10! We do not have quite enough for game even if partner has max opening points, so pass.\n');
      } else if (e.m_fMinTPCPoints === PTS_GAME - 1) {
        if (!e.conventions.isOptionEnabled(ConventionId.FourSuitTransfers)) {
          e.m_nBid = Bid.C2;
          status?.stream(
            `B20! If partner has a max opening hand (${nMax} HCPs), we can make game at 3NT, and so we want to bid an invitational 2NT.  However, since we're playing 4-suit Jacoby Transfers, we have to bid 2C instead.\n`,
          );
        } else {
          e.m_nBid = Bid.NT2;
          status?.stream(
            `B22! If partner has a max opening hand (${nMax} HCPs), we can make game, so make an invitational ${bidToFullString(e.m_nBid)} bid.\n`,
          );
        }
      } else if (e.m_fMinTPCPoints >= PTS_NT_GAME && e.m_fMinTPCPoints <= PTS_SLAM - 3) {
        e.m_nBid = Bid.NT3;
        status?.stream(
          `B30! With ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} combined HC points, game is reachable.  Bid ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else if (e.m_fMinTPCPoints >= PTS_SLAM - 2 && e.m_fMinTPCPoints <= PTS_SLAM - 1) {
        e.m_nBid = Bid.NT4;
        status?.stream(
          `B40! With ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} combined HC points, entertain slam possibilities with an invitational ${bidToFullString(e.m_nBid)} bid.\n`,
        );
      } else if (e.m_fMinTPCPoints >= PTS_SLAM && e.m_fMinTPCPoints <= PTS_SLAM + 1) {
        e.m_nBid = Bid.NT6;
        status?.stream(
          `B50! With ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} combined HC points, a small slam should be reachable.  Bid ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else if (e.m_fMinTPCPoints >= PTS_SLAM + 2 && e.m_fMinTPCPoints <= PTS_SLAM + 3) {
        e.m_nBid = Bid.NT5;
        status?.stream(
          `B60! With ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} combined HC points, a grand slam may be possible if partner has a maximum opening hand.  So make an invitational bid of ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.NT7;
        status?.stream(
          `B70! With ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} combined HC points, we have enough for a grand slam.  So bid ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // unbalanced hand over NT
    if (e.m_fMinTPPoints < PTS_GAME - 3) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `C00! With only ${e.fCardPts}/${e.fPts} pts in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts, pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints < PTS_GAME) {
      if (
        e.numCardsInSuit[Suit.Hearts] >= 6 ||
        (e.numCardsInSuit[Suit.Spades] >= 6 && e.fPts >= PTS_GAME - 1)
      ) {
        const s = e.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 6);
        e.m_nBid = makeBid(s, 4);
        status?.stream(
          `C02! Have ${e.fCardPts}/${e.fPts} points with a ${e.numCardsInSuit[s]}-card ${Card.suitToSingularString(s)} suit, so jump to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        e.m_fMinTPCPoints >= PTS_GAME - 2 &&
        (e.numCardsInSuit[Suit.Clubs] >= 6 || e.numCardsInSuit[Suit.Diamonds] >= 6)
      ) {
        const s = e.getBestSuitOfAtLeast(Suit.Clubs, Suit.Diamonds, 6);
        e.m_nBid = Bid.NT3;
        status?.stream(
          `C04! Have ${e.fCardPts}/${e.fPts} points with a ${e.numCardsInSuit[s]}-card ${Card.suitToSingularString(s)} (minor) suit, so jump to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.numCardsInSuit[Suit.Hearts] >= 4 || e.numCardsInSuit[Suit.Spades] >= 4) {
        if (isMajor(e.nPrefSuit)) {
          const s = e.nPrefSuit as Suit;
          e.m_nBid = makeBid(s, 2);
          status?.stream(
            `C12! Have ${e.fCardPts}/${e.fPts} points with a ${e.suitStrengthToString(s)} ${Card.suitToSingularString(s)} suit (holding ${e.suitHoldingsToString(s)}), so bid ${bidToFullString(e.m_nBid)}${e.playingConvention(ConventionId.Stayman) ? '.' : ' (not playing Stayman).'}\n`,
          );
        }
        const s = e.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 4, SP_FIRST);
        e.m_nBid = makeBid(s, 2);
        status?.stream(
          `C16! Have ${e.fCardPts}/${e.fPts} points with a ${e.numCardsInSuit[s]}-card ${Card.suitToSingularString(s)} suit (holding ${e.suitHoldingsToString(s)}), so bid ${bidToFullString(e.m_nBid)}${e.playingConvention(ConventionId.Stayman) ? '.' : ' (not playing Stayman).'}\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      e.m_nBid = Bid.NT2;
      status?.stream(
        `C20! Have ${e.fCardPts} HCPs and no decent major suit, so bid ${bidToFullString(e.m_nBid)}; partner should raise to 3NT with max opening points.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints >= PTS_GAME && e.m_fMinTPPoints < PTS_SLAM) {
      if (e.numCardsInSuit[Suit.Hearts] >= 6 || e.numCardsInSuit[Suit.Spades] >= 6) {
        const s = e.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 6);
        e.m_nBid = makeBid(s, 4);
        status?.stream(
          `E00! Have ${e.fCardPts}/${e.fPts} points with a ${e.numCardsInSuit[s]}-card ${Card.suitToSingularString(s)} suit, so jump to game at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        e.m_fMinTPCPoints >= PTS_GAME - 1 &&
        (e.numCardsInSuit[Suit.Clubs] >= 6 || e.numCardsInSuit[Suit.Diamonds] >= 6)
      ) {
        const s = e.getBestSuitOfAtLeast(Suit.Clubs, Suit.Diamonds, 6);
        e.m_nBid = Bid.NT3;
        status?.stream(
          `E04! Have ${e.fCardPts}/${e.fPts} points with a ${e.numCardsInSuit[s]}-card ${Card.suitToSingularString(s)} (minor) suit, so ${e.nPartnersBid === Bid.NT1 ? 'jump to' : 'bid'}${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMajor(e.nPrefSuit) && e.numPrefSuitCards >= 5) {
        const s = e.nPrefSuit as Suit;
        e.m_nBid = makeBid(s, 3);
        status?.stream(
          `E08! Have ${e.fCardPts}/${e.fPts} points with a ${e.numCardsInSuit[s]}-card major ${Card.suitToSingularString(s)} suit, so ${e.nPartnersBid === Bid.NT1 ? 'jump to ' : 'bid '}${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMinor(e.nPrefSuit) && e.numPrefSuitCards >= 5) {
        const s = e.nPrefSuit as Suit;
        e.m_nBid = makeBid(s, 3);
        status?.stream(
          `E12! Have ${e.fCardPts}/${e.fPts} points with a ${e.numCardsInSuit[s]}-card minor ${Card.suitToSingularString(s)} suit, so ${e.nPartnersBid === Bid.NT1 ? 'jump to' : 'bid'}${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.numCardsInSuit[Suit.Hearts] >= 4 || e.numCardsInSuit[Suit.Spades] >= 4) {
        const s = e.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 4, SP_FIRST);
        e.m_nBid = makeBid(s, 2);
        status?.stream(
          `E20! Have ${e.fCardPts}/${e.fPts} points with a ${e.numCardsInSuit[s]}-card ${Card.suitToSingularString(s)} suit (holding ${e.suitHoldingsToString(s)}), so bid ${bidToFullString(e.m_nBid)}${e.playingConvention(ConventionId.Stayman) ? '.' : ' (not playing Stayman).'}\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      e.m_nBid = Bid.NT3;
      status?.stream(
        `E24! Have ${e.fCardPts}/${e.fPts} points with no long suit, so respond with ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // 33+ team pts: slam territory
    if (e.bPrefSuitIsSolid && e.numPrefSuitCards >= 6 && isSuit(e.nPrefSuit)) {
      e.m_nBid = e.getJumpShiftBid(e.nPrefSuit, e.nPartnersBid);
      status?.stream(
        `E30! With ${e.fCardPts}/${e.fPts} points and a solid ${Card.suitToSingularString(e.nPrefSuit)} suit (holding ${e.suitHoldingsToString(e.nPrefSuit)}), jump shift to ${bidToFullString(e.m_nBid)} to show slam prospects.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (isSuit(e.nPrefSuit)) {
      e.m_nBid = e.getJumpShiftBid(e.nPrefSuit, e.nPartnersBid);
      status?.stream(
        `E40! With ${e.fCardPts}/${e.fPts} points (though without a solid suit), jump shift to ${bidToFullString(e.m_nBid)} to show slam prospects.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
  }

  //
  // Responding to an opening 1-bid by partner
  //
  if (e.nPartnersBidLevel === 1 && isSuit(e.nPartnersSuit)) {
    const partnerOpenPos = e.partnerOpeningPosition;
    e.m_fPartnersMin = e.openPts(partnerOpenPos >= 2 ? 10 : 12);
    e.m_fPartnersMax = e.openPts(e.conventions.getValue(ConventionId.TwoClubOpeningPoints)) - 1;

    if (partnerOpenPos <= 1) {
      status?.stream(`2F00! Partner is showing ${e.m_fPartnersMin}+ points and 2+ QT's.\n`);
    } else {
      status?.stream(
        `2F01! Partner, opening in ${partnerOpenPos === 2 ? 'third' : 'fourth'} position, is showing ${e.m_fPartnersMin}+ points and 2+ QT's.\n`,
      );
    }

    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    // < 6 pts -> pass
    if (
      (e.nPartnersSuitSupport < SuitStrength.WeakSupport && e.fPts < e.openPts(6)) ||
      (e.nPartnersSuitSupport >= SuitStrength.WeakSupport && e.fAdjPts < e.openPts(6)) ||
      (isMinor(e.nPartnersSuit) && e.fPts < e.openPts(6))
    ) {
      e.m_nBid = Bid.Pass;
      if (e.fAdjPts > e.openPts(5) && e.nPartnersSuitSupport < SuitStrength.WeakSupport) {
        status?.stream(
          `F02! But we have only ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with weak trump support, so we have to pass.\n`,
        );
      } else if (isMajor(e.nPartnersSuit)) {
        status?.stream(`F03! But we have only ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, so we have to pass.\n`);
      } else {
        status?.stream(
          `F04! But we have only ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points against a minor suit bid, so we prefer to pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // 6-10.5 pts in hand
    if (
      (e.nPartnersSuitSupport < SuitStrength.WeakSupport && e.fPts >= e.openPts(6) && e.fPts < e.openPts(11)) ||
      (isMajor(e.nPartnersSuit) &&
        e.nPartnersSuitSupport >= SuitStrength.WeakSupport &&
        e.fAdjPts >= e.openPts(6) &&
        e.fAdjPts < e.openPts(11)) ||
      (isMinor(e.nPartnersSuit) &&
        e.nPartnersSuitSupport >= SuitStrength.WeakSupport &&
        e.fPts >= e.openPts(6) &&
        e.fAdjPts < e.openPts(11))
    ) {
      // triple raise in a major
      if (
        isMajor(e.nPartnersSuit) &&
        e.fCardPts >= e.openPts(6) &&
        e.fCardPts < e.openPts(10) &&
        e.numSupportCards >= 5 &&
        (e.numVoids > 0 || e.numSingletons > 0)
      ) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 4);
        const shapeDesc =
          e.numVoids === 1
            ? 'a void suit'
            : e.numVoids > 1
              ? `${e.numVoids} void suits`
              : e.numSingletons === 1
                ? 'a singleton'
                : `${e.numSingletons} singleton suits`;
        status?.stream(
          `G00! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.numSupportCards} trumps and ${shapeDesc}, so make a triple raise of ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMajor(e.nPartnersSuit)) {
        if (
          e.nPartnersSuitSupport <= SuitStrength.WeakSupport &&
          e.nPartnersSuit === Suit.Hearts &&
          e.nSuitStrength[Suit.Spades] >= SuitStrength.Openable
        ) {
          e.m_nBid = makeBid(Suit.Spades, 1);
          status?.stream(
            `G3! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} (${e.szHP}) support for partner's ${e.szPSS} suit but hold a ${e.suitStrengthToString(Suit.Spades)} ${e.numCardsInSuit[Suit.Spades]}-card Spade suit, so bid ${bidToFullString(e.m_nBid)} instead.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        if (e.nPartnersSuitSupport >= SuitStrength.WeakSupport) {
          e.m_nAgreedSuit = e.nPartnersSuit;
          e.m_nBid = makeBid(e.nPartnersSuit, 2);
          status?.stream(
            `G08! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points and ${e.numSupportCards}-card (${e.szHP}) ${e.szPSS} trump support${e.playingConvention(ConventionId.FiveCardMajors) && e.numSupportCards >= 3 ? ' playing 5-card majors,' : ','} so raise to ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        if (
          e.nPartnersSuit === Suit.Hearts &&
          (e.nPrefSuit === Suit.Spades || e.numCardsInSuit[Suit.Spades] >= 5)
        ) {
          e.m_nBid = makeBid(Suit.Spades, 1);
          if (e.numCardsInSuit[Suit.Spades] >= 5) {
            status?.stream(
              `G12! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} (${e.szHP}) support for partner's ${e.szPSS} suit but hold a ${e.numCardsInSuit[Suit.Spades]}-card Spade suit, so bid ${bidToFullString(e.m_nBid)} instead.\n`,
            );
          } else {
            status?.stream(
              `G13! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} (${e.szHP}) support for partner's ${e.szPSS} suit but hold a ${e.suitStrengthToString(Suit.Spades)} Spade suit, so bid ${bidToFullString(e.m_nBid)} instead.\n`,
            );
          }
          return e.validateBid(e.m_nBid);
        }
      }

      if (isMinor(e.nPartnersSuit)) {
        if (isMajor(e.nPrefSuit) && e.numPrefSuitCards >= 4) {
          e.m_nBid = makeBid(e.nPrefSuit as Suit, 1);
          status?.stream(
            `G20! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts with an available ${e.numPrefSuitCards}-card major suit in ${e.szPrefS} (${e.szHPref}), so bid ${bidToFullString(e.m_nBid)} over partner's minor suit ${e.szPB} bid.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
        if (e.numCardsInSuit[Suit.Hearts] >= 4 || e.numCardsInSuit[Suit.Spades] >= 4) {
          const s = e.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 4, SP_FIRST);
          if (e.numSuitPoints[s] >= 2) {
            e.m_nBid = makeBid(s, 1);
            status?.stream(
              `G28! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts with an available ${e.numCardsInSuit[s]}-card major ${Card.suitToSingularString(s)} suit, so bid ${bidToFullString(e.m_nBid)} over partner's minor suit ${e.szPB} bid.\n`,
            );
            return e.validateBid(e.m_nBid);
          }
        }
      }

      // 2/1 with 10 HCPs and a good suit
      if (
        isSuit(e.nPrefSuit) &&
        e.nPrefSuit < e.nPartnersSuit &&
        e.fCardPts >= e.openPts(10) &&
        e.nPrefSuitStrength >= SuitStrength.Openable
      ) {
        e.m_nBid = makeBid(e.nPrefSuit, 2);
        status?.stream(
          `G32! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}; bid the preferred ${e.szPrefSS} suit 2/1 at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      // 2/1 with 9 pts and a solid strong suit
      if (
        isSuit(e.nPrefSuit) &&
        e.nPrefSuit < e.nPartnersSuit &&
        e.fCardPts >= e.openPts(9) &&
        e.nPrefSuitStrength >= SuitStrength.Strong &&
        e.bPrefSuitIsSolid
      ) {
        e.m_nBid = makeBid(e.nPrefSuit, 2);
        status?.stream(
          `G36! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}); bid the preferred ${e.szPrefSS} suit 2/1 at ${bidToFullString(e.m_nBid)} (shade the 10 pt 2/1 rqmt because of the good suit).\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        isMinor(e.nPartnersSuit) &&
        e.numVoids === 0 &&
        e.numSingletons === 0 &&
        e.numSuitsProbStopped >= 3 &&
        e.fPts >= 6
      ) {
        e.m_nBid = Bid.NT1;
        status?.stream(
          `G40! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts}% points with no good majors, no other good suit of our own, and a semi-balanced distribution with strength in ${e.numSuitsProbStopped === 4 ? 'all four' : 'three'} suits, bid ${bidToFullString(e.m_nBid)} in preference to partner's minor.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        e.nPartnersSuit === Suit.Clubs &&
        e.nPrefSuit === Suit.Diamonds &&
        e.fPts >= e.openPts(6) &&
        e.nPrefSuitStrength >= SuitStrength.Openable
      ) {
        e.m_nBid = Bid.D1;
        status?.stream(
          `G44! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts with no 4-card major suits, so bid ${bidToFullString(e.m_nBid)} in preference to raising partner's minor ${e.szPS} suit.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMinor(e.nPartnersSuit) && e.nPartnersSuitSupport >= SuitStrength.GoodSupport) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 2);
        status?.stream(
          `G48! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}) and no good major suits, so raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      // 1NT as last resort
      if (isMinor(e.nPartnersSuit)) {
        if (e.nPrefSuit < e.nPartnersSuit) {
          status?.stream(
            `G60! We have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's minor ${e.szPSS} suit (holding ${e.szHP}) which we prefer not to raise, and not enough strength for a 2/1 response to show our ${e.szPrefSS} suit, so bid 1NT.\n`,
          );
        } else {
          status?.stream(
            `G62! We have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's minor ${e.szPSS} suit (holding ${e.szHP}) which we prefer not to raise, and we have no good major suit of our own, so bid 1NT.\n`,
          );
        }
      } else {
        if (e.nPrefSuit < e.nPartnersSuit) {
          status?.stream(
            `G64! We have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}) and not enough strength for a 2/1 response to show our ${e.szPrefSS} suit, so bid 1NT.\n`,
          );
        } else {
          status?.stream(
            `G68! We have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}) and no good major of our own, so bid 1NT.\n`,
          );
        }
      }
      e.m_nBid = Bid.NT1;
      return e.validateBid(e.m_nBid);
    }

    // 11-12.5 pts in hand
    if (
      (e.nPartnersSuitSupport < SuitStrength.WeakSupport && e.fPts >= e.openPts(11) && e.fPts < e.openPts(13)) ||
      (e.nPartnersSuitSupport >= SuitStrength.WeakSupport && e.fAdjPts >= e.openPts(11) && e.fAdjPts < e.openPts(13))
    ) {
      if (
        isMajor(e.nPartnersSuit) &&
        e.fCardPts > e.openPts(5) &&
        e.fCardPts < e.openPts(10) &&
        e.numSupportCards >= 5 &&
        (e.numVoids > 0 || e.numSingletons > 0)
      ) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 4);
        status?.stream(
          `H00! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.numSupportCards} trumps, so make a triple raise of ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        isMajor(e.nPartnersSuit) &&
        e.playingConvention(ConventionId.LimitRaises) &&
        e.fAdjPts >= e.openPts(11) &&
        e.numSupportCards >= 4
      ) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `H02! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.numSupportCards}-card trump support (holding ${e.szHP}) playing limit raises, so raise partner's ${e.szPS} to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        isMinor(e.nPartnersSuit) &&
        ((e.numCardsInSuit[Suit.Hearts] >= 5 && e.nSuitStrength[Suit.Hearts] >= SuitStrength.Openable) ||
          (e.numCardsInSuit[Suit.Spades] >= 5 && e.nSuitStrength[Suit.Spades] >= SuitStrength.Openable))
      ) {
        const s = e.pickSuperiorSuit(Suit.Spades, Suit.Hearts);
        e.m_nBid = makeBid(s, 1);
        status?.stream(
          `H03! We have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points and a ${e.numCardsInSuit[s]}-card ${Card.suitToSingularString(s)} suit, so respond with ${bidToFullString(e.m_nBid)} in preference to partner's minor.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isSuit(e.nPrefSuit) && e.nPrefSuit !== e.nPartnersSuit) {
        e.m_nBid = e.getCheapestShiftBid(e.nPrefSuit);
        if (isMajor(e.nPartnersSuit)) {
          const code = e.nPartnersSuitSupport <= SuitStrength.WeakSupport ? 'H04' : 'H05';
          status?.stream(
            `${code}! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points${e.playingConvention(ConventionId.LimitRaises) ? ' ' : ' (in between single & double raise ranges) '} and ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}), so show our preferred ${e.szPrefSS} suit in a ${bidToFullString(e.m_nBid)} bid.\n`,
          );
          return e.validateBid(e.m_nBid);
        } else if (e.nPartnersSuitSupport <= SuitStrength.WeakSupport || isMajor(e.nPrefSuit)) {
          status?.stream(
            `H08! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points${e.playingConvention(ConventionId.LimitRaises) ? ' ' : ' (in between single & double raise ranges) '} but prefer to show our own ${e.szPrefSS} suit instead of raising a minor, so bid ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      if (
        isMajor(e.nPartnersSuit) &&
        e.fAdjPts >= e.openPts(11) &&
        e.nPartnersSuitSupport > SuitStrength.GoodSupport
      ) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `H20! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}), so we can raise to ${bidToFullString(e.m_nBid)}\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        isMajor(e.nPartnersSuit) &&
        e.fAdjPts < e.openPts(13) &&
        e.nPartnersSuitSupport >= SuitStrength.WeakSupport
      ) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 2);
        status?.stream(
          `H24! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}) and no other good suit of our own, so raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMinor(e.nPartnersSuit) && (e.isSuitShiftable(Suit.Hearts) || e.isSuitShiftable(Suit.Spades))) {
        const s = e.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 4, SP_SECOND);
        if (e.numSuitPoints[s] >= 2) {
          e.m_nBid = e.getCheapestShiftBid(s);
          status?.stream(
            `H28! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points but prefer not to raise a minor, so bid our ${e.numCardsInSuit[s]}-card major ${Card.suitToSingularString(s)} suit instead at ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      if (isMinor(e.nPartnersSuit) && e.nPartnersSuitSupport >= SuitStrength.WeakSupport) {
        if (e.playingConvention(ConventionId.LimitRaises) && e.numSupportCards >= 4) {
          e.m_nBid = makeBid(e.nPartnersSuit, 3);
          status?.stream(
            `H40! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.numSupportCards}-card support for partner's minor ${e.szPSS} suit (holding ${e.szHP}) playing limit raises, and we have no other good suits, so jump raise partner to ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.m_nBid = makeBid(e.nPartnersSuit, 2);
          status?.stream(
            `H42! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with no other good suits, so have to raise partner' minor ${e.szPSS} suit (holding ${e.szHP}) to ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
        e.m_nAgreedSuit = e.nPartnersSuit;
        return e.validateBid(e.m_nBid);
      }

      if (e.fPts >= 10) {
        const s = e.getNextBestSuit(e.nPartnersSuit);
        if (e.isSuitShiftable(s)) {
          e.m_nBid = makeBid(s, 2);
          status?.stream(
            `H50! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, but have ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}), and don't have a good suit of our own, so just shift to ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      e.m_nBid = Bid.NT1;
      status?.stream(
        `H60! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, but can't support partner's ${e.szPSS} suit at even the 2-level (holding ${e.szHP}), and have only weak suits of our own, so give up and bid 1NT.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // 13-18.5 pts in hand
    if (
      (e.nPartnersSuitSupport < SuitStrength.WeakSupport && e.fPts >= e.openPts(13) && e.fPts < e.openPts(19)) ||
      (e.nPartnersSuitSupport >= SuitStrength.WeakSupport && e.fAdjPts >= e.openPts(13) && e.fAdjPts < e.openPts(19))
    ) {
      if (
        !e.playingConvention(ConventionId.LimitRaises) &&
        isMajor(e.nPartnersSuit) &&
        e.nPartnersSuitSupport >= SuitStrength.GoodSupport
      ) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `I00! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (${e.szHP}), so make a double raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        e.bBalanced &&
        e.m_fMinTPCPoints >= PTS_NT_GAME - 1 &&
        e.hand?.allOtherSuitsStopped(e.nPartnersSuit)
      ) {
        e.m_nBid = e.m_fMinTPCPoints > PTS_GAME + 1 ? Bid.NT3 : Bid.NT2;
        status?.stream(
          `I04! Have ${e.fCardPts} HCPs in hand, for a total in the partnership of approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPS, and all${e.numSuitsStopped === 4 ? ' four' : ' unbid'} suits are stopped, so jump to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (
        e.playingConvention(ConventionId.LimitRaises) &&
        e.nPartnersSuitSupport >= SuitStrength.WeakSupport
      ) {
        e.m_nIntendedSuit = e.nPartnersSuit;
        const s = e.getNextBestSuit(e.nPartnersSuit);
        e.m_nBid = e.getCheapestShiftBid(s);
        status?.stream(
          `I08! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.numSupportCards}-card support for partner's ${e.szPS} (holding ${e.szHP}), which is too strong for a limit raise, so we have to temporarily shift to ${Card.suitToString(s)} with a bid of ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isSuit(e.nPrefSuit) && e.nPrefSuit !== e.nPartnersSuit) {
        e.m_nBid = e.getCheapestShiftBid(e.nPrefSuit);
        if (isMajor(e.nPartnersSuit)) {
          status?.stream(
            `I12! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points but insufficient trump support (holding ${e.szHP}) for a double raise, so show our own ${e.szPrefSS} suit by bidding ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          status?.stream(
            `I14! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points but we prefer to shift instead of raising a minor ${e.szPSS} suit, so show our own ${e.szPrefSS} suit by bidding ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
        return e.validateBid(e.m_nBid);
      }

      if (
        !e.playingConvention(ConventionId.LimitRaises) &&
        isMajor(e.nPartnersSuit) &&
        e.fAdjPts >= e.openPts(16) &&
        e.numSupportCards >= 4
      ) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `I16! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points with ${e.supportLevelToString(e.nPartnersSuit)} support for partner's major ${e.szPSS} suit (holding ${e.szHP}_; a double raise to ${bidToFullString(e.m_nBid)} is reasonable.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMinor(e.nPartnersSuit) && (e.isSuitShiftable(Suit.Hearts) || e.isSuitShiftable(Suit.Spades))) {
        const s = e.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 4, SP_SECOND);
        if (e.numSuitPoints[s] >= 1) {
          e.m_nBid = e.getCheapestShiftBid(s);
          status?.stream(
            `I18! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points but prefer not to raise a minor, so bid our ${e.numCardsInSuit[s]}-card major ${Card.suitToSingularString(s)} suit instead at ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      if (isMinor(e.nPartnersSuit) && e.nPartnersSuitSupport >= SuitStrength.GoodSupport) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = makeBid(e.nPartnersSuit, 3);
        status?.stream(
          `I20! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points and ${e.supportLevelToString(e.nPartnersSuit)} support for partner's minor ${e.szPSS} suit (holding ${e.szHP}).  Although we'd prefer not to raise a minor, we have no other good options, so raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      e.m_nAgreedSuit = e.nPartnersSuit;
      e.m_nBid = makeBid(e.nPartnersSuit, 2);
      status?.stream(
        `I24! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points, but have only ${e.supportLevelToString(e.nPartnersSuit)} support for partner's ${e.szPSS} suit (holding ${e.szHP}), and no good suit of our own, so we can only raise to ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // 19+ pts in hand -> jump shift
    if (
      (e.nPartnersSuitSupport < SuitStrength.WeakSupport && e.fPts >= e.openPts(19)) ||
      (e.nPartnersSuitSupport >= SuitStrength.WeakSupport && e.fAdjPts >= e.openPts(19))
    ) {
      if (isSuit(e.nPrefSuit) && e.nPrefSuit !== e.nPartnersSuit) {
        e.m_nBid = e.getJumpShiftBid(e.nPrefSuit, e.nPartnersBid);
        status?.stream(
          `J10! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points; show strength by jump shifting to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      e.m_nIntendedSuit = e.nPartnersSuit;
      const s = e.getNextBestSuit(e.nPartnersSuit);
      e.m_nBid = e.getJumpShiftBid(s, e.nPartnersBid);
      status?.stream(
        `J20! Have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points; show strength by jump shifting to ${bidToFullString(e.m_nBid)}, even though it's not the preferred suit.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
  }

  // Partner doubled or redoubled
  if (e.nPartnersBid === Bid.Double || e.nPartnersBid === Bid.Redouble) {
    e.m_nBid = Bid.Pass;
    status?.stream(`B2RspD! Assuming partner's ${e.szPB} is for penalties and pass.\n`);
    return e.validateBid(e.m_nBid);
  }

  status?.stream(
    `<<Error>> -- ZA0! fell out of decision loop.  Partner's bid was ${bidToFullString(e.nPartnersBid)}; points are ${e.fCardPts}/${e.fPts}/${e.fAdjPts}, preferred suit is ${e.szPrefSS} (holding ${e.szHPref}).  Returning PASS\n`,
  );
  e.m_nBid = Bid.Pass;
  return e.validateBid(e.m_nBid);
}
