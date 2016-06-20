#pragma once

#include "EasyB.h"

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


  //////////////////////////////////////////////////////////////////////////
  //
  // pMAINFRAME
  //
  //////////////////////////////////////////////////////////////////////////

  virtual void SetAutoHintDialogHintText(CString text) = 0;
  virtual void ShowAnalysisDialog(Position position) = 0;
  virtual void HideAnalysisDialog(Position position) = 0;
  virtual void SetAnalysisText(Position position, CString analysis) = 0;


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


  //////////////////////////////////////////////////////////////////////////
  //
  // pVIEW
  //
  //////////////////////////////////////////////////////////////////////////

  virtual void DisplayHand(Position pos) = 0;
  virtual void SetCurrentModeTemp(int mode) = 0;
  virtual void RestoreMode() = 0;


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
};
