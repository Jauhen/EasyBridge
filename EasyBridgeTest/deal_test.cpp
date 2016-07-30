#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "mock_app.h"
#include "../src/engine/Deck.H"
#include "../src/engine/Player.H"
#include "../src/engine/bidding/ConventionSet.h"
#include "../src/model/deal.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {

class DealTests : public Test {
protected:
  DealTests() {}
  virtual void SetUp() {
    app = make_shared<MockApp>();
    deck = make_shared<CDeck>(app);
    settings = make_shared<Settings>();

    set = unique_ptr<CConventionSet>(new CConventionSet(app));

    EXPECT_CALL(*app, GetDeck()).WillRepeatedly(Return(deck));
    EXPECT_CALL(*app, GetSettings()).WillRepeatedly(Return(settings));
    EXPECT_CALL(*app, GetCurrentConventionSet()).WillRepeatedly(Return(set.get()));

    EXPECT_CALL(*app, IsMainFrameExists()).WillRepeatedly(Return(false));
    EXPECT_CALL(*app, ClearMode(false)).Times(AnyNumber());
    EXPECT_CALL(*app, GetSuitToScreenIndex(_)).WillRepeatedly(Return(2));
    EXPECT_CALL(*app, SetAnalysisText(_, _)).Times(AnyNumber());
    EXPECT_CALL(*app, InitNewRound()).Times(AnyNumber());
    EXPECT_CALL(*app, InitNewDeal()).Times(AnyNumber());
    EXPECT_CALL(*app, ClearHintDialog()).Times(AnyNumber());
    EXPECT_CALL(*app, DisableHintDialog()).Times(AnyNumber());
    EXPECT_CALL(*app, SetPlayHistory(_, false)).Times(AnyNumber());
    EXPECT_CALL(*app, SetPlainPlayHistory(_)).Times(AnyNumber());
    EXPECT_CALL(*app, ResetDummySuitSequence()).Times(AnyNumber());
    EXPECT_CALL(*app, NonePlayMode()).Times(AnyNumber());
    EXPECT_CALL(*app, SetPrompt(_)).Times(AnyNumber());
    EXPECT_CALL(*app, TimeGetTime()).Times(AnyNumber());
    EXPECT_CALL(*app, PlayCard(_, 1001)).Times(AnyNumber());
    EXPECT_CALL(*app, PlayCard(_, 1002)).Times(AnyNumber());
    EXPECT_CALL(*app, PlayCard(_, 1003)).Times(AnyNumber());
    EXPECT_CALL(*app, IsInGameRestoreMode()).Times(AnyNumber());
    EXPECT_CALL(*app, UpdateStatusWindowWithSuitStatus()).Times(AnyNumber());
    EXPECT_CALL(*app, UpdateStatusWindow()).Times(AnyNumber());
    EXPECT_CALL(*app, UpdateStatusWindowWithPlayPlan()).Times(AnyNumber());
    EXPECT_CALL(*app, SetStatusText(_)).Times(AnyNumber());
    EXPECT_CALL(*app, WaitCardPlayMode()).Times(AnyNumber());
    EXPECT_CALL(*app, ClickForNextTrickMode()).Times(AnyNumber());
    EXPECT_CALL(*app, DisplayTricks()).Times(AnyNumber());
    EXPECT_CALL(*app, DisplayTricksView()).Times(AnyNumber());
    EXPECT_CALL(*app, PromptLead()).Times(AnyNumber());
    EXPECT_CALL(*app, ClearStatusMessage()).Times(AnyNumber());
    EXPECT_CALL(*app, AreCardsFaceUp()).WillRepeatedly(Return(true));
    EXPECT_CALL(*app, ResetDisplay()).Times(AnyNumber());
    EXPECT_CALL(*app, DisplayRoundFinishedDialog(false, false, _, _)).Times(AnyNumber());
    EXPECT_CALL(*app, RefreshScreen()).Times(AnyNumber());
    EXPECT_CALL(*app, GameFinished()).Times(AnyNumber());

    deck->InitializeCards();
    set->Initialize();
    settings->Initialize();
    settings->InitSettings();
    settings->ParseVersion("4.0.2");
    settings->SetDebugMode(false);
    settings->GetAutoTestMode();
    settings->SetInsertBiddingPause(0);
  }

  virtual ~DealTests() {}

  virtual void TearDown() {
  }

  shared_ptr<MockApp> app;
  shared_ptr<CDeck> deck;
  shared_ptr<Settings> settings;
  unique_ptr<CConventionSet> set;
};

TEST_F(DealTests, InitNewHand) {

  Deal d{ app };
  d.InitNewHand();

  EXPECT_TRUE(Mock::VerifyAndClearExpectations(app.get()));
}

TEST_F(DealTests, DealNumberedHand) {
  EXPECT_CALL(*app, SetAllIndicators()).Times(AnyNumber());

  std::shared_ptr<Deal> d = std::make_shared<Deal>(app);
  EXPECT_CALL(*app, GetDeal()).WillRepeatedly(Return(d));
  EXPECT_CALL(*app, GetToday()).WillRepeatedly(Return("2016.07.12"));
  EXPECT_CALL(*app, SetBiddingHistory(_, false)).Times(AnyNumber());
  EXPECT_CALL(*app, SetPlainBiddingHistory(_)).Times(AnyNumber());
  EXPECT_CALL(*app, SuspendHints()).Times(AnyNumber());
  EXPECT_CALL(*app, ResumeHints()).Times(AnyNumber());

  d->InitNewHand();
  d->DealNumberedHand(0, 0, 0, 1);
  
  // 1st bidding round
  int bid = d->GetPlayer(0)->Bid();
  d->EnterBid(0, bid);
  bid = d->GetPlayer(1)->Bid();
  d->EnterBid(1, bid);
  bid = d->GetPlayer(2)->Bid();
  d->EnterBid(2, bid);
  bid = d->GetPlayer(3)->Bid();
  d->EnterBid(3, bid);

  // 2nd bidding round
  bid = d->GetPlayer(0)->Bid();
  d->EnterBid(0, bid);
  bid = d->GetPlayer(1)->Bid();
  d->EnterBid(1, bid);
  bid = d->GetPlayer(2)->Bid();
  d->EnterBid(2, bid);
  bid = d->GetPlayer(3)->Bid();
  d->EnterBid(3, bid);

  // last bidding round
  bid = d->GetPlayer(0)->Bid();
  d->EnterBid(0, bid);
  bid = d->GetPlayer(1)->Bid();
  d->EnterBid(1, bid);

  d->BeginRound();
  CCard* c = d->GetCurrentPlayer()->PlayCard();
  d->EnterCardPlay((Position)d->GetCurrentPlayerPosition(), c);

  d->ExposeDummy(true);

  d->AdvanceToNextPlayer();
  c = d->GetCurrentPlayer()->PlayCard();
  d->EnterCardPlay((Position)d->GetCurrentPlayerPosition(), c);

  d->AdvanceToNextPlayer();
  c = d->GetCurrentPlayer()->PlayCard();
  d->EnterCardPlay((Position)d->GetCurrentPlayerPosition(), c);

  d->AdvanceToNextPlayer();
  c = d->GetCurrentPlayer()->PlayCard();
  d->EnterCardPlay((Position)d->GetCurrentPlayerPosition(), c);

  d->EvaluateTrick(true);
  d->ClearTrick();

  // 2nd round
  for (int round = 1; round < 13; round++) {
    c = d->GetCurrentPlayer()->PlayCard();
    d->EnterCardPlay((Position)d->GetCurrentPlayerPosition(), c);
  
    d->AdvanceToNextPlayer();
    c = d->GetCurrentPlayer()->PlayCard();
    d->EnterCardPlay((Position)d->GetCurrentPlayerPosition(), c);

    d->AdvanceToNextPlayer();
    c = d->GetCurrentPlayer()->PlayCard();
    d->EnterCardPlay((Position)d->GetCurrentPlayerPosition(), c);

    d->AdvanceToNextPlayer();
    c = d->GetCurrentPlayer()->PlayCard();
    d->EnterCardPlay((Position)d->GetCurrentPlayerPosition(), c);

    d->EvaluateTrick(true);
    d->ClearTrick();
  }

  string pbn = d->WriteFilePBN();

  const char* expectedPbn = "%% \n"
    "%% EXPORT\n"
    "%% PBN Format 1.0\n"
    "%% File generated by Easy Bridge version Version 4.0.2\n"
    "%% \n"
    "[EVENT \" Game\"]\n"
    "[SITE \"\"]\n"
    "[DATE \"2016.07.12\"]\n"
    "[BOARD \"\"]\n"
    "[WEST \"Computer\"]\n"
    "[NORTH \"Computer\"]\n"
    "[EAST \"Computer\"]\n"
    "[SOUTH \"Human Player\"]\n"
    "[DEALER \"S\"]\n"
    "[VULNERABLE \"NS\"]\n"
    "[DEAL \"W:T7632.J86.T84.32 AJ4.T9.Q763.A874 KQ5.K543.J5.QJ65 98.AQ72.AK92.KT9\"]\n"
    "[SCORING \"None\"]\n"
    "[DECLARER \"S\"]\n"
    "[CONTRACT \"3NT\"]\n"
    "[RESULT \"9\"]\n"
    "{\n"
    "                S: A J 4 \n"
    "                H: T 9 \n"
    "                D: Q 7 6 3 \n"
    "                C: A 8 7 4 \n"
    "S: T 7 6 3 2                    S: K Q 5 \n"
    "H: J 8 6                        H: K 5 4 3 \n"
    "D: T 8 4                        D: J 5 \n"
    "C: 3 2                          C: Q J 6 5 \n"
    "                S: 9 8 \n"
    "                H: A Q 7 2 \n"
    "                D: A K 9 2 \n"
    "                C: K T 9 \n"
    "}\n"
    "[AUCTION \"S\"]\n"
    "1D Pass 2C Pass \n"
    "2NT Pass 3NT Pass \n"
    "Pass Pass \n"
    "[PLAY \"W\"]\n"
    "S3 SJ SQ S8 \n"
    "ST SA S5 S9 \n"
    "H6 H9 H3 HQ \n"
    "H8 HT H4 HA \n"
    "D4 DQ D5 D2 \n"
    "D8 D3 DJ DA \n"
    "C2 C4 CJ CT \n"
    "HJ C7 HK H2 \n"
    "S2 S4 SK C9 \n"
    "C3 D6 H5 H7 \n"
    "DT C8 C5 CK \n"
    "S6 D7 C6 DK \n"
    "S7 CA CQ D9 \n"
    "[GENERATOR \"Easy Bridge version Version 4.0.2\"]\n"
    "[DESCRIPTION \"\"]\n";

  d.reset();

  EXPECT_STREQ(expectedPbn, pbn.c_str());
  EXPECT_TRUE(Mock::VerifyAndClearExpectations(app.get()));
}

} // namespace UnitTests
