//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CDummyPlayEngine
//
#ifndef __CDUMMYPLAYENGINE__
#define __CDUMMYPLAYENGINE__

#include "PlayEngine.h"


//
class CDummyPlayEngine : public CPlayEngine {

	friend class CPlayer;

//
// public routines
//
public:
	// virtual functions
	virtual void Initialize(CPlayer* pPlayer, CPlayer* pPartner, CPlayer* pLHOpponent, CPlayer* pRHOpponent, CHandHoldings* pHoldings, CCardLocation* pCardLocation, CGuessedHandHoldings** ppGuessedHands, CBidEngine* pBidder, CPlayerStatusDialog* pStatusDlg);
	virtual void InitNewHand();
	virtual void Clear();
	//
	virtual DisplayCard*   PlayCard();
	//
	virtual DisplayCard*   GetLeadCard();
	virtual DisplayCard* 	GetPlayHint();
	//
/*
	virtual DisplayCard* 	PlayFirst() { return m_pPartner->PlayForDummy(0); }
	virtual DisplayCard* 	PlaySecond() { return m_pPartner->PlayForDummy(1); }
	virtual DisplayCard* 	PlayThird() { return m_pPartner->PlayForDummy(2); }
	virtual DisplayCard* 	PlayFourth() { return m_pPartner->PlayForDummy(3); }
*/
	virtual int  GetNumClaimableTricks();
	//
	virtual void AdjustCardCount(int nPos, DisplayCard*  pCard);
	virtual void AdjustHoldingsCount(DisplayCard*  pCard);
	virtual void RestartPlay();

	// class-specific functions
	virtual DisplayCard*  PlayForSelf();

//
// protected routines
//
protected:
	//
	virtual void	AssessPosition();


// public data
public:

// private data
private:
	// class-sepcific data

//
// private routines
//
private:
	CDummyPlayEngine();
	virtual ~CDummyPlayEngine();
};

#endif