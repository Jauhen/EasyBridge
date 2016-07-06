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
  DealTests() {
    app = make_shared<MockApp>();
    deck = make_shared<CDeck>(app);

    CConventionSet* set = new CConventionSet(app);

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
    EXPECT_CALL(*app, GetNextPlayer(3)).WillRepeatedly(Return(0));
    EXPECT_CALL(*app, GetPrevPlayer(0)).WillRepeatedly(Return(3));
    EXPECT_CALL(*app, GetPrevPlayer(1)).WillRepeatedly(Return(0));
    EXPECT_CALL(*app, GetPrevPlayer(2)).WillRepeatedly(Return(1));
    EXPECT_CALL(*app, GetPrevPlayer(3)).WillRepeatedly(Return(2));
    EXPECT_CALL(*app, CardToShortString(_)).WillRepeatedly(Return("HA"));
    EXPECT_CALL(*app, GetCardName(_)).WillRepeatedly(Return("~~~"));
    EXPECT_CALL(*app, CardToString(_)).WillRepeatedly(Return("!!"));
    EXPECT_CALL(*app, CardToReverseString(_)).WillRepeatedly(Return("^^"));
    EXPECT_CALL(*app, GetSuitSequence(_)).WillRepeatedly(Return('H'));
    EXPECT_CALL(*app, GetSuitLetter(_)).WillRepeatedly(Return('!'));
    EXPECT_CALL(*app, GetCardLetter(_)).WillRepeatedly(Return('!'));
    EXPECT_CALL(*app, GetSuitToScreenIndex(_)).WillRepeatedly(Return(2));
    EXPECT_CALL(*app, GetHonorValue(_)).WillRepeatedly(Return(1));

    deck->InitializeCards();
  }

  virtual ~DealTests() {
    deck.reset();
    app.reset();
  }

  shared_ptr<MockApp> app;
  shared_ptr<CDeck> deck;
};

TEST_F(DealTests, InitNewHand) {

  Deal d{ app };
  d.InitNewHand();

  EXPECT_TRUE(Mock::VerifyAndClearExpectations(app.get()));
}

TEST_F(DealTests, DealNumberedHand) {
  EXPECT_CALL(*app, SetAllIndicators()).Times(AnyNumber());
  EXPECT_CALL(*app, IsEnableDealNumbering()).WillRepeatedly(Return(true));
  EXPECT_CALL(*app, GetRandomValue(_)).WillRepeatedly(Return(0));

  Deal d{app};
  d.InitNewHand();
  d.DealNumberedHand(0, 0, 0, 1);

  EXPECT_TRUE(Mock::VerifyAndClearExpectations(app.get()));

}

} // namespace UnitTests
