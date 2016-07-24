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

  CPlayer pS = CPlayer(app);
  CPlayer pW = CPlayer(app);
  CPlayer pN = CPlayer(app);
  CPlayer pE = CPlayer(app);
};

TEST_F(PlayerTests, Init) {

  pS.InitializePlayer(SOUTH, &pN, &pW, &pE);
  pW.InitializePlayer(WEST, &pE, &pN, &pS);
  pN.InitializePlayer(NORTH, &pS, &pE, &pW);
  pE.InitializePlayer(EAST, &pW, &pS, &pN);

  pS.InitializeEngines();
  pW.InitializeEngines();
  pN.InitializeEngines();
  pE.InitializeEngines();

  EXPECT_EQ(1, 1);
}

} // namespace UnitTests
