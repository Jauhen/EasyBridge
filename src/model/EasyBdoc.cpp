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




//
// Read in some values from the INI file
//

//
void CEasyBDoc::Initialize() 
{
}


//
void CEasyBDoc::Terminate() 
{
}



/////////////////////////////////////////////////////////////////////////////
// CEasyBDoc construction/destruction

CEasyBDoc::CEasyBDoc() : Deal(std::make_shared<AppImpl>()) {
	m_pDoc = this;
	//
	m_strFileProgTitle = theApp.GetValueString(tstrProgramTitle);
	m_nFileProgMajorVersion = theApp.GetValue(tnProgramMajorVersion);
	m_nFileProgMinorVersion = theApp.GetValue(tnProgramMinorVersion);
	m_nFileProgIncrementVersion = theApp.GetValue(tnProgramIncrementVersion);
	m_nFileProgBuildNumber = theApp.GetValue(tnProgramBuildNumber);
	m_strFileProgBuildDate = theApp.GetValueString(tstrProgramBuildDate);
	m_strFileDate = "??/??/??";

	//
	ClearFileParameters();
	//
	m_bSuppressBidHistoryUpdate = FALSE;
	m_bSuppressPlayHistoryUpdate = FALSE;
	m_bHandsDealt = FALSE;
	m_nDealer_deal = NONE;
	m_nCurrPlayer_deal = NULL;
	for(int i=0;i<4;i++)
		m_bSavePlayerAnalysis[i] = FALSE;
	m_bSaveIntermediatePositions = theApp.GetValue(tbSaveIntermediatePositions);

	// set default file format to native
	m_nFileFormat = tnEasyBridgeFormat;
	m_nPrevFileFormat = m_nFileFormat;

	// create the players
  std::shared_ptr<AppInterface> app (new AppImpl);
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i] = new CPlayer(app);

	// and init each player's info
	for(int i=0;i<4;i++)
	{
		CPlayer* pLHOpponent = m_pPlayer_deal[(i+1)%4];
		CPlayer* pPartner = m_pPlayer_deal[(i+2)%4];
		CPlayer* pRHOpponent = m_pPlayer_deal[(i+3)%4];
		m_pPlayer_deal[i]->InitializePlayer((Position) i, pPartner, pLHOpponent, pRHOpponent);
	}

	// init the players' engines (must do this after the above inits!!!)
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->InitializeEngines();

	// clear out some info
	ClearAllInfo();

	// and read in stuff from the .INI file
	Initialize();
}

CEasyBDoc::~CEasyBDoc()
{
	//
	Terminate();

	// clean up memory
	for(int i=0;i<4;i++)
		delete m_pPlayer_deal[i];
	//
	m_bInitialized = FALSE;
}


BOOL CEasyBDoc::OnNewDocument()
{
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
BOOL CEasyBDoc::OnOpenDocument(LPCTSTR lpszPathName) 
{
	// suppress flashing
	pVIEW->SuppressRefresh();

	// close bidding dialog if it's open
	if (theApp.IsBiddingInProgress())
	{
		theApp.SetValue(tbBiddingInProgress, FALSE);
		pVIEW->Notify(WM_COMMAND, WMS_BIDDING_CANCELLED);
	}

	// clear info
	ClearAllInfo();

	// confirm file type
	CString	strPath = lpszPathName;
	int nIndex = strPath.ReverseFind('.');
	if (nIndex >= 0)
	{
		CString strSuffix =strPath.Mid(nIndex + 1);
		if (strSuffix.CompareNoCase("pbn") == 0)
			m_nFileFormat = m_nPrevFileFormat = tnPBNFormat;
		else
			m_nFileFormat = m_nPrevFileFormat = tnEasyBridgeFormat;
	}

	//
	pMAINFRAME->SetStatusMessage("Loading file...");

	// load and check for errors
	BOOL bCode = CDocument::OnOpenDocument(lpszPathName);
	if ( !bCode || 
		 ((m_nFileFormat == tnPBNFormat) && (m_gameRecords_deal.GetSize() == 0)) )
	{
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
	m_strDocTitle = strPath.Mid(nStart+1);
	SetTitle(m_strDocTitle);

	// set active document
	theApp.SetValuePV(tpvActiveDocument, this);

	// set contract and vulnerability info
	if (ISBID(m_nContract_deal))
	{
		pMAINFRAME->DisplayContract();
		pMAINFRAME->DisplayDeclarer();
		pMAINFRAME->DisplayVulnerable();
		// reset suit sequence
		theApp.InitDummySuitSequence(m_nContractSuit_deal, m_nDummy_deal);
	}
	else
	{
		// clear all
		pMAINFRAME->ClearAllIndicators();
	}

	// activate some dialogs
	if (m_bShowBidHistoryUponOpen)
		pMAINFRAME->MakeDialogVisible(twBiddingHistoryDialog);
	if (m_bShowPlayHistoryUponOpen)
		pMAINFRAME->MakeDialogVisible(twPlayHistoryDialog);

	// check if reviewing game
	if (m_bReviewingGame)
	{
		// start game review
//		pVIEW->Notify(WM_COMMAND, WMS_RESET_DISPLAY);
		pVIEW->BeginGameReview(TRUE);
		pMAINFRAME->MakeDialogVisible(twGameReviewDialog);
		// see if a contract has been set
		if (ISBID(m_nContract_deal))
		{
			if (theApp.GetValue(tbAutoHideBidHistory))
				pMAINFRAME->HideDialog(twBiddingHistoryDialog);
			if (theApp.GetValue(tbAutoShowPlayHistory))
				pMAINFRAME->MakeDialogVisible(twPlayHistoryDialog);
		}
		else
		{
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
	if (m_nFileFormat == tnPBNFormat)
	{
		// if so, load the game data
		LoadGameRecord(*(m_gameRecords_deal[0]));
		// and hide the game review dialog
		pMAINFRAME->HideDialog(twGameReviewDialog);
	}

	//
	// there are currently only two entry points -- 
	// just prior to bidding, or just prior to play
	//
	if (theApp.IsGameInProgress())
	{
		// init players with the new hands
		for(int i=0;i<4;i++)
			m_pPlayer_deal[i]->InitializeRestoredHand();

		// and start play
		pVIEW->InitNewRound();

		// ######## New Code!!! ########
		// see if we have plays recorded
		int nIndex = 0;
		int numRounds = m_numTricksPlayed_deal;
		m_numTricksPlayed_deal = 0;	// reset
		if (numRounds > 0)
		{
			BOOL bOldAnalysisSetting = theApp.GetValue(tbEnableAnalysisTracing);
			theApp.SetValue(tbEnableAnalysisTracing, FALSE);
			//
			m_bBatchMode = TRUE;
			for(int i=0;i<4;i++)
				m_pPlayer_deal[i]->SuspendTrace();
			pMAINFRAME->SetStatusText("Processing game position...");
			pMAINFRAME->LockStatusBar(TRUE);
			pVIEW->SetCurrentMode(CEasyBView::MODE_GAMERESTORE);
			//
			for(int nRound=0;nRound<numRounds;nRound++)
			{
				// silently play out the cards to reach the saved position
				int nPlayer = m_nTrickLead_deal[nRound];
				int j = 0;
				for(j=0;j<4;j++)
				{
					// grab the card that was played
					int nDeckVal = m_nPlayRecord_deal[nIndex];
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
					if (nRound == numRounds-1)
						pVIEW->DrawPlayedCard((Position)nPlayer, pCard, FALSE);

					//
					nPlayer = GetNextPlayer(nPlayer);
					nIndex++;
				}
				//
				if (j == 4)
				{
					// evaluate the trick
					EvaluateTrick(TRUE);
					// then clear, but but don't clear the final trick
//					if (nRound < numRounds-1)
						pDOC->ClearTrick();
				}

			}

			// restore settings
			for(int i=0;i<4;i++)
				m_pPlayer_deal[i]->ResumeTrace();
			theApp.SetValue(tbEnableAnalysisTracing, bOldAnalysisSetting);
			pMAINFRAME->LockStatusBar(FALSE);
			pMAINFRAME->SetStatusText("Done.");
			m_bBatchMode = FALSE;

			// prompt if picking up the game
			if (m_numTricksPlayed_deal < 13)
			{
				// then pick up where we left off
				pVIEW->PostMessage(WM_COMMAND, WMS_RESUME_GAME, 0);
			}
		}
	}
	else
	{
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
		for(int i=0;i<4;i++)
			pMAINFRAME->MakeDialogVisible(twAnalysisDialog, i);

	// restore disply
	pVIEW->EnableRefresh();
//	pVIEW->Refresh();

	//
	return TRUE;
}


//
void CEasyBDoc::DeleteContents() 
{
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->ClearHand();
	
	//
	m_strDocTitle.Empty();
	m_strFileComments.Empty();
	m_strFileDescription.Empty();
	// make sure to empty the file comments dialog
	if (m_bInitialized)
	{
		if (pMAINFRAME)
			pMAINFRAME->GetDialog(twFileCommentsDialog)->SendMessage(WM_COMMAND, WMS_UPDATE_TEXT, 0);
	}
	//
	ClearFileParameters();

	// empty out game record
	int numGames = m_gameRecords_deal.GetSize();
	for(int i=0;i<numGames;i++)
		delete m_gameRecords_deal[i];
	m_gameRecords_deal.RemoveAll();

	//
//	pVIEW->SetCurrentMode(CEasyBView::MODE_NONE);
	pVIEW->ClearMode(FALSE);
	//	
	CDocument::DeleteContents();
}


// static function
CEasyBDoc* CEasyBDoc::GetDoc()
{
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

void CEasyBDoc::Serialize(CArchive& ar)
{
	if (ar.IsStoring())	
	{
		if (m_nFileFormat == tnPBNFormat)
			WriteFilePBN(ar);
		else if (m_nFileFormat == tnTextFormat)
			ExportGameInfo(ar);
		else
			WriteFile(ar);
	} 
	else 
	{
		BOOL bCode = FALSE;
		if (m_nFileFormat == tnPBNFormat)
		{
			try
			{
				bCode = ReadFilePBN(ar);
			}
			catch(...)
			{
			}
		}
		else
		{
			try
			{
				bCode = ReadFile(ar);
			}
			catch(...)
			{
			}
		}
		if (!bCode)
			throw (new CArchiveException());
	}
}


/////////////////////////////////////////////////////////////////////////////
// CEasyBDoc diagnostics

#ifdef _DEBUG
void CEasyBDoc::AssertValid() const
{
	CDocument::AssertValid();
}

void CEasyBDoc::Dump(CDumpContext& dc) const
{
	CDocument::Dump(dc);
}
#endif //_DEBUG



//////////////////////////////////////////////////////////
//
// EasyBDoc routines
//
//////////////////////////////////////////////////////////




//
//=======================================================
//
// Utilities
//

//
void CEasyBDoc::UpdateDisplay()
{
	// update is a simple redraw
	pVIEW->Notify(WM_COMMAND, WMS_UPDATE_DISPLAY);
}

//
void CEasyBDoc::RefreshDisplay()
{
	// refresh is suit rest + redraw
	pVIEW->Notify(WM_COMMAND, WMS_REFRESH_DISPLAY, 1L);
}

//
void CEasyBDoc::ResetDisplay()
{
	// reset is complete reset + redraw
	pVIEW->Notify(WM_COMMAND, WMS_RESET_DISPLAY, 1L);
}








//=======================================================================
//
// Game control operations
//
//=======================================================================


//
void CEasyBDoc::OnUpdateClearAll(CCmdUI* pCmdUI) 
{
	pCmdUI->Enable(TRUE);
}


//
void CEasyBDoc::OnClearAll() 
{
	if (theApp.IsRubberInProgress())
	{
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
void CEasyBDoc::OnUpdatePlayRubber(CCmdUI* pCmdUI) 
{
	if (!theApp.IsRubberInProgress())
	{
		pCmdUI->SetText("Play Rubber\tShift+F2");
		pCmdUI->SetCheck(0);
	}
	else
	{
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
void CEasyBDoc::OnPlayRubber() 
{
	// see if we're currently playing rubber
	if (!theApp.IsRubberInProgress())
	{
		// set rubber mode
		theApp.SetValue(tbRubberInProgress, TRUE);
		pMAINFRAME->SetModeIndicator("Match");
		OnNewDocument();	
		OnDealNewHand();
	}
	else
	{
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



//
// ClearFileParameters()
//
void CEasyBDoc::ClearFileParameters()
{
	m_bReviewingGame = FALSE;
	m_bGameReviewAvailable = FALSE;
	m_bShowCommentsUponOpen = FALSE;
	m_bShowBidHistoryUponOpen = FALSE;
	m_bShowPlayHistoryUponOpen = FALSE;
	m_bShowAnalysesUponOpen = FALSE;
	m_bDealNumberAvailable_deal = FALSE;
	m_nDealNumber_deal = 0;
	m_nSpecialDealCode_deal = 0;
}



//
// ClearAllInfo()
//
void CEasyBDoc::ClearAllInfo() 
{
	// do all inits
	ClearMatchInfo();
	ClearBiddingInfo();
	ClearPlayInfo();
	ClearHands();
	InitNewHand();

	// turn off review mode
	m_bReviewingGame = FALSE;
	m_bGameReviewAvailable = FALSE;

	// turn off game auto-play, if it's on
	if ((theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO) || (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO_EXPRESS))
		theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
	//
	m_bExpressPlayMode = FALSE;
	m_bAutoReplayMode = FALSE;
	m_bBatchMode = FALSE;

	// turn off rubber
	theApp.SetValue(tbRubberInProgress, FALSE);

	// clear view mode
	pVIEW->ClearMode();
}




//
// ClearMatchInfo()
//
void CEasyBDoc::ClearMatchInfo() 
{
	int i,j;
	for(i=0;i<2;i++) 
	{
		m_numGamesWon_deal[i] = 0;
		m_nBonusScore_deal[i] = 0;
		m_nTotalScore_deal[i] = 0;
		m_bVulnerable_deal[i] = FALSE;
	}
	for(i=0;i<3;i++)
		for(j=0;j<2;j++)
			m_nGameScore_deal[i][j] = 0;
	m_nVulnerableTeam_deal = NEITHER;
	m_nCurrGame_deal = 0;
	//
	m_strArrayBonusPointsRecord_deal.RemoveAll();
	m_strArrayTrickPointsRecord_deal.RemoveAll();
	m_strTotalPointsRecord_deal.Empty();
	//
	m_bHandsDealt = FALSE;
}




//
// InitNewMatch()
//
// called at the start of a new rubber
//
void CEasyBDoc::InitNewMatch() 
{
	// temp
/*
	pMAINFRAME->DisplayTricks();
	pMAINFRAME->DisplayScore();
	pMAINFRAME->DisplayVulnerable();
*/
	// clear out match info
	ClearMatchInfo();

	// if playing rubber, init the dealer to East -- will advance to south
	// upon first deal
	if (theApp.IsRubberInProgress())
	{
		m_nPrevDealer_deal = EAST;
		m_nDealer_deal = EAST;
		m_nCurrPlayer_deal = m_nDealer_deal;
	}

	// and prepare for a new game 
	InitNewGame();
}


//
// InitNewGame()
//
// called at the start of a new game
//
void CEasyBDoc::InitNewGame() 
{
	int i,j;
	// clear game record
	for(i=0;i<13;i++) 
	{
		for(j=0;j<4;j++)
			m_pGameTrick_deal[i][j] = NULL;
	}
	//
	m_bHandsDealt = FALSE;
}


//
// InitNewHand()
//
// called at the start of each new hand
//
void CEasyBDoc::InitNewHand(BOOL bRestarting) 
{
//	pMAINFRAME->ClearStatusText(0, TRUE);
	//
	theApp.SetValue(tbGameInProgress, FALSE);

	// clear bidding info
	ClearBiddingInfo();
	
	// clear play record info
	ClearPlayInfo();

	// rotate the deal (if not rebidding the same hand)
	if (!bRestarting)
	{
		if (ISPLAYER(m_nDealer_deal))
		{
			m_nPrevDealer_deal = m_nDealer_deal;
			m_nDealer_deal = GetNextPlayer(m_nDealer_deal);
		}
		else
		{
			m_nPrevDealer_deal = EAST;
			m_nDealer_deal = SOUTH;
		}
		m_nCurrPlayer_deal = m_nDealer_deal;
		m_nGameLead_deal = NONE;
	}
}




//
// ClearBiddingInfo()
//
// clears the bidding information
//
void CEasyBDoc::ClearBiddingInfo() 
{
	//
	int i,j;
	for(i=0;i<4;i++)
		m_pPlayer_deal[i]->ClearBiddingInfo();
	//
	m_nContract_deal = 0;
	m_nContractSuit_deal = NOTRUMP;
	m_nContractLevel_deal = 0;
	m_bDoubled_deal = FALSE;
	m_nDoubler_deal = NONE;
	m_bRedoubled_deal = FALSE;
	m_nRedoubler_deal = NONE;
	m_nContractModifier_deal = 0;
	m_nLastValidBid_deal = BID_PASS;
	m_nLastValidBidTeam_deal = NEITHER;
	m_nContractTeam_deal = NEITHER;
	m_nDefendingTeam_deal = NEITHER;
	m_nDeclarer_deal = NONE;
	m_nDummy_deal = NONE;
	for(i=0;i<4;i++)
	{
		m_pPlayer_deal[i]->SetDeclarerFlag(FALSE);
		m_pPlayer_deal[i]->SetDummyFlag(FALSE);
	}
	m_nPartnershipSuit_deal[0] = m_nPartnershipSuit_deal[1] = -1;
	for(i=0;i<5;i++) 
	{
		m_nPartnershipLead_deal[0][i] = NONE;
		m_nPartnershipLead_deal[1][i] = NONE;
	}
	m_numPasses_deal = 0;
	m_numBidsMade_deal = 0;
	m_nOpeningBid_deal = 0;
	m_nOpeningBidder_deal = NONE;
	m_nBiddingRound_deal = 0;
	m_numValidBidsMade_deal = 0;
	for(i=0;i<100;i++)
	{
		m_nBiddingHistory_deal[i] = 0;
		m_nValidBidHistory_deal[i] = 0;
	}
	for(i=0;i<4;i++)
		for(j=0;j<50;j++)
			m_nBidsByPlayer_deal[i][j] = 0;
	//
	if (pMAINFRAME)
		UpdateBiddingHistory();
	//
	m_nTrumpSuit_deal = NOTRUMP;
	m_nGameLead_deal = NONE;
	m_nRoundLead_deal = NONE;
	m_nDeclarer_deal = NONE;
	//
	m_nLastBiddingHint_deal = NONE;
	m_bHintFollowed_deal = TRUE;
	//
	theApp.SetValue(tbBiddingInProgress, FALSE);
}




//
// ClearPlayInfo()
//
// clears the play information
//
void CEasyBDoc::ClearPlayInfo() 
{
	m_numTricksPlayed_deal = 0;
	m_numActualTricksPlayed_deal = 0;
	m_numCardsPlayedInRound_deal = 0;
	m_numCardsPlayedInGame_deal = 0;
	for(int i=0;i<4;i++) 
		m_pCurrTrick_deal[i] = NULL;
	//
	m_nSuitLed_deal = NONE;
	m_nHighVal_deal = 0;
	m_nHighTrumpVal_deal = 0;
	m_pHighCard_deal = NULL;
	m_nHighPos_deal = NONE;
//	m_nPlayRound = 0;
	m_nRoundWinner_deal = NONE;
	m_nRoundWinningTeam_deal = NEITHER;
	m_numTricksWon_deal[0] = 0;
	m_numTricksWon_deal[1] = 0;
	m_bExposeDummy_deal = FALSE;
	if (ISPLAYER(m_nDummy_deal) && (m_nDummy_deal != SOUTH))
		m_pPlayer_deal[m_nDummy_deal]->ExposeCards(FALSE, FALSE);

	//
	m_nLastBiddingHint_deal = NONE;
	m_pLastPlayHint_deal = NULL;
	m_bHintMode = FALSE;
	m_bHintFollowed_deal = TRUE;

	// clear play record
	for(int i=0;i<13;i++) 
	{
		m_nTrickLead_deal[i] = NONE;
		m_nTrickWinner_deal[i] = NONE;
	}
	for(int i=0;i<52;i++)
		m_nPlayRecord_deal[i] = -1;

	// clear GIB Monitor && play history
	if (pMAINFRAME)
	{
		pMAINFRAME->SetGIBMonitorText(NULL);
		UpdatePlayHistory();
	}
}




//
// InitPlay()
//
// called after each deal to initialize the playing of a new
// hand.  Calls the InitNewHand() above
//
void CEasyBDoc::InitPlay(BOOL bRedrawScreen, BOOL bRestarting) 
{
	// limit certain inits if restarting a hand
	InitNewHand(bRestarting);
	//
	m_bHandsDealt = TRUE;

	// initialize each hand's holdings
	for(int i=0;i<4;i++) 
	{
		// make sure cards face-up status is properly set
		if (i == 0)
			m_pPlayer_deal[i]->ExposeCards(TRUE, FALSE);
		else
			m_pPlayer_deal[i]->ExposeCards(FALSE, FALSE);

		// give the players a chance to init their holdings
		m_pPlayer_deal[i]->InitializeHand();
		m_pPlayer_deal[i]->InitialEvaluateHand();
	}

	// return at this point if in test mode
	if (theApp.GetValue(tbAutoTestMode))
		return;

	// if debugging, save out the hand
	if ((theApp.IsDebugModeActive()) && (!bRestarting))
	{
		CFile file;
		CFileException fileException;
		CString strPath;
		strPath.Format("%s\\AutoSave.brd",theApp.GetValue(tszProgramDirectory));
		int nCode = file.Open((LPCTSTR)strPath, 
							  CFile::modeWrite | CFile::modeCreate | CFile::shareDenyWrite, 
							  &fileException);
		CArchive ar(&file, CArchive::store);
		WriteFile(ar);
		ar.Close();
		file.Close();
	}

	// see if we should block a redraw
	if (!bRedrawScreen)
		pVIEW->SuppressRefresh();

	//
	if (bRedrawScreen)
		pVIEW->InitNewRound();
	//
//	pVIEW->PostMessage(WM_COMMAND, WMS_INITNEWDEAL, 1L);
	pVIEW->Notify(WM_COMMAND, WMS_INITNEWDEAL, 1L);

	if (!bRedrawScreen)
	{
		// restore drawing ability
		pVIEW->EnableRefresh();
//		pVIEW->Refresh();
	}
}





/////////////////////////////////////////////////////////////////////
//
// Hints
//
////////////////////////////////////////////////////////////////////

//
void CEasyBDoc::OnUpdateGameHint(CCmdUI* pCmdUI) 
{
	BOOL bEnable = TRUE;

	// disable if not bidding or playing
	if (!theApp.IsBiddingInProgress() && !theApp.IsGameInProgress())
		bEnable = FALSE;
	
	// disable if game is over
	if (theApp.IsGameInProgress() && (m_numTricksPlayed_deal == 13))
		bEnable = FALSE;

	// disable if at the end of a trick
//	if (m_numCardsPlayedInRound == 4)
//		bEnable = FALSE;

	// disable if not our turn
	if (theApp.IsGameInProgress() && 
		(!ISPLAYER(m_nCurrPlayer_deal) || !m_pPlayer_deal[m_nCurrPlayer_deal]->IsHumanPlayer()) )
		bEnable = FALSE;

	// hints are invalid if the user ignored our previous bidding hint
	if (theApp.IsBiddingInProgress() && !m_bHintFollowed_deal)
		bEnable = FALSE;

	// allow the user to click <space> to clear a trick
	if (m_numCardsPlayedInRound_deal == 4)
		bEnable = TRUE;

	// else set
	pCmdUI->Enable(bEnable);

	// see if a hint is pending
	if (m_pLastPlayHint_deal)
		pCmdUI->SetText("Accept Hint\tSpace");
	else
		pCmdUI->SetText("Hint\tSpace");
}


//
// GetGameHint()
//
void CEasyBDoc::GetGameHint(BOOL bAutoHintRequest) 
{
	// hints are invalid if the user ignored our previous bidding hint
//	if (theApp.IsBiddingInProgress() && !m_bHintFollowed)
//		return;

	// 
	if (theApp.IsBiddingInProgress())
	{
		// see if a hint is pending
		if (m_nLastBiddingHint_deal >= 0)
		{
			// accept the hint
			CBidDialog* pBidDlg = pMAINFRAME->GetBidDialog();
			if (pBidDlg->IsWindowVisible())
				pBidDlg->RegisterBid(m_nLastBiddingHint_deal, TRUE);
			// clear hint info
//			m_nLastBiddingHint = NONE;
//			CAutoHintDialog* pHintDlg = (CAutoHintDialog*) pMAINFRAME->GetDialog(twAutoHintDialog);
//			pHintDlg->Clear();
		}
		else
		{
			// no hint given yet, and a hint was requested
			// reject a manual request if auto hints are on (wait for auto hint to be generated)
			if (!bAutoHintRequest && (theApp.GetValue(tnAutoHintMode) > 0))
				return;
			// get the hint
			m_bHintMode = FALSE;
//			m_nLastBiddingHint = m_pPlayer[SOUTH]->GetBiddingHint();
			m_nLastBiddingHint_deal = m_pPlayer_deal[m_nCurrPlayer_deal]->GetBiddingHint();
			pMAINFRAME->GetDialog(twBidDialog)->SendMessage(WM_COMMAND, WMS_FLASH_BUTTON, m_nLastBiddingHint_deal);
		}
	}
	else if (theApp.IsGameInProgress())
	{
		// special code -- allow a <space> to be used to clear a trick
		if (m_numCardsPlayedInRound_deal == 4) 
		{
			if (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK)
			{
				pVIEW->ClearTable();
				ClearTrick();
			}
			//
			return;
		}

		// see if a hint is pending
		if (m_pLastPlayHint_deal)
		{
			// accept the hint
			pMAINFRAME->SetStatusText("Playing hint card...");
			ASSERT(m_pLastPlayHint_deal->GetOwner() == m_nCurrPlayer_deal);
			pVIEW->PostMessage(WM_COMMAND, WMS_CARD_PLAY+1000, (int)m_pLastPlayHint_deal);
			// clear hint info
			m_pLastPlayHint_deal = NULL;
//			CAutoHintDialog* pHintDlg = (CAutoHintDialog*) pMAINFRAME->GetDialog(twAutoHintDialog);
//			pHintDlg->Clear();
		}
		else
		{
			// no hint given yet, and a hint was requested
			// reject a manual request if auto hints are on (wait for auto hint to be generated)
			if (!bAutoHintRequest && (theApp.GetValue(tnAutoHintMode) > 0))
				return;
			// get the hint
			CCard* pCard = m_pPlayer_deal[m_nCurrPlayer_deal]->GetPlayHint();
			if (pCard)
			{
				CWindowDC dc(pVIEW);
				pCard->FlashCard(&dc);
				// save the hint as pending hint
				m_pLastPlayHint_deal = pCard;
			}
			else
			{
				AfxMessageBox("No hint available.");
			}
		}
	}
}



//
void CEasyBDoc::OnGameHint() 
{
	GetGameHint(FALSE);
}

		
//
// IsHintAvailable()
//
BOOL CEasyBDoc::IsHintAvailable()
{
	if ( (theApp.IsBiddingInProgress() && (m_nLastBiddingHint_deal >= 0) && m_bHintFollowed_deal) ||
		 (theApp.IsGameInProgress() && m_pLastPlayHint_deal) )
		return TRUE;
	else
		return FALSE;
}

		
//
// ShowAutoHint()
//
void CEasyBDoc::ShowAutoHint()
{
	// see if auto hints are enabled
	if (!theApp.IsAutoHintEnabled())
	{
		// no auto hints
		// still, if we're bidding & we're South, get a fake bid 
		// to fill out internal variables
		if (theApp.IsBiddingInProgress() && (m_nCurrPlayer_deal == SOUTH))
		{
			// this is a terrible hack, but it's necessary to keep from 
			// screwing up the internal state variables
			m_pPlayer_deal[m_nCurrPlayer_deal]->SetTestBiddingMode(true);
			m_pPlayer_deal[m_nCurrPlayer_deal]->BidInternal();
			m_pPlayer_deal[m_nCurrPlayer_deal]->SetTestBiddingMode(false);
		}
		return;
	}
	
	// no more hints if user didn't follow our previous advice
	if (theApp.IsBiddingInProgress() && !m_bHintFollowed_deal)
		return;

	//
	BOOL bCanGiveHint = FALSE;
	if (m_nCurrPlayer_deal == SOUTH)
		bCanGiveHint = TRUE;
	if (theApp.IsGameInProgress() && (m_nContractTeam_deal == NORTH_SOUTH) &&
												(m_nCurrPlayer_deal == NORTH))
		bCanGiveHint = TRUE;
	//
	if (!bCanGiveHint)
		return;

	// 
	pMAINFRAME->MakeDialogVisible(twAutoHintDialog);
	CAutoHintDialog* pHintDlg = (CAutoHintDialog*) pMAINFRAME->GetDialog(twAutoHintDialog);
	CBidDialog* pBidDlg = (CBidDialog*) pMAINFRAME->GetDialog(twBidDialog);
	if (theApp.IsBiddingInProgress())
	{
		// get the hint
		m_bHintMode = FALSE;
		pHintDlg->EnableHintAccept(TRUE);
		int nBid = m_pPlayer_deal[SOUTH]->GetBiddingHint(TRUE);
		pBidDlg->SendMessage(WM_COMMAND, WMS_FLASH_BUTTON, nBid);
		m_nLastBiddingHint_deal = nBid;
	}
	else if (theApp.IsGameInProgress())
	{
		// get the play hint
		CCard* pCard = m_pPlayer_deal[m_nCurrPlayer_deal]->GetPlayHint(TRUE);
		if (pCard)
		{
			pHintDlg->EnableHintAccept(TRUE);
			CWindowDC dc(pVIEW);
			pCard->FlashCard(&dc);
			// save the hint as pending hint
			m_pLastPlayHint_deal = pCard;
		}
	}
}






////////////////////////////////////////////////////////////////////
//                                                                //
// Bid processing routines                                        //
//                                                                //
////////////////////////////////////////////////////////////////////


//
// Check bid's validity
//
BOOL CEasyBDoc::IsBidValid(int nBid)
{
	// check limits
	if ((nBid < BID_PASS) || (nBid > BID_REDOUBLE))
		return FALSE;
	// check legality of redouble
	if ( ((nBid == BID_REDOUBLE) && (!m_bDoubled_deal)) ||
		 ((nBid == BID_REDOUBLE) && (m_bRedoubled_deal)) )
		return FALSE;
	// check legality of double
	if ( ((nBid == BID_DOUBLE) && (m_nLastValidBid_deal == BID_PASS)) ||
		 ((nBid == BID_DOUBLE) && ((m_bDoubled_deal) || (m_bRedoubled_deal))) )
		return FALSE;
	// check for basic conditions
	if ((nBid == BID_PASS) || (m_numBidsMade_deal == 0) || (m_nLastValidBid_deal == BID_PASS))
		return TRUE;
	// compare against last valid bid
	if (nBid > m_nLastValidBid_deal)
		return TRUE;
	else
		return FALSE;
}



//
// Record a bid
// 
int CEasyBDoc::EnterBid(int nPos, int nBid)
{
	CString strTemp;
	if ((nPos < SOUTH) || (nPos > EAST)) 
	{
		strTemp.Format("Illegal call to 'EnterBid() with #%d as the bidder.",nPos);		
		AfxMessageBox(strTemp);
		return -1;
	}
	if (!IsBidValid(nBid)) 
	{
		strTemp.Format("Caught logic error: %s attempted an illegal bid of %s.",
						PositionToString(nPos),
						BidToShortString(nBid));		
		AfxMessageBox(strTemp,MB_ICONEXCLAMATION);
		return -1;
	}

	// update records
	// check for bid type
	if (nBid == BID_PASS) 
	{
		m_numPasses_deal++;
	} 
	else if (nBid == BID_DOUBLE) 
	{
		m_bDoubled_deal = TRUE;
		m_bRedoubled_deal = FALSE;
		m_nContractModifier_deal = 1;
		m_numPasses_deal = 0;
	} 
	else if (nBid == BID_REDOUBLE) 
	{
		m_bDoubled_deal = FALSE;
		m_bRedoubled_deal = TRUE;
		m_nContractModifier_deal = 2;
		m_numPasses_deal = 0;
	} 
	else 
	{
		int nTeam;
		if ((nPos == SOUTH) || (nPos == NORTH))
			nTeam = NORTH_SOUTH;
		else
			nTeam = EAST_WEST;
		m_numPasses_deal = 0;
		m_nLastValidBid_deal = nBid;
		m_nLastValidBidTeam_deal = nTeam;
		m_nValidBidHistory_deal[m_numValidBidsMade_deal] = nBid;
		m_numValidBidsMade_deal++;

		// see if this is a new suit for the partnership
		int nSuit = (nBid-1) % 5;
		if (nSuit != m_nPartnershipSuit_deal[nTeam]) 
		{
			m_nPartnershipSuit_deal[nTeam] = nSuit;
			if (m_nPartnershipLead_deal[nTeam][nSuit] == NONE)
				m_nPartnershipLead_deal[nTeam][nSuit] = nPos;
		}

		// see if this is the first bid made
		if (m_nOpeningBid_deal == 0)
		{
			m_nOpeningBid_deal = nBid;
			m_nOpeningBidder_deal = nPos;
		}

		//
		m_bDoubled_deal = FALSE;
		m_bRedoubled_deal = FALSE;
		m_nContractModifier_deal = 0;
	}

	// record the bid
	m_nBiddingHistory_deal[m_numBidsMade_deal] = nBid;
	m_nBidsByPlayer_deal[nPos][m_nBiddingRound_deal] = nBid;
	
	// and advance the bid counter
	m_numBidsMade_deal++;
	m_nBiddingRound_deal = m_numBidsMade_deal / 4;
	m_nCurrPlayer_deal = GetNextPlayer(m_nCurrPlayer_deal);

	// see if our bidding hint was followed
	if ((nPos == SOUTH) && (m_nLastBiddingHint_deal != NONE))
	{
		if (nBid == m_nLastBiddingHint_deal)
		{
			m_bHintFollowed_deal = TRUE;
		}
		else
		{
			// advice overridden!
			m_bHintFollowed_deal = FALSE;
			CAutoHintDialog* pHintDlg = (CAutoHintDialog*) pMAINFRAME->GetDialog(twAutoHintDialog);
			pHintDlg->SetHintText(_T("Bidding hints not available."));
		}
	}

	// then clear pending hint
	m_nLastBiddingHint_deal = NONE;

	// update display
	UpdateBiddingHistory();

	// give each player a chance to note the bid
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RecordBid(nPos,nBid);

	// see if the hand was passed out 
	if ((m_numPasses_deal >= 4) && (m_nLastValidBid_deal == BID_PASS))
	{
		// passes all around, so gotta redeal
		return -99;
	}

	// check to see if contract has been reached
	if ((m_numPasses_deal >= 3) && (m_nLastValidBid_deal != BID_PASS))
	{
		// contract has been set
		m_nContract_deal = m_nLastValidBid_deal;
		m_nContractSuit_deal = BID_SUIT(m_nLastValidBid_deal);
		m_nContractLevel_deal = BID_LEVEL(m_nLastValidBid_deal);
		m_nTrumpSuit_deal = m_nContractSuit_deal;
		m_nContractTeam_deal = m_nLastValidBidTeam_deal;
		m_nDefendingTeam_deal = (m_nContractTeam_deal == NORTH_SOUTH)? EAST_WEST : NORTH_SOUTH;
		m_nDeclarer_deal = m_nPartnershipLead_deal[m_nContractTeam_deal][m_nContractSuit_deal];
		m_nGameLead_deal = GetNextPlayer(m_nDeclarer_deal);
		m_nDummy_deal = GetNextPlayer(m_nGameLead_deal);
		m_pPlayer_deal[m_nDummy_deal]->SetDummyFlag(TRUE);
		m_pPlayer_deal[m_nDeclarer_deal]->SetDeclarerFlag(TRUE);
		m_nRoundLead_deal = m_nGameLead_deal;

		// ### TEMP ###
		ASSERT(m_nRoundLead_deal >= 0);

		m_nCurrPlayer_deal = m_nRoundLead_deal;
		m_nTrickLead_deal[0] = m_nRoundLead_deal;

		// record end of bidding 
		for(int i=0;i<4;i++)
			m_pPlayer_deal[i]->BiddingFinished();

		//
		CAutoHintDialog* pHintDlg = (CAutoHintDialog*) pMAINFRAME->GetDialog(twAutoHintDialog);
		pHintDlg->Clear();
		pHintDlg->EnableHintAccept(FALSE);

		//
		UpdatePlayHistory();
		//
		return 1;
	} 
	else 
	{
		return 0;
	}
}




//
//
// UndoBid()
//
// Undo last bid
// 
int CEasyBDoc::UndoBid()
{
	if (!theApp.IsBiddingInProgress() || (m_numBidsMade_deal == 0))
		return 0;

/*
	// restore neural net weights
	if (theApp.GetValue(tnBiddingEngine) == 1)
	{
		CNeuralNet* pNet = theApp.GetNeuralNet();
		pNet->RestoreWeights();
	}
*/
	// clear "first bid" setting if appropriate
	int nCurrentBid = m_nBiddingHistory_deal[m_numBidsMade_deal];
	if (m_nOpeningBid_deal == nCurrentBid)
	{
		m_nOpeningBid_deal = 0;
		m_nOpeningBidder_deal = NONE;
	}

	// update counts
	m_numBidsMade_deal--;
	if (m_numBidsMade_deal == 0)
	{
		// backed up to start of bidding
		m_bDoubled_deal = FALSE;
		m_bRedoubled_deal = FALSE;
		m_nContractModifier_deal = 0;
		m_nLastValidBid_deal = 0;
		m_nLastValidBidTeam_deal = NONE;
		return 0;
	}

	// recall the previous bid
	int nBid = m_nBiddingHistory_deal[m_numBidsMade_deal];
	m_nCurrPlayer_deal = GetPrevPlayer(m_nCurrPlayer_deal);
	int nPos = m_nCurrPlayer_deal;
	//
	m_nBiddingHistory_deal[m_numBidsMade_deal] = NONE;
	m_nBidsByPlayer_deal[nPos][m_nBiddingRound_deal] = NONE;
	m_nBiddingRound_deal = m_numBidsMade_deal / 4;
	m_nLastBiddingHint_deal = NONE;

	// check state
	if (nBid == BID_PASS) 
	{
		m_numPasses_deal--;
	}
	else if (nBid == BID_DOUBLE)
	{
		m_bDoubled_deal = FALSE;
		m_nContractModifier_deal = 0;
		// check # of passes
		m_numPasses_deal = 0;
		for(int i=m_numBidsMade_deal-1;i>=0;i--)
		{
			if (m_nBiddingHistory_deal[i] != BID_DOUBLE)
				break;
			m_numPasses_deal++;
		}
	}
	else if (nBid == BID_REDOUBLE)
	{
		m_bRedoubled_deal = FALSE;
		m_nContractModifier_deal = 1;
		// check # of passes
		m_numPasses_deal = 0;
		for(int i=m_numBidsMade_deal-1;i>=0;i--)
		{
			if (m_nBiddingHistory_deal[i] != BID_DOUBLE)
				break;
			m_numPasses_deal++;
		}
	}
	else
	{
		//
		int nTeam;
		if ((nPos == SOUTH) || (nPos == NORTH))
			nTeam = NORTH_SOUTH;
		else
			nTeam = EAST_WEST;
		m_numPasses_deal = 0;

		// search back for the last valid bid
		int i = 0;
		for(i=m_numBidsMade_deal-1;i>=0;i--)
		{
			if ((m_nBiddingHistory_deal[i] != BID_PASS) && (m_nBiddingHistory_deal[i] != BID_DOUBLE) && (m_nBiddingHistory_deal[i] != BID_DOUBLE))
				break;
		}
		if (i >= 0)
		{
			m_nLastValidBid_deal = nBid;
			m_nLastValidBidTeam_deal = nTeam;
			m_nValidBidHistory_deal[m_numValidBidsMade_deal] = nBid;
		}
		else
		{
			m_nLastValidBid_deal = NONE;
			m_nLastValidBidTeam_deal = NEITHER;
			m_nValidBidHistory_deal[m_numValidBidsMade_deal] = NONE;
		}

		// one less valid bid was made 
		m_numValidBidsMade_deal--;

		// re-check to see which player led for team
		// first clear 
		m_nPartnershipSuit_deal[NORTH_SOUTH] = m_nPartnershipSuit_deal[EAST_WEST] = NONE;
		for(int i=0;i<4;i++)
		{
			m_nPartnershipLead_deal[NORTH_SOUTH][i] = NONE;
			m_nPartnershipLead_deal[EAST_WEST][i] = NONE;
		}
		// then scan
		for(int i=0;i<m_numBidsMade_deal;i++)
		{
			int nBid = m_nBiddingHistory_deal[i];
			int nSuit = (nBid-1) % 5;
			if (nSuit != m_nPartnershipSuit_deal[nTeam]) 
			{
				m_nPartnershipSuit_deal[nTeam] = nSuit;
				if (m_nPartnershipLead_deal[nTeam][nSuit] == NONE)
					m_nPartnershipLead_deal[nTeam][nSuit] = nPos;
			}
		}
	}

	// update display
	UpdateBiddingHistory();

	// give each player a chance to note the bid
/*
	if (!m_bReviewingGame)
	{
		for(int i=0;i<4;i++)
			m_pPlayer[i]->RecordBidUndo(nPos,nBid);
	}
*/
	//
	return 0;
}



//
// WasSuitBid()
//
int CEasyBDoc::WasSuitBid(int nSuit) const
{
	for(int i=0;i<m_numValidBidsMade_deal;i++)
	{
		if (nSuit == BID_SUIT(m_nValidBidHistory_deal[i]))
			return TRUE;
	}
	//
	return FALSE;
}



//
// GetSuitsBid()
//
int CEasyBDoc::GetSuitsBid(CArray<int,int>& suits) const
{
	BOOL nSuitsBid[4] = { FALSE, FALSE, FALSE, FALSE };
	suits.RemoveAll();
	//
	for(int i=0;i<m_numValidBidsMade_deal;i++)
	{
		int nSuit = BID_SUIT(m_nValidBidHistory_deal[i]);
		if (!nSuitsBid[nSuit])
		{
			nSuitsBid[nSuit] = TRUE;
			suits.InsertAt(0, nSuit);
		}
	}
	//
	return suits.GetSize();
}



//
// GetSuitsUnbid()
//
int CEasyBDoc::GetSuitsUnbid(CArray<int,int>& suits) const
{
	for(int i=0;i<4;i++)
	{
		if (!WasSuitBid(i))
			suits.InsertAt(0, i);
	}
	return suits.GetSize();
}




//
// SetBiddingComplete()
//
// - called from the view to inform that the bidding has completed
//   and the bidding dialog has closed
//
void CEasyBDoc::SetBiddingComplete()
{
	// if declarer is north, expose north's cards
	if (m_nDeclarer_deal == NORTH)
		m_pPlayer_deal[NORTH]->ExposeCards(TRUE);
}



//
void CEasyBDoc::UpdateBiddingHistory() 
{
	CString strBids, strPlainBids, strScreenBids, strTemp, strTempPlain;

	// return if output suppressed
	if (m_bSuppressBidHistoryUpdate)
		return;

	// return if dealer is not yet set
	int nPos = m_nDealer_deal;
	if (!ISPOSITION(nPos))
	{
		pMAINFRAME->SetBiddingHistory("");
		return;
	}

	// check resolution
	BOOL bSmallCards = theApp.GetValue(tbLowResOption);

	// check mode
	BOOL bUseSymbols = theApp.GetValue(tbUseSuitSymbols);
		
	//
	for(int i=0;i<4;i++) 
	{
		strTemp.Format("%-5s",PositionToString(nPos));
		strBids += strTemp;
		strBids += " ";
		nPos = GetNextPlayer(nPos);
	}
	strBids += "\r\n----- ----- ----- -----\r\n";
	strPlainBids = strBids;
	//
	CString strSpace = "    ";

	for(int i=0;i<m_numBidsMade_deal;i++) 
	{
		// get the bid string
		int nBid = m_nBiddingHistory_deal[i];
		if (bUseSymbols && ISBID(nBid))
		{
			// use symbols
			int nSuit = BID_SUIT(nBid);
			if (nSuit != NOTRUMP)
				strTemp.Format(_T("%1d%c"), BID_LEVEL(nBid), (unsigned char)(tSuitLetter + nSuit));
			else
				strTemp.Format(_T("%1dNT"), BID_LEVEL(nBid));
		}
		else
		{
			strTemp = BidToShortString(m_nBiddingHistory_deal[i]);
		}

		// letter version
		strTempPlain = BidToShortString(m_nBiddingHistory_deal[i]);

		// center the bid string by adding spaces fore & aft
		int nLen = strTemp.GetLength();
		int nBegOffset = (5 - nLen) / 2;
		int nEndOffset = nBegOffset;
		if ((nBegOffset + nLen + nEndOffset) < 5)
			nEndOffset++;

		// letter/symbol version
		strBids += strSpace.Left(nBegOffset);
		strBids += strTemp;
		strBids += strSpace.Left(nEndOffset);
		strBids += " ";
		if ((i % 4) == 3)
			strBids += "\r\n";

		// plain version
		nLen = strTempPlain.GetLength();
		nBegOffset = (5 - nLen) / 2;
		nEndOffset = nBegOffset;
		if ((nBegOffset + nLen + nEndOffset) < 5)
			nEndOffset++;
		//
		strPlainBids += strSpace.Left(nBegOffset);
		strPlainBids += strTempPlain;
		strPlainBids += strSpace.Left(nEndOffset);
		strPlainBids += " ";
		if ((i % 4) == 3)
			strPlainBids += "\r\n";
	}
	//
	pMAINFRAME->SetBiddingHistory((LPCTSTR)strBids, bUseSymbols);
	pMAINFRAME->SetPlainBiddingHistory((LPCTSTR)strPlainBids);
}





////////////////////////////////////////////////////////////
//                                                        //
// Trick processing routines                              //
//                                                        //
////////////////////////////////////////////////////////////



//
// BeginRound()
//
// called after bidding is finished to get the play started
//
void CEasyBDoc::BeginRound()
{
	// make sure the view reflects the new dummy suit sequence
	if (theApp.GetValue(tbShowDummyTrumpsOnLeft))
	{
		theApp.InitDummySuitSequence(m_nTrumpSuit_deal, m_nDummy_deal);
		pVIEW->ResetDummySuitSequence();
	}

	// then start the play
	pVIEW->AdvanceToNextPlayer();
//	InvokeNextPlayer();
}



//
// ExposeDummy()
//
// called to show the dummy's cards
//
void CEasyBDoc::ExposeDummy(BOOL bExpose, BOOL bRedraw) 
{ 
	m_bExposeDummy_deal = bExpose; 
	// never hide south
	if ((m_nDummy_deal == SOUTH) && (!bExpose))
		bExpose = TRUE;
	//
	m_pPlayer_deal[m_nDummy_deal]->ExposeCards(bExpose, bRedraw); 
}




//
// TestPlayValidity()
//
// called to see if a play is valid
//
BOOL CEasyBDoc::TestPlayValidity(Position nPos, CCard* pCard, BOOL bAlert)
{
	// see if it's from the proper hand
	if ((pCard->GetOwner() != nPos) || (nPos != m_nCurrPlayer_deal))
		return FALSE;

	// see if this card is valid
	if (m_numCardsPlayedInRound_deal > 0)
	{
		// see if we're playing the wrong suit
		if ((pCard->GetSuit() != m_nSuitLed_deal) && 
					(m_pPlayer_deal[nPos]->GetNumCardsInSuit(m_nSuitLed_deal) > 0))
		{
			if (bAlert)
				AfxMessageBox("You have to follow suit.", MB_OK | MB_ICONEXCLAMATION);
			return FALSE;
		}
	}

	// else all's ok
	return TRUE;
}





//
// EnterCardPlay() 
//
// called when a card is played onto the table
//
void CEasyBDoc::EnterCardPlay(Position nPos, CCard* pCard) 
{	
	// sanity check
	if (m_numCardsPlayedInRound_deal > 0)
	{
		int nSuitLed = m_pCurrTrick_deal[m_nRoundLead_deal]->GetSuit();
		// did the player not follow suit?
		if (pCard->GetSuit() != nSuitLed)
		{
			// make sure he has no more cards in the suit led
			ASSERT(m_pPlayer_deal[nPos]->GetNumCardsInSuit(nSuitLed) == 0);
		}
	}

	// process the play
	PLAYER(nPos).RemoveCardFromHand(pCard);

	// then establish the card as being in the current trick
	SetCurrentTrickCard(nPos, pCard);
	if (m_numCardsPlayedInRound_deal == 0)
		m_nSuitLed_deal = pCard->GetSuit();
	m_numCardsPlayedInRound_deal++;
	ASSERT(m_numCardsPlayedInRound_deal <= 4);

	// update running play record
	m_nPlayRecord_deal[m_numCardsPlayedInGame_deal] = pCard->GetDeckValue();
	m_numCardsPlayedInGame_deal++;
	m_nCurrPlayer_deal = ::GetNextPlayer(nPos);

	// get players' reactions
	for(int i=0;i<4;i++) 
		m_pPlayer_deal[i]->RecordCardPlay(nPos, pCard);

	// clear pending hint
	m_pLastPlayHint_deal = NULL;

	// update status display
	pMAINFRAME->UpdateStatusWindow();
	// and record
	UpdatePlayHistory();
}




//
// InvokeNextPlayer()
//
// invokes the next computer player 
// called after a card has been selected for play
//
void CEasyBDoc::InvokeNextPlayer() 
{	
	CPlayer* pCurrPlayer = m_pPlayer_deal[m_nCurrPlayer_deal];

	// disable player hints
	CAutoHintDialog* pHintDlg = (CAutoHintDialog*) pMAINFRAME->GetDialog(twAutoHintDialog);
	pHintDlg->EnableHintAccept(FALSE);

	// see if we'll be pausing between plays
	int nPauseLength = 0, nStartTime = 0;
	if (theApp.GetValue(tbInsertBiddingPause) && !m_bExpressPlayMode)
	{
		// get pause duration
		nPauseLength = theApp.GetValue(tnPlayPauseLength) * 100;

		// and the time
		if (nPauseLength > 0)
			nStartTime = timeGetTime();
	}

	// now call the card play function
	CCard* pCard;
	try 
	{
		pCard = pCurrPlayer->PlayCard();
	}
//	catch(int& nExceptionCode)
	catch(int)
	{
		// escape clause
//		if (nExceptionCode == 1)	// computer player claimed the remaining tricks
		return;
	}
	catch(CGIBException& exception)
	{
		// see if there was an error
		if (exception.GetErrorCode() != 0)
			AfxMessageBox("An error ocurred while attempting to run GIB.  Please check to be sure GIB is installed properly.");
		// restart the hand
		pMAINFRAME->PostMessage(WM_COMMAND, ID_RESTART_CURRENT_HAND, 0);
		return;
	}
	// do some sanity checks here
	ASSERT(pCard->IsValid());
	ASSERT(pCurrPlayer->GetHand().HasCard(pCard));
	ASSERT((Position)pCard->GetOwner() == pCurrPlayer->GetPosition());

	// see if we should sleep
	if (nPauseLength > 0)
	{
		int nEndTime = timeGetTime();
		int nElapsedTime = nEndTime - nStartTime;
		int nTimeToSleep = nPauseLength - nElapsedTime;
		if (nTimeToSleep > 0)
			Sleep(nTimeToSleep);
	}

	// and then we POST a card play message to the view 
	// (instead of SENDing a messge or calling a function) 
	// in order to prevent recursive calls
	pVIEW->PostMessage(WM_COMMAND, WMS_CARD_PLAY+1001, (int)pCard);
}




//
// UndoLastCardPlayed() 
//
// called to undo a card play
//
void CEasyBDoc::UndoLastCardPlayed() 
{
	if (m_numCardsPlayedInRound_deal < 1)
		return;
	int nPos = GetPrevPlayer(m_nCurrPlayer_deal);

	CCard* pCard = m_pCurrTrick_deal[nPos];
	// turn card back over if necessary -- i.e., if all cards are face up, 
	// or if the card belongs to South, or to dummy, or to North when South is dummy
	if ((nPos == SOUTH) || (nPos == m_nDummy_deal) || ((nPos == NORTH) && (m_nDummy_deal == SOUTH)) )
		pCard->SetFaceUp();
	else
		pCard->SetFaceDown();

	// and reinsert card into the hand
	m_pPlayer_deal[nPos]->AddCardToHand(pCard, TRUE);

	// and inform all players of the undo
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RecordCardUndo(nPos, pCard);

	// clear pending hint
	m_pLastPlayHint_deal = NULL;

	// reset the current trick card
	m_pCurrTrick_deal[nPos] = NULL;
	m_numCardsPlayedInRound_deal--;
	m_numCardsPlayedInGame_deal--;
	m_nPlayRecord_deal[m_numCardsPlayedInGame_deal] = -1;
	m_nCurrPlayer_deal = nPos;
	UpdatePlayHistory();
}



//
// UndoTrick() 
//
// called to undo the current trick
//
void CEasyBDoc::UndoTrick() 
{
	// start with the most recent card and work backwards
	int numCardsPlayed = m_numCardsPlayedInRound_deal;
	for(int i=0;i<numCardsPlayed;i++)
		UndoLastCardPlayed();
	//
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RecordTrickUndo();

	// update info
	m_nRoundWinner_deal = NONE;
//	UpdatePlayHistory();
//	SetCurrentPlayer(m_nRoundLead);

	// update status display
	pMAINFRAME->UpdateStatusWindow();

	// see if we should hide dummy
	if (m_numTricksPlayed_deal == 0)
	{
		// turn off dumy exposure flag
		if (m_nDummy_deal != SOUTH)
			m_pPlayer_deal[m_nDummy_deal]->ExposeCards(FALSE, FALSE);
		m_bExposeDummy_deal = FALSE;
//		pVIEW->DisplayHand((Position)m_nDummy);
//		ResetDisplay();
	}
}



//
// UndoPreviousTrick() 
//
// called to undo the _previous_ trick
//
void CEasyBDoc::UndoPreviousTrick() 
{
	if (m_numTricksPlayed_deal == 0)
		return;
	//
	int nRound = m_numTricksPlayed_deal - 1;
	m_nRoundLead_deal = m_nTrickLead_deal[nRound];

	// return each card from the previous trick to the players
	int nPos = m_nRoundLead_deal;
	for(int i=0;i<4;i++)
	{
		// retrieve the card and turn face up or down
		CCard* pCard = m_pGameTrick_deal[nRound][nPos];
		if ((nPos == SOUTH) || (nPos == m_nDummy_deal) || ((nPos == NORTH) && (m_nDummy_deal == SOUTH)) )
//				((nPos == NORTH) && (m_nDummy == SOUTH) && (m_numTricksPlayed > 1)) )
			pCard->SetFaceUp();
		else
			pCard->SetFaceDown();

		// and reinsert card into the hand
		m_pPlayer_deal[nPos]->AddCardToHand(pCard, TRUE);

		// inform each player of the card undo
		for(int i=0;i<4;i++)
			m_pPlayer_deal[i]->RecordCardUndo(nPos, pCard);

		// adjust counters
		m_numCardsPlayedInGame_deal--;
		m_nPlayRecord_deal[m_numCardsPlayedInGame_deal] = -1;

		// move to the next player
		nPos = GetNextPlayer(nPos);
	}

	// inform each player of the trick undo
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RecordTrickUndo();

	// clear pending hint
	m_pLastPlayHint_deal = NULL;

	// adjust count
	m_numTricksPlayed_deal--;
	m_numActualTricksPlayed_deal--;
	m_numCardsPlayedInRound_deal = 0;
	m_nRoundWinner_deal = NONE;

	// also adjust trick count
	switch(m_nTrickWinner_deal[nRound])
	{
		case SOUTH: case NORTH:
			m_numTricksWon_deal[NORTH_SOUTH]--;
			break;
		case EAST: case WEST:
			m_numTricksWon_deal[EAST_WEST]--;
			break;
	}

	// see if we should hide dummy
	if (m_numTricksPlayed_deal == 0)
	{
		// turn off dumy exposure flag
		if (m_nDummy_deal != SOUTH)
			m_pPlayer_deal[m_nDummy_deal]->ExposeCards(FALSE, FALSE);
		m_bExposeDummy_deal = FALSE;
//		ResetDisplay();
	}

	// reset the current player
	m_nCurrPlayer_deal = m_nRoundLead_deal;

	// update displays
	UpdatePlayHistory();
	pMAINFRAME->UpdateStatusWindow();
}



//
// ClearHands() 
//
// empty the players' hands
//
void CEasyBDoc::ClearHands() 
{
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->ClearHand();
	ClearPlayInfo();
	// also clear the deck
	theApp.GetDeck()->Clear();
}


//
// EvaluateTrick() 	
//
void CEasyBDoc::EvaluateTrick(BOOL bQuietMode) 	
{
	CCard *pCard;
	// evalaute winner
	int nPos;
	m_nHighVal_deal = 0;
	m_nHighTrumpVal_deal = 0;
	BOOL bTrumpPlayed = FALSE;
	//
	for(nPos=SOUTH;nPos<=EAST;nPos++) 
	{
		pCard = m_pCurrTrick_deal[nPos];
		int nSuit = pCard->GetSuit();
		int nCardVal = pCard->GetFaceValue();
		//
		if ((m_nContractSuit_deal != NOTRUMP) && (nSuit == m_nContractSuit_deal))
			bTrumpPlayed = TRUE;
		if (bTrumpPlayed)
		{
			// a trump has been played in this round, so only
			// a trump card can win the trick
			if ((nSuit == m_nContractSuit_deal) && (nCardVal > m_nHighTrumpVal_deal))
			{
				m_nHighVal_deal = m_nHighTrumpVal_deal = nCardVal;
				m_pHighCard_deal = pCard;
				m_nHighPos_deal = nPos;
			}
		}
		else
		{
			// trump has not yet been played in this trick
			// see if this is the highest card of the suit led
			if ((nSuit == m_nSuitLed_deal) && (nCardVal > m_nHighVal_deal))
			{
				m_nHighVal_deal = nCardVal;
				m_nHighTrumpVal_deal = 0;
				m_pHighCard_deal = pCard;
				m_nHighPos_deal = nPos;
			}
		}
	}
	// this is pending the addition of trump logic
	m_nRoundWinner_deal = m_nHighPos_deal;
	m_nRoundWinningTeam_deal = (Team) GetPlayerTeam(m_nRoundWinner_deal);

	// update play history
	UpdatePlayHistory();

	// see if we're on full auto
	if (m_bExpressPlayMode)
	{
		// proceed without stopping
		ClearTrick();
		return;
	}

	// declare winner if in interactive mode
	CString strMessage;
	strMessage.Format("%s wins the trick.", PositionToString(m_nRoundWinner_deal));
	if (!m_bReviewingGame)
		strMessage += "  Click for the next round.";
	pMAINFRAME->SetStatusText(strMessage);

	// we don't finalize anything yet, since the last move can
	// still be taken back
	if (!m_bReviewingGame && !m_bBatchMode)
		pVIEW->SetCurrentMode(CEasyBView::MODE_CLICKFORNEXTTRICK);
}



//
// ClearTrick()
//
// called after the user clicks to continue after playing a trick
//
void CEasyBDoc::ClearTrick() 
{
	// inform the players
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RecordRoundComplete(m_nRoundWinner_deal, m_pHighCard_deal);

	// record trick in game record
	for(int i=0;i<4;i++)
		m_pGameTrick_deal[m_numTricksPlayed_deal][i] = m_pCurrTrick_deal[i];
	m_numTricksWon_deal[m_nRoundWinningTeam_deal]++;
	m_nTrickWinner_deal[m_numTricksPlayed_deal] = m_nRoundWinner_deal;
	m_numTricksPlayed_deal++;
	m_numActualTricksPlayed_deal++;

	// clear round
	m_numCardsPlayedInRound_deal = 0;
	for(int i=0;i<4;i++)
		m_pCurrTrick_deal[i] = NULL;

	// update counts
	if (!theApp.GetValue(tbAutoTestMode))
	{
		UpdatePlayHistory();
		pMAINFRAME->DisplayTricks();
		pVIEW->DisplayTricks();
	}
//	m_nPlayRound++;

	// and prep for the next round
	m_nRoundLead_deal = m_nRoundWinner_deal;

	// ### TEMP ###
	ASSERT(m_nRoundLead_deal >= 0);

	m_nCurrPlayer_deal = m_nRoundLead_deal;
	m_nTrickLead_deal[m_numTricksPlayed_deal] = m_nCurrPlayer_deal;
	m_nRoundWinner_deal = NONE;
//	for(i=0;i<4;i++)
//		m_pCurrTrick[i] = NULL;
	
	//
	if (m_bReviewingGame)
		return;
	
	//
	if (m_numTricksPlayed_deal == 13) 
	{
		// game is finished
		OnGameComplete();
	} 
	else 
	{
		// if we're playing normally (i.e., not auto playing through, 
		// _and_ not loading a saved position), then prompt the user and 
		// go on to the next round
		if (!m_bExpressPlayMode && !m_bBatchMode)
		{
			pVIEW->PromptLead();
			pVIEW->SetCurrentMode(CEasyBView::MODE_WAITCARDPLAY);
			BeginRound();
		}
		else if (!m_bBatchMode)
		{
			// else if we're playing through (and not not loading a saved position), 
			// automatically go on to the next round
			BeginRound();
		}
	}
}


//
// OnGameComplete()
//
//
void CEasyBDoc::OnGameComplete()
{
	// game over -- see if the contract was made
	pMAINFRAME->ClearStatusMessage();
	int nRqmt = BID_LEVEL(m_nContract_deal) + 6;
	int nDiff = m_numTricksWon_deal[m_nContractTeam_deal] - nRqmt;
	CString strTeam = TeamToString(m_nContractTeam_deal);
	CString strMessage, strOldMessage;

	// see if we're in autotest
	if (theApp.GetValue(tbAutoTestMode))
	{
		// simply return
		return;
	}

	// clear hints if enabled
	if (theApp.GetValue(tnAutoHintMode) > 0)
		pMAINFRAME->ClearAutoHints();

	// see if we're in practice mode using duplicate scoring
	if (!theApp.IsRubberInProgress() && theApp.IsUsingDuplicateScoring())
	{
		// if duplicate scoring is enabled, get the score
		UpdateDuplicateScore();
		int nResult = (nDiff >= 0)? (m_numTricksWon_deal[m_nContractTeam_deal] - 6) : nDiff; 
		int nScore;
		if (nResult > 0)
			nScore = m_nTotalScore_deal[m_nContractTeam_deal];
		else
			nScore = -m_nTotalScore_deal[m_nDefendingTeam_deal];
		// check play mode
		strMessage.Format("%s Result = %s%d;  Score = %s%d.", 
							strTeam,
							((nResult < 0)? "" : "+"), nResult,
							((nScore < 0)? "" : "+"), nScore);
	}
	else
	{
		// normal rubber or practice mode, no duplicate
		if (nDiff > 0)
		{
			strMessage.Format("%s made %d overtrick%s", strTeam, nDiff,
								(nDiff > 1)? "s." : ".");
		}
		else if (nDiff < 0)
		{
			strMessage.Format("%s were set %d trick%s", strTeam, -nDiff,
								(nDiff < -1)? "s." : ".");
		}
		else
		{
			strMessage.Format("%s made the contract.", strTeam);
		}
	}

	// format "old" message
	if (!m_bAutoReplayMode)
		strOldMessage = _T("You: ") + strMessage;

	// check the mode
	if (m_bAutoReplayMode)
		strMessage = _T("Computer: ") + strMessage;

	// inform the players
	if (!m_bReviewingGame)
	{
		for(int i=0;i<4;i++)
			m_pPlayer_deal[i]->RecordHandComplete(nDiff);
	}

	// reset suit sequence w/ no dummy
	theApp.InitDummySuitSequence(NONE, NONE);

	// show the original hands
	BOOL bCardsFaceUpMode = theApp.AreCardsFaceUp();
	m_pPlayer_deal[m_nDummy_deal]->SetDummyFlag(FALSE);
	theApp.SetValue(tbShowCardsFaceUp, TRUE);
	//
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RestoreInitialHand();

	// and force display of the original cards
	ResetDisplay();

	// if playing rubber, save the old score so the proper update is
	// done in the rubber score window
	if (theApp.IsRubberInProgress())
	{
		if (m_bAutoReplayMode)
		{
			// computer just replayed -- restore old score
			m_numTricksWon_deal[m_nContractTeam_deal] = m_numActualTricksWon_deal;
		}
		else
		{
			// human played, so save actual score
			m_numActualTricksWon_deal = m_numTricksWon_deal[m_nContractTeam_deal];
		}
	}

	// turn off game auto-play
	BOOL bReplayMode = m_bAutoReplayMode;	// but save setting first
	if ((theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO) || (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO_EXPRESS))
	{
		if (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO_EXPRESS)
			EndWaitCursor();
		theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
		m_bExpressPlayMode = FALSE;
		m_bAutoReplayMode = FALSE;
//		pVIEW->EnableRefresh();		// not necessary due to ResetDisplay() above
	}

	// return here if reviewing game
	if (m_bReviewingGame)
	{
		pMAINFRAME->SetStatusMessage(strMessage);
		return;
	}

	// else prompt hand finished and optionally restart play/bid
	CRoundFinishedDialog roundFinishedDlg(pMAINFRAME);
	// if replaying, keep old comparison message
	if (bReplayMode)
		roundFinishedDlg.SetMessage(strMessage);
	else
		roundFinishedDlg.SetMessage(strMessage, strOldMessage);

	// disable "cancel" button if reviewing game
	if (m_bGameReviewAvailable)
		roundFinishedDlg.m_bDisableCancel = TRUE;
	
	//
	roundFinishedDlg.m_bReplayMode = bReplayMode;
	BOOL bCode = roundFinishedDlg.DoModal();
	if (!bCode)
	{
		// cancel, replay, or rebid the current hand
		theApp.SetValue(tbShowCardsFaceUp, bCardsFaceUpMode);
		switch(roundFinishedDlg.m_nCode)
		{
			case CRoundFinishedDialog::RF_NONE:
			{
				// return to just after the last trick
				for(int i=0;i<4;i++)
					m_pPlayer_deal[i]->RemoveAllCardsFromHand();
				m_pPlayer_deal[m_nDummy_deal]->SetDummyFlag(TRUE);
				pVIEW->Notify(WM_COMMAND, WMS_REFRESH_DISPLAY);
				pVIEW->GameFinished();
				break;
			}

			case CRoundFinishedDialog::RF_REBID:
				pVIEW->PostMessage(WM_COMMAND, ID_BID_CURRENT_HAND, 0L);
				break;
			
			case CRoundFinishedDialog::RF_REPLAY:
				// replay game
				OnRestartCurrentHand();
				break;

			case CRoundFinishedDialog::RF_AUTOPLAY:
				ComputerReplay(FALSE);
				break;

			case CRoundFinishedDialog::RF_AUTOPLAY_FULL:
				ComputerReplay(TRUE);
				break;

			default:
				ASSERT(FALSE);
				break;
		}
		// return now
		return;
	}

	// restore the cards' face-up/down status
	theApp.SetValue(tbShowCardsFaceUp, bCardsFaceUpMode);

	//
	PostProcessGame();

}



//
// PostProcessGame()
//
void CEasyBDoc::PostProcessGame() 
{
	// here, if we played from a game record, return
	if (m_bGameReviewAvailable)
	{
		// clean up dummy
		if (m_nDummy_deal != SOUTH)
			m_pPlayer_deal[m_nDummy_deal]->ExposeCards(FALSE, FALSE);
		m_bExposeDummy_deal = FALSE;
		m_bReviewingGame = TRUE;
		// and show game review dialog
		pVIEW->RestoreGameReview();
		pMAINFRAME->MakeDialogVisible(twGameReviewDialog);
		return;
	}

	// at this point, if we're playing rubber, show the score
	// else we're practicing, so just deal the next hand
	if (theApp.IsRubberInProgress())
	{
		// update score
		UpdateScore();
		// display score and deal next hand or end rubber as appropriate
		DisplayScore();
	}
	else 
	{
		// else not playing rubber
		// but if using duplicate scoring, show the score
//		if (theApp.IsUsingDuplicateScoring())
//			DisplayDuplicateScore();

		// deal the next hand
		OnDealNewHand();
	}
}




//
// UpdateScore()
//
void CEasyBDoc::UpdateScore() 
{
	// calculate the game score
	int numTricksMade = m_numTricksWon_deal[m_nContractTeam_deal];
	int nContractLevel = BID_LEVEL(m_nContract_deal);
	int numRequiredTricks = nContractLevel + 6;
	int numTrickPoints = 0;
	int numBonusPoints = 0;
	int numOvertrickPoints = 0;
	BOOL bVulnerable = m_bVulnerable_deal[m_nContractTeam_deal];
	BOOL bDoubled = m_bDoubled_deal;
	BOOL bRedoubled = m_bRedoubled_deal;
	CString strTrickPoints, strBonusPoints;

	// first check trick points & overtrick points
	if (numTricksMade >= numRequiredTricks)
	{
		int numOvertricks = numTricksMade - numRequiredTricks;
		if (numOvertricks < 0)
			numOvertricks = 0;
		switch (m_nContractSuit_deal)
		{
			case CLUBS:  case DIAMONDS:
				numTrickPoints = nContractLevel * 20;
				numOvertrickPoints = numOvertricks * 20;
				break;

			case HEARTS: case SPADES:
				numTrickPoints = nContractLevel * 30;
				numOvertrickPoints = numOvertricks * 30;
				break;
				
			case NOTRUMP:
				numTrickPoints = 40 + (nContractLevel-1) * 30;
				numOvertrickPoints = numOvertricks * 30;
				break;
		}

		// adjust for doubling/redoubling
		if (bDoubled)
			numTrickPoints *= 2;
		else if (bRedoubled)
			numTrickPoints *= 4;

		// record trick points
		m_nGameScore_deal[m_nCurrGame_deal][m_nContractTeam_deal] += numTrickPoints;
		strTrickPoints.Format("%s%4d%s\t%s%s made",
								((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
								numTrickPoints,
								((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""),
								ContractToFullString(m_nContract_deal, m_nContractModifier_deal),
								(bDoubled? " doubled" : bRedoubled? " redoubled" : ""));
		// and save
		m_strArrayTrickPointsRecord_deal.Add(strTrickPoints);

		// record doubled contract bonus, if appropriate
		if (bDoubled)
		{
			// record doubled contract bonus of 50 points
			numBonusPoints = 50;
			m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
			strBonusPoints.Format("%s%4d%s\tDoubled contract",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numBonusPoints,
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""));
			// and save
			m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
		}
		else if (bRedoubled)
		{
			// record re-doubled contract bonus of 100 points
			numBonusPoints = 100;
			m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
			strBonusPoints.Format("%s%4d%s\tRedoubled contract",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numBonusPoints,
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""));
			// and save
			m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
		}

		// record overtricks bonus, if any
		if (numOvertricks > 0)
		{
			// adjust overtrick points if doubled/redoubled
			if (bDoubled)
			{
				if (!bVulnerable)
					numOvertrickPoints = numOvertricks * 100;	// 100 pts/overtrick
				else
					numOvertrickPoints = numOvertricks * 200;
			}
			else if (bRedoubled)
			{
				if (!bVulnerable)
					numOvertrickPoints = numOvertricks * 200;
				else
					numOvertrickPoints = numOvertricks * 400;
			}
			m_nBonusScore_deal[m_nContractTeam_deal] += numOvertrickPoints;
			strBonusPoints.Format("%s%4d%s\t%1d overtrick%s%s%s",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numOvertrickPoints, 
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""),
									numOvertricks,
									((numOvertricks > 1)? "s" : ""),
									(bVulnerable? ", vulnerable": ""),
									(bDoubled? ", doubled" : bRedoubled? ", redoubled" : ""));
			// and save
			m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
		}

		// check for a slam bonus
		if (nContractLevel >= 6)
		{
			if (nContractLevel == 6)
			{
				if (!bVulnerable)
					numBonusPoints = 500;
				else
					numBonusPoints = 750;
			}
			else
			{
				if (!bVulnerable)
					numBonusPoints = 1000;
				else
					numBonusPoints = 1500;
			}
			m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
			strBonusPoints.Format("%s%4d%s\t%s slam contract%s",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numBonusPoints,
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""),
									((nContractLevel == 6)? "Small"  : "Grand"),
									(bVulnerable? ", vulnerable" : ""));
			// and save
			m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
		}

	}
	else
	{
		// ouch -- check undertrick points
		int numUndertricks = numRequiredTricks - numTricksMade;
		int numUndertrickPoints = 0;
		int nFirst = 1;								// first undertrick
		int nSecondAndThird = numUndertricks - 1;	// 2nd & third undertricks
		if (nSecondAndThird < 0)
			nSecondAndThird = 0;
		if (nSecondAndThird > 2)
			nSecondAndThird = 2;
		int nAdditional = numUndertricks - 3;		// undertricks beyond 3
		if (nAdditional < 0)
			nAdditional = 0;
		int nBeyondOne = numUndertricks - 1;
		if (nBeyondOne < 0)
			nBeyondOne = 0;
		//
		if (bDoubled)
		{
			// doubled contract
			if (!bVulnerable)
				numUndertrickPoints = (nFirst * 100) + (nSecondAndThird * 200) + (nAdditional * 300);
			else
				numUndertrickPoints = (nFirst * 200) + (nBeyondOne * 300);
		}
		else if (bRedoubled)
		{
			// redoubled contract
			if (!bVulnerable)
				numUndertrickPoints = (nFirst * 200) + (nSecondAndThird * 400) + (nAdditional * 600);
			else
				numUndertrickPoints = (nFirst * 400) + (nBeyondOne * 600);
		}
		else
		{
			// neither doubled or redoubled
			if (!bVulnerable)
				numUndertrickPoints = numUndertricks * 50;
			else
				numUndertrickPoints = numUndertricks * 100;
		}
		//
		numBonusPoints += numUndertrickPoints;
		m_nBonusScore_deal[m_nDefendingTeam_deal] += numBonusPoints;
		strBonusPoints.Format("%s%4d%s\tBonus for defeating %scontract by %d trick%s",
								((m_nDefendingTeam_deal == NORTH_SOUTH)? "" : "\t"),
								numUndertrickPoints, 
								((m_nDefendingTeam_deal == NORTH_SOUTH)? "\t" : ""),
								(bVulnerable? "vulnerable ": ""),
								numUndertricks,
								((numUndertricks > 1)? "s" : ""));
		// and save
		m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
	}

	// check for honors bonuses
	if (theApp.GetValue(tbScoreHonorsBonuses))
	{
		if (ISSUIT(m_nTrumpSuit_deal))
		{
			// check to see if a player had 4 or 5 trump honors
			for(int i=0;i<4;i++)
			{
				int numHonors = 0;
				CCardHoldings& origHand = m_pPlayer_deal[i]->GetHand().GetInitialHand();
				for(int j=TEN;j<=ACE;j++)
					if (origHand.HasCard(MAKEDECKVALUE(m_nTrumpSuit_deal, j)))
						numHonors++;
				//
				if (numHonors == 5)
				{
					int nTeam = GetPlayerTeam(i);
					m_nBonusScore_deal[nTeam] += 150;
					strBonusPoints.Format("%s150%s\tHonors bonus for holding 5 trump honors",
											((nTeam == NORTH_SOUTH)? "" : "\t"),
											((nTeam == NORTH_SOUTH)? "\t" : ""));
					m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
					break;
				}
				else if (numHonors == 4)
				{
					int nTeam = GetPlayerTeam(i);
					m_nBonusScore_deal[nTeam] += 100;
					strBonusPoints.Format("%s100%s\tHonors bonus for holding 4 trump honors",
											((nTeam == NORTH_SOUTH)? "" : "\t"),
											((nTeam == NORTH_SOUTH)? "\t" : ""));
					m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
					break;
				}
			}
		}
		else
		{
			// check if a player had all four Aces
			for(int i=0;i<4;i++)
			{
				int numAces = 0;
				CCardHoldings& origHand = m_pPlayer_deal[i]->GetHand().GetInitialHand();
				for(int j=CLUBS;j<=SPADES;j++)
					if (origHand.HasCard(MAKEDECKVALUE(j, ACE)))
						numAces++;
				//
				if (numAces == 4)
				{
					int nTeam = GetPlayerTeam(i);
					m_nBonusScore_deal[nTeam] += 150;
					strBonusPoints.Format("%s150%s\tHonors bonus for holding all 4 Aces in NT contract",
											((nTeam == NORTH_SOUTH)? "" : "\t"),
											((nTeam == NORTH_SOUTH)? "\t" : ""));
					m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
					break;
				}
			}
		}
	}

	// now see if a game has been won
	if (m_nGameScore_deal[m_nCurrGame_deal][m_nContractTeam_deal] >= 100)
	{
		// if so, update and draw a line underneath
		m_numGamesWon_deal[m_nContractTeam_deal]++;
		m_strArrayTrickPointsRecord_deal.Add("----------------------------------------------------------------------------------------------------------------");

		// update other game variables here
		m_nCurrGame_deal++;
		m_bVulnerable_deal[m_nContractTeam_deal] = TRUE;
		if (m_nVulnerableTeam_deal == NONE)
			m_nVulnerableTeam_deal = (Team) m_nContractTeam_deal;
		else 
			m_nVulnerableTeam_deal = (Team) BOTH;
		
		// then see if the rubber has been won
		if (m_numGamesWon_deal[m_nContractTeam_deal] == 2)
		{
			// see if the team won 2-1 or 2-0
			int numBonusPoints;
			if (m_numGamesWon_deal[m_nDefendingTeam_deal] == 0)
				numBonusPoints = 700;
			else
				numBonusPoints = 500;
			//
			m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
			strBonusPoints.Format("%s%4d%s\tRubber bonus",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numBonusPoints, 
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""));

			// update game record
			m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);

			// and update total score
			m_nTotalScore_deal[NORTH_SOUTH] = m_nGameScore_deal[0][NORTH_SOUTH] + 
										 m_nGameScore_deal[1][NORTH_SOUTH] + 
										 m_nGameScore_deal[2][NORTH_SOUTH] + 
										 m_nBonusScore_deal[NORTH_SOUTH];
			m_nTotalScore_deal[EAST_WEST] = m_nGameScore_deal[0][EAST_WEST] + 
									   m_nGameScore_deal[1][EAST_WEST] + 
									   m_nGameScore_deal[2][EAST_WEST] + 
									   m_nBonusScore_deal[EAST_WEST];
			m_strTotalPointsRecord_deal.Format("%4d\t%4d\tFinal Score",m_nTotalScore_deal[NORTH_SOUTH],m_nTotalScore_deal[EAST_WEST]);

			// and rubber is over!
			theApp.SetValue(tbRubberInProgress, FALSE);	// rubber is over
			//
			if (m_nTotalScore_deal[NORTH_SOUTH] > m_nTotalScore_deal[EAST_WEST])
				pMAINFRAME->SetStatusMessage("Rubber is over -- North/South won the match.");
			else if (m_nTotalScore_deal[EAST_WEST] > m_nTotalScore_deal[NORTH_SOUTH])
				pMAINFRAME->SetStatusMessage("Rubber is over -- East/West won the match.");
			else
				pMAINFRAME->SetStatusMessage("Rubber is over -- the match was a tie.");
		}
	}

}



//
// DisplayScore() 
//
void CEasyBDoc::DisplayScore()
{
	// set the info
	CScoreDialog scoreDialog;
	scoreDialog.SetBonusPoints(m_strArrayBonusPointsRecord_deal);
	scoreDialog.SetTrickPoints(m_strArrayTrickPointsRecord_deal);
	scoreDialog.SetTotalPoints(m_strTotalPointsRecord_deal);

	// temporarily mark the game as inactive
	theApp.SetValue(tbGameInProgress, FALSE);

	// show the score
	scoreDialog.DoModal();

	// temporarily mark the game as inactive
	theApp.SetValue(tbGameInProgress, TRUE);

	// and proceed to the next hand, if appropriate
	if (theApp.IsRubberInProgress())
	{
		OnDealNewHand();
	}
	else
	{
		ClearAllInfo();
		pMAINFRAME->ClearAllIndicators();
		pMAINFRAME->SetStatusMessage("Rubber is over.  Press F2 or Shift+F2 for a new game.");
	}
}



//
// UpdateDuplicateScore() 
//
// - this is purely preliminary code
//
void CEasyBDoc::UpdateDuplicateScore()
{
	CString strScore;

	// calculate the duplicate score
	int numTricksRequired = 6 + m_nContractLevel_deal;
	int numTricksMade = m_numTricksWon_deal[m_nContractTeam_deal];
	int numTricksShort = numTricksRequired - numTricksMade;
	if (numTricksShort < 0)
		numTricksShort = 0;
	int numRequiredTricks = m_nContractLevel_deal + 6;
	int numTrickPoints = 0;
	int numBonusPoints = 0;
	int numOvertrickPoints = 0;
	BOOL bVulnerable = m_bVulnerable_deal[m_nContractTeam_deal];
	BOOL bDoubled = m_bDoubled_deal;
	BOOL bRedoubled = m_bRedoubled_deal;
	CString strTrickPoints, strBonusPoints;

	//
	// clear scores
	//
	m_nGameScore_deal[m_nCurrGame_deal][m_nContractTeam_deal] = 0;
	m_nBonusScore_deal[m_nContractTeam_deal] = 0;
	m_nBonusScore_deal[m_nDefendingTeam_deal] = 0;

	// first check trick points & overtrick points
	if (numTricksMade >= numRequiredTricks)
	{
		int numOvertricks = numTricksMade - numRequiredTricks;
		if (numOvertricks < 0)
			numOvertricks = 0;
		switch (m_nContractSuit_deal)
		{
			case CLUBS:  case DIAMONDS:
				numTrickPoints = m_nContractLevel_deal * 20;
				numOvertrickPoints = numOvertricks * 20;
				break;

			case HEARTS: case SPADES:
				numTrickPoints = m_nContractLevel_deal * 30;
				numOvertrickPoints = numOvertricks * 30;
				break;
				
			case NOTRUMP:
				numTrickPoints = 40 + (m_nContractLevel_deal-1) * 30;
				numOvertrickPoints = numOvertricks * 30;
				break;
		}

		// adjust for doubling/redoubling
		if (bDoubled)
			numTrickPoints *= 2;
		else if (bRedoubled)
			numTrickPoints *= 4;

		// record trick points
		m_nGameScore_deal[m_nCurrGame_deal][m_nContractTeam_deal] = numTrickPoints;
		strTrickPoints.Format("%s%4d%s\t%s%s made",
								((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
								numTrickPoints,
								((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""),
								ContractToFullString(m_nContract_deal, m_nContractModifier_deal),
								(bDoubled? " doubled" : bRedoubled? " redoubled" : ""));
		// and save
//		m_strArrayTrickPointsRecord.Add(strTrickPoints);

		// record doubled contract bonus, if appropriate
		if (bDoubled)
		{
			// record doubled contract bonus of 50 points
			numBonusPoints = 50;
			m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
			strBonusPoints.Format("%s%4d%s\tDoubled contract",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numBonusPoints,
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""));
			// and save
//			m_strArrayBonusPointsRecord.Add(strBonusPoints);
		}
		else if (bRedoubled)
		{
			// record re-doubled contract bonus of 100 points
			numBonusPoints = 100;
			m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
			strBonusPoints.Format("%s%4d%s\tRedoubled contract",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numBonusPoints,
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""));
			// and save
//			m_strArrayBonusPointsRecord.Add(strBonusPoints);
		}

		// record overtricks bonus, if any
		if (numOvertricks > 0)
		{
			// adjust overtrick points if doubled/redoubled
			if (bDoubled)
			{
				if (!bVulnerable)
					numOvertrickPoints = numOvertricks * 100;	// 100 pts/overtrick
				else
					numOvertrickPoints = numOvertricks * 200;
			}
			else if (bRedoubled)
			{
				if (!bVulnerable)
					numOvertrickPoints = numOvertricks * 200;
				else
					numOvertrickPoints = numOvertricks * 400;
			}
			m_nBonusScore_deal[m_nContractTeam_deal] += numOvertrickPoints;
			strBonusPoints.Format("%s%4d%s\t%1d overtrick%s%s%s",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numOvertrickPoints, 
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""),
									numOvertricks,
									((numOvertricks > 1)? "s" : ""),
									(bVulnerable? ", vulnerable": ""),
									(bDoubled? ", doubled" : bRedoubled? ", redoubled" : ""));
			// and save
//			m_strArrayBonusPointsRecord.Add(strBonusPoints);
		}

		// check for a slam bonus
		if (m_nContractLevel_deal >= 6)
		{
			if (m_nContractLevel_deal == 6)
			{
				if (!bVulnerable)
					numBonusPoints = 500;
				else
					numBonusPoints = 750;
			}
			else
			{
				if (!bVulnerable)
					numBonusPoints = 1000;
				else
					numBonusPoints = 1500;
			}
			m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
			strBonusPoints.Format("%s%4d%s\t%s slam contract%s",
									((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
									numBonusPoints,
									((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""),
									((m_nContractLevel_deal == 6)? "Small"  : "Grand"),
									(bVulnerable? ", vulnerable" : ""));
//			// and save
			m_strArrayBonusPointsRecord_deal.Add(strBonusPoints);
		}

	}
	else
	{
		// ouch -- check undertrick points
		int numUndertricks = numRequiredTricks - numTricksMade;
		int numUndertrickPoints = 0;
		int nFirst = 1;								// first undertrick
		int nSecondAndThird = numUndertricks - 1;	// 2nd & third undertricks
		if (nSecondAndThird < 0)
			nSecondAndThird = 0;
		if (nSecondAndThird > 2)
			nSecondAndThird = 2;
		int nAdditional = numUndertricks - 3;		// undertricks beyond 3
		if (nAdditional < 0)
			nAdditional = 0;
		int nBeyondOne = numUndertricks - 1;
		if (nBeyondOne < 0)
			nBeyondOne = 0;
		//
		if (bDoubled)
		{
			// doubled contract
			if (!bVulnerable)
				numUndertrickPoints = (nFirst * 100) + (nSecondAndThird * 200) + (nAdditional * 300);
			else
				numUndertrickPoints = (nFirst * 200) + (nBeyondOne * 300);
		}
		else if (bRedoubled)
		{
			// redoubled contract
			if (!bVulnerable)
				numUndertrickPoints = (nFirst * 200) + (nSecondAndThird * 400) + (nAdditional * 600);
			else
				numUndertrickPoints = (nFirst * 400) + (nBeyondOne * 600);
		}
		else
		{
			// neither doubled or redoubled
			if (!bVulnerable)
				numUndertrickPoints = numUndertricks * 50;
			else
				numUndertrickPoints = numUndertricks * 100;
		}
		//
		numBonusPoints += numUndertrickPoints;
		m_nBonusScore_deal[m_nDefendingTeam_deal] = numBonusPoints;
		strBonusPoints.Format("%s%4d%s\tBonus for defeating %scontract by %d trick%s",
								((m_nDefendingTeam_deal == NORTH_SOUTH)? "" : "\t"),
								numUndertrickPoints, 
								((m_nDefendingTeam_deal == NORTH_SOUTH)? "\t" : ""),
								(bVulnerable? "vulnerable ": ""),
								numUndertricks,
								((numUndertricks > 1)? "s" : ""));
		// and save
//		m_strArrayBonusPointsRecord.Add(strBonusPoints);
	}


	// now see if a game has been won
	if (numTrickPoints >= 100)
	{
		// if so, add game bonus
		if (bVulnerable)
			numBonusPoints = 500;
		else
			numBonusPoints = 300;
		m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
		strBonusPoints.Format("%s%4d%s\t%s game made",
							((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
							numBonusPoints,
							((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""),
							(bVulnerable? ", vulnerable" : ""));
		// and save
//		m_strArrayBonusPointsRecord.Add(strBonusPoints);
	}
	else
	{
		// add part score bonus
		numBonusPoints += 50;
		m_nBonusScore_deal[m_nContractTeam_deal] += numBonusPoints;
		strBonusPoints.Format("%s50%s\tpart score bonus",
							((m_nContractTeam_deal == NORTH_SOUTH)? "" : "\t"),
							((m_nContractTeam_deal == NORTH_SOUTH)? "\t" : ""));
		// and save
//		m_strArrayBonusPointsRecord.Add(strBonusPoints);
	}
		
	// add up the total score
	m_nTotalScore_deal[NORTH_SOUTH] = m_nGameScore_deal[0][NORTH_SOUTH] + 
								 m_nGameScore_deal[1][NORTH_SOUTH] + 
								 m_nGameScore_deal[2][NORTH_SOUTH] + 
								 m_nBonusScore_deal[NORTH_SOUTH];
	m_nTotalScore_deal[EAST_WEST] = m_nGameScore_deal[0][EAST_WEST] + 
							   m_nGameScore_deal[1][EAST_WEST] + 
							   m_nGameScore_deal[2][EAST_WEST] + 
							   m_nBonusScore_deal[EAST_WEST];
	m_strTotalPointsRecord_deal.Format("%4d\t%4d\tFinal Score",m_nTotalScore_deal[NORTH_SOUTH],m_nTotalScore_deal[EAST_WEST]);
	
}




//
// DisplayDuplicateScore() 
//
// - this is purely preliminary code
//
void CEasyBDoc::DisplayDuplicateScore()
{
	//	
	// show the info
	//
	CScoreDialog scoreDialog;
	scoreDialog.SetBonusPoints(m_strArrayBonusPointsRecord_deal);
	scoreDialog.SetTrickPoints(m_strArrayTrickPointsRecord_deal);
	scoreDialog.SetTotalPoints(m_strTotalPointsRecord_deal);

	// temporarily mark the game as inactive
	theApp.SetValue(tbGameInProgress, FALSE);

	// show the score
	scoreDialog.DoModal();

	// temporarily mark the game as inactive
	theApp.SetValue(tbGameInProgress, TRUE);

	// and proceed to the next hand, if appropriate
	if (theApp.IsRubberInProgress())
	{
		OnDealNewHand();
	}
	else
	{
		ClearAllInfo();
		pMAINFRAME->ClearAllIndicators();
		pMAINFRAME->SetStatusMessage("Rubber is over.  Press F2 or Shift+F2 for a new game.");
	}
}





//
void CEasyBDoc::UpdatePlayHistory() 
{
	//
	if (m_bSuppressPlayHistoryUpdate)
		return;

	//
	CString strPlays, strTemp, strPlaysPlain, strTempPlain;
	//
	int i,j;
	int nPos = m_nGameLead_deal;
	if (nPos == NONE) 
	{
		// not initialized yet
		pMAINFRAME->SetPlayHistory("");
		return;
	}

	// check resolution
	BOOL bSmallCards = theApp.GetValue(tbLowResOption);

	// check mode
	BOOL bUseSymbols = theApp.GetValue(tbUseSuitSymbols);

	//
	strPlays = "Trk ";
	for(i=0;i<4;i++) 
	{
		// use suit letters
		if (bSmallCards)
			strTemp.Format("%-4s",PositionToShortString(nPos));
		else
			strTemp.Format("%-5s",PositionToString(nPos));
		strPlays += strTemp;
		strPlays += " ";
		nPos = GetNextPlayer(nPos);
	}
	if (bSmallCards)
		strPlays += "\r\n--- ---- ---- ---- ----\r\n";
	else
		strPlays += "\r\n--- ----- ----- ----- -----\r\n";

	// dup the string so far
	strPlaysPlain = strPlays;

	CString strSpace = "    ";

	// iterate over tricks
	int numRounds;
	// see if the game is finished -- if not, display n+1 tricks
	if (m_numTricksPlayed_deal < 13)
		numRounds = Min(m_numActualTricksPlayed_deal + 1, 13);
	else
		numRounds = Min(m_numActualTricksPlayed_deal, 13);	// game's finished
	for(i=0;i<numRounds;i++) 
	{
		// display round #
		strTemp.Format("%2d: ",i+1);
		// bail at this point if no cards played in this round
		if ((i == m_numActualTricksPlayed_deal) && (m_numCardsPlayedInRound_deal == 0))
		{
			strPlays += strTemp + "\r\n";
			strPlaysPlain += strTemp + "\r\n";
			continue;
		}
		//
		strPlays += strTemp;
		strPlaysPlain += strTemp;
		nPos = m_nGameLead_deal;
		for(j=0;j<4;j++) 
		{
			strTemp = strTempPlain = " ";
			if (i < m_numActualTricksPlayed_deal) 
			{
				if (bUseSymbols)
				{
					// use suit symbols
					strTemp += FormString(_T("%c%c"), GetCardLetter(m_pGameTrick_deal[i][nPos]->GetFaceValue()), (unsigned char)(tSuitLetter + m_pGameTrick_deal[i][nPos]->GetSuit()));
				}
				else
				{
					// use suit letters
					strTemp += m_pGameTrick_deal[i][nPos]->GetName();
				}
				//
				strTempPlain += m_pGameTrick_deal[i][nPos]->GetName();
				//
				strTemp += bSmallCards? "  " : "   ";
				strTempPlain += bSmallCards? "  " : "   ";
			} 
			else 
			{
				if (m_pCurrTrick_deal[nPos] != NULL) 
				{
					if (bUseSymbols)
					{
						// use suit symbols
						strTemp += FormString(_T("%c%c"), GetCardLetter(m_pCurrTrick_deal[nPos]->GetFaceValue()), (unsigned char)(tSuitLetter + m_pCurrTrick_deal[nPos]->GetSuit()));
					}
					else
					{
						// use suit letters
						strTemp += m_pCurrTrick_deal[nPos]->GetName();
					}
					//
					strTempPlain += m_pCurrTrick_deal[nPos]->GetName();
					//
					strTemp += bSmallCards? "  " : "   ";
					strTempPlain += bSmallCards? "  " : "   ";
				} 
				else 
				{
					strTemp += bSmallCards? "    " : "     ";
					strTempPlain += bSmallCards? "    " : "     ";
				}
			}
			// if cards have been played, identify round lead
			if ( ((m_numActualTricksPlayed_deal > 0) || (m_numCardsPlayedInRound_deal > 0)) &&
							(nPos == m_nTrickLead_deal[i])) 
			{
				strTemp.SetAt(0,'(');
				strTemp.SetAt(3,')');
				strTempPlain.SetAt(0,'(');
				strTempPlain.SetAt(3,')');
			}
			// also identify round winners
			if ( ((i < m_numTricksPlayed_deal) && (nPos == m_nTrickWinner_deal[i])) ||
				 ((i == m_numTricksPlayed_deal) && (nPos == m_nRoundWinner_deal)) ) 
			{
				strTemp.SetAt(0,'*');
				strTemp.SetAt(3,'*');
				strTempPlain.SetAt(0,'*');
				strTempPlain.SetAt(3,'*');
			}
			strPlays += strTemp;
			strPlaysPlain += strTempPlain;
			nPos = GetNextPlayer(nPos);
		}
		if (i < m_numTricksPlayed_deal)
		{
			strPlays += "\r\n";
			strPlaysPlain += "\r\n";
		}
	}

	// mark any skipped tricks
	for(;i<m_numTricksPlayed_deal;i++) 
	{
		strPlays += FormString("%2d: Skipped\r\n",i+1);
		strPlaysPlain += FormString("%2d: Skipped\r\n",i+1);
	}

	//
	pMAINFRAME->SetPlayHistory((LPCTSTR)strPlays, bUseSymbols);
	pMAINFRAME->SetPlainPlayHistory((LPCTSTR)strPlaysPlain);
}






/////////////////////////////////////////////////////////////////////////////
//
// CEasyBDoc commands
//
/////////////////////////////////////////////////////////////////////////////


//
// DealCards() 
//
// called only from th DealSpecial() routine
// shuffles the deck and assigns the cards to the players
//
int CEasyBDoc::DealCards() 
{
	int newDealNumber = theApp.GetDeck()->Shuffle(0, true);

	// 
	InitializeVulnerability();

	//
	int i,j,nCount=0;
	for(i=0;i<4;i++)
		m_pPlayer_deal[i]->ClearHand();
	//
	for(i=0;i<13;i++) 
	{
		for(j=0;j<4;j++)
		{
			CCard* pCard = (*theApp.GetDeck().get())[nCount++];
			m_pPlayer_deal[j]->AddCardToHand(pCard);
		}
	}

	//
	for(i=0;i<4;i++) 
		PLAYER(i).InitializeHand();

	//
	return newDealNumber;
}




//
// DealHands() 
//
// does the same thing as DealCards(), plus a little bit more
//
void CEasyBDoc::DealHands(BOOL bUseDealNumber, int nDealNumber) 
{
	// init vulnerability for random hands
	if (!bUseDealNumber)
		InitializeVulnerability();

	// temp
	pMAINFRAME->SetAllIndicators();

	//
	m_nDealNumber_deal = theApp.GetDeck()->Shuffle(bUseDealNumber? nDealNumber : 0);
	m_nSpecialDealCode_deal = 0;

	// assign cards
	int i,j,nCount=0;
	for(i=0;i<4;i++)
		m_pPlayer_deal[i]->ClearHand();
	//
	for(i=0;i<13;i++) 
	{
		for(j=0;j<4;j++)
		{
			CCard* pCard = (*theApp.GetDeck().get())[nCount++];
			m_pPlayer_deal[j]->AddCardToHand(pCard);
		}
	}

	// adjust dealer if using deal number
	if (bUseDealNumber)
		m_nDealer_deal = ::GetPrevPlayer(m_nDealer_deal);
	m_nCurrPlayer_deal = m_nDealer_deal;

	//
	m_bDealNumberAvailable_deal = TRUE;

	//
	InitPlay();
}



// 
// InitializeVulnerability()
//
void CEasyBDoc::InitializeVulnerability()
{
	// if playing in practice mode with duplicate socring, randomize vulnerability
	if (!theApp.IsRubberInProgress() && theApp.IsUsingDuplicateScoring())
		m_nVulnerableTeam_deal = (Team) (GetRandomValue(3) - 1);
	//
	if ((m_nVulnerableTeam_deal == NORTH_SOUTH) || (m_nVulnerableTeam_deal == BOTH))
		m_bVulnerable_deal[NORTH_SOUTH] = TRUE;
	if ((m_nVulnerableTeam_deal == EAST_WEST) || (m_nVulnerableTeam_deal == BOTH))
		m_bVulnerable_deal[EAST_WEST] = TRUE;
}




//
// LoadGameRecord() 
//
// load info from a game (PBN, typically)
//
void CEasyBDoc::LoadGameRecord(const CGameRecord& game) 
{
	// init
	ClearMatchInfo();
	ClearBiddingInfo();
	ClearPlayInfo();
	ClearHands();

	// clear players' states
	for(int i=0;i<4;i++)
	{
		m_pPlayer_deal[i]->ClearHand();
		m_pPlayer_deal[i]->ClearBiddingInfo();
		m_pPlayer_deal[i]->ClearAnalysis();
	}

	// and assign
	try
	{
		// try the assign
		CString strDeal = game.GetTagValue("DEAL");
		AssignCardsPBN(strDeal);
	}
	catch(CFileException* exception)
	{
		AfxMessageBox("Error in the game deal");
		delete exception;
	}

	// init
	InitNewGame();
	InitNewHand();

	// set game information
	m_bHandsDealt = TRUE;
	m_nDealer_deal = game.m_nDealer;
	m_nCurrPlayer_deal = m_nDealer_deal;
	if (ISBID(game.m_nContract))
	{
		m_nContract_deal = game.m_nContract;
		m_nContractModifier_deal = game.m_nContractModifier;
		if (m_nContractModifier_deal == 1)
			m_bDoubled_deal = TRUE;
		else if (m_nContractModifier_deal == 2)
			m_bRedoubled_deal = TRUE;
		m_nContractSuit_deal = BID_SUIT(m_nContract_deal);
		m_nContractLevel_deal = BID_LEVEL(m_nContract_deal);
		m_nTrumpSuit_deal = m_nContractSuit_deal;
		m_nContractTeam_deal = (game.m_nDeclarer == SOUTH || game.m_nDeclarer == NORTH)? NORTH_SOUTH : EAST_WEST;
		m_nDefendingTeam_deal = (m_nContractTeam_deal == NORTH_SOUTH)? EAST_WEST : NORTH_SOUTH;
		m_nDeclarer_deal = game.m_nDeclarer;
		m_nGameLead_deal = GetNextPlayer(m_nDeclarer_deal);
		m_nDummy_deal = GetNextPlayer(m_nGameLead_deal);
		m_pPlayer_deal[m_nDummy_deal]->SetDummyFlag(TRUE);
		m_pPlayer_deal[m_nDeclarer_deal]->SetDeclarerFlag(TRUE);
		m_nRoundLead_deal = m_nGameLead_deal;
		m_nCurrPlayer_deal = m_nRoundLead_deal;
		m_nTrickLead_deal[0] = m_nRoundLead_deal;
		//
		if ((m_nDeclarer_deal == SOUTH) || (m_nDeclarer_deal == NORTH))
		{
			m_nContractTeam_deal = NORTH_SOUTH;
			m_nDefendingTeam_deal = EAST_WEST;
		}
		else
		{
			m_nContractTeam_deal = EAST_WEST;
			m_nDefendingTeam_deal = NORTH_SOUTH;
		}
	}

	//
	m_nVulnerableTeam_deal = (Team) game.m_nVulnerability;
	if ((m_nVulnerableTeam_deal == NORTH_SOUTH) || (m_nVulnerableTeam_deal == BOTH))
		m_bVulnerable_deal[0] = TRUE;
	else if ((m_nVulnerableTeam_deal == EAST_WEST) || (m_nVulnerableTeam_deal == BOTH))
		m_bVulnerable_deal[1] = TRUE;
	//
	m_numBidsMade_deal = game.GetNumBids();
	for(int i=0;i<m_numBidsMade_deal;i++)
		m_nBiddingHistory_deal[i] = game.m_nBids[i];

	// finally, have the players init their hands
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->InitializeRestoredHand();

	// then set cards face up if desired
	if (theApp.GetValue(tbExposePBNGameCards) && !theApp.AreCardsFaceUp())
		pMAINFRAME->SendMessage(WM_COMMAND, ID_EXPOSE_ALL_CARDS);

//	for(i=0;i<4;i++)
//		m_pPlayer[i]->ExposeCards(TRUE, FALSE);

	// done
}



//
// InitGameReview() 
//
void CEasyBDoc::InitGameReview()
{
	m_bReviewingGame = TRUE;
}




//
// RotatePartialHands() 
//
void CEasyBDoc::RotatePartialHands(int numPositions) 
{
	// hide dummy
	if (m_bExposeDummy_deal)
		m_pPlayer_deal[m_nDummy_deal]->ExposeCards(FALSE, FALSE);

	// rotate hands clockwise as necessary
	for(int i=0;i<numPositions;i++)
	{
		// first south & west
		SwapPartialHands(SOUTH, WEST);
		// then north & south
		SwapPartialHands(NORTH, SOUTH);
		// then south & east
		SwapPartialHands(SOUTH, EAST);

		// rotate round play history
		CCard* pTemp = m_pCurrTrick_deal[SOUTH];
		m_pCurrTrick_deal[SOUTH] = m_pCurrTrick_deal[WEST];
		m_pCurrTrick_deal[WEST] = pTemp;
		//
		pTemp = m_pCurrTrick_deal[NORTH];
		m_pCurrTrick_deal[NORTH] = m_pCurrTrick_deal[SOUTH];
		m_pCurrTrick_deal[SOUTH] = pTemp;
		//
		pTemp = m_pCurrTrick_deal[SOUTH];
		m_pCurrTrick_deal[SOUTH] = m_pCurrTrick_deal[EAST];
		m_pCurrTrick_deal[EAST] = pTemp;

		// adjust the player(s) info
		m_nCurrPlayer_deal = ::GetNextPlayer(m_nCurrPlayer_deal);
		m_nRoundLead_deal = ::GetNextPlayer(m_nRoundLead_deal);
		m_nRoundWinner_deal = ::GetNextPlayer(m_nRoundWinner_deal);
		m_nRoundWinningTeam_deal = (Team) ::GetOpposingTeam(m_nRoundWinningTeam_deal);

		// adjust other stuff
		m_nDealer_deal = ::GetNextPlayer(m_nDealer_deal);
		m_nDeclarer_deal = ::GetNextPlayer(m_nDeclarer_deal);
		m_nDummy_deal = ::GetNextPlayer(m_nDummy_deal);
		m_nDoubler_deal = ::GetNextPlayer(m_nDoubler_deal);
		m_nRedoubler_deal = ::GetNextPlayer(m_nRedoubler_deal);
		m_nOpeningBidder_deal = ::GetOpposingTeam(m_nOpeningBidder_deal);
		m_nGameLead_deal = ::GetNextPlayer(m_nGameLead_deal);
		m_nPrevDealer_deal = ::GetNextPlayer(m_nPrevDealer_deal);

		// the following is not the most efficient, but...
		m_nContractTeam_deal = ::GetOpposingTeam(m_nContractTeam_deal);
		m_nDefendingTeam_deal = ::GetOpposingTeam(m_nDefendingTeam_deal);
		if (ISTEAM(m_nVulnerableTeam_deal))
			m_nVulnerableTeam_deal = (Team) ::GetOpposingTeam(m_nDefendingTeam_deal);
		m_nLastValidBidTeam_deal = (Team) ::GetOpposingTeam(m_nLastValidBidTeam_deal);

		// and team lead info
		for(int j=0;j<5;j++)
		{
			int nTemp = m_nPartnershipLead_deal[0][j];
			m_nPartnershipLead_deal[0][j] = m_nPartnershipLead_deal[1][j];
			m_nPartnershipLead_deal[1][j] = nTemp;
		}
	}

	// expose dummy's cards again if necessary
	if (m_numCardsPlayedInGame_deal > 0)
		m_pPlayer_deal[m_nDummy_deal]->ExposeCards(TRUE, FALSE);

	// adjust bidding history
	int numRounds = m_numBidsMade_deal / 4;
	if ((m_numBidsMade_deal % 4) > 0)
		numRounds++;
	for(int i=0;i<numRounds;i++)
	{
		for(int j=0;j<numPositions;j++)
		{
			// rotate bid history
			int nTemp = m_nBidsByPlayer_deal[SOUTH][i];
			m_nBidsByPlayer_deal[SOUTH][i] = m_nBidsByPlayer_deal[WEST][i];
			m_nBidsByPlayer_deal[WEST][i] = nTemp;
			//
			nTemp = m_nBidsByPlayer_deal[NORTH][i];
			m_nBidsByPlayer_deal[NORTH][i] = m_nBidsByPlayer_deal[SOUTH][i];
			m_nBidsByPlayer_deal[SOUTH][i] = nTemp;
			//
			nTemp = m_nBidsByPlayer_deal[SOUTH][i];
			m_nBidsByPlayer_deal[SOUTH][i] = m_nBidsByPlayer_deal[EAST][i];
			m_nBidsByPlayer_deal[EAST][i] = nTemp;
		}
	}

	// and redisplay
	UpdateBiddingHistory();

	// adjust play history
	for(int i=0;i<=m_numTricksPlayed_deal && i<13;i++)
	{
		// rotate play record
		for(int j=0;j<numPositions;j++)
		{
			CCard* pTemp = m_pGameTrick_deal[i][SOUTH];
			m_pGameTrick_deal[i][SOUTH] = m_pGameTrick_deal[i][WEST];
			m_pGameTrick_deal[i][WEST] = pTemp;
			//
			pTemp = m_pGameTrick_deal[i][NORTH];
			m_pGameTrick_deal[i][NORTH] = m_pGameTrick_deal[i][SOUTH];
			m_pGameTrick_deal[i][SOUTH] = pTemp;
			//
			pTemp = m_pGameTrick_deal[i][SOUTH];
			m_pGameTrick_deal[i][SOUTH] = m_pGameTrick_deal[i][EAST];
			m_pGameTrick_deal[i][EAST] = pTemp;

			// adjust trick lead and winner for each round
			m_nTrickLead_deal[i] = ::GetNextPlayer(m_nTrickLead_deal[i]);
			m_nTrickWinner_deal[i] = ::GetNextPlayer(m_nTrickWinner_deal[i]);
		}
	}
	UpdatePlayHistory();

	// update other status
	pMAINFRAME->SetAllIndicators();

	//
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->InitializeSwappedHand();
}



//
// SwapPartialHands() 
//
void CEasyBDoc::SwapPartialHands(int nPos1, int nPos2) 
{
	ASSERT(ISPLAYER(nPos1) && ISPLAYER(nPos2));
	CPlayer* pPlayer1 = m_pPlayer_deal[nPos1];
	CPlayer* pPlayer2 = m_pPlayer_deal[nPos2];

	// first remove player 1's cards
  CCardList tempCards{appImpl};
	int numCards1 = pPlayer1->GetNumCards();
	for(int i=0;i<numCards1;i++) 
		tempCards << pPlayer1->RemoveCardFromHand(0);

	// then take player 2's cards and give them to player 1
	int numCards2 = pPlayer2->GetNumCards();
	for(int i=0;i<numCards2;i++) 
		pPlayer1->AddCardToHand(pPlayer2->RemoveCardFromHand(0));

	// then place the saved cards from player 1's hand into player 2's hand
	for(int i=0;i<numCards1;i++) 
		pPlayer2->AddCardToHand(tempCards[i]);

	//
	// now swap initial cards
	//
  CCardList tempInitialCards{appImpl};
	for(int i=0;i<13;i++) 
		tempInitialCards << pPlayer1->RemoveCardFromInitialHand(0);

	// take player 2's initial cards and give them to player 1
	for(int i=0;i<13;i++) 
		pPlayer1->AddCardToInitialHand(pPlayer2->RemoveCardFromInitialHand(0));

	// then place the saved cards from player 1's initial hand into player 2's initial hand
	for(int i=0;i<13;i++) 
		pPlayer2->AddCardToInitialHand(tempInitialCards[i]);
}



//
// PlayGameRecord() 
//
// play the recorded game (PBN, typically)
//
void CEasyBDoc::PlayGameRecord(int nGameIndex) 
{
	//
	ASSERT(nGameIndex < m_gameRecords_deal.GetSize());

	// ask for the position to assume
	CSelectHandDialog handDialog;
	handDialog.m_strTitle = "Select Hand to Play";
	handDialog.m_nMode = CSelectHandDialog::SH_MODE_HAND;
	const CGameRecord& game = *(m_gameRecords_deal.GetAt(nGameIndex));

	// init declarer if available,else play south
	if (ISPLAYER(game.m_nDeclarer))
		handDialog.m_nPosition = game.m_nDeclarer;
	else
		handDialog.m_nPosition = SOUTH;
	if (!handDialog.DoModal())
		return;

	// init data
	m_nDeclarer_deal = game.m_nDeclarer;
	m_nDealer_deal = game.m_nDealer;

	//
	if (ISBID(game.m_nContract))
	{
		// reset suit sequence
		theApp.InitDummySuitSequence(BID_SUIT(game.m_nContract), GetPartner(m_nDeclarer_deal));
	}
	
	// get count of positions to rotate (clockwise)
	int numPositions = 4 - handDialog.m_nPosition;

	// rotate the hands
	CWaitCursor wait;
	RotatePartialHands(numPositions);

	//
	// and finally begin play
	//
	m_bReviewingGame = FALSE;
	theApp.SetValue(tbGameInProgress, TRUE);
	//
	pVIEW->EndGameReview();
	pVIEW->EnableRefresh(TRUE);
//	if (numPositions > 0)
		ResetDisplay();

	//
	// new code
	//
	if (m_numTricksPlayed_deal < 13)
	{
		// then pick up where we left off
		pVIEW->PostMessage(WM_COMMAND, WMS_RESUME_GAME, 0);
	}
	else
	{
		// shouldn't even get here!
		AfxMessageBox(_T("The hand is over."));
	}


/*
 * this old code is appropriate if restarting the game
 *
   //
	pMAINFRAME->SetStatusMessage("Initializing hands...");

    // first restore initial hands
	for(int i=0;i<4;i++)
		m_pPlayer[i]->RestoreInitialHand();

	// clear dummy flag
	if (ISPLAYER(m_nDummy))
		m_pPlayer[m_nDummy]->SetDummyFlag(FALSE);

	// get count of positions to rotate
	int numPositions = handDialog.m_nPosition;

	// prep
	m_nDeclarer = game.m_nDeclarer;
	m_nDealer = game.m_nDealer;

	// and rotate everything (counter-clockwise) as necessary
	for(i=0;i<numPositions;i++)
	{
		RotatePlayersHands(1, FALSE, FALSE);
		//
		if (ISPLAYER(m_nDoubler))
			m_nDoubler = ::GetPrevPlayer(m_nDoubler);
		if (ISPLAYER(m_nRedoubler))
			m_nRedoubler = ::GetPrevPlayer(m_nRedoubler);
		//
		if (ISPLAYER(m_nDeclarer))
			m_nDeclarer = ::GetPrevPlayer(m_nDeclarer);
		if (ISPLAYER(m_nDealer))
			m_nDealer = ::GetPrevPlayer(m_nDealer);
	}
	// set current bidder
	m_nCurrPlayer = m_nDealer;

	// reset teams as well
	if (ISBID(m_nContract) && (numPositions == 1) || (numPositions == 3))
	{
		if (m_nContractTeam == NORTH_SOUTH)
		{
			m_nContractTeam = EAST_WEST;
			m_nDefendingTeam = NORTH_SOUTH;
		}
		else
		{
			m_nContractTeam = NORTH_SOUTH;
			m_nDefendingTeam = EAST_WEST;
		}
		//
		if (m_nVulnerableTeam == NORTH_SOUTH)
			m_nVulnerableTeam = EAST_WEST;
		else
			m_nVulnerableTeam = NORTH_SOUTH;

	}

	if (ISBID(m_nContract))
	{
		// reset other position info
		m_nRoundLead = ::GetNextPlayer(m_nDeclarer);
		m_nCurrPlayer = m_nRoundLead;
		m_nGameLead = m_nRoundLead;

		// set new dummy
		m_nDummy = GetPartner(m_nDeclarer);
		m_pPlayer[m_nDummy]->SetDummyFlag(TRUE);
		m_pPlayer[m_nDeclarer]->SetDeclarerFlag(TRUE);

		//
		theApp.SetValue(tbGameInProgress, TRUE);
	}

	//
	m_bReviewingGame = FALSE;
	m_bExposeDummy = FALSE;
//	theApp.SetValue(tbShowCardsFaceUp, FALSE);

	// reset cards' face up status
	m_pPlayer[WEST]->ExposeCards(FALSE, FALSE);
	m_pPlayer[NORTH]->ExposeCards(FALSE, FALSE);
	m_pPlayer[EAST]->ExposeCards(FALSE, FALSE);
	m_pPlayer[SOUTH]->ExposeCards(TRUE, FALSE);

	// and start bidding or play
	if (ISBID(m_nContract))
	{
		// reset hand & play info
		ClearPlayInfo();
		for(i=0;i<4;i++)
			m_pPlayer[i]->InitializeRestoredHand();
		// and start play
		pVIEW->InitNewRound();
		pVIEW->Notify(WM_COMMAND, WMS_FILE_LOADED, 0);
	}
	else
	{
		// reset suits
		pVIEW->ResetSuitOffsets();
		// and jump into bidding
		InitPlay(FALSE, TRUE);	// restarting saved game
	}

	// done
	pVIEW->EnableRefresh(TRUE);
//	ResetDisplay();
	
	//
//	OnRestartCurrentHand();
//	InitPlay(TRUE);
 *
 *
 */
}



//
void CEasyBDoc::OnUpdateDealNewHand(CCmdUI* pCmdUI) 
{
	// we can always deal a new hand, with a few exceptions
	// check with the view to see what mode we're in 
	if (pVIEW->CanDealNewHand())
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnDealNewHand() 
{
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
void CEasyBDoc::PrepForNewDeal()
{
	// cancel review mode
	if (m_bReviewingGame)
		pVIEW->EndGameReview();
	m_bReviewingGame = FALSE;
	m_bGameReviewAvailable = FALSE;

	// turn off game auto-play
	if ((theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO) || (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO_EXPRESS))
	{
		theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
		m_bExpressPlayMode = FALSE;
		m_bAutoReplayMode = FALSE;
	}

	// init a new document ONLY if a rubber is not in progress
	// else it's still the same "Document"
	if (!theApp.IsRubberInProgress())
		OnNewDocument();	

	// and update status display
	pMAINFRAME->UpdateStatusWindow();
}


//
void CEasyBDoc::PrepForCardLayout()
{
	// if laying out cards, reset everything
	DeleteContents();
	PrepForNewDeal();

	// and init
	InitNewHand();
}



//
void CEasyBDoc::OnUpdateDealNumberedHand(CCmdUI* pCmdUI) 
{
	if (pVIEW->CanDealNewHand())
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}


//
void CEasyBDoc::OnDealNumberedHand() 
{
	// prep
	PrepForNewDeal();

	// get the deal number
	CDealNumberDialog dealNumDlg;
	if (!dealNumDlg.DoModal())
		return;

	// set vulnerability & dealer
	m_nDealer_deal = dealNumDlg.m_nDealer;
	m_nCurrPlayer_deal = m_nDealer_deal;
	m_nVulnerableTeam_deal = (Team)dealNumDlg.m_nVulnerability;
	if ((m_nVulnerableTeam_deal == NORTH_SOUTH) || (m_nVulnerableTeam_deal == BOTH))
		m_bVulnerable_deal[NORTH_SOUTH] = TRUE;
	if ((m_nVulnerableTeam_deal == EAST_WEST) || (m_nVulnerableTeam_deal == BOTH))
		m_bVulnerable_deal[EAST_WEST] = TRUE;

	// and call the appropriate function to deal a new hand
	m_nSpecialDealCode_deal = dealNumDlg.m_nSpecialDealCode;
	if (m_nSpecialDealCode_deal == 0)
		DealHands(TRUE, dealNumDlg.m_nDealNumber);
	else
		DealSpecial(dealNumDlg.m_nDealNumber, m_nSpecialDealCode_deal);

	// if using duplicate socring, update vulnerability display
	if (theApp.IsUsingDuplicateScoring())
		pMAINFRAME->DisplayVulnerable();
}


//
void CEasyBDoc::OnUpdateDealSpecial(CCmdUI* pCmdUI) 
{
	// check with the view to see what mode we're in 
	if (pVIEW->CanDealNewHand())
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnDealGameHand() 
{
//	CMessageDisplay("Dealing game...");
	DealSpecial(1,0,0);
}

//
void CEasyBDoc::OnDealMinorGame() 
{
	DealSpecial(1,1,0);
}

//
void CEasyBDoc::OnDealMajorGame() 
{
	DealSpecial(1,2,0);
}

//
void CEasyBDoc::OnDealNotrumpGame() 
{
	DealSpecial(1,3,0);
}

//
void CEasyBDoc::OnDealGameHandEastWest() 
{
	DealSpecial(1,0,0,EAST_WEST);
}

//
void CEasyBDoc::OnDealMinorGameEastWest() 
{
	DealSpecial(1,1,0,EAST_WEST);
}

//
void CEasyBDoc::OnDealMajorGameEastWest() 
{
	DealSpecial(1,2,0,EAST_WEST);
}

//
void CEasyBDoc::OnDealNotrumpGameEastWest() 
{
	DealSpecial(1,3,0,EAST_WEST);
}


//
void CEasyBDoc::OnDealSlam() 
{
	DealSpecial(2,0,0);
}

//
void CEasyBDoc::OnDealSmallSlam() 
{
	DealSpecial(2,0,1);
}

//
void CEasyBDoc::OnDealGrandSlam() 
{
	DealSpecial(2,0,2);
}

//
void CEasyBDoc::OnDealSlamEastWest() 
{
	DealSpecial(2,0,0,EAST_WEST);
}

void CEasyBDoc::OnDealSmallSlamEastWest() 
{
	DealSpecial(2,0,1,EAST_WEST);
}

void CEasyBDoc::OnDealGrandSlamEastWest() 
{
	DealSpecial(2,0,2,EAST_WEST);
}


//
void CEasyBDoc::RestartBidding()
{
	// reset dummy's info before dummy index gets cleared below in InitNewHand()
//	theApp.InitDummySuitSequence(NONE, NONE);
	if (ISPLAYER(m_nDummy_deal) && (m_nDummy_deal != SOUTH))
	{
		m_pPlayer_deal[m_nDummy_deal]->SetDummyFlag(FALSE);
		m_pPlayer_deal[m_nDummy_deal]->ExposeCards(FALSE, FALSE);
		m_nDummy_deal = NONE;
	}

	//
	InitNewHand(TRUE);	// restarting

	// reset auto play if enabled
	if ((theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO) || (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO_EXPRESS))
	{
		theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
		m_bExpressPlayMode = FALSE;
		m_bAutoReplayMode = FALSE;
	}

	// reset current player 
	m_nCurrPlayer_deal = m_nDealer_deal;

	// clear game review flag
	m_bReviewingGame = FALSE;

	// clear pending hint
	m_nLastBiddingHint_deal = NONE;

	// always expose south's hand
	m_pPlayer_deal[SOUTH]->ExposeCards(TRUE, FALSE);

	// notify each player
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RestartBidding();

	// and set global flag
	theApp.SetValue(tbBiddingInProgress, TRUE);
}



//
void CEasyBDoc::OnNewGame() 
{
	// TODO: Add your command handler code here
	// stub function for the "File/New" command
}


//
void CEasyBDoc::OnUpdateViewScore(CCmdUI* pCmdUI) 
{
	if (theApp.IsRubberInProgress())
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnViewScore() 
{
	// set the info
	CScoreDialog scoreDialog;
	scoreDialog.SetBonusPoints(m_strArrayBonusPointsRecord_deal);
	scoreDialog.SetTrickPoints(m_strArrayTrickPointsRecord_deal);
//	scoreDialog.DisableGameControls();

	// get response
	scoreDialog.DoModal();
}


//
void CEasyBDoc::OnUpdateRestartCurrentHand(CCmdUI* pCmdUI) 
{
	if (theApp.GetValue(tbGameInProgress))
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}


//
void CEasyBDoc::OnRestartCurrentHand() 
{
	// use the common function
	RestartCurrentHand(TRUE);
}



//
void CEasyBDoc::RestartCurrentHand(BOOL bUpdateView) 
{
	if (!theApp.GetValue(tbGameInProgress))
		return;

	// replay the hands
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RestartPlay();

	// clear play info
	ClearPlayInfo();

	// and reset play info
	m_nRoundLead_deal = m_nGameLead_deal;
	m_nCurrPlayer_deal = m_nRoundLead_deal;
	m_nTrickLead_deal[0] = m_nRoundLead_deal;
	m_bExposeDummy_deal = FALSE;
	m_pLastPlayHint_deal = NULL;

	// need to set the dummy again cuz it got cleared
	m_pPlayer_deal[m_nDummy_deal]->SetDummyFlag(TRUE);

	// always expose south's hand
	m_pPlayer_deal[SOUTH]->ExposeCards(TRUE, FALSE);

	// and expose north as well if north is declaring
	if (m_nDeclarer_deal == NORTH)
		m_pPlayer_deal[NORTH]->ExposeCards(TRUE, FALSE);

	// reset auto play if enabled
	if ((theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO) || (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO_EXPRESS))
	{
		theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
		m_bExpressPlayMode = FALSE;
//		m_bAutoReplayMode = FALSE;
	}

	// and update the view
	if (bUpdateView) 
		pVIEW->PostMessage(WM_COMMAND, WMS_PLAY_RESTART, 0L);
}



//
// ComputerReplay()
//
void CEasyBDoc::ComputerReplay(BOOL bFullAuto) 
{
	// this routine is similar to OnRestartCurrentHand() above, but 
	// slightly different, as the view will launch play immediately
	if (!theApp.GetValue(tbGameInProgress))
		return;

	// restart the hands, but don't update the view yet
	RestartCurrentHand(FALSE);

	// set flags before updating the view
	m_bAutoReplayMode = TRUE;
	m_bExpressPlayMode = bFullAuto;
	pMAINFRAME->HideDialog(twAutoHintDialog);
	if (!bFullAuto)
		pMAINFRAME->SetStatusMessage("Click to begin computer replay.");
	pMAINFRAME->SetModeIndicator();

	// NOW we update the view, as everything is finally ready
	if (!bFullAuto)
		pVIEW->Notify(WM_COMMAND, WMS_PLAY_RESTART, 0L);

	// and send the program into auto play mode
	pMAINFRAME->PostMessage(WM_COMMAND, bFullAuto? ID_GAME_AUTO_PLAY_EXPRESS : ID_GAME_AUTO_PLAY_ALL);
}




////////////////////////////////////////////////////////////////////////////
//
// Claim / Concede / Auto Play
//
/////////////////////////////////////////////////////////////////////////////

//
void CEasyBDoc::OnUpdatePlayClaimTricks(CCmdUI* pCmdUI) 
{
	if (theApp.GetValue(tbGameInProgress) && (m_numTricksPlayed_deal < 13))
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}

//
// OnPlayClaimTricks() 
//
void CEasyBDoc::OnPlayClaimTricks() 
{
	// player claiming tricks
	int nPos = GetHumanPlayerPos();
	// may be claiming as declarer or defender
	// if human has contract, get the declarer, be it human or computer partner
	if ((nPos == NORTH) || (nPos == SOUTH))
		nPos = GetDeclarerPosition();

	// and check the claim
	int numTricksRequired = 13 - m_numTricksPlayed_deal;
	int numClaimableTricks = m_pPlayer_deal[nPos]->GetNumClaimableTricks();
	if (numClaimableTricks < numTricksRequired)
	{
		AfxMessageBox(FormString("The claim isn't evident yet -- you have only %d clear tricks versus %d more required.\nPlease play on.", numClaimableTricks, numTricksRequired), MB_ICONINFORMATION);
		return;
	}

	// process the claim
	ClaimTricks(nPos);
}


//
void CEasyBDoc::OnUpdatePlayClaimContract(CCmdUI* pCmdUI) 
{
	if (theApp.GetValue(tbGameInProgress) && (m_numTricksPlayed_deal < 13))
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}


//
void CEasyBDoc::OnPlayClaimContract() 
{
	// player claiming enough tricks for contract -- can only do so as declarer or dummy
	int nPos = GetHumanPlayerPos();
	// may be claiming as declarer or defender
	// if human has contract, get the declarer, be it human or computer partner
	if ((nPos != NORTH) && (nPos != SOUTH))
	{
		AfxMessageBox("You cannot claim the contract when defending.");
		return;
	}

	// and check the claim
	int numTricksRequired = 6 + m_nContractLevel_deal;
	int numTricksLeft = numTricksRequired - m_numTricksWon_deal[GetPlayerTeam(nPos)];
	int numClaimableTricks = m_pPlayer_deal[nPos]->GetNumClaimableTricks();
	if (numClaimableTricks < numTricksLeft)
	{
		AfxMessageBox(FormString("The claim isn't evident yet -- you have only %d clear tricks versus %d more required.\nPlease play on.", numClaimableTricks, numTricksLeft), MB_ICONINFORMATION);
		return;
	}

	// process the claim -- credit the player for all claimable tricks
	ClaimTricks(nPos, numClaimableTricks);
}




//
// ClaimTricks() 
//
void CEasyBDoc::ClaimTricks(int nPos, int numTricks) 
{
	m_numActualTricksPlayed_deal = m_numTricksPlayed_deal;
	int numRemainingTricks = 13 - m_numTricksPlayed_deal;
	m_nRoundWinningTeam_deal = (Team) GetPlayerTeam(nPos);
	// default # of tricks claimed = all remaining
	int numTricksToClaim;
	if (numTricks == 0)
		numTricksToClaim = 13 - m_numTricksPlayed_deal;
	else
		numTricksToClaim = numTricks;
	//
	for(int i=m_numTricksPlayed_deal;i<13;i++,numTricksToClaim--)
	{
		// increment tricks won for a side
		if (numTricksToClaim > 0)
			m_numTricksWon_deal[m_nRoundWinningTeam_deal]++;
		else
			m_numTricksWon_deal[GetOpposingTeam(m_nRoundWinningTeam_deal)]++;
		m_numTricksPlayed_deal++;
		// clear trick record
		for(int j=0;j<4;j++)
			m_pGameTrick_deal[i][j] = NULL;
	}

	// clear the current round
	for(int i=0;i<4;i++)
		m_pCurrTrick_deal[i] = NULL;

	// mark the game complete
//	theApp.SetValue(tbGameInProgress, FALSE);

	// update display
	UpdatePlayHistory();
	// and inform the players
	if (!m_bReviewingGame)
	{
		for(int i=0;i<4;i++)
			m_pPlayer_deal[i]->RecordSpecialEvent(EVENT_CLAIMED, nPos, numRemainingTricks);
	}

	// and continue
	OnGameComplete();
}




//
void CEasyBDoc::OnUpdatePlayConcedeTricks(CCmdUI* pCmdUI) 
{
	if (theApp.GetValue(tbGameInProgress) && (m_numTricksPlayed_deal < 13))
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}

//
// OnPlayConcedeTricks() 
//
void CEasyBDoc::OnPlayConcedeTricks() 
{
	// confirm
	if (AfxMessageBox("Are you sure you wish to concede the rest of the tricks?", MB_ICONQUESTION | MB_OKCANCEL) == IDOK)
	{
		// process the claim
		int nPos = GetHumanPlayerPos();
		ConcedeTricks(nPos);
	}
}


//
// ConcedeTricks() 
//
void CEasyBDoc::ConcedeTricks(int nPos) 
{
	// process the concession
	m_numActualTricksPlayed_deal = m_numTricksPlayed_deal;
	int numRemainingTricks = 13 - m_numTricksPlayed_deal;
	int nConcedingTeam = GetPlayerTeam(nPos);
	m_nRoundWinningTeam_deal = (nConcedingTeam == NORTH_SOUTH)? EAST_WEST: NORTH_SOUTH;
	for(int i=m_numTricksPlayed_deal;i<13;i++)
	{
		// increment tricks won
		m_numTricksWon_deal[m_nRoundWinningTeam_deal]++;
		m_numTricksPlayed_deal++;
		// clear trick record
		for(int j=0;j<4;j++)
			m_pGameTrick_deal[i][j] = NULL;
	}

	// clear the current round
	for(int i=0;i<4;i++)
		m_pCurrTrick_deal[i] = NULL;

	// mark the game complete
//	theApp.SetValue(tbGameInProgress, FALSE);

	// update display
	UpdatePlayHistory();

	// and inform the players
	if (!m_bReviewingGame)
	{
		for(int i=0;i<4;i++)
			m_pPlayer_deal[i]->RecordSpecialEvent(EVENT_CONCEDED, nPos, numRemainingTricks);
	}

	// and continue
	OnGameComplete();
}


//
void CEasyBDoc::OnUpdateGameAutoPlay(CCmdUI* pCmdUI) 
{
	if ((theApp.IsGameInProgress()) && 
//		((m_nCurrPlayer == NORTH) || (m_nCurrPlayer == SOUTH)) &&
		(pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY))
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlay() 
{
	// have the computer play for the human
	CPlayerStatusDialog& status = m_pPlayer_deal[m_nCurrPlayer_deal]->GetStatusDialog();
	status << "4PLYAUTO1! The computer is playing a card for the human player...\n";
	pMAINFRAME->SetStatusMessage(FormString(("Playing for %s..."), PositionToString(m_nCurrPlayer_deal)));
	InvokeNextPlayer();	
}


//
void CEasyBDoc::OnUpdateGameAutoPlayAll(CCmdUI* pCmdUI) 
{
	//
	if (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO)
		pCmdUI->SetCheck(1);
	else
		pCmdUI->SetCheck(0);
	//
	if (theApp.IsGameInProgress() && 
		((pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY) ||
		 (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK) ||
		 (m_bAutoReplayMode)) )
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlayAll() 
{
	// clear hints if enabled
	if (theApp.GetValue(tnAutoHintMode) > 0)
		pMAINFRAME->ClearAutoHints();
	
	//
	CPlayerStatusDialog& status = m_pPlayer_deal[m_nCurrPlayer_deal]->GetStatusDialog();
	if (theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO)
	{
		// check if we're in computer replay
		if (m_bAutoReplayMode)
		{
			m_bAutoReplayMode = FALSE;
			m_bExpressPlayMode = FALSE;
			// reset mode indicator
			pMAINFRAME->SetModeIndicator();
			pMAINFRAME->SetStatusMessage("Computer Replay cancelled.");
		}
		else
		{
			pMAINFRAME->SetStatusMessage("Auto play disabled.");
			status << "4PLYAUTO2a! Computer autoplay cancelled.\n";
		}
		theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
		if ( ((m_nCurrPlayer_deal == NORTH) || (m_nCurrPlayer_deal == SOUTH)) &&
				(pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY) )
			pVIEW->AdvanceToNextPlayer();
	}
	else
	{
		// have the computer play for the human
		status << "4PLYAUTO2b! The computer is taking over the remainder of play for the human...\n";
		if (!m_bAutoReplayMode)
			pMAINFRAME->SetStatusMessage("Auto play enabled.");
		pMAINFRAME->OnPlayModeFullAuto();
	}
}


//
void CEasyBDoc::OnUpdateGameAutoPlayExpress(CCmdUI* pCmdUI) 
{
	//
	if (theApp.InExpressAutoPlay())
		pCmdUI->SetCheck(1);
	else
		pCmdUI->SetCheck(0);
	//
	if (theApp.IsGameInProgress() && 
		((pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY) ||
		 (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK) ||
		 (m_bAutoReplayMode)) )
		pCmdUI->Enable(TRUE);
	else
		pCmdUI->Enable(FALSE);
}

//
void CEasyBDoc::OnGameAutoPlayExpress() 
{
	// clear hints if enabled
	if (theApp.GetValue(tnAutoHintMode) > 0)
		pMAINFRAME->ClearAutoHints();
	
	//
	CPlayerStatusDialog& status = m_pPlayer_deal[m_nCurrPlayer_deal]->GetStatusDialog();
	if (theApp.InExpressAutoPlay())
	{
		// check if we're in computer replay
		if (m_bAutoReplayMode)
		{
			m_bAutoReplayMode = FALSE;
			m_bExpressPlayMode = FALSE;
			// reset mode indicator
			pMAINFRAME->SetModeIndicator();
			pMAINFRAME->SetStatusMessage("Computer Replay cancelled.");
		}
		else
		{
			pMAINFRAME->SetStatusMessage("Full auto play disabled.");
			status << "4PLYAUTO3a! Computer autoplay cancelled.\n";
		}
		theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
		pVIEW->EnableRefresh();
		EndWaitCursor();
		if ( ((m_nCurrPlayer_deal == NORTH) || (m_nCurrPlayer_deal == SOUTH)) &&
				(pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY) )
			pVIEW->AdvanceToNextPlayer();
	}
	else
	{
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
		if (pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK)
		{
			// and wait for a click
			pVIEW->ClearTable();
			pVIEW->SuppressRefresh();
			ClearTrick();
		}
		else
		{
			pVIEW->SetCurrentMode(CEasyBView::MODE_WAITCARDPLAY);
		}
		//
		if ((theApp.IsGameInProgress()) && (pVIEW->GetCurrentMode() == CEasyBView::MODE_WAITCARDPLAY))
			pVIEW->AdvanceToNextPlayer();
	}
}


//
void CEasyBDoc::OnUpdateGameAutoTest(CCmdUI* pCmdUI) 
{
	pCmdUI->Enable(TRUE);
}

void CEasyBDoc::OnGameAutoTest() 
{
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
void CEasyBDoc::OnUpdateSwapCards(CCmdUI* pCmdUI) 
{
//	if ((theApp.IsGameInProgress()) || (!m_bHandsDealt))
	if (!m_bHandsDealt)
		pCmdUI->Enable(FALSE);
	else
		pCmdUI->Enable(TRUE);
}

//
void CEasyBDoc::OnSwapPositionEast() 
{
	CWaitCursor wait;
	if (!theApp.IsGameInProgress())
	{
		// not started playing yet
		SwapPlayersHands(SOUTH,EAST);
		pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_EAST);
	}
	else
	{
		// play has started
		SwapPartialHands(SOUTH,EAST);
		ResetDisplay();
		m_pPlayer_deal[SOUTH]->InitializeSwappedHand();
		m_pPlayer_deal[EAST]->InitializeSwappedHand();
	}
}

//
void CEasyBDoc::OnSwapPositionNorth() 
{
	CWaitCursor wait;
	if (!theApp.IsGameInProgress())
	{
		// not started playing yet
		SwapPlayersHands(SOUTH,NORTH);
		pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_NORTH);
	}
	else
	{
		// play has started
		SwapPartialHands(SOUTH,EAST);
		ResetDisplay();
		m_pPlayer_deal[SOUTH]->InitializeSwappedHand();
		m_pPlayer_deal[NORTH]->InitializeSwappedHand();
	}
}

//
void CEasyBDoc::OnSwapPositionWest() 
{
	CWaitCursor wait;
	if (!theApp.IsGameInProgress())
	{
		// not started playing yet
		SwapPlayersHands(SOUTH,WEST);
		pMAINFRAME->SetDefaultSwapCommand(ID_SWAP_POSITION_WEST);
	}
	else
	{
		// play has started
		SwapPartialHands(SOUTH,EAST);
		ResetDisplay();
		m_pPlayer_deal[SOUTH]->InitializeSwappedHand();
		m_pPlayer_deal[EAST]->InitializeSwappedHand();
	}
}

//
void CEasyBDoc::OnSwapCardsClockwise() 
{
	CWaitCursor wait;
	if (!theApp.IsGameInProgress())
	{
		// not started playing yet
		RotatePlayersHands(0, TRUE, theApp.IsBiddingInProgress());
	}
	else
	{
		// play has started
		RotatePartialHands(1);
		ResetDisplay();
		pVIEW->AdvanceToNextPlayer();
	}
}


//
void CEasyBDoc::OnSwapCardsCounterclockwise() 
{
	CWaitCursor wait;
	if (!theApp.IsGameInProgress())
	{
		// not started playing yet
		RotatePlayersHands(1, TRUE, theApp.IsBiddingInProgress());
	}
	else
	{
		// play has started
		RotatePartialHands(3);
		ResetDisplay();
		pVIEW->AdvanceToNextPlayer();
	}
}


//
void CEasyBDoc::RotatePlayersHands(int nDirection, BOOL bRefresh, BOOL bRestartBidding) 
{
	// suspend trace
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->SuspendTrace();
	//
	if (nDirection == 0)
	{
		// clockwise
		// first south & west
		SwapPlayersHands(SOUTH, WEST, FALSE, FALSE);
		// then north & south
		SwapPlayersHands(NORTH, SOUTH, FALSE, FALSE);
		// then south & east
		SwapPlayersHands(SOUTH, EAST, bRefresh, FALSE);
	}
	else
	{
		// ccw
		// first south & east
		SwapPlayersHands(SOUTH, EAST, FALSE, FALSE);
		// then west & north
		SwapPlayersHands(WEST, NORTH, FALSE, FALSE);
		// then north & south
		SwapPlayersHands(NORTH, SOUTH, bRefresh, FALSE);
	}

	// resume trace
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->ResumeTrace();

	//
	if (bRestartBidding)
	{
		for(int i=0;i<4;i++)
		{
			m_pPlayer_deal[i]->InitializeHand();
			if (bRestartBidding)
				m_pPlayer_deal[i]->RestartBidding();
		}
		pVIEW->PostMessage(WM_COMMAND, WMS_BIDDING_RESTART, 0L);
	}
}


//
void CEasyBDoc::RestoreInitialHands() 
{
	ClearPlayInfo();
	for(int i=0;i<4;i++)
		m_pPlayer_deal[i]->RestoreInitialHand();
}


//
void CEasyBDoc::OnFileOpen() 
{
	//
	CString strExtension = "brd";
	CString strTypeList = "EasyBridge Files (*.brd)|*.brd|Portable Bridge Notation Files (*.pbn)|*.pbn|All Files (*.*)|*.*||";
	if (m_nPrevFileFormat == tnPBNFormat)
	{
		strExtension = 	"pbn";
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
void CEasyBDoc::OnUpdateFileSave(CCmdUI* pCmdUI) 
{
	if ((!m_bHandsDealt) || !pVIEW->CanSaveFile())
		pCmdUI->Enable(FALSE);
	else
		pCmdUI->Enable(TRUE);
}


//
// OnFileSave()
//
void CEasyBDoc::OnFileSave() 
{
	if (m_strDocTitle.IsEmpty()) 
	{
		OnFileSaveAs();
		return;
	}
	// save
	BeginWaitCursor();
	CString strPath = GetPathName();
	if (!pDOC->OnSaveDocument((LPCTSTR)strPath)) 
	{
		// be sure to delete the file
		TRY
		{
			CFile::Remove((LPCTSTR)strPath);
		}
		CATCH_ALL(e)
		{
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
void CEasyBDoc::OnUpdateFileSaveAs(CCmdUI* pCmdUI) 
{
	if ((!m_bHandsDealt) || !pVIEW->CanSaveFile())
		pCmdUI->Enable(FALSE);
	else
		pCmdUI->Enable(TRUE);
}


//
// OnFileSaveAs() 
//
void CEasyBDoc::OnFileSaveAs() 
{
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
		strExtension = 	"pbn";
	else if (m_nPrevFileFormat == tnTextFormat)
		strExtension = 	"txt";

	// and append the default suffix if necessary
	if (!strFileName.IsEmpty())
	{
		if (strFileName.Find(_T('.')) < 0)
		{
			CString strExt;
			if (pTemplate->GetDocString(strExt, CDocTemplate::filterExt) &&
									  !strExt.IsEmpty()) 
			{
				ASSERT(strExt[0] == '.');
				strFileName += strExt;
			}
		}
	}
	else
	{
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
	if (fileDlg.DoModal() == IDCANCEL) 
	{
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
	if (!pDOC->OnSaveDocument(strFileName)) 
	{
		// be sure to delete the file
		TRY
		{
			CFile::Remove(newPath);
		}
		CATCH_ALL(e)
		{
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
void CEasyBDoc::OnUpdateFileProperties(CCmdUI* pCmdUI) 
{
	pCmdUI->Enable(TRUE);
}


//
void CEasyBDoc::OnFileProperties() 
{
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
// GetDealIDString()
//
CString CEasyBDoc::GetDealIDString() 
{
	CString strDealID;
	if (m_bDealNumberAvailable_deal && theApp.GetValue(tbEnableDealNumbering))
	{
		strDealID.Format("%08lX", m_nDealNumber_deal); 

		// appended code = vulnerability + dealer
		int nAppend = (m_nVulnerableTeam_deal << 2) | m_nDealer_deal;
		strDealID += FormString("%1X", (BYTE)(nAppend & 0x0F));

		// append special deal code if necessary
		if (m_nSpecialDealCode_deal != 0)
			strDealID += FormString("%2X", (BYTE)(m_nSpecialDealCode_deal & 0xFF));
	}
	//
	return strDealID;
}


//
BOOL CEasyBDoc::SwapPlayersHands(Position player1, Position player2, BOOL bRefresh, BOOL bRestartBidding) 
{
	if (m_pPlayer_deal[player1]->GetNumCards() != m_pPlayer_deal[player2]->GetNumCards())
	{
		AfxMessageBox("The two players do not have an equal number of cards!");
		return FALSE;
	}
	//
	CCard *pTempCard[13];
	int i, numCards = m_pPlayer_deal[player1]->GetNumCards();

	// first remove player 1's cards
	for(i=0;i<numCards;i++) 
		pTempCard[i] = m_pPlayer_deal[player1]->RemoveCardFromHand(0);

	// then take player 2's cards and give them to player 1
	for(i=0;i<numCards;i++) 
		m_pPlayer_deal[player1]->AddCardToHand(m_pPlayer_deal[player2]->RemoveCardFromHand(0));

	// then place the saved cards from player 1's hand into player 2's hand
	for(i=0;i<numCards;i++) 
		m_pPlayer_deal[player2]->AddCardToHand(pTempCard[i]);

	// and re-init the hands
//	m_pPlayer[player1]->InitializeHand();
//	m_pPlayer[player2]->InitialEvaluateHand();
	if (bRestartBidding)
	{
		m_pPlayer_deal[player1]->InitializeHand();
		m_pPlayer_deal[player1]->RestartBidding();
	}
	//
//	m_pPlayer[player2]->InitializeHand();
//	m_pPlayer[player2]->InitialEvaluateHand();
	if (bRestartBidding)
	{
		m_pPlayer_deal[player2]->InitializeHand();
		m_pPlayer_deal[player2]->RestartBidding();
	}

	// if one of the players was South, correct the cards face up/down status
	if ((player1 == SOUTH) || (player2 == SOUTH))
	{
		BOOL bAllCardsFaceUp = theApp.AreCardsFaceUp();
		if (player1 == SOUTH)
			m_pPlayer_deal[player1]->ExposeCards(TRUE, FALSE);
		else
			m_pPlayer_deal[player1]->ExposeCards(FALSE, FALSE);
		//
		if (player2 == SOUTH)
			m_pPlayer_deal[player2]->ExposeCards(TRUE, FALSE);
		else
			m_pPlayer_deal[player2]->ExposeCards(FALSE, FALSE);
	}

	// and update
	if (bRestartBidding && theApp.IsBiddingInProgress()) 
		pVIEW->PostMessage(WM_COMMAND, WMS_BIDDING_RESTART, 0L);

	// redisplay
	if (bRefresh)
		ResetDisplay();
	return TRUE;
}






//
//==================================================================
//
//
// Utilities
//
//
//==================================================================
//


//
// FormatOriginalHands()
//
CString CEasyBDoc::FormatOriginalHands()
{
	CString strHands;

	// write out North
	CCardList& northCards = m_pPlayer_deal[NORTH]->GetHand().GetInitialHand();
	int numCards = northCards.GetNumCards();
	for(int nSuit=SPADES;nSuit>=CLUBS;nSuit--)
	{
		strHands += CString(' ', 16) + GetSuitLetter(nSuit) + ": ";
		for(int nIndex=0;nIndex<numCards;nIndex++)
		{
			if (northCards[nIndex]->GetSuit() != nSuit)
				continue;
			strHands += northCards[nIndex]->GetCardLetter();
			strHands += ' ';
		}
		strHands += "\r\n";
	}

	// write out West & East
	CCardList& westCards = m_pPlayer_deal[WEST]->GetHand().GetInitialHand();
	CCardList& eastCards = m_pPlayer_deal[EAST]->GetHand().GetInitialHand();
	int numWestCards = westCards.GetNumCards();
	int numEastCards = eastCards.GetNumCards();
	CString strTemp;
	for(int nSuit=SPADES;nSuit>=CLUBS;nSuit--)
	{
		strHands += CString(GetSuitLetter(nSuit)) + ": ";
		int nCount = 3;
		// show west suit
		for(int nIndex=0;nIndex<numWestCards;nIndex++)
		{
			if (westCards[nIndex]->GetSuit() != nSuit)
				continue;
			strHands += westCards[nIndex]->GetCardLetter();
			strHands += ' ';
			nCount += 2;
		}
		// pad out to 32 chars
		strHands += CString(' ', 32-nCount);
		strHands += CString(GetSuitLetter(nSuit)) + ": ";
		// show east suit
		for(int nIndex=0;nIndex<numEastCards;nIndex++)
		{
			if (eastCards[nIndex]->GetSuit() != nSuit)
				continue;
			strHands += eastCards[nIndex]->GetCardLetter();
			strHands += ' ';
		}
		strHands += "\r\n";
	}
	strHands += strTemp;

	// write out South
	CCardList& southCards = m_pPlayer_deal[SOUTH]->GetHand().GetInitialHand();
	numCards = southCards.GetNumCards();
	for(int nSuit=SPADES;nSuit>=CLUBS;nSuit--)
	{
		strHands += CString(' ', 16) + GetSuitLetter(nSuit) + ": ";
		for(int nIndex=0;nIndex<numCards;nIndex++)
		{
			if (southCards[nIndex]->GetSuit() != nSuit)
				continue;
			strHands += southCards[nIndex]->GetCardLetter();
			strHands += ' ';
		}
		strHands += "\r\n";
	}

	//
	return strHands;
}



//
// FormatCurrentHands()
//
CString CEasyBDoc::FormatCurrentHands()
{
	CString strHands;

	// write out North
	CCardList& northCards = m_pPlayer_deal[NORTH]->GetHand();
	int numCards = northCards.GetNumCards();
	for(int nSuit=SPADES;nSuit>=CLUBS;nSuit--)
	{
		strHands += CString(' ', 16) + GetSuitLetter(nSuit) + ": ";
		for(int nIndex=0;nIndex<numCards;nIndex++)
		{
			if (northCards[nIndex]->GetSuit() != nSuit)
				continue;
			strHands += northCards[nIndex]->GetCardLetter();
			strHands += ' ';
		}
		strHands += "\r\n";
	}

	// write out West & East
	CCardList& westCards = m_pPlayer_deal[WEST]->GetHand();
	CCardList& eastCards = m_pPlayer_deal[EAST]->GetHand();
	int numWestCards = westCards.GetNumCards();
	int numEastCards = eastCards.GetNumCards();
	CString strTemp;
	for(int nSuit=SPADES;nSuit>=CLUBS;nSuit--)
	{
		strHands += CString(GetSuitLetter(nSuit)) + ": ";
		int nCount = 3;
		// show west suit
		for(int nIndex=0;nIndex<numWestCards;nIndex++)
		{
			if (westCards[nIndex]->GetSuit() != nSuit)
				continue;
			strHands += westCards[nIndex]->GetCardLetter();
			strHands += ' ';
			nCount += 2;
		}
		// pad out to 32 chars
		strHands += CString(' ', 32-nCount);
		strHands += CString(GetSuitLetter(nSuit)) + ": ";
		// show east suit
		for(int nIndex=0;nIndex<numEastCards;nIndex++)
		{
			if (eastCards[nIndex]->GetSuit() != nSuit)
				continue;
			strHands += eastCards[nIndex]->GetCardLetter();
			strHands += ' ';
		}
		strHands += "\r\n";
	}
	strHands += strTemp;

	// write out South
	CCardList& southCards = m_pPlayer_deal[SOUTH]->GetHand();
	numCards = southCards.GetNumCards();
	for(int nSuit=SPADES;nSuit>=CLUBS;nSuit--)
	{
		strHands += CString(' ', 16) + GetSuitLetter(nSuit) + ": ";
		for(int nIndex=0;nIndex<numCards;nIndex++)
		{
			if (southCards[nIndex]->GetSuit() != nSuit)
				continue;
			strHands += southCards[nIndex]->GetCardLetter();
			strHands += ' ';
		}
		strHands += "\r\n";
	}

	//
	return strHands;
}






//
//=======================================================
//
// generic property operators
//

//
// GetValuePV()
//
LPVOID CEasyBDoc::GetValuePV(int nItem, int nIndex1, int nIndex2, int nIndex3)  const
{
	switch(nItem)
	{
		case tppPlayer:
			return (LPVOID) m_pPlayer_deal[nIndex1];
		case tstrFileProgTitle:
			return (LPVOID) (LPCTSTR) m_strFileProgTitle;
		case tnFileProgramMajorVersion:
			return (LPVOID) m_nFileProgMajorVersion;
		case tnFileProgramMinorVersion:
			return (LPVOID) m_nFileProgMinorVersion;
		case tnFileProgramIncrementVersion:
			return (LPVOID) m_nFileProgIncrementVersion;
		case tnFileProgramBuildNumber:
			return (LPVOID) m_nFileProgBuildNumber;
		case tstrFileProgramBuildDate:
			return (LPVOID) (LPCTSTR) m_strFileProgBuildDate;
		case tstrFileDate:
			return (LPVOID) (LPCTSTR) m_strFileDate;
		case tstrFileDescription:
			return (LPVOID) (LPCTSTR) m_strFileDescription;
		case tstrFileComments:
			return (LPVOID) (LPCTSTR) m_strFileComments;
		case tstrDocTitle:
			return (LPVOID) (LPCTSTR) m_strDocTitle;
		case tbExpressPlayMode:
			return (LPVOID) (LPCTSTR) m_bExpressPlayMode;
		case tbAutoReplayMode:
			return (LPVOID) (LPCTSTR) m_bAutoReplayMode;
		// match/game info
		case tbReviewingGame:
			return (LPVOID) m_bReviewingGame;
		case tbGameReviewAvailable:
			return (LPVOID) m_bGameReviewAvailable;
		case tnGameScore:			// [30][2]
			return (LPVOID) m_nGameScore_deal[nIndex1][nIndex2];
		case tnCurrGame:
			return (LPVOID) m_nCurrGame_deal;
		case tnBonusScore:			// [2]
			return (LPVOID) m_nBonusScore_deal[nIndex1];
		case tnTotalScore:			// [2]
			return (LPVOID) m_nTotalScore_deal;
		case tnumGamesWon:
			return (LPVOID) m_numGamesWon_deal[nIndex1];
		case tnVulnerableTeam:
			return (LPVOID) m_nVulnerableTeam_deal;
		case tbVulnerable:			// [2]
			return (LPVOID) m_bVulnerable_deal[nIndex1];
		case tstrTrickPointsRecord:
			return (LPVOID) (LPCTSTR) m_strArrayTrickPointsRecord_deal.GetAt(nIndex1);
		case tstrBonusPointsRecord:
			return (LPVOID) (LPCTSTR) m_strArrayBonusPointsRecord_deal.GetAt(nIndex1);
		case tstrTotalPointsRecord:
			return (LPVOID) (LPCTSTR) m_strTotalPointsRecord_deal;
		// bid info
		case tnContract:
			return (LPVOID) m_nContract_deal;
		case tnContractLevel:
			return (LPVOID) m_nContractLevel_deal;
		case tnContractSuit:
			return (LPVOID) m_nContractSuit_deal;
		case tnContractTeam:
			return (LPVOID) m_nContractTeam_deal;
		case tnDefendingTeam:
			return (LPVOID) m_nDefendingTeam_deal;
		case tnumBidsMade:
			return (LPVOID) m_numBidsMade_deal;
		case tnOpeningBid:
			return (LPVOID) m_nOpeningBid_deal;
		case tnOpeningBidder:
			return (LPVOID) m_nOpeningBidder_deal;
		case tnumValidBidsMade:
			return (LPVOID) m_numValidBidsMade_deal;
		case tnBiddingRound:
			return (LPVOID) m_nBiddingRound_deal;
		case tbDoubled:	
			return (LPVOID) m_bDoubled_deal;
		case tnDoubler:	
			return (LPVOID) m_nDoubler_deal;
		case tbRedoubled:
			return (LPVOID) m_bRedoubled_deal;
		case tnRedoubler:
			return (LPVOID) m_nRedoubler_deal;
		case tnContractModifier:
			return (LPVOID) m_nContractModifier_deal;
		case tnLastValidBid:
			return (LPVOID) m_nLastValidBid_deal;
		case tnLastValidBidTeam:
			return (LPVOID) m_nLastValidBidTeam_deal;
		case tnPartnershipSuit:	// [2]
			return (LPVOID) m_nPartnershipSuit_deal[nIndex1];
		case tnPartnershipLead:	// [2][5]
			return (LPVOID) m_nPartnershipLead_deal[nIndex1][nIndex2];
		case tnumPasses:
			return (LPVOID) m_numPasses_deal;
		case tnBiddingHistory:	// [100]
			return (LPVOID) m_nBiddingHistory_deal[nIndex1];
		case tnValidBidHistory:	// [100]
			return (LPVOID) m_nValidBidHistory_deal[nIndex1];
		case tnBidsByPlayer:		// [4][50]
			return (LPVOID) m_nBidsByPlayer_deal[nIndex1][nIndex2];
		// hand info
		case tnDealer:
			return (LPVOID) m_nDealer_deal;
		case tnCurrentPlayer:
			return (LPVOID) m_nCurrPlayer_deal;
		case tnPreviousDealer:
			return (LPVOID) m_nPrevDealer_deal;
		case tnDeclarer:
			return (LPVOID) m_nDeclarer_deal;
		case tnDummy:
			return (LPVOID) m_nDummy_deal;
		case tbExposeDummy:
			return (LPVOID) m_bExposeDummy_deal;
		case tnTrumpSuit:
			return (LPVOID) m_nTrumpSuit_deal;
		case tnGameLead:
			return (LPVOID) m_nGameLead_deal;
		case tnRoundLead:
			return (LPVOID) m_nRoundLead_deal;
		case tnPlayRecord:
			return (LPVOID) m_nPlayRecord_deal[nIndex1];
		case tpcGameTrick:		// [13][4]
			return (LPVOID) m_pGameTrick_deal[nIndex1][nIndex2];
		case tnTrickLead:		// [13]
			return (LPVOID) m_nTrickLead_deal[nIndex1];
		case tnTrickWinner:		// [13]
			return (LPVOID) m_nTrickWinner_deal[nIndex1];
		case tpcCurrentTrick:	// [4] 
			return (LPVOID) m_pCurrTrick_deal[nIndex1];
		case tnumTricksPlayed:
			return (LPVOID) m_numTricksPlayed_deal;
		case tnumActualTricksPlayed:
			return (LPVOID) m_numActualTricksPlayed_deal;
		case tnumCardsPlayedInRound:
			return (LPVOID) m_numCardsPlayedInRound_deal;
		case tnumCardsPlayedInGame:
			return (LPVOID) m_numCardsPlayedInGame_deal;
		case tnumTricksWon:		// [2]
			return (LPVOID) m_numTricksWon_deal[nIndex1];
		// misc
		case tnDealNumber:
			return (LPVOID)(LPCTSTR) m_nDealNumber_deal;
		case tnSpecialDealCode:
			return (LPVOID) m_nSpecialDealCode_deal;
		case tbDealNumberAvailable:
			return (LPVOID) m_bDealNumberAvailable_deal;
		// results info
		case tnSuitLed:
			return (LPVOID) m_nSuitLed_deal;
		case tnHighVal:
			return (LPVOID) m_nHighVal_deal;
		case tnHighTrumpVal:
			return (LPVOID) m_nHighTrumpVal_deal;
		case tpvHighCard:
			return (LPVOID) m_pHighCard_deal;
		case tnHighPos:
			return (LPVOID) m_nHighPos_deal;
		case tnRoundWinner:
			return (LPVOID) m_nRoundWinner_deal;
		case tnRoundWinningTeam:
			return (LPVOID) m_nRoundWinningTeam_deal;
		// flags
		case tbHandsDealt:
			return (LPVOID) m_bHandsDealt;
		case tbShowCommentsUponOpen:
			return (LPVOID) m_bShowCommentsUponOpen;
		case tbShowBidHistoryUponOpen:
			return (LPVOID) m_bShowBidHistoryUponOpen;
		case tbShowPlayHistoryUponOpen:
			return (LPVOID) m_bShowPlayHistoryUponOpen;
		case tbShowAnalysesUponOpen:
			return (LPVOID) m_bShowAnalysesUponOpen;
		case tbSavePlayerAnalysis:
			return (LPVOID) m_bSavePlayerAnalysis[nIndex1];
		case tbDocSaveIntermediatePositions:
			return (LPVOID) m_bSaveIntermediatePositions;
		default:
			AfxMessageBox("Unhandled Call to CEasyBDoc::GetValuePV()");
			return NULL;
	}
	return 0;
}

//
double CEasyBDoc::GetValueDouble(int nItem, int nIndex1, int nIndex2, int nIndex3) const
{
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
int CEasyBDoc::SetValuePV(int nItem, LPVOID value, int nIndex1, int nIndex2, int nIndex3)
{
	int nVal = (int) value;
	BOOL bVal = (BOOL) value;
	LPCTSTR sVal = (LPCTSTR) value;
	//
	switch(nItem)
	{
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
			m_nGameScore_deal[nIndex1][nIndex2] = nVal;
			break;
		case tnCurrGame:
			m_nCurrGame_deal = nVal;
			break;
		case tnBonusScore:			// [2]
			m_nBonusScore_deal[nIndex1] = nVal;
			break;
		case tnTotalScore:			// [2]
			m_nTotalScore_deal[nIndex1] = nVal;
			break;
		case tnumGamesWon:
			m_numGamesWon_deal[nIndex1] = nVal;
			break;
		case tnVulnerableTeam:
			m_nVulnerableTeam_deal = (Team) nVal;
			break;
		case tbVulnerable:			// [2]
			m_bVulnerable_deal[nIndex1] = nVal;
			break;
		case tstrTrickPointsRecord:
//			m_strArrayTrickPointsRecord = sVal;
			break;
		case tstrBonusPointsRecord:
//			m_strArrayBonusPointsRecord = sVal;
			break;
		case tstrTotalPointsRecord:
			m_strTotalPointsRecord_deal = sVal;
			break;
		// bidding info
		case tnContract:
			m_nContract_deal = nVal;
			break;
		case tnContractLevel:
			m_nContractLevel_deal = nVal;
			break;
		case tnContractSuit:
			m_nContractSuit_deal = nVal;
			break;
		case tnContractTeam:
			m_nContractTeam_deal = nVal;
			break;
		case tnDefendingTeam:
			m_nDefendingTeam_deal = nVal;
			break;
		case tnumBidsMade:
			m_numBidsMade_deal = nVal;
			break;
		case tnOpeningBid:
			m_nOpeningBid_deal = nVal;
			break;
		case tnOpeningBidder:
			m_nOpeningBidder_deal = nVal;
			break;
		case tnumValidBidsMade:
			m_numValidBidsMade_deal = nVal;
			break;
		case tnBiddingRound:
			m_nBiddingRound_deal = nVal;
			break;
		case tbDoubled:	
			m_bDoubled_deal = bVal;
			break;
		case tnDoubler:	
			m_nDoubler_deal = nVal;
			break;
		case tbRedoubled:
			m_bRedoubled_deal = bVal;
			break;
		case tnRedoubler:
			m_nRedoubler_deal = nVal;
			break;
		case tnContractModifier:
			m_nContractModifier_deal = nVal;
			break;
		case tnLastValidBid:
			m_nLastValidBid_deal = nVal;
			break;
		case tnLastValidBidTeam:
			m_nLastValidBidTeam_deal = nVal;
			break;
		case tnPartnershipSuit:	// [2]
			m_nPartnershipSuit_deal[nIndex1] = nVal;
			break;
		case tnPartnershipLead:	// [2][5]
			m_nPartnershipLead_deal[nIndex1][nIndex2] = nVal;
			break;
		case tnumPasses:
			m_numPasses_deal = nVal;
			break;
		case tnBiddingHistory:	// [100]
			m_nBiddingHistory_deal[nIndex1] = nVal;
			break;
		case tnValidBidHistory:	// [100]
			m_nValidBidHistory_deal[nIndex1] = nVal;
			break;
		case tnBidsByPlayer:		// [4][50]
			m_nBidsByPlayer_deal[nIndex1][nIndex2] = nVal;
			break;
		// hand info
		case tnDealer:
			m_nDealer_deal = nVal;
			break;
		case tnCurrentPlayer:
			m_nCurrPlayer_deal = nVal;
			break;
		case tnPreviousDealer:
			m_nPrevDealer_deal = nVal;
			break;
		case tnDeclarer:
			m_nDeclarer_deal = nVal;
			break;
		case tnDummy:
			m_nDummy_deal = nVal;
			break;
		case tbExposeDummy:
			m_bExposeDummy_deal = bVal;
			break;
		case tnTrumpSuit:
			m_nTrumpSuit_deal = nVal;
			break;
		case tnGameLead:
			m_nGameLead_deal = nVal;
			break;
		case tnRoundLead:
			m_nRoundLead_deal = nVal;
			break;
		case tnPlayRecord:
			m_nPlayRecord_deal[nIndex1] = nVal;
			break;
		case tpcGameTrick:		// [13][4]
			m_pGameTrick_deal[nIndex1][nIndex2] = (CCard*) value;
			break;
		case tnTrickLead:		// [13]
			m_nTrickLead_deal[nIndex1] = nVal;
			break;
		case tnTrickWinner:		// [13]
			m_nTrickWinner_deal[nIndex1] = nVal;
			break;
		case tpcCurrentTrick:	// [4] 
			m_pCurrTrick_deal[nIndex1] = (CCard*) value;
			break;
		case tnumTricksPlayed:
			m_numTricksPlayed_deal = nVal;
			break;
		case tnumActualTricksPlayed:
			m_numActualTricksPlayed_deal = nVal;
			break;
		case tnumCardsPlayedInRound:
			m_numCardsPlayedInRound_deal = nVal;
			break;
		case tnumCardsPlayedInGame:
			m_numCardsPlayedInGame_deal = nVal;
			break;
		case tnumTricksWon:		// [2]
			m_numTricksWon_deal[nIndex1] = nVal;
			break;
		// misc
		case tnDealNumber:
			m_nDealNumber_deal = nVal;
			break;
		case tnSpecialDealCode:
			m_nSpecialDealCode_deal = nVal;
			break;
		case tbDealNumberAvailable:
			m_bDealNumberAvailable_deal = bVal;
			break;
		// results info
		case tnSuitLed:
			m_nSuitLed_deal = nVal;
			break;
		case tnHighVal:
			m_nHighVal_deal = nVal;
			break;
		case tnHighTrumpVal:
			m_nHighTrumpVal_deal = nVal;
			break;
		case tpvHighCard:
			m_pHighCard_deal = (CCard*) value;
			break;
		case tnHighPos:
			m_nHighPos_deal = nVal;
			break;
		case tnRoundWinner:
			m_nRoundWinner_deal = nVal;
			break;
		case tnRoundWinningTeam:
			m_nRoundWinningTeam_deal = (Team) nVal;
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
int CEasyBDoc::SetValue(int nItem, double fValue,int nIndex1, int nIndex2, int nIndex3)
{
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
LPCTSTR CEasyBDoc::GetValueString(int nItem, int nIndex1, int nIndex2, int nIndex3) const
{
	return (LPCTSTR) GetValue(nItem, nIndex1, nIndex2, nIndex3);
}

int CEasyBDoc::GetValue(int nItem, int nIndex1, int nIndex2, int nIndex3) const
{
	return (int) GetValuePV(nItem, nIndex1, nIndex2, nIndex3);
}

int CEasyBDoc::SetValue(int nItem, LPCTSTR szValue, int nIndex1, int nIndex2, int nIndex3)
{
	return SetValuePV(nItem, (LPVOID) szValue, nIndex1, nIndex2, nIndex3);
}

int CEasyBDoc::SetValue(int nItem, int nValue, int nIndex1, int nIndex2, int nIndex3)
{
	return SetValuePV(nItem, (LPVOID)nValue, nIndex1, nIndex2, nIndex3);
}



