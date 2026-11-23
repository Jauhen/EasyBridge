//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// JacobyTransferConvention.cpp -> jacobyTransferConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidToFullString,
  isBid,
  isMajor,
  isMinor,
  isSuit,
  makeBid,
  NONE,
  Suit,
} from '../../constants.js';
import { REVALUE_DECLARER } from '../../hand.js';
import { BiddingOption, ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_GAME, PTS_MINOR_GAME, PTS_SLAM, SuitStrength } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

function getNextSuit(suit: Suit): Suit {
  return ((suit + 1) % 4) as Suit;
}

export class JacobyTransferConvention extends Convention {
  constructor() {
    super(ConventionId.JacobyTransfers);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    const { hand, status } = context;

    if (!bidState) {
      if (context.bidContext.partnerOpenedForTeam && hand.getSuitLength(Suit.Hearts) >= 5) {
        return Bid.D2;
      }
      if (context.bidContext.partnerOpenedForTeam && hand.getSuitLength(Suit.Spades) >= 5) {
        return Bid.H2;
      }
      return null;
    }

    const conventions = bidState.conventions;

    if (
      bidState.nPartnersBid === Bid.NT1 &&
      bidState.m_bPartnerOpenedForTeam &&
      bidState.m_numPartnerBidsMade === 1 &&
      bidState.bRHOPassed &&
      hand.getNumSuitsOfAtLeast(5) >= 1 &&
      bidState.fPts >= 6
    ) {
      // met requirements
    } else {
      return null;
    }

    if (bidState.bBalanced && bidState.fCardPts + conventions.getNTRangeMin(1) >= 26) {
      return null;
    }

    let nSuit: Suit;
    let nBid: Bid;
    if (bidState.numCardsInSuit[Suit.Hearts] >= 5 || bidState.numCardsInSuit[Suit.Spades] >= 5) {
      nSuit = bidState.getBestSuitOfAtLeast(Suit.Hearts, Suit.Spades, 5);
      nBid = makeBid((nSuit - 1) as Suit, 2);
      status.stream(
        `JAC0! With a ${bidState.numCardsInSuit[nSuit]}-card major in ${Card.suitToString(nSuit)}, use Jacoby to transfer by bidding ${bidToFullString(nBid)}.\n`,
      );
    } else {
      nSuit = bidState.getBestSuitOfAtLeast(Suit.Clubs, Suit.Diamonds, 5);
      if (conventions.isOptionEnabled(BiddingOption.FourSuitTransfers)) {
        nBid = nSuit === Suit.Clubs ? Bid.S2 : Bid.NT2;
        status.stream(
          `JAC2! With a ${bidState.numCardsInSuit[nSuit]}-card minor in ${Card.suitToString(nSuit)}, and playing 4-suit transfers, use Jacoby to transfer by bidding ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = Bid.S2;
        if (nSuit === Suit.Clubs) {
          status.stream(
            `JAC4! With a ${bidState.numCardsInSuit[nSuit]}-card minor in ${Card.suitToString(nSuit)}, use Jacoby to transfer to 3C by bidding ${bidToFullString(nBid)}.\n`,
          );
        } else {
          status.stream(
            `JAC6! With a ${bidState.numCardsInSuit[nSuit]}-card minor in ${Card.suitToString(nSuit)}, and playing only simple transfers, use Jacoby to transfer to 3C by bidding ${bidToFullString(nBid)}.  We can then rebid 3D at the next opportunity.\n`,
          );
        }
      }
    }

    bidState.m_nIntendedSuit = nSuit;
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
    const conventions = bidState.conventions;

    if (bidState.getActiveConvention()) return null;

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPreviousBid = bidState.nPreviousBid;

    if (
      bidState.m_numBidTurns === 1 &&
      bidState.m_numPartnerBidsMade === 1 &&
      nPreviousBid === Bid.NT1 &&
      bidState.bLHOPassed &&
      nPartnersBid >= Bid.D2 &&
      nPartnersBid <= Bid.NT2
    ) {
      // possible Jacoby transfer
    } else {
      return null;
    }

    const fPts = bidState.fPts;
    const fCardPts = bidState.fCardPts;
    bidState.m_fPartnersMin = 8;
    bidState.m_fPartnersMax = Math.min(22, 40 - fCardPts);
    bidState.m_fMinTPPoints = fPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

    let nNewSuit: Suit | typeof NONE;
    if (conventions.isOptionEnabled(BiddingOption.FourSuitTransfers)) {
      nNewSuit = nPartnersBid !== Bid.NT2 && isSuit(nPartnersSuit) ? getNextSuit(nPartnersSuit) : Suit.Diamonds;
    } else {
      nNewSuit = nPartnersBid !== Bid.NT2 && isSuit(nPartnersSuit) ? getNextSuit(nPartnersSuit) : NONE;
    }

    if (nNewSuit === NONE || !isSuit(nNewSuit)) return null;

    if (conventions.isOptionEnabled(BiddingOption.FourSuitTransfers)) {
      status.stream(
        `JC10! Playing Four-suit Jacoby Transfers, partner is asking to transfer to ${Card.suitToString(nNewSuit)}.\n`,
      );
    } else if (nPartnersBid !== Bid.NT2) {
      status.stream(
        `JC12! Playing Simple Jacoby Transfers, partner is asking to transfer to ${Card.suitToString(nNewSuit)}.\n`,
      );
    }

    let bMaxRange = false;
    const n1NTMax = conventions.getNTRangeMax(1);
    const n2NTMax = conventions.getNTRangeMax(2);
    const nPrevBid: number = nPreviousBid;
    if (nPrevBid === Bid.NT1 && fCardPts === n1NTMax) bMaxRange = true;
    if (nPrevBid === Bid.NT2 && fCardPts === n2NTMax) bMaxRange = true;

    let nBid: Bid = Bid.Pass;
    if (isMajor(nNewSuit) && bMaxRange && bidState.nSuitStrength[nNewSuit] >= SuitStrength.GoodSupport) {
      nBid = bidState.getJumpShiftBid(nNewSuit, nPartnersBid);
      status.stream(
        `JC20! Responding with strong support in the major ${Card.suitToSingularString(nNewSuit)} suit (holding ${bidState.suitHoldingsToString(nNewSuit)}) and max NT opening points, jump respond to ${bidToFullString(nBid)}.\n`,
      );
    }

    if (isMinor(nNewSuit) && bMaxRange && bidState.nSuitStrength[nNewSuit] >= SuitStrength.GoodSupport) {
      if (conventions.isOptionEnabled(BiddingOption.FourSuitTransfers)) {
        nBid = (nPartnersBid + 1) as Bid;
        status.stream(
          `JC22! Responding with strong support in the major ${Card.suitToSingularString(nNewSuit)} suit (holding ${bidState.suitHoldingsToString(nNewSuit)}) and max NT opening points, respond with ${bidToFullString(nBid)} to indicate strong support and max opening strength (playing 4-suit transfers).\n`,
        );
      }
    }

    // Note: C++ JacobyTransferConvention.cpp lines 246-250 always runs this block after the above ifs
    if (nNewSuit >= Suit.Clubs) {
      nBid = bidState.getCheapestShiftBid(nNewSuit);
      status.stream(
        `JC24! Respond to the requested ${Card.suitToSingularString(nNewSuit)} transfer suit with a ${bidToFullString(nBid)} bid.\n`,
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
    const conventions = bidState.conventions;

    if (bidState.getConventionStatus(this) !== ConventionStatus.Invoked) {
      return null;
    }

    let nBid: Bid = Bid.Pass;
    let nNewSuit: Suit | typeof NONE = NONE;
    let nTargetSuit: Suit | typeof NONE = NONE;
    const nPreviousSuit = bidState.nPreviousSuit;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPreviousBid = bidState.nPreviousBid;

    if (conventions.isOptionEnabled(BiddingOption.FourSuitTransfers)) {
      nNewSuit = nPreviousSuit !== Suit.NoTrump && isSuit(nPreviousSuit) ? getNextSuit(nPreviousSuit) : Suit.Diamonds;
      nTargetSuit = nNewSuit;
    } else {
      if (nPreviousSuit !== Suit.NoTrump && isSuit(nPreviousSuit)) {
        nNewSuit = getNextSuit(nPreviousSuit);
      } else {
        return null;
      }
      if ((nPreviousBid === Bid.S2 || nPreviousBid === Bid.S3) && bidState.nPrefSuit === Suit.Diamonds) {
        nTargetSuit = Suit.Diamonds;
      } else {
        nTargetSuit = nNewSuit;
      }
    }

    if (nPartnersBid > Bid.D4 || nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
      status.stream(
        `2JC30! Partner did not reply properly to our Jacoby Transfer, bidding ${bidToFullString(nPartnersBid)} instead of the asked-for ${bidToFullString(makeBid(nNewSuit as Suit, 2))}. Treat this as a simple rebid.\n`,
      );
      bidState.setConventionStatus(this, ConventionStatus.Error);
      return null;
    } else if (nPartnersBid === Bid.Pass) {
      const bInterference = isBid(bidState.nLHOBid);
      status.stream(
        `2JC31! Partner passed our Jacoby Transfer ${bInterference ? 'after interference from the opponents' : ''}, so Jacoby is no longer in effect.\n`,
      );
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return null;
    }

    const fPts = bidState.fPts;
    let fAdjPts = bidState.fPts;
    const fCardPts = bidState.fCardPts;
    const n1NTMIN = conventions.getNTRangeMin(1);
    const n1NTMAX = conventions.getNTRangeMax(1);

    if (
      nPartnersBid === Bid.H2 ||
      nPartnersBid === Bid.S2 ||
      nPartnersBid === Bid.C3 ||
      nPartnersBid === Bid.D3
    ) {
      bidState.m_fMinTPPoints = n1NTMIN + fAdjPts;
      bidState.m_fMaxTPPoints = n1NTMAX + fAdjPts;
      bidState.m_fMinTPCPoints = n1NTMIN + fCardPts;
      bidState.m_fMaxTPCPoints = n1NTMAX + fCardPts;
      status.stream(
        `2JC32! Partner replied to our Jacoby transfer with ${bidToFullString(nPartnersBid)} indicating ${n1NTMIN}-${n1NTMAX} points for a total in the partership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points.\n`,
      );
    } else if (
      conventions.isOptionEnabled(BiddingOption.FourSuitTransfers) &&
      ((nPreviousBid === Bid.S2 && nPartnersBid === Bid.NT2) ||
        (nPreviousBid === Bid.NT2 && (nPartnersBid as Bid) === Bid.C3))
    ) {
      bidState.m_fMinTPPoints = n1NTMAX + fAdjPts;
      bidState.m_fMaxTPPoints = n1NTMAX + fAdjPts;
      bidState.m_fMinTPCPoints = n1NTMIN + fCardPts;
      bidState.m_fMaxTPCPoints = n1NTMAX + fCardPts;
      status.stream(
        `2JC34! Partner replied to our ${bidToFullString(nPreviousBid)} Jacoby transfer with a response of ${bidToFullString(nPartnersBid)}, which indicates a maximum 1NT opening hand (${n1NTMAX} HCPs, for a total of ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership) and strong support for the minor ${isSuit(nPreviousSuit) ? Card.suitToSingularString(nPreviousSuit) : ''} suit.\n`,
      );
    } else {
      fAdjPts = bidState.fAdjPts = isSuit(nPartnersSuit)
        ? hand.revalueHand(REVALUE_DECLARER, nPartnersSuit, true)
        : fPts;
      bidState.m_fMinTPPoints = n1NTMAX + fAdjPts;
      bidState.m_fMaxTPPoints = n1NTMAX + fAdjPts;
      bidState.m_fMinTPCPoints = n1NTMIN + fCardPts;
      bidState.m_fMaxTPCPoints = n1NTMAX + fCardPts;
      status.stream(
        `2JC16! Partner replied to our Jacoby transfer with a jump response of ${bidToFullString(nPartnersBid)}, indicating max 1NT opening points (${n1NTMAX}) and 4+ trumps, for a total partnership holding of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points and 4+ trumps.\n`,
      );
    }

    if (nTargetSuit !== nNewSuit) {
      status.stream(
        "2JC18! We instructed partner to bid Clubs last time because we're not playing 4-suit transfers, so we now want to correct to Diamonds.\n",
      );
    }

    if (bidState.m_fMinTPPoints < PTS_GAME) {
      if (nTargetSuit !== nNewSuit) {
        nBid = bidState.getCheapestShiftBid(Suit.Diamonds, nPartnersBid);
        status.stream(
          `JC20! With ${fCardPts}/${fPts}/${fAdjPts} points in the hand, and a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, settle for a part score and correct to ${bidToFullString(nBid)}.\n`,
        );
      } else {
        if (bidState.m_fMinTPPoints <= PTS_GAME - 3) {
          nBid = Bid.Pass;
          status.stream(
            `JC40! With ${fCardPts}/${fPts}/${fAdjPts} points in the hand, and a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, we have to settle for a part score and pass.\n`,
          );
        } else if (bidState.m_fMinTPPoints >= PTS_GAME - 2 && bidState.m_fMinTPPoints < PTS_GAME) {
          if (nPartnersBidLevel < 3) {
            nBid = makeBid(nNewSuit as Suit, 3);
            status.stream(
              `JC50! With ${fCardPts}/${fPts}/${fAdjPts} points in the hand, and a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, raise to ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = Bid.Pass;
            status.stream(
              `JC52! We have ${fCardPts}/${fPts}/${fAdjPts} points in the hand, and a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, so we cannot realistically raise further -- so pass.\n`,
            );
          }
        }
      }
    } else if (bidState.m_fMinTPPoints >= PTS_GAME && bidState.m_fMinTPPoints < PTS_SLAM) {
      if (isMajor(nTargetSuit)) {
        nBid = makeBid(nTargetSuit as Suit, 4);
      } else {
        nBid = makeBid(nTargetSuit as Suit, bidState.m_fMinTPPoints < PTS_MINOR_GAME ? 4 : 5);
      }
      status.stream(
        `JC60! With ${fCardPts}/${fPts}/${fAdjPts} points in the hand, and a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, bid ${bidToFullString(nBid)}.\n`,
      );
    } else {
      bidState.invokeBlackwood(nTargetSuit as Suit);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return bidState.m_nBid;
    }

    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Finished);
    return nBid;
  }
}
