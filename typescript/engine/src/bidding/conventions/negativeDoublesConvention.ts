//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// NegativeDoublesConvention.cpp -> negativeDoublesConvention.ts
//

import { Card } from '../../card.js';
import { Bid, bidToFullString, isMajor, Suit } from '../../constants.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { Convention, ConventionContext } from '../convention.js';

export class NegativeDoublesConvention extends Convention {
  constructor() {
    super(ConventionId.NegativeDoubles);
  }

  //
  // TryConvention()
  //
  // check if we can bid a negative double here
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status, conventions } = context;

    // test conditions 1, 2, 3, and 5
    if (
      bidState.m_bPartnerOpenedForTeam &&
      bidState.m_numBidTurns <= 1 &&
      bidState.nLHOBid <= Bid.Pass &&
      bidState.nRHOBid > Bid.Pass &&
      bidState.nRHOBid <= Bid.S2 &&
      bidState.fCardPts >= bidState.openPts(6)
    ) {
      // passed the initial tests
    } else {
      return null;
    }

    // test condition #6
    const nRHOBidLevel = bidState.nRHOBidLevel;
    const nRHOSuit = bidState.nRHOSuit;
    const limitRaisesEnabled = conventions?.isConventionEnabled(ConventionId.LimitRaises) ?? false;

    if (nRHOBidLevel === 1) {
      if (bidState.numSupportCards >= 3 && bidState.fPts >= bidState.openPts(6)) {
        if (limitRaisesEnabled && bidState.fPts >= bidState.openPts(11) && bidState.fPts < bidState.openPts(13)) {
          return null; // limit raise
        } else if (
          !limitRaisesEnabled &&
          bidState.fPts >= bidState.openPts(13) &&
          bidState.fPts < bidState.openPts(17)
        ) {
          return null; // single raise
        }
      }
      // check up to 2 suits
      for (let i = 0; i < 2; i++) {
        const nSuit = hand.getSuitsByPreference(i);
        if (bidState.isSuitShiftable(nSuit) && nSuit > nRHOSuit) {
          return null;
        }
      }
    }

    if (nRHOBidLevel === 2) {
      if (
        bidState.numSupportCards >= 3 &&
        bidState.fPts >= bidState.openPts(6) &&
        bidState.nPartnersSuit > nRHOSuit
      ) {
        return null;
      }
      const nReqPts = limitRaisesEnabled ? bidState.openPts(11) : bidState.openPts(13);
      if (bidState.numSupportCards >= 4 && bidState.fPts >= nReqPts) {
        return null;
      }
      for (let i = 0; i < 2; i++) {
        const nSuit = hand.getSuitsByPreference(i);
        if (bidState.isSuitShiftable(nSuit)) {
          if (nSuit < bidState.nPartnersSuit && bidState.fPts >= bidState.openPts(10)) {
            return null;
          } else if (nSuit > bidState.nPartnersSuit && bidState.fPts >= bidState.openPts(19)) {
            return null;
          }
        }
      }
    } else if (nRHOBidLevel === 3) {
      return null;
    }

    // test condition 4: mark which majors are unbid
    const nMajorSuits = [true, true];
    if (bidState.nPartnersSuit === Suit.Hearts) nMajorSuits[0] = false;
    else if (bidState.nPartnersSuit === Suit.Spades) nMajorSuits[1] = false;

    if (bidState.nRHOSuit === Suit.Hearts) nMajorSuits[0] = false;
    else if (bidState.nRHOSuit === Suit.Spades) nMajorSuits[1] = false;

    if (!nMajorSuits[0] && !nMajorSuits[1]) return null;

    if (bidState.nRHOBidLevel === 1) {
      if (
        (nMajorSuits[0] && hand.getNumCardsInSuit(Suit.Hearts) < 4) ||
        (nMajorSuits[1] && hand.getNumCardsInSuit(Suit.Spades) < 4) ||
        bidState.fPts < bidState.openPts(6)
      ) {
        return null;
      }
    } else {
      if (
        (nMajorSuits[0] && hand.getNumCardsInSuit(Suit.Hearts) < 5) ||
        (nMajorSuits[1] && hand.getNumCardsInSuit(Suit.Spades) < 5) ||
        bidState.fPts < bidState.openPts(11)
      ) {
        return null;
      }
    }

    // finally, see if we have too many points for a neg. double (19+)
    if (bidState.fPts >= bidState.openPts(19)) {
      return null;
    }

    if (bidState.nRHOBidLevel === 1) {
      status.stream(
        `NEGDBL! With ${bidState.fPts}/${bidState.fPts} points and 4 cards in the unbid majors, bid a negative double.\n`,
      );
    } else {
      status.stream(
        `NEGDBL! With ${bidState.fPts}/${bidState.fPts} points and 5+ cards in the unbid majors, bid a negative double.\n`,
      );
    }
    const nBid = Bid.Double;
    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Finished);
    return nBid;
  }

  //
  // RespondToConvention()
  //
  // respond to partner's negative double
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    let nBid: Bid;
    const nPartnersBid = bidState.nPartnersBid;
    const nMajorSuits = [true, true];
    if (bidState.nPreviousSuit === Suit.Hearts) nMajorSuits[0] = false;
    else if (bidState.nPreviousSuit === Suit.Spades) nMajorSuits[1] = false;

    if (bidState.nLHOSuit === Suit.Hearts) nMajorSuits[0] = false;
    else if (bidState.nLHOSuit === Suit.Spades) nMajorSuits[1] = false;

    // apply tests #1, 2, and 3
    if (
      nPartnersBid === Bid.Double &&
      (bidState.nRound === 0 || bidState.nRound === 1) &&
      bidState.m_bOpenedBiddingForTeam &&
      bidState.nLHOBid > Bid.Pass &&
      bidState.nLHOBid <= Bid.S2
    ) {
      status.stream(
        `NEGDR! Partner has bid a negative double, indicating 4+ cards in the unbid majors ${
          nMajorSuits[0] && nMajorSuits[1]
            ? '(Hearts and Spades)'
            : nMajorSuits[0]
              ? '(Hearts)'
              : '(Spades)'
        }.\n`,
      );
    } else {
      return null;
    }

    // estimate partner's strength
    if (bidState.nLHOBidLevel === 1) {
      bidState.m_fPartnersMin = bidState.openPts(6);
      bidState.m_fPartnersMax = Math.min(bidState.openPts(9), 40 - bidState.fCardPts);
      bidState.m_fMinTPPoints = bidState.fPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPPoints = bidState.fPts + bidState.m_fPartnersMax;
      bidState.m_fMinTPCPoints = bidState.fCardPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPCPoints = bidState.fCardPts + bidState.m_fPartnersMax;
      status.stream(
        `2NEGDR8! Partner's negative double indicates ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} points, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points.\n`,
      );
    } else {
      bidState.m_fPartnersMin = bidState.openPts(11);
      bidState.m_fPartnersMax = Math.min(bidState.openPts(18), 40 - bidState.fCardPts);
      bidState.m_fMinTPPoints = bidState.fPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPPoints = bidState.fPts + bidState.m_fPartnersMax;
      bidState.m_fMinTPCPoints = bidState.fCardPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPCPoints = bidState.fCardPts + bidState.m_fPartnersMax;
      status.stream(
        `2NEGDRT8! Partner's negative double indicates 11+ pts, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points.\n`,
      );
    }

    const nLHOBid = bidState.nLHOBid;
    const nRHOBid = bidState.nRHOBid;
    const numHearts = hand.getNumCardsInSuit(Suit.Hearts);
    const numSpades = hand.getNumCardsInSuit(Suit.Spades);

    let nTopBid = nLHOBid;
    if (nRHOBid > Bid.Pass && nRHOBid !== Bid.Redouble) {
      nTopBid = nRHOBid;
    }

    if (nMajorSuits[0] && nMajorSuits[1] && (numHearts >= 3 || numSpades >= 3)) {
      const nSuit = bidState.pickSuperiorSuit(Suit.Hearts, Suit.Spades);
      nBid = bidState.getCheapestShiftBid(nSuit, nTopBid);
      if (bidState.isBidSafe(nBid)) {
        status.stream(
          `NEGDTR20! With ${bidState.m_fMinTPPoints} pts in the partnership and  both majors available in response to the negative double, go with the ${hand.getNumCardsInSuit(nSuit)}-card ${Card.suitToSingularString(nSuit)} suit and bid ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
      } else {
        status.stream(
          `NEGDTR21! We have both majors avaialblem but with ${bidState.m_fMinTPPoints} pts in the partnership, we do not have enough points to bid either suit and have to pass.\n`,
        );
        bidState.setBid(Bid.Pass);
      }
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return bidState.m_nBid;
    } else if ((nMajorSuits[0] && numHearts >= 3) || (nMajorSuits[1] && numSpades >= 3)) {
      const nSuit = nMajorSuits[0] && numHearts >= 3 ? Suit.Hearts : Suit.Spades;
      nBid = bidState.getCheapestShiftBid(nSuit, nTopBid);
      if (bidState.isBidSafe(nBid)) {
        status.stream(
          `NEGDTR30! With ${bidState.m_fMinTPPoints} pts in the partnership and ${hand.getNumCardsInSuit(nSuit)} cards available in ${Card.suitToString(nSuit)}, bid ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
      } else {
        status.stream(
          `NEGDTR31! We have ${hand.getNumCardsInSuit(nSuit)} cards in the ${Card.suitToSingularString(nSuit)} suit, but with only ${bidState.m_fMinTPPoints} pts in the partnership, we can't go any higher.\n`,
        );
        bidState.setBid(Bid.Pass);
      }
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return bidState.m_nBid;
    }

    // we have no majors available, so bid NT if possible
    if (bidState.bidNoTrumpAsAppropriateEngine(false)) {
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return bidState.m_nBid;
    }

    // else bid something, anything
    const nSuit = bidState.getRebidSuit(bidState.nPreviousSuit as Suit);
    nBid = bidState.getCheapestShiftBid(nSuit, nTopBid);
    if (!isMajor(nSuit)) {
      status.stream(
        `NEGDTR40! Unfortunately we don't have a major to respond with, so bid ${bidToFullString(nBid)}.\n`,
      );
    } else {
      status.stream(`NEGDTR41! Our best response is ${bidToFullString(nBid)}.\n`);
    }
    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Finished);
    return nBid;
  }

  //
  // HandleConventionResponse()
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    void context;
    // there's no code here for now (matches C++ NegativeDoublesConvention.cpp line 374)
    return null;
  }
}
