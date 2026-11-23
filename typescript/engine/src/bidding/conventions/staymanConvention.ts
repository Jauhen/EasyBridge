//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// StaymanConvention.cpp -> staymanConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidToFullString,
  isBid,
  isMajor,
  isSuit,
  makeBid,
  NONE,
  Suit,
} from '../../constants.js';
import { REVALUE_DUMMY } from '../../hand.js';
import { BiddingOption, ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_GAME, PTS_GRAND_SLAM, PTS_SLAM, SuitStrength } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class StaymanConvention extends Convention {
  constructor() {
    super(ConventionId.Stayman);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    const { hand, status } = context;

    if (!bidState) {
      // Stateless fallback for standalone unit tests
      const { bidContext } = context;
      if (!bidContext.partnerOpenedForTeam) return null;
      if (![Bid.NT1, Bid.NT2, Bid.NT3].includes(bidContext.partnerBid)) return null;
      if (!bidContext.rightHandOpponentPassed) return null;
      if (hand.highCardPoints < 8) return null;
      if (hand.getSuitLength(Suit.Hearts) < 4 && hand.getSuitLength(Suit.Spades) < 4) return null;
      bidContext.status = ConventionStatus.Invoked;
      bidContext.agreedSuit = Suit.NoTrump;
      status.stream(
        `STY0! Have ${hand.highCardPoints}/${hand.totalPoints} points and at least one 4+ card major suit, so bid 2 Clubs (Stayman).\n`,
      );
      return Bid.C2;
    }

    const conventions = bidState.conventions;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const numPartnerBidsMade = bidState.m_numPartnerBidsMade;

    if (
      (nPartnersBid === Bid.NT1 || nPartnersBid === Bid.NT2 || nPartnersBid === Bid.NT3) &&
      bidState.m_bPartnerOpenedForTeam &&
      numPartnerBidsMade === 1 &&
      bidState.bRHOPassed &&
      bidState.fCardPts >= 6 &&
      (bidState.numCardsInSuit[Suit.Hearts] >= 4 || bidState.numCardsInSuit[Suit.Spades] >= 4)
    ) {
      const fPtsRequired = 23 - conventions.getNTRangeMin(nPartnersBidLevel);
      if (bidState.fCardPts >= fPtsRequired) {
        // met rqmts
      } else if (
        hand.getNumSuitsOfAtLeast(4) === 3 &&
        hand.getNumCardsInSuit(Suit.Clubs) === 1 &&
        bidState.fCardPts >= fPtsRequired - 1
      ) {
        status.stream(
          `STYX! Although we only have ${bidState.fCardPts} HCPs, we can use Stayman since we have 4/4/4/1 distribution and can live with a 2D/2H/2S response from partner.\n`,
        );
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (
      bidState.nSuitStrength[Suit.Clubs] >= SuitStrength.Absolute ||
      bidState.nSuitStrength[Suit.Diamonds] >= SuitStrength.Absolute
    ) {
      return null;
    }

    if (bidState.bBalanced && bidState.fCardPts + conventions.getNTRangeMin(1) >= 26) {
      return null;
    }

    switch (nPartnersBid) {
      case Bid.NT1:
        bidState.m_fPartnersMin = conventions.getValue(BiddingOption.OneNTRangeMinPts);
        bidState.m_fPartnersMax = conventions.getValue(BiddingOption.OneNTRangeMaxPts);
        break;
      case Bid.NT2:
        bidState.m_fPartnersMin = conventions.getValue(BiddingOption.TwoNTRangeMinPts);
        bidState.m_fPartnersMax = conventions.getValue(BiddingOption.TwoNTRangeMaxPts);
        break;
      case Bid.NT3:
        bidState.m_fPartnersMin = conventions.getValue(BiddingOption.ThreeNTRangeMinPts);
        bidState.m_fPartnersMax = conventions.getValue(BiddingOption.ThreeNTRangeMaxPts);
        break;
    }
    bidState.m_fMinTPPoints = bidState.m_fPartnersMin + bidState.fPts;
    bidState.m_fMaxTPPoints = bidState.m_fPartnersMax + bidState.fPts;
    bidState.m_fMinTPCPoints = bidState.m_fPartnersMin + bidState.fCardPts;
    bidState.m_fMaxTPCPoints = bidState.m_fPartnersMax + bidState.fCardPts;

    const nBid = bidState.getCheapestShiftBid(Suit.Clubs);
    status.stream(
      `STY0! Have ${bidState.fCardPts}/${bidState.fPts} points and at least one 4+ card major suit, so bid ${bidToFullString(nBid)} (Stayman).\n`,
    );
    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return nBid;
  }

  //
  // RespondToConvention()
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    const { hand, status } = context;

    if (!bidState) {
      if (context.bidContext.partnerBid !== Bid.C2) return null;
      if (hand.getSuitLength(Suit.Hearts) >= 4) return Bid.H2;
      if (hand.getSuitLength(Suit.Spades) >= 4) return Bid.S2;
      return Bid.D2;
    }

    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    // see if we already responded once to Stayman
    if (bidState.getConventionStatus(this) === ConventionStatus.Responded) {
      if (
        bidState.nPreviousSuit === Suit.Diamonds &&
        isSuit(bidState.nPartnersSuit) &&
        isMajor(bidState.nPartnersSuit)
      ) {
        const nSuit = bidState.nPartnersSuit;
        let nBid: Bid;
        status.stream(
          `STYRR0! Partner bid ${bidState.szPB} after our ${bidState.szPVB} response to his Stayman.  This is an invitational bid indicating 5+ ${Card.suitToString(nSuit)}.\n`,
        );

        if (bidState.numSupportCards >= 4 || bidState.fCardPts >= 17) {
          nBid = bidState.getGameBid(nSuit);
          if (nBid > bidState.nPartnersBid) {
            status.stream(
              `STYRR2! And with ${bidState.numCardsInSuit[nSuit]} ${Card.suitToString(nSuit)} and ${bidState.fCardPts} HCPs, raise partner to ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = Bid.Pass;
            status.stream('STYRR3! But since partner has already bid game, just pass.\n');
          }
        } else if (bidState.numSupportCards >= 3 || bidState.fCardPts >= 16) {
          nBid = makeBid(nSuit, 3);
          if (nBid > bidState.nPartnersBid) {
            if (bidState.numSupportCards >= 3)
              status.stream(
                `STYRR10! And with ${bidState.numCardsInSuit[nSuit]} ${Card.suitToString(nSuit)} and ${bidState.fCardPts} HCPs, raise partner to ${bidToFullString(nBid)}.\n`,
              );
            else
              status.stream(
                `STYRR11! And with ${bidState.fCardPts} HCPs, raise partner to ${bidToFullString(nBid)}.\n`,
              );
          } else {
            nBid = Bid.Pass;
            status.stream(
              `STYRR16! But with ${bidState.numCardsInSuit[nSuit]} ${Card.suitToString(nSuit)} and ${bidState.fCardPts} HCPs, we cannot raise partner any further, so pass.\n`,
            );
          }
        } else {
          nBid = Bid.Pass;
          status.stream(
            `STYRR20! But with only ${bidState.numCardsInSuit[nSuit]} ${Card.suitToString(nSuit)} and ${bidState.fCardPts} HCPs, we have to pass.\n`,
          );
        }

        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      } else {
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return null;
      }
    }

    const nPartnersBid = bidState.nPartnersBid;
    const nPreviousBid = bidState.nPreviousBid;
    const numPartnerBidsMade = bidState.m_numPartnerBidsMade;

    const isStaymanInquiry =
      ((nPreviousBid === Bid.NT1 && nPartnersBid === Bid.C2) ||
        (nPreviousBid === Bid.NT2 && nPartnersBid === Bid.C3) ||
        (nPreviousBid === Bid.NT3 && nPartnersBid === Bid.C4)) &&
      numPartnerBidsMade === 1;

    if (isStaymanInquiry && !bidState.bLHOPassed) {
      status.stream('STYX! LHO interfered over our NT opening, so Stayman is off.\n');
      return null;
    }

    if (isStaymanInquiry && bidState.bLHOPassed) {
      status.stream('STYR! Partner is using the Stayman convention, asking for majors.\n');
    } else {
      return null;
    }

    bidState.m_fPartnersMin = 8;
    bidState.m_fPartnersMax = Math.min(22, 40 - bidState.fCardPts);
    bidState.m_fMinTPPoints = bidState.fPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = bidState.fPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = bidState.fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = bidState.fCardPts + bidState.m_fPartnersMax;

    let nSuit: Suit;
    let nBid: Bid;
    if (bidState.numCardsInSuit[Suit.Hearts] >= 4 && bidState.numCardsInSuit[Suit.Spades] >= 4) {
      nSuit = Suit.Hearts;
      nBid = bidState.getCheapestShiftBid(nSuit);
      status.stream(
        `STYR10! With a ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit, reply to partner's Stayman inquiry with a ${bidToFullString(nBid)} bid.\n`,
      );
    } else if (bidState.numCardsInSuit[Suit.Hearts] >= 4 || bidState.numCardsInSuit[Suit.Spades] >= 4) {
      nSuit = bidState.numCardsInSuit[Suit.Hearts] >= 4 ? Suit.Hearts : Suit.Spades;
      nBid = bidState.getCheapestShiftBid(nSuit);
      status.stream(
        `STYR11! With a ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit, reply to partner's Stayman inquiry with a ${bidToFullString(nBid)} bid.\n`,
      );
    } else {
      nBid = bidState.getCheapestShiftBid(Suit.Diamonds);
      status.stream(
        `STYR12! But we have no 4-card majors, so reply negatively to Stayman by bidding ${bidToFullString(nBid)}.\n`,
      );
    }

    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Responded);
    return nBid;
  }

  //
  // HandleConventionResponse()
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    if (bidState.getConventionStatus(this) !== ConventionStatus.Invoked) {
      return null;
    }

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;

    if (nPartnersBidLevel > Bid.S4 || nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
      status.stream(
        `STYX01! Partner did not reply properly to our Stayman inquiry, bidding ${bidToFullString(nPartnersBid)}. Treat this as a simple rebid.\n`,
      );
      bidState.setConventionStatus(this, ConventionStatus.Error);
      return null;
    } else if (nPartnersBid === Bid.Pass) {
      const bInterference = isBid(bidState.nLHOBid);
      status.stream(
        `STYX04! Partner passed our Stayman inquiry ${bInterference ? 'after interference from the opponents' : ''}, so Stayman is no longer in effect.\n`,
      );
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return null;
    }

    if (nPartnersSuit === Suit.Clubs || nPartnersSuit === Suit.NoTrump || nPartnersBid > Bid.S4) {
      status.stream(
        `STYX10! Partner did not reply properly to our Stayman query, bidding ${bidToFullString(nPartnersBid)} instead of 2D/2H/2S.  Treat this like a simple rebid.\n`,
      );
      bidState.setConventionStatus(this, ConventionStatus.Error);
      return null;
    }

    let nSuit: Suit | typeof NONE;
    if (nPartnersSuit === Suit.Diamonds) {
      status.stream(
        `STYX12! Partner replied ${bidToFullString(nPartnersBid)} to our Stayman query, indicating no 4-card majors.\n`,
      );
      nSuit = NONE;
    } else {
      nSuit = nPartnersSuit;
      status.stream(
        `STYX14! Partner replied ${bidToFullString(nPartnersBid)} to our Stayman query, indicating a ${nPartnersBidLevel === 3 ? 'strong' : ''}4+ card ${isSuit(nSuit) ? Card.suitToSingularString(nSuit) : ''} suit.\n`,
      );
    }

    if (isSuit(nSuit) && isMajor(nSuit) && bidState.numCardsInSuit[nSuit] >= 4) {
      bidState.fAdjPts = hand.revalueHand(REVALUE_DUMMY, nSuit, true);
      bidState.m_nAgreedSuit = nSuit;
    } else {
      nSuit = NONE;
    }

    const n1NTMIN = bidState.conventions.getNTRangeMin(1);
    const n1NTMAX = bidState.conventions.getNTRangeMax(1);
    bidState.m_fMinTPPoints = n1NTMIN + bidState.fAdjPts;
    bidState.m_fMaxTPPoints = n1NTMAX + bidState.fAdjPts;
    bidState.m_fMinTPCPoints = n1NTMIN + bidState.fCardPts;
    bidState.m_fMaxTPCPoints = n1NTMAX + bidState.fCardPts;

    let nBid: Bid;
    if (nSuit === NONE) {
      if (
        !bidState.bBalanced &&
        bidState.m_fMinTPPoints >= PTS_GAME - 1 &&
        ((bidState.numCardsInSuit[Suit.Hearts] >= 5 &&
          bidState.nSuitStrength[Suit.Hearts] >= SuitStrength.Openable) ||
          (bidState.numCardsInSuit[Suit.Spades] >= 5 &&
            bidState.nSuitStrength[Suit.Spades] >= SuitStrength.Openable))
      ) {
        const bestMaj = bidState.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 5);
        nBid = makeBid(bestMaj, nPartnersBidLevel);
        status.stream(
          `STYX21! Partner has no 4-card major suit, but with a ${bidState.numCardsInSuit[bestMaj]}-card ${Card.suitToSingularString(bestMaj)} suit and an unbalanced hand, invite towards a contract in ${Card.suitToString(bestMaj)} with a bid of ${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.m_fMinTPCPoints < PTS_GAME - 3) {
        nBid = Bid.Pass;
        status.stream(
          `STYX30! With no major suit fit and only ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, we have to pass.\n`,
        );
      } else if (bidState.m_fMinTPCPoints < PTS_GAME) {
        nBid = bidState.getCheapestShiftBid(Suit.NoTrump);
        status.stream(
          `STYX31! With no major suit fit and ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, bid ${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.m_fMinTPCPoints < PTS_SLAM - 3) {
        nBid = Bid.NT3;
        status.stream(
          `STYX32! With no major suit fit but with ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, bid game at 3NT.\n`,
        );
      } else if (bidState.m_fMinTPCPoints <= PTS_SLAM) {
        nBid = Bid.NT4;
        status.stream(
          `STYX33! With no major suit fit but with ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, invite towards slam with a bid of 4NT.\n`,
        );
      } else if (bidState.m_fMinTPCPoints <= PTS_SLAM + 1) {
        nBid = Bid.NT6;
        status.stream(
          `STYX34! With no major suit fit but with ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, bid a small slam directly at 6NT.\n`,
        );
      } else if (bidState.m_fMinTPPoints === PTS_GRAND_SLAM - 1) {
        nBid = Bid.NT5;
        status.stream(
          `STYX35! With no major suit fit but with ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, invite a grand slam with a bid of 5NT.\n`,
        );
      } else {
        nBid = Bid.NT7;
        status.stream(
          `STYX36! With no major suit fit but with ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, bid a grand slam directly at 7NT.\n`,
        );
      }
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    // found a major suit fit
    const nCardFit = bidState.numCardsInSuit[nSuit] + 4;
    bidState.setConventionStatus(this, ConventionStatus.Finished);

    if (bidState.m_fMinTPPoints < PTS_GAME - 3) {
      nBid = Bid.Pass;
      status.stream(
        `STY60! With only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, settle for a part score and pass.\n`,
      );
    } else if (bidState.m_fMinTPPoints < PTS_GAME) {
      if (nPartnersBidLevel < 3) {
        nBid = makeBid(nSuit, 3);
        status.stream(
          `STY62! With ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership and at least ${nCardFit === 8 ? 'an ' : 'a '}${nCardFit}-card fit, raise to ${bidToFullString(nBid)}, and partner might raise to game.\n`,
        );
      } else {
        nBid = Bid.Pass;
        status.stream(
          `STY63! Although partner likes the ${bidState.szPSS} suit, we have only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, so we have to pass.\n`,
        );
      }
    } else if (bidState.m_fMinTPPoints < PTS_SLAM) {
      nBid = makeBid(nSuit, 4);
      status.stream(
        `STY64! With ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership and at least ${nCardFit === 8 ? 'an ' : 'a '}${nCardFit}-card fit, raise to game at ${bidToFullString(nBid)}.\n`,
      );
    } else {
      bidState.invokeBlackwood(bidState.m_nAgreedSuit as Suit);
      return bidState.m_nBid;
    }

    bidState.setBid(nBid);
    return nBid;
  }
}
