//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// WeakTwoBidsConvention.cpp -> weakTwoBidsConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidToFullString,
  isBid,
  isMajor,
  isSuit,
  JACK,
  makeBid,
  NONE,
  otherMajor,
  Suit,
} from '../../constants.js';
import { REVALUE_DECLARER, REVALUE_DUMMY } from '../../hand.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_GAME, singleRaise, SuitStrength } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class WeakTwoBidsConvention extends Convention {
  constructor() {
    super(ConventionId.WeakTwoBids);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    const { hand, status } = context;

    if (!bidState) {
      const hcp = hand.highCardPoints;
      if (hcp < 6 || hcp > 10) return null;
      for (const suit of [Suit.Hearts, Suit.Spades, Suit.Diamonds]) {
        if (hand.getSuitLength(suit) >= 6) {
          const bid = suit === Suit.Hearts ? Bid.H2 : suit === Suit.Spades ? Bid.S2 : Bid.D2;
          context.bidContext.status = ConventionStatus.Invoked;
          context.bidContext.agreedSuit = suit;
          return bid;
        }
      }
      return null;
    }

    if (bidState.nLastValidRecordedBid !== Bid.Pass) return null;

    if (
      bidState.fPts >= bidState.openPts(6) &&
      bidState.fPts <= bidState.openPts(11) &&
      isSuit(bidState.nPrefSuit) &&
      isMajor(bidState.nPrefSuit) &&
      bidState.numPrefSuitCards >= 6 &&
      bidState.numHonorsInPrefSuit >= 2 &&
      bidState.numPrefSuitPoints >= 4 &&
      bidState.numCardsInSuit[otherMajor(bidState.nPrefSuit)] < 4 &&
      bidState.numVoids === 0 &&
      bidState.numSingletons <= 1
    ) {
      const nSuit = bidState.nPrefSuit;
      const nBid = makeBid(nSuit, 2);
      status.stream(
        `WEAK2! Have a good ${bidState.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit with ${bidState.fCardPts}/${bidState.fPts} points (less than normal opening requirements), so bid a weak ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Invoked);
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
    const { hand, status } = context;

    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    const nPreviousBid = bidState.nPreviousBid;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersPrevSuit = bidState.nPartnersPrevSuit;
    const nPartnersSuitSupport = bidState.nPartnersSuitSupport;
    const numSupportCards = bidState.numSupportCards;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const numPartnerBidsMade = bidState.m_numPartnerBidsMade;

    // second response to partner's weak 2 opening
    if (bidState.getConventionStatus(this) === ConventionStatus.Responded) {
      bidState.setConventionStatus(this, ConventionStatus.Finished);

      if (nPreviousBid === Bid.NT2 && isBid(nPartnersBid) && isSuit(nPartnersPrevSuit)) {
        let nBid: Bid;
        if (nPartnersSuit !== nPartnersPrevSuit && isSuit(nPartnersSuit)) {
          if (
            hand.getSuit(nPartnersSuit).hcPoints >= 3 &&
            bidState.m_fMinTPPoints >= PTS_GAME - 2 &&
            bidState.nPartnersSuitSupport >= SuitStrength.WeakSupport
          ) {
            nBid = bidState.getGameBid(nPartnersPrevSuit);
            status.stream(
              `RWKT2B1! Partner has shown an outside Ace or King in the ${Card.suitToSingularString(nPartnersSuit)} suit, so with strength in ${Card.suitToString(nPartnersSuit)}, ${bidState.numSupportCards}-card trump support, and a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, raise to ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = bidState.getCheapestShiftBid(nPartnersPrevSuit);
            status.stream(
              `RWKT2B2! Partner has shown an outside Ace or King in the ${Card.suitToSingularString(nPartnersSuit)} suit, but with a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership we lack the strength to raise further, so return to partner's suit at ${bidToFullString(nBid)}.\n`,
            );
          }
        } else {
          nBid = Bid.Pass;
          status.stream(
            `RWKT2B5! Partner has returned to his original ${Card.suitToSingularString(nPartnersPrevSuit)} suit, indicating no interest in game, so we pass.\n`,
          );
        }
        bidState.setBid(nBid);
        return nBid;
      }
      return null;
    }

    if (
      nPartnersBidLevel === 2 &&
      nPartnersBid !== Bid.C2 &&
      nPartnersBid !== Bid.NT2 &&
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
    const fPts = bidState.fPts;
    const fAdjPts = (bidState.fAdjPts = isSuit(bidState.m_nAgreedSuit)
      ? hand.revalueHand(REVALUE_DUMMY, bidState.m_nAgreedSuit, true)
      : fPts);
    const fCardPts = bidState.fCardPts;
    const nPrefSuit = bidState.nPrefSuit as Suit;

    bidState.m_fPartnersMin = bidState.openPts(6);
    bidState.m_fPartnersMax = bidState.openPts(11);
    status.stream(
      `RWKT! Partner made a weak 2-bid, showing a a 6+ card suit with ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} points, less than 4 cards in the other major, no voids, and no more than one singleton.\n`,
    );

    bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

    // < 6 points
    if (fAdjPts < bidState.openPts(6)) {
      if (numSupportCards >= 4 && fPts >= bidState.openPts(4)) {
        nBid = makeBid(nPartnersSuit, 4);
        bidState.setAgreedSuit(nPartnersSuit);
        status.stream(
          `RWKT1! We have only ${fCardPts}/${fPts}/${fAdjPts} points but have ${numSupportCards} support cards, so make a shutout response of ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = Bid.Pass;
        status.stream(
          `RWKT2! With only ${fCardPts}/${fPts}/${fAdjPts} points, the hand is too weak for a response, so pass.\n`,
        );
      }
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Inactive);
      return nBid;
    }

    // 6-12 points
    if (
      (nPartnersSuitSupport < SuitStrength.WeakSupport &&
        fPts >= bidState.openPts(6) &&
        fPts <= bidState.openPts(12)) ||
      (nPartnersSuitSupport >= SuitStrength.WeakSupport &&
        fAdjPts >= bidState.openPts(6) &&
        fAdjPts <= bidState.openPts(12))
    ) {
      status.stream(
        `RWKT4! We only have ${fCardPts}/${fPts}/${fAdjPts} points, for a partnership total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, which is probably not enough for game.\n`,
      );
      if (numSupportCards >= 3 || (numSupportCards >= 2 && bidState.numHonorsInPartnersSuit >= 1)) {
        nBid = makeBid(nPartnersSuit, 3);
        bidState.setAgreedSuit(nPartnersSuit);
        status.stream(
          `RWKT6! And with at least minimum (${numSupportCards}-card) support for partner's ${bidState.szPS} (holding ${bidState.szHP}), make a weak shutout raise of ${bidToFullString(nBid)}.\n`,
        );
      } else if (nPrefSuit !== nPartnersSuit && bidState.numPrefSuitCards >= 5) {
        nBid = bidState.getCheapestShiftBid(nPrefSuit);
        status.stream(
          `RWKT8! And we don't like partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), so shift to our preferred ${bidState.szPrefSS} suit in a bid of ${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.numVoids === 0 && bidState.numSingletons === 0) {
        nBid = Bid.NT2;
        status.stream(
          `RWKT9! And since we don't like partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), and have no good suit of our own, bid ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = Bid.Pass;
        status.stream(
          `RWKT10! And since we don't like partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), have no good suit of our own, and hold an imbalanced hand, we have to pass.\n`,
        );
      }
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Responded);
      return nBid;
    }

    // 13-19 pts
    if (
      (nPartnersSuitSupport < SuitStrength.WeakSupport &&
        fPts >= bidState.openPts(13) &&
        fPts <= PTS_GAME - 6) ||
      (nPartnersSuitSupport >= SuitStrength.WeakSupport &&
        fAdjPts >= bidState.openPts(13) &&
        fAdjPts <= PTS_GAME - 6)
    ) {
      status.stream(
        `We have ${fCardPts}/${fPts}/${fAdjPts} points, for a partnership total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, so we are interested in game if a good fit can be found.\n`,
      );

      if (
        (nPartnersSuitSupport >= SuitStrength.WeakSupport && fAdjPts >= 18) ||
        (nPartnersSuitSupport >= SuitStrength.ModerateSupport && fAdjPts >= 17)
      ) {
        nBid = makeBid(nPartnersSuit, 4);
        bidState.setAgreedSuit(nPartnersSuit);
        status.stream(
          `RWKT20! And with ${bidState.supportLevelToString(nPartnersSuit)} support for partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), and a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we raise to ${bidToFullString(nBid)}.\n`,
        );
      } else if (nPartnersSuitSupport >= SuitStrength.WeakSupport) {
        nBid = Bid.NT2;
        bidState.setAgreedSuit(nPartnersSuit);
        status.stream(
          `RWKT21! And we like partner's ${bidState.szPSS} suit (holding ${bidState.szHP} support), but with only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} total pts we don't quite have enough for a direct game bid, so invite partner to show an outside Ace or King with a bid of 2NT.\n`,
        );
      } else if (bidState.bBalanced && bidState.m_fMinTPCPoints >= PTS_GAME - 1) {
        if (hand.allOtherSuitsStopped(nPartnersSuit)) {
          nBid = bidState.m_fMinTPCPoints >= PTS_GAME ? Bid.NT3 : Bid.NT2;
          status.stream(
            `RWKT22! And since we have a balanced hand with ${fCardPts} HCPs, for a total in the partnership of approx. ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs, and all${bidState.numSuitsStopped === 4 ? ' ' : ' unbid '}suits are stopped, we can bid ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.NT2;
          status.stream(
            `RWKT24! And since we lack good support for partner's ${bidState.szPSS} suit (holding ${bidState.szHP}) but have a balanced hand, albeit lacking stoppers in ${hand.getUnstoppedSuitNames()}, bid ${bidToFullString(nBid)}.\n`,
          );
        }
      } else if (nPrefSuit === nPartnersSuit) {
        nBid = makeBid(nPartnersSuit, 3);
        bidState.setAgreedSuit(nPartnersSuit);
        status.stream(
          `RWKT26! Our support for partner's ${bidState.szPSS} suit isn't great (holding ${bidState.szHP}), but we have have no better suit, so raise partner one level to ${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.numPrefSuitCards >= 6 && bidState.nPrefSuitStrength >= SuitStrength.Openable) {
        nBid = bidState.getCheapestShiftBid(nPrefSuit);
        status.stream(
          `RWKT28! But we don't like partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), so shift to our preferred ${bidState.szPrefSS} suit in a bid of ${bidToFullString(nBid)}.\n`,
        );
      } else if (numSupportCards >= 2) {
        nBid = singleRaise(nPartnersBid) as Bid;
        bidState.setAgreedSuit(nPartnersSuit);
        status.stream(
          `RWKT30! We lack good support for partner's ${bidState.szPSS} (holding ${bidState.szHP}), but our hand is not appropriate for NT and we have no good suit of our own, so the best we can do is raise partner to ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = Bid.Pass;
        status.stream(
          `RWKT32! We have very poor support for partner's ${bidState.szPSS} (holding ${bidState.szHP}), and no good suit of our own, so we have to pass.\n`,
        );
      }
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Responded);
      return nBid;
    }

    // 20+ pts
    status.stream(
      `RWKT40! We have ${fCardPts}/${fPts}/${fAdjPts} points, for a partnership total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, so we may be interested in a possible slam.\n`,
    );

    if (nPartnersSuitSupport >= SuitStrength.StrongSupport) {
      nBid = makeBid(nPartnersSuit, 6);
      bidState.setAgreedSuit(nPartnersSuit);
      status.stream(
        `RWKT42! And since we have a strong holding in the ${bidState.szPSS} suit (${bidState.szHP}), we raise to ${bidToFullString(nBid)}.\n`,
      );
    } else if (nPartnersSuitSupport >= SuitStrength.GoodSupport) {
      status.stream(
        `RWKT44! And since we like partner's ${bidState.szPSS} suit (holding ${bidState.szHP} support), move towards slam.\n`,
      );
      bidState.invokeBlackwood(nPartnersSuit);
      return bidState.m_nBid;
    } else if (bidState.bBalanced && hand.allOtherSuitsStopped(nPartnersSuit)) {
      status.stream(
        `RWKT46! And we have a balanced hand with all${bidState.numSuitsStopped === 4 ? ' ' : ' unbid '}suits stopped, so move towards slam.\n`,
      );
      bidState.invokeBlackwood(Suit.NoTrump);
      return bidState.m_nBid;
    } else {
      nBid = bidState.getJumpShiftBid(nPrefSuit, nPartnersBid);
      status.stream(
        `RWKT48! We don't have very good support for partner's ${bidState.szPSS} suit (holding ${bidState.szHP}, and don't have the proper distribution for a NT response, so jump shift to ${bidToFullString(nBid)}.  Slam possibilities may be explored later.\n`,
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
    bidState.clearConventionStatus(this);

    let nBid: Bid;
    const fPts = bidState.fPts;
    let fAdjPts = bidState.fAdjPts;
    const fCardPts = bidState.fCardPts;
    const nPreviousBid = bidState.nPreviousBid;
    const nPreviousSuit = bidState.nPreviousSuit as Suit;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const numSupportCards = bidState.numSupportCards;

    if (nPartnersBid === Bid.NT2) {
      bidState.m_fPartnersMin = 13;
      bidState.m_fPartnersMax = 19;
    } else if (nPartnersBid === Bid.NT3) {
      bidState.m_fPartnersMin = 19;
      bidState.m_fPartnersMax = 40 - bidState.fCardPts;
    } else if (nPartnersBid - nPreviousBid <= 5) {
      bidState.m_fPartnersMin = 6;
      bidState.m_fPartnersMax = 12;
      if (nPartnersSuit === nPreviousSuit && isSuit(nPreviousSuit)) {
        fAdjPts = bidState.fAdjPts = hand.revalueHand(REVALUE_DECLARER, nPreviousSuit, true);
      }
    } else {
      return super.handleConventionResponse(context);
    }

    bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
    bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
    bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

    // shift to another suit is forcing for one round
    if (
      (nPartnersBidLevel === 2 || nPartnersBidLevel === 3) &&
      nPartnersSuit !== nPreviousSuit &&
      isSuit(nPartnersSuit)
    ) {
      status.stream(
        `HRW2! Partner responded to our weak ${bidState.szPVB} opening by shifting to ${bidState.szPS} which is forcing for one round, and asks for a raise with 3-card trump support or a doubleton honor.\n`,
      );

      if (numSupportCards >= 3 || (numSupportCards === 2 && bidState.numHonorsInPartnersSuit >= 1)) {
        nBid = makeBid(nPartnersSuit, nPartnersBidLevel + 1);
        status.stream(
          `HRWT10! And with adequate support for partner's ${bidState.szPS} (holding ${bidState.szHP}), we dutifully raise to ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        return nBid;
      }

      if (bidState.nPreviousSuitStrength >= SuitStrength.Strong && fPts >= 8) {
        nBid = bidState.getCheapestShiftBid(nPreviousSuit);
        status.stream(
          `HRWT14! But without adequate support for partner's ${bidState.szPS} (holding ${bidState.szHP}), and with ${fCardPts}/${fPts} points in hand, we have to rebid our own ${bidState.szPVS} suit at ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        return nBid;
      }

      nBid = Bid.Pass;
      status.stream(
        `HRWT20! But we lack adequate support for partner's ${bidState.szPS} (holding ${bidState.szHP}), and don't have enough strength to rebid our own suit, so we have to pass.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    // 2NT Ogust
    if (nPartnersBid === Bid.NT2 && bidState.conventions.isConventionEnabled(ConventionId.Ogust)) {
      status.stream(
        `B3F20! Partner bid 2NT in response to our weak ${bidState.szPVB}. asking for the quality of our hand (Ogust convention).\n`,
      );
      if (bidState.numPreviousSuitCards >= 6 && bidState.numPreviousSuitPoints >= 9) {
        nBid = Bid.NT3;
        status.stream(
          `HRWT30! And with an excellent ${bidState.szPVS} suit (holding ${bidState.szHPV}), respond to Ogust with 3NT.\n`,
        );
      } else if (
        bidState.numPreviousSuitPoints >= 5 &&
        hand.getNumCardsInSuit(nPreviousSuit) > 1 &&
        (hand.getCardInSuit(nPreviousSuit, 1)?.faceValue ?? 0) !== JACK
      ) {
        if (fPts <= 8) {
          nBid = Bid.D3;
          status.stream(
            `HRWT32! And with a good suit ${bidState.szPVS} suit (holding ${bidState.szHPV}) and ${fPts} points, respond to Ogust with 3D.\n`,
          );
        } else {
          nBid = Bid.S3;
          status.stream(
            `HRWT34! And with a good suit ${bidState.szPVS} suit (holding ${bidState.szHPV}s) and ${fPts} points, respond to Ogust with 3S.\n`,
          );
        }
      } else {
        if (fPts <= 8) {
          nBid = Bid.C3;
          status.stream(
            `HRWT36! And with a moderate ${bidState.szPVS} suit (holding ${bidState.szHPV}) and ${fPts} points, respond to Ogust with 3C.\n`,
          );
        } else {
          nBid = Bid.H3;
          status.stream(
            `HRWT38! And with a good suit ${bidState.szPVS} suit (holding ${bidState.szHPV}) and ${fPts} points, respond to Ogust with 3H.\n`,
          );
        }
      }
      bidState.setBid(nBid);
      return nBid;
    }

    // 2NT feature ask (without Ogust)
    if (nPartnersBid === Bid.NT2 && !bidState.conventions.isConventionEnabled(ConventionId.Ogust)) {
      status.stream(
        `HRWT40! Partner responded to our opening weak ${bidState.szPVB} bid with 2NT, showing a trump fit and asking for an outside Ace or King.\n`,
      );
      let nSuit: Suit | typeof NONE = NONE;
      let bAceFound = false;
      if (hand.numAces > 1 || (hand.numAces === 1 && !hand.suitHasAce(nPreviousSuit))) {
        for (let i = 0; i < 4; i++) {
          if (i !== nPreviousSuit && hand.suitHasAce(i as Suit)) {
            nSuit = i as Suit;
            bAceFound = true;
            break;
          }
        }
      }
      if (!isSuit(nSuit)) {
        if (hand.numKings > 1 || (hand.numKings === 1 && !hand.suitHasKing(nPreviousSuit))) {
          for (let i = 0; i < 4; i++) {
            if (i !== nPreviousSuit && hand.suitHasKing(i as Suit)) {
              nSuit = i as Suit;
              break;
            }
          }
        }
      }

      if (isSuit(nSuit)) {
        nBid = bidState.getCheapestShiftBid(nSuit);
        status.stream(
          `HRWT41! Show our outside ${bAceFound ? 'Ace' : 'King'} with a bid of ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nBid = bidState.getCheapestShiftBid(nPreviousSuit);
        status.stream(
          `HRWT42! Unfortunately, we have no outside Aces or Kings, so bail out at ${bidToFullString(nBid)}.\n`,
        );
      }
      bidState.setBid(nBid);
      return nBid;
    }

    // raise to 3-level
    if (nPartnersBidLevel === 3 && nPartnersSuit === nPreviousSuit) {
      nBid = Bid.Pass;
      bidState.setAgreedSuit(nPreviousSuit);
      status.stream(
        `HRWT42! Partner responded to our weak ${bidState.szPVS} bid with a weak raise to ${bidState.szPB}.  The partnership likely lacks enough points for game, so pass.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    // raise to 4-level
    if (nPartnersBidLevel === 4 && nPartnersSuit === nPreviousSuit) {
      bidState.m_fPartnersMin = 13;
      bidState.m_fPartnersMax = 19;
      bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
      bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;
      nBid = Bid.Pass;
      bidState.setAgreedSuit(nPreviousSuit);
      status.stream(
        `HRWT50! Partner responded to our weak ${bidState.szPVS} bid with a game raise to ${bidState.szPB}, so accept it and pass.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    nBid = Bid.Pass;
    status.stream(
      `HRWT80! After our weak ${bidState.szPVB} opening bid, assume partner's ${bidState.szPB} bid is to play, so pass.\n`,
    );
    bidState.setBid(nBid);
    return nBid;
  }
}
