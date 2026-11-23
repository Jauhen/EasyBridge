//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// BiddingRebidExtended.cpp -> biddingRebidExtended.ts
//
// Extended rebidding routines (MakeRebidExtended)
//

import { Card } from '../card.js';
import { Bid, bidLevel, bidSuit, bidToFullString, isMajor, isMinor, isSuit, makeBid, NONE, Suit } from '../constants.js';
import { REVALUE_DECLARER, REVALUE_DUMMY } from '../hand.js';
import { BiddingOption, ConventionId } from './biddingCodes.js';
import {
  PTS_GAME,
  PTS_GRAND_SLAM,
  PTS_MINOR_GAME,
  PTS_NT_GAME,
  PTS_SLAM,
  RaiseTarget,
  RebidTarget,
  ShiftTarget,
  StoppedCode,
  SuitLength,
  SuitStrength,
  SuitType,
  SupportLength,
} from './bidParameters.js';
import type { BidEngine } from './bidEngine.js';

//
// MakeRebidExtended()
//
// Rebid after the first two rounds -- i.e., 5th & later bids
//
export function makeRebidExtendedEngine(e: BidEngine): Bid {
  const status = e.status;

  status?.stream(`2Rebidding in round ${e.nRound + 1}.\n`);

  //
  // just for kicks, check if partner bid slam
  //
  if (e.nPartnersBid === Bid.NT7) {
    e.m_nBid = Bid.Pass;
    status?.stream(
      'BXPNTa! Partner has gone ahead and bid a grand slam, so cross our fingers and pass.\n',
    );
    return e.validateBid(e.m_nBid);
  }

  //
  //==========================================================
  //
  // Following through on a convention?
  //
  if (e.applyConventionTestsInternal()) {
    return e.validateBid(e.m_nBid);
  }

  //
  //============================================================
  //
  // did partner pass?
  //
  if (e.nPartnersBid === Bid.Pass) {
    e.m_nBid = Bid.Pass;
    status?.stream('BXPNTp! Partner has passed, so we pass also.\n');
    return e.validateBid(e.m_nBid);
  }

  //
  //============================================================
  //
  // See if partner finally raised our suit
  //
  if (
    e.m_nAgreedSuit === NONE &&
    e.nPartnersSuit === e.nPreviousSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPreviousSuit)
  ) {
    if (
      e.nPreviousSuit !== e.nFirstRoundSuit &&
      isSuit(e.m_nIntendedSuit) &&
      e.m_nIntendedSuit === e.nPartnersPrevSuit &&
      isSuit(e.nPartnersPrevSuit)
    ) {
      e.m_nAgreedSuit = e.nPartnersPrevSuit;

      if (e.nPartnersBid > e.getGameBid(e.m_nAgreedSuit)) {
        status?.stream(
          `BXA10! Partner has bid ${e.nPartnersBidLevel < 6 ? 'game' : 'a slam'} in the ${e.szPVSS} suit, which we really didn't intend.\n`,
        );
        if (e.m_fMinTPPoints >= PTS_SLAM) {
          status?.stream(
            `BXA20! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, try for a slam in partner's original ${Card.suitToSingularString(e.m_nAgreedSuit)} suit.\n`,
          );
          e.invokeBlackwood(e.m_nAgreedSuit);
          return e.validateBid(e.m_nBid);
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `BXA30! Partner has bid ${e.nPartnersBidLevel < 6 ? 'game' : 'a slam'} in the ${e.szPVSS} suit, which we really didn't intend to play in, but with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, we don't want to bid further, so pass.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      status?.stream(
        `BXA40! Partner has raised us in the ${e.szPVSS} suit, which we really didn't intend to play in, so try to switch back to partner's ${Card.suitToSingularString(e.m_nAgreedSuit)} suit.\n`,
      );

      if (e.raisePartnersSuitEngine(SuitType.Prev, RaiseTarget.To3, PTS_GAME - 3, PTS_GAME - 1, SupportLength.Len3))
        return e.validateBid(e.m_nBid);
      if (e.raisePartnersSuitEngine(SuitType.PrevMajor, RaiseTarget.ToGame, PTS_GAME, 99, SupportLength.Len3))
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(
          SuitType.PrevMinor,
          RaiseTarget.To4,
          PTS_MINOR_GAME - 3,
          PTS_MINOR_GAME - 1,
          SupportLength.Len3,
        )
      )
        return e.validateBid(e.m_nBid);
      if (e.raisePartnersSuitEngine(SuitType.PrevMinor, RaiseTarget.ToGame, PTS_MINOR_GAME, 99, SupportLength.Len4))
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(SuitType.PrevMinor, RaiseTarget.ToGame, PTS_MINOR_GAME + 1, 99, SupportLength.Len3)
      )
        return e.validateBid(e.m_nBid);

      e.m_nBid = Bid.Pass;
      status?.stream("BXA60! However, we don't have enough points to raise partner any further, so pass.\n");
      return e.validateBid(e.m_nBid);
    } else {
      e.m_nAgreedSuit = e.nPreviousSuit;

      if (e.nPartnersBidLevel >= 6) {
        if (e.nPartnersBidLevel === 6 && e.m_fMinTPPoints >= PTS_GRAND_SLAM) {
          e.m_nBid = makeBid(e.m_nAgreedSuit, 7);
          status?.stream(
            `BXA90! Partner has returned to our suit at a small slam level, and with a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, push on to a grand slam at ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream('BXA91! Partner has returned to our suit at slam level, so pass and go for it.\n');
        }
        return e.validateBid(e.m_nBid);
      } else if (e.nPartnersBid >= e.getGameBid(e.m_nAgreedSuit)) {
        if (e.m_fMinTPPoints >= PTS_SLAM) {
          e.invokeBlackwood(e.m_nAgreedSuit);
          return e.validateBid(e.m_nBid);
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `BXB30! Partner has bid ${e.nPartnersBidLevel < 6 ? 'game' : 'a slam'} in the ${e.szPVSS} suit, and with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, we don't want to raise further, so pass.\n`,
          );
          return e.validateBid(e.m_nBid);
        }
      }

      const nRaiseLevel = e.nPartnersBidLevel - e.nPreviousBidLevel;
      if (nRaiseLevel === 1) {
        return e.respondToSingleRaiseEngine(e.nPartnersBid);
      } else if (nRaiseLevel === 2) {
        return e.respondToDoubleRaiseEngine(e.nPartnersBid);
      } else if (
        nRaiseLevel === 3 &&
        ((isMajor(e.nPartnersSuit) && e.nPartnersBidLevel === 4) ||
          (isMinor(e.nPartnersSuit) && e.nPartnersBidLevel === 5))
      ) {
        return e.respondToTripleRaiseEngine();
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `BXB40! With an unusual raise by partner from ${e.szPVB} to ${e.szPB}, we just pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }
  }

  //
  //============================================================
  //
  // See if partner raised our first suit after we showed another suit
  //
  if (
    e.m_nAgreedSuit === NONE &&
    e.nPreviousSuit !== e.nFirstRoundSuit &&
    e.nPartnersSuit === e.nFirstRoundSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nFirstRoundSuit) &&
    isSuit(e.nPartnersSuit)
  ) {
    e.m_nAgreedSuit = e.nFirstRoundSuit;
    const numCards = e.numCardsInSuit[e.m_nAgreedSuit];
    status?.stream(
      `BXC00! Partner has returned to our first suit, raising it to ${bidToFullString(e.nPartnersBid)}.\n`,
    );
    e.fAdjPts = e.hand!.revalueHand(REVALUE_DECLARER, e.nPartnersSuit, true);
    e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
    e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
    e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
    e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;

    if (e.m_fMinTPPoints < PTS_SLAM) {
      if (e.nPartnersBid < e.getGameBid(e.m_nAgreedSuit)) {
        if (isMajor(e.m_nAgreedSuit) && numCards >= 4) {
          if (e.m_fMinTPPoints >= PTS_GAME) {
            e.m_nBid = e.getGameBid(e.m_nAgreedSuit);
            status?.stream(
              `BXC02! And with ${e.numPrefSuitCards} trump cards and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} team points, push on to game at ${bidToFullString(e.m_nBid)}.\n`,
            );
            return e.validateBid(e.m_nBid);
          } else if (e.m_fMinTPPoints >= PTS_GAME - 3 && e.nPartnersBidLevel === 2) {
            e.m_nBid = makeBid(e.m_nAgreedSuit, 3);
            status?.stream(
              `BXC03! But with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} team points, we don't have quite enough for game, so raise only to ${bidToFullString(e.m_nBid)}.\n`,
            );
            return e.validateBid(e.m_nBid);
          }
        } else if (numCards >= 4) {
          if (e.m_fMinTPPoints >= PTS_MINOR_GAME) {
            e.m_nBid = e.getGameBid(e.m_nAgreedSuit);
            status?.stream(
              `BXC06! And with ${e.numPrefSuitCards} trump cards and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} team points, push on to a minor game at ${bidToFullString(e.m_nBid)}.\n`,
            );
            return e.validateBid(e.m_nBid);
          } else {
            if (e.m_fMinTPPoints >= PTS_MINOR_GAME - 3 && e.nPartnersBidLevel <= 3) {
              e.m_nBid = makeBid(e.m_nAgreedSuit, 4);
              status?.stream(
                `BXC07! But with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} team points, we don't have quite enough for game, so raise only to ${bidToFullString(e.m_nBid)}.\n`,
              );
              return e.validateBid(e.m_nBid);
            } else if (e.m_fMinTPPoints >= PTS_MINOR_GAME - 6 && e.nPartnersBidLevel === 2) {
              e.m_nBid = makeBid(e.m_nAgreedSuit, 3);
              status?.stream(
                `BXC08! But with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} team points, we don't have quite enough for game, so raise only to ${bidToFullString(e.m_nBid)}.\n`,
              );
              return e.validateBid(e.m_nBid);
            }
          }
        }
        e.m_nBid = Bid.Pass;
        status?.stream(
          `BXC20! With ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership and no aspirations for a higher contract, we sign off on partner's bid of ${e.szPB}.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        if (e.isGameBid(e.nPartnersBid)) {
          if (e.nPartnersBidLevel < 6) {
            e.m_nBid = Bid.Pass;
            status?.stream(`BXC30! With a game contract reached at ${e.szPB}, we pass.\n`);
          } else {
            e.m_nBid = Bid.Pass;
            status?.stream(`BXC32! With a contract reached at ${e.szPB}, we pass.\n`);
          }
        }
        return e.validateBid(e.m_nBid);
      }
    }

    if (e.m_fMinTPPoints <= PTS_GRAND_SLAM && e.nPartnersBidLevel < 6) {
      e.m_nBid = makeBid(e.nPartnersSuit, 6);
      status?.stream(
        `BXC40! With an agreed suit of ${Card.suitToString(e.nPartnersSuit)} and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total partnership points, bid on to slam at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
    if (e.m_fMinTPPoints >= PTS_GRAND_SLAM && e.nPartnersBidLevel < 7) {
      e.m_nBid = makeBid(e.nPartnersSuit, 7);
      status?.stream(
        `BXC44! With an agreed suit of ${Card.suitToString(e.nPartnersSuit)} and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total partnership points, bid on to slam at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
    e.m_nBid = Bid.Pass;
    status?.stream(
      `BXC48! With a slam contract reached at ${e.szPB} and holding ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, sign off on partner's bid.\n`,
    );
    return e.validateBid(e.m_nBid);
  }

  //
  //============================================================
  //
  // See if partner returned to our suit after we ventured out to show a side suit
  //
  if (
    e.m_nAgreedSuit !== NONE &&
    e.nPreviousSuit !== e.m_nAgreedSuit &&
    e.nPartnersSuit === e.m_nAgreedSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.m_nAgreedSuit)
  ) {
    status?.stream(
      `2BXU00! Partner returned to our agreed ${Card.suitToSingularString(e.m_nAgreedSuit)} at a bid of ${bidToFullString(e.nPartnersBid)} after we showed the ${isSuit(e.nPreviousSuit) ? Card.suitToSingularString(e.nPreviousSuit) : ''} side suit.\n`,
    );
    if (e.m_fMinTPPoints < PTS_SLAM) {
      if (e.nPartnersBid < e.getGameBid(e.m_nAgreedSuit)) {
        if (
          (isMajor(e.m_nAgreedSuit) && e.m_fMinTPPoints >= PTS_GAME) ||
          (isMinor(e.m_nAgreedSuit) && e.m_fMinTPPoints >= PTS_MINOR_GAME)
        ) {
          e.m_nBid = e.getGameBid(e.m_nAgreedSuit);
          status?.stream(
            `BXU20! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, go ahead and bid game at ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `BXU22! With a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points, we don't have the strength to bid game, so pass.\n`,
          );
        }
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream('BXU30! Partner has bid game, and we see no reason to move further, so pass.\n');
      }
    } else {
      if (e.nPartnersBidLevel < 6) {
        e.invokeBlackwood(e.m_nAgreedSuit);
      } else if (e.nPartnersBidLevel === 6) {
        if (e.m_fMinTPPoints <= PTS_GRAND_SLAM) {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `BXU50! Partner has bid a small slam, and with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we're satisfied with the bid, so pass.\n`,
          );
        } else {
          e.m_nBid = makeBid(e.m_nAgreedSuit, 7);
          status?.stream(
            `BXU55! Partner has bid a small slam, and with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we boldly raise to ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
      } else {
        status?.stream('BXU90! Partner has bid a grand slam, so pass and hope for the best.\n');
      }
    }
    return e.validateBid(e.m_nBid);
  }

  //
  //==========================================================
  //
  // Rebidding at stage 5, after 2 suits have been shown
  //
  if (
    e.nRound === 2 &&
    e.nPartnersSuit === e.nPartnersPrevSuit &&
    e.nPrefSuit === e.nPreviousSuit &&
    e.nPartnersSuit !== e.nPreviousSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPrefSuit) &&
    isSuit(e.nPartnersSuit)
  ) {
    if (e.nPartnersBid - e.nPreviousBid > 5) {
      e.m_fPartnersMin = Math.max(e.m_fPartnersMin, 11);
      e.m_fPartnersMax = Math.max(e.m_fPartnersMax, 18);
      e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
      e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
      e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
      e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;
      status?.stream(
        `2BXF01! Partner jump rebid his ${e.szPSS} suit at ${e.szPB}, indicating 11-18 pts.\n`,
      );
    }

    // see if we're bidding a major
    if (isMajor(e.nPrefSuit)) {
      if (e.numPrefSuitCards <= 6) {
        if (e.nPartnersBid >= e.getGameBid(e.nPrefSuit) && e.m_fMaxTPPoints < PTS_SLAM) {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `BXF10! At this point, the partnership has ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total points, but lacks agreement on a suit.  In addition, we are above game level in our own ${e.szPrefS} suit.  So at this point, we pass.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        if (e.nPartnersBidLevel < 4) {
          if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.One, PTS_GAME, PTS_SLAM - 1, SupportLength.Len2))
            return e.validateBid(e.m_nBid);
        }

        if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.One, PTS_SLAM, 99, SupportLength.Len2))
          return e.validateBid(e.m_nBid);

        if (
          e.rebidSuitEngine(
            SuitType.Major,
            RebidTarget.Cheapest,
            PTS_GAME,
            PTS_SLAM - 1,
            SuitLength.Six,
            SuitStrength.Strong,
          )
        )
          return e.validateBid(e.m_nBid);

        e.m_nBid = Bid.Pass;
        status?.stream(
          `BXF14! At this point, the partnership has ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total points, and lacks agreement on a suit.  With only weak (${e.szHP}) support for partner, we have to pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        if (e.getGameBid(e.nPrefSuit) > e.nPartnersBid) {
          e.m_nBid = e.getCheapestShiftBid(e.nPrefSuit);
          status?.stream(
            `BXF20! With ${e.numPrefSuitCards} cards in our preferred ${e.szPrefS} suit, rebid it again at ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        if (e.nPartnersBidLevel < 4) {
          if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.One, PTS_GAME, PTS_SLAM - 1, SupportLength.Len2))
            return e.validateBid(e.m_nBid);
        }

        if (e.m_fMaxTPPoints < PTS_SLAM) {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `BXF24! Despite having ${e.numPrefSuitCards} cards in our preferred ${e.szPrefS} suit and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points, we can't rebid our preferred suit without exceeding game, so pass.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To6, PTS_SLAM, 99, SupportLength.Len2))
          return e.validateBid(e.m_nBid);

        if (
          e.rebidSuitEngine(
            SuitType.Major,
            RebidTarget.At6,
            PTS_SLAM,
            99,
            SuitLength.Eight,
            SuitStrength.Strong | SuitStrength.Solid,
          )
        )
          return e.validateBid(e.m_nBid);

        e.invokeBlackwood(Suit.NoTrump);
        return e.validateBid(e.m_nBid);
      }
    }

    // see if we're bidding a minor against a MAJOR
    if (isMinor(e.nPrefSuit) && isMajor(e.nPartnersSuit)) {
      if (e.numPrefSuitCards <= 7) {
        if (e.nPartnersBid >= e.getGameBid(e.nPrefSuit) && e.m_fMaxTPPoints < PTS_SLAM) {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `BXG10! At this point, the partnership has ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total points, but lacks agreement on a suit.  In addition, we are above game level in our own ${e.szPrefS} suit.  So at this point, we pass.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        if (e.nPartnersBidLevel < 4) {
          if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.One, PTS_GAME, PTS_SLAM - 1, SupportLength.Len2))
            return e.validateBid(e.m_nBid);
        }

        if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.Cheapest, 0, 99, SuitLength.Six, SuitStrength.Strong))
          return e.validateBid(e.m_nBid);

        e.m_nBid = Bid.Pass;
        status?.stream(
          `BXG40! Despite having ${e.numPrefSuitCards} cards in our preferred ${e.szPrefS} suit and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points, we can't push our minor and can't support partner's major, so pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        if (e.nPartnersBid < e.getGameBid(e.nPrefSuit)) {
          if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.Cheapest, 0, 99, SuitLength.Six, SuitStrength.Strong))
            return e.validateBid(e.m_nBid);
        }

        if (e.nPartnersBidLevel < 4) {
          if (e.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.One, PTS_GAME, PTS_SLAM - 1, SupportLength.Len2))
            return e.validateBid(e.m_nBid);
        }

        e.m_nBid = Bid.Pass;
        status?.stream(
          `BXG50! Despite having ${e.numPrefSuitCards} cards in our preferred ${e.szPrefS} suit and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points, we can't push our minor and can't support partner's major, so pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    // see if we're bidding a minor against another minor
    if (isMinor(e.nPrefSuit) && isMinor(e.nPartnersSuit)) {
      if (e.numPrefSuitCards <= 6) {
        if (e.hand!.allOtherSuitsStopped(e.nPartnersSuit)) {
          e.m_nBid = Bid.NT3;
          status?.stream(
            `BXH10! With a ${e.numPrefSuitCards}-card minor and all other suits stopped, bid ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        if (e.nPartnersBidLevel < 5) {
          if (e.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.One, PTS_MINOR_GAME - 7, 99, SupportLength.Len3))
            return e.validateBid(e.m_nBid);
        }

        if (e.nPartnersBid >= e.getGameBid(e.nPrefSuit) && e.m_fMaxTPPoints < PTS_SLAM) {
          e.m_nBid = Bid.Pass;
          status?.stream(
            `BXH14! At this point, the partnership has ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total points, but lacks agreement on a suit.  In addition, we are above game level in our own ${e.szPrefS} suit.  So at this point, we pass.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.Cheapest, 0, 99, SuitLength.Six, SuitStrength.Strong))
          return e.validateBid(e.m_nBid);

        if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.Cheapest, PTS_SLAM, 99, SuitLength.Four, SuitStrength.Strong))
          return e.validateBid(e.m_nBid);

        e.m_nBid = Bid.Pass;
        status?.stream(
          `BXH40! We have a ${e.numPrefSuitCards}-card ${e.szPrefS} suit, and partner is pushing the ${e.szPSS} suit, but we have no agreement, and lack complete stoppers, so we have to pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else {
        if (e.nPartnersBid < e.getGameBid(e.nPrefSuit)) {
          if (e.rebidSuitEngine(SuitType.Minor, RebidTarget.Cheapest, 0, 99, SuitLength.Six, SuitStrength.Strong))
            return e.validateBid(e.m_nBid);
        }

        if (e.hand!.allOtherSuitsStopped(e.nPartnersSuit)) {
          e.m_nBid = Bid.NT3;
          status?.stream(
            `BXI10! With a ${e.numPrefSuitCards}-card minor and all other suits stopped, bid ${bidToFullString(e.m_nBid)}.\n`,
          );
          return e.validateBid(e.m_nBid);
        }

        e.m_nBid = Bid.Pass;
        status?.stream(
          `BXI40! Despite holding a ${e.numPrefSuitCards}-card ${e.szPrefS} suit, we can't come to agreement with partner, so we have to pass.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }
  }

  //
  //==========================================================
  //
  // Rebidding at stage 5 or later, after 3 suits have been shown
  //
  if (
    e.nRound >= 2 &&
    e.nPartnersSuit === e.nPartnersPrevSuit &&
    e.nPreviousSuit !== e.nPartnersSuit &&
    e.nPrefSuit !== e.nPreviousSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPartnersSuit)
  ) {
    const nPartnersGameBid = e.getGameBid(e.nPartnersSuit);
    if (e.nPartnersBidLevel >= nPartnersGameBid && e.m_fMinTPPoints < PTS_SLAM) {
      e.m_nBid = Bid.Pass;
      status?.stream(
        `BXK05! Partner has rebid his suit at ${e.nPartnersBidLevel < 6 ? 'game' : 'slam'}level, and we just don't have the strength to venture further, so pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    let bRebidTwice = false;
    if (e.nPartnersSuit === bidSuit(e.getPartnerPriorBid(0))) {
      status?.stream('BXK06! Partner has rebid his suit twice, indicating 6+ cards.\n');
      bRebidTwice = true;
    }

    if (e.nPartnersBid < nPartnersGameBid) {
      if (
        e.raisePartnersSuitEngine(
          SuitType.Any,
          RaiseTarget.To4,
          PTS_GAME,
          PTS_SLAM - 1,
          bRebidTwice ? SupportLength.Len2 : SupportLength.Len3,
          SuitStrength.Any,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(
          SuitType.Any,
          RaiseTarget.To3,
          PTS_GAME - 3,
          PTS_SLAM - 1,
          bRebidTwice ? SupportLength.Len2 : SupportLength.Len3,
          SuitStrength.Any,
        )
      )
        return e.validateBid(e.m_nBid);
    }

    if (e.bPrefSuitIsSelfSupporting && isSuit(e.nPrefSuit)) {
      const nBid = e.getCheapestShiftBid(e.nPrefSuit);
      if (e.isBidSafe(nBid)) {
        e.m_nBid = nBid;
        status?.stream(
          `BXK10! With only ${e.numSupportCards}-card support for partner's ${e.szPS}, bid our self-supporting ${e.szPrefSS} suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    if (
      isMajor(e.nPartnersSuit) &&
      e.nPartnersSuit < e.nPartnersPrevSuit &&
      e.nPartnersBid < nPartnersGameBid
    ) {
      if (
        e.raisePartnersSuitEngine(
          SuitType.Major,
          RaiseTarget.To4,
          PTS_GAME + 1,
          PTS_SLAM - 1,
          SupportLength.Len2,
          SuitStrength.Any,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(
          SuitType.Major,
          RaiseTarget.To3,
          PTS_GAME - 2,
          PTS_SLAM - 1,
          SupportLength.Len2,
          SuitStrength.Any,
        )
      )
        return e.validateBid(e.m_nBid);
    }

    if (
      isSuit(e.nPrefSuit) &&
      e.hand!.allOtherSuitsStopped(e.nPrefSuit, e.nPartnersSuit) &&
      e.nPartnersBid < Bid.NT3 &&
      e.m_fMinTPCPoints >= PTS_GAME &&
      e.m_fMinTPCPoints < PTS_SLAM
    ) {
      e.m_nBid = Bid.NT3;
      status?.stream(
        `BXK20! With no agreement in suits, and all other suits stopped, bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (
      isMinor(e.nPartnersSuit) &&
      e.nPartnersSuit < e.nPartnersPrevSuit &&
      e.nPartnersBid < nPartnersGameBid
    ) {
      if (
        e.raisePartnersSuitEngine(
          SuitType.Any,
          RaiseTarget.To3,
          PTS_GAME - 1,
          PTS_GAME,
          bRebidTwice ? SupportLength.Len2 : SupportLength.Len3,
          SuitStrength.Any,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(
          SuitType.Any,
          RaiseTarget.To4,
          PTS_GAME + 1,
          PTS_SLAM - 1,
          bRebidTwice ? SupportLength.Len2 : SupportLength.Len3,
          SuitStrength.Any,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(
          SuitType.Any,
          RaiseTarget.To5,
          PTS_MINOR_GAME + 1,
          PTS_SLAM - 1,
          bRebidTwice ? SupportLength.Len2 : SupportLength.Len3,
          SuitStrength.Any,
        )
      )
        return e.validateBid(e.m_nBid);
    }

    if (e.nPartnersBid < nPartnersGameBid) {
      if (
        e.rebidSuitEngine(
          SuitType.Any,
          ShiftTarget.Cheapest,
          PTS_GAME - 3,
          99,
          SuitLength.Six,
          SuitStrength.Strong,
        )
      )
        return e.validateBid(e.m_nBid);
    }

    if (
      e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To7, PTS_GRAND_SLAM + 1, 0, SupportLength.Len2, SuitStrength.Any)
    )
      return e.validateBid(e.m_nBid);
    if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To6, PTS_SLAM + 1, 0, SupportLength.Len2, SuitStrength.Any))
      return e.validateBid(e.m_nBid);
    if (
      e.raisePartnersSuitEngine(
        SuitType.Major,
        RaiseTarget.ToGame,
        PTS_GAME + 2,
        0,
        bRebidTwice ? SupportLength.Len1 : SupportLength.Len2,
        SuitStrength.Any,
      )
    )
      return e.validateBid(e.m_nBid);
    if (
      e.raisePartnersSuitEngine(
        SuitType.Minor,
        RaiseTarget.ToGame,
        PTS_MINOR_GAME + 2,
        0,
        bRebidTwice ? SupportLength.Len1 : SupportLength.Len2,
        SuitStrength.Any,
      )
    )
      return e.validateBid(e.m_nBid);

    if (e.m_fMinTPCPoints >= PTS_SLAM && e.bSemiBalanced) {
      e.m_nBid = e.m_fMinTPCPoints >= PTS_GRAND_SLAM ? Bid.NT7 : Bid.NT6;
      status?.stream(
        `BXK30! With no agreement in suits but with ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} HCPs in the partnership, go ahead and bid slam at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (
      e.nPartnersBidLevel === 3 &&
      e.numSupportCards === 0 &&
      (e.m_fMinTPCPoints >= PTS_GAME || e.m_fMinTPPoints >= PTS_GAME + 1)
    ) {
      e.m_nBid = Bid.NT3;
      status?.stream(
        `BXK36! With no agreement in suits and zero trump support for partner's ${e.szPS}, bail out at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    e.m_nBid = Bid.Pass;
    status?.stream(
      `BXK40! With no agreement in suits and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points, pass partner's ${e.szPB} bid.\n`,
    );
    return e.validateBid(e.m_nBid);
  }

  //
  //=============================================================
  //
  // Rebidding at stage 5, after 3 or 4 suits have been shown
  //
  if (
    e.nRound === 2 &&
    e.nPartnersSuit !== e.nPartnersPrevSuit &&
    e.nFirstRoundSuit !== e.nPreviousSuit &&
    e.nPartnersSuit !== Suit.NoTrump &&
    isSuit(e.nPartnersSuit)
  ) {
    if (e.nPartnersSuit === e.nNextPrevSuit) {
      status?.stream(
        `2BXL00! Partner has returned to the ${e.szNPSS} suit that we had bid earlier with a bid of ${e.szPB}.\n`,
      );
      const nContractPos = e.playerOpenedSuit(e.nPartnersSuit) ? REVALUE_DECLARER : REVALUE_DUMMY;
      status?.stream(
        `3BXL01! We need to re-evaluate holdings for the ${e.szNPSS} suit as ${nContractPos === REVALUE_DECLARER ? 'declarer' : 'dummy'}.\n`,
      );
      e.fAdjPts = e.hand!.revalueHand(nContractPos, e.nPartnersSuit, true, true);
      e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
      e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
      e.m_fMinTPCPoints = e.fCardPts + e.m_fPartnersMin;
      e.m_fMaxTPCPoints = e.fCardPts + e.m_fPartnersMax;
    } else {
      status?.stream(`BXL05! Partner has bid yet another suit, ${e.szPS}.\n`);
    }

    if (
      isSuit(e.nPrefSuit) &&
      isMajor(e.nPrefSuit) &&
      e.nPrefSuitStrength >= SuitStrength.Strong &&
      e.nPartnersBidLevel <= 2 &&
      e.m_fMinTPPoints >= PTS_GAME - 3
    ) {
      e.m_nBid = e.getCheapestShiftBid(e.nPrefSuit);
      if (e.isBidSafe(e.m_nBid, 1)) {
        status?.stream(
          `BXL10! With no agreement in suits, but with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points, return to our preferred ${e.szPrefSS} suit at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    if (e.numVoids === 0 && e.nPartnersBidLevel <= 3 && e.m_fMinTPCPoints >= PTS_GAME) {
      e.m_nBid = Bid.NT3;
      status?.stream(
        `BXL20! With 4 suits bid and no agreement, but with ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} high card points in the partnership and no void suits, bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.nPartnersSuit === e.nNextPrevSuit && e.nPrefSuit === e.nNextPrevSuit) {
      e.m_nAgreedSuit = e.nNextPrevSuit;
    } else if (e.nPartnersSuit !== e.nPartnersPrevSuit && e.nPartnersBid - e.nPreviousBid > 5) {
      e.m_nAgreedSuit = e.nPartnersSuit;
    } else if (
      e.nPPrevSuitSupport >= SuitStrength.WeakSupport &&
      e.nPPrevSuitSupport >= e.nPartnersSuitSupport &&
      isSuit(e.nPartnersPrevSuit)
    ) {
      if (e.nPartnersPrevSuit !== e.nPartnersSuit)
        status?.stream(
          `BXL30! Although partner bid ${e.szPS}, we prefer to return to his previous ${e.szPPSS} suit.\n`,
        );
      e.m_nAgreedSuit = e.nPartnersPrevSuit;
    } else if (e.nPartnersSuitSupport >= SuitStrength.WeakSupport) {
      e.m_nAgreedSuit = e.nPartnersSuit;
    }

    if (e.isGameBid(e.nPartnersBid)) {
      if (e.m_fMinTPPoints >= PTS_SLAM && e.nPartnersBidLevel < 6) {
        if (!isSuit(e.m_nAgreedSuit)) e.m_nAgreedSuit = Suit.NoTrump;
        e.m_nBid = makeBid(e.m_nAgreedSuit, e.m_fMinTPPoints >= PTS_GRAND_SLAM ? 7 : 6);
        if (isSuit(e.m_nAgreedSuit))
          status?.stream(
            `BXL34! With a total of ${e.m_fMinTPPoints}+ pts in the partnership, raise partner's ${e.m_nAgreedSuit === e.nPartnersPrevSuit ? 'previous ' : ''}${Card.suitToSingularString(e.m_nAgreedSuit)} suit to ${bidLevel(e.m_nBid) === 7 ? 'a grand slam' : 'slam'} at ${bidToFullString(e.m_nBid)}.\n`,
          );
        else
          status?.stream(
            `BXL35! With a total of ${e.m_fMinTPPoints}+ pts in the partnership and no suit agreement, push on to ${bidLevel(e.m_nBid) === 7 ? 'a grand slam' : 'slam'} at ${bidToFullString(e.m_nBid)}.\n`,
          );
      } else if (e.nPartnersBidLevel < 6) {
        e.m_nBid = Bid.Pass;
        status?.stream(
          `BXL36! Without the strength to push further at ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total team points, pass and accept the contract of ${bidToFullString(e.nPartnersBid)}.\n`,
        );
      } else {
        e.m_nBid = Bid.Pass;
        status?.stream("BXL37! Pass and accept partner's slam bid.\n");
      }
      return e.validateBid(e.m_nBid);
    } else if (isSuit(e.m_nAgreedSuit)) {
      e.m_nBid = e.getCheapestShiftBid(e.m_nAgreedSuit);
      status?.stream(
        `BXL38! Support partner's ${Card.suitToSingularString(e.m_nAgreedSuit)} suit with ${e.numCardsInSuit[e.m_nAgreedSuit]}-card support and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total team pts by bidding ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.numVoids === 0) {
      if (e.m_fMinTPCPoints >= PTS_SLAM && e.nPartnersBid < Bid.NT6) {
        e.m_nBid = Bid.NT6;
        status?.stream(
          `BXL42! With no agreement in suits but with partner showing strength with is jump shift, and with a total of ${e.m_fMinTPCPoints}+ HCPs in the partnership, bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else if (e.m_fMinTPCPoints >= PTS_GAME - 1 && e.nPartnersBid < Bid.NT3) {
        e.m_nBid = Bid.NT3;
        status?.stream(
          `BXL45! With no agreement in suits but with partner showing strength with is jump shift, bid ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    const nSuitType = e.nPPrevSuitSupport >= e.nPartnersSuitSupport ? SuitType.Prev : SuitType.Any;
    if (e.raisePartnersSuitEngine(nSuitType, RaiseTarget.To4, PTS_GAME, 99, SupportLength.Len2))
      return e.validateBid(e.m_nBid);
    if (e.raisePartnersSuitEngine(nSuitType, RaiseTarget.To3, PTS_GAME - 2, 99, SupportLength.Len2))
      return e.validateBid(e.m_nBid);

    e.m_nBid = Bid.Pass;
    status?.stream(
      `BXL60! With no agreement in suits and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points, pass.\n`,
    );
    return e.validateBid(e.m_nBid);
  }

  //
  //==========================================================
  //
  // Rebidding after partner bids NoTrump in a late round
  //
  if (e.nRound >= 2 && e.nPartnersSuit === Suit.NoTrump) {
    if (e.nPreviousSuit !== Suit.NoTrump)
      status?.stream(
        `BXPNTA! Partner bid Notrump, indicating a dislike for our ${e.szPVSS} suit.\n`,
      );

    if (e.nPartnersBid - e.nPreviousBid > 5) {
      let fAllowance: number;
      const nEarlierSuit = e.getOwnPriorSuit(1);
      if (
        e.conventions.isOptionEnabled(BiddingOption.StructuredReverses) &&
        isSuit(e.nPreviousSuit) &&
        isSuit(nEarlierSuit) &&
        e.nPreviousSuit > nEarlierSuit &&
        e.nPreviousBidLevel === 2
      ) {
        fAllowance = PTS_GAME - 17;
      } else if (e.nFirstRoundBidLevel === 2) {
        if (
          e.nFirstRoundBid === Bid.C2 &&
          e.conventions.isConventionEnabled(ConventionId.Artificial2Club)
        )
          fAllowance = PTS_GAME - e.conventions.getValue(BiddingOption.TwoClubOpeningPoints);
        else if (e.conventions.isConventionEnabled(ConventionId.WeakTwoBids))
          fAllowance = PTS_GAME - 6;
        else
          fAllowance = PTS_GAME - e.conventions.getValue(BiddingOption.TwoClubOpeningPoints);
      } else {
        fAllowance = PTS_GAME - 12;
      }
      e.m_fPartnersMin = Math.max(e.m_fPartnersMin, fAllowance);
      e.m_fPartnersMax = Math.max(22, 31 - fAllowance);
      e.m_fMinTPPoints = e.fAdjPts + e.m_fPartnersMin;
      e.m_fMaxTPPoints = e.fAdjPts + e.m_fPartnersMax;
      status?.stream(
        `BXPNTJ! Partner jumped to a bid of ${e.szPB} over our ${e.szPVB}, indicating ${e.m_fPartnersMin}-${e.m_fPartnersMax} points.\n`,
      );
    }

    if (isSuit(e.nPrefSuit) && e.hand!.isSuitSelfSupporting(e.nPrefSuit) && e.nPreviousSuit !== Suit.NoTrump) {
      status?.stream(
        `BXPNT0! Partner prefers NoTrump, but we want to insist on our self-supporting ${Card.suitToSingularString(e.nPrefSuit)} suit.\n`,
      );
      if (e.m_fMinTPPoints < PTS_SLAM) {
        if (
          isMajor(e.nPrefSuit) &&
          e.m_fMinTPPoints >= PTS_GAME + 1 &&
          e.nPartnersBid < e.getGameBid(e.nPrefSuit)
        ) {
          e.m_nBid = e.getGameBid(e.nPrefSuit);
          status?.stream(`BXPNT1! So we jump with it to game at ${bidToFullString(e.m_nBid)}.\n`);
        } else if (
          (e.nPartnersBidLevel === 2 && e.m_fMinTPPoints >= PTS_GAME - 3) ||
          (e.nPartnersBidLevel === 3 && e.m_fMinTPPoints >= PTS_GAME)
        ) {
          e.m_nBid = e.getCheapestShiftBid(e.nPrefSuit);
          status?.stream(`BXPNT2! So we rebid it at ${bidToFullString(e.m_nBid)}.\n`);
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream('BXPNT3! But without enough points to press the issue, we have to pass.\n');
        }
        return e.validateBid(e.m_nBid);
      } else {
        e.invokeBlackwood(e.nPrefSuit);
        return e.validateBid(e.m_nBid);
      }
    }

    if (e.bSemiBalanced || e.numVoids === 0) {
      if (
        e.nPreviousSuit === Suit.NoTrump &&
        e.nPartnersSuit === Suit.NoTrump &&
        (e.nPartnersBidLevel === 4 || e.nPartnersBidLevel === 5)
      ) {
        status?.stream(
          `BXPNTI! Partner made an invitational NT Raise to ${e.szPB}, inviting us to${e.nPartnersBidLevel === 4 ? ' ' : ' a grand '}slam with a maximum.\n`,
        );
        if (e.m_fMinTPCPoints >= PTS_SLAM) {
          if (e.nPartnersBidLevel === 5) {
            status?.stream(
              `BXPNTI0! And with a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} total HCPs, try for the grand slam.\n`,
            );
            e.m_nBid = Bid.NT7;
          } else {
            status?.stream(
              `BXPNTI1! And with a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} total HCPs, try for the slam.\n`,
            );
            e.m_nBid = Bid.NT6;
          }
        } else {
          if (e.nPartnersBidLevel === 5) {
            status?.stream(
              `BXPNTI5! But with a total of only ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} total HCPs, we have to settle for the small slam.\n`,
            );
            e.m_nBid = Bid.NT6;
          } else {
            status?.stream(
              `BXPNTI6! But with a total of only ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} total HCPs, we have to pass on the slam.\n`,
            );
            e.m_nBid = Bid.Pass;
          }
        }
        return e.validateBid(e.m_nBid);
      }

      if (e.bBalanced && e.m_fMinTPCPoints < PTS_SLAM) {
        status?.stream(
          `BXPNTK! With a balanced hand and ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} total HCPs, sign off on partner's ${e.szPB} contract.\n`,
        );
        e.m_nBid = Bid.Pass;
        return e.validateBid(e.m_nBid);
      }

      if (!e.bBalanced && e.nPreviousSuit !== Suit.NoTrump && e.nPartnersBidLevel < 3)
        status?.stream(`BXPNT4! Partner's ${e.szPB} bid indicates a preference for NoTrump.\n`);

      if (e.bidNoTrumpEngine(2, PTS_GAME - 3, PTS_GAME - 1, true, StoppedCode.DontCare))
        return e.validateBid(e.m_nBid);
      if (e.bidNoTrumpEngine(3, PTS_GAME, PTS_SLAM - 1, true, StoppedCode.DontCare))
        return e.validateBid(e.m_nBid);
      if (e.bidNoTrumpEngine(6, PTS_SLAM, PTS_GRAND_SLAM, true, StoppedCode.DontCare))
        return e.validateBid(e.m_nBid);
      if (e.bidNoTrumpEngine(7, PTS_GRAND_SLAM, 0, true, StoppedCode.DontCare))
        return e.validateBid(e.m_nBid);

      e.m_nBid = Bid.Pass;
      status?.stream(
        `BXPNT5! With a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} / ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership, we lack adequate strength for a further raise beyond partner's ${e.szPB} bid, so we have to pass.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.numPrefSuitCards >= 6) {
      if (
        e.rebidSuitEngine(
          SuitType.Preferred,
          RebidTarget.At3,
          PTS_GAME - 3,
          PTS_GAME - 1,
          SuitLength.Six,
          SuitStrength.Strong,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.rebidSuitEngine(
          SuitType.Major,
          RebidTarget.At4,
          PTS_GAME,
          PTS_SLAM - 1,
          SuitLength.Six,
          SuitStrength.Strong | SuitStrength.Solid,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.rebidSuitEngine(
          SuitType.Minor,
          RebidTarget.At4,
          PTS_MINOR_GAME - 3,
          PTS_MINOR_GAME,
          SuitLength.Seven,
          SuitStrength.Strong | SuitStrength.Solid,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.rebidSuitEngine(
          SuitType.Minor,
          RebidTarget.At5,
          PTS_MINOR_GAME + 1,
          PTS_SLAM - 1,
          SuitLength.Seven,
          SuitStrength.Strong | SuitStrength.Solid,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.rebidSuitEngine(
          SuitType.Preferred,
          RebidTarget.At6,
          PTS_SLAM,
          PTS_GRAND_SLAM - 1,
          SuitLength.Six,
          SuitStrength.Strong | SuitStrength.Solid,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.rebidSuitEngine(
          SuitType.Preferred,
          RebidTarget.At7,
          PTS_GRAND_SLAM,
          0,
          SuitLength.Six,
          SuitStrength.Strong | SuitStrength.Solid,
        )
      )
        return e.validateBid(e.m_nBid);
    }

    if (e.nPartnersPrevSuit !== Suit.NoTrump) {
      if (e.raisePartnersSuitEngine(SuitType.Prev, RaiseTarget.To3, PTS_GAME - 3, PTS_GAME - 1, SupportLength.Len3))
        return e.validateBid(e.m_nBid);
      if (e.raisePartnersSuitEngine(SuitType.PrevMajor, RaiseTarget.ToGame, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3))
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(
          SuitType.PrevMinor,
          RaiseTarget.To4,
          PTS_MINOR_GAME - 3,
          PTS_MINOR_GAME - 1,
          SupportLength.Len3,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(
          SuitType.PrevMinor,
          RaiseTarget.ToGame,
          PTS_MINOR_GAME,
          PTS_SLAM - 1,
          SupportLength.Len4,
        )
      )
        return e.validateBid(e.m_nBid);
      if (
        e.raisePartnersSuitEngine(SuitType.Prev, RaiseTarget.To6, PTS_SLAM, PTS_GRAND_SLAM - 1, SupportLength.Len3)
      )
        return e.validateBid(e.m_nBid);
      if (e.raisePartnersSuitEngine(SuitType.Prev, RaiseTarget.To7, PTS_GRAND_SLAM, 0, SupportLength.Len3))
        return e.validateBid(e.m_nBid);
    }

    if (e.bidNoTrumpEngine(2, PTS_NT_GAME - 2, PTS_NT_GAME, false, StoppedCode.DontCare, NONE, false))
      return e.validateBid(e.m_nBid);
    if (e.bidNoTrumpEngine(3, PTS_NT_GAME + 1, PTS_SLAM - 1, false, StoppedCode.DontCare, NONE, false))
      return e.validateBid(e.m_nBid);

    e.m_nBid = Bid.Pass;
    status?.stream(
      `BXPNTZ! With a total of ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} / ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} pts in the partnership and no better options, we find it best to pass.\n`,
    );
    return e.validateBid(e.m_nBid);
  }

  //
  //==========================================================
  //
  // Rebidding in general, stages 5,6 or later
  //
  if (e.nRound >= 2) {
    if (e.m_fMinTPPoints >= PTS_SLAM) {
      let nSuit: Suit;
      if (e.nPartnersSuit === e.nPreviousSuit && isSuit(e.nPreviousSuit)) {
        status?.stream(
          `2BXM05! Partner raised the ${e.szPSS} suit to ${e.nPartnersBidLevel >= 6 ? 'slam at ' : e.nPartnersBid >= e.getGameBid(e.nPreviousSuit) ? 'game at ' : ' '}${e.szPB}.\n`,
        );
        nSuit = e.nPreviousSuit;
        e.m_nAgreedSuit = nSuit;
      } else if (e.nPartnersSuit === (e.nNextPrevBid as number) && isSuit(e.nPartnersSuit)) {
        // Note: C++ original line 1416 compares nPartnersSuit == nNextPrevBid
        nSuit = e.nPartnersSuit;
        e.m_nAgreedSuit = nSuit;
      } else {
        if (e.numPrefSuitCards >= 7 && e.nPrefSuitStrength >= SuitStrength.Strong && isSuit(e.nPrefSuit)) {
          status?.stream(
            `2BXM10! With no strong agreement in suits but with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points and a ${e.numPrefSuitCards} card ${e.szPrefSS} suit, we want a contract in our ${e.szPrefS} suit.\n`,
          );
          nSuit = e.nPrefSuit;
        } else if (
          (e.numSupportCards >= 2 || e.nPPrevSuitSupport >= 2) &&
          isSuit(e.nPartnersSuit) &&
          isSuit(e.nPartnersPrevSuit)
        ) {
          nSuit = e.pickSuperiorSuit(e.nPartnersSuit, e.nPartnersPrevSuit);
          status?.stream(
            `2BXM11! We have no strong agreement in suits and don't have a very strong suit, but do have ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, so we want a slam in partner's ${Card.suitToSingularString(nSuit)} suit.\n`,
          );
        } else {
          status?.stream(
            `2BXM12! We have no strong agreement in suits and don't have a very strong suit or support for either of partner's suits, but have ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, so we want a slam in notrump.\n`,
          );
          nSuit = Suit.NoTrump;
        }
      }

      if (e.nPartnersBidLevel < 5) {
        e.invokeBlackwood(nSuit);
      } else if (e.nPartnersBidLevel < 6) {
        e.m_nBid = makeBid(nSuit, e.m_fMinTPPoints >= PTS_GRAND_SLAM ? 7 : 6);
        status?.stream(
          `BXM18! We would like a slam, but since the bidding has gotten too high for Blackwood, bid slam directly at ${bidToFullString(e.m_nBid)}.\n`,
        );
      } else if (e.nPartnersBidLevel === 6) {
        if (e.m_fMinTPPoints <= PTS_GRAND_SLAM) {
          if (nSuit > e.nPartnersSuit) {
            e.m_nBid = makeBid(nSuit, 6);
            status?.stream(
              `BXM20! Partner has bid a small slam in ${e.szPS}, but it's the wrong suit for us, so we correct it to the desired ${bidToFullString(e.m_nBid)}.\n`,
            );
          } else {
            e.m_nBid = Bid.Pass;
            status?.stream(
              `BXM21! And partner has bid a small slam, and with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we're satisfied with the bid, so pass.\n`,
            );
          }
        } else {
          e.m_nBid = makeBid(nSuit, 7);
          status?.stream(
            `BXM24! Partner has bid a small slam, and with ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we boldly raise to ${bidToFullString(e.m_nBid)}.\n`,
          );
        }
      } else {
        if (nSuit > e.nPartnersSuit) {
          e.m_nBid = makeBid(nSuit, 7);
          status?.stream(
            `BXM26! Partner has bid a grand slam in ${e.szPS}, but it's the wrong suit for us, so we correct it to the desired ${bidToFullString(e.m_nBid)}.\n`,
          );
        } else {
          e.m_nBid = Bid.Pass;
          status?.stream('BXM27! Partner has bid a grand slam, so pass and hope for the best.\n');
        }
      }
      return e.validateBid(e.m_nBid);
    }

    // with < 33 points
    if (
      (e.nPartnersSuit === e.nPrefSuit ||
        e.nPartnersSuit === e.nNextPrevSuit ||
        e.nPartnersSuit === e.nPreviousSuit) &&
      e.nPreviousBid !== Bid.C2 &&
      isSuit(e.nPartnersSuit)
    ) {
      let nSuit: Suit;
      if (e.nPartnersSuit === e.nPrefSuit) nSuit = e.nPrefSuit;
      else if (e.nPartnersSuit === e.nNextPrevSuit) nSuit = e.nNextPrevSuit;
      else nSuit = e.nPreviousSuit as Suit;

      if (isMajor(nSuit) && e.m_fMinTPPoints >= PTS_GAME && e.nPartnersBidLevel < 4) {
        e.m_nBid = makeBid(nSuit, 4);
        status?.stream(
          `BXM30! Since partner raised our major ${e.szPrefSS} suit, and we have a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we can go to game at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      } else if (isMinor(nSuit) && e.m_fMinTPPoints >= PTS_MINOR_GAME && e.nPartnersBidLevel < 5) {
        e.m_nBid = makeBid(nSuit, 5);
        status?.stream(
          `BXM32! Since partner raised our major ${e.szPrefSS} suit, and we have a total of ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, we can go to game at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    if (
      isSuit(e.nPrefSuit) &&
      isMajor(e.nPrefSuit) &&
      e.numPrefSuitCards >= 6 &&
      e.m_fMinTPPoints >= PTS_GAME + 1 &&
      e.nPartnersBid < makeBid(e.nPrefSuit, 4)
    ) {
      e.m_nBid = makeBid(e.nPrefSuit, 4);
      status?.stream(
        `BXM36! Regradless of partner's actions, we have ${e.numPrefSuitCards} strong ${e.szPrefS} and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, so bid game at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (
      isSuit(e.nPrefSuit) &&
      isMinor(e.nPrefSuit) &&
      e.numPrefSuitCards >= 6 &&
      e.m_fMinTPPoints >= PTS_MINOR_GAME + 1 &&
      e.nPartnersBid < makeBid(e.nPrefSuit, 5)
    ) {
      // Note: C++ original line 1544 bids level 4 here
      e.m_nBid = makeBid(e.nPrefSuit, 4);
      status?.stream(
        `BXM38! Regradless of partner's actions, we have ${e.numPrefSuitCards}strong ${e.szPrefS} and ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} points in the partnership, so bid game at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (isSuit(e.nPrefSuit)) {
      const nBid = e.getCheapestShiftBid(e.nPrefSuit);
      const nLevel = bidLevel(nBid);
      if (e.numPrefSuitCards >= 7 && e.m_fMinTPPoints >= PTS_GAME - 4 && nLevel <= 3) {
        e.m_nBid = nBid;
        status?.stream(
          `BXM40! With a ${e.numPrefSuitCards}-card ${e.szPrefSS} suit, insist on rebidding it at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }

      if (e.numPrefSuitCards >= 8 && e.m_fMinTPPoints >= PTS_GAME - 2 && nLevel <= 4) {
        e.m_nBid = nBid;
        status?.stream(
          `BXM44! With a ${e.numPrefSuitCards}-card ${e.szPrefSS} suit, insist on rebidding it at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To3, PTS_GAME - 4, 99, SupportLength.Len2)) {
      status?.stream(
        `BXM48! With ${e.numSupportCards}-card support for partner's ${e.szPSS} suit, raise it to the 3-level at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
    if (e.raisePartnersSuitEngine(SuitType.Prev, RaiseTarget.To3, PTS_GAME - 4, 99, SupportLength.Len2)) {
      status?.stream(
        `BXM52! With ${e.numSupportCards}-card support for partner's previous suit (${e.szPPS}), raise it to the 3-level at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To4, PTS_GAME, 99, SupportLength.Len2)) {
      status?.stream(
        `BXM60! With ${e.numSupportCards}-card support for partner's ${e.szPSS} suit, raise it to the 4-level at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }
    if (e.raisePartnersSuitEngine(SuitType.Prev, RaiseTarget.To4, PTS_GAME, 99, SupportLength.Len2)) {
      status?.stream(
        `BXM64! With ${e.numSupportCards}-card support for partner's previous suit (${e.szPPS}), raise it to the 4-level at ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    if (e.numSupportCards === 0) {
      if (
        e.nPartnersBidLevel <= 3 &&
        e.nPartnersSuit !== Suit.NoTrump &&
        (e.m_fMinTPCPoints >= PTS_GAME || e.m_fMinTPPoints >= PTS_GAME + 1)
      ) {
        e.m_nBid = Bid.NT3;
        status?.stream(
          `BXM68! With zero trump support for partner's ${e.szPSS} suit, bail out at ${bidToFullString(e.m_nBid)}.\n`,
        );
        return e.validateBid(e.m_nBid);
      }
    }

    if (
      e.nRound >= 2 &&
      e.nPartnersSuit !== e.nPartnersPrevSuit &&
      e.nPartnersSuit !== e.nPreviousSuit &&
      e.nPartnersSuit !== e.nNextPrevSuit &&
      e.nPartnersBid < Bid.NT3
    ) {
      e.m_nBid = Bid.NT3;
      status?.stream(
        `BXM70! Partner switched suits again, which forces us to bid again -- so with no other good options, bid ${bidToFullString(e.m_nBid)}.\n`,
      );
      return e.validateBid(e.m_nBid);
    }

    e.m_nBid = Bid.Pass;
    if (e.nPartnersSuit !== e.nPreviousSuit && e.nPartnersSuit !== e.nNextPrevSuit)
      status?.stream(
        `BXM80! With no agreement in suits, ${e.m_fMinTPCPoints}-${e.m_fMaxTPCPoints} / ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} partnership points, and no good alternatives, pass.\n`,
      );
    else
      status?.stream(
        `BXM81! We've reached agreement in suits, but with only ${e.m_fMinTPPoints}-${e.m_fMaxTPPoints} total points we can't raise partner's ${e.szPB} bid any further, so pass.\n`,
      );
    return e.validateBid(e.m_nBid);
  }

  //
  //===============================================================
  //
  // Here, reached an unknown state
  //
  e.m_nBid = Bid.Pass;
  status?.stream("BXZ40! Partner made a response which we don't understand; simply pass.\n");
  return e.validateBid(e.m_nBid);
}
