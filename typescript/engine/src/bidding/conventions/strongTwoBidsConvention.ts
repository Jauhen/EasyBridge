//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// StrongTwoBidsConvention.cpp -> strongTwoBidsConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidToFullString,
  isMajor,
  isSuit,
  makeBid,
  Suit,
} from '../../constants.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { OT_STRONG, PTS_NT_GAME, SUITS_ANY, SuitStrength } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class StrongTwoBidsConvention extends Convention {
  constructor() {
    super(ConventionId.StrongTwoBids);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    const { hand, status } = context;

    if (!bidState) {
      if (hand.highCardPoints < 20) return null;
      context.bidContext.status = ConventionStatus.Invoked;
      return Bid.C2;
    }

    if (bidState.nLastValidRecordedBid !== Bid.Pass) return null;

    if (
      (bidState.numAbsoluteSuits >= 1 || bidState.numSolidSuits >= 2) &&
      bidState.numLikelyWinners >= 9 &&
      bidState.numQuickTricks >= 4 &&
      bidState.fCardPts >= 16
    ) {
      const fPts = bidState.fPts;
      const fCardPts = bidState.fCardPts;
      let nBid = bidState.getLowestOpenableBid(SUITS_ANY, OT_STRONG, 2);
      if (
        nBid === Bid.C2 &&
        bidState.conventions.isConventionEnabled(ConventionId.Artificial2Club)
      ) {
        const nextBestSuit = bidState.nPrefSuitList[1] as Suit;
        if (isSuit(nextBestSuit) && bidState.nSuitStrength[nextBestSuit] >= SuitStrength.Strong) {
          nBid = makeBid(nextBestSuit, 2);
          status.stream(
            `STR2C1! Have a strong Club suit and ${fPts} points, but can't open at 2 Club, so we'll have to bid ${Card.suitToString(nextBestSuit)} instead.\n`,
          );
        } else {
          status.stream(
            `STR2C2! Have a strong Club suit and no others, but can't open 2C with only ${fCardPts} HCPs, so bid ${bidToFullString(nBid)} instead.\n`,
          );
          return null;
        }
      }

      if (bidState.numSolidSuits > 1) {
        status.stream(
          `STR2C10! Have ${bidState.numSolidSuits} solid ${bidState.numSolidSuits > 1 ? 'suits' : 'suit'} with ${bidState.numLikelyWinners} playing tricks and ${bidState.numQuickTricks} quick tricks, so bid a strong ${bidToFullString(nBid)}.\n`,
        );
      } else {
        status.stream(
          `STR2C12! Have a solid ${isSuit(bidState.nPrefSuit) ? Card.suitToSingularString(bidState.nPrefSuit) : ''} suit with ${bidState.numLikelyWinners} playing tricks and ${bidState.numQuickTricks} quick tricks, so bid a strong ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      return nBid;
    }
    return null;
  }

  //
  // RespondToConvention()
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    if (bidState.getActiveConvention()) return null;

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersSuitSupport = bidState.nPartnersSuitSupport;
    const numPartnerBidsMade = bidState.m_numPartnerBidsMade;

    if (
      nPartnersBidLevel === 2 &&
      nPartnersBid !== Bid.C2 &&
      bidState.m_bPartnerOpenedForTeam &&
      numPartnerBidsMade === 1 &&
      nPartnersBid === bidState.getValidBidRecord(0) &&
      isSuit(nPartnersSuit)
    ) {
      // met requirements
    } else {
      return null;
    }

    let nBid: Bid;
    const fAdjPts = bidState.fAdjPts;
    const fCardPts = bidState.fCardPts;
    const nPrefSuit = bidState.nPrefSuit as Suit;
    const numPrefSuitCards = bidState.numPrefSuitCards;
    const numQuickTricks = bidState.numQuickTricks;

    bidState.m_fPartnersMin = 16;
    bidState.m_fPartnersMax = 22;
    status.stream(
      'RSTRT! Partner made a strong 2-bid, showing a very good suit or two solid suits, 9+ playing tricks, and 4+ quick tricks.  We have to respond positively if interested in slam, or negatively otherwise.\n',
    );

    bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;
    bidState.m_bGameForceActive = true;

    if (numQuickTricks < 1.0) {
      nBid = Bid.NT2;
      status.stream(
        `RSTRT10! But with only ${numQuickTricks} QT's, we have to make the negative response of ${bidToFullString(nBid)} to deny slam values.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    status.stream(`2RSTRT20! We have ${numQuickTricks} QT's, so we can make a positive response.\n`);

    if (nPartnersSuitSupport >= SuitStrength.WeakSupport) {
      nBid = makeBid(nPartnersSuit, 3);
      status.stream(
        `RSTRT22! And we have ${bidState.supportLevelToString(nPartnersSuit)} support for partner's long ${bidState.szPSS} suit (holding ${bidState.szHP}), so raise partner's bid to ${bidToFullString(nBid)}.\n`,
      );
    } else if (
      nPrefSuit !== nPartnersSuit &&
      bidState.nPrefSuitStrength >= SuitStrength.Openable &&
      numPrefSuitCards >= 5
    ) {
      const nSuit = nPrefSuit;
      if (bidState.nPrefSuitStrength >= SuitStrength.Absolute) {
        nBid = bidState.getJumpShiftBid(nSuit, nPartnersBid);
        status.stream(
          `RSTRT24! We lack good support for partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), but we have an excellent ${bidState.numCardsInSuit[nSuit]}-card suit of our own in ${Card.suitToString(nSuit)} (holding ${bidState.suitHoldingsToString(nSuit)}), so show it in a bid of ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = bidState.getCheapestShiftBid(nSuit);
        status.stream(
          `RSTRT26! But we lack good support for partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), so show our preferred ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit in a bid of ${bidToFullString(nBid)}.\n`,
        );
      }
    } else if (bidState.bBalanced && bidState.m_fMinTPCPoints >= 26) {
      nBid = Bid.NT3;
      status.stream(
        `RSTRT28! But we lack good support for partner's ${bidState.szPSS} suit (holding ${bidState.szHP}) with a balanced hand, so jump to ${bidToFullString(nBid)}.\n`,
      );
    } else {
      nBid = Bid.NT2;
      status.stream(
        `RSTRT40! But unfortunately we have poor support for partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), no good suit of our own, and an unbalanced hand, so we have to make the negative response of ${bidToFullString(nBid)}.\n`,
      );
    }

    bidState.setBid(nBid);
    return nBid;
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
    bidState.clearConventionStatus(this);

    let nBid: Bid = Bid.Pass;
    const fAdjPts = bidState.fAdjPts;
    const fCardPts = bidState.fCardPts;
    const nPrefSuit = bidState.nPrefSuit as Suit;
    const nPreviousSuit = bidState.nPreviousSuit as Suit;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersSuitSupport = bidState.nPartnersSuitSupport;
    const bBalanced = bidState.bBalanced;

    if (nPartnersBid === Bid.NT2) {
      status.stream(
        `2S2Rb0! After our strong ${bidState.szPVB} opening bid, partner's 2NT bid is a negative response, denying slam values (less than 1 Quick Trick).\n`,
      );

      bidState.m_fPartnersMin = 0;
      bidState.m_fPartnersMax = 6;
      bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
      bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

      if (bBalanced && bidState.m_fMinTPCPoints >= PTS_NT_GAME) {
        nBid = Bid.NT3;
        status.stream(
          `S2RB1! With a balanced distribution and ${fCardPts} HCPs in hand, rebid ${bidToFullString(nBid)}.\n`,
        );
      }
      if (bidState.numPreferredSuits > 0) {
        const nSuit = bidState.getRebidSuit(nPreviousSuit);
        if (isSuit(nSuit)) {
          nBid = bidState.getCheapestShiftBid(nSuit);
          status.stream(
            `S2RB4! With a good second suit in ${Card.suitToString(nSuit)}, show it in a rebid of ${bidToFullString(nBid)}.\n`,
          );
        }
      }
      if (bidState.nPreviousBid === Bid.C2) {
        nBid = bidState.getCheapestShiftBid(nPrefSuit);
        status.stream(
          `S2RB6! With no other good suits, go ahead and bid our ${bidState.szPrefS} suit at ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = bidState.getCheapestShiftBid(nPreviousSuit);
        status.stream(
          `B3E32! With no other good suits, go ahead and rebid our ${bidState.szPVSS} suit at ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      return nBid;
    }

    status.stream(
      `2S2Rb20! After our strong ${bidState.szPVB} opening bid, partner's ${bidState.szPB} bid was a positive response, indicating 1+ Quick Tricks.\n`,
    );

    bidState.m_fPartnersMin = 3;
    bidState.m_fPartnersMax = Math.min(22, 40 - fCardPts);
    bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

    if (bBalanced) {
      nBid = Bid.NT3;
      status.stream(`With a balanced hand, bid game at ${bidToFullString(nBid)}.\n`);
    }
    if (nPreviousSuit === nPartnersSuit && bidState.nLastBid !== Bid.C2 && isSuit(nPartnersSuit)) {
      status.stream(
        `S2RB24! Partner's encouraging raise to ${bidState.szPB} indicates 1+ Quick Tricks and slam possibilities.\n`,
      );
      bidState.invokeBlackwood(nPartnersSuit);
      return bidState.m_nBid;
    }
    if (nPartnersSuitSupport >= SuitStrength.GoodSupport && isSuit(nPartnersSuit)) {
      if (isMajor(nPartnersSuit)) {
        bidState.m_nAgreedSuit = nPartnersSuit;
        nBid = makeBid(nPartnersSuit, nPartnersBidLevel + 2);
        status.stream(
          `S2RB28! With ${bidState.supportLevelToString(nPartnersSuit)} support for partner's ${bidState.szPS} (holding ${bidState.szHP}), go ahead and jump raise to ${bidToFullString(nBid)}.\n`,
        );
      } else {
        status.stream(
          `S2RB32! We have ${bidState.supportLevelToString(nPartnersSuit)} support for partner's ${bidState.szPS} (holding ${bidState.szHP}).\n`,
        );
        bidState.invokeBlackwood(nPartnersSuit);
        return bidState.m_nBid;
      }
    }

    if (bidState.numPreferredSuits > 1) {
      const nSuit = bidState.getRebidSuit(nPreviousSuit);
      if (isSuit(nSuit)) {
        nBid = bidState.getCheapestShiftBid(nSuit);
        status.stream(
          `S2RB36! But we don't like partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), and we hold a good second suit in ${Card.suitToString(nSuit)}, so show it in a rebid of ${bidToFullString(nBid)}.\n`,
        );
      }
    }
    if (bidState.nPreviousBid === Bid.C2) {
      nBid = bidState.getCheapestShiftBid(nPrefSuit);
      status.stream(
        `S2RB44! But we don't like partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), so bid our own ${bidState.szPrefS} suit at ${bidToFullString(nBid)}.\n`,
      );
    } else {
      nBid = bidState.getCheapestShiftBid(nPreviousSuit);
      status.stream(
        `S2RB50! But we don't like partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), so rebid our own ${bidState.szPVSS} suit at ${bidToFullString(nBid)}.\n`,
      );
    }

    bidState.setBid(nBid);
    return nBid;
  }
}
