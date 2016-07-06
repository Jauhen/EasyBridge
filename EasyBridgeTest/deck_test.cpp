#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "mock_app.h"
#include "../src/engine/deck.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {

class DeckTests : public Test {
protected:
  shared_ptr<MockApp> app = make_shared<MockApp>();
  CDeck d{app};
};

TEST_F(DeckTests, Init) {
  EXPECT_CALL(*app, CardToShortString(_)).WillRepeatedly(Return("HA"));
  EXPECT_CALL(*app, GetCardName(_)).WillRepeatedly(Return("~~~"));
  EXPECT_CALL(*app, CardToString(_)).WillRepeatedly(Return("!!"));
  EXPECT_CALL(*app, CardToReverseString(_)).WillRepeatedly(Return("^^"));
  EXPECT_CALL(*app, GetSuitSequence(_)).WillRepeatedly(Return('H'));
  EXPECT_CALL(*app, GetSuitLetter(_)).WillRepeatedly(Return('!'));

  d.InitializeCards();
}

} // namespace UnitTests
