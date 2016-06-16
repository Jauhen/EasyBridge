#pragma once

#include "EasyB.h"

class CAutoHintDialog;

class AppInterface {
public:
  virtual ~AppInterface() {};

  // The App Interface
  virtual bool IsEnableAnalysisTracing() = 0;
  virtual int AnalysisTraceLevel() = 0;
  virtual bool InExpressAutoPlay() = 0;
  virtual bool IsShowCommentIdentifiers() = 0;

  virtual void SetAutoHintDialogHintText(CString text) = 0;

  virtual void ShowAnalysisDialog(Position position) = 0;
  virtual void HideAnalysisDialog(Position position) = 0;

  virtual void SetAnalysisText(Position position, CString analysis) = 0;
};
