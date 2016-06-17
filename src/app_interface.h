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
  // Global
  //
  //////////////////////////////////////////////////////////////////////////

  virtual const CString ContractToFullString(int contract, int modifier) = 0;
  virtual const char* PositionToString(int pos) = 0;
};
