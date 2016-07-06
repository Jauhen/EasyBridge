//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// Sluff.cpp
//
// - a play of throwing away losing cards
//
#include "stdafx.h"
#include "engine/card_constants.h"
#include "engine/card.h"
#include "engine/play/HoldUp.h"
#include "engine/Player.h"
#include "engine/play/PlayEngine.h"
#include "engine/play/CombinedHoldings.h"
#include "engine/CardLocation.h"
#include "engine/play/GuessedHandHoldings.h"
#include "engine/PlayerStatusDialog.h"
#include "app_interface.h"


//
//==================================================================
// constructon & destruction

CHoldUp::CHoldUp(std::shared_ptr<AppInterface> app, int nSuit) :
			CPlay(app, CPlay::HOLDUP, IN_EITHER, nSuit, PP_LOSER)
{
	Init();
}

CHoldUp::CHoldUp(std::shared_ptr<AppInterface> app, CHoldUp& srcPlay) :
			CPlay(app, srcPlay.m_nPlayType, IN_EITHER, NONE, PP_LOSER)
{
	m_nSuit = srcPlay.m_nSuit;
}

CHoldUp::~CHoldUp() 
{
}


//
void CHoldUp::Clear()
{
	CPlay::Clear();
}


//
void CHoldUp::Init()
{
	CPlay::Init();
	// form name & description
	m_strName.Format("%s Hold up", CCard::SuitToSingularString(m_nSuit));
	m_strDescription.Format("Hold up a round of %s", CCard::SuitToString(m_nSuit));
}



//
CString CHoldUp::GetFullDescription()
{
	return app_->FormString("Hold up a round of %s.",CCard::SuitToString(m_nSuit));
}




//
// Perform()
//
PlayResult CHoldUp::Perform(CPlayEngine& playEngine, CCombinedHoldings& combinedHand, 
				    CCardLocation& cardLocation, CGuessedHandHoldings** ppGuessedHands, 
				    CPlayerStatusDialog& status, CCard*& pPlayCard)
{
	// check which hand this is
	int nOrdinal = app_->GetNumCardsPlayedInRound();
	CPlayer* pPlayer = playEngine.GetPlayer();
	BOOL bPlayingInHand = (app_->GetCurrentPlayer() == pPlayer);
	CHandHoldings& playerHand = *(combinedHand.GetPlayerHand());
	CHandHoldings& dummyHand = *(combinedHand.GetPartnerHand());
	CSuitHoldings& playerSuit = playerHand.GetSuit(m_nSuit);
	CSuitHoldings& dummySuit = dummyHand.GetSuit(m_nSuit);
	CCard* pCardLed = app_->GetCurrentTrickCardByOrder(0);
	int nSuitLed = NONE;
	if (pCardLed)
		nSuitLed = pCardLed->GetSuit();
	// see if a trump was played in this round
	BOOL bTrumped = FALSE;
	int nTrumpSuit = app_->GetTrumpSuit();
	if ((nSuitLed != nTrumpSuit) && (app_->WasTrumpPlayed()))
		bTrumped = TRUE;
	pPlayCard = NULL;
	CCard* pOppCard = NULL;
	// 
	CCard* pRoundTopCard = app_->GetCurrentTrickHighCard();
	CCard* pDeclarerCard = app_->GetCurrentTrickCard(playEngine.GetPlayerPosition());
	CCard* pDummysCard = app_->GetCurrentTrickCard(playEngine.GetPartnerPosition());
	CCard* pPartnersCard = bPlayingInHand? pDummysCard : pDeclarerCard;
	BOOL bPartnerHigh = (pRoundTopCard == pPartnersCard);
	//
	BOOL bValid = FALSE;

	// test preconditions
	if (!CPlay::IsPlayUsable(combinedHand, playEngine))
	{
		m_nStatusCode = PLAY_INACTIVE;
		return PLAY_POSTPONE;
	}

	// a holdup is simple -- discard instead of winning
	switch(nOrdinal)
	{
		case 0:
			// can't hold up here
			m_nStatusCode = PLAY_INACTIVE;
			return PLAY_POSTPONE;

		case 1:
			if (bPlayingInHand) 
				pPlayCard = playerHand.GetDiscard();
			else
				pPlayCard = dummyHand.GetDiscard();
			status << "PLHLD04! Hold up a round of " & CCard::SuitToString(m_nSuit) & 
					  " and discard the " & pPlayCard->GetFaceName() & " from " &
					  (bPlayingInHand? "hand" : "dummy") & ".\n";
			m_nStatusCode = PLAY_IN_PROGRESS;
			break;

		case 2:
			// can't hold up here
			m_nStatusCode = PLAY_INACTIVE;
			return PLAY_POSTPONE;

		case 3:
			// complete the hold-up
			if (m_nStatusCode != PLAY_IN_PROGRESS)
				return PLAY_INACTIVE;
			if (bPlayingInHand) 
				pPlayCard = playerHand.GetDiscard();
			else
				pPlayCard = dummyHand.GetDiscard();
			status << "PLHLD08! Finish the hold-up and discard the " & 
					  pPlayCard->GetFaceName() & " from " & (bPlayingInHand? "hand" : "dummy") & ".\n";
			m_nStatusCode = PLAY_COMPLETE;
			break;
	}

	// done
	ASSERT(pPlayCard->IsValid());
	return m_nStatusCode;
}

