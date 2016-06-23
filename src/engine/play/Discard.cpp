//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// Discard.cpp
//
#include "stdafx.h"
#include "engine/card_constants.h"
#include "engine/Deck.h"
#include "engine/Card.h"
#include "engine/play/Discard.h"
#include "engine/play/PlayEngine.h"
#include "engine/play/CombinedHoldings.h"
#include "engine/CardLocation.h"
#include "engine/play/GuessedHandHoldings.h"
#include "engine/PlayerStatusDialog.h"
#include "app_interface.h"



//
//==================================================================
// constructon & destruction

CDiscard::CDiscard(std::shared_ptr<AppInterface> app, int nTargetHand, int nSuit, int nCardVal) :
			CPlay(app, CPlay::DISCARD, nTargetHand, nSuit, PP_LOSER)
{
	m_nCardVal = nCardVal;
}

CDiscard::CDiscard(std::shared_ptr<AppInterface> app, int nTargetHand, CCard* pCard) :
			CPlay(app, CPlay::DISCARD, nTargetHand, NONE, PP_LOSER)
{
	VERIFY(pCard);
	m_nSuit = pCard->GetSuit(); 
	m_nCardVal = pCard->GetFaceValue(); 
}

CDiscard::CDiscard(std::shared_ptr<AppInterface> app, CDiscard& srcPlay) :
		CPlay(app, CPlay::m_nPlayType, srcPlay.m_nTargetHand)
{
	m_nTargetHand = srcPlay.m_nTargetHand;
	m_nSuit = srcPlay.m_nSuit;
	m_nCardVal = srcPlay.m_nCardVal;
}

CDiscard::~CDiscard() 
{
}


//
void CDiscard::Clear()
{
	CPlay::Clear();
	//
	m_nCardVal = NONE;
}


//
void CDiscard::Init()
{
	CPlay::Init();
	//
	m_pConsumedCard = app_->GetDeck()->GetCard(m_nSuit, m_nCardVal);
	// form description
	m_strDescription.Format("Discard the %s", m_pConsumedCard->GetName());
}


//
CString CDiscard::GetFullDescription()
{
	CString strText;
	strText.Format("Discard the %s in %s.", m_pConsumedCard->GetName(),
				   (m_nTargetHand == 0)? "hand" : "dummy");
	// done
	return strText;
}




//
// Perform()
//
PlayResult CDiscard::Perform(CPlayEngine& playEngine, CCombinedHoldings& combinedHand, 
						      CCardLocation& cardLocation, CGuessedHandHoldings** ppGuessedHands, 
						      CPlayerStatusDialog& status, CCard*& pPlayCard)
{
	// not written yet
	return PLAY_NOT_VIABLE;
//	return CPlay::Perform(playEngine, combinedHand, cardLocation, ppGuessedHands, status, pPlayCard);
}

