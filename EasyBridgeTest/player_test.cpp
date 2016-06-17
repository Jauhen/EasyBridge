#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "mock_app.h"
#include "../src/engine/Player.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {

class PlayerTests : public Test {
protected:
  shared_ptr<MockApp> app = make_shared<MockApp>();
  CPlayer pl = CPlayer(app);
};

TEST_F(PlayerTests, Init) {
  EXPECT_EQ(1, 1);
}

} // namespace UnitTests
