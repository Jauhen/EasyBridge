#pragma once

#include "EasyB.h"

class CGIB;
class CHandHoldings;
class CPlayerStatusDialog;
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
  virtual CString FormString(const char* format, const char* arg1) = 0;
  virtual CString FormString(const char* format, int arg1) = 0;
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
};
