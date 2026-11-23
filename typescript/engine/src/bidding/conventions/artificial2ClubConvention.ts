//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// Artificial2ClubConvention.cpp -> artificial2ClubConvention.ts
//

import {
  Bid,
  bidLevel,
  bidToFullString,
  isMajor,
  isMinor,
  isSuit,
  makeBid,
  Suit,
} from '../../constants.js';
import { REVALUE_DUMMY } from '../../hand.js';
import { BiddingOption, ConventionId, ConventionStatus } from '../biddingCodes.js';
import {
  PTS_GAME,
  PTS_GRAND_SLAM,
  PTS_MAJOR_GAME,
  PTS_MINOR_GAME,
  PTS_NT_GAME,
  PTS_SLAM,
  PTS_SMALL_SLAM,
  SuitStrength,
} from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class Artificial2ClubConvention extends Convention {
  constructor() {
    super(ConventionId.Artificial2Club);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    const { hand, status } = context;

    if (!bidState) {
      if (hand.highCardPoints < 22) return null;
      context.bidContext.status = ConventionStatus.Invoked;
      return Bid.C2;
    }

    if (bidState.nLastValidRecordedBid !== Bid.Pass) return null;

    const fMinPts = bidState.conventions.getValue(BiddingOption.TwoClubOpeningPoints);
    if (bidState.fCardPts >= fMinPts || bidState.numLikelyWinners >= 10) {
      const nBid = Bid.C2;
      status.stream(
        `STR2C! Have ${bidState.fCardPts}/${bidState.fPts} points and ${bidState.numLikelyWinners} playing tricks, so bid an artificial strong ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.InvokedRound1);
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

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersSuitSupport = bidState.nPartnersSuitSupport;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const numPartnerBidsMade = bidState.m_numPartnerBidsMade;
    let nBid: Bid;

    if (bidState.getConventionStatus(this) === ConventionStatus.Responded) {
      if (bidState.nPreviousBid === Bid.D2) {
        status.stream(
          `R2CLR2! Partner showed his best suit of ${bidState.szPS} in response to our negative 2D response.\n`,
        );

        const fAdjPts = (bidState.fAdjPts = isSuit(bidState.nPartnersSuit)
          ? hand.revalueHand(REVALUE_DUMMY, bidState.nPartnersSuit, true)
          : bidState.fPts);
        const fCardPts = bidState.fCardPts;

        bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
        bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

        if (bidState.m_fMinTPPoints <= PTS_GAME - 2) {
          nBid = Bid.Pass;
          status.stream(
            `R2CLR10! But with only ${bidState.m_fMinTPPoints} points in the partnership, we have to pass.\n`,
          );
        } else {
          if (
            nPartnersSuitSupport >= SuitStrength.ModerateSupport &&
            isSuit(nPartnersSuit) &&
            nPartnersBid < bidState.getGameBid(nPartnersSuit)
          ) {
            nBid = bidState.getGameBid(nPartnersSuit);
            status.stream(
              `R2CLR20! Raise partner's & ${bidState.szPS} to game at ${bidToFullString(nBid)}.\n`,
            );
          } else if (
            isSuit(bidState.nPrefSuit) &&
            bidState.isSuitOpenable(bidState.nPrefSuit) &&
            nPartnersBidLevel <= 3
          ) {
            nBid = bidState.getCheapestShiftBid(bidState.nPrefSuit);
            status.stream(
              `R2CLR22! Bid our own ${bidState.szPrefSS} suit in preference to partner's ${bidState.szPSS} suit .\n`,
            );
          } else if (nPartnersBid < Bid.NT3) {
            nBid = Bid.NT3;
            status.stream(
              `R2CLR25! With only ${bidState.supportLevelToString(nPartnersSuit)} support for partner and no good suit of our own, bid 3NT.\n`,
            );
          } else {
            nBid = Bid.Pass;
            status.stream(
              `R2CLR30! With only ${bidState.supportLevelToString(nPartnersSuit)} support for partner and no good suit of our own, we have to pass.\n`,
            );
          }
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      }

      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return null;
    }

    if (
      nPartnersBid === Bid.C2 &&
      bidState.m_bPartnerOpenedForTeam &&
      numPartnerBidsMade === 1 &&
      nPartnersBid === bidState.getValidBidRecord(0)
    ) {
      bidState.setConventionStatus(this, ConventionStatus.Responded);
    } else {
      return null;
    }

    const twoClubPts = bidState.conventions.getValue(BiddingOption.TwoClubOpeningPoints);
    status.stream(
      `R2CLUB! Partner made an artificial bid of 2 Clubs, showing either a game suit or ${twoClubPts}+ points.  We want to respond positively if interested in a slam.\n`,
    );

    bidState.m_bGameForceActive = true;

    const fPts = bidState.fPts;
    const fCardPts = bidState.fCardPts;
    const nPrefSuit = bidState.nPrefSuit as Suit;
    const nPrefSuitStrength = bidState.nPrefSuitStrength;

    bidState.adjustPartnershipPoints(twoClubPts, 40 - fCardPts);

    if (bidState.m_fMinTPPoints < PTS_SLAM) {
      nBid = Bid.D2;
      status.stream(
        `R2C04! With only ${fCardPts}/${fPts} points, we deny interest in slam by making the negative response of ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    status.stream(
      `2R2C08! With a total of ${bidState.m_fMinTPPoints}+ points in the partnership, we want to invite slam.\n`,
    );

    if (nPrefSuitStrength >= SuitStrength.Openable && isSuit(nPrefSuit)) {
      nBid = makeBid(nPrefSuit, isMajor(nPrefSuit) ? 2 : 3);
      status.stream(
        `R2C14! With  ${fCardPts}/${fPts} points in hand, and a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, we express possible interest in slam by showing our best suit (${bidState.szPrefS}) with a bid of ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    if (bidState.bPrefSuitIsSolid && isSuit(nPrefSuit)) {
      nBid = makeBid(nPrefSuit, isMajor(nPrefSuit) ? 3 : 4);
      status.stream(
        `R2C18! With ${fCardPts}/${fPts} points in hand and a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} points in the partnership, we express interest in a slam by showing our solid ${bidState.szPrefSS} suit in a jump bid of ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    if (bidState.bBalanced) {
      nBid = bidState.m_fMinTPCPoints >= PTS_NT_GAME ? Bid.NT3 : Bid.NT2;
      status.stream(
        `R2C22! With ${fCardPts} HCPs and a balanced hand, and a total of ${bidState.m_fMinTPCPoints}+ HCPs in the partnership, we respond with ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      return nBid;
    }

    nBid = bidState.getCheapestShiftBid(nPrefSuit, Bid.C2);
    status.stream(
      `R2C26! With ${fCardPts}/${fPts} points but with no strong suit and an unbalanced hand, we have to respond with our best suit of ${bidState.szPrefS} by bidding ${bidToFullString(nBid)}.\n`,
    );
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

    const nStatus = bidState.getConventionStatus(this);
    if (nStatus <= 0) return null;

    let nBid: Bid = Bid.Pass;
    const fAdjPts = bidState.fAdjPts;
    const fCardPts = bidState.fCardPts;
    const nPrefSuit = bidState.nPrefSuit as Suit;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nPartnersSuitSupport = bidState.nPartnersSuitSupport;
    const bBalanced = bidState.bBalanced;
    const bSemiBalanced = bidState.bSemiBalanced;

    if (nStatus === ConventionStatus.InvokedRound1) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      if (nPartnersBid === Bid.D2) {
        status.stream(
          'CRB0! After our strong 2 Club opening, partner\'s 2 Diamond bid is a negative response, denying slam values (less than 1 Quick Trick).\n',
        );

        bidState.m_fPartnersMin = 0;
        bidState.m_fPartnersMax = 6;
        bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
        bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
        bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

        if (bidState.m_fMinTPCPoints >= PTS_NT_GAME && bidState.m_fMinTPCPoints < PTS_SMALL_SLAM) {
          if (bBalanced || bSemiBalanced) {
            nBid = Bid.NT3;
            status.stream(
              `CRB1! With a balanced distribution and ${fCardPts} HCPs in hand, rebid ${bidToFullString(nBid)}.\n`,
            );
          } else if (
            (isMajor(nPrefSuit) && bidState.m_fMinTPPoints >= PTS_MAJOR_GAME) ||
            (isMinor(nPrefSuit) && bidState.m_fMinTPPoints >= PTS_MINOR_GAME)
          ) {
            nBid = bidState.getGameBid(nPrefSuit);
            status.stream(
              `CRB2! With no help from partner, we have to unilaterally push on to game at ${bidToFullString(nBid)}.\n`,
            );
          }
          bidState.setConventionStatus(this, ConventionStatus.Finished);
        } else if (
          bidState.m_fMinTPCPoints >= PTS_SMALL_SLAM &&
          bidState.m_fMinTPCPoints < PTS_GRAND_SLAM
        ) {
          if (bBalanced || bSemiBalanced) {
            nBid = Bid.NT6;
            status.stream(
              `CRB4! With a balanced distribution and ${fCardPts} HCPs in hand, bid a slam at ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = makeBid(nPrefSuit, 6);
            status.stream(
              `CRB5! With no help from partner but with a total of ${bidState.m_fMinTPPoints} points in the partnership, we have to unilaterally push on to a slam at ${bidToFullString(nBid)}.\n`,
            );
          }
          bidState.setConventionStatus(this, ConventionStatus.Finished);
        } else if (bidState.m_fMinTPCPoints >= PTS_GRAND_SLAM) {
          if (bBalanced || bSemiBalanced) {
            nBid = Bid.NT7;
            status.stream(
              `CRB6! With a balanced distribution and ${fCardPts} HCPs in hand, bid a grand slam at ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = makeBid(nPrefSuit, 7);
            status.stream(
              `CRB5! With no help from partner but with a total of ${bidState.m_fMinTPPoints} points in the partnership, we have to unilaterally push on to a grand slam at ${bidToFullString(nBid)}.\n`,
            );
          }
          bidState.setConventionStatus(this, ConventionStatus.Finished);
        } else {
          nBid = bidState.getCheapestShiftBid(nPrefSuit);
          status.stream(
            `CRB8! Show our strongest suit (${bidState.szPrefS}) with a bid of ${bidToFullString(nBid)}.\n`,
          );
          bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
        }

        bidState.setBid(nBid);
        return nBid;
      }

      status.stream(
        `2CRB20! After our strong 2 Club opening, partner's ${bidState.szPB} bid was a positive response, indicating 7+ pts and 1+ Quick Tricks.\n`,
      );

      bidState.m_fPartnersMin = 7;
      bidState.m_fPartnersMax = Math.min(22, 40 - fCardPts);
      bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
      bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
      bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;

      if (nPartnersBid === Bid.NT2) {
        if (bSemiBalanced || (nPartnersSuitSupport <= SuitStrength.WeakSupport && bBalanced)) {
          nBid = bidState.m_fMinTPCPoints >= PTS_SLAM ? Bid.NT6 : Bid.NT3;
          if (isSuit(nPartnersSuit))
            status.stream(
              `CRB21! With a balanced hand and ${bidState.supportLevelToString(nPartnersSuit)} support for partner's ${bidState.szPS}, plus a total of ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, move to Notrump and bid ${bidLevel(nBid) >= 6 ? 'slam' : 'game'} at ${bidToFullString(nBid)}.\n`,
            );
          else
            status.stream(
              `CRB22! With a ${!bBalanced ? 'semi-' : ''}balanced hand and a total of ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, raise partner to ${bidLevel(nBid) >= 6 ? 'slam' : 'game'} at ${bidToFullString(nBid)}.\n`,
            );
        } else {
          nBid = bidState.getCheapestShiftBid(nPrefSuit);
          status.stream(
            `CRB25! We don't like Notrump, so so bid our ${bidState.szPrefS} suit at ${bidToFullString(nBid)}.\n`,
          );
        }
        bidState.setBid(nBid);
        return nBid;
      }

      if (isSuit(nPartnersSuit) && nPartnersSuitSupport >= SuitStrength.GoodSupport) {
        if (isMajor(nPartnersSuit)) {
          bidState.m_nAgreedSuit = nPartnersSuit;
          nBid = bidState.getGameBid(nPartnersSuit);
          const bJumped = nPartnersBidLevel === 2;
          status.stream(
            `CRB28! With ${bidState.supportLevelToString(nPartnersSuit)} support for partner's ${bidState.szPS} (holding ${bidState.szHP}), go ahead and ${bJumped ? 'jump' : ''} raise to ${bidToFullString(nBid)}.\n`,
          );
          bidState.setBid(nBid);
        } else {
          status.stream(
            `CRB32! We have ${bidState.supportLevelToString(nPartnersSuit)} support for partner's ${bidState.szPS} (holding ${bidState.szHP}), so push towards slam.\n`,
          );
          bidState.invokeBlackwood(nPartnersSuit);
          bidState.setConventionStatus(this, ConventionStatus.Finished);
        }
        return bidState.m_nBid;
      }

      nBid = bidState.getCheapestShiftBid(nPrefSuit);
      status.stream(
        `CRB44! But we don't like partner's ${bidState.szPSS} suit (holding ${bidState.szHP}), so bid our own ${bidState.szPrefS} suit at ${bidToFullString(nBid)}.\n`,
      );
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    } else if (nStatus === ConventionStatus.InvokedRound2) {
      if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        return super.handleConventionResponse(context);
      }

      if (isSuit(nPartnersSuit) && nPartnersSuit !== bidState.nPreviousSuit) {
        status.stream(
          `CRB60! Partner bid ${bidState.szPB} after we bid our ${bidState.szPVS} suit, indicating a strong preference for the ${bidState.szPS} suit.\n`,
        );

        if (bidState.nPartnersBid < bidState.getGameBid(nPartnersSuit)) {
          if (bidState.nPartnersSuitSupport >= SuitStrength.GoodSupport) {
            nBid = bidState.getGameBid(nPartnersSuit);
            status.stream(
              `CRB62! So with ${bidState.supportLevelToString(nPartnersSuit)} support for partner's ${bidState.szPS}, raise to game at ${bidToFullString(nBid)}.\n`,
            );
          } else {
            nBid = bidState.getCheapestShiftBid(bidState.nPreviousSuit as Suit);
            status.stream(
              `CRB62! But with only ${bidState.supportLevelToString(nPartnersSuit)} support for partner's ${bidState.szPS}, return to our own suit at ${bidToFullString(nBid)}.\n`,
            );
          }
        } else {
          if (bidState.m_fMinTPPoints < PTS_SLAM) {
            nBid = Bid.Pass;
            if (bidState.nPartnersBidLevel < 6)
              status.stream(`CRB68! Partner's ${bidState.szPB} bid is at game level, so pass.\n`);
            else
              status.stream(`CRB69! Partner's ${bidState.szPB} bid is at slam level, so pass.\n`);
          } else {
            if (bidState.nPartnersBidLevel < 6) {
              nBid = Bid.NT6;
              status.stream(
                `CRB72! While we do not have suit agreement, we have the points for a slam, so bid ${bidToFullString(nBid)}.\n`,
              );
            } else {
              nBid = Bid.Pass;
              status.stream('CRB74! Partner has bid slam in his suit, so pass.\n');
            }
          }
        }
      } else if (nPartnersSuit === Suit.NoTrump) {
        if (bSemiBalanced || (nPartnersSuitSupport <= SuitStrength.WeakSupport && bBalanced)) {
          nBid = bidState.m_fMinTPCPoints >= PTS_SLAM ? Bid.NT6 : Bid.NT3;
          status.stream(
            `CRB77! With a ${!bBalanced ? 'semi-' : ''}balanced hand and a total of ${bidState.m_fMinTPCPoints}-${bidState.m_fMaxTPCPoints} HCPs in the partnership, raise partner to ${bidLevel(nBid) >= 6 ? 'slam' : 'game'} at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = bidState.getCheapestShiftBid(nPrefSuit);
          status.stream(
            `CRB78! We don't like Notrump, so so bid our ${bidState.szPrefS} suit at ${bidToFullString(nBid)}.\n`,
          );
        }
        bidState.setBid(nBid);
        return nBid;
      } else {
        status.stream(`CRB80! Partner raised our ${bidState.szPVSS} suit, which is strange, `);
        if (isSuit(nPartnersSuit) && bidState.nPartnersBid < bidState.getGameBid(nPartnersSuit)) {
          nBid = bidState.getGameBid(nPartnersSuit);
          status.stream('but go ahead and raise to game.');
        } else {
          nBid = Bid.Pass;
          status.stream("but since we're at game, stop here and pass.\n");
        }
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    return null;
  }
}
