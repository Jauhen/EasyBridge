//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CCard
//
#include "stdafx.h"
#include "engine/card_constants.h"
#include "engine/card.h"
#include "engine/deck.h"
#include "math.h"
#include "app_interface.h"
#include "model/globals.h"

// class static data
int CCard::m_nCardWidth = -1;
int CCard::m_nCardHeight = -1;


// constructor
CCard::CCard(std::shared_ptr<AppInterface> app) : app_(app)
{	
	m_pBitmap = NULL;
}

// destructor
CCard::~CCard()
{
	// destroy the card's prev bitmap
	m_prevBitmap.DeleteObject();
	m_hlPrevBitmap.DeleteObject();
}


//
void CCard::Clear()
{
	m_bAssigned = FALSE;
	m_bBackgroundSet = FALSE;
	m_bHLBackgroundSet = FALSE;
	m_bFaceUp = FALSE;
	m_nOwner = -1;
	m_nDisplayPosition = -1;
	m_nSuitPosition = -1;
	m_nHandIndex = -1;
	m_nPosX = m_nPosY = 0;
}


//
void CCard::ClearBackground()
{
	m_bBackgroundSet = FALSE;
	m_bHLBackgroundSet = FALSE;
}



//
//===============================================================
//



//
void CCard::Initialize(int nSuit, int nValue)
{
	CString strTemp;
	// check limits
	if ((nSuit < CLUBS) || (nSuit > SPADES) || 
			(nValue < 2) || (nValue > ACE)) 
	{
		strTemp.Format("Illegal call to card's initialize routine; suit = %d, value = %d",
						nSuit,nValue);
		AfxMessageBox(strTemp);
		return;
	}

	//
	m_nSuit = nSuit;
	m_nFaceValue = nValue;
	m_nDeckValue = MAKEDECKVALUE(m_nSuit,m_nFaceValue);
	m_strName = CCard::CardToShortString(m_nDeckValue);
	m_strFaceName = CCard::GetCardName(m_nFaceValue);
	m_strFullName = CCard::CardToString(m_nDeckValue);
	m_strReverseFullName = CCard::CardToReverseString(m_nDeckValue);
	m_bAssigned = FALSE;
}


//
void CCard::SetBitmap(CBitmap* pBitmap, CDC* pDC)
{
	// if reassigning bitmap, clear old info
	if (m_pBitmap)
	{
		m_prevBitmap.DeleteObject();
		m_hlPrevBitmap.DeleteObject();
	}

	// get dimensions for the new bitmap
	m_nCardWidth = app_->GetDeck()->GetCardWidth();
	m_nCardHeight = app_->GetDeck()->GetCardHeight();

	// set the new bitmap
	m_pBitmap = pBitmap;
	if (m_pBitmap == NULL) 
	{
		AfxMessageBox(FormString("Failed to find card bitmap, suit %d, value %d", m_nSuit, m_nFaceValue));
	}
	else
	{
		// create background bitmap
		m_prevBitmap.CreateCompatibleBitmap(pDC, m_nCardWidth, m_nCardHeight);
		m_hlPrevBitmap.CreateCompatibleBitmap(pDC, m_nCardWidth, m_nCardHeight);
	}

	// and clear flags
	m_bBackgroundSet = FALSE;
	m_bHLBackgroundSet = FALSE;
}




// duplicate
void CCard::operator=(CCard* pSource) 
{
	//
	m_nSuit = pSource->m_nSuit;
	m_nFaceValue = pSource->m_nFaceValue;
	m_pBitmap = pSource->m_pBitmap;
}

void CCard::operator=(CCard& cSource) 
{
	//
	m_nSuit = cSource.m_nSuit;
	m_nFaceValue = cSource.m_nFaceValue;
	m_pBitmap = cSource.m_pBitmap;
}


//
BOOL CCard::IsValid() const
{
	if ((m_nDeckValue < 0) || (m_nDeckValue >= 52))
		return FALSE;
	if ((m_nSuit < CLUBS) || (m_nSuit > SPADES))
		return FALSE;
	//
	return TRUE;
}





//
//----------------------------------------------------------------
//
// utility functions
//

//
// GetDisplayValue()
//
// the card's display order onscreen
// the highest card (the one that appears first) has the lowest code
//
int CCard::GetDisplayValue() const
{
	// get the suit's actual onscreen suit order
	int nSuitIndex = app_->GetSuitToScreenIndex(m_nSuit);
	return (nSuitIndex*13 + (14 - m_nFaceValue));
}


//
// GetDummyDisplayValue()
//
int CCard::GetDummyDisplayValue() const
{
	// get the suit's actual (dummy) onscreen suit order
	int nSuitIndex = app_->GetDummySuitToScreenIndex(m_nSuit);
	return (nSuitIndex*13 + (14 - m_nFaceValue));
}


//
void CCard::GetRect(RECT& rect) const
{
	rect.left = m_nPosX;
	rect.top = m_nPosY;
	rect.right = m_nPosX + app_->GetDeck()->GetCardWidth();
	rect.bottom = m_nPosY + app_->GetDeck()->GetCardHeight();
}
  

//
TCHAR CCard::GetCardLetter() const
{
  return cCard[m_nFaceValue];
}

//
TCHAR CCard::GetSuitLetter() const
{
  return cSuit[m_nSuit];
}



//
//----------------------------------------------------------------
//
// draw operations
//

// draw the card at the current location
void CCard::Draw(CDC* pDC)
{
	CDC cardDC,cacheDC,maskDC;
	// create DCs
	cardDC.CreateCompatibleDC(pDC);
	cacheDC.CreateCompatibleDC(pDC);
	maskDC.CreateCompatibleDC(pDC);

	// load bitmaps
	CBitmap* pOldBitmap1;
//	if ((m_bFaceUp) || (theApp.m_bDebugMode) || (theApp.m_bShowCardsFaceUp))
	if ((m_bFaceUp) || (app_->AreCardsFaceUp())) 
	{
		pOldBitmap1 = (CBitmap*) cardDC.SelectObject(m_pBitmap);
	} 
	else 
	{
		pOldBitmap1 = (CBitmap*) cardDC.SelectObject(app_->GetDeck()->GetCardBackBitmap());
	}
	CBitmap* pOldBitmap2 = (CBitmap*) maskDC.SelectObject(app_->GetDeck()->GetMaskBitmap());
    CBitmap tempBitmap;
	//
    tempBitmap.CreateCompatibleBitmap(pDC, m_nCardWidth, m_nCardHeight);
	CBitmap* pOldBitmap3 = (CBitmap*) cacheDC.SelectObject(&tempBitmap);
	// first copy screen background to cacheDC
	cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,pDC,m_nPosX,m_nPosY,SRCCOPY);
	// and save it for later use
	CDC saveDC;
	saveDC.CreateCompatibleDC(pDC);
	CBitmap* pOldBitmap4 = (CBitmap*) saveDC.SelectObject(&m_prevBitmap);
	saveDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&cacheDC,0,0,SRCCOPY);
	saveDC.SelectObject(pOldBitmap4);
	saveDC.DeleteDC();

	// now mask the cacheDC
	cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&maskDC,0,0,SRCAND);
	// then copy the bitmap onto the cacheDC
	cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&cardDC,0,0,SRCPAINT);
	// and finally copy the cacheDC onto the screen
	pDC->BitBlt(m_nPosX,m_nPosY,m_nCardWidth,m_nCardHeight,&cacheDC,0,0,SRCCOPY);
	// all done
	(void)cardDC.SelectObject(pOldBitmap1);
	(void)maskDC.SelectObject(pOldBitmap2);
	(void)cacheDC.SelectObject(pOldBitmap3);
	cardDC.DeleteDC();
	maskDC.DeleteDC();
	cacheDC.DeleteDC();
	tempBitmap.DeleteObject();
	return;
}



// draw the card highlighted  at the current location
void CCard::DrawHighlighted(CDC* pDC, BOOL bVisible)
{
	//
	if (bVisible) 
	{
		//
		CDC cardDC,cacheDC,maskDC;
		// create DCs
		cardDC.CreateCompatibleDC(pDC);
		cacheDC.CreateCompatibleDC(pDC);
		maskDC.CreateCompatibleDC(pDC);

		// load bitmaps
		CBitmap* pOldBitmap1;
		pOldBitmap1 = (CBitmap*) cardDC.SelectObject(m_pBitmap);
		CBitmap* pOldBitmap2 = (CBitmap*) maskDC.SelectObject(app_->GetDeck()->GetMaskBitmap());
	    CBitmap tempBitmap;
    	tempBitmap.CreateCompatibleBitmap(pDC, m_nCardWidth, m_nCardHeight);
		CBitmap* pOldBitmap3 = (CBitmap*) cacheDC.SelectObject(&tempBitmap);
		// first copy screen background to the cacheDC
		cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,pDC,m_nPosX,m_nPosY,SRCCOPY);
		// and save it for later use
		CDC saveDC;
		saveDC.CreateCompatibleDC(pDC);
		CBitmap* pOldBitmap4 = (CBitmap*) saveDC.SelectObject(&m_hlPrevBitmap);
		saveDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&cacheDC,0,0,SRCCOPY);
		saveDC.SelectObject(pOldBitmap4);
		saveDC.DeleteDC();
		m_bHLBackgroundSet = TRUE;

		// now mask the cacheDC
		cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&maskDC,0,0,SRCAND);
		// then copy the bitmap onto the cacheDC, INVERTED
		cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&cardDC,0,0,NOTSRCCOPY);
		// and finally copy the cacheDC onto the screen
		pDC->BitBlt(m_nPosX,m_nPosY,m_nCardWidth,m_nCardHeight,&cacheDC,0,0,SRCCOPY);
		// all done
		(void)cardDC.SelectObject(pOldBitmap1);
		(void)maskDC.SelectObject(pOldBitmap2);
		(void)cacheDC.SelectObject(pOldBitmap3);
		cardDC.DeleteDC();
		maskDC.DeleteDC();
		cacheDC.DeleteDC();
		tempBitmap.DeleteObject();
		return;

	} 
	else 
	{
	
		//
		if (!m_bHLBackgroundSet)
			return;
		//
		CDC cacheDC;
		// create the DC
		cacheDC.CreateCompatibleDC(pDC);
		// load bitmap
		CBitmap* pOldBitmap = (CBitmap*) cacheDC.SelectObject(&m_hlPrevBitmap);
		// copy the cacheDC onto the screen
		pDC->BitBlt(m_nPosX,m_nPosY,m_nCardWidth,m_nCardHeight,&cacheDC,0,0,SRCCOPY);
		// all done
		(void)cacheDC.SelectObject(pOldBitmap);
		cacheDC.DeleteDC();
		m_bHLBackgroundSet = FALSE;
		return;

	}
}



// flash the card
void CCard::FlashCard(CDC* pDC, int numTimes)
{
	for(int i=0;i<numTimes;i++)
	{
		DrawHighlighted(pDC, TRUE);
		Sleep(200);		// wait a fraction of a second
		DrawHighlighted(pDC, FALSE);
		// wait again if desired
		if (i < numTimes-1)
			Sleep(200);
	}
}



// restore the card's background image
void CCard::RestoreBackground(CDC* pDC)
{
	CDC cacheDC;
	// create the DC
	cacheDC.CreateCompatibleDC(pDC);
	// load bitmap
	CBitmap* pOldBitmap = (CBitmap*) cacheDC.SelectObject(&m_prevBitmap);
	// copy the cacheDC onto the screen
	pDC->BitBlt(m_nPosX,m_nPosY, app_->GetDeck()->GetCardWidth(), app_->GetDeck()->GetCardHeight(),&cacheDC,0,0,SRCCOPY);
	// all done
	(void)cacheDC.SelectObject(pOldBitmap);
	cacheDC.DeleteDC();
	return;
}



// move card
void CCard::MoveTo(CDC *pDC, int destX, int destY, BOOL bRedraw) {
	//
	m_nPosX = destX;
	m_nPosY = destY;
	if (bRedraw)
		Draw(pDC);
}



// drag card
void CCard::DragTo(CDC* pDC, int destX, int destY)
{
	int dx = m_nPosX - destX;
	int dy = m_nPosY - destY;
	CDC oldBkDC,newBkDC,cacheDC,cardDC,maskDC;

	// create DCs
	oldBkDC.CreateCompatibleDC(pDC);
	newBkDC.CreateCompatibleDC(pDC);
	cacheDC.CreateCompatibleDC(pDC);
	cardDC.CreateCompatibleDC(pDC);
	maskDC.CreateCompatibleDC(pDC);

	// load bitmaps
	CBitmap* pOldBitmapOldBk = (CBitmap*) oldBkDC.SelectObject(&m_prevBitmap);
	CBitmap* pOldBitmapCard;
//	if ((m_bFaceUp) || (theApp.m_bDebugMode) || (theApp.m_bShowCardsFaceUp))
	if ((m_bFaceUp) || (app_->AreCardsFaceUp()))
		pOldBitmapCard = (CBitmap*) cardDC.SelectObject(m_pBitmap);
	else
		pOldBitmapCard = (CBitmap*) cardDC.SelectObject(app_->GetDeck()->GetCardBackBitmap());
	CBitmap* pOldBitmapMask = (CBitmap*) maskDC.SelectObject(app_->GetDeck()->GetMaskBitmap());
    CBitmap tempBitmapNewBk,tempBitmapCache;
    tempBitmapNewBk.CreateCompatibleBitmap(pDC, m_nCardWidth, m_nCardHeight);
    tempBitmapCache.CreateCompatibleBitmap(pDC, m_nCardWidth, m_nCardHeight);
	CBitmap* pOldBitmapNewBk = (CBitmap*) newBkDC.SelectObject(&tempBitmapNewBk);
	CBitmap* pOldBitmapCache = (CBitmap*) cacheDC.SelectObject(&tempBitmapCache);

	// #### TEMP ####
//	pDC->BitBlt(destX+m_nCardWidth,destY,m_nCardWidth,m_nCardHeight,&oldBkDC,0,0,SRCCOPY);

	// first copy screen background to the new background DC
	newBkDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,pDC,destX,destY,SRCCOPY);

	// now restore the old background onto the area of the new 
	// background that overlaps with the old background
	newBkDC.BitBlt(dx,dy,m_nCardWidth,m_nCardHeight,&oldBkDC,0,0,SRCCOPY);
	// newBkDC is saved for later; we work with cacheDC for now
	cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&newBkDC,0,0,SRCCOPY);

	// Copy a portion of the card bitmap to the old background
	oldBkDC.BitBlt(-dx,-dy,m_nCardWidth,m_nCardHeight,&maskDC,0,0,SRCAND);
	oldBkDC.BitBlt(-dx,-dy,m_nCardWidth,m_nCardHeight,&cardDC,0,0,SRCPAINT);

	// now mask & copy the card bitmap to the cacheDC (new background)
	cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&maskDC,0,0,SRCAND);
	cacheDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&cardDC,0,0,SRCPAINT);
	// and then copy the cacheDC onto the screen
	pDC->BitBlt(destX,destY,m_nCardWidth,m_nCardHeight,&cacheDC,0,0,SRCCOPY);

	// and then copy the old background to the screen
	pDC->BitBlt(m_nPosX,m_nPosY,m_nCardWidth,m_nCardHeight,&oldBkDC,0,0,SRCCOPY);

	// all done
	(void)oldBkDC.SelectObject(pOldBitmapOldBk);
	(void)cardDC.SelectObject(pOldBitmapCard);
	(void)maskDC.SelectObject(pOldBitmapMask);
	(void)cacheDC.SelectObject(pOldBitmapCache);
	oldBkDC.DeleteDC();
	cardDC.DeleteDC();
	maskDC.DeleteDC();
	cacheDC.DeleteDC();
	tempBitmapCache.DeleteObject();
	// finally, we save the new background bitmap
	CDC saveDC;
	saveDC.CreateCompatibleDC(pDC);
	CBitmap* pOldBitmapSave = (CBitmap*) saveDC.SelectObject(&m_prevBitmap);
	saveDC.BitBlt(0,0,m_nCardWidth,m_nCardHeight,&newBkDC,0,0,SRCCOPY);
	saveDC.SelectObject(pOldBitmapSave);
	saveDC.DeleteDC();
	// we're done with the newBkDC now, and can delete it
	(void)newBkDC.SelectObject(pOldBitmapNewBk);
	newBkDC.DeleteDC();
	tempBitmapNewBk.DeleteObject();
	// and update the new card position
	m_nPosX = destX;
	m_nPosY = destY;
	//
	return;
}



//
// Animate()
//
void CCard::Animate(CDC* pDC, int destx, int desty, BOOL bClearAtEnd, int nGranularity) 
{
	int x = m_nPosX;
	int y = m_nPosY;
	int diffx = destx - x;
	int diffy = desty - y;
	int dx = ABS(diffx);
	int dy = ABS(diffy);
	// use pythagorean theorem here
	int max = (int) sqrt((double)dx*dx + dy*dy);

	//
	if (nGranularity == -99)
		nGranularity = app_->GetAnimationGranularity();
	int nSteps = (nGranularity > 0)? ABS(max / nGranularity) : max;
	if (nSteps == 0) 
	{
		if ((dx > 0) || (dy > 0))
			nSteps = 1;
		else
			return;
	}

	//
	int nWaitTime = 16;	// 1/60th of a second
	if (nGranularity < 0)
		nWaitTime *= -nGranularity;

	//
	double sx = (destx - x) / (double)nSteps;
	double sy = (desty - y) / (double)nSteps;
	double posX = x;
	double posY = y;
	
	// 
	for(int i=0;i<nSteps-1;i++) 
	{
		posX += sx;
		posY += sy;
		//
		DragTo(pDC, (int)posX, (int)posY);
		//
		if (nGranularity < 0)
			Sleep(nWaitTime);
	}

	// final step is made only if we want to show card at end
	// else the card disappears from view
	RestoreBackground(pDC);
	if (!bClearAtEnd)
		MoveTo(pDC, destx, desty);
}





