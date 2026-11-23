//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CueBidConvention.cpp -> cueBidConvention.ts
//

import { Card } from '../../card.js';
import {
  ACE,
  Bid,
  bidLevel,
  bidSuit,
  bidToFullString,
  isMajor,
  isMinor,
  isSuit,
  KING,
  makeBid,
  NONE,
  Suit,
} from '../../constants.js';
import { Hand, REVALUE_DECLARER } from '../../hand.js';
import { PlayerStatus } from '../../playerStatus.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_SLAM, SuitStrength } from '../bidParameters.js';
import { ConventionContext } from '../convention.js';
import { SlamConvention } from '../slamConvention.js';
import type { BidEngine } from '../bidEngine.js';

function getNextSuit(suit: Suit): Suit {
  return ((suit + 1) % 4) as Suit;
}

export class CueBidConvention extends SlamConvention {
  constructor() {
    super(ConventionId.CueBids);
  }

  override applyTest(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;

    if (this.checkForOtherConventions(context.bidContext, bidState)) return null;

    if (this.tryCueBid(context.hand, bidState, context.status)) {
      return bidState.m_nBid;
    }
    const resp = this.respondToConvention(context);
    if (resp !== null) return resp;
    const handle = this.handleConventionResponse(context);
    if (handle !== null) return handle;
    return null;
  }

  //
  // TryCueBid()
  //
  tryCueBid(hand: Hand, bidState: BidEngine, status: PlayerStatus | null): boolean {
    if (bidState.m_nAgreedSuit === NONE || !isSuit(bidState.m_nAgreedSuit)) return false;

    const nStatus = bidState.getConventionStatus(this);
    if (nStatus !== ConventionStatus.Inactive) return false;

    bidState.fAdjPts = hand.revalueHand(REVALUE_DECLARER, bidState.m_nAgreedSuit, true);
    bidState.m_fMinTPPoints = bidState.fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = bidState.fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = bidState.fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = bidState.fCardPts + bidState.m_fPartnersMax;

    if (bidState.m_fMinTPPoints < 30) return false;
    if (bidState.numAces === 4) return false;
    if (bidState.nPartnersBidLevel >= 6) return false;

    const nLastBid = bidState.getLastValidBid();
    if (nLastBid >= bidState.getGameBid(bidSuit(nLastBid))) return false;

    if (
      bidState.nPartnersSuit === bidState.nPreviousSuit &&
      ((isSuit(bidState.m_nAgreedSuit) && bidState.nPreviousSuit !== bidState.m_nAgreedSuit) ||
        (isSuit(bidState.m_nIntendedSuit) && bidState.nPreviousSuit !== bidState.m_nIntendedSuit))
    ) {
      return false;
    }

    const nAgreedSuit = bidState.m_nAgreedSuit;
    const nSuit = this.getCheapestAce(hand, nAgreedSuit);
    if (isSuit(nSuit) && nSuit !== nAgreedSuit && nSuit !== bidState.nPartnersSuit) {
      let nBid = bidState.getCheapestShiftBid(nSuit);
      const nBidLevel = bidLevel(nBid);
      if ((isMajor(nAgreedSuit) && nBidLevel >= 5) || (isMinor(nAgreedSuit) && nBidLevel >= 6)) {
        return false;
      }
      if (
        (isMajor(nAgreedSuit) && nBid < makeBid(nAgreedSuit, 3)) ||
        (isMinor(nAgreedSuit) && nBid < makeBid(nAgreedSuit, 4))
      ) {
        nBid = (nBid + 5) as Bid;
      }
      if (nBid > bidState.getGameBid(nAgreedSuit)) return false;

      status?.stream(
        `CUET10! With ${bidState.m_fMinTPPoints}+ pts and possible slam aspirations, make a cue bid, showing the cheapest ace (${Card.suitToString(nSuit)}) with a bid of ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.InvokedRound1);
      return true;
    }
    return false;
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
    if (bidState.m_nAgreedSuit === NONE || !isSuit(bidState.m_nAgreedSuit)) return null;

    const nStatus = bidState.getConventionStatus(this);
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nAgreedSuit = bidState.m_nAgreedSuit;
    const nSupportLevel = bidState.nPartnersSuitSupport;
    let nBid: Bid;

    if (
      isSuit(nPartnersSuit) &&
      nPartnersSuit !== nAgreedSuit &&
      nPartnersBid > makeBid(nAgreedSuit, 3) &&
      nPartnersBid < bidState.getGameBid(nAgreedSuit)
    ) {
      status.stream(
        `CUR0! Partner made a cue bid of ${bidToFullString(nPartnersBid)}, hinting at slam prospects.\n`,
      );
    } else {
      return null;
    }

    if (bidState.m_fMinTPPoints >= 30) {
      status.stream(
        `2CUR1! And since we have ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints}+ points in the partnership, we want to respond favorably.\n`,
      );
    } else if (nSupportLevel >= SuitStrength.GoodSupport && bidState.m_fMinTPPoints >= 28) {
      status.stream(
        `2CUR2! And since we have ${bidState.supportLevelToString(nPartnersSuit)} trump support, ${bidState.m_fMinTPPoints >= 30 ? ' as well as ' : ' albeit only with '}${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, we want to respond favorably.\n`,
      );
    } else {
      nBid = bidState.getCheapestShiftBid(nAgreedSuit);
      status.stream(
        `CUR4! But we don't have the points (only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership) or the excellent trump support needed for a marginal slam, so we decline by returning to the agreed suit at a bid of ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    if (nStatus === ConventionStatus.Inactive) {
      const nSuit = this.getCheapestAce(hand, nPartnersSuit, nAgreedSuit);
      if (isSuit(nSuit) && nSuit !== nPartnersSuit && nSuit !== nAgreedSuit) {
        nBid = bidState.getCheapestShiftBid(nSuit);
        status.stream(
          `CUR20! Respond to partner's cue bid, showing our cheapest ace (${Card.suitToString(nSuit)}) with a bid of ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
        return nBid;
      } else {
        nBid = bidState.getCheapestShiftBid(nAgreedSuit);
        if (isSuit(nSuit) && hand.suitHasCard(nSuit, ACE)) {
          status.stream(
            `CUR22! But our only Ace is in the trump suit of ${Card.suitToSingularString(nAgreedSuit)}, so sign off at a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else {
          status.stream(
            `CUR24! We have no other Aces to offer, so sign off with the agreed ${Card.suitToSingularString(nAgreedSuit)} suit at a bid of ${bidToFullString(nBid)}.\n`,
          );
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      }
    } else if (nStatus === ConventionStatus.RespondedRound1) {
      const nSuit = this.getCheapestKingOrVoid(hand, nPartnersSuit, nAgreedSuit);
      if (isSuit(nSuit) && nSuit !== nPartnersSuit && nSuit !== nAgreedSuit) {
        nBid = bidState.getCheapestShiftBid(nSuit);
        status.stream(
          `CUR30! Respond to partner's cue bid, showing our cheapest ${hand.getSuitLength(nSuit) > 0 ? 'King' : 'void suit'} (in ${Card.suitToString(nSuit)}) with a bid of ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      } else {
        nBid = bidState.getCheapestShiftBid(nAgreedSuit);
        if (isSuit(nSuit) && hand.suitHasCard(nSuit, KING)) {
          status.stream(
            `CUR32! But our only Ace is in the trump suit of ${Card.suitToSingularString(nAgreedSuit)}, so sign off at a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else {
          status.stream(
            `CUR34 We have no other Kings or void suits to offer, so sign off with the agreed ${Card.suitToSingularString(nAgreedSuit)} suit at a bid of ${bidToFullString(nBid)}.\n`,
          );
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      }
    }

    bidState.setConventionStatus(this, ConventionStatus.Error);
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
    if (nStatus <= 0) return null;

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPreviousBid = bidState.nPreviousBid;
    const nAgreedSuit = bidState.m_nAgreedSuit as Suit;
    let nBid: Bid;

    if (
      (nStatus === ConventionStatus.InvokedRound1 || nStatus === ConventionStatus.InvokedRound2) &&
      nPartnersSuit === nAgreedSuit
    ) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      if (nPartnersBidLevel >= 6) {
        status.stream(
          `HRCB0! In response to our cue bid, partner returned to the agreed ${Card.suitToSingularString(nAgreedSuit)} trump suit with a slam bid at ${bidToFullString(nPartnersBid)}.\n`,
        );
        if (nPartnersBidLevel === 6 && bidState.m_fMinTPPoints >= 37) {
          nBid = makeBid(nAgreedSuit, 7);
          status.stream(
            `HRCB1! And with ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, go ahead and raise to ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          status.stream(
            `HRCB2! And with ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, sign off on the slam bid and pass.\n`,
          );
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      }

      status.stream(
        `HRCB5! Partner returned to the agreed ${Card.suitToSingularString(nAgreedSuit)} trump suit in response to our cue bid of ${bidToFullString(nPreviousBid)}, which is a discouraging sign.\n`,
      );
      if (bidState.m_fMinTPPoints < 33) {
        nBid = Bid.Pass;
        status.stream(
          `HRCB6! And with only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, we have to forget about slam and pass.\n${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.m_fMinTPPoints < 37) {
        nBid = makeBid(nAgreedSuit, 6);
        status.stream(
          `HRCB7! But with ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, go ahead and bid a small slam anyway at ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = makeBid(nAgreedSuit, 7);
        status.stream(
          `HRCB8! But with ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, go ahead and bid a grand slam anyway at ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    if (nStatus === ConventionStatus.InvokedRound1) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      status.stream(
        `HRCB40! Partner responded with a cue bid of ${bidToFullString(nPartnersBid)}, showing an Ace in ${isSuit(nPartnersSuit) ? Card.suitToString(nPartnersSuit) : ''}.\n`,
      );
      let bAllFourControls: boolean;
      if (bidState.numAces + 1 === 4) {
        status.stream(
          `HRCB42! And with partner's ${isSuit(nPartnersSuit) ? Card.suitToSingularString(nPartnersSuit) : ''}, we have all four Aces for full first-round control.\n`,
        );
        bAllFourControls = true;
      } else {
        status.stream(
          `HRCB43! But even with partner's ${isSuit(nPartnersSuit) ? Card.suitToSingularString(nPartnersSuit) : ''}, it's not clear we have all four Aces for full first-round control.\n`,
        );
        bAllFourControls = false;
      }

      if (bidState.m_fMinTPPoints < PTS_SLAM || !bAllFourControls) {
        nBid = bidState.getCheapestShiftBid(nAgreedSuit);
        status.stream(
          `HRCB46! With only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership${bAllFourControls ? ',' : 'and without clear first round controls,'} we can't afford to bid slam, so settle for a contract of ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      } else if (bidState.m_fMinTPPoints < 36) {
        nBid = makeBid(nAgreedSuit, 6);
        status.stream(
          `HRCB46! But with only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, we have to stop at a small with a contract of ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      }

      const nSuit = this.getCheapestKingOrVoid(hand, nAgreedSuit);
      if (isSuit(nSuit) && nSuit !== nAgreedSuit) {
        nBid = bidState.getCheapestShiftBid(nSuit);
        status.stream(
          `HRCB60! Make a second-round cue bid, showing the cheapest ${hand.getSuitLength(nSuit) === 0 ? 'void suit' : 'king'} (in ${Card.suitToString(nSuit)}) with a bid of ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = makeBid(nAgreedSuit, 6);
        status.stream(
          `HRCB80! With no second-round controls to cue bid, we have to return to the trump suit with a small slam at ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    } else if (nStatus === ConventionStatus.InvokedRound2) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      let bAllFourSecondRoundControls: boolean;
      if (bidState.numKings + 1 === 4) {
        status.stream(
          `HRCBS10! And with partner's ${Card.suitToSingularString(nPartnersBid)} bid showing a King or void, in ${isSuit(nPartnersSuit) ? Card.suitToString(nPartnersSuit) : ''}, we have scond-round control of all four suits.\n`,
        );
        bAllFourSecondRoundControls = true;
      } else {
        status.stream(
          `HRCBS12! But even with partner's ${Card.suitToSingularString(nPartnersBid)}, it's not clear we have all full second-round control.\n`,
        );
        bAllFourSecondRoundControls = false;
      }

      if (bidState.m_fMinTPPoints < 32 || !bAllFourSecondRoundControls) {
        nBid = bidState.getCheapestShiftBid(nAgreedSuit);
        status.stream(
          `HRCBS20! With only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership ${bAllFourSecondRoundControls ? ',' : 'and without clear second round controls,'} we can't afford to bid slam, so settle for a contract of ${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.m_fMinTPPoints < 36) {
        nBid = makeBid(nAgreedSuit, 6);
        status.stream(
          `HRCBS24! But with only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, we have to stop at a small with a contract of ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = makeBid(nAgreedSuit, 7);
        status.stream(
          `HRCBS40! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership and full first and second-round controls, go head and bid a grand slam at ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    return null;
  }

  getCheapestAce(hand: Hand, nBaseSuit: Suit, nSecondSuit: Suit | typeof NONE = NONE): Suit | typeof NONE {
    if (nBaseSuit < Suit.Clubs) return NONE;
    let nSuit: Suit = nBaseSuit === Suit.NoTrump ? Suit.Clubs : getNextSuit(nBaseSuit);
    for (let i = 0; i < 4; i++) {
      if (hand.suitHasCard(nSuit, ACE) && nSuit !== nSecondSuit) return nSuit;
      nSuit = getNextSuit(nSuit);
    }
    return nBaseSuit;
  }

  getCheapestKingOrVoid(hand: Hand, nBaseSuit: Suit, nSecondSuit: Suit | typeof NONE = NONE): Suit | typeof NONE {
    if (nBaseSuit < Suit.Clubs) return NONE;
    let nSuit: Suit = nBaseSuit === Suit.NoTrump ? Suit.Clubs : getNextSuit(nBaseSuit);
    for (let i = 0; i < 4; i++) {
      if ((hand.getSuitLength(nSuit) === 0 || hand.suitHasCard(nSuit, KING)) && nSuit !== nSecondSuit) {
        return nSuit;
      }
      nSuit = getNextSuit(nSuit);
    }
    return nBaseSuit;
  }
}
