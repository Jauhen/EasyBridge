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
  shared_ptr<Settings> settings = make_shared<Settings>();
  CPlayerStatusDialog p = CPlayerStatusDialog(app);
};

TEST_F(PlayerStatusDialogTests, Init) {
  EXPECT_CALL(*app, SetAutoHintDialogHintText(_)).Times(0);
  EXPECT_CALL(*app, GetSettings()).WillRepeatedly(Return(settings));
  settings->Initialize();

  p << "!Hello\nWorld";  
}

} // namespace UnitTests
