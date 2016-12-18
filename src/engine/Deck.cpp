//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CDeck.cpp
//

#include "stdafx.h"
#include "engine/card_constants.h"
#include "engine/Card.h"
#include "engine/Deck.h"
#include "MyBitmap.h"
#include <sys/types.h>
#include <sys/timeb.h>
#include "app_interface.h"
#include "EasyB.h"


//
// construction/destruction
//
CDeck::CDeck(std::shared_ptr<AppInterface> app) : app_(app) {
  m_bInitialized = FALSE;
}

CDeck::~CDeck() {}


//
int	CDeck::GetCardWidth() const {
  if (m_nCardWidth > 0) {
    return m_nCardWidth;
  } else {
    // not initialized yet
    if (app_->GetSettings()->GetLowResOption())
      return SMALLCARDWIDTH;
    else
      return DEFCARDWIDTH;
  }
}

//
int	CDeck::GetCardHeight() const {
  if (m_nCardWidth > 0) {
    return m_nCardHeight;
  } else {
    // not initialized yet
    if (app_->GetSettings()->GetLowResOption())
      return SMALLCARDHEIGHT;
    else
      return DEFCARDHEIGHT;
  }
}



//
void CDeck::Clear() {
  if (!m_bInitialized)
    return;
  //
  for (int i = 0; i < 52; i++)
    m_cards[i]->Clear();
}


//
void CDeck::ClearCardBackgrounds() {
  for (int i = 0; i < 52; i++)
    m_cards[i]->ClearBackground();
}



static TCHAR BASED_CODE szDeckSettings[] = _T("Deck Settings");
static TCHAR BASED_CODE szCurrentCardBack[] = _T("Current Card Back Index");


//
void CDeck::Initialize() {
  InitializeCards();
  // read in some values
  m_nCurrCardBack = app_->GetSettings()->
    ReadIntConfig(szDeckSettings, szCurrentCardBack, 0);
  // init the time
  m_nPrevTime = time(NULL);
}



void CDeck::InitializeCards() {
  // init the deck
  CCard* pCard;
  int nCount = 0;
  //
  for (int nSuit = CLUBS; nSuit <= SPADES; nSuit++) {
    for (int nValue = 2; nValue <= ACE; nValue++, nCount++) {
      // create card
      pCard = new CCard(app_);
      pCard->Initialize(nSuit, nValue);
      sprintf(pCard->m_szValue, pCard->GetName());
      m_cards[nCount] = pCard;
      m_sortedCards[nCount] = pCard;
      m_nDeckIndex[nSuit][nValue] = nCount;
    }
  }


  // done
  m_bInitialized = TRUE;
}

//
void CDeck::InitializeBitmaps() {
  // init the deck
  int i;
  CDC *pDC = app_->GetDC();

  // see whether we're using small cards
  BOOL bSmallCards = app_->GetSettings()->GetLowResOption();
  int nBase = bSmallCards ? IDBS_CARDS_BASE : IDB_CARDS_BASE;

  if (bSmallCards) {
    m_nCardWidth = SMALLCARDWIDTH;
    m_nCardHeight = SMALLCARDHEIGHT;
  } else {
    m_nCardWidth = DEFCARDWIDTH;
    m_nCardHeight = DEFCARDHEIGHT;
  }

  // init bitmaps
  int count = 0;
  for (int suit = CLUBS; suit <= SPADES; suit++) {
    for (int value = 2; value <= ACE; value++, count++) {
      // first delete any existing bitmap
      if (m_bInitialized) {
        m_cardBitmap[count].DeleteObject();
      }

      // then load new bitmap
      if (!m_cardBitmap[count].LoadBitmap(nBase + (suit * 100) + value)) {
        AfxMessageBox("Failed to load card bitmap");
        app_->ReleaseDC(pDC);
        return;
      }

      // update card's bitmap if needed
      if (m_bInitialized) {
        m_sortedCards[count]->SetBitmap(&m_cardBitmap[count], pDC);
      }
    }
  }

  // load the mask bitmap
  if (m_bInitialized) {
    m_maskBitmap.DeleteObject();
  }
  int nCardMask = bSmallCards ? IDBS_CARD_MASK : IDB_CARD_MASK;
  if (!m_maskBitmap.LoadBitmap(nCardMask)) {
    AfxMessageBox("Failed to load card mask!");
  }

  // initialize the cardbacks imagelist
  if (m_bInitialized) {
    m_imageListCardBacks.DeleteImageList();
  }
  int nCardWidth = app_->GetDeck()->GetCardWidth();
  int nCardHeight = app_->GetDeck()->GetCardHeight();
  m_imageListCardBacks.Create(nCardWidth, nCardHeight, ILC_COLOR24 | ILC_MASK, 0, 32);

  // load the card backs bitmaps into the image list
  int nCardBackBase = bSmallCards ? IDBS_CARDBACK0 : IDB_CARDBACK0;
  for (i = 0; i < MAX_CARDBACKS; i++) {
    // delete old stuff
    if (m_bInitialized) {
      m_cardBackImageListBitmap[i].DeleteObject();
      m_cardBackBitmap[i].DeleteObject();
    }
    // use one bitmap each for the image list & card back
    if (!m_cardBackImageListBitmap[i].LoadBitmap(nCardBackBase + i)) {
      break;
    }
    m_imageListCardBacks.Add(&m_cardBackImageListBitmap[i], RGB(255, 255, 255));
    m_cardBackBitmap[i].LoadBitmap(nCardBackBase + i);
  }

  // determine the # of card backs loaded
  m_numCardBacks = i;
  if (m_nCurrCardBack >= m_numCardBacks) {
    m_nCurrCardBack = 0;
  }

  // done
  app_->ReleaseDC(pDC);
}


//
void CDeck::Terminate() {
  // write out some settings
  app_->GetSettings()->WriteIntConfig(szDeckSettings, szCurrentCardBack, m_nCurrCardBack);

  //
  int nSuit, nValue, nCount = 0;
  for (nSuit = CLUBS; nSuit <= SPADES; nSuit++) {
    for (nValue = 2; nValue <= ACE; nValue++, nCount++) {
      delete m_cards[nCount];
      m_cardBitmap[nCount].DeleteObject();
    }
  }

  // delete up the cardbacks imagelist
  m_imageListCardBacks.DeleteImageList();

  // delete the card back bitmaps
  int i;
  for (i = 0; i < m_numCardBacks; i++) {
    m_cardBackImageListBitmap[i].DeleteObject();
    m_cardBackBitmap[i].DeleteObject();
  }
  // and the mask bitmap
  m_maskBitmap.DeleteObject();
}


//
int CDeck::Shuffle(int nSeed, bool bSuppressSeed) {
  // copy from the ordered deck if deal numbering is enabled
  // else leave shuffled
  if (app_->GetSettings()->GetEnableDealNumbering()) {
    for (int i = 0; i < 52; i++)
      m_cards[i] = m_sortedCards[i];
  }

  // then seed the random number generator
  if (nSeed == 0) {
    // use the lower 16 bits of the current time since 1970 in seconds
    // OR-ed with the current millitime, and the elapsed time since the last deal
    // structure:
    //  
    // +----------------+---------+--------+
    // |    31-17(16)   | 15-8(8) | 7-0(8) |
    // +----------------+---------+--------+
    // |  Time in secs  |Millitime|  E.T.  |
    // +----------------+---------+--------+
    //    0 -- 65,536      0-255     0-255
    //    (~ 18 hrs)   (top 10 bits)
    //
    struct _timeb timebuffer;
    _ftime(&timebuffer);
    int nElapsedTime = timebuffer.time - m_nPrevTime;
    int nLeft = timebuffer.time << 16;
    int nRight = (timebuffer.millitm << 6) | (nElapsedTime & 0x00FF);
    nSeed = nLeft | nRight;
    //
    m_nPrevTime = timebuffer.time;
  }
  //
  if (!bSuppressSeed)
    srand(nSeed);

  //
  int nRand, nTempSuit, nTempVal;
  CCard* pTempCard;
  for (int x = 0; x < 10; x++) {
    for (int i = 0; i < 52; i++) {
      // switch the ith card with a random card
      nRand = GetRandomValue(51);
      if (nRand == i)
        nRand = GetRandomValue(51);	// try again	
      //
      pTempCard = m_cards[i];
      nTempSuit = pTempCard->m_nSuit;
      nTempVal = pTempCard->m_nFaceValue;
      //
      m_cards[i] = m_cards[nRand];
      m_nDeckIndex[m_cards[nRand]->m_nSuit][m_cards[nRand]->m_nFaceValue] = i;
      //
      m_cards[nRand] = pTempCard;
      m_nDeckIndex[nTempSuit][nTempVal] = nRand;
    }
  }

  // done
  return nSeed;
}


//
// return a pointer to the specified value card
//
CCard* CDeck::GetCard(int nDeckValue) {
  if ((nDeckValue < 0) || (nDeckValue > 51))
    return NULL;
  return m_sortedCards[nDeckValue];
}

//
CCard* CDeck::GetCard(LPCTSTR pszName) {
  int nValue = StringToDeckValue(pszName);
  return GetCard(nValue);
}

//
CCard* CDeck::GetCard(int nSuit, int nFaceValue) {
  int nDeckValue = MAKEDECKVALUE(nSuit, nFaceValue);
  return GetCard(nDeckValue);
}
