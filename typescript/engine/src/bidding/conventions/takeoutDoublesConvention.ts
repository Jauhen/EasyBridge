//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// TakeoutDoublesConvention.cpp -> takeoutDoublesConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidLevel,
  bidSuit,
  bidToFullString,
  getNextSuit,
  isMajor,
  isMinor,
  makeBid,
  NONE,
  Suit,
} from '../../constants.js';
import { REVALUE_DECLARER } from '../../hand.js';
import { BiddingOption, ConventionId, ConventionStatus } from '../biddingCodes.js';
import {
  PTS_GAME,
  PTS_GRAND_SLAM,
  PTS_MINOR_GAME,
  PTS_NT_GAME,
  PTS_SLAM,
  PTS_SMALL_SLAM,
  RaiseTarget,
  RebidTarget,
  StoppedCode,
  SuitLength,
  SuitStrength,
  SuitType,
  SupportLength,
} from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class TakeoutDoublesConvention extends Convention {
  constructor() {
    super(ConventionId.TakeoutDoubles);
  }

  //
  // TryConvention()
  //
  // check if we can bid a takeout double here
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status, conventions } = context;

    // test conditions 1, 2, 3, & 4
    if (
      (bidState.nLHOBid > Bid.Pass || bidState.nRHOBid > Bid.Pass) &&
      bidState.nPartnersBid <= Bid.Pass &&
      bidState.fCardPts >= bidState.openPts(12) &&
      (bidState.m_numBidTurns === 0 ||
        (bidState.m_numBidTurns === 1 && bidState.m_nBid === Bid.Double))
    ) {
      // passed
    } else {
      return null;
    }

    // test condition #5
    let nOppSuit: Suit | typeof NONE;
    let nOppBidLevel: number;
    let nOppSuit2: Suit | typeof NONE = NONE;
    let bEnoughLength = true;

    if (bidState.nLHOBid > Bid.Pass) {
      nOppSuit = bidState.nLHOSuit;
      nOppBidLevel = bidState.nLHOBidLevel;
      if (bidState.nRHOBid > Bid.Pass && bidState.nRHOBid < Bid.Double) {
        nOppBidLevel = bidState.nRHOBidLevel;
        if (bidSuit(bidState.nRHOBid) !== nOppSuit) {
          nOppSuit2 = bidState.nRHOSuit;
        }
      }
    } else {
      nOppSuit = bidState.nRHOSuit;
      nOppBidLevel = bidState.nRHOBidLevel;
    }

    let nSuit: Suit = (nOppSuit === NONE || nOppSuit === Suit.NoTrump ? Suit.Clubs : nOppSuit) as Suit;
    for (let i = 0; i < 3; i++) {
      nSuit = getNextSuit(nSuit);
      if (
        nSuit !== nOppSuit2 &&
        (bidState.numCardsInSuit[nSuit] < 3 ||
          bidState.nSuitStrength[nSuit] < SuitStrength.WeakSupport)
      ) {
        bEnoughLength = false;
        break;
      }
    }
    if (!bEnoughLength) return null;

    // also can't takeout at a level higher than 3
    if (nOppBidLevel > 3) return null;

    // or if 3-level takeouts are disabled
    if (nOppBidLevel === 3 && conventions && !conventions.isOptionEnabled(BiddingOption.ThreeLevelTakeouts)) {
      return null;
    }

    // if the opponents bid at the 3-level, we need 13+ pts
    if (nOppBidLevel === 3 && bidState.fCardPts < bidState.openPts(13)) {
      return null;
    }

    // test condition #6
    if (nOppSuit !== NONE && nOppSuit !== Suit.NoTrump && bidState.numCardsInSuit[nOppSuit] >= 4) {
      return null;
    }

    // if we're doubling a second time, need 14+ HCPs
    let bDoublingTwice = false;
    if (
      bidState.m_numBidTurns === 1 &&
      bidState.m_nBid === Bid.Double &&
      bidState.getConventionStatus(this) === ConventionStatus.Invoked
    ) {
      if (bidState.fCardPts < bidState.openPts(14)) {
        return null;
      }
      bDoublingTwice = true;
    }

    // finally, apply test #7
    const n1NTMin = conventions?.getNTRangeMin(1) ?? 15;
    const n1NTMax = conventions?.getNTRangeMax(1) ?? 17;
    const n2NTMin = conventions?.getNTRangeMin(2) ?? 20;
    const n2NTMax = conventions?.getNTRangeMax(2) ?? 21;
    const n3NTMin = conventions?.getNTRangeMin(3) ?? 25;
    const n3NTMax = conventions?.getNTRangeMax(3) ?? 27;
    const fCardPts = bidState.fCardPts;
    if (
      bidState.bBalanced &&
      ((fCardPts >= bidState.openPts(n1NTMin) && fCardPts <= n1NTMax && nOppBidLevel === 1) ||
        (fCardPts >= bidState.openPts(n2NTMin) && fCardPts <= n2NTMax && nOppBidLevel <= 2) ||
        (fCardPts >= bidState.openPts(n3NTMin) && fCardPts <= n3NTMax && nOppBidLevel <= 3))
    ) {
      return null;
    }

    status.stream(
      `TKOUT! With ${bidState.fPts}/${bidState.fPts} points and support for all unbid suits, bid a takeout double${bDoublingTwice ? 'again' : ''}.\n`,
    );
    const nBid = Bid.Double;
    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return nBid;
  }

  //
  // RespondToConvention()
  //
  // respond to partner's takeout double
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status, conventions } = context;

    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    let nBid: Bid = Bid.Pass;
    const nPartnersBid = bidState.nPartnersBid;
    const nLastValidBid = bidState.nLastValidBid;
    const nLastValidBidLevel = bidLevel(nLastValidBid);
    const bSecondDouble = bidState.nPartnersPrevBid === Bid.Double;
    const nConventionStatus = bidState.getConventionStatus(this);

    // apply tests #1, 2, and 3
    if (
      nPartnersBid === Bid.Double &&
      bidState.nRound <= 2 &&
      bidState.m_nBid <= Bid.Pass &&
      nLastValidBidLevel <= 3
    ) {
      status.stream('TKOTR! Partner has doubled for takeout.\n');
    } else if (
      bidState.getConventionStatus(this) === ConventionStatus.RespondedRound1 &&
      nPartnersBid !== Bid.Pass
    ) {
      status.stream(
        `2TKOTRx! Partner bid ${bidState.szPB} after his takeout and our ${bidState.szPVB} response.\n`,
      );
    } else {
      return null;
    }

    // see if partner's double for takeout at the 3-level is valid
    if (
      nLastValidBidLevel === 3 &&
      conventions &&
      !conventions.isOptionEnabled(BiddingOption.ThreeLevelTakeouts)
    ) {
      status.stream(
        "5TKOTR2! Since 3-level takeouts are not enabled, partner's double here must be for penalties.\n",
      );
      return null;
    }

    if (nConventionStatus === ConventionStatus.Inactive) {
      // handle first bid after the takeout
      let nPartnersPoints = 12;
      if (nLastValidBidLevel === 3) nPartnersPoints++;
      if (bSecondDouble) {
        status.stream("4TKORT5! Partner's second double in a row indicates extra points.\n");
        nPartnersPoints += 2;
      }

      bidState.m_fPartnersMin = bidState.openPts(nPartnersPoints);
      bidState.m_fPartnersMax = Math.min(bidState.openPts(22), 40 - bidState.fCardPts);
      bidState.m_fMinTPPoints = bidState.fPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPPoints = bidState.fPts + bidState.m_fPartnersMax;
      bidState.m_fMinTPCPoints = bidState.fCardPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPCPoints = bidState.fCardPts + bidState.m_fPartnersMax;
      status.stream(
        `2TKORT8! Partner's takeout indicates ${bidState.m_fPartnersMin}+ HCPs, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points.\n`,
      );

      // see if RHO has redoubled or bid
      if (bidState.nRHOBid === Bid.Redouble) {
        status.stream('TKOTR10! Right-hand opponent has redoubled, but ignore it.\n');
      } else if (bidState.nRHOBid > Bid.Pass) {
        status.stream(
          "TKOTR12! But Right-hand opponent has bid after partner's double, so the takeout is no longer in effect.\n",
        );
        nBid = bidState.getCheapestShiftBid(bidState.nPrefSuit as Suit, bidState.nRHOBid);
        const nLevel = bidLevel(nBid);
        const nPartnersContrib = 12;
        if (
          (nLevel === 1 && bidState.fCardPts >= PTS_NT_GAME - 7 - nPartnersContrib) ||
          (nLevel === 2 && bidState.fCardPts >= PTS_NT_GAME - 3 - nPartnersContrib) ||
          (nLevel === 3 && bidState.fCardPts >= PTS_NT_GAME - 1 - nPartnersContrib) ||
          (nLevel === 4 && bidState.fCardPts >= PTS_NT_GAME + 1 - nPartnersContrib)
        ) {
          status.stream(
            `TKOTR14! However, assuming partner has 12+ HCPs, that amount combined with our ${bidState.fCardPts}/${bidState.fPts} points totals ${bidState.fCardPts + 12}/${bidState.fPts + 12} pts, which is enough for us to bid ${bidToFullString(nBid)}.\n`,
          );
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
        } else {
          status.stream(
            `TKOTR17! And with only ${bidState.fCardPts}/${bidState.fPts} points, we choose to pass.\n`,
          );
          bidState.setBid(Bid.Pass);
          bidState.setConventionStatus(this, ConventionStatus.Inactive);
        }
        return bidState.m_nBid;
      }

      // now make the bid
      let nSuit: Suit | typeof NONE;
      const fCardPts = bidState.fCardPts;
      const fPts = bidState.fPts;
      const nEnemyBid = bidState.nLastValidBid;
      const nEnemyBidLevel = bidLevel(nEnemyBid);
      const nEnemySuit = bidSuit(nEnemyBid);

      // with 6-9.5 pts and a balanced hand, bid 1NT
      if (bidState.bBalanced && fCardPts >= bidState.openPts(6) && fCardPts < bidState.openPts(10)) {
        nBid = Bid.NT1;
        status.stream(
          `TKOTR20! With ${fCardPts} HCPs and a balanced hand, respond with ${bidToFullString(nBid)}.\n`,
        );
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
        return nBid;
      }

      // else with 0-9.5 pts, bid the longest suit (or a reasonably long major)
      if (fPts < bidState.openPts(10)) {
        nSuit = hand.getLongestSuit();
        if (nSuit === nEnemySuit) {
          const nAltSuit = hand.getSuitsByLength(1);
          if (hand.getSuitLength(nAltSuit) >= 4) {
            status.stream(
              `TKOTR20a! Our longest suit of ${Card.suitToString(nSuit)} happens to be the enemy suit, so respond in the next-longest suit of ${Card.suitToString(nAltSuit)}.\n`,
            );
            nSuit = nAltSuit;
          } else {
            nBid = Bid.Pass;
            status.stream(
              `TKOTR20c! Our longest suit of ${Card.suitToString(nSuit)} happens to be the enemy suit, and we don't have a decent alternate suit, nor do we have the 13+ pts required to cue-bid the enemy suit, so we have to pass.\n`,
            );
            bidState.setBid(nBid);
            bidState.setConventionStatus(this, ConventionStatus.Finished);
            return nBid;
          }
          nBid = bidState.getCheapestShiftBid(nSuit, nEnemyBid);
        } else {
          const nOrigSuit = nSuit;
          if (isMinor(nSuit)) {
            let newSuit = hand.getSuitsByLength(1);
            if (!isMajor(newSuit)) newSuit = hand.getSuitsByLength(2);
            if (
              bidState.numCardsInSuit[newSuit] >= bidState.numCardsInSuit[nSuit] - 1 &&
              bidState.numSuitPoints[newSuit] >= bidState.numSuitPoints[nSuit] - 1 &&
              newSuit !== nEnemySuit
            ) {
              nSuit = newSuit;
            }
          } else {
            const nOtherMajor = nSuit === Suit.Spades ? Suit.Hearts : Suit.Spades;
            if (
              bidState.numCardsInSuit[nOtherMajor] === bidState.numCardsInSuit[nSuit] &&
              bidState.nSuitStrength[nOtherMajor] > bidState.nSuitStrength[nSuit] &&
              nOtherMajor !== nEnemySuit
            ) {
              nSuit = nOtherMajor;
            }
          }
          nBid = bidState.getCheapestShiftBid(nSuit, nEnemyBid);
          if (nSuit !== nOrigSuit && bidState.numCardsInSuit[nSuit] < bidState.numCardsInSuit[nOrigSuit]) {
            status.stream(
              `TKOTR21! With ${fCardPts}/${fPts} pts, respond in the major suit of ${Card.suitToString(nSuit)} (even though it's not our longest suit) at a bid of ${bidToFullString(nBid)}.\n`,
            );
          } else {
            status.stream(
              `TKOTR22! With ${fCardPts}/${fPts} pts, respond with our longest suit of ${Card.suitToString(nSuit)} at a bid of ${bidToFullString(nBid)}.\n`,
            );
          }
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
        return nBid;
      }

      // with 10+ pts
      const nPrefSuit = bidState.nPrefSuit as Suit;
      nSuit = NONE;
      const nSecondSuit = bidState.getNextBestSuit(nPrefSuit);
      let nLength = 0;

      if (isMajor(nPrefSuit) && bidState.numPrefSuitCards >= 5 && (nPrefSuit !== nEnemySuit || fPts >= 13)) {
        nSuit = nPrefSuit;
        nLength = bidState.numPrefSuitCards;
      } else if (
        isMajor(nSecondSuit) &&
        bidState.numCardsInSuit[nSecondSuit] >= 5 &&
        (nSecondSuit !== nEnemySuit || fPts >= 13)
      ) {
        nSuit = nSecondSuit;
        nLength = bidState.numCardsInSuit[nSecondSuit];
      }

      if (nSuit !== NONE) {
        if (fPts >= bidState.openPts(13)) {
          nBid = bidState.getGameBid(nSuit);
          status.stream(
            `TKOTR20! With ${fCardPts}/${fPts} pts and a ${nLength}-card ${Card.suitToSingularString(nSuit)} suit, jump to game at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = makeBid(nSuit, 3);
          status.stream(
            `TKOTR22! With ${fCardPts}/${fPts} pts and a ${nLength}-card ${Card.suitToSingularString(nSuit)} suit, ${
              nEnemyBidLevel < Bid.NT1 ? ' jump to ' : ' bid '
            }${bidToFullString(nBid)}.\n`,
          );
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
        return nBid;
      }

      // else see if we can bid 2NT or 3NT
      if (bidState.bBalanced) {
        if (fCardPts >= bidState.openPts(13)) {
          if (nEnemySuit !== Suit.NoTrump && nEnemySuit !== NONE && hand.isSuitStopped(nEnemySuit)) {
            nBid = Bid.NT3;
            status.stream(
              `TKOTR30! With ${fCardPts} HCPs, a balanced hand, and the opponents' ${Card.suitToSingularString(nEnemySuit)} stopped, respond with a bid of ${bidToFullString(nBid)}.\n`,
            );
          } else if (nEnemySuit === Suit.NoTrump) {
            nBid = Bid.NT3;
            status.stream(
              `TKOTR30! With ${fCardPts} HCPs, a balanced hand, respond with a bid of ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = Bid.NT2;
            status.stream(
              `TKOTR32! We have ${fCardPts} HCPs and a balanced hand, which would be enough for a response of 3NT, but the opponents' ${Card.suitToSingularString(nEnemySuit as Suit)} is not securely stopped, so just bid ${bidToFullString(nBid)}.\n`,
            );
          }
        } else {
          nBid = Bid.NT2;
          status.stream(
            `TKOTR33! With ${fCardPts} HCPs and a balanced hand, respond with a bid of ${bidToFullString(nBid)}.\n`,
          );
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
        return nBid;
      }

      // with >= 13 pts, bid the enemy suit; with less (10-13), jump in the suit
      if (fPts >= bidState.openPts(13) && nEnemySuit !== Suit.NoTrump && nEnemySuit !== NONE) {
        nBid = makeBid(nEnemySuit, nEnemyBidLevel + 1);
        status.stream(
          `TKOTR50! With ${fCardPts}/${fPts} pts but without a long suit, make a game-forcing bid by bidding the opponents' suit at ${bidToFullString(nBid)}.\n`,
        );
      } else {
        nSuit = hand.getLongestSuit();
        nBid = bidState.getJumpShiftBid(nSuit, nEnemyBid, 1);
        status.stream(
          `TKOTR55! With ${fCardPts}/${fPts} pts and no long major suit, jump to ${bidToFullString(nBid)}${
            nSuit === nEnemySuit ? ", even though it's the enemy suit." : '.'
          }\n`,
        );
      }
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
      return nBid;
    } else if (nConventionStatus === ConventionStatus.RespondedRound1) {
      // handle the second bid after the takeout
      const nPartnersSuit = bidState.nPartnersSuit;
      const nPreviousSuit = bidState.nPreviousSuit;
      const nPrefSuit = bidState.nPrefSuit as Suit;

      if (nPartnersSuit !== nPreviousSuit && nPreviousSuit !== Suit.NoTrump) {
        bidState.m_fPartnersMin = 16;
        bidState.m_fPartnersMax = Math.max(16, 40 - bidState.fCardPts - 12);
        bidState.m_fMinTPPoints = bidState.fAdjPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPPoints = bidState.fAdjPts + bidState.m_fPartnersMax;
        bidState.m_fMinTPCPoints = bidState.fCardPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPCPoints = bidState.fCardPts + bidState.m_fPartnersMax;
        status.stream(
          `TKOTR60! Partner shifted to a new suit after our response of ${bidState.szPVB} to his takeout, indicating that he has ${bidState.m_fPartnersMin}+ pts, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points.\n`,
        );
      } else {
        if (nPreviousSuit !== NONE && nPreviousSuit !== Suit.NoTrump) {
          bidState.fAdjPts = hand.revalueHand(REVALUE_DECLARER, nPreviousSuit, true);
        }
        bidState.m_fMinTPPoints = bidState.fAdjPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPPoints = bidState.fAdjPts + bidState.m_fPartnersMax;
        bidState.m_fMinTPCPoints = bidState.fCardPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPCPoints = bidState.fCardPts + bidState.m_fPartnersMax;
      }

      const fMinTPPoints = bidState.m_fMinTPPoints;
      const fMaxTPPoints = bidState.m_fMaxTPPoints;

      if (fMinTPPoints < bidState.openPts(20)) {
        status.stream(
          `TKOTR62! With a total of only ${fMinTPPoints}-${fMaxTPPoints} points in the partnership, we have to pass.\n`,
        );
        bidState.setBid(Bid.Pass);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return Bid.Pass;
      }

      const nEnemyBid = bidState.getValidBidRecord(0);
      const nEnemySuit = bidSuit(nEnemyBid);

      if (nPartnersSuit === nPreviousSuit) {
        if (
          bidState.rebidSuitEngine(SuitType.Any, RebidTarget.At2, PTS_GAME - 6, PTS_GAME - 4, 4) ||
          bidState.rebidSuitEngine(SuitType.Any, RebidTarget.At3, PTS_GAME - 3, PTS_GAME - 1, 5) ||
          bidState.rebidSuitEngine(SuitType.Any, RebidTarget.At4, PTS_GAME, PTS_SLAM - 1, 5) ||
          bidState.rebidSuitEngine(SuitType.Minor, RebidTarget.At4, PTS_MINOR_GAME - 3, PTS_MINOR_GAME - 1, 5) ||
          bidState.rebidSuitEngine(SuitType.Minor, RebidTarget.At5, PTS_MINOR_GAME, PTS_SLAM - 1, 5)
        ) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (fMinTPPoints < PTS_SLAM) {
          status.stream(
            `TKOTR65! With a total in the partnership of ${fMinTPPoints}-${fMaxTPPoints} points, we sign off on partner's bid of ${bidState.szPB}.\n`,
          );
          bidState.setBid(Bid.Pass);
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return Bid.Pass;
        } else {
          bidState.setConventionStatus(this, ConventionStatus.Finished);
          bidState.invokeBlackwood(nPreviousSuit as Suit);
          return bidState.m_nBid;
        }
      } else {
        if (
          bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To2, PTS_GAME - 5, PTS_GAME - 3, SupportLength.Len3) ||
          bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To3, PTS_GAME - 2, PTS_GAME - 1, SupportLength.Len3)
        ) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (bidState.nPartnersBidLevel === 2 && bidState.numSupportCards < 3) {
          if (bidState.bidNoTrumpEngine(2, PTS_GAME - 2, PTS_GAME - 1, false, StoppedCode.AllOther, nPartnersSuit as Suit)) {
            bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
            return bidState.m_nBid;
          }
        }

        if (bidState.rebidSuitEngine(SuitType.Any, RebidTarget.Cheapest, PTS_GAME - 3, PTS_GAME - 1, 6)) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (fMinTPPoints < PTS_GAME) {
          let nSuit = bidState.getNextBestSuit(nPreviousSuit as Suit, nPartnersSuit as Suit);
          if (nSuit === nEnemySuit) {
            nSuit = bidState.getFourthSuit(nPreviousSuit as Suit, nPartnersSuit as Suit, nEnemySuit as Suit);
          }
          nBid = bidState.getCheapestShiftBid(nSuit);
          if (bidState.nSuitStrength[nSuit] >= SuitStrength.MarginalOpener && bidState.isBidSafe(nBid)) {
            status.stream(
              `TKOTR68! With ${fMinTPPoints}-${fMaxTPPoints} points in the partnership and ${bidState.SLTS(bidState.nPartnersSuit)} support for partner's ${bidState.szPS}, we shift to ${Card.suitToString(nSuit)} at a bid of ${bidToFullString(nBid)}.\n`,
            );
            bidState.setBid(nBid);
            bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          } else {
            if (
              bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To2, PTS_GAME - 5, PTS_GAME - 3, SupportLength.Len2)
            ) {
              bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
            } else if (
              bidState.raisePartnersSuitEngine(SuitType.Any, RaiseTarget.To3, PTS_GAME - 2, PTS_GAME - 1, SupportLength.Len2)
            ) {
              bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
            } else {
              status.stream(
                `TKOTR70! Unfortunately, with only ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, ${bidState.SLTS(bidState.nPartnersSuit)} support for partner's ${bidState.szPS}, and no other good suits we can bid safely, we have to pass.\n`,
              );
              bidState.setBid(Bid.Pass);
              bidState.setConventionStatus(this, ConventionStatus.Finished);
            }
          }
          return bidState.m_nBid;
        }

        // 26+ min total points
        if (
          bidState.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3) ||
          bidState.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME + 1, PTS_SLAM - 1, SupportLength.Len2)
        ) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (bidState.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_SLAM - 1, false, StoppedCode.AllOther, nPartnersSuit as Suit)) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }
        if (bidState.bidNoTrumpEngine(2, PTS_GAME, PTS_SLAM - 1, false, StoppedCode.DontCare)) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (
          bidState.rebidSuitEngine(
            SuitType.Major,
            RebidTarget.At4,
            PTS_GAME,
            PTS_SLAM - 1,
            6,
            SuitStrength.SelfSupporting,
            3,
          )
        ) {
          status.stream(
            `TKOTR80! With a self-supporting ${bidState.szPrefS} suit and ${fMinTPPoints}-${fMaxTPPoints}+ team points, jump to game at ${bidToFullString(bidState.m_nBid)}.\n`,
          );
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (bidState.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To3, PTS_GAME, PTS_SLAM - 1, SupportLength.Len2)) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (
          bidState.rebidSuitEngine(
            SuitType.Minor,
            RebidTarget.At5,
            PTS_MINOR_GAME,
            PTS_SLAM - 1,
            7,
            SuitStrength.SelfSupporting,
            3,
          )
        ) {
          status.stream(
            `TKOTR82! With a self-supporting ${bidState.szPrefS} suit and ${fMinTPPoints}+ team points, jump to game at ${bidToFullString(bidState.m_nBid)}.\n`,
          );
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (
          bidState.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To5, PTS_MINOR_GAME, PTS_SLAM - 1, SupportLength.Len3) ||
          bidState.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To4, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3)
        ) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        }

        if (
          bidState.rebidSuitEngine(SuitType.Major, RebidTarget.Cheapest, PTS_GAME, PTS_SLAM - 1, 6, SuitStrength.Strong) ||
          bidState.rebidSuitEngine(SuitType.Minor, RebidTarget.Cheapest, PTS_MINOR_GAME, PTS_SLAM - 1, 6, SuitStrength.Strong)
        ) {
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return bidState.m_nBid;
        } else if (fMinTPPoints < PTS_SLAM) {
          nBid = bidState.getCheapestShiftBid(nPreviousSuit as Suit);
          status.stream(
            `TKOTR85! With ${fMinTPPoints}-${fMaxTPPoints} points in the partnership but only ${bidState.SLTS(bidState.nPartnersSuit)} support for partner's ${bidState.szPS}, we rebid our ${bidState.szPVSS} suit at ${bidToFullString(nBid)}.\n`,
          );
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.RespondedRound2);
          return nBid;
        }

        // with 32+ min total points, think slam
        let nSuit: Suit;
        if (bidState.numPrefSuitCards >= 6 && bidState.nPrefSuitStrength >= SuitStrength.Strong) {
          nSuit = nPrefSuit;
        } else if (bidState.numSupportCards >= 3) {
          nSuit = nPartnersSuit as Suit;
        } else {
          nSuit = Suit.NoTrump;
        }
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        bidState.invokeBlackwood(nSuit);
        return bidState.m_nBid;
      }
    }

    return null;
  }

  //
  // HandleConventionResponse()
  //
  // Rebidding as opener after partner responds to a takeout double
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    const nStatus = bidState.getConventionStatus(this);
    if (nStatus !== ConventionStatus.InvokedRound1 && nStatus !== ConventionStatus.InvokedRound2) {
      return null;
    }

    const fAdjPts = bidState.fAdjPts;
    const fCardPts = bidState.fCardPts;
    const nPrefSuit = bidState.nPrefSuit as Suit;
    const nPreviousSuit = bidState.nPreviousSuit;
    const bBalanced = bidState.bBalanced;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersPrevSuit = bidState.nPartnersPrevSuit;

    if (nStatus === ConventionStatus.InvokedRound1) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      if (nPartnersBid === Bid.Pass) {
        if (bidState.nLHOBid >= Bid.Pass) {
          status.stream(
            '2TKRb10! After interference from the left-hand opponent, partner passed our takeout.\n',
          );
        } else {
          status.stream(
            '2TKRb12! Partner unexpectedly passed our takeout double, which is supposed to be forcing.  Bidding will proceed as if the takeout was not made\n',
          );
        }
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return null;
      }

      let bPartnerJumped = false;
      let bPartnerJumpedToGame = false;
      const nEnemyBid = bidState.getValidBidRecord(0);
      const nEnemySuit = bidSuit(nEnemyBid);
      if (nPartnersBid - nEnemyBid > 5) bPartnerJumped = true;
      if (nPartnersBid === bidState.getGameBid(nPartnersSuit as Suit)) bPartnerJumpedToGame = true;
      let bWantedToOvercall = false;

      if (nPartnersSuit === Suit.NoTrump) {
        if (nPartnersBid === Bid.NT1) {
          bidState.m_fPartnersMin = 6;
          bidState.m_fPartnersMax = 9;
        } else if (nPartnersBid === Bid.NT2) {
          bidState.m_fPartnersMin = 10;
          bidState.m_fPartnersMax = 12;
        } else if (nPartnersBid === Bid.NT3) {
          bidState.m_fPartnersMin = 13;
          bidState.m_fPartnersMax = 40 - fCardPts;
          status.stream(
            "TKRb20! Partner's response of 3NT to our takeout double indicates that the opponent's suit is well stopped.\n",
          );
        } else {
          status.stream(
            `TKRb21! Partner's response of ${bidToFullString(nPartnersBid)} to our takeout double is unorthodox; treating it like a 3NT response.\n`,
          );
          bidState.m_fPartnersMin = 13;
          bidState.m_fPartnersMax = Math.min(22, 40 - fCardPts);
        }

        if (!(isMajor(bidState.nPrefSuit) && bidState.numPrefSuitCards >= 6) && bidState.bSemiBalanced) {
          bidState.m_nAgreedSuit = Suit.NoTrump;
        }
        bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
        bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;
        status.stream(
          `TKRb29! Partner's response of ${bidToFullString(nPartnersBid)} to our takeout double indicates ${bidState.m_fPartnersMin}-${bidState.m_fPartnersMax} HCPs, for a total of ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} / ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership.\n`,
        );
      } else {
        if (
          bidState.pool?.overcalls &&
          bidState.getConventionStatus(bidState.pool.overcalls) === ConventionStatus.Subsumed
        ) {
          bWantedToOvercall = true;
        }
        if (nPartnersSuit === nEnemySuit) {
          status.stream(
            'TKORb40! Partner has responded in the enemy suit, indicating 13+ pts but no long suits.\n',
          );
          bidState.m_fPartnersMin = 13;
          bidState.m_fPartnersMax = Math.min(22, 40 - bidState.fCardPts);
          bidState.m_bGameForceActive = true;
        } else if (bPartnerJumpedToGame) {
          status.stream(
            `TKORb41! Partner has jumped to game in ${Card.suitToString(nPartnersSuit as Suit)}, indicating 13+ pts and a 5+ card suit.\n`,
          );
          bidState.m_fPartnersMin = 30;
          bidState.m_fPartnersMax = Math.min(22, 40 - bidState.fCardPts);
          if (!bWantedToOvercall) bidState.m_nAgreedSuit = nPartnersSuit;
        } else if (bPartnerJumped) {
          status.stream(
            `TKORb42! Partner has made a jump response of ${bidToFullString(nPartnersBid)}, indicating 10-12 pts and a 4-5 card suit.\n`,
          );
          bidState.m_fPartnersMin = 10;
          bidState.m_fPartnersMax = 12;
          if (!bWantedToOvercall) bidState.m_nAgreedSuit = nPartnersSuit;
        } else {
          status.stream(
            `TKORb43! Partner has made a minimum response of ${bidToFullString(nPartnersBid)}, indicating no more than 9 points.\n`,
          );
          bidState.m_fPartnersMin = 0;
          bidState.m_fPartnersMax = 9;
          if (!bWantedToOvercall) bidState.m_nAgreedSuit = nPartnersSuit;
        }
        bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
        bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;
        status.stream(
          `2TKRb49! The total point count in the partnership is therefore ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts.\n`,
        );
      }

      if (
        bidState.nRHOBid > Bid.Pass &&
        bidState.nRHOBid !== Bid.Double &&
        bidState.nRHOBid !== Bid.Redouble
      ) {
        status.stream(
          'TKRb51! The right-hand opponent has bid after partner\'s response, interfering with our communication.\n',
        );
      }

      let nBid: Bid;
      if (bidState.m_nAgreedSuit > NONE) {
        if (bidState.m_nAgreedSuit === Suit.NoTrump) {
          if (bidState.bidNoTrumpAsAppropriateEngine(false, StoppedCode.DontCare)) {
            bidState.setConventionStatus(this, ConventionStatus.Finished);
            return bidState.m_nBid;
          }
          nBid = Bid.Pass;
          status.stream(
            `TKRb69! With a total of ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, we have insufficient strength to raise partner's ${bidToFullString(nPartnersBid)} bid, so we have to pass.\n`,
          );
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.Finished);
          return nBid;
        } else {
          if (bPartnerJumpedToGame && bidState.m_fMinTPPoints < PTS_SLAM) {
            status.stream(
              `TKRb70! Partner jumped to game in his ${bidState.szPSS} suit, so with a team total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points, we pass.\n`,
            );
            bidState.setBid(Bid.Pass);
            bidState.setConventionStatus(this, ConventionStatus.Finished);
            return Bid.Pass;
          }

          if (
            bidState.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME - 2, PTS_SLAM - 1, SupportLength.Len4) ||
            bidState.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To4, PTS_GAME, PTS_SLAM - 1, SupportLength.Len3) ||
            bidState.raisePartnersSuitEngine(SuitType.Major, RaiseTarget.To3, PTS_GAME - 5, PTS_GAME - 1, SupportLength.Len3)
          ) {
            if (!bPartnerJumped) {
              status.stream(
                `TKRb71a! (we can assume partner has some strength in the ${bidState.szPSS} suit, so we are shading the requirements slightly.\n`,
              );
            }
            bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
            return bidState.m_nBid;
          }

          if (
            bidState.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To5, PTS_MINOR_GAME - 3, PTS_SLAM - 1, SupportLength.Len4) ||
            bidState.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To5, PTS_MINOR_GAME - 1, PTS_SLAM - 1, SupportLength.Len3) ||
            bidState.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To4, PTS_MINOR_GAME - 3, PTS_MINOR_GAME - 2, SupportLength.Len3) ||
            bidState.raisePartnersSuitEngine(SuitType.Minor, RaiseTarget.To3, PTS_MINOR_GAME - 8, PTS_MINOR_GAME - 4, SupportLength.Len3)
          ) {
            if (!bPartnerJumped) {
              status.stream(
                `TKRb71b! We can assume partner has some strength in the ${bidState.szPSS} suit, so we can shade the requirements slightly.\n`,
              );
            }
            bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
            return bidState.m_nBid;
          }

          if (bidState.m_fMinTPCPoints >= PTS_SLAM) {
            bidState.invokeBlackwood(bidState.m_nAgreedSuit as Suit);
            bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
            return bidState.m_nBid;
          }

          nBid = Bid.Pass;
          status.stream(
            `TKRb90! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, we have insufficient strength to raise partner's ${bidToFullString(nPartnersBid)} bid, so we have to pass.\n`,
          );
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.Finished);
          return nBid;
        }
      }

      // here, we have no suit agreement
      const nLastBid = bidState.nLastValidBid;
      if (bBalanced) {
        if (nEnemySuit !== Suit.NoTrump && nEnemySuit !== NONE && hand.isSuitProbablyStopped(nEnemySuit)) {
          status.stream(
            'TKRb80! Without clear suit agreement, and holding a blanaced hand, we want to steer towards a contract in No Trump.\n',
          );
          if (bidState.bidNoTrumpAsAppropriateEngine(false, StoppedCode.DontCare)) {
            bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
            return bidState.m_nBid;
          }
        }
        status.stream(
          'TKRb81! But as we do not have a proper hand to bid No Trump at the appropriate level, we have to pass.\n',
        );
        bidState.setBid(Bid.Pass);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return Bid.Pass;
      } else if (bidState.numPrefSuitCards >= 5) {
        nBid = bidState.getCheapestShiftBid(nPrefSuit, nLastBid);
        if (bidState.isBidSafe(nBid, 4)) {
          if (bWantedToOvercall) {
            status.stream(
              `TKRb90! Partner's forced response of ${bidState.szPB} not withstanding, we can now show the ${Card.suitToSingularString(nPrefSuit)} suit that we wanted to overcall with last round by bidding ${bidToFullString(nBid)}.\n`,
            );
          } else {
            status.stream(
              `TKRb91! Without clear suit agreement, we bid our ${bidState.numPrefSuitCards}-card ${Card.suitToSingularString(nPrefSuit)} suit at ${bidToFullString(nBid)}.\n`,
            );
          }
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
          return nBid;
        }
      }

      status.stream('TKORb99! We see no good fit with partner and no other options, so pass.\n');
      bidState.setBid(Bid.Pass);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return Bid.Pass;
    } else {
      // responding after partner's second response to our takeout
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }
      if (nPartnersBid === Bid.Pass) {
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return null;
      }

      const fMinTPPoints = bidState.m_fMinTPPoints;
      const fMaxTPPoints = bidState.m_fMaxTPPoints;
      const fMinTPCPoints = bidState.m_fMinTPCPoints;
      const fMaxTPCPoints = bidState.m_fMaxTPCPoints;
      let nBid: Bid = Bid.Pass;

      if (nPartnersSuit === nPreviousSuit) {
        bidState.m_nAgreedSuit = nPreviousSuit;
        if (nPartnersBid >= bidState.getGameBid(nPreviousSuit as Suit)) {
          if (nPartnersBidLevel === 7 || (nPartnersBidLevel === 6 && fMinTPPoints <= PTS_GRAND_SLAM)) {
            nBid = Bid.Pass;
            status.stream(`TKRc10! Partner raised our ${bidState.szPVSS} suit to a slam, so pass.\n`);
          } else if (nPartnersBidLevel <= 6 && fMinTPPoints >= PTS_GRAND_SLAM + 1) {
            nBid = makeBid(nPreviousSuit as Suit, 7);
            status.stream(
              `TKRc11! Partner raised our ${bidState.szPVSS} suit to ${
                nPartnersBidLevel === 6 ? 'slam' : 'game'
              }, but we have the poitns to push to a grand slam, so bid ${bidToFullString(nBid)}.\n`,
            );
          } else if (nPartnersBidLevel < 6 && fMinTPPoints >= PTS_SMALL_SLAM + 1) {
            nBid = makeBid(nPreviousSuit as Suit, 6);
            status.stream(
              `TKRc12! Partner raised our ${bidState.szPVSS} suit to game, but we have the poitns for a slam, so bid ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = Bid.Pass;
            status.stream(
              `TKRc13! Partner raised our ${bidState.szPVSS} suit to game, which is acceptable with ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, so pass.\n`,
            );
          }
        } else {
          if (
            (isMajor(nPreviousSuit) && fMinTPPoints >= PTS_GAME) ||
            (isMinor(nPreviousSuit) && fMinTPPoints >= PTS_MINOR_GAME)
          ) {
            nBid = bidState.getGameBid(nPreviousSuit as Suit);
            status.stream(
              `TKRc20! With a total of ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, raise to game in the ${bidState.szPVSS} suit at ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = bidState.getCheapestShiftBid(nPreviousSuit as Suit);
            if (bidState.isBidSafe(nBid)) {
              status.stream(
                `TKRc22! With a total of ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, we can raise again to ${bidToFullString(nBid)}.\n`,
              );
            } else {
              nBid = Bid.Pass;
              status.stream(
                `TKRc29! With a total of ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, we cannot safely raise any partner further, so pass.\n`,
              );
            }
          }
        }
      } else if (nPartnersSuit === Suit.NoTrump || bidState.bBalanced) {
        if (bidState.bidNoTrumpAsAppropriateEngine(false, StoppedCode.DontCare)) {
          nBid = bidState.m_nBid;
          status.stream(
            `TKRc30! With a total of ${fMinTPCPoints}-${fMaxTPCPoints} HCPs in the partnership, we can bid ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          if (nPartnersSuit === Suit.NoTrump) {
            status.stream(
              "TKRc35! We're willing to accept a contract in NoTrumps, but don't have the points to raise further, so pass.\n",
            );
          } else {
            status.stream(
              "TKRc36! We'd like to play in NoTrumps, but don't have the points to bid agian, so pass.\n",
            );
          }
        }
      } else {
        const nSuit = bidState.getFourthSuit(
          nPreviousSuit as Suit,
          nPartnersSuit as Suit,
          nPartnersPrevSuit as Suit,
        );
        nBid = bidState.getCheapestShiftBid(nSuit);

        if (fMinTPPoints >= PTS_GAME && nBid < bidState.getGameBid(nSuit)) {
          status.stream(
            `TKRc40! With a total of ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership and no suit agreement, bid another suit (${Card.suitToString(nSuit)}) at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.Pass;
          if (nPartnersBid >= bidState.getGameBid(nPartnersSuit as Suit)) {
            status.stream(
              `TKRc45 With a total of ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, partner has gone to game in his suit at ${bidState.szPB}, so pass.\n`,
            );
          } else if (fMinTPPoints >= PTS_GAME) {
            status.stream(
              `TKRc46! With a total of ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, but having run out of bidding room, we have to bail out and pass.\n`,
            );
          } else {
            status.stream(
              `TKRc47! With a total of only ${fMinTPPoints}-${fMaxTPPoints} pts in the partnership, and no agreement in suits, we have to pass.\n`,
            );
          }
        }
      }

      bidState.setBid(nBid);
      bidState.clearConventionStatus(this);
      return nBid;
    }
  }
}
