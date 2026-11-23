//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// Gambling3NTConvention.cpp -> gambling3NTConvention.ts
//

import { Card } from '../../card.js';
import { Bid, bidToFullString, isSuit, NONE, Suit, TEN } from '../../constants.js';
import { BiddingOption, ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_GRAND_SLAM, PTS_SLAM } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class Gambling3NTConvention extends Convention {
  constructor() {
    super(ConventionId.Gambling3NT);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    const bStandardGambling3NT =
      bidState.conventions.getValue(BiddingOption.Gambling3NTVersion) === 0;

    let bSmallSingletons = false;
    if (bidState.numSingletons > 0) {
      for (let i = 0; i < 4; i++) {
        const suit = hand.getSuit(i as Suit);
        if (suit.length === 1 && (suit.at(0)?.faceValue ?? 0) < TEN) {
          bSmallSingletons = true;
          break;
        }
      }
    }

    let nSuit: Suit | typeof NONE = NONE;
    if (hand.getSuit(Suit.Clubs).isSolid && bidState.numCardsInSuit[Suit.Clubs] >= 7) {
      nSuit = Suit.Clubs;
    } else if (hand.getSuit(Suit.Diamonds).isSolid && bidState.numCardsInSuit[Suit.Diamonds] >= 7) {
      nSuit = Suit.Diamonds;
    }

    const numValidBidsMade = bidState.getNumValidBidsMade();
    if (
      bStandardGambling3NT &&
      numValidBidsMade === 0 &&
      isSuit(nSuit) &&
      bidState.fCardPts >= bidState.openPts(10) &&
      bidState.fCardPts <= bidState.openPts(12) &&
      bidState.numVoids === 0 &&
      !bSmallSingletons &&
      bidState.numSuitsStopped === 1
    ) {
      status.stream(
        `G3NT1! With a solid ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit, ${bidState.fCardPts} HCPs, no voids, no small singletons, and no outside stoppers,  go ahead and bid a Gambling 3NT.\n`,
      );
    } else if (
      !bStandardGambling3NT &&
      numValidBidsMade === 0 &&
      isSuit(nSuit) &&
      bidState.fCardPts >= bidState.openPts(16) &&
      bidState.fCardPts <= bidState.openPts(21) &&
      bidState.numVoids === 0 &&
      !bSmallSingletons &&
      bidState.numSuitsStopped >= 3
    ) {
      status.stream(
        `G3NT2! With a solid ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit, ${bidState.fCardPts} HCPs, no voids, no small singletons, and stoppers in ${bidState.numSuitsStopped === 4 ? 'all four suits' : 'two outside suits'}, go ahead and bid an ACOL Gambling 3NT.\n`,
      );
    } else {
      return null;
    }

    bidState.setBid(Bid.NT3);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return Bid.NT3;
  }

  //
  // RespondToConvention()
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    const nPartnersBid = bidState.nPartnersBid;
    const nOpeningBid = bidState.getOpeningBid();
    let nBid: Bid = Bid.Pass;
    const nStatus = bidState.getConventionStatus(this);

    if (nStatus === ConventionStatus.Inactive) {
      if (nOpeningBid === nPartnersBid && bidState.nPartnersBid === Bid.NT3) {
        // passed test
      } else {
        return null;
      }

      const bStandardGambling3NT =
        bidState.conventions.getValue(BiddingOption.Gambling3NTVersion) === 0;

      if (bStandardGambling3NT) {
        status.stream(
          `G3NT10! Partner bid a Gambling 3NT, indicating ${bidState.openPts(10)}-${bidState.openPts(12)} HCPs, a solid 7+ card minor,  no voids or small singletons, and no outside stoppers.\n`,
        );
        bidState.adjustPartnershipPoints(10, 12);

        if (
          bidState.numSuitsStopped >= 3 &&
          bidState.numCardsInSuit[Suit.Clubs] > 0 &&
          bidState.numCardsInSuit[Suit.Diamonds] > 0
        ) {
          status.stream(
            `G3NT12! Since we have ${bidState.numSuitsStopped} suits stopped and no minor suit voids, we can pass.\n`,
          );
          nBid = Bid.NT3;
        } else {
          nBid = Bid.C4;
          if (bidState.numSuitsStopped < 3) {
            status.stream(
              `G3NT13! But since we have only ${bidState.numSuitsStopped} suits stopped, we have to respond with ${bidToFullString(nBid)}, which partner can correct to 4D if necessary.\n`,
            );
          } else {
            status.stream(
              `G3NT14! But since we are void in the ${bidState.numCardsInSuit[Suit.Clubs] === 0 ? 'Club' : 'Diamond'} suit, we have to respond at ${bidToFullString(nBid)}, which partner can correct to 4D if necessary.\n`,
            );
          }
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
          return nBid;
        }
      } else {
        status.stream(
          `G3NT20! Partner bid an ACOL Gambling 3NT, indicating ${bidState.openPts(16)}-${bidState.openPts(21)} HCPs, a solid 7+ card minor,  no voids or small singletons, and stoppers in at least 2 outside suits.\n`,
        );
        bidState.adjustPartnershipPoints(16, 21);

        if (bidState.m_fMinTPPoints >= PTS_SLAM) {
          if (bidState.m_fMinTPPoints >= PTS_GRAND_SLAM) {
            nBid = Bid.NT7;
            status.stream(
              `G3NT21! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMinTPPoints} pts in the partnership, bid a grand slam directly at ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = Bid.NT6;
            status.stream(
              `G3NT22! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMinTPPoints} pts in the partnership, bid slam directly at ${bidToFullString(nBid)}.\n`,
            );
          }
        } else {
          status.stream(
            `G3NT29! But with a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMinTPPoints} pts in the partnership, we have no interest in slam and have to pass.\n`,
          );
          nBid = Bid.Pass;
        }
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    } else if (nStatus === ConventionStatus.RespondedRound1) {
      if (nPartnersBid === Bid.D4 || nPartnersBid === Bid.Pass) {
        status.stream(
          `G3NT40! Pass partner's ${bidToFullString(nPartnersBid)} and conclude the Gambling 3NT convention and pass.\n`,
        );
      } else {
        status.stream(
          `G3NT41! Partner's ${bidToFullString(nPartnersBid)} bid doesn't make sense, so end the Gambling 3NT convention and pas.\n`,
        );
      }
      bidState.setBid(Bid.Pass);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return Bid.Pass;
    }

    return null;
  }

  //
  // HandleConventionResponse()
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    const nStatus = bidState.getConventionStatus(this);
    if (nStatus !== ConventionStatus.InvokedRound1 && nStatus !== ConventionStatus.InvokedRound2) {
      return null;
    }

    const nPartnersBid = bidState.nPartnersBid;
    if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
      return super.handleConventionResponse(context);
    }

    if (nStatus === ConventionStatus.Invoked) {
      let nBid: Bid = Bid.Pass;
      if (nPartnersBid === Bid.Pass) {
        status.stream('G3NT60! Partner passed our Gambling 3NT bid, so we pass as well.\n');
        nBid = Bid.Pass;
      }

      const bStandardGambling3NT =
        bidState.conventions.getValue(BiddingOption.Gambling3NTVersion) === 0;
      if (bStandardGambling3NT && nPartnersBid === Bid.C4) {
        status.stream(
          'G3NT61! Partner responded at 4 Club to our opening Gambling 3NT bid, indicating a lack of stoppers or a void minor suit.\n',
        );
        if (bidState.nPrefSuit === Suit.Diamonds) {
          nBid = Bid.D4;
          status.stream(
            `G3NT62! But since our desired suit is Diamonds, correct to ${bidToFullString(nBid)}.\n`,
          );
        } else {
          status.stream(
            'G3NT63! And since Clubs is our desired suit, we can pass and accept the 4C contract.\n',
          );
          nBid = Bid.Pass;
        }
      } else {
        status.stream(
          `G3NT65! Oops, partner's ${bidToFullString(nPartnersBid)} is not a proper response to our Gambling 3NT opening bid, so we have to pass.\n`,
        );
        nBid = Bid.Pass;
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    bidState.setConventionStatus(this, ConventionStatus.Error);
    return null;
  }
}
