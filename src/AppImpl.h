#pragma once
#include "stdafx.h"
#include "app_interface.h"
#include "EasyB.h"
#include "dialogs/AutoHintDialog.h"
#include "StatusWnd.h"
#include "MainFrameopts.h"
#include "GIB.h"
#include "docopts.h"

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

  virtual bool IsDocInitialized() {
    return pDOC && pDOC->IsInitialized();
  }

  virtual int GetOpeningBid() const {
    return pDOC->GetOpeningBid();
  }

  virtual int GetNumValidBidsMade() const {
    return pDOC->GetNumValidBidsMade();
  }

  virtual int GetOpeningBidder() const {
    return pDOC->GetOpeningBidder();
  }

  virtual int GetCurrentPlayerPosition() const {
    return pDOC->GetCurrentPlayerPosition();
  }

  virtual int GetNumCardsPlayedInRound() const {
    return pDOC->GetNumCardsPlayedInRound();
  }

  virtual CPlayer* GetCurrentPlayer() const {
    return pDOC->GetCurrentPlayer();
  }

  virtual CCard* GetCurrentTrickCardByOrder(int order) const {
    return pDOC->GetCurrentTrickCardByOrder(order);
  }

  virtual int GetTrumpSuit() const {
    return pDOC->GetTrumpSuit();
  }

  virtual bool WasTrumpPlayed() const {
    return pDOC->WasTrumpPlayed() == TRUE;
  }

  virtual CCard* GetCurrentTrickCard(int position) const {
    return pDOC->GetCurrentTrickCard(position);
  }

  virtual CCard* GetCurrentTrickHighCard() const {
    return pDOC->GetCurrentTrickHighCard();
  }

  virtual CCard* GetCurrentTrickHighCard(int* pos) const {
    return pDOC->GetCurrentTrickHighCard(pos);
  }

  virtual void ClaimTricks(Position position, int tricks = 0) {
    pDOC->ClaimTricks(position, tricks);
  }

  virtual int GetPlayRound() const {
    return pDOC->GetPlayRound();
  }

  virtual int GetNumTricksPlayed() const {
    return pDOC->GetNumTricksPlayed();
  }

  virtual int GetNumCardsPlayedInGame() const {
    return pDOC->GetNumCardsPlayedInGame();
  }

  virtual int GetNumberOfTricksWonByTeam(int team) const {
    return pDOC->GetValue(tnumTricksWon, team);
  }

  virtual int GetContractLevel() const {
    return pDOC->GetContractLevel();
  }

  virtual int GetNumTricksRemaining() const {
    return pDOC->GetNumTricksRemaining();
  }

  virtual int GetGameTrickWinner(int round) const {
    return pDOC->GetGameTrickWinner(round);
  }

  virtual CPlayer* GetDummyPlayer() const {
    return pDOC->GetDummyPlayer();
  }

  virtual int GetDummyPosition() const {
    return pDOC->GetDummyPosition();
  }

  virtual int GetGameTrickLead(int round) const {
    return pDOC->GetGameTrickLead(round);
  }

  virtual CCard* GetGameTrickCard(int round, int position) const {
    return pDOC->GetGameTrickCard(round, position);
  }

  virtual int GetNumTricksWonByTeam(int team) const {
    return pDOC->GetNumTricksWonByTeam(team);
  }

  virtual bool IsReviewingGame() {
    return pDOC->IsReviewingGame() == TRUE;
  }

  virtual CPlayer* GetRoundLeadPlayer() const {
    return pDOC->GetRoundLeadPlayer();
  }

  virtual int GetContractSuit() const {
    return pDOC->GetContractSuit();
  }

  virtual bool IsTeamVulnerable(int team) {
    return pDOC->IsTeamVulnerable(team) == TRUE;
  }

  virtual bool IsDummyExposed() const {
    return pDOC->IsDummyExposed();
  }
  
  virtual int GetSuitsUnbid(CArray<int, int> &suits) const {
    return pDOC->GetSuitsBid(suits);
  }

  virtual int GetDeclaringTeam() const {
    return pDOC->GetDeclaringTeam();
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

  virtual const char* SuitToString(int suit) {
    return ::SuitToString(suit);
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

  virtual CString FormString(const char* format, const char* arg1) {
    return ::FormString(format, arg1);
  }

  virtual CString FormString(const char* format, int arg1) {
    return ::FormString(format, arg1);
  }

  virtual CString ContractToString(int contract, int modifier) {
    return ::ContractToString(contract, modifier);
  }

  virtual const char* CardValToString(int i) {
    return ::CardValToString(i);
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

  virtual const CString CardToString(int deckValue) {
    return ::CardToString(deckValue);
  }

  virtual const char* TeamToString(int team) {
    return ::TeamToString(team);
  }
};

