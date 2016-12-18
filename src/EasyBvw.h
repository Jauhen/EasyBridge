//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

// EasyBvw.h : interface of the CEasyBView class
//
/////////////////////////////////////////////////////////////////////////////

#include "dib.h"
#include "ObjectWithProperties.h"
#include "model/view_state.h"

class CIntroWnd;
class CCard;


//
class CEasyBView : public ViewState, public CView, public CObjectWithProperties, public CEventProcessor {
  friend class CCardLayoutDialog;
  friend class CEasyBDoc;

  // screen modes
public:

  //
public:
  static CEasyBView* m_pView;

protected: // create from serialization only
  CEasyBView();
  DECLARE_DYNCREATE(CEasyBView)

  // public functions
public:
  // property get/set operations
  LPVOID	GetValuePV(int nItem, int nIndex1 = 0, int nIndex2 = 0, int nIndex3 = 0);
  int		SetValuePV(int nItem, LPVOID value, int nIndex1 = 0, int nIndex2 = 0, int nIndex3 = 0);
  LPCTSTR GetValueString(int nItem, int nIndex1 = 0, int nIndex2 = 0, int nIndex3 = 0);
  int		GetValue(int nItem, int nIndex1 = 0, int nIndex2 = 0, int nIndex3 = 0);
  int		SetValue(int nItem, int nValue, int nIndex1 = 0, int nIndex2 = 0, int nIndex3 = 0);
  void	RefreshProperties() { Refresh(TRUE); }
  // Event Processor
  bool	Notify(long lCode, long param1 = 0, long param2 = 0, long param3 = 0);
  //
  static CEasyBView* GetView();
  //
  BOOL SetBackgroundBitmap(LPCTSTR szFileName, BOOL bTest);
  void ClearMode(BOOL bRedraw = TRUE);
  void ClearDisplay() { ClearDisplayArea(NULL, NULL); }
  void Refresh(BOOL bInvalidate = FALSE) { if (bInvalidate) Invalidate(); UpdateWindow(); }
  void InitNewRound();
  void PromptLead();
  void DisplayHand(Position nPos, int nDisplaySuit = -1, BOOL bClearBackground = TRUE, BOOL bCardPlayed = FALSE);
  void DisplayTricks(CDC* pSentDC = NULL);
  BOOL AreCardsFaceUp() const { return state_->IsAllCardVisible(); }

  //
  void ClearTable();
  void ClearTableRegion(CDC* pSentDC = NULL);
  void ClearPartialTrickCards();
  void ThrowCard(Position nPos, CCard* pCard);
  void DrawPlayedCard(Position nPos, CCard* pCard, BOOL bShowAtEnd = TRUE);
  void GameFinished();
  void BeginGameReview(BOOL bReset = TRUE);
  void EndGameReview();
  void RestoreGameReview();
  // 
  void SetCurrentMode(int nMode);
  void SetCurrentModeTemp(int nMode);
  void RestoreMode();
  RECT& GetRectSuitOffset(int nPlayer, int nSuit) { return m_rectSuitOffset[nPlayer][nSuit]; }


  // Data
private:
  //
  static BOOL	m_bResourcesInitialized;
  static BOOL	m_bViewInitialized;

  ViewState* state_;
  //
  CCard*  m_layoutDeck[52];
  POINT 	m_drawPoint[4];
  POINT 	m_dummyDrawOffset[4];
  POINT 	m_dummyLabelOffset[4];
  POINT 	m_cardDest[4];
  RECT 	m_rectCardDest[4];
  CRgn	m_tableRegion;
  RECT	m_rectTable;
  RECT 	m_rectSuitOffset[4][4];
  POINT	m_ptTricksDisplayDest[2];
  //
  int		m_nCardWidth;
  int		m_nCardHeight;
  int		m_nCardXGap;
  int		m_nCardYGap;
  int		m_nOverlapYOffset;
  int		m_nSuitSpacer;
  int		m_nDummySuitSpacer;
  int		m_nLayoutXGap;
  int		m_nLayoutYGap;
  int		m_nHorizSuitOffset;
  BOOL	m_bHorizDummySuitsOverlap;
  //
  CString	m_strPrintText;
  //
  RECT		m_rectLayout;
  BOOL		m_bLayoutCardSelected;
  Position	m_nLayoutCardDest;
  Position	m_nLayoutCardOrigin;
  CCard* 		m_pLayoutCard;
  POINT		m_pointLayout;
  POINT		m_pointLayoutCardOffset;
  int			m_numCardsUnassigned;
  BOOL		m_bLayoutDlgActive;
  int			m_nPlayerCardLimit;
  //
  BOOL		m_bExchanging;
  int			m_nExchangeSrcPlayer;
  CCard* 		m_pExchangeCard;
  //
  HCURSOR		m_hCursor[4], m_hCursorInvalid[4];
  HCURSOR		m_hCursorPlay[4];
  HCURSOR		m_hCursorGrab, m_hCursorExchange;
  HCURSOR		m_hCursorClick;
  HCURSOR		m_hCursorHand;
  HCURSOR		m_hCursorHandIllegal;
  HCURSOR		m_hCursorBusy;
  HCURSOR		m_hDefaultCursor;
  HCURSOR		m_hCurrentCursor;
  //
  int			m_nColorDepth;
  int			m_nScreenWidth;
  int			m_nScreenHeight;
  BOOL		m_bOpeningSequenceDone;
  BOOL		m_bBitmapAvailable;
  CBitmap 	m_defaultBitmap;
  CBitmap 	m_winnersBitmap;
  CBitmap 	m_losersBitmap;
  CDIB		m_customDIB;
  CString		m_strBackgroundBitmap;
  BOOL		m_bAutoRestackCards;
  //
  CIntroWnd*	m_pIntroWnd;

  // Operations
private:
  // general routines
  CEasyBDoc* GetDocument();
  void Initialize();
  void Terminate();
  // display-oriented routines
  void PrepareCardLayout();
  void ClearCardExchangeMode();
  void BiddingComplete(BOOL bSuccess);
  void GameLoaded();
  void ResumeLoadedGame();
  void BeginPlay();
  void RestartPlay();
  void PromptGameOver();
public:
  void SetPrompt(LPCSTR szText, BOOL bLockPane = TRUE);
private:
  void ResetPrompt(BOOL bLockPane = FALSE);
  void ClearPrompt(BOOL bLockPane = FALSE);
  void DrawPlayerLabels(CDC* pDC);
  void DrawPlayingField(CDC* pDC);
  void DrawTableCards(CDC* pDC, BOOL bFullDraw = FALSE);
  void DrawCardLayoutMode(CDC* pDC, BOOL bDrawPile = TRUE, BOOL bDrawHands = TRUE);
  BOOL InRect(CPoint point, CCard* pCard);
  BOOL GetCardUnderPoint(int& nPlayer, CCard*& pCard, CPoint* pTargetPoint = NULL);
  // hand display routines
  void GetHandBoundsRect(Position nPos, RECT& rect);
  void DrawHoriz(CDC* pDC, Position nPos, int nDisplaySuit, BOOL bClearBackground, int nStartSuit, int nEndSuit);
  void PartialDrawHoriz(CDC* pDC, Position nPos);
  void DrawHorizGrouped(CDC* pDC, Position nPos, int nDisplaySuit, BOOL bClearBackground, int nStartSuit, int nEndSuit);
  void PartialDrawHorizGrouped(CDC* pDC, Position nPos);
  void DrawHorizDummy(CDC* pDC, Position nPos, int nDisplaySuit, BOOL bClearBackground, int nStartSuit, int nEndSuit);
  void PartialDrawHorizDummy(CDC* pDC, Position nPos);
  void DrawVert(CDC* pDC, Position nPos, int nDisplaySuit, BOOL bClearBackground, int nStartSuit, int nEndSuit);
  void PartialDrawVert(CDC* pDC, Position nPos);
  void DrawVertDummy(CDC* pDC, Position nPos, int nDisplaySuit, BOOL bClearBackground, int nStartSuit, int nEndSuit);
  void PartialDrawVertDummy(CDC* pDC, Position nPos);
  // play-oriented routines
  void EraseBackground(CDC& dc);
  void ClearDisplayArea(RECT* pRect = NULL, CDC* pSentDC = NULL);
  void ClearDisplayArea(int nLeft, int nTop, int nRight, int nBottom, CDC* pSentDC = NULL);
  void HandleCardPlay(CCard* pCard);
  // misc routines
public:
  void JumpCursor(int nPlayer = NONE);
private:
  void CheckForTrickCardsOverlap(CDC* pDC, RECT& eraseRect, CCard* pPlayedCard, BOOL bRedraw);
  CCard* GetPlayerBottomCard(CPlayer& player);
  void SetViewParameters(int cx = 0, int cy = 0);
  void ResetSuitOffsets(Position nPos = UNKNOWN);
  void DoOpeningSequence();
  void OnDoRealize();
  void SetWindowCursor(HCURSOR hCursor = NULL);
  BOOL OffsetRectValid(Position nPos);
  void AnimateTrick(int nWinner);
  void DrawCardBack(CDC* pDC, int x, int y);
  // printing
  int PrintTextBlock(CDC& dc, const int nCharHeight, CRect& rectPage, int& nPageLine, CString strSource);


public:
  // Overrides
    // ClassWizard generated virtual function overrides
    //{{AFX_VIRTUAL(CEasyBView)
public:
  virtual void OnDraw(CDC* pDC);  // overridden to draw this view
  virtual void OnInitialUpdate();
  virtual void OnPrepareDC(CDC* pDC, CPrintInfo* pInfo = NULL);
  virtual BOOL Create(LPCTSTR lpszClassName, LPCTSTR lpszWindowName, DWORD dwStyle, const RECT& rect, CWnd* pParentWnd, UINT nID, CCreateContext* pContext = NULL);
protected:
  virtual BOOL OnPreparePrinting(CPrintInfo* pInfo);
  virtual void OnBeginPrinting(CDC* pDC, CPrintInfo* pInfo);
  virtual void OnEndPrinting(CDC* pDC, CPrintInfo* pInfo);
  virtual BOOL OnCommand(WPARAM wParam, LPARAM lParam);
  virtual void OnActivateView(BOOL bActivate, CView* pActivateView, CView* pDeactiveView);
  virtual void OnPrint(CDC* pDC, CPrintInfo* pInfo);
  //}}AFX_VIRTUAL

// Implementation
public:
  virtual ~CEasyBView();
#ifdef _DEBUG
  virtual void AssertValid() const;
  virtual void Dump(CDumpContext& dc) const;
#endif

protected:

  // Generated message map functions
protected:
  //{{AFX_MSG(CEasyBView)
  afx_msg void OnMouseMove(UINT nFlags, CPoint point);
  afx_msg BOOL OnEraseBkgnd(CDC* pDC);
  afx_msg void OnLButtonDown(UINT nFlags, CPoint point);
  afx_msg void OnRButtonDown(UINT nFlags, CPoint point);
  afx_msg void OnUndoCard();
  afx_msg void OnUndoTrick();
  afx_msg void OnUpdateUndoCard(CCmdUI* pCmdUI);
  afx_msg void OnUpdateUndoTrick(CCmdUI* pCmdUI);
  afx_msg void OnLButtonUp(UINT nFlags, CPoint point);
  afx_msg void OnUpdateLayoutCards(CCmdUI* pCmdUI);
  afx_msg void OnLayoutCards();
  afx_msg void OnLButtonDblClk(UINT nFlags, CPoint point);
  afx_msg void OnUpdateDistributeRandom(CCmdUI* pCmdUI);
  afx_msg void OnDistributeRandom();
  afx_msg void OnDestroy();
  afx_msg void OnUpdateEditExistingHands(CCmdUI* pCmdUI);
  afx_msg void OnEditExistingHands();
  afx_msg void OnUpdateBidCurrentHand(CCmdUI* pCmdUI);
  afx_msg void OnBidCurrentHand();
  afx_msg void OnRefreshScreen();
  afx_msg void OnKeyDown(UINT nChar, UINT nRepCnt, UINT nFlags);
  afx_msg void OnFilePrint();
  afx_msg void OnUpdateFilePrint(CCmdUI* pCmdUI);
  afx_msg void OnFilePrintPreview();
  afx_msg void OnUpdateFilePrintPreview(CCmdUI* pCmdUI);
  afx_msg BOOL OnSetCursor(CWnd* pWnd, UINT nHitTest, UINT message);
  afx_msg void OnUpdateGameReview(CCmdUI* pCmdUI);
  afx_msg void OnGameReview();
  afx_msg void OnSize(UINT nType, int cx, int cy);
  //}}AFX_MSG
  DECLARE_MESSAGE_MAP()
};

#ifndef _DEBUG  // debug version in EasyBvw.cpp
inline CEasyBDoc* CEasyBView::GetDocument()
   { return (CEasyBDoc*)m_pDocument; }
#endif

/////////////////////////////////////////////////////////////////////////////
