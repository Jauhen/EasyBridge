#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "mock_app.h"
#include "../src/engine/Deck.H"
#include "../src/engine/bidding/ConventionSet.h"
#include "../src/model/deal.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {

class DealTests : public Test {
protected:
  shared_ptr<MockApp> app = make_shared<MockApp>();
};

TEST_F(DealTests, InitNewHand) {
  CConventionSet* set = new CConventionSet(app);
  std::shared_ptr<CDeck> deck = std::make_shared<CDeck>(app);

  EXPECT_CALL(*app, GetProgramTitle()).WillRepeatedly(Return("abc"));
  EXPECT_CALL(*app, GetProgramMajorVersion()).WillRepeatedly(Return(4));
  EXPECT_CALL(*app, GetProgramMinorVersion()).WillRepeatedly(Return(3));
  EXPECT_CALL(*app, GetProgramIncrementVersion()).WillRepeatedly(Return(2));
  EXPECT_CALL(*app, GetProgramBuildNumber()).WillRepeatedly(Return(1));
  EXPECT_CALL(*app, GetProgramBuildDate()).WillRepeatedly(Return("abc"));
  EXPECT_CALL(*app, IsSaveIntermediatePositions()).WillRepeatedly(Return(false));
  EXPECT_CALL(*app, PositionToString(_)).WillRepeatedly(Return("abc"));
  EXPECT_CALL(*app, GetCurrentConventionSet()).WillRepeatedly(Return(set));
  EXPECT_CALL(*app, IsMainFrameExists()).WillRepeatedly(Return(false));
  EXPECT_CALL(*app, SetBiddingInProgress(false)).Times(AnyNumber());
  EXPECT_CALL(*app, SetGameInProgress(false)).Times(AnyNumber());
  EXPECT_CALL(*app, SetRubberInProgress(false)).Times(AnyNumber());
  EXPECT_CALL(*app, ClearMode(false)).Times(AnyNumber());
  EXPECT_CALL(*app, IsFullAutoPlayMode()).WillRepeatedly(Return(false));
  EXPECT_CALL(*app, IsFullAutoExpressPlayMode()).WillRepeatedly(Return(false));
  EXPECT_CALL(*app, GetDeck()).WillRepeatedly(Return(deck));
  EXPECT_CALL(*app, GetNextPlayer(0)).WillRepeatedly(Return(1));
  EXPECT_CALL(*app, GetNextPlayer(1)).WillRepeatedly(Return(2));
  EXPECT_CALL(*app, GetNextPlayer(2)).WillRepeatedly(Return(3));
  EXPECT_CALL(*app, GetNextPlayer(3)).WillRepeatedly(Return(4));

  Deal d{ app };
  d.InitNewHand();
}

} // namespace UnitTests
