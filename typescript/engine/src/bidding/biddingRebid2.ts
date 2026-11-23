//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// BiddingRebid2.cpp -> biddingRebid2.ts
//
// Responder's rebidding routines (MakeRebidAsResponder)
//

import { Card } from '../card.js';
import { Bid, bidLevel, bidToFullString, isMajor, isMinor, isSuit, makeBid, NONE, Suit } from '../constants.js';
import { REVALUE_DECLARER, REVALUE_DUMMY } from '../hand.js';
import { BiddingOption, ConventionId } from './biddingCodes.js';
import {
  makeDirectSuit,
  PTS_GAME,
  PTS_GRAND_SLAM,
  PTS_MAJOR_GAME,
  PTS_MINOR_GAME,
  PTS_NT_GAME,
  PTS_SLAM,
  PTS_SMALL_SLAM,
  RaiseTarget,
  RebidTarget,
  ShiftTarget,
  SP_FIRST,
  StoppedCode,
  SuitLength,
  SuitStrength,
  SuitType,
  SupportLength,
} from './bidParameters.js';
import type { BidEngine } from './bidEngine.js';

//
// MakeRebidAsResponder()
//
// 4th bid -- i.e., responding to opening partner's rebid
//
export function makeRebidAsResponderEngine(e: BidEngine): Bid {
  const status = e.status;

  status?.stream(
    `2Rebidding as responder after bids of ${e.szPPB}, ${e.szPVB}, and ${e.szPB}.\n`,
  );

  // defer point count adjustment until later

  //
  //==========================================================
  //
  // first check if a convention is appropriate
  //
  if (e.applyConventionTestsInternal()) {
    return e.validateBid(e.m_nBid);
  }

  //
  //==========================================================
  //
  // Rebidding after partner has passed
  //
  // we can only pass
  //
  if (e.nPartnersBid === Bid.Pass) {
    e.m_nBid = Bid.Pass;
    return e.validateBid(e.m_nBid);
  }

  //
  //==========================================================
  //
  // Rebidding after opener made minimum rebid in original suit
  // e.g., 1h -> 1s -> 2h, showing: 12-16 pts and 6 cards (or maybe 5)
  //
  if (
    e.nPartnersSuit === e.nPartnersPrevSuit &&
    e.nPartnersBid - e.nPartnersPrevBid <= 5 &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPartnersSuit)
  ) {
    // else a plain old 1-level opening
    e.m_fPartnersMin = e.getPartnerMinimumOpeningValue();
    e.m_fPartnersMax = 16;
    status?.stream(
      `2B4C4! Partner made a minimum rebid of his ${e.szPSS} suit at ${e.szPB}, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points and 5+ trump cards.\n`,
    );

    // get adjusted point count in support of partner
    e.fAdjPts = e.hand!.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    // pass with <= 20 min total points
    if (e.m_fMinTPPoints <= PTS_GAME - 6) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4C10! With ${e.fCardPts}/${e.fPts} points in the hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, we have to settle for the current bid and pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // with 21-25 TPs, raise partner with 3 trumps,
    // rebid a new suit, or bid NT

    // raise partner's major to the 3-level with 22-25 total pts and 3-card trump support
    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.One, PTS_GAME - 4, PTS_GAME - 1, SupportLength.Len3))
      return e.validateBid(e.m_nBid);
    // or with a doubleton honor
    if (
      e.raisePartnersSuitEngine(
        SuitType.Major,
        RaiseTarget.One,
        PTS_GAME - 4,
        PTS_GAME - 1,
        SupportLength.Len3,
        SuitStrength.Any,
        1,
        1,
      )
    )
      return e.validateBid(e.m_nBid);

    // with 21-22 TPs, bid a second 5-card suit
    if (e.bidNextBestSuitEngine(SuitType.Any, ShiftTarget.Cheapest, PTS_GAME - 5, PTS_GAME - 4, SuitLength.Five))
      return e.validateBid(e.m_nBid);

    // with 21-22 TPs, rebid a good 6-card suit
    if (
      e.rebidSuitEngine(
        SuitType.Any,
        RebidTarget.Cheapest,
        PTS_GAME - 5,
        PTS_GAME - 4,
        SuitLength.Six,
        SuitStrength.Strong | SuitStrength.Solid,
      )
    )
      return e.validateBid(e.m_nBid);

    // with 23-25 total HCPs, bid 2NT with the other suits stopped
    if (e.nPartnersBidLevel === 2) {
      if (e.bidNoTrumpEngine(2, PTS_GAME - 3, PTS_GAME - 1, false, StoppedCode.Unbid))
        return e.validateBid(e.m_nBid);
    }

    // with 23-25 TPs, jump rebid a good 6-card major
    if (
      e.rebidSuitEngine(
        SuitType.Major,
        RebidTarget.Jump1,
        PTS_GAME - 3,
        PTS_GAME - 1,
        SuitLength.Six,
        SuitStrength.Strong | SuitStrength.Solid,
      )
    )
      return e.validateBid(e.m_nBid);

    // or rebid a good 6-card minor with 21-25 pts
    if (
      e.rebidSuitEngine(
        SuitType.Minor,
        RebidTarget.Cheapest,
        PTS_MINOR_GAME - 8,
        PTS_MINOR_GAME - 4,
        SuitLength.Six,
        SuitStrength.Strong | SuitStrength.Solid,
      )
    )
      return e.validateBid(e.m_nBid);

    // if none of the above apply, escape into NT or pass with <= 25 pts
    if (e.m_fMinTPPoints < PTS_GAME) {
      if (e.numSupportCards >= 2 || e.nPartnersBidLevel >= 4) {
        e.m_nBid = Bid.Pass;
        if (e.nPartnersBid < e.getGameBid(e.nPartnersSuit))
          status?.stream(
            `B4C18! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and no clear direction in the bidding, pass.\n`,
          );
        else
          status?.stream(
            `B4C18a! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, sign off on partner's ${e.szPB} bid.\n`,
          );
      } else {
        e.m_nBid = e.getCheapestShiftBid(Suit.NoTrump);
        status?.stream(
          `B4C19! with ${e.numSupportCards === 1 ? 'only a single trump' : 'zero trump support'}, we have to escape from partner's ${e.szPS} and bid ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // Here, we have 26+ min total points

    // 26-32 TPs: raise partner's major to 4 with 3+ trumps
    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3))
      return e.validateBid(e.m_nBid);
    // or with a doubleton honor
    if (
      e.raisePartnersSuitEngine(
        SuitType.Major,
        RaiseTarget.To4,
        PTS_GAME,
        PTS_SLAM - 1,
        SupportLength.Len2,
        SuitStrength.Any,
        1,
      )
    )
      return e.validateBid(e.m_nBid);

    // bid 3NT with the other suits stopped and 26-32 HCPs
    if (e.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_SLAM - 1, false, StoppedCode.Unbid))
      return e.validateBid(e.m_nBid);
    // or 2NT without the suits stopped and but 29-32 HCPs
    if (e.bidNoTrumpEngine(2, PTS_NT_GAME + 3, PTS_SLAM - 1, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);

    // jump to 4 in a self-supporting major
    if (
      e.rebidSuitEngine(
        SuitType.Major,
        RebidTarget.At4,
        PTS_GAME,
        PTS_SLAM - 1,
        SuitLength.Six,
        SuitStrength.SelfSupporting,
        4,
      )
    )
      return e.validateBid(e.m_nBid);
    // or one with 7+ cards and 3 honors
    if (
      e.rebidSuitEngine(
        SuitType.Major,
        RebidTarget.At4,
        PTS_GAME,
        PTS_SLAM - 1,
        SuitLength.Six,
        SuitStrength.Strong,
        3,
      )
    )
      return e.validateBid(e.m_nBid);

    // raise partner's minor to game with 29 pts & 4 trumps
    if (e.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To5, PTS_MINOR_GAME, PTS_SLAM - 1, SupportLength.Len4))
      return e.validateBid(e.m_nBid);
    // else raise partner's minor to 4 with 4+ trumps and 26-28 pts
    if (
      e.raisePartnersSuitEngine(
        SuitType.Minor,
        RaiseTarget.To4,
        PTS_MINOR_GAME - 3,
        PTS_MINOR_GAME - 1,
        SupportLength.Len4,
      )
    )
      return e.validateBid(e.m_nBid);
    // or with a TRIPLETON honor and 26-28 pts
    if (
      e.raisePartnersSuitEngine(
        SuitType.Minor,
        RaiseTarget.To4,
        PTS_MINOR_GAME - 3,
        PTS_MINOR_GAME - 1,
        SupportLength.Len3,
        SuitStrength.Any,
        1,
      )
    )
      return e.validateBid(e.m_nBid);

    // 27-32 TPs: raise partner's rebid major to 4 with 2+ trumps
    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME + 1, PTS_SLAM - 1, SupportLength.Len2))
      return e.validateBid(e.m_nBid);

    // bid 3NT with 28+ HCPs without all suits stopped
    if (e.bidNoTrumpEngine(3, PTS_NT_GAME + 2, PTS_SLAM - 1, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);
    // or 2NT with 25-27 HCPs without all suits stopped
    if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 1, PTS_NT_GAME + 1, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);

    // if none of the above apply, pass with < 29 pts
    if (e.m_fMinTPPoints < PTS_MINOR_GAME) {
      e.m_nBid = Bid.Pass;
      if (e.nPartnersBid < e.getGameBid(e.nPartnersSuit))
        status?.stream(
          `B4C28! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership but no clear direction in the bidding, pass.\n`,
        );
      else
        status?.stream(
          `B4C28a! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, sign off on partner's ${e.szPB} bid.\n`,
        );
      return e.validateBid(e.m_nBid);
    }

    // otherwise we have 29+ min total pts, we have slam prospects
    if (e.m_fMinTPPoints >= PTS_MINOR_GAME) {
      status?.stream(
        `B4C20! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we want to explore slam opportunities.\n`,
      );
    }

    if (e.nPartnersSuitSupport >= SuitStrength.ModerateSupport && e.nPrefSuitStrength < SuitStrength.Strong) {
      e.m_nAgreedSuit = e.nPartnersSuit;
    }
    if (e.nPartnersSuitSupport >= SuitStrength.WeakSupport && e.nPrefSuitStrength < SuitStrength.Openable) {
      e.m_nAgreedSuit = e.nPartnersSuit;
    }

    if (e.m_nAgreedSuit >= Suit.Clubs && e.m_nAgreedSuit < Suit.NoTrump) {
      if (e.m_fMinTPPoints >= PTS_SLAM) {
        e.invokeBlackwood(e.m_nAgreedSuit);
        return e.validateBid(e.m_nBid);
      } else {
        const nTestBid = makeBid(e.m_nAgreedSuit, e.nPartnersBidLevel + 2);
        if (nTestBid <= e.getGameBid(e.m_nAgreedSuit)) {
          e.m_nBid = nTestBid;
          status?.stream(
            `B4C24! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts, and with ${e.numSupportCards}-card trump support in ${Card.suitToString(e.m_nAgreedSuit)}, explore slam possibilities with an invitational bid of ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.invokeBlackwood(e.m_nAgreedSuit);
        }
        return e.validateBid(e.m_nBid);
      }
    }

    // jump rebid with a solid suit
    if (
      e.rebidSuitEngine(
        SuitType.Any,
        RebidTarget.Jump1,
        PTS_MINOR_GAME,
        0,
        SuitLength.Five,
        SuitStrength.Strong | SuitStrength.Solid,
      )
    )
      return e.validateBid(e.m_nBid);

    // or jump shift to another solid suit
    if (
      e.bidNextBestSuitEngine(
        SuitType.Any,
        ShiftTarget.Jump1,
        PTS_MINOR_GAME,
        0,
        SuitLength.Five,
        SuitStrength.Strong | SuitStrength.Solid,
      )
    )
      return e.validateBid(e.m_nBid);

    // with no suit agreement but with 33+ HCPs, invoke Blackwood with NT in mind
    if (e.m_fMinTPCPoints >= PTS_SLAM) {
      e.invokeBlackwood(Suit.NoTrump);
      return e.validateBid(e.m_nBid);
    }

    // or if nothing else is available, jump rebid a decent 5-card suit
    if (e.rebidSuitEngine(SuitType.Any, RebidTarget.Jump1, PTS_MINOR_GAME, 0, SuitLength.Five, SuitStrength.Openable))
      return e.validateBid(e.m_nBid);

    // fallen through
    if (e.m_fMinTPPoints < PTS_GAME - 3) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4C30! With ${e.fCardPts}/${e.fPts} pts in hand, no rebiddable suit or second openable suit, and poor fit for partner's ${e.szPS}, simply pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.bidNextBestSuitEngine(SuitType.Any)) {
      status?.stream(
        `B4C34! We have ${e.fCardPts}/${e.fPts} pts in hand and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, but have no good fit with partner and no rebiddable suit, so we have no choice but to shift to yet another suit.\n`,
      );
    } else {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4C35! We have ${e.fCardPts}/${e.fPts} pts in hand and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, but have no good fit with partner and no rebiddable suit, and we've run out of safe bidding space, so we're forced to pass.\n`,
      );
    }
    return e.validateBid(e.m_nBid);
  } // end of minimum rebid section

  //
  //==========================================================
  //
  // Rebidding after opener made a jump rebid in original suit
  // e.g., 1h -> 1s -> 3h, or even
  //       1h -> 1s -> 4h, showing 17-19 points
  //
  if (
    e.nPartnersSuit === e.nPartnersPrevSuit &&
    e.nPartnersSuit !== e.nPreviousSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPartnersSuit) &&
    e.nPartnersBid - e.nPreviousBid > 5
  ) {
    e.m_fPartnersMin = Math.max(e.m_fPartnersMin, 17);
    e.m_fPartnersMax = Math.max(e.m_fPartnersMax, 19);
    status?.stream(
      `2B4D0! Partner made a jump rebid of his ${e.szPSS} suit to ${e.szPB}, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.\n`,
    );

    // get adjusted point count in support of partner
    e.fAdjPts = e.hand!.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    // see if partner already jumped to game or beyond
    if (e.nPartnersBid >= e.getGameBid(e.nPartnersSuit)) {
      e.m_nAgreedSuit = e.nPartnersSuit;
      if (e.nPartnersBidLevel <= 5 && e.m_fMinTPPoints >= PTS_SMALL_SLAM && e.numSupportCards >= 3) {
        e.m_nBid = makeBid(e.nPartnersSuit, 6);
        status?.stream(
          `B4D1! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, go ahead and raise partner to a small slam at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
      if (e.nPartnersBidLevel <= 6 && e.m_fMinTPPoints >= PTS_GRAND_SLAM && e.numSupportCards >= 3) {
        e.m_nBid = makeBid(e.nPartnersSuit, 7);
        status?.stream(
          `B4D2! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, go ahead and raise partner to a grand slam at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4D3! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we have to defer to partner's unusual jump rebid and pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    // pass with < 24 total points
    if (e.m_fMinTPPoints < PTS_GAME - 1) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4D10! With a bare minimum holding of ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in the hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, we don't have quite enough for game, so pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // raise opener's major to 4 with 25-32 TPs and 2+ trumps
    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME - 1, PTS_SLAM - 1, SupportLength.Len2))
      return e.validateBid(e.m_nBid);

    // if partner made a double jump to game or higher in a major, leave him alone
    if (
      isMajor(e.nPartnersSuit) &&
      e.nPartnersBidLevel >= 4 &&
      e.numSupportCards >= 1 &&
      e.m_fMinTPPoints <= PTS_GAME + 3
    ) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4D16! Partner insists on playing in his ${e.szPSS} suit and has jumped all the way to game, so let him play there.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // bid 3NT with 27-29 HCPs and all suits stopped
    if (e.nPartnersBidLevel < 4) {
      if (e.bidNoTrumpEngine(3, PTS_NT_GAME + 1, PTS_NT_GAME + 3, false, StoppedCode.Unbid))
        return e.validateBid(e.m_nBid);
    }

    // rebid any good 6-card suit
    if (
      e.rebidSuitEngine(
        SuitType.Any,
        RebidTarget.Cheapest,
        PTS_GAME + 1,
        PTS_GAME + 3,
        SuitLength.Six,
        SuitStrength.Strong,
      )
    )
      return e.validateBid(e.m_nBid);

    // bid a new suit if openable
    if (
      e.bidNextBestSuitEngine(
        SuitType.Any,
        ShiftTarget.Cheapest,
        PTS_GAME + 1,
        PTS_GAME + 3,
        SuitLength.Six,
        SuitStrength.Openable,
      )
    )
      return e.validateBid(e.m_nBid);

    // raise opener's minor to 4 with 2 or more trumps (forcing) and 25+ pts
    if (
      e.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To4, PTS_MINOR_GAME - 4, PTS_MINOR_GAME, SupportLength.Len2)
    )
      return e.validateBid(e.m_nBid);

    // if none of the above apply, pass with < 26 pts
    if (e.m_fMinTPPoints < PTS_GAME) {
      e.m_nBid = Bid.Pass;
      if (e.nPartnersBid < e.getGameBid(e.nPartnersSuit))
        status?.stream(
          `B4D18! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership but no clear direction in the bidding, pass.\n`,
        );
      else
        status?.stream(
          `B4D18a! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, sign off on partner's ${e.szPB} bid.\n`,
        );
      return e.validateBid(e.m_nBid);
    } else if (e.m_fMinTPPoints <= PTS_MINOR_GAME) {
      if (e.nPartnersBid < Bid.NT3) {
        e.m_nBid = Bid.NT3;
        status?.stream(
          `B4D19a! We have ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, which is enough for game, but there is no suit agreement -- so we're forced to bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4D19b! We have ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, but which is enough for game, but there is no suit agreement, and we can't bid 3NT -- so we're forced to pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    // with 30-36 points, think game or slam if a fit can be found
    if (e.m_fMinTPPoints >= PTS_SLAM - 3 && e.m_fMinTPPoints < PTS_GRAND_SLAM) {
      status?.stream(
        `B4D20! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts, we have the points to make game or possibly slam, but so far with no agreed on suit.\n`,
      );
    }

    if (e.m_fMinTPPoints >= PTS_SLAM && e.numSupportCards >= 3) {
      e.invokeBlackwood(e.nPartnersSuit);
      return e.validateBid(e.m_nBid);
    }

    // raise partner's major to game with 30-32 pts and 2+ card support
    if (
      e.raisePartnersSuitEngine(
        SuitType.Major,
        RaiseTarget.To4,
        PTS_MAJOR_GAME + 4,
        PTS_SMALL_SLAM - 1,
        SupportLength.Len2,
      )
    )
      return e.validateBid(e.m_nBid);

    // raise partner's minor to game at the 5-level with 31-32 pts and 3+ card support
    if (
      e.raisePartnersSuitEngine(
        SuitType.Minor,
        RaiseTarget.To5,
        PTS_MINOR_GAME + 2,
        PTS_SMALL_SLAM - 1,
        SupportLength.Len2,
      )
    )
      return e.validateBid(e.m_nBid);

    // rebid a good 6-card suit w/ 30-32 pts
    if (
      e.rebidSuitEngine(
        SuitType.Any,
        RebidTarget.Cheapest,
        PTS_MINOR_GAME + 1,
        PTS_SLAM - 1,
        SuitLength.Six,
        SuitStrength.Strong,
      )
    )
      return e.validateBid(e.m_nBid);

    // else bid another suit with 30-36 TPs
    if (e.rebidSuitEngine(SuitType.Any, RebidTarget.Cheapest, PTS_MINOR_GAME + 1, PTS_SLAM - 3))
      return e.validateBid(e.m_nBid);

    // with 37+ min total pts, think slam in any event
    if (e.m_fMinTPPoints >= PTS_GRAND_SLAM) {
      status?.stream(
        `B4D30! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts, move towards slam.\n`,
      );
    }

    // 37+ TPs: bid a small slam with our own self-supporting suit
    if (
      e.rebidSuitEngine(
        SuitType.Any,
        RebidTarget.At6,
        PTS_GRAND_SLAM,
        0,
        SuitLength.Six,
        SuitStrength.SelfSupporting,
        4,
      )
    )
      return e.validateBid(e.m_nBid);

    if (e.m_fMinTPPoints >= PTS_GRAND_SLAM && e.numSupportCards >= 2) {
      e.invokeBlackwood(e.nPartnersSuit);
      return e.validateBid(e.m_nBid);
    }

    // with 37+ HCPs, check for a NT slam
    if (e.m_fMinTPCPoints >= PTS_GRAND_SLAM) {
      e.invokeBlackwood(Suit.NoTrump);
      return e.validateBid(e.m_nBid);
    }

    // with 33-36 total HCPs, bid a small slam in NT directly
    if (e.bidNoTrumpEngine(6, PTS_SMALL_SLAM, PTS_GRAND_SLAM - 1, false, StoppedCode.Unbid))
      return e.validateBid(e.m_nBid);

    // with any other 37+ total point holding, bid another suit
    if (e.m_fMinTPPoints >= PTS_GRAND_SLAM) {
      status?.stream(
        `B4D64! With ${e.fCardPts}/${e.fPts} points in slam territory but no good suit fit and a hand not suitable for NT, bid another suit at ${bidToFullString(e.m_nBid)}.\n`,
      );
      e.bidNextBestSuitEngine(SuitType.Any);
      return e.validateBid(e.m_nBid);
    }

    // fallen through
    if (e.bidNextBestSuitEngine(SuitType.Any)) {
      status?.stream(
        `B4D68! We have ${e.fCardPts}/${e.fPts} pts in hand but no good fit with partner and no rebiddable suit, so we have no choice but to shift to yet another suit.\n`,
      );
    } else {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4D69! We have ${e.fCardPts}/${e.fPts} pts in hand but no good fit with partner and no rebiddable suit, and we've run out of safe bidding room, so we're forced to pass.\n`,
      );
    }
    return e.validateBid(e.m_nBid);
  } // end of partner's jump rebid section

  //
  //==========================================================
  //
  // Rebidding after opener made a rebid of his original suit
  // after _our_ jump shift
  // e.g., 1h -> 2s -> 3h, or even 1h -> 2s -> 4h
  //
  if (
    e.nPartnersSuit === e.nPartnersPrevSuit &&
    e.nPreviousSuit !== e.nPartnersSuit &&
    e.nPreviousBid - e.nPartnersPrevBid > 5 &&
    isSuit(e.nPartnersSuit)
  ) {
    status?.stream(
      `2B4K! Partner rebid his ${e.szPSS} suit after our jump shift of ${e.szPVB}, indicating his dislike for our suit.  However, we still wish to get to at least game.\n`,
    );

    // with <= 32 total pts & a 6-card minor suit, rebid suit at game
    if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.At4, PTS_MINOR_GAME, PTS_SLAM - 1, SuitLength.Six))
      return e.validateBid(e.m_nBid);

    // or with <= 32 pts, raise opener's major to game with 3+ trumps
    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3))
      return e.validateBid(e.m_nBid);

    // alternatively with <= 32 pts, bid any another suit
    if (e.nPartnersBid < e.getGameBid(e.nPartnersSuit)) {
      if (e.bidNextBestSuitEngine(SuitType.Any, ShiftTarget.Cheapest, PTS_GAME, PTS_SLAM - 1))
        return e.validateBid(e.m_nBid);
    }

    // determine the better of our or partner's suit, or NT
    let nSuit: Suit = Suit.NoTrump;
    if ((e.nPrefSuitStrength >= SuitStrength.Absolute || e.bPrefSuitIsSelfSupporting) && isSuit(e.nPrefSuit))
      nSuit = e.nPrefSuit;
    else if (e.numSupportCards >= 2)
      nSuit = e.nPartnersSuit;
    else
      nSuit = Suit.NoTrump;

    if (e.m_fMinTPPoints < PTS_SLAM) {
      if (e.nPartnersBid >= e.getGameBid(e.nPartnersSuit)) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4K5! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and no clear direction in the bidding, pass partner's ${e.szPB} bid.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      e.m_nBid = e.getGameBid(nSuit);
      if (nSuit === e.nPrefSuit)
        status?.stream(
          `B4K10a! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and a self-supporting suit in ${e.szPrefS}, bid ${bidToFullString(e.m_nBid)}.\n`,
        );
      else if (nSuit === e.nPartnersSuit)
        status?.stream(
          `B4K10b! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and ${e.numSupportCards}-card support for partner's ${e.szPS}, bid game at ${bidToFullString(e.m_nBid)}.\n`,
        );
      else
        status?.stream(
          `B4K10c! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and no suit agreement, bid ${bidToFullString(e.m_nBid)}.\n`,
        );
      return e.validateBid(e.m_nBid);
    }

    // with 33+ total points, bid a slam
    e.invokeBlackwood(nSuit);
    return e.validateBid(e.m_nBid);
  }

  //
  //==========================================================
  //
  // Rebidding after opener made a rebid of 1NT
  // e.g., 1H -> 1S -> 1NT, showing 12-16 points
  //
  if (e.nPartnersBid === Bid.NT1 && e.nPartnersPrevBid !== Bid.Pass) {
    e.m_fPartnersMin = Math.max(e.m_fPartnersMin, 12);
    e.m_fPartnersMax = Math.max(e.m_fPartnersMax, 16);

    // revalue hand for partner's PREVIOUS suit
    if (isSuit(e.nPartnersPrevSuit)) {
      e.fAdjPts = e.hand!.revalueHand(REVALUE_DUMMY, e.nPartnersPrevSuit, true);
    }
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    status?.stream(
      `B4E00! Partner made a rebid of 1NT, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points with a balanced hand, for a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership.\n`,
    );

    // pass with fewer than 20 min total points
    if (e.m_fMinTPPoints < PTS_GAME - 6) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4E10! With only ${e.fCardPts}/${e.fPts} pts in hand, for a total in the partnership of approx. ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} HCPs, making a game seems unlikely, so pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // rebid a six-card suit with 20-24 TPs
    if (e.rebidSuitEngine(SuitType.Any, RebidTarget.Cheapest, PTS_GAME - 6, PTS_GAME - 2, SuitLength.Six))
      return e.validateBid(e.m_nBid);

    // bid another openable suit at the 2-level with 20-24 TPs
    if (
      e.bidNextBestSuitEngine(
        SuitType.Any,
        ShiftTarget.Cheapest,
        PTS_GAME - 6,
        PTS_GAME - 2,
        SuitLength.Four,
        SuitStrength.Openable,
      )
    )
      return e.validateBid(e.m_nBid);

    // jump to four in a six-card major with 26-29 points
    if (e.rebidSuitEngine(SuitType.Major, RebidTarget.At4, PTS_GAME, PTS_GAME + 3, SuitLength.Six))
      return e.validateBid(e.m_nBid);

    // raise opener's major with 20-24 Adj. points and 4 trumps
    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.One, PTS_GAME - 6, PTS_GAME - 2, SupportLength.Len4))
      return e.validateBid(e.m_nBid);

    // or raise opener's minor with 20-24 Adj. points and 5 trumps
    if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.One, PTS_GAME - 6, PTS_GAME - 2, SupportLength.Len5))
      return e.validateBid(e.m_nBid);

    // or raise opener's major with 23-24 Adj. points and 3 trumps
    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.One, PTS_GAME - 3, PTS_GAME - 2, SupportLength.Len3))
      return e.validateBid(e.m_nBid);

    // with 23-25/26-29 total HCPs and all suits stopped, bid 2NT/3NT
    if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 3, PTS_NT_GAME - 1, true, StoppedCode.AllOther))
      return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_NT_GAME + 3, true, StoppedCode.AllOther))
      return e.validateBid(e.m_nBid);

    // else with length in the minors, bid 2NT or 3NT with slightly less
    if (
      (e.numCardsInSuit[Suit.Clubs] >= 5 && e.numHonorsInSuit[Suit.Clubs] >= 2) ||
      (e.numCardsInSuit[Suit.Diamonds] >= 5 && e.numHonorsInSuit[Suit.Diamonds] >= 2)
    ) {
      if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 3, PTS_NT_GAME - 2, false, StoppedCode.AllOther))
        return e.validateBid(e.m_nBid);
      if (e.bidNoTrumpEngine(3, PTS_NT_GAME - 1, PTS_NT_GAME + 3, false, StoppedCode.AllOther))
        return e.validateBid(e.m_nBid);
    }

    // with 25-29 adj points and a hand not fit for NT, jump to 3 in partner's major suit with 3 trumps
    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To3, PTS_GAME - 1, PTS_GAME + 3, SupportLength.Len3))
      return e.validateBid(e.m_nBid);

    // or jump to 3 in partner's minor suit with 4 trumps and 25 pts
    if (
      e.raisePartnersSuitEngine(
        SuitType.Minor,
        RaiseTarget.To3,
        PTS_MINOR_GAME - 4,
        PTS_MINOR_GAME + 1,
        SupportLength.Len4,
      )
    )
      return e.validateBid(e.m_nBid);

    // else jump in our major suit with 5 cards and 25+ pts
    if (e.rebidSuitEngine(SuitType.Major, RebidTarget.Jump1, PTS_GAME, PTS_MAJOR_GAME + 3, SuitLength.Five))
      return e.validateBid(e.m_nBid);

    // else jump to 3 in a new suit (forcing to game) and 25+ pts
    if (e.bidNextBestSuitEngine(SuitType.Any, ShiftTarget.Jump1, PTS_GAME - 1, PTS_GAME + 4))
      return e.validateBid(e.m_nBid);

    // bid 2NT w/ 24-25 HCPs, or 3NT with 26-32 and NO VOIDS
    if (e.numVoids === 0) {
      if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 2, PTS_NT_GAME - 1, false, StoppedCode.DontCare))
        return e.validateBid(e.m_nBid);
      if (e.bidNoTrumpEngine(3, PTS_GAME, PTS_SLAM - 1, false, StoppedCode.DontCare))
        return e.validateBid(e.m_nBid);
    }

    // if none of the above apply, pass with < 29 pts
    if (e.m_fMinTPPoints < PTS_MINOR_GAME) {
      e.m_nBid = Bid.Pass;
      if (e.nPartnersBid < e.getGameBid(e.nPartnersSuit))
        status?.stream(
          `B4E18! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership but no clear direction in the bidding, pass.\n`,
        );
      else
        status?.stream(
          `B4E18a! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, sign off on partner's ${e.szPB} bid.\n`,
        );
      return e.validateBid(e.m_nBid);
    }

    // with 32+ total points, think slam
    if (e.m_fMinTPPoints >= PTS_SLAM - 1) {
      status?.stream(
        `B4E20! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we want to explore slam opportunities.\n`,
      );
    }

    // jump to 3 of another suit
    if (e.bidNextBestSuitEngine(SuitType.Any, ShiftTarget.Jump1, PTS_MINOR_GAME + 2))
      return e.validateBid(e.m_nBid);

    // 20-24 TPs: bid a new suit
    if (e.m_fMinTPPoints <= PTS_GAME - 2) {
      if (e.bidNextBestSuitEngine(SuitType.Any)) {
        status?.stream(
          `B4E30! We have ${e.fCardPts}/${e.fPts} pts in hand and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, but no good fit with partner, no rebiddable suit, and no NT prospects, so we have no choice but to shift to another suit.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4E31! We have ${e.fCardPts}/${e.fPts} pts in hand and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, but no good fit with partner, no rebiddable suit, and no more safe bidding room, we're forced to pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // 29+ pts here; jump in own suit
    status?.stream(
      `B4E32! We have ${e.fCardPts}/${e.fPts}pts in hand and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints}pts in the partnership, but have no good fit with partner and no rebiddable suit, so we have no choice but to shift to another suit.\n`,
    );
    e.rebidSuitEngine(SuitType.Any, RebidTarget.Jump1);
    return e.validateBid(e.m_nBid);
  } // end of partner's 1NT rebid section

  //
  //==========================================================
  //
  // Rebidding after opener made a 2NT rebid, showing 15-19 pts and all suits stopped
  //
  if (e.nPartnersBid === Bid.NT2) {
    e.calcNoTrumpPoints();

    if (e.m_fMinTPPoints < PTS_GAME - 3) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4F10! with ${e.fCardPts}/${e.fPts} points in hand, and a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} in the partnership, we can't make game, so pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.rebidSuitEngine(SuitType.Any, RebidTarget.Cheapest, PTS_GAME - 3, PTS_GAME - 2, SuitLength.Six))
      return e.validateBid(e.m_nBid);

    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To3, PTS_GAME - 3, PTS_GAME - 2, SupportLength.Len3))
      return e.validateBid(e.m_nBid);
    if (e.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To3, PTS_GAME - 3, PTS_GAME - 2, SupportLength.Len4))
      return e.validateBid(e.m_nBid);

    if (e.m_fMinTPPoints < PTS_GAME) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4F14! with ${e.fCardPts}/${e.fPts} points in hand, and a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} in the partnership, sign off on partner's contract of 2NT.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // here, we have 26-31 total points minimum
    if (e.rebidSuitEngine(SuitType.Major, RebidTarget.At4, PTS_GAME, PTS_SLAM - 1, SuitLength.Six))
      return e.validateBid(e.m_nBid);

    if (e.bidNoTrumpEngine(3, PTS_GAME, PTS_SLAM - 1, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);

    if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.At4, PTS_MINOR_GAME - 1, PTS_SLAM - 1, SuitLength.Six))
      return e.validateBid(e.m_nBid);

    if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.At4, PTS_MINOR_GAME - 2, PTS_SLAM - 1, SuitLength.Seven))
      return e.validateBid(e.m_nBid);

    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME - 1, PTS_SLAM - 1, SupportLength.Len3))
      return e.validateBid(e.m_nBid);

    if (e.nPartnersBid < e.getGameBid(e.nPartnersSuit)) {
      if (e.bidNextBestSuitEngine(SuitType.Any, ShiftTarget.Cheapest, PTS_GAME - 1, PTS_SLAM - 1))
        return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints < PTS_SLAM - 3) {
      e.m_nBid = Bid.Pass;
      if (e.nPartnersBid < e.getGameBid(e.nPartnersSuit))
        status?.stream(
          `B4D18! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership but no clear direction in the bidding, pass.\n`,
        );
      else
        status?.stream(
          `B4D18a! with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, sign off on partner's ${e.szPB} bid.\n`,
        );
      return e.validateBid(e.m_nBid);
    }

    if (e.bidNoTrumpAsAppropriateEngine(true, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);

    // dropped through
    if (e.rebidSuitEngine(SuitType.Any, RebidTarget.Cheapest, PTS_GAME - 3, PTS_GAME - 1))
      return e.validateBid(e.m_nBid);

    if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.ToGame, PTS_GAME, PTS_SLAM - 1, SupportLength.Len2))
      return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_SLAM - 1, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);
    if (e.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.ToGame, PTS_MINOR_GAME, PTS_SLAM - 1, SupportLength.Len2))
      return e.validateBid(e.m_nBid);

    status?.stream(
      `B4F30! We have ${e.fCardPts}/${e.fPts} pts in hand but no good fit with partner and no rebiddable suit, so we have no choice but to shift to another suit.\n`,
    );
    e.rebidSuitEngine(SuitType.Any, RebidTarget.Cheapest, 0, 0, SuitLength.Four, SuitStrength.None);
    return e.validateBid(e.m_nBid);
  } // end of 2NT response section

  //
  //==========================================================
  //
  // Rebidding after opener made a 3NT or higher NT rebid
  //
  if (e.nPartnersSuit === Suit.NoTrump && e.nPartnersBidLevel >= 3) {
    e.calcNoTrumpPoints();

    if (e.m_fMinTPCPoints < PTS_MINOR_GAME + 2) {
      if (e.nPartnersBid <= Bid.NT4) {
        if (
          e.rebidSuitEngine(
            SuitType.Major,
            RebidTarget.At4,
            PTS_GAME - 3,
            0,
            SuitLength.Six,
            SuitStrength.Strong | SuitStrength.Solid,
          )
        )
          return e.validateBid(e.m_nBid);
      }

      if (e.nPartnersBid <= Bid.NT4) {
        if (
          e.rebidSuitEngine(
            SuitType.Minor,
            RebidTarget.At4,
            PTS_MINOR_GAME - 4,
            0,
            SuitLength.Seven,
            SuitStrength.Strong | SuitStrength.Solid,
          )
        )
          return e.validateBid(e.m_nBid);
      }

      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4G40! With approx. ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} total HCPs in the partnership, sign off at game and pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // Note: C++ original line 1189 has `(PTS_SLAM <= PTS_SLAM - 1)` which is always false
    if (e.m_fMinTPCPoints >= PTS_SLAM - 3 && PTS_SLAM <= PTS_SLAM - 1 && e.nPartnersBid <= Bid.NT4) {
      if (e.nPartnersBid === Bid.NT4 && e.m_bInvitedToSlam) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4G42! With ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} total HCPs in the partnership, we don't have quite enough for a slam, so we have to decline partner's invitation and pass.\n`,
        );
      } else {
        e.m_nBid = makeBid(Suit.NoTrump, e.nPartnersBidLevel + 1);
        status?.stream(
          `B4G44! With ${e.m_fMinTPCPoints}+ total HCPs in the partnership, look into slam opportunities by bidding an invitational ${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (e.nPartnersBid >= Bid.NT6) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4G48! With ${e.m_fMinTPPoints}+ total partnership points, sign off on partner's slam bid of ${e.szPB} and pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPCPoints >= PTS_SLAM) {
      status?.stream(`B4G50! With ${e.m_fMinTPPoints}+ total partnership points, bid a small slam.\n`);
    }

    if (e.m_fMinTPPoints < PTS_GRAND_SLAM) {
      if (e.rebidSuitEngine(SuitType.Major, RebidTarget.At6, PTS_SLAM, 0, SuitLength.Seven, SuitStrength.Strong))
        return e.validateBid(e.m_nBid);
    }
    if (e.bidNoTrumpEngine(6, PTS_SLAM, PTS_SLAM + 3, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);

    if (e.rebidSuitEngine(SuitType.Major, RebidTarget.At7, PTS_GRAND_SLAM, 0, SuitLength.Seven, SuitStrength.Strong))
      return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(7, PTS_GRAND_SLAM, 40, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);
  } // end of 3NT+ section

  //
  //==========================================================
  //
  // Rebidding after opener made a single raise of our suit in stage 3
  //
  if (
    e.nPartnersSuit === e.nPreviousSuit &&
    e.nPartnersBidLevel === e.nPreviousBidLevel + 1 &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPreviousSuit) &&
    e.nPartnersBidLevel <= 4
  ) {
    if (e.nPreviousBid - e.nPartnersPrevBid > 5 && e.nPreviousSuit !== e.nPartnersPrevSuit) {
      let nSuit: Suit;
      if (
        isSuit(e.nPartnersPrevSuit) &&
        (e.m_nIntendedSuit === e.nPartnersPrevSuit ||
          e.m_nAgreedSuit === e.nPartnersPrevSuit ||
          (isMajor(e.nPartnersPrevSuit) &&
            isMinor(e.nPreviousSuit) &&
            e.nSuitStrength[e.nPartnersPrevSuit] >= SuitStrength.ModerateSupport) ||
          (e.nSuitStrength[e.nPartnersPrevSuit] > e.nSuitStrength[e.nPreviousSuit] &&
            e.nSuitStrength[e.nPartnersPrevSuit] >= SuitStrength.ModerateSupport) ||
          (e.numCardsInSuit[e.nPartnersPrevSuit] >= 4 &&
            e.nSuitStrength[e.nPartnersPrevSuit] >= SuitStrength.StrongSupport &&
            e.numCardsInSuit[e.nPartnersPrevSuit] < 6) ||
          (e.numCardsInSuit[e.nPartnersPrevSuit] >= 5 &&
            e.nSuitStrength[e.nPartnersPrevSuit] >= SuitStrength.GoodSupport &&
            e.numCardsInSuit[e.nPartnersPrevSuit] < 6))
      ) {
        nSuit = e.nPartnersPrevSuit;
        e.m_nAgreedSuit = e.nPartnersPrevSuit;
        status?.stream(
          `2B4H00! Though partner raised our ${e.szPVSS} suit after our jump shift, we really want to play in partner's ${e.szPPSS} suit.\n`,
        );
      } else {
        nSuit = e.nPreviousSuit;
        e.m_nAgreedSuit = e.nPreviousSuit;
        status?.stream(
          `2B4H01! Partner raised our ${e.szPVS} after our jump shift, so stick with that suit.\n`,
        );
        e.fAdjPts = e.hand!.revalueHand(REVALUE_DECLARER, e.nPreviousSuit, true);
      }

      e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
      e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
      e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
      e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

      if (e.m_fMinTPPoints < PTS_SLAM) {
        if (e.nPartnersBid < e.getGameBid(nSuit)) {
          e.m_nBid = e.getGameBid(nSuit);
          status?.stream(
            `B4H04! Now with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, raise partner to game at a bid of ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `B4H05! And with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, sign off on partner's bid of ${e.szPB}.\n`,
          );
        }
      } else {
        e.invokeBlackwood(nSuit);
      }
      return e.validateBid(e.m_nBid);
    } else {
      e.m_nAgreedSuit = e.nPreviousSuit;
      e.fAdjPts = e.hand!.revalueHand(REVALUE_DECLARER, e.nPreviousSuit, true);
      e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
      e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
      e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
      e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;
    }

    if (e.nPartnersBid >= e.getGameBid(e.nPartnersSuit)) {
      e.m_fPartnersMin = Math.max(e.m_fPartnersMin, 12);
      if (e.m_fPartnersMax < Math.min(22, 40 - e.fCardPts))
        e.m_fPartnersMax = Math.min(22, 40 - e.fCardPts);
      status?.stream(
        `2B4H10! Partner has raised to game, showing at least ${e.m_fPartnersMin} points.\n`,
      );
    } else if (e.nPartnersBidLevel === 2) {
      e.m_fPartnersMin = Math.max(e.m_fPartnersMin, 12);
      e.m_fPartnersMax = Math.max(e.m_fPartnersMax, 16);
      status?.stream(
        `2B4H11! Partner made a single raise of our ${e.szPVSS} suit, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points with 3+ trump cards.\n`,
      );
    } else if (e.nPartnersSuit === e.nPartnersPrevSuit) {
      e.m_fPartnersMin = Math.max(e.m_fPartnersMin, 16);
      e.m_fPartnersMax = Math.max(e.m_fPartnersMax, 18);
      status?.stream(
        `2B4H12! Partner raised the agreed suit to the 3-level, which is invitational towards game and indicates approximately ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.\n`,
      );
    } else {
      e.m_fPartnersMin = Math.max(e.m_fPartnersMin, 12);
      e.m_fPartnersMax = Math.max(e.m_fPartnersMax, 18);
      status?.stream(
        `2B4H14! Partner made a single raise of our ${e.szPVB} bid to ${e.szPB}, showing ${e.m_fPartnersMin} -${e.m_fPartnersMax} points and 3+ trump cards.\n`,
      );
    }

    if (e.nPartnersBidLevel === 2) {
      if (e.m_fMinTPPoints < PTS_GAME - 4) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4H18! With only ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, a game is unlikely, so pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    } else if (e.nPartnersBidLevel === 3) {
      if (e.nPartnersSuit === e.nPartnersPrevSuit) {
        if (isMajor(e.nPreviousSuit) && e.m_fMinTPPoints >= PTS_GAME) {
          e.m_nBid = makeBid(e.nPreviousSuit, 4);
          status?.stream(
            `B4H20! And with ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts in hand, for a total in the partnership of approx. ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, try for a game by bidding ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `B4H24! But with only ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, game is unlikely, so pass.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      } else {
        if (e.m_fMinTPPoints < PTS_GAME - 3) {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `B4H30! With only ${e.fCardPts}/${e.fPts}/${e.fAdjPts} pts in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, a game is unlikely, so pass.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }
    } else {
      if (e.m_fMinTPPoints >= PTS_SLAM) {
        e.invokeBlackwood(e.nPreviousSuit);
        status?.stream(
          `B4H32! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership and a good trump suit, explore slam possiblities.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4H33! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, sign off at partner's ${e.isGameBid(e.nPartnersBid) ? 'game ' : ''}bid and pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    // here, we have at least 22+ min total points
    if (e.rebidSuitEngine(SuitType.Major, RebidTarget.Cheapest, PTS_GAME - 4, PTS_GAME - 3, SuitLength.Six))
      return e.validateBid(e.m_nBid);
    if (e.rebidSuitEngine(SuitType.Major, RebidTarget.At4, PTS_GAME - 2, PTS_SLAM - 1, SuitLength.Six))
      return e.validateBid(e.m_nBid);
    if (
      e.rebidSuitEngine(
        SuitType.Major,
        RebidTarget.At4,
        PTS_GAME,
        PTS_SLAM - 1,
        SuitLength.Five,
        SuitStrength.Openable,
      )
    )
      return e.validateBid(e.m_nBid);
    if (
      e.rebidSuitEngine(
        SuitType.Major,
        RebidTarget.At3,
        PTS_GAME - 4,
        PTS_GAME,
        SuitLength.Four,
        SuitStrength.Openable,
      )
    )
      return e.validateBid(e.m_nBid);
    if (
      e.rebidSuitEngine(
        SuitType.Major,
        RebidTarget.At4,
        PTS_GAME + 1,
        PTS_SLAM - 1,
        SuitLength.Four,
        SuitStrength.Openable,
      )
    )
      return e.validateBid(e.m_nBid);
    if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.At3, PTS_MINOR_GAME - 6, PTS_MINOR_GAME - 4, SuitLength.Five))
      return e.validateBid(e.m_nBid);
    if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.At4, PTS_MINOR_GAME - 3, PTS_MINOR_GAME - 1, SuitLength.Five))
      return e.validateBid(e.m_nBid);
    if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.At5, PTS_MINOR_GAME, PTS_SLAM - 1, SuitLength.Five))
      return e.validateBid(e.m_nBid);
    if (
      e.rebidSuitEngine(
        SuitType.Minor,
        RebidTarget.At5,
        PTS_MINOR_GAME + 1,
        PTS_SLAM - 1,
        SuitLength.Four,
        SuitStrength.Openable,
      )
    )
      return e.validateBid(e.m_nBid);

    if (e.nPartnersBidLevel === 2) {
      if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 3, PTS_GAME - 1, false, StoppedCode.DontCare))
        return e.validateBid(e.m_nBid);
    }
    if (e.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_SLAM - 1, false, StoppedCode.Unbid))
      return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(2, PTS_NT_GAME, PTS_NT_GAME + 1, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(3, PTS_NT_GAME + 2, PTS_SLAM - 1, false, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);

    if (e.m_fMinTPPoints < PTS_SLAM) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4H35! We have a total of approx. ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} in the partnership, but we do not have a rebiddable suit, nor do we have enough stoppers for a NT contract, so we have to sign off on partner's ${e.szPB} bid.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints >= PTS_SLAM) {
      e.invokeBlackwood(e.nPreviousSuit);
      return e.validateBid(e.m_nBid);
    }

    e.m_nBid = Bid.Pass;
    status?.stream('B4H50! With no good options, pass.\n');
    return e.validateBid(e.m_nBid);
  } // end single raise section

  //
  //==========================================================
  //
  // Rebidding after opener made a double raise of our suit
  // e.g., 1H -> 1S -> 3S, or 1S -> 2H -> 4H
  //
  if (
    e.nPartnersSuit === e.nPreviousSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPreviousSuit) &&
    e.nPartnersBidLevel === e.nPreviousBidLevel + 2
  ) {
    if (isMajor(e.nPreviousSuit)) {
      e.m_fPartnersMin = 15;
      e.m_fPartnersMax = 21;
    } else {
      e.m_fPartnersMin = 17;
      e.m_fPartnersMax = 21;
    }
    status?.stream(
      `2B4M00! Partner made a double raise of our ${e.szPVSS} suit to ${e.szPB}, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.\n`,
    );

    if (
      isSuit(e.nPartnersPrevSuit) &&
      (e.m_nIntendedSuit === e.nPartnersPrevSuit ||
        (isMajor(e.nPartnersPrevSuit) &&
          isMinor(e.nPreviousSuit) &&
          e.nSuitStrength[e.nPartnersPrevSuit] >= SuitStrength.ModerateSupport) ||
        (e.nSuitStrength[e.nPartnersPrevSuit] > e.nSuitStrength[e.nPreviousSuit] &&
          e.nSuitStrength[e.nPartnersPrevSuit] >= SuitStrength.ModerateSupport &&
          isMajor(e.nPartnersPrevSuit)))
    ) {
      e.m_nAgreedSuit = e.nPartnersPrevSuit;
      status?.stream(
        `B4M02! Though partner raised our ${e.szPVSS} suit after our shift response, we really want to play in partner's ${e.szPPSS} suit.\n`,
      );
    } else {
      e.m_nAgreedSuit = e.nPreviousSuit;
      e.fAdjPts = e.hand!.revalueHand(REVALUE_DECLARER, e.nPreviousSuit, true);
    }

    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.m_fMinTPPoints < PTS_GAME - 2) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4M10! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in hand, for a total in partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, sign off at partner's bid of ${e.szPB}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints < PTS_SLAM && e.isGameBid(e.nPartnersBid)) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4M20! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in hand, for a total in partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, sign off at partner's bid of ${e.szPB}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints < PTS_GAME) {
      if (e.nPartnersBidLevel < 3) {
        const nSuit = e.getNextBestSuit(e.nPreviousSuit, e.nPartnersPrevSuit);
        e.m_nBid = e.getCheapestShiftBid(nSuit);
        status?.stream(
          `B4M14! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in hand, for a total in partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, invite game by bidding the ${Card.suitToSingularString(nSuit)} support suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4M15! We have ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in hand, for a total in partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, so we want to invite game, but we're at too high a level to show a support suit, so we have to pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints < PTS_SLAM && isSuit(e.m_nAgreedSuit)) {
      if (
        e.rebidSuitEngine(
          makeDirectSuit(e.m_nAgreedSuit),
          RebidTarget.At4,
          PTS_GAME,
          PTS_SLAM - 1,
          SuitLength.Any,
          SuitStrength.MarginalOpener,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.rebidSuitEngine(
          makeDirectSuit(e.m_nAgreedSuit),
          RebidTarget.At5,
          PTS_MINOR_GAME,
          PTS_SLAM - 1,
          SuitLength.Any,
          SuitStrength.MarginalOpener,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.rebidSuitEngine(
          makeDirectSuit(e.m_nAgreedSuit),
          RebidTarget.At4,
          PTS_MINOR_GAME - 3,
          PTS_MINOR_GAME,
          SuitLength.Any,
          SuitStrength.MarginalOpener,
        )
      )
        return e.validateBid(e.m_nBid);

      if (e.getLastValidBid() < Bid.NT3) {
        e.m_nBid = Bid.NT3;
        status?.stream(
          `B4M20! Somehow partner raised our weak suit, so correct to ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream('B4M21! Without enough strength to move further, we pass.\n');
      }
      return e.validateBid(e.m_nBid);
    }

    e.invokeBlackwood(e.m_nAgreedSuit !== NONE ? e.m_nAgreedSuit : Suit.NoTrump);
    return e.validateBid(e.m_nBid);
  } // end of double raise section

  //
  //==========================================================
  //
  // Rebidding after opener made a triple raise
  //
  if (
    e.nPartnersSuit === e.nPreviousSuit &&
    e.nPartnersBidLevel === e.nPreviousBidLevel + 3 &&
    isSuit(e.nPreviousSuit)
  ) {
    e.m_fPartnersMin = 17;
    e.m_fPartnersMax = 21;
    status?.stream(
      `2B4N00! Partner made a triple raise of our ${e.szPVSS} suit to ${e.szPB}, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points and 4+ trumps.\n`,
    );

    e.m_nAgreedSuit = e.nPreviousSuit;
    e.fAdjPts = e.hand!.revalueHand(REVALUE_DECLARER, e.nPreviousSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.m_fMinTPPoints < PTS_SLAM) {
      if (isMajor(e.nPreviousSuit)) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4N10! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in hand, for a total in partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, sign off at partner's game bid of ${e.szPB}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.nPartnersBidLevel >= 5 || e.m_fMinTPPoints < PTS_MINOR_GAME) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4N12! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in hand, for a total in partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, sign off at partner's bid of ${e.szPB}.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        e.m_nBid = makeBid(e.nPreviousSuit, 5);
        status?.stream(
          `B4N14! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points in hand, for a total in partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, raise partner's bid to game at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    if (e.nPartnersBid < Bid.NT4) {
      e.invokeBlackwood(e.m_nAgreedSuit);
    } else {
      if (e.m_fMinTPPoints >= PTS_GRAND_SLAM && e.nPartnersBidLevel <= 6) {
        e.m_nBid = makeBid(e.m_nAgreedSuit, 7);
        status?.stream(
          `B4N18a! And with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total partnership points, we can bid a grand slam at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else if (e.nPartnersBidLevel < 6) {
        e.m_nBid = makeBid(e.m_nAgreedSuit, 6);
        status?.stream(
          `B4N18b! And with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total partnership points, we can bid a small slam at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4N19! And with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total partnership points, we sign off on partner's ${e.szPB} slam attempt.\n`,
        );
      }
    }
    return e.validateBid(e.m_nBid);
  } // end of triple raise section

  //
  //==========================================================
  //
  // Rebidding after opener raised our suit 4 or more levels
  //
  if (
    e.nPartnersSuit === e.nPreviousSuit &&
    e.nPartnersBidLevel - e.nPreviousBidLevel >= 4 &&
    isSuit(e.nPreviousSuit)
  ) {
    e.m_nAgreedSuit = e.nPreviousSuit;

    if (e.nPartnersBidLevel <= 5 && e.m_fMinTPPoints >= PTS_SLAM && e.numSupportCards >= 3) {
      e.m_nBid = makeBid(e.nPartnersSuit, 6);
      status?.stream(
        `B4X1! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, go ahead and raise partner to a small slam at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
    if (e.nPartnersBidLevel <= 6 && e.m_fMinTPPoints >= PTS_GRAND_SLAM && e.numSupportCards >= 3) {
      e.m_nBid = makeBid(e.nPartnersSuit, 7);
      status?.stream(
        `B4X2! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, go ahead and raise partner to a grand slam at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    } else {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4X3! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we have to defer to partner's unusual jump rebid and pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
  }

  //
  //==========================================================
  //
  // Rebidding after partner bid a new suit after our raise of his suit (trial bid)
  //
  if (
    e.nPartnersSuit !== e.nPartnersPrevSuit &&
    e.nPartnersPrevSuit === e.nPreviousSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPartnersSuit) &&
    isSuit(e.nPartnersPrevSuit) &&
    e.nPartnersBid - e.nPreviousBid < 5
  ) {
    e.m_fPartnersMin = 16;
    e.m_fPartnersMax = 18;
    if (e.nPreviousBid - e.nPartnersPrevBid === 5)
      status?.stream(
        `B4O00! Partner bid a support suit at ${e.szPB} after our single raise, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points and less than 7 playing tricks.\n`,
      );
    else
      status?.stream(
        `B4O01! Partner bid a new suit at ${e.szPB} after our jump raise, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.\n`,
      );

    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (isMajor(e.nPartnersPrevSuit)) {
      if (
        e.m_fMinTPPoints >= PTS_GAME - 1 &&
        e.numCardsInSuit[e.nPartnersSuit] >= 4 &&
        e.numHonorsInSuit[e.nPartnersSuit] >= 1
      ) {
        e.m_nBid = makeBid(e.nPartnersPrevSuit, 4);
        status?.stream(
          `B4O10! With strength in the ${e.szPSS} support suit (holding ${e.szHP}) and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, raise partner to game at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        e.m_nBid = e.getCheapestShiftBid(e.nPartnersPrevSuit);
        status?.stream(
          `B4O14! Without much strength in the ${e.szPSS} support suit (holding ${e.szHP}) and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, sign off at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    // else we've got a minor suit - try to steer towards NT
    if (e.hand!.allOtherSuitsStopped(e.nPartnersSuit, e.nPartnersPrevSuit)) {
      if (e.m_fMinTPCPoints >= PTS_NT_GAME) e.m_nBid = Bid.NT3;
      else e.m_nBid = Bid.NT2;
    }
    if (e.m_nBid > e.nPartnersBid) {
      status?.stream(
        `B4O40! With stoppers in the unbid suits, move from partner's minor ${e.szPSS} suit to a contract of ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    } else if (e.m_fMinTPPoints >= PTS_MINOR_GAME && e.nPPrevSuitSupport >= SuitStrength.ModerateSupport) {
      e.m_nBid = makeBid(e.nPartnersPrevSuit, 5);
      status?.stream(
        `B4O45! Without stoppers in the unbid suits we can't bid a NT contract, but with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and ${e.supportLevelToString(e.nPartnersPrevSuit)} trump support, we can raise partner to game at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    } else if (
      e.m_fMinTPPoints >= PTS_MINOR_GAME - 1 &&
      e.nPPrevSuitSupport >= SuitStrength.ModerateSupport &&
      e.numCardsInSuit[e.nPartnersSuit] >= 4 &&
      e.numHonorsInSuit[e.nPartnersSuit] >= 1
    ) {
      e.m_nBid = makeBid(e.nPartnersPrevSuit, 5);
      status?.stream(
        `B4O48! Without stoppers in the unbid suits we can't bid a NT contract, but with strength in partner's ${e.szPSS} support suit (holding ${e.szHP}) and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, raise partner to game at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    } else {
      e.m_nBid = e.getCheapestShiftBid(e.nPartnersPrevSuit);
      status?.stream(
        `B4O50! With ${e.hand!.getUnstoppedSuitNames()} unstopped, we can't steer towards a NT contract, and with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} team pts we sign off on the minor ${e.szPVSS} suit at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
  } // end of support suit section

  //
  //==========================================================
  //
  // Rebidding after partner bid a new suit (minimum rebid) after our response of a new suit
  // (3rd suit, possibly a reverse)
  //
  if (
    e.nPartnersSuit !== e.nPreviousSuit &&
    e.nPartnersSuit !== e.nPartnersPrevSuit &&
    e.nPreviousSuit !== e.nPartnersPrevSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    e.nPartnersPrevSuit !== Suit.NoTrump &&
    isSuit(e.nPartnersSuit) &&
    e.nPartnersBid - e.nPreviousBid < 5
  ) {
    if (e.nPartnersOpeningBidLevel === 2) {
      if (e.nPartnersOpeningBid === Bid.C2) {
        e.m_fPartnersMin = PTS_GAME - 2;
        e.m_fPartnersMax = Math.min(22, 40 - e.fCardPts);
        status?.stream(
          `2B4P00! Partner bid another suit at ${e.szPB} after opening an artificial 2C, indicating ${e.m_fPartnersMin}-${e.m_fPartnersMax} points in his hand.\n`,
        );
      } else if (e.conventions.isConventionEnabled(ConventionId.StrongTwoBids)) {
        e.m_fPartnersMin = 16;
        e.m_fPartnersMax = 22;
        status?.stream(
          `2B4P01! Partner bid another suit (third suit in partnership) at ${e.szPB} after opening a strong ${e.szPPB}, indicating ${e.m_fPartnersMin}-${e.m_fPartnersMax} points in his hand.\n`,
        );
      } else {
        e.m_fPartnersMin = 6;
        e.m_fPartnersMax = 12;
        status?.stream(
          `2B4P02! Partner bid another suit (third suit in partnership) at ${e.szPB} after opening a weak ${e.szPPB}, indicating ${e.m_fPartnersMin}-${e.m_fPartnersMax} points in his hand.\n`,
        );
      }
    } else {
      if (
        e.conventions.isOptionEnabled(BiddingOption.StructuredReverses) &&
        e.nPartnersPrevSuit !== NONE &&
        e.nPartnersSuit > e.nPartnersPrevSuit &&
        e.nPartnersBidLevel === 2 &&
        e.nPreviousBid !== Bid.Double
      ) {
        e.m_fPartnersMin = 17;
        e.m_fPartnersMax = 18;
        status?.stream(
          `2B4P0RV! Partner reversed and bid a higher-ranking suit at the 2-level (${e.szPB} over ${e.szPPB}) after our ${e.nPreviousBidLevel === 1 ? '1/1' : e.nPreviousBidLevel === 2 ? '2/1' : 'jump'} response, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.\n`,
        );
      } else if (
        e.nPreviousBid === Bid.Double &&
        e.conventions.isConventionEnabled(ConventionId.NegativeDoubles)
      ) {
        e.m_fPartnersMin = 12;
        e.m_fPartnersMax = 18;
        status?.stream(
          `2B4P03! Partner bid a second suit after our negative double, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.\n`,
        );
      } else {
        e.m_fPartnersMin = 12;
        e.m_fPartnersMax = 18;
        status?.stream(
          `2B4P04! Partner bid another suit (third suit in partnership) at ${e.szPB} after our ${e.nPreviousBidLevel === 1 ? '1/1' : e.nPreviousBidLevel === 2 ? '2/1' : 'jump'} response, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.\n`,
        );
      }
    }

    e.fAdjPts = e.hand!.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    const newSuit = e.pickBestFinalSuit(status);

    if (e.m_fMinTPPoints < 18) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4P10! With only ${e.fCardPts}/${e.fPts} points in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, we have to pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints <= 19 && isSuit(e.nPartnersPrevSuit)) {
      if (e.hand!.getSuitRank(e.nPartnersSuit) < e.hand!.getSuitRank(e.nPartnersPrevSuit)) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4P14! With ${e.fCardPts}/${e.fPts} points in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, and a preference for partner's second suit, we pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        e.m_nBid = e.getCheapestShiftBid(e.nPartnersPrevSuit);
        e.m_nAgreedSuit = e.nPartnersPrevSuit;
        status?.stream(
          `B4P16! With ${e.fCardPts}/${e.fPts} points in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, and a preference for partner's first suit, we shift back to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    // 20+ min total points
    if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To2, PTS_GAME - 6, PTS_GAME - 4, SupportLength.Len4))
      return e.validateBid(e.m_nBid);
    if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To3, PTS_GAME - 3, PTS_GAME - 1, SupportLength.Len4))
      return e.validateBid(e.m_nBid);

    if (e.numPPrevSuitSupportCards >= 3 && isSuit(e.nPartnersPrevSuit)) {
      if (e.m_fMinTPPoints >= PTS_GAME - 6 && e.m_fMinTPPoints <= PTS_GAME - 4) {
        e.m_nAgreedSuit = e.nPartnersPrevSuit;
        e.m_nBid = e.getCheapestShiftBid(e.nPartnersPrevSuit);
        status?.stream(
          `B4P20! With ${e.fCardPts}/${e.fPts} points and ${e.numPPrevSuitSupportCards}-card support for partner's first suit (${e.szPPS}), return to it by bidding ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
      if (e.m_fMinTPPoints >= PTS_GAME - 3 && e.m_fMinTPPoints < PTS_GAME) {
        e.m_nAgreedSuit = e.nPartnersPrevSuit;
        if (e.nPreviousBidLevel === 1 && isMajor(e.nPartnersPrevSuit)) {
          e.m_nBid = e.getJumpShiftBid(e.nPartnersPrevSuit, e.nPartnersBid);
          status?.stream(
            `B4P22! With ${e.fCardPts}/${e.fPts} points in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, and with ${e.numPPrevSuitSupportCards}-card support for partner's first suit (${e.szPPS}), return to it by jump shifting to ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.m_nBid = e.getCheapestShiftBid(e.nPartnersPrevSuit);
          status?.stream(
            `B4P24! With ${e.fCardPts}/${e.fPts} points in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, and ${e.numPPrevSuitSupportCards}-card support for partner's first suit (${e.szPPS}), return to it by shifting back to ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
        return e.validateBid(e.m_nBid);
      }
    }

    if (
      e.nPartnersBidLevel === 2 &&
      e.nPrefSuitStrength < SuitStrength.Strong &&
      e.numSupportCards < 4 &&
      e.numPPrevSuitSupportCards < 4
    ) {
      if (e.bidNoTrumpEngine(2, PTS_GAME - 3, PTS_GAME - 1, false, StoppedCode.Unbid))
        return e.validateBid(e.m_nBid);
    }

    if (
      isSuit(e.nPreviousSuit) &&
      e.rebidSuitEngine(SuitType.Prev, RebidTarget.Cheapest, PTS_GAME - 4, PTS_GAME - 2, SuitLength.Six)
    )
      return e.validateBid(e.m_nBid);

    if (e.m_fMinTPPoints < PTS_GAME) {
      e.m_nBid = e.getCheapestShiftBid(newSuit);
      const newBidLevel = bidLevel(e.m_nBid);
      if (
        newBidLevel > 3 ||
        (newBidLevel === 3 && e.m_fMinTPPoints < PTS_GAME - 1) ||
        (newBidLevel === 2 && newSuit === Suit.NoTrump && e.m_fMinTPCPoints <= PTS_GAME - 3)
      ) {
        const nTestBid = isSuit(e.nPartnersPrevSuit)
          ? e.getCheapestShiftBid(e.nPartnersPrevSuit)
          : Bid.Pass;
        if (
          e.numPPrevSuitSupportCards >= e.numSupportCards &&
          nTestBid !== Bid.Pass &&
          bidLevel(nTestBid) === bidLevel(e.nPartnersBid)
        ) {
          e.m_nBid = nTestBid;
          status?.stream(
            `B4P26! With only ${e.fCardPts}/${e.fPts} points in hand and poor to moderate support for partner's suits, we return to partner's first suit at a bid of ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `B4P27! But with only ${e.fCardPts}/${e.fPts} points in hand and poor support for partner's suits, we have to pass.\n`,
          );
        }
      } else {
        status?.stream(
          `B4P28! With ${e.fCardPts}/${e.fPts} points and a lack of support for either of partner's suits, bid${newSuit === Suit.NoTrump ? ' ' : ' another suit at '}${bidToFullString(e.m_nBid)}.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    // here, we have 26+ min total points
    if (
      e.m_fMinTPPoints < PTS_SLAM &&
      isSuit(e.nPartnersPrevSuit) &&
      isMajor(e.nPartnersPrevSuit) &&
      e.numPPrevSuitSupportCards >= 4
    ) {
      e.m_nAgreedSuit = e.nPartnersPrevSuit;
      if (e.nPartnersBid < makeBid(e.nPartnersPrevSuit, 4)) {
        e.m_nBid = makeBid(e.nPartnersPrevSuit, 4);
        status?.stream(
          `B4P40! With ${e.numPPrevSuitSupportCards}-card support for partner's first suit (${e.szPPS}, holding ${e.szHPP}) and a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, we can bid game at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4P40a! We have ${e.numSupportCards}-card support for partner's first suit (${e.szPS}, holding ${e.szHP}), but with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, we can't raise partner beyond his ${e.szPB} bid, so pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints < PTS_SLAM && isMajor(e.nPartnersSuit) && e.numCardsInSuit[e.nPartnersSuit] >= 4) {
      e.m_nAgreedSuit = e.nPartnersSuit;
      if (e.nPartnersBidLevel < 4) {
        e.m_nBid = e.getGameBid(e.nPartnersSuit);
        status?.stream(
          `B4P42! With ${e.fCardPts}/${e.fPts}/${e.fAdjPts} points and ${e.numSupportCards}-card support for partner's second suit (${e.szPS}, holding ${e.szHP}) and a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership we can bid game at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4P42a! We have ${e.numSupportCards}-card support for partner's second suit (${e.szPS}, holding ${e.szHP}), but with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership we can't raise partner beyond his ${e.szPB} bid, so pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (
      isSuit(e.nPreviousSuit) &&
      e.rebidSuitEngine(
        SuitType.Major,
        RebidTarget.At4,
        PTS_MAJOR_GAME,
        PTS_SLAM - 1,
        SuitLength.Six,
        SuitStrength.SelfSupporting,
        3,
      )
    ) {
      status?.stream(
        `B4P50! With a self-supporting ${Card.suitToSingularString(e.nPrefSuit)} suit and ${e.m_fMinTPPoints}+ team points, jump to game at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.bidNoTrumpEngine(3, PTS_NT_GAME + 1, PTS_SLAM - 1, true, StoppedCode.Unbid))
      return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 1, PTS_SLAM - 1, true, StoppedCode.DontCare))
      return e.validateBid(e.m_nBid);

    if (isSuit(e.nPartnersPrevSuit) && isMajor(e.nPartnersPrevSuit)) {
      if (e.raisePartnersSuitEngine(SuitType.Prev, RaiseTarget.To3, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3))
        return e.validateBid(e.m_nBid);
    }
    if (isMajor(e.nPartnersSuit)) {
      if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To3, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3))
        return e.validateBid(e.m_nBid);
    }

    if (
      isSuit(e.nPreviousSuit) &&
      e.rebidSuitEngine(
        SuitType.Minor,
        RebidTarget.At5,
        PTS_MINOR_GAME,
        PTS_SLAM - 1,
        SuitLength.Seven,
        SuitStrength.SelfSupporting,
        3,
      )
    ) {
      status?.stream(
        `B4P55! With a self-supporting ${Card.suitToSingularString(e.nPrefSuit)} suit and ${e.m_fMinTPPoints}+ team points, jump to game at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.raisePartnersSuitEngine(SuitType.Prev, RaiseTarget.To4, PTS_GAME, PTS_SLAM - 1, SupportLength.Len5))
      return e.validateBid(e.m_nBid);
    if (
      e.raisePartnersSuitEngine(
        SuitType.Minor,
        RaiseTarget.To4,
        PTS_MINOR_GAME - 3,
        PTS_SLAM - 1,
        SupportLength.Len5,
      )
    )
      return e.validateBid(e.m_nBid);

    if (
      isSuit(e.nPreviousSuit) &&
      e.rebidSuitEngine(SuitType.Major, RebidTarget.Cheapest, PTS_GAME, PTS_SLAM - 1, SuitLength.Six, SuitStrength.Strong)
    )
      return e.validateBid(e.m_nBid);
    if (
      isSuit(e.nPreviousSuit) &&
      e.rebidSuitEngine(SuitType.Minor, RebidTarget.Cheapest, PTS_GAME, PTS_SLAM - 1, SuitLength.Six, SuitStrength.Strong)
    )
      return e.validateBid(e.m_nBid);

    if (e.m_fMinTPPoints < PTS_SLAM) {
      if (e.nPartnersBid < e.getGameBid(newSuit)) {
        e.m_nBid = e.getCheapestShiftBid(newSuit);
        if (newSuit === e.nPartnersPrevSuit && isSuit(e.nPartnersPrevSuit)) {
          e.m_nAgreedSuit = e.nPartnersPrevSuit;
          status?.stream(
            `B4P64a! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, no rebiddable suit, and no good second suit, support partner's first suit at ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else if (newSuit === e.nPartnersSuit) {
          e.m_nAgreedSuit = e.nPartnersSuit;
          status?.stream(
            `B4P64b! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, no rebiddable suit, and no good second suit, support partner's second suit at ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else if (newSuit === e.nPreviousSuit && isSuit(e.nPreviousSuit)) {
          status?.stream(
            `B4P64c! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and a lack of good support for either of partner's suits, rebid our own ${Card.suitToSingularString(e.nPreviousSuit)} suit at ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else if (newSuit === Suit.NoTrump) {
          status?.stream(
            `B4P64d! With a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, no rebiddable suit or good second suit, and a lack of good support for either of partner's suits, bid ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          status?.stream(
            `B4P64e! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and a lack of good support for either of partner's suits, bid the fourth suit at ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4P68! We have a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership with modest support for partner's suits, and don't want to bid on past game, so we have to pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints >= PTS_SLAM) {
      const nSuit = e.pickBestFinalSuit(status);
      e.invokeBlackwood(nSuit);
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints < PTS_GAME - 4) {
      e.m_nBid = Bid.NT1;
      return e.validateBid(e.m_nBid);
    }
    e.m_nBid = e.getCheapestShiftBid(newSuit);
    status?.stream(
      `B4P80! With ${e.fCardPts}/${e.fPts} points in hand and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, no good support for partner's suits, and no other good options, bid ${e.nPreviousSuit === Suit.NoTrump ? 'a new' : 'the fourth'} suit at ${bidToFullString(e.m_nBid)}.\n`,
    );
    return e.validateBid(e.m_nBid);
  } // end of 3rd suit section

  //
  //==========================================================
  //
  // Rebidding after partner bid a new suit after bidding 1NT/2NT/3NT previously
  //
  if (
    e.nPartnersSuit !== e.nPreviousSuit &&
    e.nPartnersSuit !== e.nPartnersPrevSuit &&
    e.nPartnersPrevSuit === Suit.NoTrump &&
    e.nPartnersPrevBidLevel <= 3 &&
    isSuit(e.nPartnersSuit)
  ) {
    if (e.nPartnersPrevBidLevel === 3) {
      e.m_fPartnersMin = e.conventions.getNTRangeMin(3);
      e.m_fPartnersMax = e.conventions.getNTRangeMax(3);
      status?.stream(
        `2B4T00! Partner bid another suit at ${e.szPB} after his opening of 3NT and our response of ${e.szPVB}.\n`,
      );
    } else if (e.nPartnersPrevBidLevel === 2) {
      e.m_fPartnersMin = e.conventions.getNTRangeMin(2);
      e.m_fPartnersMax = e.conventions.getNTRangeMax(2);
      status?.stream(
        `2B4T01! Partner bid another suit at ${e.szPB} after his opening of 2NT and our response of ${e.szPVB}.\n`,
      );
    } else {
      e.m_fPartnersMin = e.conventions.getNTRangeMin(1);
      e.m_fPartnersMax = e.conventions.getNTRangeMax(1);
      status?.stream(
        `2B4T02! Partner bid another suit at ${e.szPB} after his opening of 1NT and our response of ${e.szPVB}.\n`,
      );
    }

    e.fAdjPts = e.hand!.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.m_fMinTPPoints < PTS_GAME - 5) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4T10! With only ${e.fCardPts}/${e.fPts} points in hand, for a total in the partnership of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points, we have to pass partner's ${e.szPB} bid.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To2, PTS_GAME - 5, PTS_GAME - 4, SupportLength.Len4))
      return e.validateBid(e.m_nBid);
    if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To3, PTS_GAME - 3, PTS_GAME - 1, SupportLength.Len4))
      return e.validateBid(e.m_nBid);

    if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 3, PTS_NT_GAME - 1, false, StoppedCode.Unbid))
      return e.validateBid(e.m_nBid);

    if (e.bBalanced && e.nPartnersBid < Bid.NT2) {
      if (e.bidNoTrumpEngine(2, PTS_GAME - 3, PTS_GAME - 1, false, StoppedCode.DontCare))
        return e.validateBid(e.m_nBid);
    }

    if (e.rebidSuitEngine(SuitType.Any, RebidTarget.Cheapest, PTS_GAME - 4, PTS_GAME - 2, SuitLength.Six))
      return e.validateBid(e.m_nBid);

    if (e.m_fMinTPPoints < PTS_GAME) {
      if (e.bidNextBestSuitEngine(SuitType.Any, ShiftTarget.Cheapest, PTS_GAME - 5, PTS_GAME - 1)) {
        status?.stream(
          `B4T20! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership but without good support for partner's new ${e.szPSS} suit (holding ${e.szHP}), bid another suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4T21! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership but without good support for partner's new ${e.szPSS} suit (holding ${e.szHP}), and with no more bidding room, we're forced to pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPPoints < PTS_SLAM && isMajor(e.nPartnersSuit) && e.numSupportCards >= 4) {
      e.m_nAgreedSuit = e.nPartnersSuit;
      e.m_nBid = makeBid(e.nPartnersSuit, 4);
      status?.stream(
        `B4T24! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership and ${e.numSupportCards}-card support for partner's new ${e.szPSS} suit (holding ${e.szHP}), we can bid game at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_SLAM - 1, false, StoppedCode.Unbid))
      return e.validateBid(e.m_nBid);

    if (
      e.rebidSuitEngine(
        SuitType.Major,
        RebidTarget.At4,
        PTS_MAJOR_GAME,
        PTS_SLAM - 1,
        SuitLength.Six,
        SuitStrength.SelfSupporting,
        4,
      )
    )
      return e.validateBid(e.m_nBid);

    if (e.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.One, PTS_MINOR_GAME - 3, PTS_SLAM - 1, SupportLength.Len5))
      return e.validateBid(e.m_nBid);

    if (e.m_fMinTPCPoints < PTS_SLAM) {
      if (e.bidNextBestSuitEngine(SuitType.Any, ShiftTarget.Cheapest, PTS_GAME - 4, PTS_SLAM - 1)) {
        status?.stream(
          `B4T28! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership but without good support for partner's new ${e.szPSS} suit (holding ${e.szHP}), bid another suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `B4T29! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership but without good support for partner's new ${e.szPSS} suit (holding ${e.szHP}), and with no more safe bidding room, we're forced to pass.\n`,
        );
      }
      return e.validateBid(e.m_nBid);
    }

    if (e.m_fMinTPCPoints >= PTS_SLAM) {
      e.invokeBlackwood(Suit.NoTrump);
      return e.validateBid(e.m_nBid);
    }

    if (e.bidNoTrumpEngine(1, 0, PTS_NT_GAME - 4)) return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 3, PTS_NT_GAME - 1)) return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_SLAM - 1, false, StoppedCode.Unbid))
      return e.validateBid(e.m_nBid);

    if (e.bidNextBestSuitEngine(SuitType.Any, ShiftTarget.Cheapest, PTS_GAME - 4, PTS_GAME - 1)) {
      status?.stream(
        `B4T28! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership but without good support for partner's new ${e.szPSS} suit (holding ${e.szHP}), bid another suit at ${bidToFullString(e.m_nBid)}.\n`,
      );
    } else {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `B4T29! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership but without good support for partner's new ${e.szPSS} suit (holding ${e.szHP}), and no more safe bidding room, we're forced to pass\n`,
      );
    }
    return e.validateBid(e.m_nBid);
  } // end of partner's rebid after NT section

  //
  //==========================================================
  //
  // Rebidding after partner made a jump shift in a new suit
  // e.g., 1H -> 1S -> 3C, showing 19+ points
  //
  if (
    e.nPartnersSuit !== e.nPreviousSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPartnersSuit) &&
    isSuit(e.nPartnersPrevSuit) &&
    e.nPartnersBid - e.nPreviousBid > 5
  ) {
    const newSuit = e.pickBestFinalSuit(status);

    if (e.nPartnersOpeningBid === Bid.C2) {
      e.m_fPartnersMin = 23;
      e.m_fPartnersMax = Math.min(22, 40 - e.fCardPts);
      status?.stream(
        `2B4Q00! Partner made a jump shift to ${e.szPB} in response to our ${bidToFullString(e.nPreviousBid)} bid and after his strong 2C opening, showing 23+ points.  The bid is forcing to game.\n`,
      );
    } else if (
      e.nPartnersPrevBidLevel === 2 &&
      e.conventions.isConventionEnabled(ConventionId.StrongTwoBids)
    ) {
      e.m_fPartnersMin = 19;
      e.m_fPartnersMax = 22;
      status?.stream(
        `2B4Q01! Partner made a jump shift to ${e.szPB} in response to our ${e.szPVB} bid and after his strong ${e.szPPB} opening, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.  The bid is forcing to game.\n`,
      );
    } else {
      e.m_fPartnersMin = 19;
      e.m_fPartnersMax = 22;
      status?.stream(
        `2B4Q02! Partner made a jump shift to ${e.szPB} in response to our ${e.szPVB} bid, showing ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.  The bid is forcing to game.\n`,
      );
    }

    e.m_bGameForceActive = true;

    e.fAdjPts = e.hand!.revalueHand(REVALUE_DUMMY, e.nPartnersSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.m_fMinTPPoints < PTS_SLAM) {
      if (e.rebidSuitEngine(SuitType.Major, RebidTarget.Cheapest, 0, PTS_SLAM - 1, SuitLength.Five, SuitStrength.Strong))
        return e.validateBid(e.m_nBid);

      if (e.nPartnersBidLevel === 3) {
        if (e.bidNoTrumpEngine(3, 0, PTS_SLAM - 1, false, StoppedCode.Unbid))
          return e.validateBid(e.m_nBid);
      }

      if (e.rebidSuitEngine(SuitType.Any, RebidTarget.Cheapest, 0, PTS_SLAM - 1, SuitLength.Six))
        return e.validateBid(e.m_nBid);

      if (isMajor(e.nPartnersPrevSuit) && e.numPPrevSuitSupportCards >= 3) {
        e.m_nAgreedSuit = e.nPartnersPrevSuit;
        e.m_nBid = e.getCheapestShiftBid(e.nPartnersPrevSuit);
        status?.stream(
          `B4Q10! With ${e.fCardPts}/${e.fPts} points and ${e.numPPrevSuitSupportCards}-card support for partner's first suit (${e.szPPS}, holding ${e.szHPP}), we can raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (isMajor(e.nPartnersSuit) && e.numCardsInSuit[e.nPartnersSuit] >= 4) {
        e.m_nAgreedSuit = e.nPartnersSuit;
        e.m_nBid = e.getCheapestShiftBid(e.nPartnersSuit);
        status?.stream(
          `B4Q20! With ${e.fCardPts}/${e.fPts} points and ${e.numSupportCards}-card support for partner's second suit (${e.szPS}, holding ${e.szHP}), we can raise to ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.hand!.getSuitRank(e.nPartnersSuit) < e.hand!.getSuitRank(e.nPartnersPrevSuit)) {
        if (e.numCardsInSuit[e.nPartnersSuit] >= 3) {
          e.m_nAgreedSuit = e.nPartnersSuit;
          e.m_nBid = e.getCheapestShiftBid(e.nPartnersSuit);
          status?.stream(
            `B4Q30! With ${e.fCardPts}/${e.fPts} points and ${e.numSupportCards}-card support for partner's second suit (${e.szPS}, holding ${e.szHP}), we can raise to ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      } else {
        if (e.numCardsInSuit[e.nPartnersPrevSuit] >= 3) {
          e.m_nAgreedSuit = e.nPartnersPrevSuit;
          e.m_nBid = e.getCheapestShiftBid(e.nPartnersPrevSuit);
          status?.stream(
            `B4Q35! With ${e.fCardPts}/${e.fPts} points and ${e.numPPrevSuitSupportCards}-card support for partner's first suit (${e.szPPS}, holding ${e.szHPP}), we can raise to ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      e.m_nBid = e.getCheapestShiftBid(newSuit);
      status?.stream(
        `B4Q38! With ${e.fCardPts}/${e.fPts} points, no good support for partner's suits, and no other good options, shift to ${e.nPreviousSuit === Suit.NoTrump ? 'another' : 'the fourth'} suit at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    // else try for slam -- bid Blackwood
    let nSuit: Suit;
    if (
      e.numSupportCards <= 3 &&
      e.numPPrevSuitSupportCards <= 3 &&
      isSuit(e.nPrefSuit) &&
      e.nSuitStrength[e.nPrefSuit] >= SuitStrength.Strong &&
      e.numCardsInSuit[e.nPrefSuit] >= 6
    ) {
      nSuit = e.nPrefSuit;
    } else {
      nSuit = e.pickSuperiorSuit(e.nPartnersPrevSuit, e.nPartnersSuit, SP_FIRST);
      if (isSuit(nSuit) && e.numCardsInSuit[nSuit] < 3) {
        nSuit = nSuit === e.nPartnersPrevSuit ? e.nPartnersSuit : e.nPartnersPrevSuit;
        if (e.numCardsInSuit[nSuit] < 3) nSuit = Suit.NoTrump;
      }
    }
    e.invokeBlackwood(nSuit);
    if (nSuit !== Suit.NoTrump)
      status?.stream(`B4Q40! We pick ${Card.suitToString(nSuit)} for the ultimate slam contract suit.\n`);
    else
      status?.stream(
        "B4Q41! Since we lack good support for either of partner's suits, the ultimate suit for the slam contract will be No Trump.\n",
      );
    return e.validateBid(e.m_nBid);
  } // end jump shift response section

  //
  //===============================================================
  //
  // Here, reached an unknown state
  //
  e.m_nBid = Bid.Pass;
  status?.stream("B4Z00! Partner made a response which we don't understand; simply pass.\n");
  return e.validateBid(e.m_nBid);
}
