#include "stdafx.h"
#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "mock_app.h"
#include "../src/engine/PlayerStatusDialog.h"

using ::testing::AtLeast;
using ::testing::Return;
using ::testing::_;

namespace UnitTests {   

class PlayerStatusDialogTests : public ::testing::Test {
protected:
  PlayerStatusDialogTests() {
    p = new CPlayerStatusDialog((AppInterface*)&app);
  }

  virtual ~PlayerStatusDialogTests() {
    delete p;
  }

  CPlayerStatusDialog* p;
  MockApp app;
};

TEST_F(PlayerStatusDialogTests, Init) {
  EXPECT_CALL(app, InExpressAutoPlay()).WillOnce(Return(false));
  EXPECT_CALL(app, IsShowCommentIdentifiers()).WillOnce(Return(false));
  EXPECT_CALL(app, IsEnableAnalysisTracing()).WillRepeatedly(Return(true));
  EXPECT_CALL(app, AnalysisTraceLevel()).WillOnce(Return(5));
  EXPECT_CALL(app, SetAnalysisText(_, _)).Times(1);
  EXPECT_CALL(app, SetAutoHintDialogHintText(_)).Times(0);

  *p << "!Hello\nWorld";  
}

} // namespace UnitTests
