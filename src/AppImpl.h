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

  virtual std::shared_ptr<Settings> GetSettings() {
    return theApp.GetSettings();
  }

  virtual std::shared_ptr<ConventionPool> GetConventionPool() {
    return theApp.GetConventionPool();
  }

  virtual CConventionSet* GetCurrentConventionSet() {
    return pCurrConvSet;
  }

  virtual bool AreCardsFaceUp() {
    return theApp.AreCardsFaceUpSettings() == TRUE;
  }

  virtual CGIB& GetGIB() {
    return *(theApp.GetGIB());
  }

  virtual int InvokeGIB(CGIB& gib, CPlayer* player, CHandHoldings* hand, CHandHoldings* dummyHand, CPlayerStatusDialog* statusDialog) {
    return gib.Invoke(player, hand, dummyHand, statusDialog);
  }

  virtual std::shared_ptr<CDeck> GetDeck() {
    return theApp.GetDeck();
  }

  virtual void SetFeedbackText(const char* msg) {
    ((CMainFrame*)theApp.GetFrame())->SetFeedbackText(msg);
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
    pVIEW->PostMessage(WM_COMMAND, WMS_CARD_PLAY + shift, (WPARAM)card);
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

  virtual const char* GetToday() {
    CTime time = CTime::GetCurrentTime();
    return time.Format("%Y.%m.%d");
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

