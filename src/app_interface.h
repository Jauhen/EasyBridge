#pragma once
#include <memory>
#include <vector>
#include "engine/card_constants.h"

class Settings;
class ConventionPool;
class Deal;
class CConventionSet;
class CGIB;
class CCard;
class CDeck;
class CPlayer;
class CHandHoldings;
class CPlayerStatusDialog;
class CRoundFinishedDialog;
class CAutoHintDialog;

class AppInterface {
public:
  virtual ~AppInterface() {};

  //////////////////////////////////////////////////////////////////////////
  //
  // The App
  //
  //////////////////////////////////////////////////////////////////////////

  virtual std::shared_ptr<Settings> GetSettings() = 0;
  virtual std::shared_ptr<ConventionPool> GetConventionPool() = 0;
  virtual CConventionSet* GetCurrentConventionSet() = 0;
  virtual bool AreCardsFaceUp() = 0;
  virtual CGIB& GetGIB() = 0;
  virtual int InvokeGIB(CGIB& gib, CPlayer* player, CHandHoldings* hand, CHandHoldings* dummyHand, CPlayerStatusDialog* statusDialog) = 0;
  virtual std::shared_ptr<CDeck> GetDeck() = 0;
  virtual void SetFeedbackText(const char* msg) = 0;


  //////////////////////////////////////////////////////////////////////////
  //
  // pMAINFRAME
  //
  //////////////////////////////////////////////////////////////////////////

  virtual void SetAutoHintDialogHintText(CString text) = 0;
  virtual void ShowAnalysisDialog(Position position) = 0;
  virtual void HideAnalysisDialog(Position position) = 0;
  virtual void SetAnalysisText(Position position, CString analysis) = 0;
  virtual void SuspendHints() = 0;
  virtual void ResumeHints() = 0;
  virtual void UpdateStatusWindowWithPlayPlan() = 0;
  virtual void UpdateStatusWindowWithSuitStatus() = 0;
  virtual void UpdateStatusWindowWithPlayPlanAndSuitStatus() = 0;
  virtual CDC* GetDC() = 0;
  virtual void ReleaseDC(CDC* dc) = 0;
  virtual void UpdateStatusWindow() = 0;
  virtual void SetGIBMonitorText(const char* text) = 0;
  virtual bool IsMainFrameExists() = 0;
  virtual void SetStatusMessage(const char* msg) = 0;
  virtual void ClearAllIndicators() = 0;
  virtual void SetAllIndicators() = 0;
  virtual void ExposeAllCards() = 0;
  virtual void UpdateFileCommentsDialog(bool updateVariable = false) = 0;
  virtual void SetHintDialogText(const char* msg) = 0;
  virtual void ClearHintDialog() = 0;
  virtual void SetBiddingHistory(const char* msg, bool useSuitSymbols = false) = 0;
  virtual void SetPlainBiddingHistory(const char* msg) = 0;
  virtual void DisableHintDialog() = 0;
  virtual void EnableHintDialog() = 0;
  virtual void RestartCurrentHand() = 0;
  virtual void SetStatusText(const char* msg) = 0;
  virtual void HideAutoHintDialog() = 0;
  virtual void SetModeIndicator() = 0;
  virtual void DisplayTricks() = 0;
  virtual void ClearStatusMessage() = 0;
  virtual void ClearAutoHints() = 0;
  virtual std::shared_ptr<CRoundFinishedDialog> NewRoundFinishedDialog() = 0;
  virtual void MakeGameReviewDialogVisible() = 0;
  virtual void SetPlayHistory(const char* msg, bool useSuitSymbols = false) = 0;
  virtual void SetPlainPlayHistory(const char* msg) = 0;
  virtual void SetAutoPlayMode(bool isFullAuto) = 0;
  virtual void ShowAutoHintDialog() = 0;
  virtual void FlashBidDialogButton(int bid) = 0;
  virtual void RegisterBid(int bid) = 0;
  virtual void ResetStatusMessage() = 0;
  virtual const CString GetBiddingHistory() = 0;
  virtual const CString GetPlayHistory() = 0;


  //////////////////////////////////////////////////////////////////////////
  //
  // pDOC
  //
  //////////////////////////////////////////////////////////////////////////

  virtual bool HasDoc() = 0;
  virtual std::shared_ptr<Deal> GetDeal() = 0;
  virtual void OnNewDocument() = 0;
  virtual void OnDealNewHand() = 0;
  virtual void EndWaitCursorDoc() = 0;
  virtual void OnRestartCurrentHand() = 0;


  //////////////////////////////////////////////////////////////////////////
  //
  // pVIEW
  //
  //////////////////////////////////////////////////////////////////////////

  virtual void DisplayHand(Position pos) = 0;
  virtual void SetCurrentModeTemp(int mode) = 0;
  virtual void RestoreMode() = 0;
  virtual void RefreshScreen() = 0;
  virtual bool IsInGameRestoreMode() = 0;
  virtual void PlayCard(CCard* card, int shift) = 0;
  virtual int GetSuitToScreenIndex(int suit) = 0;
  virtual int GetDummySuitToScreenIndex(int suit) = 0;
  virtual int GetAnimationGranularity() = 0;
  virtual void EndGameReview() = 0;
  virtual void RestartPlay() = 0;
  virtual void RestartBidding() = 0;
  virtual void ClearMode(bool redraw = false) = 0;
  virtual void SuppressRefresh() = 0;
  virtual void InitNewRound() = 0;
  virtual void InitNewDeal() = 0;
  virtual void EnableRefresh(bool reset = false) = 0;
  virtual void ResumeGame() = 0;
  virtual void ResetDummySuitSequence() = 0;
  virtual void ClickForNextTrickMode() = 0;
  virtual void DisplayTricksView() = 0;
  virtual void PromptLead() = 0;
  virtual void WaitCardPlayMode() = 0;
  virtual void NonePlayMode() = 0;
  virtual void GameFinished() = 0;
  virtual void BidCurrentHand() = 0;
  virtual void RestoreGameReview() = 0;
  virtual void UpdateDisplay() = 0;
  virtual void RefreshDisplay() = 0;
  virtual void ResetDisplay() = 0;
  virtual CDC* GetWindowDC() = 0;
  virtual bool IsInClickForNextTrickMode() = 0;
  virtual void ClearTable() = 0;
  virtual void SetWaitSpecialDealMode() = 0;
  virtual void SetCurrentMode(int value) = 0;
  virtual bool IsInCardLayoutMode() = 0;
  virtual int GetCurrentMode() = 0;
  virtual void SetPrompt(const char* msg) = 0;
  virtual void JumpCursor() = 0;


  //////////////////////////////////////////////////////////////////////////
  //
  // Global
  //
  //////////////////////////////////////////////////////////////////////////

  virtual const char* GetToday() = 0;
  virtual int TimeGetTime() = 0;
  virtual void DisplayScoreDialog(std::vector<CString> bonusPoints, std::vector<CString> trickPoints, CString totalPoints) = 0;
  virtual int DisplaySelectHandDialog(int position) = 0;
  virtual int DisplayRoundFinishedDialog(bool isReplayMode, bool isGameReviewAvailable, CString message, CString oldMessage) = 0;
};
