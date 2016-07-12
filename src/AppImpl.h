#pragma once
#include "stdafx.h"
#include "app_interface.h"
#include "EasyB.h"
#include "viewopts.h"
#include "dialogs/AutoHintDialog.h"
#include "dialogs/BidDialog.h"
#include "dialogs/roundfinisheddialog.h"
#include "dialogs/ScoreDialog.h"
#include "dialogs/SelectHandDialog.h"
#include "StatusWnd.h"
#include "MainFrameopts.h"
#include "GIB.h"

class AppImpl : public AppInterface {
public:
  AppImpl() {}
  virtual ~AppImpl() {}

  //////////////////////////////////////////////////////////////////////////
  //
  // The App
  //
  //////////////////////////////////////////////////////////////////////////

  virtual bool IsEnableAnalysisTracing() {
    return theApp.GetValue(tbEnableAnalysisTracing) == TRUE;
  }

  virtual int AnalysisTraceLevel() {
    return theApp.GetValue(tnAnalysisTraceLevel);
  }

  virtual bool InExpressAutoPlay() {
    return theApp.InExpressAutoPlay() == TRUE;
  }

  virtual bool IsEnableAnalysisDuringHints() {
    return theApp.GetValue(tbEnableAnalysisDuringHints) == TRUE;
  }

  virtual bool IsShowCommentIdentifiers() {
    return theApp.GetValue(tbShowCommentIdentifiers) == TRUE;
  }

  virtual std::shared_ptr<ConventionPool> GetConventionPool() {
    return theApp.GetConventionPool();
  }

  virtual double GamePts() {
    return CEasyBApp::m_fNTGamePts;
  }

  virtual double MajorSuitGamePts() {
    return CEasyBApp::m_fMajorSuitGamePts;
  }

  virtual double MinorSuitGamePts() {
    return CEasyBApp::m_fMinorSuitGamePts;
  }

  virtual double NTGamePts() {
    return CEasyBApp::m_fNTGamePts;
  }

  virtual double FourthLevelPts() {
    return CEasyBApp::m_f4LevelPts;
  }

  virtual double ThirdLevelPts() {
    return CEasyBApp::m_f3LevelPts;
  }

  virtual double SecondLevelPts() {
    return CEasyBApp::m_f2LevelPts;
  }

  virtual double SlamPts() {
    return CEasyBApp::m_fSlamPts;
  }

  virtual double SmallSlamPts() {
    return CEasyBApp::m_fSlamPts;
  }

  virtual double GrandSlamPts() {
    return CEasyBApp::m_fGrandSlamPts;
  }

  virtual CConventionSet* GetCurrentConventionSet() {
    return pCurrConvSet;
  }

  virtual double OpenPoints(double points) {
    return points - theApp.GetBiddingAgressiveness()*0.5;
  }

  virtual double PointCount(double points) {
    return points - theApp.GetBiddingAgressiveness()*0.5;
  }

  virtual int GetMinimumOpeningValue(CPlayer* player) const {
    return theApp.GetMinimumOpeningValue(player);
  }

  virtual int GetProfileInt(const char* app, const char* key, int defaultValue) {
    return theApp.GetProfileInt(app, key, defaultValue);
  }

  virtual void WriteProfileInt(const char* app, const char* key, int defaultValue) {
    theApp.WriteProfileInt(app, key, defaultValue);
  }

  virtual bool IsInManualCardPlayMode() {
    return theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_MANUAL;
  }

  virtual bool AreCardsFaceUp() {
    return theApp.AreCardsFaceUp() == TRUE;
  }

  virtual bool IsEnableGIBForDeclarer() {
    return theApp.GetValue(tbEnableGIBForDeclarer) == TRUE;
  }

  virtual CGIB& GetGIB() {
    return *(theApp.GetGIB());
  }

  virtual bool IsInExpressAutoPlay() {
    return theApp.InExpressAutoPlay() == TRUE;
  }

  virtual bool IsComputerCanClaim() {
    return theApp.GetValue(tbComputerCanClaim) == TRUE;
  }

  virtual int InvokeGIB(CGIB& gib, CPlayer* player, CHandHoldings* hand, CHandHoldings* dummyHand, CPlayerStatusDialog* statusDialog) {
    return gib.Invoke(player, hand, dummyHand, statusDialog);
  }

  virtual bool IsEnableGIBForDefender() {
    return theApp.GetValue(tbEnableGIBForDefender) == TRUE;
  }

  virtual double GetHonorValue(int faceValue) {
    return theApp.m_fHonorValue[faceValue];
  }

  virtual int GetSuitSequence(int index) const {
    return theApp.GetSuitSequence(index);
  }

  virtual bool IsAcelessPenalty() {
    return theApp.GetValue(tbAcelessPenalty) == TRUE;
  }

  virtual bool IsFourAceBonus() {
    return theApp.GetValue(tb4AceBonus) == TRUE;
  }

  virtual bool IsCountShortSuits() {
    return theApp.GetValue(tbCountShortSuits) == TRUE;
  }

  virtual bool IsPenalizeUGHonors() {
    return theApp.GetValue(tbPenalizeUGHonors) == TRUE;
  }

  virtual int GetAutoHintMode() {
    return theApp.GetValue(tnAutoHintMode);
  }

  virtual bool IsInsertBiddingPause() {
    return theApp.GetValue(tbInsertBiddingPause) == TRUE;
  }

  virtual int GetPlayPauseLength() {
    return theApp.GetValue(tnPlayPauseLength);
  }

  virtual std::shared_ptr<CDeck> GetDeck() {
    return theApp.GetDeck();
  }

  virtual bool IsLowResOption() {
    return theApp.GetValue(tbLowResOption) == TRUE;
  }

  virtual bool IsEnableDealNumbering() {
    return theApp.GetValue(tbEnableDealNumbering) == TRUE;
  }

  virtual void SetFeedbackText(const char* msg) {
    ((CMainFrame*)theApp.GetFrame())->SetFeedbackText(msg);
  }

  virtual int GetRequiredPointsForGame(int suitCode, int side /* 0 - min, 1 - max */) {
    return theApp.GetValue(tnRequiredPointsForGame, suitCode, side);
  }

  virtual int GetRequiredPointsForSlam(int suitCode, int side /* 0 - min, 1 - max */) {
    return theApp.GetValue(tnRequiredPointsForSlam, suitCode, side);
  }

  virtual int GetMinSuitDistributions(int code) {
    return theApp.GetValue(tnMinSuitDistributions, code);
  }

  virtual int GetMinSuitDistributionsTable(int code, int distribution, int hand) {
    return theApp.GetValue(tnMinSuitDistributionTable, code, distribution, hand);
  }

  virtual int GetMaxImbalanceForNT() {
    return theApp.GetValue(tnMaxImbalanceForNT);
  }

  virtual bool IsNeedTwoBalancedTrumpHands() {
    return theApp.GetValue(tbNeedTwoBalancedTrumpHands) == TRUE;
  }

  virtual int GetMinCardsInMajor() {
    return theApp.GetValue(tnMinCardsInMajor);
  }

  virtual int GetMinTopMajorCard() {
    return theApp.GetValue(tnMinTopMajorCard);
  }

  virtual int GetMinCardsInMinor() {
    return theApp.GetValue(tnMinCardsInMinor);
  }

  virtual int GetMinTopMinorCard() {
    return theApp.GetValue(tnMinTopMinorCard);
  }

  virtual int GetAcesForSlam(int slamCode) {
    return theApp.GetValue(tnumAcesForSlam, slamCode);
  }

  virtual int GetKingsForSlam(int slamCode) {
    return theApp.GetValue(tnumKingsForSlam, slamCode);
  }

  virtual bool IsBalaceTeamHands() {
    return theApp.GetValue(tbBalanceTeamHands) == TRUE;
  }

  virtual bool IsFullAutoPlayMode() {
    return theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO;
  }

  virtual bool IsFullAutoExpressPlayMode() {
    return theApp.GetValue(tnCardPlayMode) == CEasyBApp::PLAY_FULL_AUTO_EXPRESS;
  }

  virtual void SetNormalPlayMode() {
    theApp.SetValue(tnCardPlayMode, CEasyBApp::PLAY_NORMAL);
  }

  virtual void SetRubberInProgress(bool value) {
    theApp.SetValue(tbRubberInProgress, value);
  }

  virtual void SetGameInProgress(bool value) {
    theApp.SetValue(tbGameInProgress, value);
  }

  virtual void SetBiddingInProgress(bool value) {
    theApp.SetValue(tbBiddingInProgress, value);
  }

  virtual const char* GetProgramTitle() {
    return (LPCTSTR)theApp.GetValue(tstrProgramTitle); 
  }

  virtual int GetProgramMajorVersion() {
    return theApp.GetValue(tnProgramMajorVersion);
  }

  virtual int GetProgramMinorVersion() {
    return theApp.GetValue(tnProgramMinorVersion);
  }

  virtual int GetProgramIncrementVersion() {
    return theApp.GetValue(tnProgramIncrementVersion);
  }

  virtual int GetProgramBuildNumber() {
    return theApp.GetValue(tnProgramBuildNumber);
  }

  virtual const char* GetProgramBuildDate() {
    return (LPCTSTR)theApp.GetValue(tstrProgramBuildDate);
  }

  virtual bool IsRubberInProgress() {
    return theApp.IsRubberInProgress() == TRUE;
  }

  virtual bool IsGameInProgress() {
    return theApp.IsGameInProgress() == TRUE;
  }

  virtual bool IsBiddingInProgress() {
    return theApp.IsBiddingInProgress() == TRUE;
  }

  virtual CString GetProgramVersionString() {
    return theApp.GetProgramVersionString();
  }

  virtual bool IsSaveIntermediatePositions() {
    return theApp.GetValue(tbSaveIntermediatePositions) == TRUE;
  }

  virtual bool IsScoreHonorsBonuses() {
    return theApp.GetValue(tbScoreHonorsBonuses) == TRUE;
  }

  virtual bool IsInAutoTestMode() {
    return theApp.GetValue(tbAutoTestMode) == TRUE;
  }

  virtual const char* GetProgramDirectory() {
    return (LPCTSTR)theApp.GetValue(tszProgramDirectory);
  }

  virtual bool IsExposePBNGameCards() {
    return theApp.GetValue(tbExposePBNGameCards) == TRUE;
  }

  virtual bool IsUseSuitSymbols() {
    return theApp.GetValue(tbUseSuitSymbols) ==  TRUE;
  }
  
  virtual bool IsShowDummyTrumpsOnLeft() {
    return theApp.GetValue(tbShowDummyTrumpsOnLeft) == TRUE;
  }

  virtual void SetShowCardsFaceUp(bool value) {
    theApp.SetValue(tbShowCardsFaceUp, value);
  }

  virtual void InitDummySuitSequence(int trump, int dummy_position) {
    theApp.InitDummySuitSequence(trump, dummy_position);
  }

  virtual bool IsAutoHintEnabled() {
    return theApp.IsAutoHintEnabled() == TRUE;
  }

  virtual bool IsUsingDuplicateScoring() {
    return theApp.IsUsingDuplicateScoring() == TRUE;
  }

  virtual bool IsDebugModeActive() {
    return theApp.IsDebugModeActive() == TRUE;
  }

  //////////////////////////////////////////////////////////////////////////
  //
  // pMAINFRAME
  //
  //////////////////////////////////////////////////////////////////////////

  virtual void SetAutoHintDialogHintText(CString text) {
    ((CAutoHintDialog*)pMAINFRAME->GetDialog(twAutoHintDialog))->SetHintText(text);
  }

  virtual void ShowAnalysisDialog(Position position) {
    pMAINFRAME->MakeDialogVisible(twAnalysisDialog, position);
  }

  virtual void HideAnalysisDialog(Position position) {
    pMAINFRAME->HideDialog(twAnalysisDialog, position);
  }

  virtual void SetAnalysisText(Position position, CString analysis) {
    pMAINFRAME->SetAnalysisText(position, analysis);
  }

  virtual void SuspendHints() {
    pMAINFRAME->SuspendHints();
  }

  virtual void ResumeHints() {
    pMAINFRAME->ResumeHints();
  }

  virtual void UpdateStatusWindowWithPlayPlan() {
    pMAINFRAME->UpdateStatusWindow(CStatusWnd::SP_PLAY_PLAN);
  }

  virtual void UpdateStatusWindowWithSuitStatus() {
    pMAINFRAME->UpdateStatusWindow(CStatusWnd::SP_SUIT_STATUS);
  }

  virtual void UpdateStatusWindowWithPlayPlanAndSuitStatus() {
    pMAINFRAME->UpdateStatusWindow(CStatusWnd::SP_PLAY_PLAN | CStatusWnd::SP_SUIT_STATUS);
  }

  virtual CDC* GetDC() {
    return pMAINFRAME->GetDC();
  }

  virtual void ReleaseDC(CDC* dc) {
    pMAINFRAME->ReleaseDC(dc);
  }

  virtual void UpdateStatusWindow() {
    pMAINFRAME->UpdateStatusWindow();
  }

  virtual void SetGIBMonitorText(const char* text) {
    pMAINFRAME->SetGIBMonitorText(text);
  }

  virtual bool IsMainFrameExists() {
    return pMAINFRAME != nullptr;
  }

  virtual void SetStatusMessage(const char* msg) {
    pMAINFRAME->SetStatusMessage(msg);
  }

  virtual void ClearAllIndicators() {
    pMAINFRAME->ClearAllIndicators();
  }

  virtual void SetAllIndicators() {
    pMAINFRAME->SetAllIndicators();
  }

  virtual void ExposeAllCards() {
    pMAINFRAME->SendMessage(WM_COMMAND, ID_EXPOSE_ALL_CARDS);
  }

  virtual void UpdateFileCommentsDialog(bool updateVariable = false) {
    CWnd* pWnd = pMAINFRAME->GetDialog(twFileCommentsDialog);
    if (pWnd) {
      pWnd->SendMessage(WM_COMMAND, WMS_UPDATE_TEXT, updateVariable);
    }
  }

  virtual void SetHintDialogText(const char* msg) {
    CAutoHintDialog* pHintDlg = (CAutoHintDialog*)pMAINFRAME->GetDialog(twAutoHintDialog);
    pHintDlg->SetHintText(msg);
  }

  virtual void ClearHintDialog() {
    CAutoHintDialog* pHintDlg = (CAutoHintDialog*)pMAINFRAME->GetDialog(twAutoHintDialog);
    pHintDlg->Clear();
  }

  virtual void SetBiddingHistory(const char* msg, bool useSuitSymbols = false) {
    pMAINFRAME->SetBiddingHistory(msg, useSuitSymbols);
  }

  virtual void SetPlainBiddingHistory(const char* msg) {
    pMAINFRAME->SetPlainBiddingHistory(msg);
  }

  virtual void DisableHintDialog() {
    CAutoHintDialog* pHintDlg = (CAutoHintDialog*)pMAINFRAME->GetDialog(twAutoHintDialog);
    pHintDlg->EnableHintAccept(FALSE);
  }

  virtual void EnableHintDialog() {
    CAutoHintDialog* pHintDlg = (CAutoHintDialog*)pMAINFRAME->GetDialog(twAutoHintDialog);
    pHintDlg->EnableHintAccept(TRUE);
  }

  virtual void RestartCurrentHand() {
    pMAINFRAME->PostMessage(WM_COMMAND, ID_RESTART_CURRENT_HAND, 0);
  }

  virtual void SetStatusText(const char* msg) {
    pMAINFRAME->SetStatusText(msg);
  }

  virtual void HideAutoHintDialog() {
    pMAINFRAME->HideDialog(twAutoHintDialog);
  }

  virtual void SetModeIndicator() {
    pMAINFRAME->SetModeIndicator();
  }

  virtual void DisplayTricks() {
    pMAINFRAME->DisplayTricks();
  }

  virtual void ClearStatusMessage() {
    pMAINFRAME->ClearStatusMessage();
  }

  virtual void ClearAutoHints() {
    pMAINFRAME->ClearAutoHints();
  }

  virtual std::shared_ptr<CRoundFinishedDialog> NewRoundFinishedDialog() {
    return std::make_shared<CRoundFinishedDialog>(pMAINFRAME);
  }

  virtual void MakeGameReviewDialogVisible() {
    pMAINFRAME->MakeDialogVisible(twGameReviewDialog);
  }

  virtual void SetPlayHistory(const char* msg, bool useSuitSymbols = false) {
    pMAINFRAME->SetPlayHistory(msg, useSuitSymbols);
  }

  virtual void SetPlainPlayHistory(const char* msg) {
    pMAINFRAME->SetPlainPlayHistory(msg);
  }

  virtual void SetAutoPlayMode(bool isFullAuto) {
    pMAINFRAME->PostMessage(WM_COMMAND, isFullAuto ? ID_GAME_AUTO_PLAY_EXPRESS : ID_GAME_AUTO_PLAY_ALL);
  }

  virtual void ShowAutoHintDialog() {
    pMAINFRAME->MakeDialogVisible(twAutoHintDialog);
  }

  virtual void FlashBidDialogButton(int bid) {
    CBidDialog* pBidDlg = (CBidDialog*)pMAINFRAME->GetDialog(twBidDialog);
    pBidDlg->SendMessage(WM_COMMAND, WMS_FLASH_BUTTON, bid);
  }

  virtual void RegisterBid(int bid) {
    CBidDialog* pBidDlg = pMAINFRAME->GetBidDialog();
    if (pBidDlg->IsWindowVisible()) {
      pBidDlg->RegisterBid(bid, TRUE);
    }
  }

  virtual void ResetStatusMessage() {
    CMainFrame::ResetStatusMessage();
  }

  virtual const CString GetBiddingHistory() {
    return pMAINFRAME->GetBiddingHistory();
  }

  virtual const CString GetPlayHistory() {
    return pMAINFRAME->GetPlayHistory();
  }

  //////////////////////////////////////////////////////////////////////////
  //
  // pDOC
  //
  //////////////////////////////////////////////////////////////////////////

  virtual bool HasDoc() {
    return pDOC != nullptr;
  }

  virtual std::shared_ptr<Deal> GetDeal() {
    return pDOC->GetDeal();
  }

  virtual void OnNewDocument() {
    pDOC->OnNewDocument();
  }

  virtual void OnDealNewHand() {
    pDOC->OnDealNewHand();
  }

  virtual void EndWaitCursorDoc() {
    pDOC->EndWaitCursorDoc();
  }

  virtual void OnRestartCurrentHand() {
    pDOC->OnRestartCurrentHand();
  }

  virtual void AdvanceToNextPlayer() {
    pDOC->AdvanceToNextPlayer();
  }

  //////////////////////////////////////////////////////////////////////////
  //
  // pVIEW
  //
  //////////////////////////////////////////////////////////////////////////

  virtual void DisplayHand(Position pos) {
    pVIEW->DisplayHand(pos);
  }

  virtual void SetCurrentModeTemp(int mode) {
    pVIEW->SetCurrentModeTemp(mode);
  }

  virtual void RestoreMode() {
    pVIEW->RestoreMode();
  }

  virtual void RefreshScreen() {
    pVIEW->Notify(WM_COMMAND, WMS_REFRESH_DISPLAY);
  }

  virtual bool IsInGameRestoreMode() {
    return pVIEW->GetCurrentMode() == CEasyBView::MODE_GAMERESTORE;
  }

  virtual void PlayCard(CCard* card, int shift) {
    pVIEW->PostMessage(WM_COMMAND, WMS_CARD_PLAY + shift, (int)card);
  }

  virtual int GetSuitToScreenIndex(int suit) {
    return pVIEW->GetSuitToScreenIndex(suit);
  }
  
  virtual int GetDummySuitToScreenIndex(int suit) {
    return pVIEW->GetSuitToScreenIndex(suit);
  }

  virtual int GetAnimationGranularity() {
    return pVIEW->GetValue(tnAnimationGranularity);
  }

  virtual void EndGameReview() {
    pVIEW->EndGameReview();
  }

  virtual void RestartPlay() {
    pVIEW->PostMessage(WM_COMMAND, WMS_PLAY_RESTART, 0L);
  }

  virtual void RestartBidding() {
    pVIEW->PostMessage(WM_COMMAND, WMS_BIDDING_RESTART, 0L);
  }

  virtual void ClearMode(bool redraw = false) {
    pVIEW->ClearMode(redraw);
  }

  virtual void SuppressRefresh() {
    pVIEW->SuppressRefresh();
  }

  virtual void InitNewRound() {
    pVIEW->InitNewRound();
  }

  virtual void InitNewDeal() {
    pVIEW->Notify(WM_COMMAND, WMS_INITNEWDEAL, 1L);
  }

  virtual void EnableRefresh(bool reset = false) {
    pVIEW->EnableRefresh(reset);
  }

  virtual void ResumeGame() {
    pVIEW->PostMessage(WM_COMMAND, WMS_RESUME_GAME, 0);
  }

  virtual void ResetDummySuitSequence() {
    pVIEW->ResetDummySuitSequence();
  }

  virtual void ClickForNextTrickMode() {
    pVIEW->SetCurrentMode(CEasyBView::MODE_CLICKFORNEXTTRICK);
  }

  virtual void DisplayTricksView() {
    pVIEW->DisplayTricks();
  }

  virtual void PromptLead() {
    pVIEW->PromptLead();
  }

  virtual void WaitCardPlayMode() {
    pVIEW->SetCurrentMode(CEasyBView::MODE_WAITCARDPLAY);
  }

  virtual void GameFinished() {
    pVIEW->GameFinished();
  }

  virtual void BidCurrentHand() {
    pVIEW->PostMessage(WM_COMMAND, ID_BID_CURRENT_HAND, 0L);
  }

  virtual void RestoreGameReview() {
    pVIEW->RestoreGameReview();
  }

  virtual void UpdateDisplay() {
    pVIEW->Notify(WM_COMMAND, WMS_UPDATE_DISPLAY);
  }

  virtual void RefreshDisplay() {
    pVIEW->Notify(WM_COMMAND, WMS_REFRESH_DISPLAY, 1L);
  }

  virtual void ResetDisplay() {
    pVIEW->Notify(WM_COMMAND, WMS_RESET_DISPLAY, 1L);
  }

  virtual CDC* GetWindowDC() {
    CWindowDC* dc = new CWindowDC(pVIEW);
    return dc;
  }

  virtual bool IsInClickForNextTrickMode() {
    return pVIEW->GetCurrentMode() == CEasyBView::MODE_CLICKFORNEXTTRICK;
  }

  virtual void ClearTable() {
    pVIEW->ClearTable();
  }

  virtual void SetWaitSpecialDealMode() {
    pVIEW->SetCurrentMode(CEasyBView::MODE_WAITSPECIALDEAL);
  }

  virtual void SetCurrentMode(int value) {
    pVIEW->SetCurrentMode((CEasyBView::ScreenMode)value);
  }

  virtual bool IsInCardLayoutMode() {
    return pVIEW->GetCurrentMode() == CEasyBView::MODE_CARDLAYOUT;
  }

  virtual int GetCurrentMode() {
    return pVIEW->GetCurrentMode();
  }


  //////////////////////////////////////////////////////////////////////////
  //
  // Global
  //
  //////////////////////////////////////////////////////////////////////////

  virtual const CString ContractToFullString(int contract, int modifier) {
    return ::ContractToFullString(contract, modifier);
  }

  virtual const char* PositionToString(int pos) {
    return ::PositionToString(pos);
  }

  virtual const CString BidToFullString(int bid) {
    return ::BidToFullString(bid);
  }

  virtual const CString BidToShortString(int bid) {
    return ::BidToShortString(bid);
  }

  virtual int GetPlayerTeam(int position) {
    return ::GetPlayerTeam(position);
  }

  virtual int GetNextPlayer(int position) {
    return ::GetNextPlayer(position);
  }

  virtual int GetNextSuit(int suit) {
    return ::GetNextSuit(suit);
  }

  virtual CString FormString(const char* format, const char* arg1, const char* arg2, const char* arg3, const char* arg4, const char* arg5, const char* arg6) {
    return ::FormString(format, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  virtual CString FormString(const char* format, const char* arg1, const char* arg2, const char* arg3, const char* arg4, const char* arg5) {
    return ::FormString(format, arg1, arg2, arg3, arg4, arg5);
  }

  virtual CString FormString(const char* format, const char* arg1, const char* arg2, const char* arg3) {
    return ::FormString(format, arg1, arg2, arg3);
  }

  virtual CString FormString(const char* format, const char* arg1, const char* arg2) {
    return ::FormString(format, arg1, arg2);
  }

  virtual CString FormString(const char* format, int arg1, int arg2) {
    return ::FormString(format, arg1, arg2);
  }

  virtual CString FormString(const char* format, const char* arg1, int arg2) {
    return ::FormString(format, arg1, arg2);
  }

  virtual CString FormString(const char* format, const char* arg1) {
    return ::FormString(format, arg1);
  }

  virtual CString FormString(const char* format, int arg1) {
    return ::FormString(format, arg1);
  }

  virtual CString FormString(const char* format, unsigned char arg1) {
    return ::FormString(format, arg1);
  }

  virtual CString ContractToString(int contract, int modifier) {
    return ::ContractToString(contract, modifier);
  }

  virtual int GetPrevPlayer(int position) {
    return ::GetPrevPlayer(position);
  }

  virtual int GetPrevSuit(int suit) {
    return ::GetPrevSuit(suit);
  }

  virtual bool IsHonor(int faceValue) {
    return ::IsHonor(faceValue) == TRUE;
  }

  virtual const char* TeamToString(int team) {
    return ::TeamToString(team);
  }

  virtual int StringToDeckValue(const char* str) {
    return ::StringToDeckValue(str);
  }

  virtual int GetRandomValue(int max) {
    return ::GetRandomValue(max);
  }

  virtual const char* PositionToShortString(int pos) {
    return ::PositionToShortString(pos);
  }

  virtual int GetOpposingTeam(int team) {
    return ::GetOpposingTeam(team);
  }

  virtual int GetPartner(int pos) {
    return ::GetPartner(pos);
  }

  virtual int StringToPosition(const char* str) {
    return ::StringToPosition(str);
  }

  virtual const char PositionToChar(int pos) {
    return ::PositionToChar(pos);
  }

  virtual const CString BidToPBNString(int bid) {
    return ::BidToPBNString(bid);
  }

  virtual CString WrapInQuotes(const CString& item) {
    return ::WrapInQuotes(item);
  }

  virtual CString StripQuotes(const CString& item) {
    return ::StripQuotes(item);
  }

  virtual int CharToPosition(char c) {
    return ::CharToPosition(c);
  }

  virtual int StringToBid(const char* str) {
    return ::StringToBid(str);
  }

  virtual int ContractStringToBid(const char* str) {
    return ::ContractStringToBid(str);
  }

  virtual int ContractParamsToBid(int suit, int level) {
    return ::ContractParamsToBid(suit, level);
  }

  virtual int TimeGetTime() {
    return timeGetTime();
  }

  virtual void DisplayScoreDialog(std::vector<CString> bonusPoints, std::vector<CString> trickPoints, CString totalPoints) {
    CScoreDialog scoreDialog;
    scoreDialog.SetBonusPoints(bonusPoints);
    scoreDialog.SetTrickPoints(trickPoints);
    scoreDialog.SetTotalPoints(totalPoints);

    scoreDialog.DoModal();
  }

  virtual int DisplaySelectHandDialog(int position) {
    // ask for the position to assume
    CSelectHandDialog handDialog;
    handDialog.m_strTitle = "Select Hand to Play";
    handDialog.m_nMode = CSelectHandDialog::SH_MODE_HAND;
    
    handDialog.m_nPosition = position;
    if (!handDialog.DoModal()) {
      return -1;
    }

    return handDialog.m_nPosition;
  }

  virtual int DisplayRoundFinishedDialog(bool isReplayMode, bool isGameReviewAvailable, CString message, CString oldMessage) {
    std::shared_ptr<CRoundFinishedDialog> roundFinishedDlg = NewRoundFinishedDialog();
    // if replaying, keep old comparison message
    if (isReplayMode) {
      roundFinishedDlg->SetMessage(message);
    } else {
      roundFinishedDlg->SetMessage(message, oldMessage);
    }

    // disable "cancel" button if reviewing game
    if (isGameReviewAvailable)
      roundFinishedDlg->m_bDisableCancel = true;

    //
    roundFinishedDlg->m_bReplayMode = isReplayMode;
    BOOL bCode = roundFinishedDlg->DoModal();
    if (bCode) {
      return -1;
    }
    return roundFinishedDlg->m_nCode;
  }
};

