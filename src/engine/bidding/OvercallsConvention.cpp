//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// OvercallsConvention.cpp
//

#include "stdafx.h"
#include "engine/card_constants.h"
#include "engine/PlayerStatusDialog.h"
#include "engine/bidding/OvercallsConvention.h"
#include "engine/play/HandHoldings.h"
#include "engine/bidding/TakeoutDoublesConvention.h"
#include "engine/bidding/ConventionSet.h"
#include "engine/bidding/ConvCodes.h"
#include "app_interface.h"
#include "engine/bidding/convention_pool.h"


//
//===============================================================================
//
// TryConvention()
//
// check if we can overall the opponents' bid
//
BOOL COvercallsConvention::TryConvention(const CPlayer& player, 
									     const CConventionSet& conventions, 
									     CHandHoldings& hand, 
									     CCardLocation& cardLocation, 
									     CGuessedHandHoldings** ppGuessedHands,
									     CBidEngine& bidState,  
									     CPlayerStatusDialog& status)
{
	// see if we can overcall here
	// - this must be the first round
	// - partner must not have bid yet
	if ( ((bidState.nLHOBid > BID_PASS) || (bidState.nRHOBid > BID_PASS)) &&
		 (bidState.nPartnersBid <= BID_PASS) &&
 		 (bidState.m_numBidTurns == 0))
	{
		// passed the initial tests
		status << "2OVRCL0! Opponents have opened the bidding; see if we can overcall.\n";
	}
	else
	{
		// N/A
		return FALSE;
	}
	
	// the basic requirements for a simple overcall are:
	// - a good 5+ card suit,
	// - 5 playing tricks at the 1-level, or 6 at the 2-level, and
	// - 8-15 points at the 1-level, or 10-15 at the 2 level (taken care of later)
	if ( (bidState.fPts >= app_->OpenPoints(8)) && (bidState.numLikelyWinners >= 5) )
	{
		 // passed the initial tests
	}
	else
	{
		// can't overcall -- but maybe can make some other bid
		status << "2OVRCL3! But we lack the strength for a simple overcall.\n";
		return FALSE;
	}

	//
	// first see what the opponents have bid
	//
	int nSuit,nOppSuit,nOppBid,nOppBidLevel;
	int nOppSuit2 = NONE; 
	if (bidState.nLHOBid > BID_PASS)	// get the first enemy suit
	{
		// LHO has bid
		nOppSuit = bidState.nLHOSuit;
		nOppBid = bidState.nLHOBid;
		nOppBidLevel = bidState.nLHOBidLevel;
		// see if RHO also bid, using a different suit
		if (bidState.nRHOBid > BID_PASS)
		{
			if (BID_SUIT(bidState.nRHOBid) != nOppSuit)
				nOppSuit2 = bidState.nRHOSuit;
			nOppBid = bidState.nRHOBid;
			nOppBidLevel = bidState.nRHOBidLevel;
		}
	}
	else
	{
		// only RHO has bid
		nOppSuit = bidState.nRHOSuit;
		nOppBid = bidState.nRHOBid;
		nOppBidLevel = bidState.nRHOBidLevel;
	}

	// see if opponents have bid too high for us to overcall
	if (nOppBidLevel >= 3)
		return FALSE;

	// see if we have a good 5-card suit that has not been bid yet
	nSuit = bidState.nPrefSuit;
	if ((bidState.numCardsInSuit[nSuit] >= 5) && 
		(ApplySuitStrengthTest(nSuit, nOppBid, bidState)) &&
		(bidState.nPrefSuit != nOppSuit) && (bidState.nPrefSuit != nOppSuit2))
	{
		// okeedokee, got a suit
	}
	else
	{
		// try the second-best suit
		nSuit = hand.GetSuitsByPreference(1);
		if ((bidState.numCardsInSuit[nSuit] >= 5) && 
			(ApplySuitStrengthTest(nSuit, nOppBid, bidState)) &&
			(bidState.nPrefSuit != nOppSuit) && (bidState.nPrefSuit != nOppSuit2))
		{
			// we'll use the second suit
		}
		else
		{
			// failed to find an appropriate overcall suit
			int nLevel = (nSuit > BID_SUIT(nOppBid))? BID_LEVEL(nOppBid) : BID_LEVEL(nOppBid) + 1;
			if (nLevel == 1)
				status << "2OVRCL6! But we don't have a sufficiently strong overcall suit.\n";
			else
				status << "2OVRCL6a! But we don't have a suit strong enough to overcall with at the " &
						nLevel & "-level.\n";
			return FALSE;
		}
	}

	//
	// at this point, we've found an appropriate suit; 
	// so see what our overcall would be
	//
	int nBid,nBidLevel;

	// see if we should bid a jump overcall, strong or weak
	nBid = bidState.GetJumpShiftBid(nSuit, nOppBid);
	if (BID_LEVEL(nBid) < 3)
	{
		// see if we can make a weak jump shift
		if (conventions.IsConventionEnabled(tidWeakJumpOvercalls))
		{
			// we're playing weak jump shifts, so see if the hand qualifies
			// need 6-10 pts, a decent 6-card suit, and 6+ winners(?)
			if ((bidState.fPts >= app_->OpenPoints(6)) && (bidState.fPts <= app_->OpenPoints(10)) && 
				(bidState.numCardsInSuit[nSuit] >= 6) && (bidState.nSuitStrength[nSuit] >= SS_OPENABLE))
//				(bidState.numLikelyWinners >= 6))
			{
				// yup, it does
				status << "OVRCW1! With " & bidState.fPts & " pts and a " & bidState.numCardsInSuit[nSuit] &
						  "-card " & app_->SuitToSingularString(nSuit) & " suit, make a weak jump overcall to " & app_->BidToFullString(nBid) & ".\n";
				bidState.SetBid(nBid);
				bidState.SetConventionStatus(this, CONV_INVOKED);
				bidState.SetConventionParameter(this, 1);	// indicate that we jump shifted
				return TRUE;
			}
		}
		else
		{
			// only strong jump shifts are possible, so see if we can use it
			// need 15-18 pts, a decent 6-card suit, and 7+ winners
			if ((bidState.fPts >= app_->OpenPoints(15)) && (bidState.fPts <= app_->OpenPoints(18)) && 
				(bidState.numCardsInSuit[nSuit] >= 6) && (bidState.nSuitStrength[nSuit] >= SS_OPENABLE) &&
				(bidState.numLikelyWinners >= 7))
			{
				// yup, it does
				status << "OVRCS1! With " & bidState.fPts & " pts, a " & bidState.numCardsInSuit[nSuit] &
						  "-card " & app_->SuitToSingularString(nSuit) & " suit, and " & bidState.numLikelyWinners & 
						  " likely winners in the hand, make a strong jump overcall to " & app_->BidToFullString(nBid) & ".\n";
				bidState.SetBid(nBid);
				bidState.SetConventionStatus(this, CONV_INVOKED);
				bidState.SetConventionParameter(this, 1);	// indicate that we jump shifted
				return TRUE;
			}
		}
	}

	// here, forget about jump overcalls
	bidState.ClearConventionParameter(this);		// no jump shift
	nBid = bidState.GetCheapestShiftBid(nSuit, nOppBid);
	nBidLevel = BID_LEVEL(nBid);

	//
	if (nBidLevel >= 3)
		return FALSE;	// can't overcall at the 3 level!

	// see if we meet the rqmts
	// need 10+ pts and 6 winners to overcall at the 2-level
	if ((nBidLevel == 2) && 
		((bidState.fPts < app_->OpenPoints(10)) || (bidState.numLikelyWinners < 6)) )
		return FALSE;
	// need 8+ pts and 5 winners to overcall at the 1-level
	if ((nBidLevel == 1) && 
		((bidState.fPts < app_->OpenPoints(8)) || (bidState.numLikelyWinners < 5)) )
		return FALSE;

	// we're normally restricted to overcalling with 17 or fewer points
	if (bidState.fPts > app_->OpenPoints(17))
	{
		// too strong for a simple overcall?
		if (app_->GetCurrentConventionSet()->IsConventionEnabled(tidTakeoutDoubles))
		{
			// use a takeout double if it's available
			status << "OVRCTK! With " & bidState.fCardPts & "/" & bidState.fPts & 
					  " points, the hand is too strong for a simple overcall, so start by doubling.\n";
			bidState.SetBid(BID_DOUBLE);
			// foreign invocation is kludgy, but hey...
			bidState.SetConventionStatus(this, CONV_SUBSUMED);
			bidState.SetConventionStatus(app_->GetConventionPool()->takeoutDoublesConvention.get(), CONV_INVOKED);
			return TRUE;
		}
		else
		{
			// not playing takeout doubles, so overcall anyway
		}
	}

	//
	// whew! we've passed all the tests, so bid
	//
	CString strOppBid = app_->BidToFullString(nOppBid);
	status << "OVERCL8! Have a good " & bidState.numCardsInSuit[nSuit] & 
			  "-card " & app_->SuitToSingularString(nSuit) & " suit with " & 
			  bidState.fPts & "/" & bidState.fPts & 
			  " points and " & bidState.numLikelyWinners & " playing tricks, so overcall the opponents' " & 
			  (LPCTSTR)strOppBid & " with a bid of " & app_->BidToFullString(nBid) & ".\n";
	bidState.SetBid(nBid);
	bidState.SetConventionStatus(this, CONV_INVOKED);
	return TRUE;
}



//
// ApplySuitStrengthTest()
//
BOOL COvercallsConvention::ApplySuitStrengthTest(int nSuit, int nOppBid, CBidEngine& bidState)
{
	// apply the suit strength test for an overcall
	// the requirements are:
	// # cards in suit + # honors + # suit pts must be >= 14, 
	// e.g., KQJxx, AKxxx, AQxxxx, etc. are good enough,
	// but not KQxxx, AQxxx, AJxxxx, etc.
	double fCount = bidState.numCardsInSuit[nSuit] + 
						bidState.numHonorsInSuit[nSuit] +
								app_->OpenPoints(bidState.numSuitPoints[nSuit]);
	int nLevel;
	if (nSuit > BID_SUIT(nOppBid))
		nLevel = BID_LEVEL(nOppBid);
	else
		nLevel = BID_LEVEL(nOppBid) + 1;
	if (nLevel > 2)
		return FALSE;	// can't overcall at the 3 level here
	// need 12 "points" to overcall with the suit at the 1 level, and 14 at the 2 level
	if ( ((nLevel == 1) && (fCount >= app_->OpenPoints(12))) ||
		 ((nLevel == 2) && (fCount >= app_->OpenPoints(14))) )
		return TRUE;
	else
		return FALSE;
/*
	double fCount = bidState.numCardsInSuit[nSuit] + bidState.numHonorsInSuit[nSuit];
	if (fCount >= bidState.numLikelyWinners)
		return TRUE;
*/
}





//
//
//=========================================================
//
// see if partner made an overcall
//
//
BOOL COvercallsConvention::RespondToConvention(const CPlayer& player, 
											   const CConventionSet& conventions, 
											   CHandHoldings& hand, 
											   CCardLocation& cardLocation, 
											   CGuessedHandHoldings** ppGuessedHands,
											   CBidEngine& bidState,  
											   CPlayerStatusDialog& status)
{
	// first see if another convention is active
	if (bidState.GetActiveConvention())
		return FALSE;

	//
	// Bidding in response to partner's overcall? check requirements
	//
	int nPartnersBid = bidState.nPartnersBid;
	int nPartnersSuit = bidState.nPartnersSuit;
	int nPartnersSuitSupport = bidState.nPartnersSuitSupport;
	int numSupportCards = bidState.numSupportCards;
	int nPartnersBidLevel = bidState.nPartnersBidLevel;
	int numPartnerBidsMade = bidState.m_numPartnerBidsMade;
	int numPartnerBidTurns = bidState.m_numPartnerBidTurns;
	int nFirstBid = app_->GetValidBidRecord(0);

	// Requirements are:
	// - partner opened bidding for the team
	// - partner bid only once, at the 1 or 2 level
	// - at least one of the opponents bid ahead of partner
	if ( (bidState.m_bPartnerOpenedForTeam) &&
//				(numPartnerBidTurns == 1) &&
				(numPartnerBidsMade == 1) &&
				(nPartnersBidLevel >= 1) && 
				(nPartnersBidLevel <= 2) && 
				(nPartnersSuit != NOTRUMP) && 
				(nPartnersBid != nFirstBid))
	{
		// okay, met requirements
		bidState.m_bPartnerOvercalled = TRUE;
	}
	else
	{
		// 
		return FALSE;
	}

	//
	double fPts = bidState.fPts;
	double fAdjPts = bidState.fAdjPts;
	double fCardPts = bidState.fCardPts;
	int nPrefSuit = bidState.nPrefSuit;

	// state expectations
	if (nPartnersBidLevel == 1)
	{
		bidState.m_fPartnersMin = app_->OpenPoints(8);
		bidState.m_fPartnersMax = app_->OpenPoints(15);
		status << "ROVRC1! Partner overcalled at the 1-level, indicating a good 5+ card "
				  & app_->SuitToSingularString(nPartnersSuit) & " suit, 8-15 points, and probably 5+ playing tricks.\n";
	}
	else if (nPartnersBidLevel == 2)
	{
		// partner overcalled at the 2-level -- see if it's a jump overcall
		int nGap = nPartnersBid - bidState.nLHOBid;
		if (nGap > 5)
		{
			// this is indeed a jump overcall -- see if it's strong or weak
			if ((nGap > 5) && conventions.IsConventionEnabled(tidWeakJumpOvercalls))
			{
				// this is a weak jump overcall, 6-10 pts
				bidState.m_fPartnersMin = app_->OpenPoints(6);
				bidState.m_fPartnersMax = app_->OpenPoints(10);
				status << "ROVRC3! Partner made a weak jump overcall of " & bidState.szPB & 
						  ", indicating " & bidState.m_fPartnersMin & "-" & bidState.m_fPartnersMax & 
						  " pts and a good 6+ card " & app_->SuitToSingularString(nPartnersSuit) & " suit.\n";
			}
			else
			{
				// a strong jump overcall, 15-18 pts
				bidState.m_fPartnersMin = app_->OpenPoints(15);
				bidState.m_fPartnersMax = app_->OpenPoints(18);
				status << "ROVRC5! Partner made a strong jump overcall of " & bidState.szPB & 
						  ", indicating " & bidState.m_fPartnersMin & "-" & bidState.m_fPartnersMax & 
						  " pts, a good 6+ card " & app_->SuitToSingularString(nPartnersSuit) & " suit, and probably 6+ playing tricks.\n";
			}
		}
		else
		{
			// a simple 2-level overcall
			bidState.m_fPartnersMin = app_->OpenPoints(10);
			bidState.m_fPartnersMax = app_->OpenPoints(15);
			status << "ROVRC5! Partner overcalled at the 2-level, indicating a good 5+ card "				  
					  & app_->SuitToSingularString(nPartnersSuit) & " suit, " & bidState.m_fPartnersMin & "-" & bidState.m_fPartnersMax & 
					  " points, and probably 6+ playing tricks.\n";
		}
	}
	else
	{
		// an overcall at the 3-level or above is always weak;
		// don't handle it here
		return FALSE;
	}

	//
	bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
	bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
	bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
	bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;
	double fMinTPPoints = bidState.m_fMinTPPoints;
	double fMaxTPPoints = bidState.m_fMaxTPPoints;
	double fMinTPCPoints = bidState.m_fMinTPCPoints;
	double fMaxTPCPoints = bidState.m_fMaxTPCPoints;
	status << "ROVRC8! The total point count in the partnership is therefore " &
			  fMinTPPoints & "-" & fMaxTPPoints & " points.\n";

	//
	//---------------------------------------------------------------------
	// raise by one or to game with adequate support, or bid NT or
	// pass otherwise
	//

	//
	// with < 6 points, pass
	//
	if (fPts < 6) 
	{
		status << "ROVRC10! This is not enough to bid any higher, so pass.\n";
		bidState.SetBid(BID_PASS);
		return TRUE;
	}


	//
	// see if we have decent support for partner
	//
	if (bidState.nPartnersSuitSupport >= SS_WEAK_SUPPORT)
	{
		// with < 20 total pts, pass
		if (fMinTPPoints < app_->GamePts() -5) 
		{
			status << "ROVRC20! This is insufficient to raise partner, so pass.\n";
			bidState.SetBid(BID_PASS);
			return TRUE;
		}
		// with 20-22 pts and 3 trumps, raise partner to the 2 level
		if (bidState.RaisePartnersSuit(SUIT_ANY,RAISE_TO_2,app_->GamePts() -6,app_->GamePts() -4,SUPLEN_3))
			return TRUE;
		// with 23-25 pts and 3 trumps, raise partner to the 3 level
		if (bidState.RaisePartnersSuit(SUIT_ANY,RAISE_TO_3,app_->GamePts() -3,app_->GamePts() -1,SUPLEN_3))
			return TRUE;
		// with 26-31 pts and 3 trumps, raise partner to the 4 level
		if (bidState.RaisePartnersSuit(SUIT_ANY,RAISE_TO_4,app_->GamePts() ,app_->SlamPts() -1,SUPLEN_3))
			return TRUE;
		// or with 29-31 pts and 4 trumps, raise partner's minor to the 5 level
		if (bidState.RaisePartnersSuit(SUIT_MINOR,RAISE_TO_5,app_->MinorSuitGamePts() ,app_->SlamPts() -1,SUPLEN_4))
			return TRUE;
		// else we have with 33+ pts, go straight to Blackwood
		if ((fPts >= app_->SlamPts() ) && (bidState.numSupportCards >= 3))
		{
			bidState.InvokeBlackwood(nPartnersSuit);
			return TRUE;
		}
	}

	//
	// support for partner's suit was inadequate, 
	// so see if we have a strong suit to bid
	// need a good 6-card suit in order to bid it in preference to partner 
	//
	int nBid;
	int nLastBid = app_->GetLastValidBid();
	BOOL bJumped = FALSE;
	//
	if ((bidState.numPrefSuitCards >= 6) && 
		(bidState.nPrefSuitStrength >= SS_STRONG) && 
		(nPrefSuit != nPartnersSuit) &&
		(nPrefSuit != bidState.nLHOSuit) && (nPrefSuit != bidState.nRHOSuit) )
	{
		// got a suit we can bid -- see what level we would be bidding at
		// shift with < 16 pts, or jump shift with 16+ pts
		if (fPts < 16)
		{
			nBid = bidState.GetCheapestShiftBid(nPrefSuit, nLastBid);
		}
		else
		{
			// jump shift, but correct back to a cheap shift if we get past game
			nBid = bidState.GetJumpShiftBid(nPrefSuit, nLastBid, JUMP_SHIFT_ONE);
			if (nBid >= bidState.GetGameBid(nPrefSuit))
				nBid = bidState.GetCheapestShiftBid(nPrefSuit, nLastBid);
			if ((nBid - nLastBid) > 5)
				bJumped = TRUE;
		}
		//
		if (!bidState.IsBidSafe(nBid))
		{
			// cant' do it
			status << "ROVRC20! And although we want to bid our own " & 
					  bidState.numPrefSuitCards & "-card " & app_->SuitToSingularString(nPrefSuit) &
					  " suit, we can't bid it at the " & BID_LEVEL(nBid) & 
					  " with only " & fPts & " points, so pass.\n";
			bidState.SetBid(BID_PASS);
		}
		else
		{
			// else make the bid
			if (!bJumped)
				status << "ROVRC24! With a " & bidState.numPrefSuitCards & "-card " & 
						  app_->SuitToSingularString(nPrefSuit) & " suit, we bid it in preference to partner's " 
						  & app_->SuitToString(nPartnersSuit) & " at a bid of " & app_->BidToFullString(nBid) & ".\n";
			else
				status << "ROVRC26! With a " & bidState.numPrefSuitCards & "-card " & 
						  app_->SuitToSingularString(nPrefSuit) & " suit and " & fPts & 
						  " points, we jump in it in preference to partner's " 
						  & app_->SuitToString(nPartnersSuit) & " at a bid of " & app_->BidToFullString(nBid) & ".\n";
			bidState.SetBid(nBid);
		}
		return TRUE;
	}

	//
	// see if we can bid NT
	//

	// bid 1NT with 16-22 total HCPs 
	// (the hand need not be balanced, nor do all suits need to be stopped)
	if (bidState.BidNoTrump(1,16,app_->NTGamePts() -4,FALSE,STOPPED_DONTCARE))
		return TRUE;
	// bid 2NT with 23-25 total HCPs and all suits stopped
	if (bidState.BidNoTrump(2,app_->NTGamePts() -3,app_->GamePts() -1,TRUE,STOPPED_ALLOTHER,nPartnersSuit))
		return TRUE;
	// bid 3NT with 26-32 total HCPs and all suits stopped
	if (bidState.BidNoTrump(3,app_->NTGamePts() ,app_->SlamPts() -1,TRUE,STOPPED_ALLOTHER,nPartnersSuit))
		return TRUE;
	// invoke Blackwood with 33+ total HCPs
	if ((fMinTPCPoints >= app_->SlamPts() ) && (bidState.bSemiBalanced))
	{
		bidState.InvokeBlackwood(NOTRUMP);
		return TRUE;
	}


	//
	// else with 16+ pts, poor support for partner, and a hand unsuitable for
	// NT, cue bid the enemy suit (but at no more than the 2-level)
	//
	if (fPts >= 16)
	{
		int nOppSuit = bidState.nLHOSuit;
		if (nOppSuit == NONE)
			nOppSuit = bidState.nRHOSuit;
		nBid = bidState.GetCheapestShiftBid(nOppSuit, nLastBid);
		status << "ROVRC60! With poor support for partner's " & app_->SuitToString(nPartnersSuit) &
				  " (holding " & bidState.szHP & 
				  "), no good 6-card suit of our own to bid, and a hand unsuited for NT, cue bid the opponents' " &
				  app_->SuitToSingularString(nOppSuit) & " suit at " & app_->BidToFullString(nBid) & ".  This bid is forcing.\n";
	}

	
	//
	// Otherwise we've fallen through, so pass
	//
	status << "ROVRC99! We have insufficient strength for either a raise, suit shift, or NT bid, so pass.\n";
	bidState.SetBid(BID_PASS);
	return TRUE;
}







//
//==========================================================
//
// Rebidding as opener after an overcall
//
//
BOOL COvercallsConvention::HandleConventionResponse(const CPlayer& player, 
									  		   const CConventionSet& conventions, 
											   CHandHoldings& hand, 
											   CCardLocation& cardLocation, 
										       CGuessedHandHoldings** ppGuessedHands,
											   CBidEngine& bidState,  
											   CPlayerStatusDialog& status)
{
	if (bidState.GetConventionStatus(this) != CONV_INVOKED)
		return FALSE;
	bidState.ClearConventionStatus(this);

	//
	// estimate partner's strength
	//
	int nBid;
	double fPts = bidState.fPts;
	double fAdjPts = bidState.fAdjPts;
	double fCardPts = bidState.fCardPts;
	int nPrefSuit = bidState.nPrefSuit;
	int nPrefSuitStrength = bidState.nPrefSuitStrength;
	int nPreviousBid = bidState.nPreviousBid;
	int nPreviousSuit = bidState.nPreviousSuit;
	int nPartnersBid = bidState.nPartnersBid;
	int nPartnersBidLevel = bidState.nPartnersBidLevel;
	int nPartnersSuit = bidState.nPartnersSuit;
	int nPartnersSuitSupport = bidState.nPartnersSuitSupport;
	int numSupportCards = bidState.numSupportCards;
	int nPreviousBidLevel = BID_LEVEL(nPreviousBid);
	int nPresumedPts;	
	
	// determine what partner presumed we had
	if (nPreviousBidLevel == 1)
		nPresumedPts = 8;
	else 
	{
		if (bidState.GetConventionParameter(this) == 1)
		{
			// we jump shifted last time
			if (conventions.IsConventionEnabled(tidWeakJumpOvercalls))
				nPresumedPts = 10;	// weak jump overcall
			else
				nPresumedPts = 15;	// strong jump overcall
		}
		else
		{
			// no jump shift, just a 2-level overcall
			nPresumedPts = 10;
		}
	}

	// first check for a strange response
	if ((nPartnersBid == BID_DOUBLE) || (nPartnersBid == BID_REDOUBLE))
	{
		// we don't understand partner's bid
		return CConvention::HandleConventionResponse(player, conventions, hand, cardLocation, ppGuessedHands, bidState, status);
	}

	// see what partner bid
	if (nPartnersBid == BID_PASS)
	{
		// partner passed, meaning he thought we had < 20 pts total
		bidState.m_fPartnersMin = 0;
		bidState.m_fPartnersMax = 19 - nPresumedPts;
	}
	else if (nPartnersSuit == nPreviousSuit)
	{
		// partner raised us
		if (nPartnersBidLevel == 2)
		{
			// 20-22 total pts assumed
			bidState.m_fPartnersMin = app_->GamePts() -6 - nPresumedPts;
			bidState.m_fPartnersMax = app_->GamePts() -4 - nPresumedPts;
		}
		else if (nPartnersBidLevel == 3)
		{
			// 23-25 total pts assumed
			bidState.m_fPartnersMin = app_->GamePts() -3 - nPresumedPts;
			bidState.m_fPartnersMax = app_->GamePts() -1 - nPresumedPts;
		}
		else if (nPartnersBidLevel >= 4)
		{
			// 26-31 total pts assumed
			bidState.m_fPartnersMin = app_->GamePts()  - nPresumedPts;
			bidState.m_fPartnersMax = app_->SlamPts()  - nPresumedPts;
		}
		status << "OVRRB10! Partner raised our initial " & bidState.szPVB &
				  " overcall to " & bidState.szPB & ", indicating 3+ trumps and " &
				  bidState.m_fPartnersMin & "-" & bidState.m_fPartnersMax & 
				  " points.\n";
	}
	else if ((nPartnersSuit != nPreviousSuit) && 
					(nPartnersSuit != NOTRUMP) &&
					(nPartnersSuit != bidState.nLHOSuit) && 
					(nPartnersSuit != bidState.nRHOSuit))
	{
		// partner bid a new suit of his own
		// see if he jumped
		if ( (((nPartnersBid - nPreviousBid) > 5) && (bidState.bLHOPassed)) ||
			 ((!bidState.bLHOPassed) && ((nPartnersBid - bidState.nLHOBid) > 5)) )
		{
			// partner jumped
			bidState.m_fPartnersMin = 16;
			bidState.m_fPartnersMax = MIN(22, 40 - bidState.fCardPts);
			status << "OVRRB20! Partner jumped in his " & bidState.szPS & 
					  " suit in response to our " & bidState.szPVB & 
					  " overcall, indicating 6+ cards and approx. " &
					  bidState.m_fPartnersMin & "-" & bidState.m_fPartnersMax & 
					  " points.\n";
		}
		else
		{
			// partner didn't jump
			if (nPartnersBidLevel == 1)
			{
				// 16-19 total pts assumed
				bidState.m_fPartnersMin = 16 - nPresumedPts;
				bidState.m_fPartnersMax = 19 - nPresumedPts;
			}
			else if (nPartnersBidLevel == 2)
			{
				// 20-22 total pts assumed
				bidState.m_fPartnersMin = 20 - nPresumedPts;
				bidState.m_fPartnersMax = 22 - nPresumedPts;
			}
			else if (nPartnersBidLevel >= 3)
			{
				// 23-31 total pts assumed
				bidState.m_fPartnersMin = 23 - nPresumedPts;
				bidState.m_fPartnersMax = MIN(22, 40 - bidState.fCardPts);
			}
			status << "OVRRB22! Partner bid his own " & bidState.szPS & 
					  " suit at the " & nPartnersBidLevel & 
					  " level in response to our " & bidState.szPVB & 
					  " overcall, indicating 6+ cards and approx. " &
					  bidState.m_fPartnersMin & "-" & bidState.m_fPartnersMax & 
					  " points.\n";
		}
	}
	else if ((nPartnersSuit != nPreviousSuit) && 
					((nPartnersSuit == bidState.nLHOSuit) ||
					(nPartnersSuit == bidState.nRHOSuit)) )
	{
		// partner cue-bid an enemy suit
		bidState.m_fPartnersMin = 16;
		bidState.m_fPartnersMax = MIN(22, 40 - bidState.fCardPts);
		status << "OVRRB30! Partner cue bid the enemy " & bidState.szPS & 
				  " suit in sresponse to our " & bidState.szPVB & 
				  " overcall, indicating poor trump support but 16+ points.\n";
	}
	else if (nPartnersSuit == NOTRUMP)
	{
		// partner bid notrumps
		if (nPartnersBidLevel == 1)
		{
			// 16-22 total pts assumed
			bidState.m_fPartnersMin = 16 - nPresumedPts;
			bidState.m_fPartnersMax = app_->GamePts() -4 - nPresumedPts;
		}
		else if (nPartnersBidLevel == 2)
		{
			// 23-25 total HPCs assumed
			bidState.m_fPartnersMin = app_->GamePts() -3 - nPresumedPts;
			bidState.m_fPartnersMax = app_->GamePts() -1 - nPresumedPts;
		}
		else if (nPartnersBidLevel >= 3)
		{
			// 26-32 total pts assumed
			bidState.m_fPartnersMin = app_->GamePts()  - nPresumedPts;
			bidState.m_fPartnersMax = app_->SlamPts() -1 - nPresumedPts;
		}
		status << "OVRRB40! Partner bid " & bidState.szPB & 
				  " in response to our " & bidState.szPVB & 
				  " overcall, indicating a balanced hand with approx. " &
				  bidState.m_fPartnersMin & "-" & bidState.m_fPartnersMax & 
				  " HPCs.\n";
	}
	bidState.m_fMinTPPoints = fAdjPts + bidState.m_fPartnersMin;
	bidState.m_fMaxTPPoints = fAdjPts + bidState.m_fPartnersMax;
	bidState.m_fMinTPCPoints = fCardPts + bidState.m_fPartnersMin;
	bidState.m_fMaxTPCPoints = fCardPts + bidState.m_fPartnersMax;
	double fMinTPPoints = bidState.m_fMinTPPoints;
	double fMaxTPPoints = bidState.m_fMaxTPPoints;
	double fMinTPCPoints = bidState.m_fMinTPCPoints;
	double fMaxTPCPoints = bidState.m_fMaxTPCPoints;




	//
	//-----------------------------------------------------------------
	// Now determine a plan of action!
	//
	int nLastBid = app_->GetLastValidBid();
	int nLastBidLevel = BID_LEVEL(nLastBid);
	int nBidLevel;

	if (nPartnersBid == BID_PASS)
	{

		// pass unless we have 6+ cards and enuff pts to rebid the suit
		nBid = bidState.GetCheapestShiftBid(nPrefSuit, nLastBid);
		nBidLevel = BID_LEVEL(nBid);
		if (bidState.numPrefSuitCards < 6)
		{
			// not nuff cards
			nBid = BID_PASS;
		}
		else if (bidState.IsBidSafe(nBid))
		{
			// rebid the suit
			status << "OVRRB50! Despite partner's pass, we have the strength to rebid the suit, so rebid at " & 
					  app_->BidToFullString(nBid) & ".\n";
		}
		else
		{
			// no go
			nBid = BID_PASS;
		}

	}
	else if (nPartnersSuit == nPreviousSuit)
	{
		// partner raised -- try to raise again if possible

		// go to slam with 32+ pts
		if (fMinTPPoints >= app_->SlamPts() )
		{
			bidState.InvokeBlackwood(nPrefSuit);
			nBid = bidState.m_nBid;
		}
		else if ( (ISMAJOR(nPartnersSuit) && (fMinTPPoints >= app_->GamePts() )) ||
				  (ISMINOR(nPartnersSuit) && (fMinTPPoints >= app_->MinorSuitGamePts() )) )
		{
			// make a game bid with enuff points
			nBid = bidState.GetGameBid(nPreviousSuit);
			status << "OVRRB60! With a total of approx. " &
					  fMinTPPoints & "-" & fMinTPPoints & 
					  " pts in the partnership, we can raise to game at " &
					  app_->BidToFullString(nBid) & ".\n";
		}
		else 
		{
			// otherwise make a more modest response
			nBid = bidState.GetCheapestShiftBid(nPreviousSuit, nLastBid);
			if (bidState.IsBidSafe(nBid))
			{
				// it's safe to bid at this level
				status << "OVRRB66! With a total of approx. " &
						  fMinTPPoints & "-" & fMinTPPoints & 
						  " pts in the partnership, we can raise to" & 
						  ((nBid >= bidState.GetGameBid(nPreviousSuit))? " game at " : " ") &
						  app_->BidToFullString(nBid) & ".\n";
			}
			else
			{
				status << "OVRRB68! But we lack the strength to raise further, so pass.\n";
				nBid = BID_PASS;
			}
		}

	}
	else if (nPartnersSuit == NOTRUMP)
	{

		// partner bid NT
		if (bidState.bSemiBalanced)
		{
			// raise or pass NT if semi-balanced
			if (bidState.BidNoTrumpAsAppropriate(FALSE,STOPPED_DONTCARE))
			{
				nBid = bidState.m_nBid;
				status << "OVRRB70! We have a reasonably balanced hand and a total of " & 
							  fMinTPCPoints & "-" & fMaxTPCPoints &
							  " HPCs in the partnership, so raise to " & app_->BidToFullString(nBid) & ".\n";
			}
			else
			{
				// pass
				nBid = BID_PASS;
				status << "OVRRB72! We can accept a NT contract, and with a total of " &
						  fMinTPCPoints & "-" & fMaxTPCPoints &
					      " HPCs n the partnership, we accept partner's " & bidState.szPB & 
						  "bid and pass.\n";
			}

		}
		else if (bidState.numPrefSuitCards >= 6)
		{
			// try to rebid a 6-card suit
			nBid = bidState.GetCheapestShiftBid(nPrefSuit, nLastBid);
			nBidLevel = BID_LEVEL(nBid);
			if (bidState.IsBidSafe(nBid))
			{
				status << "OVRRB76! We don't have a balanced hand, but do have a " &
						  bidState.numPrefSuitCards & "-card " & bidState.szPVSS & 
						  " suit, so rebid it at " & app_->BidToFullString(nBid) & ".\n";
			}
			else
			{
				// pass
				nBid = BID_PASS;
				status << "OVRRB78! We don't have a balanced hand, but also lack the strength to rebid our suit, so we have to pass.\n";
			}
		}
		else
		{
			// else pass
			nBid = BID_PASS;
			status << "OVRRB79! We don't have a balanced hand, but also lack the strength to rebid our suit or another suit, so we have to pass.\n";
		}

	}
	else
	{
		// else we have no suit agreement
		int nRebidLevel = bidState.GetCheapestShiftBid(nPrefSuit, nLastBid);
		// raise partner with 2 trumps
		if ((nPartnersBidLevel == 1) &&
			(bidState.RaisePartnersSuit(SUIT_ANY,RAISE_ONE,app_->GamePts() -5,app_->SlamPts() -1,SUPLEN_2)))
		{
			nBid = bidState.m_nBid;
			status << "OVRRB80! With a lack of better options, we begrudgingly raise partner to the 2-level with " &
					  bidState.numSupportCards & " at a bid of " & app_->BidToFullString(nBid) & ".\n";
		}
		if ((nPartnersBidLevel == 2) &&
			(bidState.RaisePartnersSuit(SUIT_ANY,RAISE_ONE,app_->GamePts() -3,app_->SlamPts() -1,SUPLEN_2)))
		{
			nBid = bidState.m_nBid;
//			status << "OVRRB81! With a lack of better options, we begrudgingly raise partner to the 3-level with " &
//					  bidState.numSupportCards & " at a bid of " & app_->BidToFullString(nBid) & ".\n";
		}
		else if ( ((nRebidLevel == 2) && (fMinTPPoints >= app_->GamePts() -3) && (bidState.numPrefSuitCards >= 6)) ||
				   ((nRebidLevel == 3) && (fMinTPPoints >= app_->GamePts() -1) && (bidState.numPrefSuitCards >= 6)) )
		{
			// rebid a 6-card suit, if possible
			nBid = bidState.m_nBid;
			status << "OVRRB82! We lack the strength to raise partner, so rebid our own " & 
					  bidState.numPrefSuitCards & "-card suit at " & app_->BidToFullString(nBid) & ".\n";
		}
		else if (bidState.BidNoTrumpAsAppropriate(TRUE,STOPPED_ALLOTHER,nPartnersSuit))
		{
			// bid NT
			nBid = bidState.m_nBid;
//			status << "OVRRB84! With a semi-balanced hand, we prefer to bid NT instead of raising partner with weak trump support, so bid " &
//					   app_->BidToFullString(nBid) & ".\n";
		}
		else
		{
			// else pass
			nBid = BID_PASS;
			status << "OVRRB80! As we lack agreement in suits and have only " &
					  fMinTPPoints & "-" & fMaxTPPoints &
				      " team points, we have no good options other than to pass.\n";
		}
	}


	
	//
	// done
	//
	bidState.SetBid(nBid);
	return TRUE;
}







//
//==================================================================
// construction & destruction
//
COvercallsConvention::COvercallsConvention(std::shared_ptr<AppInterface> app)
  : CConvention(app) {
	// from ConvCodes.h
	m_nID = tidOvercalls;
}

COvercallsConvention::~COvercallsConvention() 
{
}

