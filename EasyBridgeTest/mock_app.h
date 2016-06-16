#pragma once
#include <gmock/gmock.h>
#include "app_interface.h"

class MockApp : public AppInterface {
public:
  MOCK_METHOD0(IsEnableAnalysisTracing, bool());
  MOCK_METHOD0(AnalysisTraceLevel, int());
  MOCK_METHOD0(InExpressAutoPlay, bool());
  MOCK_METHOD0(IsShowCommentIdentifiers, bool());
  MOCK_METHOD1(SetAutoHintDialogHintText, void(CString text));
  MOCK_METHOD1(ShowAnalysisDialog, void(Position position));
  MOCK_METHOD1(HideAnalysisDialog, void(Position position));
  MOCK_METHOD2(SetAnalysisText, void(Position position, CString analysis));
};
