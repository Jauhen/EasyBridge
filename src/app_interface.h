#pragma once

#include "EasyB.h"

class CGIB;
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

  virtual bool IsEnableAnalysisTracing() = 0;
  virtual int AnalysisTraceLevel() = 0;
  virtual bool InExpressAutoPlay() = 0;
  virtual bool IsShowCommentIdentifiers() = 0;
  virtual bool IsEnableAnalysisDuringHints() = 0;
  virtual std::shared_ptr<ConventionPool> GetConventionPool() = 0;
  virtual double GamePts() = 0;
  virtual double MajorSuitGamePts() = 0;
  virtual double MinorSuitGamePts() = 0;
  virtual double NTGamePts() = 0;
  virtual double FourthLevelPts() = 0;
  virtual double ThirdLevelPts() = 0;
  virtual double SecondLevelPts() = 0;
  virtual double SlamPts() = 0;
  virtual double SmallSlamPts() = 0;
  virtual double GrandSlamPts() = 0;
  virtual CConventionSet* GetCurrentConventionSet() = 0;
  virtual double OpenPoints(double points) = 0;
  virtual double PointCount(double points) = 0;
  virtual int GetMinimumOpeningValue(CPlayer* player) const = 0;
  virtual int GetProfileInt(const char* appName, const char* keyName, int defaultValue) = 0;
  virtual void WriteProfileInt(const char* appName, const char* keyName, int defaultValue) = 0;
  virtual bool IsInManualCardPlayMode() = 0;
  virtual bool AreCardsFaceUp() = 0;
  virtual bool IsEnableGIBForDeclarer() = 0;
  virtual CGIB& GetGIB() = 0;
  virtual bool IsInExpressAutoPlay() = 0;
  virtual bool IsComputerCanClaim() = 0;
  virtual int InvokeGIB(CGIB& gib, CPlayer* player, CHandHoldings* hand, CHandHoldings* dummyHand, CPlayerStatusDialog* statusDialog) = 0;
  virtual bool IsEnableGIBForDefender() = 0;
  virtual double GetHonorValue(int faceValue) = 0;
  virtual int GetSuitSequence(int suit) const = 0;
  virtual bool IsAcelessPenalty() = 0;
  virtual bool IsFourAceBonus() = 0;
  virtual bool IsCountShortSuits() = 0;
  virtual bool IsPenalizeUGHonors() = 0;
  virtual bool IsInAutoHintMode() = 0;
  virtual bool IsInsertBiddingPause() = 0;
  virtual int GetPlayPauseLength() = 0;
  virtual std::shared_ptr<CDeck> GetDeck() = 0;
  virtual bool IsLowResOption() = 0;
  virtual bool IsEnableDealNumbering() = 0;
  virtual void SetFeedbackText(const char* msg) = 0;
  virtual int GetRequiredPointsForGame(int suitCode, int side /* 0 - min, 1 - max */) = 0;
  virtual int GetRequiredPointsForSlam(int suitCode, int side /* 0 - min, 1 - max */) = 0;
  virtual int GetMinSuitDistributions(int code) = 0;
  virtual int GetMinSuitDistributionsTable(int code, int distribution, int hand) = 0;
  virtual int GetMaxImbalanceForNT() = 0;
  virtual bool IsNeedTwoBalancedTrumpHands() = 0;
  virtual int GetMinCardsInMajor() = 0;
  virtual int GetMinTopMajorCard() = 0;
  virtual int GetMinCardsInMinor() = 0;
  virtual int GetMinTopMinorCard() = 0;
  virtual int GetAcesForSlam(int slamCode) = 0;
  virtual int GetKingsForSlam(int slamCode) = 0;
  virtual bool IsBalaceTeamHands() = 0;
  virtual bool IsFullAutoPlayMode() = 0;
  virtual bool IsFullAutoExpressPlayMode() = 0;
  virtual void SetNormalPlayMode() = 0;
  virtual void SetRubberInProgress(bool value) = 0;
  virtual void SetGameInProgress(bool value) = 0;
  virtual void SetBiddingInProgress(bool value) = 0;
  virtual const char* GetProgramTitle() = 0;
  virtual int GetProgramMajorVersion() = 0;
  virtual int GetProgramMinorVersion() = 0;
  virtual int GetProgramIncrementVersion() = 0;
  virtual int GetProgramBuildNumber() = 0;
  virtual const char* GetProgramBuildDate() = 0;
  virtual bool IsRubberInProgress() = 0;
  virtual bool IsGameInProgress() = 0;
  virtual bool IsBiddingInProgress() = 0;
  virtual CString GetProgramVersionString() = 0;

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

  virtual CCard* GetCurrentTrickCardLed() = 0;
  virtual int GetValidBidRecord(int index) const = 0;
  virtual int	GetLastValidBid() const = 0;
  virtual int GetBiddingRound() const = 0;
  virtual int GetNumBidsMade() const = 0;
  virtual int GetBidByPlayer(int position, int round) const = 0;
  virtual int GetBidByPlayer(CPlayer* player, int round) const = 0;
  virtual int	GetDealer() const = 0;
  virtual bool IsBidValid(int bid) = 0;
  virtual int GetBidByIndex(int index) const = 0;
  virtual CPlayer* GetPlayer(int position) const = 0;
  virtual int	GetContract() const = 0;
  virtual int GetContractModifier() const = 0;
  virtual int	GetDeclarerPosition() const = 0;
  virtual int	GetRoundLead() const = 0;
  virtual int	GetLastValidBidTeam() const = 0;
  virtual bool IsDocInitialized() = 0;
  virtual int GetOpeningBid() const = 0;
  virtual int GetNumValidBidsMade() const = 0;
  virtual int GetOpeningBidder() const = 0;
  virtual int GetCurrentPlayerPosition() const = 0;
  virtual int GetNumCardsPlayedInRound() const = 0;
  virtual CPlayer* GetCurrentPlayer() const = 0;
  virtual CCard* GetCurrentTrickCardByOrder(int order) const = 0;
  virtual int GetTrumpSuit() const = 0;
  virtual bool WasTrumpPlayed() const = 0;
  virtual CCard* GetCurrentTrickCard(int position) const = 0;
  virtual CCard* GetCurrentTrickHighCard() const = 0;
  virtual CCard* GetCurrentTrickHighCard(int* pos) const = 0;
  virtual void ClaimTricks(Position position, int tricks = 0) = 0;
  virtual int GetPlayRound() const = 0;
  virtual int GetNumTricksPlayed() const = 0;
  virtual int GetNumCardsPlayedInGame() const = 0;
  virtual int GetNumberOfTricksWonByTeam(int team) const = 0;
  virtual int GetContractLevel() const = 0;
  virtual int GetNumTricksRemaining() const = 0;
  virtual int GetGameTrickWinner(int round) const = 0;
  virtual CPlayer* GetDummyPlayer() const = 0;
  virtual int GetDummyPosition() const = 0;
  virtual int GetGameTrickLead(int round) const = 0;
  virtual CCard* GetGameTrickCard(int round, int position) const = 0;
  virtual int GetNumTricksWonByTeam(int team) const = 0;
  virtual bool IsReviewingGame() = 0;
  virtual CPlayer* GetRoundLeadPlayer() const = 0;
  virtual int GetContractSuit() const = 0;
  virtual bool IsTeamVulnerable(int team) = 0;
  virtual bool IsDummyExposed() const = 0;
  virtual int GetSuitsUnbid(CArray<int, int> &suits) const = 0;
  virtual int GetDeclaringTeam() const = 0;
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
  virtual void AdvanceToNextPlayer() = 0;
  virtual void ClickForNextTrickMode() = 0;
  virtual void DisplayTricksView() = 0;
  virtual void PromptLead() = 0;
  virtual void WaitCardPlayMode() = 0;
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


  //////////////////////////////////////////////////////////////////////////
  //
  // Global
  //
  //////////////////////////////////////////////////////////////////////////

  virtual const CString ContractToFullString(int contract, int modifier) = 0;
  virtual const char* PositionToString(int pos) = 0;
  virtual const char* SuitToSingularString(int suit) = 0;
  virtual const CString BidToFullString(int bid) = 0;
  virtual char GetCardLetter(int i) = 0;
  virtual char GetSuitLetter(int i) = 0;
  virtual const char* SuitToString(int suit) = 0;
  virtual const CString BidToShortString(int bid) = 0;
  virtual int GetPlayerTeam(int position) = 0;
  virtual int GetNextPlayer(int position) = 0;
  virtual int GetNextSuit(int suit) = 0;
  virtual CString FormString(const char* format, const char* arg1, const char* arg2, const char* arg3, const char* arg4, const char* arg5, const char* arg6) = 0;
  virtual CString FormString(const char* format, const char* arg1, const char* arg2, const char* arg3, const char* arg4, const char* arg5) = 0;
  virtual CString FormString(const char* format, const char* arg1, const char* arg2, const char* arg3) = 0;
  virtual CString FormString(const char* format, const char* arg1, const char* arg2) = 0;
  virtual CString FormString(const char* format, int arg1, int arg2) = 0;
  virtual CString FormString(const char* format, const char* arg1, int arg2) = 0;
  virtual CString FormString(const char* format, const char* arg1) = 0;
  virtual CString FormString(const char* format, int arg1) = 0;
  virtual CString FormString(const char* format, unsigned char arg1) = 0;
  virtual CString ContractToString(int contract, int modifier) = 0;
  virtual const char* CardValToString(int i) = 0;
  virtual int GetPrevPlayer(int position) = 0;
  virtual int GetPrevSuit(int suit) = 0;
  virtual bool IsHonor(int faceValue) = 0;
  virtual const CString CardToString(int deckValue) = 0;
  virtual const char* TeamToString(int team) = 0;
  virtual const CString CardToShortString(int deckValue) = 0;
  virtual const char* GetSuitName(int suit) = 0;
  virtual const char* GetCardName(int faceValue) = 0;
  virtual const CString CardToReverseString(int faceValue) = 0;
  virtual int StringToDeckValue(const char* str) = 0;
  virtual int GetRandomValue(int max) = 0;
  virtual const char* PositionToShortString(int pos) = 0;
  virtual int GetOpposingTeam(int team) = 0;
  virtual int GetPartner(int pos) = 0;
  virtual int StringToPosition(const char* str) = 0;
  virtual int CharToSuit(char c) = 0;
  virtual const char PositionToChar(int pos) = 0;
  virtual int CharToFaceValue(char c) = 0;
  virtual const CString BidToPBNString(int bid) = 0;
  virtual CString WrapInQuotes(const CString& item) = 0;
  virtual CString StripQuotes(const CString& item) = 0;
  virtual int CharToPosition(char c) = 0;
  virtual int StringToBid(const char* str) = 0;
  virtual int ContractStringToBid(const char* str) = 0;
  virtual int ContractParamsToBid(int suit, int level) = 0;
  virtual int TimeGetTime() = 0;
};
