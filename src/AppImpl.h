#pragma once
#include "stdafx.h"
#include "app_interface.h"
#include "EasyB.h"

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
};

