//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// ShutoutBidsConvention.cpp -> shutoutBidsConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidToFullString,
  isMajor,
  isMinor,
  isSuit,
  makeBid,
  Suit,
} from '../../constants.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_GAME, PTS_MINOR_GAME, PTS_SLAM, SuitStrength } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class ShutoutBidsConvention extends Convention {
  constructor() {
    super(ConventionId.ShutoutBids);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    const { hand, status } = context;

    if (!bidState) {
      if (hand.highCardPoints > 12) return null;
      for (const suit of [Suit.Hearts, Suit.Spades, Suit.Diamonds, Suit.Clubs]) {
        if (hand.getSuitLength(suit) >= 7) return makeBid(suit, 3);
      }
      return null;
    }

    if (bidState.nLastValidRecordedBid !== Bid.Pass) return null;
    if (hand.getNumSuitsOfAtLeast(6) < 1) return null;

    const nSuit = hand.preferredSuit;
    if (!isSuit(nSuit)) return null;
    const suit = hand.getSuit(nSuit);
    const numCards = suit.length;
    const numHonors = suit.numHonors;

    if ((numCards === 6 && numHonors < 3) || (numCards >= 7 && numHonors < 2)) {
      return null;
    }

    for (let i = 0; i < 4; i++) {
      if (i === nSuit) continue;
      const otherSuit = hand.getSuit(i as Suit);
      if (otherSuit.hasAce() || otherSuit.hasKing()) return null;
    }

    let nBid: Bid | null = null;
    if (bidState.numCardsInSuit[nSuit] >= 8) {
      nBid = makeBid(nSuit, 4);
      status.stream(
        `D00! Have a ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit with no tricks outside the suit, so make a shutout bid of ${bidToFullString(nBid)}.\n`,
      );
    } else if (bidState.numCardsInSuit[nSuit] >= 7) {
      nBid = makeBid(nSuit, 3);
      status.stream(
        `D04! Have a ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit with no tricks outside the suit, so make a shutout bid of ${bidToFullString(nBid)}.\n`,
      );
    }
    if (nBid === null) return null;

    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return nBid;
  }

  //
  // RespondToConvention()
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    if (bidState.getActiveConvention()) return null;

    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;

    if (
      nPartnersBidLevel >= 3 &&
      nPartnersBidLevel <= 5 &&
      bidState.m_numPartnerBidsMade === 1 &&
      isSuit(nPartnersSuit) &&
      bidState.m_bPartnerOpenedForTeam
    ) {
      // met requirements
    } else {
      return null;
    }

    bidState.m_fPartnersMin = bidState.openPts(6);
    bidState.m_fPartnersMax = bidState.openPts(9);
    status.stream(
      `SHUTR0! Partner made a preemptive ${bidState.szPB} bid, showing a ${nPartnersBidLevel === 3 ? 7 : nPartnersBidLevel === 4 ? 8 : 9}-card ${bidState.szPSS} suit with no tricks outside the suit, and most likely ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} points.\n`,
    );

    const fPts = bidState.fPts;
    const fAdjPts = bidState.fAdjPts;
    const fCardPts = bidState.fCardPts;
    bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

    const numSupportCards = bidState.numSupportCards;
    const nPartnersSuitSupport = bidState.nPartnersSuitSupport;
    const numQuickTricks = bidState.numQuickTricks;
    const numLikelyWinners = bidState.numLikelyWinners;
    const fMinTPPoints = bidState.m_fMinTPPoints;
    const fMaxTPPoints = bidState.m_fMaxTPPoints;
    let nBid: Bid;

    if (
      nPartnersBidLevel === 3 &&
      isMajor(nPartnersSuit) &&
      numSupportCards >= 4 &&
      numQuickTricks >= 2 &&
      numLikelyWinners >= 5 &&
      fMinTPPoints >= PTS_GAME
    ) {
      nBid = makeBid(nPartnersSuit, 4);
      status.stream(
        `SHUTR2! We have ${fCardPts}/${fPts}/${fAdjPts} points in hand, for a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, strong support for partner's long ${bidState.szPSS} suit (holding ${bidState.szHP}), plus ${numQuickTricks} QTs and ${numLikelyWinners} likely winners, so we can safely bid game at ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    if (
      nPartnersBidLevel <= 4 &&
      isMinor(nPartnersSuit) &&
      numSupportCards >= 5 &&
      numQuickTricks >= 2 &&
      numLikelyWinners >= 6 &&
      fMinTPPoints >= PTS_MINOR_GAME
    ) {
      nBid = makeBid(nPartnersSuit, 5);
      status.stream(
        `SHUTR4! We have ${fCardPts}/${fPts}/${fAdjPts} points in hand, for a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, strong support for partner's long ${bidState.szPSS} suit (holding ${bidState.szHP}), plus ${numQuickTricks} QTs and ${numLikelyWinners} likely winners, so we can safely bid a minor game at ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    if (
      nPartnersBidLevel < 5 &&
      nPartnersSuitSupport >= SuitStrength.GoodSupport &&
      numQuickTricks >= 4 &&
      fMinTPPoints >= PTS_SLAM
    ) {
      nBid = makeBid(nPartnersSuit, 6);
      status.stream(
        `SHUTR6! We have ${fCardPts}/${fPts}/${fAdjPts} points in hand, for a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, ${bidState.supportLevelToString(nPartnersSuit)} support for partner's long ${bidState.szPSS} suit (holding ${bidState.szHP}), plus ${numQuickTricks} QTs, so we can safely bid a slam at ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    nBid = Bid.Pass;
    status.stream(
      `SHUTR9! With ${fCardPts}/${fPts}/${fAdjPts} points in hand, for a total of ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, holding ${bidState.szHP} in support of partner's ${bidState.szPSS} suit, and with only ${numQuickTricks} QTs and ${numLikelyWinners} likely winners, we have no real reason to bid anything, so just pass.\n`,
    );
    bidState.setBid(nBid);
    return nBid;
  }

  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    if (bidState.getConventionStatus(this) !== ConventionStatus.Invoked) return null;
    return null;
  }
}
