//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

// EasyBdoc.h : interface of the CEasyBDoc class
//
/////////////////////////////////////////////////////////////////////////////

#ifndef __EASYBDOC__
#define __EASYBDOC__

#include "model/deal.h"

class CEasyBDoc : public Deal, public CDocument {
  // public routines
public:
  //
  static CEasyBDoc* GetDoc();
  // public access points
  void SaveFile() { OnFileSave(); }
  void SaveFileAs() { OnFileSaveAs(); }

  //
public:
  static CEasyBDoc* m_pDoc;

protected: // create from serialization only
  CEasyBDoc();
  DECLARE_DYNCREATE(CEasyBDoc)


  // Overrides
  // ClassWizard generated virtual function overrides
  //{{AFX_VIRTUAL(CEasyBDoc)
public:
  virtual BOOL OnNewDocument();
  virtual BOOL OnOpenDocument(LPCTSTR lpszPathName);
  virtual void DeleteContents();
  //}}AFX_VIRTUAL

  // Implementation
public:
  virtual ~CEasyBDoc();
  virtual void Serialize(CArchive& ar);   // overridden for document i/o
#ifdef _DEBUG
  virtual void AssertValid() const;
  virtual void Dump(CDumpContext& dc) const;
#endif

  void EndWaitCursorDoc();

  // Generated message map functions
public:
//protected:
  //{{AFX_MSG(CEasyBDoc)
    afx_msg void OnNewGame();
    afx_msg void OnFileOpen();
    afx_msg void OnUpdateFileSave(CCmdUI* pCmdUI);
    afx_msg void OnFileSave();
    afx_msg void OnUpdateFileSaveAs(CCmdUI* pCmdUI);
    afx_msg void OnFileSaveAs();
    afx_msg void OnDealGameHand();
    afx_msg void OnUpdateDealSpecial(CCmdUI* pCmdUI);
    afx_msg void OnDealGrandSlam();
    afx_msg void OnDealMajorGame();
    afx_msg void OnDealMinorGame();
    afx_msg void OnDealSlam();
    afx_msg void OnDealSmallSlam();
    afx_msg void OnDealNotrumpGame();
    afx_msg void OnSwapNS_EWCards();
    afx_msg void OnSwapPositionEast();
    afx_msg void OnSwapPositionNorth();
    afx_msg void OnSwapPositionWest();
    afx_msg void OnUpdateRestartCurrentHand(CCmdUI* pCmdUI);
    afx_msg void OnRestartCurrentHand();
    afx_msg void OnSwapCardsClockwise();
    afx_msg void OnSwapCardsCounterclockwise();
    afx_msg void OnUpdateDealNewHand(CCmdUI* pCmdUI);
    afx_msg void OnDealNewHand();
    afx_msg void OnViewScore();
    afx_msg void OnUpdateViewScore(CCmdUI* pCmdUI);
    afx_msg void OnUpdatePlayRubber(CCmdUI* pCmdUI);
    afx_msg void OnPlayRubber();
    afx_msg void OnUpdatePlayClaimTricks(CCmdUI* pCmdUI);
    afx_msg void OnPlayClaimTricks();
    afx_msg void OnUpdatePlayConcedeTricks(CCmdUI* pCmdUI);
    afx_msg void OnPlayConcedeTricks();
    afx_msg void OnUpdateGameAutoPlay(CCmdUI* pCmdUI);
    afx_msg void OnGameAutoPlay();
    afx_msg void OnUpdateGameAutoPlayAll(CCmdUI* pCmdUI);
    afx_msg void OnGameAutoPlayAll();
    afx_msg void OnUpdateClearAll(CCmdUI* pCmdUI);
    afx_msg void OnClearAll();
    afx_msg void OnUpdateSwapCards(CCmdUI* pCmdUI);
    afx_msg void OnUpdateGameHint(CCmdUI* pCmdUI);
    afx_msg void OnGameHint();
    afx_msg void OnUpdatePlayClaimContract(CCmdUI* pCmdUI);
    afx_msg void OnPlayClaimContract();
    afx_msg void OnDealGameHandEastWest();
    afx_msg void OnDealMajorGameEastWest();
    afx_msg void OnDealMinorGameEastWest();
    afx_msg void OnDealNotrumpGameEastWest();
    afx_msg void OnDealSlamEastWest();
    afx_msg void OnDealSmallSlamEastWest();
    afx_msg void OnDealGrandSlamEastWest();
    afx_msg void OnUpdateGameAutoPlayExpress(CCmdUI* pCmdUI);
    afx_msg void OnGameAutoPlayExpress();
    afx_msg void OnUpdateFileProperties(CCmdUI* pCmdUI);
    afx_msg void OnFileProperties();
    afx_msg void OnUpdateDealNumberedHand(CCmdUI* pCmdUI);
    afx_msg void OnDealNumberedHand();
    afx_msg void OnUpdateGameAutoTest(CCmdUI* pCmdUI);
    afx_msg void OnGameAutoTest();
  //}}AFX_MSG
  DECLARE_MESSAGE_MAP()
};

/////////////////////////////////////////////////////////////////////////////

#endif