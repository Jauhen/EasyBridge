#pragma once
#include "stdafx.h"
#include "app_interface.h"
#include "EasyB.h"

class AppImpl : public AppInterface {
public:

  AppImpl() {}

  virtual ~AppImpl() {}

  virtual bool IsEnableAnalysisTracing() {
    return theApp.GetValue(tbEnableAnalysisTracing) == TRUE;
  }

  virtual int AnalysisTraceLevel() {
    return theApp.GetValue(tnAnalysisTraceLevel);
  }

  virtual bool InExpressAutoPlay() {
    return theApp.InExpressAutoPlay() == TRUE;
  }

  virtual bool IsShowCommentIdentifiers() {
    return theApp.GetValue(tbShowCommentIdentifiers) == TRUE;
  }

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
};

