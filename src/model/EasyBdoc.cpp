//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// EasyBdoc.cpp : implementation of the CEasyBDoc class
//

#include "stdafx.h"
#include "EasyB.h"
#include "EasyBdoc.h"
#include "EasyBvw.h"
#include "engine/player.h"
#include "engine/PlayerStatusDialog.h"
#include "mainfrm.h"
#include "MainFrameOpts.h"
#include "dialogs/myfildlg.h"
#include "engine/deck.h"
#include "engine/card.h"
#include "dialogs/RoundFinishedDialog.h"
#include "dialogs/BidDialog.h"
#include "NeuralNet.h"
#include "dialogs/scoredialog.h"
#include "progopts.h"
#include "docopts.h"
#include "viewopts.h"
#include "MyException.h"
#include "engine/GameRecord.h"
#include "engine/play/HandHoldings.h"
#include "engine/play/CombinedHoldings.h"
#include "engine/play/DeclarerPlayEngine.h"
#include "dialogs/SelectHandDialog.h"
#include "dialogs/FilePropertiesDialog.h"
#include "dialogs/DealNumberDialog.h"
#include "dialogs/AutoHintDialog.h"
#include "dialogs/TestPlayDialog.h"
#include "mmsystem.h"
#include "AppImpl.h"
//#include "MessageDisplay.h"

#ifdef _DEBUG
#undef THIS_FILE
static char BASED_CODE THIS_FILE[] = __FILE__;
#endif

//
const LPCTSTR tszFileFormatName[] = {
  "Easy Bridge", "Portable Bridge Notation", "Text"
};

//
CEasyBDoc* CEasyBDoc::m_pDoc = NULL;
BOOL CEasyBDoc::m_bInitialized = FALSE;


/////////////////////////////////////////////////////////////////////////////
// CEasyBDoc

IMPLEMENT_DYNCREATE(CEasyBDoc, CDocument)

BEGIN_MESSAGE_MAP(CEasyBDoc, CDocument)
  //{{AFX_MSG_MAP(CEasyBDoc)
  ON_COMMAND(ID_FILE_NEW, OnNewGame)
  ON_COMMAND(ID_FILE_OPEN, OnFileOpen)
  ON_UPDATE_COMMAND_UI(ID_FILE_SAVE, OnUpdateFileSave)
  ON_COMMAND(ID_FILE_SAVE, OnFileSave)
  ON_UPDATE_COMMAND_UI(ID_FILE_SAVE_AS, OnUpdateFileSaveAs)
  ON_COMMAND(ID_FILE_SAVE_AS, OnFileSaveAs)
  ON_COMMAND(ID_DEAL_GAME_HAND, OnDealGameHand)
  ON_UPDATE_COMMAND_UI(ID_DEAL_GAME_HAND, OnUpdateDealSpecial)
  ON_COMMAND(ID_DEAL_GRAND_SLAM, OnDealGrandSlam)
  ON_COMMAND(ID_DEAL_MAJOR_GAME, OnDealMajorGame)
  ON_COMMAND(ID_DEAL_MINOR_GAME, OnDealMinorGame)
  ON_COMMAND(ID_DEAL_SLAM, OnDealSlam)
  ON_COMMAND(ID_DEAL_SMALL_SLAM, OnDealSmallSlam)
  ON_COMMAND(ID_DEAL_NOTRUMP_GAME, OnDealNotrumpGame)
  ON_COMMAND(ID_SWAP_POSITION_EAST, OnSwapPositionEast)
  ON_COMMAND(ID_SWAP_POSITION_NORTH, OnSwapPositionNorth)
  ON_COMMAND(ID_SWAP_POSITION_WEST, OnSwapPositionWest)
  ON_UPDATE_COMMAND_UI(ID_RESTART_CURRENT_HAND, OnUpdateRestartCurrentHand)
  ON_COMMAND(ID_RESTART_CURRENT_HAND, OnRestartCurrentHand)
  ON_COMMAND(ID_SWAP_CARDS_CLOCKWISE, OnSwapCardsClockwise)
  ON_COMMAND(ID_SWAP_CARDS_COUNTERCLOCKWISE, OnSwapCardsCounterclockwise)
  ON_UPDATE_COMMAND_UI(ID_DEAL_NEW_HAND, OnUpdateDealNewHand)
  ON_COMMAND(ID_DEAL_NEW_HAND, OnDealNewHand)
  ON_COMMAND(ID_VIEW_SCORE, OnViewScore)
  ON_UPDATE_COMMAND_UI(ID_VIEW_SCORE, OnUpdateViewScore)
  ON_UPDATE_COMMAND_UI(ID_PLAY_RUBBER, OnUpdatePlayRubber)
  ON_COMMAND(ID_PLAY_RUBBER, OnPlayRubber)
  ON_UPDATE_COMMAND_UI(ID_PLAY_CLAIM_TRICKS, OnUpdatePlayClaimTricks)
  ON_COMMAND(ID_PLAY_CLAIM_TRICKS, OnPlayClaimTricks)
  ON_UPDATE_COMMAND_UI(ID_PLAY_CONCEDE_TRICKS, OnUpdatePlayConcedeTricks)
  ON_COMMAND(ID_PLAY_CONCEDE_TRICKS, OnPlayConcedeTricks)
  ON_UPDATE_COMMAND_UI(ID_GAME_AUTO_PLAY, OnUpdateGameAutoPlay)
  ON_COMMAND(ID_GAME_AUTO_PLAY, OnGameAutoPlay)
  ON_UPDATE_COMMAND_UI(ID_GAME_AUTO_PLAY_ALL, OnUpdateGameAutoPlayAll)
  ON_COMMAND(ID_GAME_AUTO_PLAY_ALL, OnGameAutoPlayAll)
  ON_UPDATE_COMMAND_UI(ID_CLEAR_ALL, OnUpdateClearAll)
  ON_COMMAND(ID_CLEAR_ALL, OnClearAll)
  ON_UPDATE_COMMAND_UI(ID_SWAP_POSITION_WEST, OnUpdateSwapCards)
  ON_UPDATE_COMMAND_UI(ID_GAME_HINT, OnUpdateGameHint)
  ON_COMMAND(ID_GAME_HINT, OnGameHint)
  ON_UPDATE_COMMAND_UI(ID_PLAY_CLAIM_CONTRACT, OnUpdatePlayClaimContract)
  ON_COMMAND(ID_PLAY_CLAIM_CONTRACT, OnPlayClaimContract)
  ON_COMMAND(ID_DEAL_GAME_HAND_EW, OnDealGameHandEastWest)
  ON_COMMAND(ID_DEAL_MAJOR_GAME_EW, OnDealMajorGameEastWest)
  ON_COMMAND(ID_DEAL_MINOR_GAME_EW, OnDealMinorGameEastWest)
  ON_COMMAND(ID_DEAL_NOTRUMP_GAME_EW, OnDealNotrumpGameEastWest)
  ON_COMMAND(ID_DEAL_SLAM_EW, OnDealSlamEastWest)
  ON_COMMAND(ID_DEAL_SMALL_SLAM_EW, OnDealSmallSlamEastWest)
  ON_COMMAND(ID_DEAL_GRAND_SLAM_EW, OnDealGrandSlamEastWest)
  ON_UPDATE_COMMAND_UI(ID_GAME_AUTO_PLAY_EXPRESS, OnUpdateGameAutoPlayExpress)
  ON_COMMAND(ID_GAME_AUTO_PLAY_EXPRESS, OnGameAutoPlayExpress)
  ON_UPDATE_COMMAND_UI(ID_FILE_PROPERTIES, OnUpdateFileProperties)
  ON_COMMAND(ID_FILE_PROPERTIES, OnFileProperties)
  ON_UPDATE_COMMAND_UI(ID_DEAL_NUMBERED_HAND, OnUpdateDealNumberedHand)
  ON_COMMAND(ID_DEAL_NUMBERED_HAND, OnDealNumberedHand)
  ON_UPDATE_COMMAND_UI(ID_DEAL_GRAND_SLAM, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_MAJOR_GAME, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_MINOR_GAME, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_SLAM, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_SMALL_SLAM, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_NOTRUMP_GAME, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_SWAP_POSITION_NORTH, OnUpdateSwapCards)
  ON_UPDATE_COMMAND_UI(ID_SWAP_POSITION_EAST, OnUpdateSwapCards)
  ON_UPDATE_COMMAND_UI(ID_SWAP_CARDS, OnUpdateSwapCards)
  ON_UPDATE_COMMAND_UI(ID_SWAP_CARDS_CLOCKWISE, OnUpdateSwapCards)
  ON_UPDATE_COMMAND_UI(ID_SWAP_CARDS_COUNTERCLOCKWISE, OnUpdateSwapCards)
  ON_UPDATE_COMMAND_UI(ID_DEAL_GAME_HAND_EW, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_MAJOR_GAME_EW, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_MINOR_GAME_EW, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_NOTRUMP_GAME_EW, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_SLAM_EW, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_SMALL_SLAM_EW, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_DEAL_GRAND_SLAM_EW, OnUpdateDealSpecial)
  ON_UPDATE_COMMAND_UI(ID_GAME_AUTO_TEST, OnUpdateGameAutoTest)
  ON_COMMAND(ID_GAME_AUTO_TEST, OnGameAutoTest)
  //}}AFX_MSG_MAP
END_MESSAGE_MAP()






/////////////////////////////////////////////////////////////////////////////
// CEasyBDoc construction/destruction

CEasyBDoc::CEasyBDoc() : Deal(std::make_shared<AppImpl>()) {
  m_pDoc = this;
}

CEasyBDoc::~CEasyBDoc() {
}


BOOL CEasyBDoc::OnNewDocument() {
  //
  if (!CDocument::OnNewDocument())
    return FALSE;

  // do inits
  if (theApp.IsRubberInProgress() || theApp.IsUsingDuplicateScoring())
    InitNewMatch();
  else
    InitNewGame();

  // (SDI documents will reuse this document)
  theApp.SetValuePV(tpvActiveDocument, this);

  // set format to native EasyBridge
  //	m_nFileFormat = tnEasyBridgeFormat;
  //	m_nPrevFileFormat = m_nFileFormat;

  // clear doc title
  SetTitle(_T(""));

  // done
  m_bInitialized = TRUE;
  return TRUE;
}


//
// OnOpenDocument()
//
BOOL CEasyBDoc::OnOpenDocument(LPCTSTR lpszPathName) {
  // suppress flashing
  pVIEW->SuppressRefresh();

  // close bidding dialog if it's open
  if (theApp.IsBiddingInProgress()) {
    theApp.SetValue(tbBiddingInProgress, FALSE);
    pVIEW->Notify(WM_COMMAND, WMS_BIDDING_CANCELLED);
  }

  // clear info
  ClearAllInfo();

  // confirm file type
  CString	strPath = lpszPathName;
  int nIndex = strPath.ReverseFind('.');
  if (nIndex >= 0) {
    CString strSuffix = strPath.Mid(nIndex + 1);
    if (strSuffix.CompareNoCase("pbn") == 0)
      m_nFileFormat = m_nPrevFileFormat = tnPBNFormat;
    else
      m_nFileFormat = m_nPrevFileFormat = tnEasyBridgeFormat;
  }

  //
  pMAINFRAME->SetStatusMessage("Loading file...");

  // load and check for errors
  BOOL bCode = CDocument::OnOpenDocument(lpszPathName);
  if (!bCode ||
    ((m_nFileFormat == tnPBNFormat) && (m_gameRecords.GetSize() == 0))) {
    // see if the load went OK, but there were no games found
    if (bCode)
      AfxMessageBox("No valid games were found in the PBN file!");
    pMAINFRAME->SetStatusMessage("An error ocurred while opening the file.");
    pVIEW->EnableRefresh();
    pMAINFRAME->Invalidate();
    return FALSE;
  }

  // else proceed
  pMAINFRAME->SetStatusMessage("File loaded.");
  pMAINFRAME->UpdateStatusWindow();

  // get and set doc title
  int nStart = strPath.ReverseFind(_T('\\'));
  if (nStart < 0)
    nStart = strPath.ReverseFind(_T(':'));
  ASSERT(nStart >= 0);
  m_strDocTitle = strPath.Mid(nStart + 1);
  SetTitle(m_strDocTitle);

  // set active document
  theApp.SetValuePV(tpvActiveDocument, this);

  // set contract and vulnerability info
  if (ISBID(m_nContract)) {
    pMAINFRAME->DisplayContract();
    pMAINFRAME->DisplayDeclarer();
    pMAINFRAME->DisplayVulnerable();
    // reset suit sequence
    theApp.InitDummySuitSequence(m_nContractSuit, m_nDummy);
  } else {
    // clear all
    pMAINFRAME->ClearAllIndicators();
  }

  // activate some dialogs
  if (m_bShowBidHistoryUponOpen)
    pMAINFRAME->MakeDialogVisible(twBiddingHistoryDialog);
  if (m_bShowPlayHistoryUponOpen)
    pMAINFRAME->MakeDialogVisible(twPlayHistoryDialog);

  // check if reviewing game
  if (m_bReviewingGame) {
    // start game review
    //		pVIEW->Notify(WM_COMMAND, WMS_RESET_DISPLAY);
    pVIEW->BeginGameReview(TRUE);
    pMAINFRAME->MakeDialogVisible(twGameReviewDialog);
    // see if a contract has been set
    if (ISBID(m_nContract)) {
      if (theApp.GetValue(tbAutoHideBidHistory))
        pMAINFRAME->HideDialog(twBiddingHistoryDialog);
      if (theApp.GetValue(tbAutoShowPlayHistory))
        pMAINFRAME->MakeDialogVisible(twPlayHistoryDialog);
    } else {
      if (theApp.GetValue(tbAutoShowBidHistory))
        pMAINFRAME->MakeDialogVisible(twBiddingHistoryDialog);
      if (theApp.GetValue(tbAutoHidePlayHistory))
        pMAINFRAME->HideDialog(twPlayHistoryDialog);
    }
    // done
    pVIEW->EnableRefresh();
    //???		pVIEW->SendMessage(WM_COMMAND, WMS_RESET_DISPLAY, 1);
    //		pVIEW->Refresh();
    return TRUE;
  }

  // else we're not reviewing game, so close the game review dialog if open
  pMAINFRAME->HideDialog(twGameReviewDialog);

  // but check if this is PBN format
  if (m_nFileFormat == tnPBNFormat) {
    // if so, load the game data
    LoadGameRecord(*(m_gameRecords[0]));
    // and hide the game review dialog
    pMAINFRAME->HideDialog(twGameReviewDialog);
  }

  //
  // there are currently only two entry points -- 
  // just prior to bidding, or just prior to play
  //
  if (theApp.IsGameInProgress()) {
    // init players with the new hands
    for (int i = 0; i<4; i++)
      m_pPlayer[i]->InitializeRestoredHand();

    // and start play
    pVIEW->InitNewRound();

    // ######## New Code!!! ########
    // see if we have plays recorded
    int nIndex = 0;
    int numRounds = m_numTricksPlayed;
    m_numTricksPlayed = 0;	// reset
    if (numRounds > 0) {
      BOOL bOldAnalysisSetting = theApp.GetValue(tbEnableAnalysisTracing);
      theApp.SetValue(tbEnableAnalysisTracing, FALSE);
      //
      m_bBatchMode = TRUE;
      for (int i = 0; i<4; i++)
        m_pPlayer[i]->SuspendTrace();
      pMAINFRAME->SetStatusText("Processing game position...");
      pMAINFRAME->LockStatusBar(TRUE);
      pVIEW->SetCurrentMode(CEasyBView::MODE_GAMERESTORE);
      //
      for (int nRound = 0; nRound<numRounds; nRound++) {
        // silently play out the cards to reach the saved position
        int nPlayer = m_nTrickLead[nRound];
        int j = 0;
        for (j = 0; j<4; j++) {
          // grab the card that was played
          int nDeckVal = m_nPlayRecord[nIndex];
          if (nDeckVal < 0)
            break;
          //
          CCard* pCard = theApp.GetDeck()->GetSortedCard(nDeckVal);
          if (pCard == NULL)
            break;	// reached end of play record

                    // see if we should expose dummy here
          if ((nRound == 0) && (j == 0))
            ExposeDummy(TRUE);

          // and play it out
          ASSERT(pCard->GetOwner() == nPlayer);
          EnterCardPlay((Position)nPlayer, pCard);
          //					pVIEW->Notify(WM_COMMAND, WMS_CARD_PLAY, (int)pCard);

          // if this is the last round, show the card
          if (nRound == numRounds - 1)
            pVIEW->DrawPlayedCard((Position)nPlayer, pCard, FALSE);

          //
          nPlayer = GetNextPlayer(nPlayer);
          nIndex++;
        }
        //
        if (j == 4) {
          // evaluate the trick
          EvaluateTrick(TRUE);
          // then clear, but but don't clear the final trick
          //					if (nRound < numRounds-1)
          pDOC->ClearTrick();
        }

      }

      // restore settings
      for (int i = 0; i<4; i++)
        m_pPlayer[i]->ResumeTrace();
      theApp.SetValue(tbEnableAnalysisTracing, bOldAnalysisSetting);
      pMAINFRAME->LockStatusBar(FALSE);
      pMAINFRAME->SetStatusText("Done.");
      m_bBatchMode = FALSE;

      // prompt if picking up the game
      if (m_numTricksPlayed < 13) {
        // then pick up where we left off
        pVIEW->PostMessage(WM_COMMAND, WMS_RESUME_GAME, 0);
      }
    }
  } else {
    // update the display
    //		UpdateDisplay();
    // just force reset of suit offsets for now
    pVIEW->ResetSuitOffsets();
    // and jump into bidding
    InitPlay(FALSE, TRUE);	// restarting saved game
  }

  // activate remaining dialogs
  if (m_bShowCommentsUponOpen)
    pMAINFRAME->MakeDialogVisible(twFileCommentsDialog);
  if (m_bShowAnalysesUponOpen)
    for (int i = 0; i<4; i++)
      pMAINFRAME->MakeDialogVisible(twAnalysisDialog, i);

  // restore disply
  pVIEW->EnableRefresh();
  //	pVIEW->Refresh();

  //
  return TRUE;
}


//
void CEasyBDoc::DeleteContents() {
  Deal::DeleteContents();
  CDocument::DeleteContents();
}


// static function
CEasyBDoc* CEasyBDoc::GetDoc() {
  return m_pDoc;
  /*
  // SDI document implementation file
  CFrameWnd* pFrame = (CFrameWnd*)(AfxGetApp()->m_pMainWnd);
  if (!pFrame)
  return NULL;
  return (CEasyBDoc*) pFrame->GetActiveDocument();
  */
}


/////////////////////////////////////////////////////////////////////////////
// CEasyBDoc serialization

void CEasyBDoc::Serialize(CArchive& ar) {
  if (ar.IsStoring()) {
    if (m_nFileFormat == tnPBNFormat)
      WriteFilePBN(ar);
    else if (m_nFileFormat == tnTextFormat)
      ExportGameInfo(ar);
    else
      WriteFile(ar);
  } else {
    BOOL bCode = FALSE;
    if (m_nFileFormat == tnPBNFormat) {
      try {
        bCode = ReadFilePBN(ar);
      } catch (...) {
      }
    } else {
      try {
        bCode = ReadFile(ar);
      } catch (...) {
      }
    }
    if (!bCode)
      throw (new CArchiveException());
  }
}


/////////////////////////////////////////////////////////////////////////////
// CEasyBDoc diagnostics

#ifdef _DEBUG
void CEasyBDoc::AssertValid() const {
  CDocument::AssertValid();
}

void CEasyBDoc::Dump(CDumpContext& dc) const {
  CDocument::Dump(dc);
}
#endif //_DEBUG



//////////////////////////////////////////////////////////
//
// EasyBDoc routines
//
//////////////////////////////////////////////////////////





//=======================================================================
//
// Game control operations
//
//=======================================================================


//
void CEasyBDoc::OnUpdateClearAll(CCmdUI* pCmdUI) {
  pCmdUI->Enable(TRUE);
}


//
void CEasyBDoc::OnClearAll() {
  if (theApp.IsRubberInProgress()) {
    if (AfxMessageBox("This will end the rubber.  Do you wish to continue?", MB_ICONQUESTION | MB_OKCANCEL) == IDCANCEL)
      return;
  }

  // clear document info
  ClearAllInfo();
  DeleteContents();
  m_strTitle = _T("");
  m_strPathName = _T("");

  // hide any special dialogs
  pMAINFRAME->HideDialog(twGameReviewDialog);

  // clear displays
  pMAINFRAME->ClearStatusWindow();
  pMAINFRAME->SetBiddingHistory(_T(""));

  // clear indicators
  pMAINFRAME->ClearAllIndicators();
  pMAINFRAME->SetStatusMessage("Press F2 or Shift+F2 for a new game.");
}


//
void CEasyBDoc::OnUpdatePlayRubber(CCmdUI* pCmdUI) {
  if (!theApp.IsRubberInProgress()) {
    pCmdUI->SetText("Play Rubber\tShift+F2");
    pCmdUI->SetCheck(0);
  } else {
    pCmdUI->SetText("End Rubber\tShift+F2");
    pCmdUI->SetCheck(1);
  }

  // check with the view to see if we can deal a new hand/play a new rubber
  if (pVIEW->CanDealNewHand())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
// OnPlayRubber() 
//
void CEasyBDoc::OnPlayRubber() {
  // see if we're currently playing rubber
  if (!theApp.IsRubberInProgress()) {
    // set rubber mode
    theApp.SetValue(tbRubberInProgress, TRUE);
    pMAINFRAME->SetModeIndicator("Match");
    OnNewDocument();
    OnDealNewHand();
  } else {
    // cancel rubber
    OnClearAll();
    /*
    theApp.SetValue(tbRubberInProgress, FALSE);
    pMAINFRAME->SetModeIndicator("");
    theApp.SetValue(tbGameInProgress, FALSE);
    ClearHands();
    ClearMatchInfo();
    pVIEW->ClearMode();
    pMAINFRAME->SetStatusMessage("Rubber cancelled.");
    */
  }
}



/////////////////////////////////////////////////////////////////////
//
// Hints
//
////////////////////////////////////////////////////////////////////

//
void CEasyBDoc::OnUpdateGameHint(CCmdUI* pCmdUI) {
  BOOL bEnable = TRUE;

  // disable if not bidding or playing
  if (!theApp.IsBiddingInProgress() && !theApp.IsGameInProgress())
    bEnable = FALSE;

  // disable if game is over
  if (theApp.IsGameInProgress() && (m_numTricksPlayed == 13))
    bEnable = FALSE;

  // disable if at the end of a trick
  //	if (m_numCardsPlayedInRound == 4)
  //		bEnable = FALSE;

  // disable if not our turn
  if (theApp.IsGameInProgress() &&
    (!ISPLAYER(m_nCurrPlayer) || !m_pPlayer[m_nCurrPlayer]->IsHumanPlayer()))
    bEnable = FALSE;

  // hints are invalid if the user ignored our previous bidding hint
  if (theApp.IsBiddingInProgress() && !m_bHintFollowed)
    bEnable = FALSE;

  // allow the user to click <space> to clear a trick
  if (m_numCardsPlayedInRound == 4)
    bEnable = TRUE;

  // else set
  pCmdUI->Enable(bEnable);

  // see if a hint is pending
  if (m_pLastPlayHint)
    pCmdUI->SetText("Accept Hint\tSpace");
  else
    pCmdUI->SetText("Hint\tSpace");
}



//
void CEasyBDoc::OnGameHint() {
  GetGameHint(FALSE);
}





/////////////////////////////////////////////////////////////////////////////
//
// CEasyBDoc commands
//
/////////////////////////////////////////////////////////////////////////////







//
void CEasyBDoc::OnUpdateDealNewHand(CCmdUI* pCmdUI) {
  // we can always deal a new hand, with a few exceptions
  // check with the view to see what mode we're in 
  if (pVIEW->CanDealNewHand())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnDealNewHand() {
  // clear the status display
  pMAINFRAME->ClearStatusWindow();
  pMAINFRAME->HideDialog(twFileCommentsDialog);

  // prep
  PrepForNewDeal();

  // and call the function to deal a new hand
  DealHands();

  // if using duplicate socring, update vulnerability display
  if (theApp.IsUsingDuplicateScoring())
    pMAINFRAME->DisplayVulnerable();
}




//
void CEasyBDoc::OnUpdateDealNumberedHand(CCmdUI* pCmdUI) {
  if (pVIEW->CanDealNewHand())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}


//
void CEasyBDoc::OnDealNumberedHand() {
  // prep
  PrepForNewDeal();

  // get the deal number
  CDealNumberDialog dealNumDlg;
  if (!dealNumDlg.DoModal())
    return;

  // set vulnerability & dealer
  m_nDealer = dealNumDlg.m_nDealer;
  m_nCurrPlayer = m_nDealer;
  m_nVulnerableTeam = (Team)dealNumDlg.m_nVulnerability;
  if ((m_nVulnerableTeam == NORTH_SOUTH) || (m_nVulnerableTeam == BOTH))
    m_bVulnerable[NORTH_SOUTH] = TRUE;
  if ((m_nVulnerableTeam == EAST_WEST) || (m_nVulnerableTeam == BOTH))
    m_bVulnerable[EAST_WEST] = TRUE;

  // and call the appropriate function to deal a new hand
  m_nSpecialDealCode = dealNumDlg.m_nSpecialDealCode;
  if (m_nSpecialDealCode == 0)
    DealHands(TRUE, dealNumDlg.m_nDealNumber);
  else
    DealSpecial(dealNumDlg.m_nDealNumber, m_nSpecialDealCode);

  // if using duplicate socring, update vulnerability display
  if (theApp.IsUsingDuplicateScoring())
    pMAINFRAME->DisplayVulnerable();
}


//
void CEasyBDoc::OnUpdateDealSpecial(CCmdUI* pCmdUI) {
  // check with the view to see what mode we're in 
  if (pVIEW->CanDealNewHand())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnDealGameHand() {
  //	CMessageDisplay("Dealing game...");
  DealSpecial(1, 0, 0);
}

//
void CEasyBDoc::OnDealMinorGame() {
  DealSpecial(1, 1, 0);
}

//
void CEasyBDoc::OnDealMajorGame() {
  DealSpecial(1, 2, 0);
}

//
void CEasyBDoc::OnDealNotrumpGame() {
  DealSpecial(1, 3, 0);
}

//
void CEasyBDoc::OnDealGameHandEastWest() {
  DealSpecial(1, 0, 0, EAST_WEST);
}

//
void CEasyBDoc::OnDealMinorGameEastWest() {
  DealSpecial(1, 1, 0, EAST_WEST);
}

//
void CEasyBDoc::OnDealMajorGameEastWest() {
  DealSpecial(1, 2, 0, EAST_WEST);
}

//
void CEasyBDoc::OnDealNotrumpGameEastWest() {
  DealSpecial(1, 3, 0, EAST_WEST);
}


//
void CEasyBDoc::OnDealSlam() {
  DealSpecial(2, 0, 0);
}

//
void CEasyBDoc::OnDealSmallSlam() {
  DealSpecial(2, 0, 1);
}

//
void CEasyBDoc::OnDealGrandSlam() {
  DealSpecial(2, 0, 2);
}

//
void CEasyBDoc::OnDealSlamEastWest() {
  DealSpecial(2, 0, 0, EAST_WEST);
}

void CEasyBDoc::OnDealSmallSlamEastWest() {
  DealSpecial(2, 0, 1, EAST_WEST);
}

void CEasyBDoc::OnDealGrandSlamEastWest() {
  DealSpecial(2, 0, 2, EAST_WEST);
}



//
void CEasyBDoc::OnNewGame() {
  // TODO: Add your command handler code here
  // stub function for the "File/New" command
}


//
void CEasyBDoc::OnUpdateViewScore(CCmdUI* pCmdUI) {
  if (theApp.IsRubberInProgress())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnViewScore() {
  // set the info
  CScoreDialog scoreDialog;
  scoreDialog.SetBonusPoints(m_strArrayBonusPointsRecord);
  scoreDialog.SetTrickPoints(m_strArrayTrickPointsRecord);
  //	scoreDialog.DisableGameControls();

  // get response
  scoreDialog.DoModal();
}


//
void CEasyBDoc::OnUpdateRestartCurrentHand(CCmdUI* pCmdUI) {
  if (theApp.GetValue(tbGameInProgress))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}


//
void CEasyBDoc::OnRestartCurrentHand() {
  // use the common function
  RestartCurrentHand(TRUE);
}






////////////////////////////////////////////////////////////////////////////
//
// Claim / Concede / Auto Play
//
/////////////////////////////////////////////////////////////////////////////

//
void CEasyBDoc::OnUpdatePlayClaimTricks(CCmdUI* pCmdUI) {
  if (theApp.GetValue(tbGameInProgress) && (m_numTricksPlayed < 13))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
// OnPlayClaimTricks() 
//
void CEasyBDoc::OnPlayClaimTricks() {
  // player claiming tricks
  int nPos = GetHumanPlayerPos();
  // may be claiming as declarer or defender
  // if human has contract, get the declarer, be it human or computer partner
  if ((nPos == NORTH) || (nPos == SOUTH))
    nPos = GetDeclarerPosition();

  // and check the claim
  int numTricksRequired = 13 - m_numTricksPlayed;
  int numClaimableTricks = m_pPlayer[nPos]->GetNumClaimableTricks();
  if (numClaimableTricks < numTricksRequired) {
    AfxMessageBox(FormString("The claim isn't evident yet -- you have only %d clear tricks versus %d more required.\nPlease play on.", numClaimableTricks, numTricksRequired), MB_ICONINFORMATION);
    return;
  }

  // process the claim
  ClaimTricks(nPos);
}


//
void CEasyBDoc::OnUpdatePlayClaimContract(CCmdUI* pCmdUI) {
  if (theApp.GetValue(tbGameInProgress) && (m_numTricksPlayed < 13))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}


//
void CEasyBDoc::OnPlayClaimContract() {
  // player claiming enough tricks for contract -- can only do so as declarer or dummy
  int nPos = GetHumanPlayerPos();
  // may be claiming as declarer or defender
  // if human has contract, get the declarer, be it human or computer partner
  if ((nPos != NORTH) && (nPos != SOUTH)) {
    AfxMessageBox("You cannot claim the contract when defending.");
    return;
  }

  // and check the claim
  int numTricksRequired = 6 + m_nContractLevel;
  int numTricksLeft = numTricksRequired - m_numTricksWon[GetPlayerTeam(nPos)];
  int numClaimableTricks = m_pPlayer[nPos]->GetNumClaimableTricks();
  if (numClaimableTricks < numTricksLeft) {
    AfxMessageBox(FormString("The claim isn't evident yet -- you have only %d clear tricks versus %d more required.\nPlease play on.", numClaimableTricks, numTricksLeft), MB_ICONINFORMATION);
    return;
  }

  // process the claim -- credit the player for all claimable tricks
  ClaimTricks(nPos, numClaimableTricks);
}






//
void CEasyBDoc::OnUpdatePlayConcedeTricks(CCmdUI* pCmdUI) {
  if (theApp.GetValue(tbGameInProgress) && (m_numTricksPlayed < 13))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
// OnPlayConcedeTricks() 
//
void CEasyBDoc::OnPlayConcedeTricks() {
  // confirm
  if (AfxMessageBox("Are you sure you wish to concede the rest of the tricks?", MB_ICONQUESTION | MB_OKCANCEL) == IDOK) {
    // process the claim
    int nPos = GetHumanPlayerPos();
    ConcedeTricks(nPos);
  }
}


//
void CEasyBDoc::OnUpdateGameAutoPlay(CCmdUI* pCmdUI) {
  if ((theApp.IsGameInProgress()) &&
    //		((m_nCurrPlayer == NORTH) || (m_nCurrPlayer == SOUTH)) &&
    (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlay() {
  // have the computer play for the human
  CPlayerStatusDialog& status = m_pPlayer[m_nCurrPlayer]->GetStatusDialog();
  status << "4PLYAUTO1! The computer is playing a card for the human player...\n";
  pMAINFRAME->SetStatusMessage(FormString(("Playing for %s..."), PositionToString(m_nCurrPlayer)));
  InvokeNextPlayer();
}


//
void CEasyBDoc::OnUpdateGameAutoPlayAll(CCmdUI* pCmdUI) {
  //
  if (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO)
    pCmdUI->SetCheck(1);
  else
    pCmdUI->SetCheck(0);
  //
  if (theApp.IsGameInProgress() &&
    ((pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY) ||
    (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK) ||
      (m_bAutoReplayMode)))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlayAll() {
  // clear hints if enabled
  if (theApp.GetValue(tnAutoHintMode) > 0)
    pMAINFRAME->ClearAutoHints();

  //
  CPlayerStatusDialog& status = m_pPlayer[m_nCurrPlayer]->GetStatusDialog();
  if (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO) {
    // check if we're in computer replay
    if (m_bAutoReplayMode) {
      m_bAutoReplayMode = FALSE;
      m_bExpressPlayMode = FALSE;
      // reset mode indicator
      pMAINFRAME->SetModeIndicator();
      pMAINFRAME->SetStatusMessage("Computer Replay cancelled.");
    } else {
      pMAINFRAME->SetStatusMessage("Auto play disabled.");
      status << "4PLYAUTO2a! Computer autoplay cancelled.\n";
    }
    theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
    if (((m_nCurrPlayer == NORTH) || (m_nCurrPlayer == SOUTH)) &&
      (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY))
      pVIEW->AdvanceToNextPlayer();
  } else {
    // have the computer play for the human
    status << "4PLYAUTO2b! The computer is taking over the remainder of play for the human...\n";
    if (!m_bAutoReplayMode)
      pMAINFRAME->SetStatusMessage("Auto play enabled.");
    pMAINFRAME->OnPlayModeFullAuto();
  }
}


//
void CEasyBDoc::OnUpdateGameAutoPlayExpress(CCmdUI* pCmdUI) {
  //
  if (theApp.InExpressAutoPlay())
    pCmdUI->SetCheck(1);
  else
    pCmdUI->SetCheck(0);
  //
  if (theApp.IsGameInProgress() &&
    ((pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY) ||
    (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK) ||
      (m_bAutoReplayMode)))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlayExpress() {
  // clear hints if enabled
  if (theApp.GetValue(tnAutoHintMode) > 0)
    pMAINFRAME->ClearAutoHints();

  //
  CPlayerStatusDialog& status = m_pPlayer[m_nCurrPlayer]->GetStatusDialog();
  if (theApp.InExpressAutoPlay()) {
    // check if we're in computer replay
    if (m_bAutoReplayMode) {
      m_bAutoReplayMode = FALSE;
      m_bExpressPlayMode = FALSE;
      // reset mode indicator
      pMAINFRAME->SetModeIndicator();
      pMAINFRAME->SetStatusMessage("Computer Replay cancelled.");
    } else {
      pMAINFRAME->SetStatusMessage("Full auto play disabled.");
      status << "4PLYAUTO3a! Computer autoplay cancelled.\n";
    }
    theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
    pVIEW->EnableRefresh();
    EndWaitCursor();
    if (((m_nCurrPlayer == NORTH) || (m_nCurrPlayer == SOUTH)) &&
      (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY))
      pVIEW->AdvanceToNextPlayer();
  } else {
    // have the computer play for the human
    if (m_bAutoReplayMode)
      pMAINFRAME->SetStatusMessage("Performing computer autoplay...");
    else
      pMAINFRAME->SetStatusMessage("Full auto play in progress...");
    status << "4PLYAUTO3b! The computer is playing the hands to completion...\n";
    theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_FULL_AUTO_EXPRESS);
    m_bExpressPlayMode = TRUE;
    BeginWaitCursor();

    // clear & prep the view for cards to be played
    if (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK) {
      // and wait for a click
      pVIEW->ClearTable();
      pVIEW->SuppressRefresh();
      ClearTrick();
    } else {
      pVIEW->SetCurrentMode(CEasyBView::MODE_WAITCARDPLAY);
    }
    //
    if ((theApp.IsGameInProgress()) && (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY))
      pVIEW->AdvanceToNextPlayer();
  }
}


void CEasyBDoc::EndWaitCursorDoc() {
  EndWaitCursor();
}

//
void CEasyBDoc::OnUpdateGameAutoTest(CCmdUI* pCmdUI) {
  pCmdUI->Enable(TRUE);
}

void CEasyBDoc::OnGameAutoTest() {
  // TODO: Add your command handler code here
  CTestPlayDialog testplay;
  testplay.DoModal();
}



/////////////////////////////////////////////////////////////////////////
//
// Misc operations
//
/////////////////////////////////////////////////////////////////////////




//
void CEasyBDoc::OnUpdateSwapCards(CCmdUI* pCmdUI) {
  //	if ((theApp.IsGameInProgress()) || (!m_bHandsDealt))
  if (!m_bHandsDealt)
    pCmdUI->Enable(FALSE);
  else
    pCmdUI->Enable(TRUE);
}

//
void CEasyBDoc::OnSwapPositionEast() {
  CWaitCursor wait;
  if (!theApp.IsGameInProgress()) {
    // not started playing yet
    SwapPlayersHands(SOUTH, EAST);
    pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_EAST);
  } else {
    // play has started
    SwapPartialHands(SOUTH, EAST);
    ResetDisplay();
    m_pPlayer[SOUTH]->InitializeSwappedHand();
    m_pPlayer[EAST]->InitializeSwappedHand();
  }
}

//
void CEasyBDoc::OnSwapPositionNorth() {
  CWaitCursor wait;
  if (!theApp.IsGameInProgress()) {
    // not started playing yet
    SwapPlayersHands(SOUTH, NORTH);
    pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_NORTH);
  } else {
    // play has started
    SwapPartialHands(SOUTH, EAST);
    ResetDisplay();
    m_pPlayer[SOUTH]->InitializeSwappedHand();
    m_pPlayer[NORTH]->InitializeSwappedHand();
  }
}

//
void CEasyBDoc::OnSwapPositionWest() {
  CWaitCursor wait;
  if (!theApp.IsGameInProgress()) {
    // not started playing yet
    SwapPlayersHands(SOUTH, WEST);
    pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_WEST);
  } else {
    // play has started
    SwapPartialHands(SOUTH, EAST);
    ResetDisplay();
    m_pPlayer[SOUTH]->InitializeSwappedHand();
    m_pPlayer[EAST]->InitializeSwappedHand();
  }
}

//
void CEasyBDoc::OnSwapCardsClockwise() {
  CWaitCursor wait;
  if (!theApp.IsGameInProgress()) {
    // not started playing yet
    RotatePlayersHands(0, TRUE, theApp.IsBiddingInProgress());
  } else {
    // play has started
    RotatePartialHands(1);
    ResetDisplay();
    pVIEW->AdvanceToNextPlayer();
  }
}


//
void CEasyBDoc::OnSwapCardsCounterclockwise() {
  CWaitCursor wait;
  if (!theApp.IsGameInProgress()) {
    // not started playing yet
    RotatePlayersHands(1, TRUE, theApp.IsBiddingInProgress());
  } else {
    // play has started
    RotatePartialHands(3);
    ResetDisplay();
    pVIEW->AdvanceToNextPlayer();
  }
}


//
void CEasyBDoc::OnFileOpen() {
  //
  CString strExtension = "brd";
  CString strTypeList = "EasyBridge Files (*.brd)|*.brd|Portable Bridge Notation Files (*.pbn)|*.pbn|All Files (*.*)|*.*||";
  if (m_nPrevFileFormat == tnPBNFormat) {
    strExtension = "pbn";
    strTypeList = "Portable Bridge Notation Files (*.pbn)|*.pbn|EasyBridge Files (*.brd)|*.brd|All Files (*.*)|*.*||";
  }
  //
  CMyFileDialog fileDlg(TRUE,
    strExtension,
    CString("*.") + strExtension,
    OFN_FILEMUSTEXIST | OFN_HIDEREADONLY,
    strTypeList,
    theApp.m_pMainWnd);
  fileDlg.m_nFileType = m_nPrevFileFormat;
  //
  if (fileDlg.DoModal() == IDCANCEL) {
    int nCode = ::CommDlgExtendedError();
    return;
  }

  // get selected file and path information
  CString strInputFileName = fileDlg.GetFileName();
  m_nFileFormat = fileDlg.m_nFileType;
  m_nPrevFileFormat = m_nFileFormat;

  // load doc
  theApp.OpenDocumentFile((LPCTSTR)strInputFileName);
  //	m_strDocTitle = strInputFileName;
  //	SetTitle(m_strDocTitle);
}



//
// OnUpdateFileSave()
// 
void CEasyBDoc::OnUpdateFileSave(CCmdUI* pCmdUI) {
  if ((!m_bHandsDealt) || !pVIEW->CanSaveFile())
    pCmdUI->Enable(FALSE);
  else
    pCmdUI->Enable(TRUE);
}


//
// OnFileSave()
//
void CEasyBDoc::OnFileSave() {
  if (m_strDocTitle.IsEmpty()) {
    OnFileSaveAs();
    return;
  }
  // save
  BeginWaitCursor();
  CString strPath = GetPathName();
  if (!pDOC->OnSaveDocument((LPCTSTR)strPath)) {
    // be sure to delete the file
    TRY
    {
      CFile::Remove((LPCTSTR)strPath);
    }
      CATCH_ALL(e) {
      TRACE0("Warning: failed to delete file after failed SaveAs.\n");
      //			DELETE_EXCEPTION(e);
    }
    END_CATCH_ALL
      EndWaitCursor();
    return;
  }
  EndWaitCursor();
  return;        // success
}


//
// OnUpdateFileSaveAs()
//
void CEasyBDoc::OnUpdateFileSaveAs(CCmdUI* pCmdUI) {
  if ((!m_bHandsDealt) || !pVIEW->CanSaveFile())
    pCmdUI->Enable(FALSE);
  else
    pCmdUI->Enable(TRUE);
}


//
// OnFileSaveAs() 
//
void CEasyBDoc::OnFileSaveAs() {
  // Save the document data to a file
  CString newPath, strFileName = m_strDocTitle;
  if (strFileName.IsEmpty())
    strFileName = GetTitle();
  CDocTemplate* pTemplate = pDOC->GetDocTemplate();
  ASSERT(pTemplate != NULL);

  // check for dubious filename
  int iBad = strFileName.FindOneOf(_T(" #%;/\\"));
  if (iBad != -1)
    strFileName.ReleaseBuffer(iBad);

  // determine proper suffix
  CString strExtension = "brd";
  CString strTypeList = "EasyBridge Files (*.brd)|*.brd|Portable Bridge Notation Files (*.pbn)|*.pbn|Text Files (*.txt)|*.txt|All Files (*.*)|*.*||";
  if (m_nPrevFileFormat == tnPBNFormat)
    strExtension = "pbn";
  else if (m_nPrevFileFormat == tnTextFormat)
    strExtension = "txt";

  // and append the default suffix if necessary
  if (!strFileName.IsEmpty()) {
    if (strFileName.Find(_T('.')) < 0) {
      CString strExt;
      if (pTemplate->GetDocString(strExt, CDocTemplate::filterExt) &&
        !strExt.IsEmpty()) {
        ASSERT(strExt[0] == '.');
        strFileName += strExt;
      }
    }
  } else {
    strFileName = CString("*.") + strExtension;
  }

  //
  TCHAR szTitle[100];
  if (!m_strDocTitle.IsEmpty())
    _tcscpy(szTitle, m_strDocTitle);
  //
  CMyFileDialog fileDlg(FALSE,
    strExtension,
    strFileName,
    OFN_HIDEREADONLY | OFN_OVERWRITEPROMPT,
    strTypeList,
    theApp.m_pMainWnd);
  //
  fileDlg.m_nFileType = m_nPrevFileFormat;
  fileDlg.m_ofn.nFilterIndex = m_nPrevFileFormat + 1;
  //
  if (fileDlg.DoModal() == IDCANCEL) {
    int nCode = ::CommDlgExtendedError();
    return;
  }

  // get selected file and path information
  strFileName = fileDlg.GetFileName();
  newPath = fileDlg.GetPathName();
  m_strDocTitle = strFileName;
  m_nFileFormat = fileDlg.m_nFileType;
  m_nPrevFileFormat = m_nFileFormat;

  //
  BeginWaitCursor();
  if (!pDOC->OnSaveDocument(strFileName)) {
    // be sure to delete the file
    TRY
    {
      CFile::Remove(newPath);
    }
      CATCH_ALL(e) {
      TRACE0("Warning: failed to delete file after failed SaveAs.\n");
      //			DELETE_EXCEPTION(e);
    }
    END_CATCH_ALL
      EndWaitCursor();
    return;
  }

  // reset the title and change the document name
  pDOC->SetPathName(newPath);
  EndWaitCursor();
  return;        // success
}


//
void CEasyBDoc::OnUpdateFileProperties(CCmdUI* pCmdUI) {
  pCmdUI->Enable(TRUE);
}


//
void CEasyBDoc::OnFileProperties() {
  CFilePropertiesDialog propDlg;
  //
  propDlg.m_strFileName = m_strDocTitle;
  if (propDlg.m_strFileName.IsEmpty())
    propDlg.m_strFileName = _T("Untitled");
  propDlg.m_strFileFormat = tszFileFormatName[m_nFileFormat];
  //
  propDlg.m_strDealNumber = GetDealIDString();
  //
  propDlg.DoModal();
}








//
//=======================================================
//
// generic property operators
//

//
// GetValuePV()
//
LPVOID CEasyBDoc::GetValuePV(int nItem, int nIndex1, int nIndex2, int nIndex3)  const {
  switch (nItem) {
  case tppPlayer:
    return (LPVOID)m_pPlayer[nIndex1];
  case tstrFileProgTitle:
    return (LPVOID)(LPCTSTR)m_strFileProgTitle;
  case tnFileProgramMajorVersion:
    return (LPVOID)m_nFileProgMajorVersion;
  case tnFileProgramMinorVersion:
    return (LPVOID)m_nFileProgMinorVersion;
  case tnFileProgramIncrementVersion:
    return (LPVOID)m_nFileProgIncrementVersion;
  case tnFileProgramBuildNumber:
    return (LPVOID)m_nFileProgBuildNumber;
  case tstrFileProgramBuildDate:
    return (LPVOID)(LPCTSTR)m_strFileProgBuildDate;
  case tstrFileDate:
    return (LPVOID)(LPCTSTR)m_strFileDate;
  case tstrFileDescription:
    return (LPVOID)(LPCTSTR)m_strFileDescription;
  case tstrFileComments:
    return (LPVOID)(LPCTSTR)m_strFileComments;
  case tstrDocTitle:
    return (LPVOID)(LPCTSTR)m_strDocTitle;
  case tbExpressPlayMode:
    return (LPVOID)(LPCTSTR)m_bExpressPlayMode;
  case tbAutoReplayMode:
    return (LPVOID)(LPCTSTR)m_bAutoReplayMode;
    // match/game info
  case tbReviewingGame:
    return (LPVOID)m_bReviewingGame;
  case tbGameReviewAvailable:
    return (LPVOID)m_bGameReviewAvailable;
  case tnGameScore:			// [30][2]
    return (LPVOID)m_nGameScore[nIndex1][nIndex2];
  case tnCurrGame:
    return (LPVOID)m_nCurrGame;
  case tnBonusScore:			// [2]
    return (LPVOID)m_nBonusScore[nIndex1];
  case tnTotalScore:			// [2]
    return (LPVOID)m_nTotalScore;
  case tnumGamesWon:
    return (LPVOID)m_numGamesWon[nIndex1];
  case tnVulnerableTeam:
    return (LPVOID)m_nVulnerableTeam;
  case tbVulnerable:			// [2]
    return (LPVOID)m_bVulnerable[nIndex1];
  case tstrTrickPointsRecord:
    return (LPVOID)(LPCTSTR)m_strArrayTrickPointsRecord.GetAt(nIndex1);
  case tstrBonusPointsRecord:
    return (LPVOID)(LPCTSTR)m_strArrayBonusPointsRecord.GetAt(nIndex1);
  case tstrTotalPointsRecord:
    return (LPVOID)(LPCTSTR)m_strTotalPointsRecord;
    // bid info
  case tnContract:
    return (LPVOID)m_nContract;
  case tnContractLevel:
    return (LPVOID)m_nContractLevel;
  case tnContractSuit:
    return (LPVOID)m_nContractSuit;
  case tnContractTeam:
    return (LPVOID)m_nContractTeam;
  case tnDefendingTeam:
    return (LPVOID)m_nDefendingTeam;
  case tnumBidsMade:
    return (LPVOID)m_numBidsMade;
  case tnOpeningBid:
    return (LPVOID)m_nOpeningBid;
  case tnOpeningBidder:
    return (LPVOID)m_nOpeningBidder;
  case tnumValidBidsMade:
    return (LPVOID)m_numValidBidsMade;
  case tnBiddingRound:
    return (LPVOID)m_nBiddingRound;
  case tbDoubled:
    return (LPVOID)m_bDoubled;
  case tnDoubler:
    return (LPVOID)m_nDoubler;
  case tbRedoubled:
    return (LPVOID)m_bRedoubled;
  case tnRedoubler:
    return (LPVOID)m_nRedoubler;
  case tnContractModifier:
    return (LPVOID)m_nContractModifier;
  case tnLastValidBid:
    return (LPVOID)m_nLastValidBid;
  case tnLastValidBidTeam:
    return (LPVOID)m_nLastValidBidTeam;
  case tnPartnershipSuit:	// [2]
    return (LPVOID)m_nPartnershipSuit[nIndex1];
  case tnPartnershipLead:	// [2][5]
    return (LPVOID)m_nPartnershipLead[nIndex1][nIndex2];
  case tnumPasses:
    return (LPVOID)m_numPasses;
  case tnBiddingHistory:	// [100]
    return (LPVOID)m_nBiddingHistory[nIndex1];
  case tnValidBidHistory:	// [100]
    return (LPVOID)m_nValidBidHistory[nIndex1];
  case tnBidsByPlayer:		// [4][50]
    return (LPVOID)m_nBidsByPlayer[nIndex1][nIndex2];
    // hand info
  case tnDealer:
    return (LPVOID)m_nDealer;
  case tnCurrentPlayer:
    return (LPVOID)m_nCurrPlayer;
  case tnPreviousDealer:
    return (LPVOID)m_nPrevDealer;
  case tnDeclarer:
    return (LPVOID)m_nDeclarer;
  case tnDummy:
    return (LPVOID)m_nDummy;
  case tbExposeDummy:
    return (LPVOID)m_bExposeDummy;
  case tnTrumpSuit:
    return (LPVOID)m_nTrumpSuit;
  case tnGameLead:
    return (LPVOID)m_nGameLead;
  case tnRoundLead:
    return (LPVOID)m_nRoundLead;
  case tnPlayRecord:
    return (LPVOID)m_nPlayRecord[nIndex1];
  case tpcGameTrick:		// [13][4]
    return (LPVOID)m_pGameTrick[nIndex1][nIndex2];
  case tnTrickLead:		// [13]
    return (LPVOID)m_nTrickLead[nIndex1];
  case tnTrickWinner:		// [13]
    return (LPVOID)m_nTrickWinner[nIndex1];
  case tpcCurrentTrick:	// [4] 
    return (LPVOID)m_pCurrTrick[nIndex1];
  case tnumTricksPlayed:
    return (LPVOID)m_numTricksPlayed;
  case tnumActualTricksPlayed:
    return (LPVOID)m_numActualTricksPlayed;
  case tnumCardsPlayedInRound:
    return (LPVOID)m_numCardsPlayedInRound;
  case tnumCardsPlayedInGame:
    return (LPVOID)m_numCardsPlayedInGame;
  case tnumTricksWon:		// [2]
    return (LPVOID)m_numTricksWon[nIndex1];
    // misc
  case tnDealNumber:
    return (LPVOID)(LPCTSTR)m_nDealNumber;
  case tnSpecialDealCode:
    return (LPVOID)m_nSpecialDealCode;
  case tbDealNumberAvailable:
    return (LPVOID)m_bDealNumberAvailable;
    // results info
  case tnSuitLed:
    return (LPVOID)m_nSuitLed;
  case tnHighVal:
    return (LPVOID)m_nHighVal;
  case tnHighTrumpVal:
    return (LPVOID)m_nHighTrumpVal;
  case tpvHighCard:
    return (LPVOID)m_pHighCard;
  case tnHighPos:
    return (LPVOID)m_nHighPos;
  case tnRoundWinner:
    return (LPVOID)m_nRoundWinner;
  case tnRoundWinningTeam:
    return (LPVOID)m_nRoundWinningTeam;
    // flags
  case tbHandsDealt:
    return (LPVOID)m_bHandsDealt;
  case tbShowCommentsUponOpen:
    return (LPVOID)m_bShowCommentsUponOpen;
  case tbShowBidHistoryUponOpen:
    return (LPVOID)m_bShowBidHistoryUponOpen;
  case tbShowPlayHistoryUponOpen:
    return (LPVOID)m_bShowPlayHistoryUponOpen;
  case tbShowAnalysesUponOpen:
    return (LPVOID)m_bShowAnalysesUponOpen;
  case tbSavePlayerAnalysis:
    return (LPVOID)m_bSavePlayerAnalysis[nIndex1];
  case tbDocSaveIntermediatePositions:
    return (LPVOID)m_bSaveIntermediatePositions;
  default:
    AfxMessageBox("Unhandled Call to CEasyBDoc::GetValuePV()");
    return NULL;
  }
  return 0;
}

//
double CEasyBDoc::GetValueDouble(int nItem, int nIndex1, int nIndex2, int nIndex3) const {
  /*
  switch(nItem)
  {
  default:
  AfxMessageBox("Unhandled Call to CEasyBDoc::GetValueDouble()");
  return 0;
  }
  */
  return 0;
}

//
int CEasyBDoc::SetValuePV(int nItem, LPVOID value, int nIndex1, int nIndex2, int nIndex3) {
  int nVal = (int)value;
  BOOL bVal = (BOOL)value;
  LPCTSTR sVal = (LPCTSTR)value;
  //
  switch (nItem) {
  case tppPlayer:
    break;
  case tstrFileProgTitle:
    break;
  case tnFileProgramMajorVersion:
    m_nFileProgMajorVersion = nVal;
    break;
  case tnFileProgramMinorVersion:
    m_nFileProgMinorVersion = nVal;
    break;
  case tnFileProgramIncrementVersion:
    m_nFileProgIncrementVersion = nVal;
    break;
  case tnFileProgramBuildNumber:
    m_nFileProgBuildNumber = nVal;
    break;
  case tstrFileProgramBuildDate:
    m_strFileProgBuildDate = sVal;
    break;
  case tstrFileDate:
    m_strFileDate = sVal;
    break;
  case tstrFileDescription:
    m_strFileDescription = sVal;
    break;
  case tstrFileComments:
    m_strFileComments = sVal;
    break;
  case tstrDocTitle:
    m_strDocTitle = sVal;
    break;
  case tbExpressPlayMode:
    m_bExpressPlayMode = bVal;
    break;
  case tbAutoReplayMode:
    m_bAutoReplayMode = bVal;
    break;
    // match/game info
  case tbReviewingGame:
    m_bReviewingGame = bVal;
    break;
  case tbGameReviewAvailable:
    m_bGameReviewAvailable = bVal;
    break;
  case tnGameScore:			// [30][2]
    m_nGameScore[nIndex1][nIndex2] = nVal;
    break;
  case tnCurrGame:
    m_nCurrGame = nVal;
    break;
  case tnBonusScore:			// [2]
    m_nBonusScore[nIndex1] = nVal;
    break;
  case tnTotalScore:			// [2]
    m_nTotalScore[nIndex1] = nVal;
    break;
  case tnumGamesWon:
    m_numGamesWon[nIndex1] = nVal;
    break;
  case tnVulnerableTeam:
    m_nVulnerableTeam = (Team)nVal;
    break;
  case tbVulnerable:			// [2]
    m_bVulnerable[nIndex1] = nVal;
    break;
  case tstrTrickPointsRecord:
    //			m_strArrayTrickPointsRecord = sVal;
    break;
  case tstrBonusPointsRecord:
    //			m_strArrayBonusPointsRecord = sVal;
    break;
  case tstrTotalPointsRecord:
    m_strTotalPointsRecord = sVal;
    break;
    // bidding info
  case tnContract:
    m_nContract = nVal;
    break;
  case tnContractLevel:
    m_nContractLevel = nVal;
    break;
  case tnContractSuit:
    m_nContractSuit = nVal;
    break;
  case tnContractTeam:
    m_nContractTeam = nVal;
    break;
  case tnDefendingTeam:
    m_nDefendingTeam = nVal;
    break;
  case tnumBidsMade:
    m_numBidsMade = nVal;
    break;
  case tnOpeningBid:
    m_nOpeningBid = nVal;
    break;
  case tnOpeningBidder:
    m_nOpeningBidder = nVal;
    break;
  case tnumValidBidsMade:
    m_numValidBidsMade = nVal;
    break;
  case tnBiddingRound:
    m_nBiddingRound = nVal;
    break;
  case tbDoubled:
    m_bDoubled = bVal;
    break;
  case tnDoubler:
    m_nDoubler = nVal;
    break;
  case tbRedoubled:
    m_bRedoubled = bVal;
    break;
  case tnRedoubler:
    m_nRedoubler = nVal;
    break;
  case tnContractModifier:
    m_nContractModifier = nVal;
    break;
  case tnLastValidBid:
    m_nLastValidBid = nVal;
    break;
  case tnLastValidBidTeam:
    m_nLastValidBidTeam = nVal;
    break;
  case tnPartnershipSuit:	// [2]
    m_nPartnershipSuit[nIndex1] = nVal;
    break;
  case tnPartnershipLead:	// [2][5]
    m_nPartnershipLead[nIndex1][nIndex2] = nVal;
    break;
  case tnumPasses:
    m_numPasses = nVal;
    break;
  case tnBiddingHistory:	// [100]
    m_nBiddingHistory[nIndex1] = nVal;
    break;
  case tnValidBidHistory:	// [100]
    m_nValidBidHistory[nIndex1] = nVal;
    break;
  case tnBidsByPlayer:		// [4][50]
    m_nBidsByPlayer[nIndex1][nIndex2] = nVal;
    break;
    // hand info
  case tnDealer:
    m_nDealer = nVal;
    break;
  case tnCurrentPlayer:
    m_nCurrPlayer = nVal;
    break;
  case tnPreviousDealer:
    m_nPrevDealer = nVal;
    break;
  case tnDeclarer:
    m_nDeclarer = nVal;
    break;
  case tnDummy:
    m_nDummy = nVal;
    break;
  case tbExposeDummy:
    m_bExposeDummy = bVal;
    break;
  case tnTrumpSuit:
    m_nTrumpSuit = nVal;
    break;
  case tnGameLead:
    m_nGameLead = nVal;
    break;
  case tnRoundLead:
    m_nRoundLead = nVal;
    break;
  case tnPlayRecord:
    m_nPlayRecord[nIndex1] = nVal;
    break;
  case tpcGameTrick:		// [13][4]
    m_pGameTrick[nIndex1][nIndex2] = (CCard*)value;
    break;
  case tnTrickLead:		// [13]
    m_nTrickLead[nIndex1] = nVal;
    break;
  case tnTrickWinner:		// [13]
    m_nTrickWinner[nIndex1] = nVal;
    break;
  case tpcCurrentTrick:	// [4] 
    m_pCurrTrick[nIndex1] = (CCard*)value;
    break;
  case tnumTricksPlayed:
    m_numTricksPlayed = nVal;
    break;
  case tnumActualTricksPlayed:
    m_numActualTricksPlayed = nVal;
    break;
  case tnumCardsPlayedInRound:
    m_numCardsPlayedInRound = nVal;
    break;
  case tnumCardsPlayedInGame:
    m_numCardsPlayedInGame = nVal;
    break;
  case tnumTricksWon:		// [2]
    m_numTricksWon[nIndex1] = nVal;
    break;
    // misc
  case tnDealNumber:
    m_nDealNumber = nVal;
    break;
  case tnSpecialDealCode:
    m_nSpecialDealCode = nVal;
    break;
  case tbDealNumberAvailable:
    m_bDealNumberAvailable = bVal;
    break;
    // results info
  case tnSuitLed:
    m_nSuitLed = nVal;
    break;
  case tnHighVal:
    m_nHighVal = nVal;
    break;
  case tnHighTrumpVal:
    m_nHighTrumpVal = nVal;
    break;
  case tpvHighCard:
    m_pHighCard = (CCard*)value;
    break;
  case tnHighPos:
    m_nHighPos = nVal;
    break;
  case tnRoundWinner:
    m_nRoundWinner = nVal;
    break;
  case tnRoundWinningTeam:
    m_nRoundWinningTeam = (Team)nVal;
    break;
    // flags
  case tbHandsDealt:
    m_bHandsDealt = bVal;
    break;
  case tbShowCommentsUponOpen:
    m_bShowCommentsUponOpen = bVal;
    break;
  case tbShowBidHistoryUponOpen:
    m_bShowBidHistoryUponOpen = bVal;
    break;
  case tbShowPlayHistoryUponOpen:
    m_bShowPlayHistoryUponOpen = bVal;
    break;
  case tbShowAnalysesUponOpen:
    m_bShowAnalysesUponOpen = bVal;
    break;
  case tbSavePlayerAnalysis:
    m_bSavePlayerAnalysis[nIndex1] = bVal;
    break;
  case tbDocSaveIntermediatePositions:
    m_bSaveIntermediatePositions = bVal;
    break;
  default:
    AfxMessageBox("Unhandled Call to CEasyBDoc::SetValuePV()");
    return 1;
  }
  return 0;
}

//
int CEasyBDoc::SetValue(int nItem, double fValue, int nIndex1, int nIndex2, int nIndex3) {
  /*
  switch(nItem)
  {
  default:
  AfxMessageBox("Unhandled Call to CEasyBDoc::SetValueDouble()");
  return 1;
  }
  */
  return 0;
}

// conversion functions
LPCTSTR CEasyBDoc::GetValueString(int nItem, int nIndex1, int nIndex2, int nIndex3) const {
  return (LPCTSTR)GetValue(nItem, nIndex1, nIndex2, nIndex3);
}

int CEasyBDoc::GetValue(int nItem, int nIndex1, int nIndex2, int nIndex3) const {
  return (int)GetValuePV(nItem, nIndex1, nIndex2, nIndex3);
}

int CEasyBDoc::SetValue(int nItem, LPCTSTR szValue, int nIndex1, int nIndex2, int nIndex3) {
  return SetValuePV(nItem, (LPVOID)szValue, nIndex1, nIndex2, nIndex3);
}

int CEasyBDoc::SetValue(int nItem, int nValue, int nIndex1, int nIndex2, int nIndex3) {
  return SetValuePV(nItem, (LPVOID)nValue, nIndex1, nIndex2, nIndex3);
}


