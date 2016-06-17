#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "mock_app.h"
#include "../src/engine/PlayerStatusDialog.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {   

class PlayerStatusDialogTests : public Test {
protected:
  shared_ptr<MockApp> app = make_shared<MockApp>();
  CPlayerStatusDialog p = CPlayerStatusDialog(app);
};

TEST_F(PlayerStatusDialogTests, Init) {
  EXPECT_CALL(*app, InExpressAutoPlay()).WillOnce(Return(false));
  EXPECT_CALL(*app, IsShowCommentIdentifiers()).WillOnce(Return(false));
  EXPECT_CALL(*app, IsEnableAnalysisTracing()).WillRepeatedly(Return(true));
  EXPECT_CALL(*app, AnalysisTraceLevel()).WillOnce(Return(5));
  EXPECT_CALL(*app, SetAnalysisText(_, _)).Times(1);
  EXPECT_CALL(*app, SetAutoHintDialogHintText(_)).Times(0);

  p << "!Hello\nWorld";  
}

} // namespace UnitTests
