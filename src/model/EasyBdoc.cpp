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
#include "viewopts.h"
#include "MyException.h"
#include "model/GameRecord.h"
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

CEasyBDoc::CEasyBDoc() {
  // set default file format to native
  m_nFileFormat = Deal::tnEasyBridgeFormat;
  m_nPrevFileFormat = m_nFileFormat;

  m_pDoc = this;
  deal_ = std::make_shared<Deal>(std::make_shared<AppImpl>());
}

CEasyBDoc::~CEasyBDoc() {}


BOOL CEasyBDoc::OnNewDocument() {
  //
  if (!CDocument::OnNewDocument())
    return FALSE;

  deal_->InitNewDocument();

  // clear doc title
  CDocument::SetTitle("");

  return TRUE;
}


//
// OnOpenDocument()
//
BOOL CEasyBDoc::OnOpenDocument(LPCTSTR lpszPathName) {
  // suppress flashing
  pVIEW->SuppressRefresh();

  // close bidding dialog if it's open
  if (theApp.GetSettings()->GetBiddingInProgress()) {
    theApp.GetSettings()->SetBiddingInProgress(false);
    pVIEW->Notify(WM_COMMAND, WMS_BIDDING_CANCELLED);
  }

  // clear info
  deal_->ClearAllInfo();

  // confirm file type
  CString	strPath = lpszPathName;
  int nIndex = strPath.ReverseFind('.');
  if (nIndex >= 0) {
    CString strSuffix = strPath.Mid(nIndex + 1);
    if (strSuffix.CompareNoCase("pbn") == 0) {
      m_nFileFormat = m_nPrevFileFormat = Deal::tnPBNFormat;
    } else {
      m_nFileFormat = m_nPrevFileFormat = Deal::tnEasyBridgeFormat;
    }
  }

  //
  pMAINFRAME->SetStatusMessage("Loading file...");

  // load and check for errors
  BOOL bCode = CDocument::OnOpenDocument(lpszPathName);
  if (!bCode || (m_nFileFormat == Deal::tnPBNFormat && !deal_->HasRecords())) {
    // see if the load went OK, but there were no games found
    if (bCode) {
      AfxMessageBox("No valid games were found in the PBN file!");
    }
    pVIEW->EnableRefresh();
    pMAINFRAME->SetStatusMessage("An error occurred while opening the file.");
    pMAINFRAME->Invalidate();
    return FALSE;
  }

  // else proceed
  pMAINFRAME->SetStatusMessage("File loaded.");
  pMAINFRAME->UpdateStatusWindow();

  // get and set doc title
  int nStart = strPath.ReverseFind(_T('\\'));
  if (nStart < 0) {
    nStart = strPath.ReverseFind(_T(':'));
  }
  ASSERT(nStart >= 0);
  deal_->SetTitle(strPath.Mid(nStart + 1));
  CDocument::SetTitle(deal_->GetTitle());

  // set contract and vulnerability info
  if (ISBID(deal_->GetContract())) {
    pMAINFRAME->DisplayContract();
    pMAINFRAME->DisplayDeclarer();
    pMAINFRAME->DisplayVulnerable();
    // reset suit sequence
    theApp.GetSettings()->InitDummySuitSequence(deal_->GetContractSuit(), deal_->GetDummyPosition());
  } else {
    // clear all
    pMAINFRAME->ClearAllIndicators();
  }

  // activate some dialogs
  if (deal_->IsShowBidHistoryUponOpen()) {
    pMAINFRAME->MakeDialogVisible(twBiddingHistoryDialog);
  }
  if (deal_->IsShowPlayHistoryUponOpen()) {
    pMAINFRAME->MakeDialogVisible(twPlayHistoryDialog);
  }

  // check if reviewing game
  if (deal_->IsReviewingGame()) {
    // start game review
    //		pVIEW->Notify(WM_COMMAND, WMS_RESET_DISPLAY);
    pVIEW->BeginGameReview(TRUE);
    pMAINFRAME->MakeDialogVisible(twGameReviewDialog);
    // see if a contract has been set
    if (ISBID(deal_->GetContract())) {
      if (theApp.GetSettings()->GetAutoHideBidHistory()) {
        pMAINFRAME->HideDialog(twBiddingHistoryDialog);
      }
      if (theApp.GetSettings()->GetAutoShowPlayHistory()) {
        pMAINFRAME->MakeDialogVisible(twPlayHistoryDialog);
      }
    } else {
      if (theApp.GetSettings()->GetAutoShowBidHistory()) {
        pMAINFRAME->MakeDialogVisible(twBiddingHistoryDialog);
      }
      if (theApp.GetSettings()->GetAutoHidePlayHistory()) {
        pMAINFRAME->HideDialog(twPlayHistoryDialog);
      }
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
  if (m_nFileFormat == Deal::tnPBNFormat) {
    // if so, load the game data
    deal_->LoadFirstGameRecord();
    // and hide the game review dialog
    pMAINFRAME->HideDialog(twGameReviewDialog);
  }

  //
  // there are currently only two entry points -- 
  // just prior to bidding, or just prior to play
  //
  if (theApp.GetSettings()->GetGameInProgress()) {
    // init players with the new hands
    for (int i = 0; i < 4; i++) {
      deal_->GetPlayer(i)->InitializeRestoredHand();
    }

    // and start play
    pVIEW->InitNewRound();

    // ######## New Code!!! ########
    // see if we have plays recorded
    nIndex = 0;
    int numRounds = deal_->GetNumTricksPlayed();
    deal_->SetNumTricksPlayed(0);	// reset
    if (numRounds > 0) {
      BOOL bOldAnalysisSetting = theApp.GetSettings()->GetEnableAnalysisTracing();
      theApp.GetSettings()->SetEnableAnalysisTracing(false);
      //
      deal_->SetBatchMode(TRUE);
      for (int i = 0; i < 4; i++) {
        deal_->GetPlayer(i)->SuspendTrace();
      }
      pMAINFRAME->SetStatusText("Processing game position...");
      pMAINFRAME->LockStatusBar(TRUE);
      pVIEW->SetCurrentMode(CEasyBView::MODE_GAMERESTORE);
      //
      for (int nRound = 0; nRound < numRounds; nRound++) {
        // silently play out the cards to reach the saved position
        int nPlayer = deal_->GetGameTrickLead(nRound);
        int j = 0;
        for (j = 0; j < 4; j++) {
          // grab the card that was played
          int nDeckVal = deal_->GetPlayRecord(nIndex);
          if (nDeckVal < 0) {
            break;
          }
          //
          CCard* pCard = theApp.GetDeck()->GetSortedCard(nDeckVal);
          if (pCard == NULL) {
            break;	// reached end of play record
          }
          // see if we should expose dummy here
          if ((nRound == 0) && (j == 0)) {
            deal_->ExposeDummy(TRUE);
          }

          // and play it out
          ASSERT(pCard->GetOwner() == nPlayer);
          deal_->EnterCardPlay((Position)nPlayer, pCard);
          //					pVIEW->Notify(WM_COMMAND, WMS_CARD_PLAY, (int)pCard);

          // if this is the last round, show the card
          if (nRound == numRounds - 1) {
            pVIEW->DrawPlayedCard((Position)nPlayer, pCard, FALSE);
          }

          //
          nPlayer = GetNextPlayer(nPlayer);
          nIndex++;
        }
        //
        if (j == 4) {
          // evaluate the trick
          deal_->EvaluateTrick(TRUE);
          // then clear, but but don't clear the final trick
          //					if (nRound < numRounds-1)
          deal_->ClearTrick();
        }
      }

      // restore settings
      for (int i = 0; i < 4; i++) {
        deal_->GetPlayer(i)->ResumeTrace();
      }
      theApp.GetSettings()->SetEnableAnalysisTracing(bOldAnalysisSetting);
      pMAINFRAME->LockStatusBar(FALSE);
      pMAINFRAME->SetStatusText("Done.");
      deal_->SetBatchMode(FALSE);

      // prompt if picking up the game
      if (deal_->GetNumTricksPlayed() < 13) {
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
    deal_->InitPlay(FALSE, TRUE);	// restarting saved game
  }

  // activate remaining dialogs
  if (deal_->IsShowCommentsUponOpen()) {
    pMAINFRAME->MakeDialogVisible(twFileCommentsDialog);
  }
  if (deal_->IsShowAnalysesUponOpen()) {
    for (int i = 0; i < 4; i++) {
      pMAINFRAME->MakeDialogVisible(twAnalysisDialog, i);
    }
  }

  // restore disply
  pVIEW->EnableRefresh();
  //	pVIEW->Refresh();

  //
  return TRUE;
}


void CEasyBDoc::DeleteContents() {
  deal_->DeleteContents();
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
    if (m_nFileFormat == Deal::tnPBNFormat)
      ar << deal_->WriteFilePBN().c_str();
    else if (m_nFileFormat == Deal::tnTextFormat)
      deal_->ExportGameInfo(ar);
    else
      deal_->WriteFile(ar);
  } else {
    BOOL bCode = FALSE;
    if (m_nFileFormat == Deal::tnPBNFormat) {
      try {
        bCode = deal_->ReadFilePBN(ar);
      } catch (...) {}
    } else {
      try {
        bCode = deal_->ReadFile(ar);
      } catch (...) {}
    }
    if (!bCode) {
      throw (new CArchiveException());
    }
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
  if (theApp.GetSettings()->GetRubberInProgress()) {
    if (AfxMessageBox("This will end the rubber.  Do you wish to continue?", MB_ICONQUESTION | MB_OKCANCEL) == IDCANCEL)
      return;
  }

  // clear document info
  deal_->ClearAllInfo();
  deal_->DeleteContents();
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
  if (!theApp.GetSettings()->GetRubberInProgress()) {
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
  if (!theApp.GetSettings()->GetRubberInProgress()) {
    // set rubber mode
    theApp.GetSettings()->SetRubberInProgress(true);
    pMAINFRAME->SetModeIndicator("Match");
    OnNewDocument();
    OnDealNewHand();
  } else {
    // cancel rubber
    OnClearAll();
    /*
    theApp.GetSettings()->SetValue(tbRubberInProgress, FALSE);
    pMAINFRAME->SetModeIndicator("");
    theApp.GetSettings()->SetValue(tbGameInProgress, FALSE);
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
  if (!theApp.GetSettings()->GetBiddingInProgress() && !theApp.GetSettings()->GetGameInProgress())
    bEnable = FALSE;

  // disable if game is over
  if (theApp.GetSettings()->GetGameInProgress() && (deal_->GetNumTricksPlayed() == 13))
    bEnable = FALSE;

  // disable if at the end of a trick
  //	if (m_numCardsPlayedInRound == 4)
  //		bEnable = FALSE;

  // disable if not our turn
  if (theApp.GetSettings()->GetGameInProgress() &&
    (!ISPLAYER(deal_->GetCurrentPlayerPosition()) || !deal_->GetCurrentPlayer()->IsHumanPlayer()))
    bEnable = FALSE;

  // hints are invalid if the user ignored our previous bidding hint
  if (theApp.GetSettings()->GetBiddingInProgress() && !deal_->IsHintFollowed())
    bEnable = FALSE;

  // allow the user to click <space> to clear a trick
  if (deal_->GetNumCardsPlayedInRound() == 4)
    bEnable = TRUE;

  // else set
  pCmdUI->Enable(bEnable);

  // see if a hint is pending
  if (deal_->GetLastPlayHint())
    pCmdUI->SetText("Accept Hint\tSpace");
  else
    pCmdUI->SetText("Hint\tSpace");
}



//
void CEasyBDoc::OnGameHint() {
  deal_->GetGameHint(FALSE);
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
  deal_->PrepForNewDeal();

  // and call the function to deal a new hand
  deal_->DealHands();

  // if using duplicate scoring, update vulnerability display
  if (theApp.GetSettings()->GetUsingDuplicateScoring())
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
  deal_->PrepForNewDeal();

  // get the deal number
  CDealNumberDialog dealNumDlg;
  if (!dealNumDlg.DoModal())
    return;

  deal_->DealNumberedHand(dealNumDlg.m_nDealer, dealNumDlg.m_nVulnerability, 
      dealNumDlg.m_nSpecialDealCode, dealNumDlg.m_nDealNumber);

  // if using duplicate scoring, update vulnerability display
  if (theApp.GetSettings()->GetUsingDuplicateScoring())
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
  deal_->DealSpecial(1, 0, 0);
}

//
void CEasyBDoc::OnDealMinorGame() {
  deal_->DealSpecial(1, 1, 0);
}

//
void CEasyBDoc::OnDealMajorGame() {
  deal_->DealSpecial(1, 2, 0);
}

//
void CEasyBDoc::OnDealNotrumpGame() {
  deal_->DealSpecial(1, 3, 0);
}

//
void CEasyBDoc::OnDealGameHandEastWest() {
  deal_->DealSpecial(1, 0, 0, EAST_WEST);
}

//
void CEasyBDoc::OnDealMinorGameEastWest() {
  deal_->DealSpecial(1, 1, 0, EAST_WEST);
}

//
void CEasyBDoc::OnDealMajorGameEastWest() {
  deal_->DealSpecial(1, 2, 0, EAST_WEST);
}

//
void CEasyBDoc::OnDealNotrumpGameEastWest() {
  deal_->DealSpecial(1, 3, 0, EAST_WEST);
}


//
void CEasyBDoc::OnDealSlam() {
  deal_->DealSpecial(2, 0, 0);
}

//
void CEasyBDoc::OnDealSmallSlam() {
  deal_->DealSpecial(2, 0, 1);
}

//
void CEasyBDoc::OnDealGrandSlam() {
  deal_->DealSpecial(2, 0, 2);
}

//
void CEasyBDoc::OnDealSlamEastWest() {
  deal_->DealSpecial(2, 0, 0, EAST_WEST);
}

void CEasyBDoc::OnDealSmallSlamEastWest() {
  deal_->DealSpecial(2, 0, 1, EAST_WEST);
}

void CEasyBDoc::OnDealGrandSlamEastWest() {
  deal_->DealSpecial(2, 0, 2, EAST_WEST);
}



//
void CEasyBDoc::OnNewGame() {
  // TODO: Add your command handler code here
  // stub function for the "File/New" command
}


//
void CEasyBDoc::OnUpdateViewScore(CCmdUI* pCmdUI) {
  if (theApp.GetSettings()->GetRubberInProgress())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnViewScore() {
  // set the info
  CScoreDialog scoreDialog;
  scoreDialog.SetBonusPoints(deal_->GetBonusPointsRecords());
  scoreDialog.SetTrickPoints(deal_->GetTrickPointsRecords());
  //	scoreDialog.DisableGameControls();

  // get response
  scoreDialog.DoModal();
}


//
void CEasyBDoc::OnUpdateRestartCurrentHand(CCmdUI* pCmdUI) {
  if (theApp.GetSettings()->GetGameInProgress())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}


//
void CEasyBDoc::OnRestartCurrentHand() {
  // use the common function
  deal_->RestartCurrentHand(TRUE);
}






////////////////////////////////////////////////////////////////////////////
//
// Claim / Concede / Auto Play
//
/////////////////////////////////////////////////////////////////////////////


//
void CEasyBDoc::OnUpdatePlayClaimTricks(CCmdUI* pCmdUI) {
  if (deal_->IsGameNotFinished())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
// OnPlayClaimTricks() 
//
void CEasyBDoc::OnPlayClaimTricks() {
  deal_->PlayClaimTricks();
}


//
void CEasyBDoc::OnUpdatePlayClaimContract(CCmdUI* pCmdUI) {
  if (deal_->IsGameNotFinished())
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}


//
void CEasyBDoc::OnPlayClaimContract() {
  deal_->PlayClaimContract();
}

//
void CEasyBDoc::OnUpdatePlayConcedeTricks(CCmdUI* pCmdUI) {
  if (deal_->IsGameNotFinished())
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
    int nPos = deal_->GetHumanPlayerPos();
    deal_->ConcedeTricks(nPos);
  }
}


//
void CEasyBDoc::OnUpdateGameAutoPlay(CCmdUI* pCmdUI) {
  if ((theApp.GetSettings()->GetGameInProgress()) &&
    //		((m_nCurrPlayer == NORTH) || (m_nCurrPlayer == SOUTH)) &&
    (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlay() {
  // have the computer play for the human
  CPlayerStatusDialog& status = deal_->GetCurrentPlayer()->GetStatusDialog();
  status << "4PLYAUTO1! The computer is playing a card for the human player...\n";
  pMAINFRAME->SetStatusMessage(FormString(("Playing for %s..."), PositionToString(deal_->GetCurrentPlayerPosition())));
  deal_->InvokeNextPlayer();
}


//
void CEasyBDoc::OnUpdateGameAutoPlayAll(CCmdUI* pCmdUI) {
  //
  if (theApp.GetSettings()->GetCardPlayMode() == Settings::PLAY_FULL_AUTO)
    pCmdUI->SetCheck(1);
  else
    pCmdUI->SetCheck(0);
  //
  if (theApp.GetSettings()->GetGameInProgress() &&
    ((pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY) ||
    (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK) ||
      (deal_->IsAutoReplayMode())))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlayAll() {
  // clear hints if enabled
  if (theApp.GetSettings()->GetAutoHintMode() > 0)
    pMAINFRAME->ClearAutoHints();

  //
  CPlayerStatusDialog& status = deal_->GetCurrentPlayer()->GetStatusDialog();
  if (theApp.GetSettings()->GetCardPlayMode() == Settings::PLAY_FULL_AUTO) {
    // check if we're in computer replay
    if (deal_->IsAutoReplayMode()) {
      deal_->SetAutoReplayMode(FALSE);
      deal_->SetExpressPlayMode(FALSE);
      // reset mode indicator
      pMAINFRAME->SetModeIndicator();
      pMAINFRAME->SetStatusMessage("Computer Replay cancelled.");
    } else {
      pMAINFRAME->SetStatusMessage("Auto play disabled.");
      status << "4PLYAUTO2a! Computer autoplay cancelled.\n";
    }
    theApp.GetSettings()->SetCardPlayMode(Settings::PLAY_NORMAL);
    if (((deal_->GetCurrentPlayerPosition() == NORTH) || (deal_->GetCurrentPlayerPosition() == SOUTH)) &&
        (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY)) {
      AdvanceToNextPlayer();
    }
  } else {
    // have the computer play for the human
    status << "4PLYAUTO2b! The computer is taking over the remainder of play for the human...\n";
    if (!deal_->IsAutoReplayMode())
      pMAINFRAME->SetStatusMessage("Auto play enabled.");
    pMAINFRAME->OnPlayModeFullAuto();
  }
}


//
void CEasyBDoc::OnUpdateGameAutoPlayExpress(CCmdUI* pCmdUI) {
  //
  if (theApp.GetSettings()->InExpressAutoPlay())
    pCmdUI->SetCheck(1);
  else
    pCmdUI->SetCheck(0);
  //
  if (theApp.GetSettings()->GetGameInProgress() &&
    ((pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY) ||
    (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK) ||
      (deal_->IsAutoReplayMode())))
    pCmdUI->Enable(TRUE);
  else
    pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlayExpress() {
  // clear hints if enabled
  if (theApp.GetSettings()->GetAutoHintMode() > 0)
    pMAINFRAME->ClearAutoHints();

  //
  CPlayerStatusDialog& status = deal_->GetCurrentPlayer()->GetStatusDialog();
  if (theApp.GetSettings()->InExpressAutoPlay()) {
    // check if we're in computer replay
    if (deal_->IsAutoReplayMode()) {
      deal_->SetAutoReplayMode(FALSE);
      deal_->SetExpressPlayMode(FALSE);
      // reset mode indicator
      pMAINFRAME->SetModeIndicator();
      pMAINFRAME->SetStatusMessage("Computer Replay cancelled.");
    } else {
      pMAINFRAME->SetStatusMessage("Full auto play disabled.");
      status << "4PLYAUTO3a! Computer autoplay cancelled.\n";
    }
    theApp.GetSettings()->SetCardPlayMode(Settings::PLAY_NORMAL);
    pVIEW->EnableRefresh();
    EndWaitCursor();
    if (((deal_->GetCurrentPlayerPosition() == NORTH) || (deal_->GetCurrentPlayerPosition() == SOUTH)) &&
        (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY)) {
       AdvanceToNextPlayer();
    }
  } else {
    // have the computer play for the human
    if (deal_->IsAutoReplayMode())
      pMAINFRAME->SetStatusMessage("Performing computer autoplay...");
    else
      pMAINFRAME->SetStatusMessage("Full auto play in progress...");
    status << "4PLYAUTO3b! The computer is playing the hands to completion...\n";
    theApp.GetSettings()->SetCardPlayMode(Settings::PLAY_FULL_AUTO_EXPRESS);
    deal_->SetExpressPlayMode(TRUE);
    BeginWaitCursor();

    // clear & prep the view for cards to be played
    if (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK) {
      // and wait for a click
      pVIEW->ClearTable();
      pVIEW->SuppressRefresh();
      deal_->ClearTrick();
    } else {
      pVIEW->SetCurrentMode(CEasyBView::MODE_WAITCARDPLAY);
    }
    //
    if ((theApp.GetSettings()->GetGameInProgress()) && (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY)) {
      AdvanceToNextPlayer();
    }
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
  //	if ((theApp.GetSettings()->IsGameInProgress()) || (!m_bHandsDealt))
  if (!deal_->IsHandsDealt())
    pCmdUI->Enable(FALSE);
  else
    pCmdUI->Enable(TRUE);
}

//
void CEasyBDoc::OnSwapPositionEast() {
  CWaitCursor wait;
  if (!theApp.GetSettings()->GetGameInProgress()) {
    // not started playing yet
    deal_->SwapPlayersHands(SOUTH, EAST);
    pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_EAST);
  } else {
    deal_->SwapPositionsAlreadyInPlay(SOUTH, EAST);
  }
}

//
void CEasyBDoc::OnSwapPositionNorth() {
  CWaitCursor wait;
  if (!theApp.GetSettings()->GetGameInProgress()) {
    // not started playing yet
    deal_->SwapPlayersHands(SOUTH, NORTH);
    pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_NORTH);
  } else {
    deal_->SwapPositionsAlreadyInPlay(SOUTH, NORTH);
  }
}

//
void CEasyBDoc::OnSwapPositionWest() {
  CWaitCursor wait;
  if (!theApp.GetSettings()->GetGameInProgress()) {
    // not started playing yet
    deal_->SwapPlayersHands(SOUTH, WEST);
    pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_WEST);
  } else {
    deal_->SwapPositionsAlreadyInPlay(SOUTH, WEST);
  }
}

//
void CEasyBDoc::OnSwapCardsClockwise() {
  CWaitCursor wait;
  if (!theApp.GetSettings()->GetGameInProgress()) {
    // not started playing yet
    deal_->RotatePlayersHands(0, TRUE, theApp.GetSettings()->GetBiddingInProgress());
  } else {
    // play has started
    deal_->RotatePartialHands(1);
    deal_->ResetDisplay();
    AdvanceToNextPlayer();
  }
}


//
void CEasyBDoc::OnSwapCardsCounterclockwise() {
  CWaitCursor wait;
  if (!theApp.GetSettings()->GetGameInProgress()) {
    // not started playing yet
    deal_->RotatePlayersHands(1, TRUE, theApp.GetSettings()->GetBiddingInProgress());
  } else {
    // play has started
    deal_->RotatePartialHands(3);
    deal_->ResetDisplay();
    AdvanceToNextPlayer();
  }
}


//
void CEasyBDoc::OnFileOpen() {
  //
  CString strExtension = "brd";
  CString strTypeList = "EasyBridge Files (*.brd)|*.brd|Portable Bridge Notation Files (*.pbn)|*.pbn|All Files (*.*)|*.*||";
  if (m_nPrevFileFormat == Deal::tnPBNFormat) {
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
  if ((!deal_->IsHandsDealt()) || !pVIEW->CanSaveFile())
    pCmdUI->Enable(FALSE);
  else
    pCmdUI->Enable(TRUE);
}


//
// OnFileSave()
//
void CEasyBDoc::OnFileSave() {
  if (deal_->GetTitle().IsEmpty()) {
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
  if ((!deal_->IsHandsDealt()) || !pVIEW->CanSaveFile())
    pCmdUI->Enable(FALSE);
  else
    pCmdUI->Enable(TRUE);
}


//
// OnFileSaveAs() 
//
void CEasyBDoc::OnFileSaveAs() {
  // Save the document data to a file
  CString newPath, strFileName = deal_->GetTitle();
  if (strFileName.IsEmpty())
    strFileName = CDocument::GetTitle();
  CDocTemplate* pTemplate = pDOC->GetDocTemplate();
  ASSERT(pTemplate != NULL);

  // check for dubious filename
  int iBad = strFileName.FindOneOf(_T(" #%;/\\"));
  if (iBad != -1)
    strFileName.ReleaseBuffer(iBad);

  // determine proper suffix
  CString strExtension = "brd";
  CString strTypeList = "EasyBridge Files (*.brd)|*.brd|Portable Bridge Notation Files (*.pbn)|*.pbn|Text Files (*.txt)|*.txt|All Files (*.*)|*.*||";
  if (m_nPrevFileFormat == Deal::tnPBNFormat)
    strExtension = "pbn";
  else if (m_nPrevFileFormat == Deal::tnTextFormat)
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
  if (!deal_->GetTitle().IsEmpty())
    _tcscpy(szTitle, deal_->GetTitle());
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
  deal_->SetTitle(strFileName);
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
  propDlg.m_strFileName = deal_->GetTitle();
  if (propDlg.m_strFileName.IsEmpty())
    propDlg.m_strFileName = _T("Untitled");
  propDlg.m_strFileFormat = tszFileFormatName[m_nFileFormat];
  //
  propDlg.m_strDealNumber = deal_->GetDealIDString();
  //
  propDlg.DoModal();
}


//
void CEasyBDoc::AdvanceToNextPlayer() {
  // see whether this is a human or computer player
  BOOL bManualPlay = FALSE;
  int nPlayMode = theApp.GetSettings()->GetCardPlayMode();
  if (deal_->GetCurrentPlayer()->IsHumanPlayer() && 
      (nPlayMode != Settings::PLAY_FULL_AUTO && nPlayMode != Settings::PLAY_FULL_AUTO_EXPRESS)) {
    bManualPlay = TRUE;
  } else if ((theApp.GetSettings()->GetManualPlayMode()) ||
      (nPlayMode == Settings::PLAY_MANUAL) ||
      ((nPlayMode == Settings::PLAY_MANUAL_DEFEND) && (deal_->GetCurrentPlayer()->IsDefending()))) {
    bManualPlay = TRUE;
  }

  // it's not manual if computer is replaying
  if (deal_->IsAutoReplayMode()) {
    bManualPlay = FALSE;
  }

  //
  if (bManualPlay) {
    // this is a human player
    // first see if autoplay last card option is enabled
    if (theApp.GetSettings()->GetAutoPlayLastCard()) {
      CPlayer* pPlayer = deal_->GetCurrentPlayer();
      if (pPlayer->TestForAutoPlayLastCard()) {
        return;
      }
    }

    // jump the cursor if appropriate
    if (theApp.GetSettings()->GetAutoJumpCursor()) {
      pVIEW->JumpCursor();
    }

    // set the prompt
    CString strMessage;
    strMessage.Format("%s's turn -- select a card to play.",
        PositionToString(deal_->GetCurrentPlayerPosition()));
    pMAINFRAME->SetStatusText(strMessage);

    // and set status code
    pVIEW->SetCurrentMode(CEasyBView::MODE_WAITCARDPLAY);

    // finally, show auto hint if appropriate
    deal_->ShowAutoHint();
  } else {
    // this is a computer player
    pVIEW->SetCurrentMode(CEasyBView::MODE_NONE);	// clear up loose ends
    BOOL bExpressMode = theApp.GetSettings()->InExpressAutoPlay();
    // prompt if not in express mode
    if (!bExpressMode && !theApp.GetSettings()->GetAutoTestMode()) {
      CWaitCursor wait;
      CString strMessage;
      if ((!deal_->GetCurrentPlayer()->IsDefending() && theApp.GetSettings()->GetEnableGIBForDeclarer()) ||
          (deal_->GetCurrentPlayer()->IsDefending() && theApp.GetSettings()->GetEnableGIBForDefender())) {
        strMessage.Format("%s is playing (GIB)...", PositionToString(deal_->GetCurrentPlayerPosition()));
      }
      else {
        strMessage.Format("%s is playing...", PositionToString(deal_->GetCurrentPlayerPosition()));
      }
      pVIEW->SetPrompt(strMessage);
    }

    // and move to the next player
    // don't pop up wait cursor if in auto mode!
    if (!bExpressMode) {
      CWaitCursor wait;
    }
    deal_->InvokeNextPlayer();
  }
}

