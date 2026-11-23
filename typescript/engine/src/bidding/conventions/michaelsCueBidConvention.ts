//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// MichaelsCueBidConvention.cpp -> michaelsCueBidConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidLevel,
  bidSuit,
  bidToFullString,
  isBid,
  isMajor,
  isMinor,
  isSuit,
  makeBid,
  Position,
  Suit,
} from '../../constants.js';
import { REVALUE_DECLARER } from '../../hand.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_MAJOR_GAME, PTS_MINOR_GAME, SuitStrength } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

function getTeam(pos: Position): number {
  if (pos === Position.North || pos === Position.South) return 0;
  if (pos === Position.East || pos === Position.West) return 1;
  return -1;
}

export class MichaelsCueBidConvention extends Convention {
  constructor() {
    super(ConventionId.Michaels);
  }

  //
  // TryConvention()
  //
  // check if we can use a Michaels Cue Bid here
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    // test conditions 1, 2, & 4
    if (
      bidState.nRHOBid >= Bid.C1 &&
      bidState.nRHOBid <= Bid.S1 &&
      ((bidState.fPts >= bidState.openPts(6) && bidState.fPts <= bidState.openPts(11)) ||
        bidState.fPts >= bidState.openPts(17)) &&
      bidState.m_numBidTurns === 0 &&
      bidState.m_numPartnerBidTurns === 0
    ) {
      // passed
    } else {
      return null;
    }

    // test condition #3
    const nOppSuit = bidState.nRHOSuit as Suit;
    let bEnoughLength = false;

    if (isMinor(nOppSuit)) {
      // need 5/5 in the majors, or 5 + good 4
      const numHearts = hand.getNumCardsInSuit(Suit.Hearts);
      const numSpades = hand.getNumCardsInSuit(Suit.Spades);
      if (
        hand.getSuitStrength(Suit.Hearts) < SuitStrength.MarginalOpener ||
        hand.getSuitStrength(Suit.Spades) < SuitStrength.MarginalOpener ||
        Math.abs(hand.getSuitStrength(Suit.Hearts) - hand.getSuitStrength(Suit.Spades)) > 1
      ) {
        return null;
      }

      if (numHearts >= 5 && numSpades >= 5) {
        bEnoughLength = true;
        status.stream('2MCL1! We have at least 5/5 in the majors, so we can make a Michaels cue bid.\n');
      } else if (
        numHearts >= 5 &&
        numSpades === 4 &&
        hand.getSuitStrength(Suit.Spades) >= SuitStrength.Strong
      ) {
        bEnoughLength = true;
        status.stream(
          '2MCL2! We have 5/4 in the majors, but the 4 Spades are strong, so we can make a Michaels cue bid.\n',
        );
      } else if (
        numHearts === 4 &&
        numSpades >= 5 &&
        hand.getSuitStrength(Suit.Hearts) >= SuitStrength.Strong
      ) {
        bEnoughLength = true;
        status.stream(
          '2MCL3! We have 5/4 in the majors, but the 4 Hearts are strong, so we can make a Michaels cue bid.\n',
        );
      }
    } else {
      // need 5 in the unbid major, and 5 in a minor
      const nOtherMajor = nOppSuit === Suit.Hearts ? Suit.Spades : Suit.Hearts;
      const numMajors = hand.getNumCardsInSuit(nOtherMajor);
      const numClubs = hand.getNumCardsInSuit(Suit.Clubs);
      const numDiamonds = hand.getNumCardsInSuit(Suit.Diamonds);

      // check that the major suit is OK
      if (numMajors < 5 || hand.getSuitStrength(nOtherMajor) < SuitStrength.MarginalOpener) {
        return null;
      }

      // then check the minor & compare the suits
      if (
        numClubs >= 5 &&
        hand.getSuitStrength(Suit.Clubs) >= SuitStrength.MarginalOpener &&
        Math.abs(hand.getSuitStrength(nOtherMajor) - hand.getSuitStrength(Suit.Clubs)) <= 1
      ) {
        bEnoughLength = true;
        status.stream(
          `2MCL5! We have 5+ cards in ${Card.suitToString(nOtherMajor)} and 5+ cards in a minor (Clubs), so we can make a Michaels cue bid.\n`,
        );
      } else if (
        numDiamonds >= 5 &&
        hand.getSuitStrength(Suit.Diamonds) >= SuitStrength.MarginalOpener &&
        Math.abs(hand.getSuitStrength(nOtherMajor) - hand.getSuitStrength(Suit.Diamonds)) <= 1
      ) {
        bEnoughLength = true;
        status.stream(
          `2MCL5! We have 5+ cards in ${Card.suitToString(nOtherMajor)} and 5+ cards in a minor (Diamonds), so we can make a Michaels cue bid.\n`,
        );
      }
    }

    if (!bEnoughLength) return null;

    // OK, go ahead and cue-bid the enemy suit
    const nBid = makeBid(nOppSuit, 2);
    status.stream(
      `MCL9! With a 2-suited hand, make a Michaels cue bid over RHO's ${Card.suitToString(nOppSuit)} with a bid of ${bidToFullString(nBid)}.\n`,
    );
    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return nBid;
  }

  //
  // RespondToConvention()
  //
  // respond to partner's Michaels Cue Bid
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersPrevSuit = bidState.nPartnersPrevSuit;
    let nBid: Bid = Bid.Pass;
    let nSuit: Suit;
    const fPts = bidState.fPts;

    const nStatus = bidState.getConventionStatus(this);
    if (nStatus === ConventionStatus.Inactive) {
      const nLastValidBid = bidState.nLastValidBid;
      const nOpeningBid = bidState.getOpeningBid();
      const nOpeningBidder = bidState.getOpeningBidder();
      const bLHOMajor = isMajor(bidSuit(nOpeningBid));

      if (
        isBid(nOpeningBid) &&
        getTeam(nOpeningBidder) !== getTeam(context.bidContext.position) &&
        nOpeningBid >= Bid.C1 &&
        nOpeningBid <= Bid.S1 &&
        nPartnersSuit === bidState.nLHOSuit &&
        nPartnersBidLevel === 2 &&
        bidState.m_numBidsMade === 0
      ) {
        status.stream(
          `MCLR10! Partner has made a Michaels Cue bid of ${bidToFullString(nPartnersBid)}, indicating 5/5 length in ${
            bLHOMajor
              ? bidState.nLHOSuit === Suit.Hearts
                ? 'Spades and a minor'
                : 'Hearts and a minor'
              : 'the majors'
          }.\n`,
        );
      } else {
        return null;
      }

      // did partner bid a minor, indicating both majors?
      if (isMinor(nPartnersSuit)) {
        nSuit = bidState.pickSuperiorSuit(Suit.Hearts, Suit.Spades);
        if (hand.getNumCardsInSuit(nSuit) < 3) {
          const nOtherSuit = nSuit === Suit.Hearts ? Suit.Spades : Suit.Hearts;
          if (hand.getNumCardsInSuit(nOtherSuit) >= 3) {
            nSuit = nOtherSuit;
          }
        }
      } else if (nPartnersSuit === Suit.Hearts) {
        if (hand.getNumCardsInSuit(Suit.Spades) >= 3) {
          nSuit = Suit.Spades;
        } else {
          if (
            hand.getSuitStrength(Suit.Clubs) >= SuitStrength.ModerateSupport ||
            hand.getSuitStrength(Suit.Diamonds) >= SuitStrength.ModerateSupport
          ) {
            nSuit = Suit.NoTrump;
          } else {
            nSuit = Suit.Spades;
          }
        }
      } else {
        if (hand.getNumCardsInSuit(Suit.Hearts) >= 3) {
          nSuit = Suit.Hearts;
        } else {
          if (
            hand.getSuitStrength(Suit.Clubs) >= SuitStrength.ModerateSupport ||
            hand.getSuitStrength(Suit.Diamonds) >= SuitStrength.ModerateSupport
          ) {
            nSuit = Suit.NoTrump;
          } else {
            nSuit = Suit.Hearts;
          }
        }
      }

      // now adjust point count
      if (isSuit(nSuit)) {
        bidState.setAgreedSuit(nSuit);
        bidState.fAdjPts = hand.revalueHand(REVALUE_DECLARER, nSuit, true);
      }
      // partner may have 6-11 OR 17+ pts; assume it's a weak hand
      bidState.adjustPartnershipPoints(6, 11);

      const strChoices = isMinor(nPartnersSuit)
        ? 'the two majors'
        : nPartnersSuit === Suit.Hearts
          ? 'Spades and a minor'
          : 'Hearts and an unknown minor';
      const numTrumps = isSuit(nSuit) ? hand.getNumCardsInSuit(nSuit) : 0;

      // set initial convention status to finished
      bidState.setConventionStatus(this, ConventionStatus.Finished);

      if (nSuit === Suit.NoTrump) {
        nBid = Bid.NT2;
        if (nBid > nLastValidBid) {
          if (nPartnersSuit === Suit.Hearts) {
            status.stream(
              `MCLR12! Given a choice between a ${hand.getNumCardsInSuit(Suit.Spades)}-card Spade suit and an unknown minor, we're forced to ask for the minor by bidding ${bidToFullString(nBid)}.\n`,
            );
          } else {
            status.stream(
              `MCLR12! Given a choice between a ${hand.getNumCardsInSuit(Suit.Hearts)}-card Heart suit and an unknown minor, we're forced to ask for the minor by bidding ${bidToFullString(nBid)}.\n`,
            );
          }
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
        } else {
          nBid = Bid.Pass;
          status.stream(
            "MCLR13! We'd like to bid 2NT to ask for partner's minor, but we can't do so after RHO's interference, so we have to pass.\n",
          );
        }
      } else if (
        numTrumps >= 5 &&
        bidState.m_fMinTPPoints <= bidState.pointCount(20) &&
        isMajor(nSuit) &&
        makeBid(nSuit, 4) > nLastValidBid
      ) {
        nBid = makeBid(nSuit, 4);
        status.stream(
          `MCLR15! With ${numTrumps} ${Card.suitToString(nSuit)} and a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, make a shutout bid in ${Card.suitToString(nSuit)} by jumping to ${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.m_fMinTPPoints <= bidState.pointCount(21)) {
        nBid = bidState.getCheapestShiftBid(nSuit, nLastValidBid);
        if (bidLevel(nBid) === 2) {
          status.stream(
            `MCLR20! Given a choice between ${strChoices}, respond to partner's Michaels with the preferred ${Card.suitToSingularString(nSuit)} suit with a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          status.stream(
            "MCLR21! After RHO interference, we don't have the points to go to the 3-level in response to partner's Michaels, so pass.\n",
          );
        }
      } else if (bidState.m_fMinTPPoints <= bidState.pointCount(24)) {
        nBid = makeBid(nSuit, 3);
        if (nBid > nLastValidBid) {
          status.stream(
            `MCLR24! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership and a choice between ${strChoices}, invite game in ${Card.suitToString(nSuit)} by jumping to ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          status.stream(
            "MCLR25! After RHO interference, we don't have the points to go to the 4-level in response to partner's Michaels, so pass.\n",
          );
        }
      } else if (isMinor(nSuit) && bidState.m_fMinTPPoints <= bidState.pointCount(27)) {
        nBid = bidState.getGameBid(nSuit);
        if (nBid > nLastValidBid) {
          status.stream(
            `MCLR27! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership and a choice between ${strChoices}, jump to the 4-level in ${Card.suitToString(nSuit)} with a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          status.stream(
            "MCLR28! After RHO interference, we don't have the points to go to the 5-level in response to partner's Michaels, so pass.\n",
          );
        }
      } else {
        nBid = bidState.getGameBid(nSuit);
        if (nBid > nLastValidBid) {
          status.stream(
            `MCLR30! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership and a choice between ${strChoices}, jump to game in ${Card.suitToString(nSuit)} at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          status.stream(
            "MCLR31! After RHO interference, we don't want to bid past game, so pass.\n",
          );
        }
      }

      bidState.setBid(nBid);
      return nBid;
    } else if (nStatus === ConventionStatus.RespondedRound1) {
      // round 2 -- we must've bid 2NT last time to ask for partner's minor
      if (nPartnersSuit === nPartnersPrevSuit) {
        // partner has 17+ pts
        bidState.adjustPartnershipPoints(bidState.openPts(17), Math.min(17, 40 - bidState.fCardPts));

        if (fPts >= bidState.pointCount(15)) {
          nBid = Bid.NT4;
          status.stream(
            `MCLR35! Partner cue bid the enemy suit again, indicating a strong Michaels opening hand with ${bidState.openPts(17)}+ pts; so with ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, ask for the other minor by bidding ${bidToFullString(nBid)}.\n`,
          );
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
        } else {
          nBid = Bid.NT3;
          status.stream(
            `MCLR36! Partner cue bid the enemy suit again, indicating a strong Michaels opening hand with ${bidState.openPts(17)}+ pts; but with ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, stop at game with a natural bid of ${bidToFullString(nBid)}.\n`,
          );
          bidState.setConventionStatus(this, ConventionStatus.Finished);
        }
        bidState.setBid(nBid);
        return nBid;
      }

      if (!isMinor(nPartnersSuit)) {
        status.stream(
          'MCLR40! After his opening Michaels Cue Bid, partner did not respond properly to our 2NT minor suit inquiry, so michaels is off.\n',
        );
        bidState.setConventionStatus(this, ConventionStatus.Error);
        return null;
      }

      let nAgreedSuit: Suit;
      if (hand.getNumCardsInSuit(nPartnersSuit as Suit) >= 3) {
        status.stream(
          `4MCLR41! Since we have ${hand.getNumCardsInSuit(nPartnersSuit as Suit)} cards in the ${Card.suitToSingularString(nPartnersSuit as Suit)} suit, choose that suit for our response.\n`,
        );
        nAgreedSuit = nPartnersSuit as Suit;
      } else {
        nAgreedSuit = bidState.pickSuperiorSuit(nPartnersSuit as Suit, bidState.nPartnersPrevSuit as Suit);
        if (nAgreedSuit === nPartnersSuit) {
          status.stream(
            `4MCLR42! The ${Card.suitToSingularString(nPartnersSuit as Suit)} suit isn't great, but it's better than ${Card.suitToString(bidState.nPartnersPrevSuit as Suit)}, so choose that suit for our response.\n`,
          );
        } else {
          status.stream(
            `4MCLR43! The ${Card.suitToSingularString(nPartnersSuit as Suit)} suit is poor, so pick the major suit (${Card.suitToString(bidState.nPartnersPrevSuit as Suit)}) for our response.\n`,
          );
        }
        bidState.setAgreedSuit(nAgreedSuit);
      }

      bidState.setAgreedSuit(nAgreedSuit);
      bidState.fAdjPts = hand.revalueHand(REVALUE_DECLARER, nAgreedSuit, true);
      bidState.adjustPartnershipPoints();

      if (isMinor(nAgreedSuit)) {
        if (bidState.m_fMinTPPoints <= PTS_MINOR_GAME - 6) {
          nBid = Bid.Pass;
        } else if (bidState.m_fMinTPPoints <= PTS_MINOR_GAME - 4) {
          nBid = makeBid(nAgreedSuit, 4);
        } else {
          nBid = makeBid(nAgreedSuit, 5);
        }
        if (nBid === Bid.Pass) {
          status.stream(
            `MCLR45! Partner showed his minor to be ${Card.suitToString(nPartnersSuit as Suit)}, which we can support with ${hand.getNumCardsInSuit(nPartnersSuit as Suit)} trumps, but with only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we have to pass.\n`,
          );
        } else {
          status.stream(
            `MCLR46! Partner showed his minor to be ${Card.suitToString(nPartnersSuit as Suit)}, which we can support with ${hand.getNumCardsInSuit(nPartnersSuit as Suit)} trumps, so with ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we bid ${bidToFullString(nBid)}.\n`,
          );
        }
      } else {
        if (bidState.m_fMinTPPoints < PTS_MAJOR_GAME) {
          nBid = makeBid(nAgreedSuit, 3);
        } else {
          nBid = makeBid(nAgreedSuit, 4);
        }
        if (bidLevel(nBid) === 3) {
          status.stream(
            `MCLR47! With ${hand.getNumCardsInSuit(nAgreedSuit)}-card support for partner's ${Card.suitToString(nAgreedSuit)}, and with only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we have to pass.\n`,
          );
        } else {
          status.stream(
            `MCLR47! With ${hand.getNumCardsInSuit(nAgreedSuit)}-card support for partner's ${Card.suitToString(nAgreedSuit)}, and with ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we can go to game at ${bidToFullString(nBid)}.\n`,
          );
        }
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    } else if (nStatus === ConventionStatus.RespondedRound2) {
      // round 3 -- not implemented in C++
    }

    return null;
  }

  //
  // HandleConventionResponse()
  //
  // Rebidding as opener after partner responds to a Michaels Cue Bid
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    const nStatus = bidState.getConventionStatus(this);
    if (
      nStatus !== ConventionStatus.InvokedRound1 &&
      nStatus !== ConventionStatus.InvokedRound2 &&
      nStatus !== ConventionStatus.InvokedRound3
    ) {
      return null;
    }

    let nBid: Bid = Bid.Pass;
    const fPts = bidState.fPts;
    const nPreviousSuit = bidState.nPreviousSuit;
    const nPreviousBidLevel = bidState.nPreviousBidLevel;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;

    if (nStatus === ConventionStatus.Invoked) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      if (bidState.fPts >= bidState.pointCount(17)) {
        nBid = makeBid(nPreviousSuit as Suit, 3);
        status.stream(
          `MCLRH12! with a strong Michaels hand (${bidState.fPts} pts), cue bid the enemy suit again at ${bidToFullString(nBid)} to indicate our strength.\n`,
        );
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
        return nBid;
      }

      if (isMajor(nPreviousSuit) && nPartnersBid === Bid.NT2) {
        const nSuit = bidState.getLongerSuit(Suit.Clubs, Suit.Diamonds);
        nBid = makeBid(nSuit, 3);
        status.stream(
          `MCLRH10! With the weak flavor of Michaels, respond to partner's Michaels minor inquiry with a bid of ${bidToFullString(nBid)}, indicating ${Card.suitToString(nSuit)} as the unknown minor.\n`,
        );
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
        return nBid;
      }

      if (nPartnersSuit === nPreviousSuit && nPartnersBidLevel === nPreviousBidLevel + 1) {
        const nCheapestSuit = isMinor(nPreviousSuit)
          ? Suit.Hearts
          : bidState.getLongerSuit(Suit.Clubs, Suit.Diamonds);

        status.stream('2MCLRH20! Partner cue bid the enemy suit, which is a game or slam try.\n');
        if (bidState.fPts >= bidState.pointCount(17)) {
          status.stream(
            `MCLRH21! And with ${bidState.fPts} pts in hand, proceed towards slam in the preferred ${Card.suitToSingularString(bidState.nPrefSuit as Suit)} suit.\n`,
          );
          bidState.invokeBlackwood(bidState.nPrefSuit as Suit);
          nBid = bidState.m_nBid;
        } else if (
          (isMajor(nCheapestSuit) && bidState.fPts >= bidState.pointCount(9)) ||
          (isMinor(nCheapestSuit) && bidState.fPts >= bidState.pointCount(12))
        ) {
          nBid = bidState.getGameBid(nCheapestSuit);
          status.stream(
            `MCLRH22! But with only ${bidState.fPts} pts in hand, forget about slam and stop at game in the cheapest suit (${Card.suitToString(nCheapestSuit)}) at ${bidToFullString(nBid)}.\n`,
          );
          bidState.setBid(nBid);
        } else {
          nBid = bidState.getCheapestShiftBid(nCheapestSuit);
          status.stream(
            `MCLRH23! But with only ${bidState.fPts} pts in hand, forget about slam and bail out in the cheapest suit (${Card.suitToString(nCheapestSuit)}) at ${bidToFullString(nBid)}.\n`,
          );
          bidState.setBid(nBid);
        }
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      }

      if (bidState.isGameBid(nPartnersBid)) {
        status.stream(
          `MCLRH30! Partner responded to our Michaels Cue bid with a game bid of ${bidState.szPB}, so we should pass.\n`,
        );
        nBid = Bid.Pass;
      } else if (nPartnersBid !== Bid.Pass) {
        status.stream(
          `2MCLRH40! Partner responded to our Michaels Cue bid with a bid of ${bidState.szPB}, a possible invitation to game.\n`,
        );
        if (fPts < bidState.pointCount(17)) {
          nBid = Bid.Pass;
          status.stream(
            `MCLRH41! But since we opened Michaels with a weak hand (${fPts}) pts, we likely do not have the points for game and have to pass.\n`,
          );
        } else {
          nBid = bidState.getGameBid(nPartnersSuit as Suit);
          status.stream(
            `MCLRH42! and since we opened Michaels with a strong hand (${fPts}) pts, we can raise to game at ${bidToFullString(nBid)}.\n`,
          );
        }
      } else {
        status.stream(
          `2MCLRH49! Partner passed${bidState.bLHOInterfered ? 'after opponents interference' : ''}, so Michaels is off.\n`,
        );
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return null;
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    } else if (nStatus === ConventionStatus.InvokedRound2) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      if (bidState.fPts >= bidState.pointCount(17)) {
        if (nPartnersBid === Bid.NT4) {
          const nSuit = bidState.getLongerSuit(Suit.Clubs, Suit.Diamonds);
          nBid = bidState.getCheapestShiftBid(nSuit);
          status.stream(
            `MCLRH50! After our second Michaels cue bid of the enemy suit, partner still wants to see the unknown minor, so show it (${Card.suitToString(nSuit)}) with a bid of ${bidToFullString(nBid)}.\n`,
          );
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.InvokedRound3);
          return nBid;
        }

        if (bidState.isGameBid(nPartnersBid)) {
          if (fPts < bidState.pointCount(20)) {
            status.stream(
              `MCLRH55! Partner responded to our second Michaels cue bid with a game bid of ${bidState.szPB}, so we should pass.\n`,
            );
            nBid = Bid.Pass;
          } else {
            nBid = makeBid(nPartnersSuit as Suit, 6);
            status.stream(
              `MCLRH55! Partner responded to our second Michaels cue bid with a game bid of ${bidState.szPB}, and with ${fPts}+ in hand, we can go ahead and jump to slam at ${bidToFullString(nBid)}.\n`,
            );
          }
        } else if (nPartnersBid !== Bid.Pass) {
          nBid = bidState.getGameBid(nPartnersSuit as Suit);
          status.stream(
            `MCLRH56! Partner responded to our second Michaels cue bid of the enemy suit with a bid of ${bidState.szPB}, an invitation to game -- so go ahead and bid game at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          if (bidState.bLHOInterfered) {
            status.stream(
              'MCLRH58! Partner passed our second Michaels cue bid after interference, so we have to pass also.\n',
            );
          } else {
            status.stream(
              'MCLRH59! Partner passed in spite of our second Michaels cue bid, so we should pass also.\n',
            );
          }
          nBid = Bid.Pass;
        }
      } else {
        if (bidState.isGameBid(nPartnersBid)) {
          status.stream(
            `MCLRH60! Partner responded to our Michaels minors answer with a game bid of ${bidState.szPB}, so we should pass.\n`,
          );
          nBid = Bid.Pass;
        } else if (nPartnersBid !== Bid.Pass) {
          status.stream(
            `MCLRH70! Partner responded to our Michaels minor answer with a bid of ${bidState.szPB}, a possible invitation to game.\n`,
          );
          if (fPts < bidState.pointCount(17)) {
            nBid = Bid.Pass;
            status.stream(
              `MCLRH72! But since we opened Michaels with a weak hand (${fPts}) pts, we likely do not have the points for game and have to pass.\n`,
            );
          } else {
            nBid = bidState.getGameBid(nPartnersSuit as Suit);
            status.stream(
              `MCLRH72! and since we opened Michaels with a strong hand (${fPts}) pts, we can raise to game at ${bidToFullString(nBid)}.\n`,
            );
          }
        } else {
          if (bidState.bLHOInterfered) {
            status.stream(
              'MCLRH75! Partner passed our Michaels minor answer after interference, so we have to pass also.\n',
            );
          } else {
            status.stream(
              'MCLRH76! Partner passed our Michaels minor answer, so we should pass also.\n',
            );
          }
          nBid = Bid.Pass;
        }
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    } else if (nStatus === ConventionStatus.InvokedRound3) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      if (bidState.isGameBid(nPartnersBid)) {
        if (fPts < bidState.pointCount(20)) {
          status.stream(
            `MCLRH80! Partner responded to our Michaels minor answer with a game bid of ${bidState.szPB}, so we should pass.\n`,
          );
          nBid = Bid.Pass;
        } else {
          nBid = makeBid(nPartnersSuit as Suit, 6);
          status.stream(
            `MCLRH81! Partner responded to our Michaels minor answer with a game bid of ${bidState.szPB}, and with ${fPts}+ in hand, we can go ahead and jump to slam at ${bidToFullString(nBid)}.\n`,
          );
        }
      } else if (nPartnersBid !== Bid.Pass) {
        nBid = bidState.getGameBid(nPartnersSuit as Suit);
        status.stream(
          `MCLRH85! Partner responded to our Michaels minor answer with a bid of ${bidState.szPB}, an invitation to game -- so go ahead and bid game at ${bidToFullString(nBid)}.\n`,
        );
      } else {
        if (bidState.bLHOInterfered) {
          status.stream(
            'MCLRH86! Partner passed our Michaels minor answer after interference, so we have to pass also.\n',
          );
        } else {
          status.stream(
            'MCLRH87! Partner passed in spite of our Michaels minor answer, so we should pass also.\n',
          );
        }
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
