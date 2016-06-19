#pragma once
#include "stdafx.h"
#include "app_interface.h"
#include "EasyB.h"
#include "dialogs/AutoHintDialog.h"
#include "MainFrameopts.h"

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


  //////////////////////////////////////////////////////////////////////////
  //
  // pDOC
  //
  //////////////////////////////////////////////////////////////////////////

  virtual CCard* GetCurrentTrickCardLed() {
    return pDOC->GetCurrentTrickCardLed();
  }

  virtual int GetValidBidRecord(int index) const {
    return pDOC->GetValidBidRecord(index);
  }

  virtual int	GetLastValidBid() const {
    return pDOC->GetLastValidBid();
  }

  virtual int GetBiddingRound() const {
    return pDOC->GetBiddingRound();
  }

  virtual int GetNumBidsMade() const {
    return pDOC->GetNumBidsMade();
  }

  virtual int GetBidByPlayer(int position, int round) const {
    return pDOC->GetBidByPlayer(position, round);
  }

  virtual int GetBidByPlayer(CPlayer* player, int round) const {
    return pDOC->GetBidByPlayer(player, round);
  }

  virtual int	GetDealer() const {
    return pDOC->GetDealer();
  }

  virtual bool IsBidValid(int bid) {
    return pDOC->IsBidValid(bid) == TRUE;
  }

  virtual int GetBidByIndex(int index) const {
    return pDOC->GetBidByIndex(index);
  }

  virtual CPlayer* GetPlayer(int position) const {
    return pDOC->GetPlayer(position);
  }

  virtual int	GetContract() const {
    return pDOC->GetContract();
  }

  virtual int GetContractModifier() const {
    return pDOC->GetContractModifier();
  }

  virtual int	GetDeclarerPosition() const {
    return pDOC->GetDeclarerPosition();
  }

  virtual int	GetRoundLead() const {
    return pDOC->GetRoundLead();
  }

  virtual int	GetLastValidBidTeam() const {
    return pDOC->GetLastValidBidTeam();
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

  virtual const char* SuitToSingularString(int suit) {
    return ::SuitToSingularString(suit);
  }

  virtual const CString BidToFullString(int bid) {
    return ::BidToFullString(bid);
  }

  virtual char GetCardLetter(int i) {
    return ::GetCardLetter(i);
  }

  virtual char GetSuitLetter(int i) {
    return ::GetSuitLetter(i);
  }
};

