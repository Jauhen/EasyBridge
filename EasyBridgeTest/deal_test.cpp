#include "stdafx.h"
#include <memory>
#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "mock_app.h"
#include "../src/engine/Deck.H"
#include "../src/engine/Player.H"
#include "../src/engine/bidding/ConventionSet.h"
#include "../src/engine/bidding/convention_pool.h"
#include "../src/model/deal.h"

using namespace ::testing;
using namespace std;

namespace UnitTests {

class DealTests : public TestWithParam< ::tuple<int, const char*, int> > {
protected:
  DealTests() {}
  virtual void SetUp() {
    app = make_shared<MockApp>();
    settings = make_shared<Settings>();
    deck = make_shared<CDeck>(app, settings);
    conventionPool = make_shared<ConventionPool>(app);
    set = unique_ptr<CConventionSet>(new CConventionSet(app));

    EXPECT_CALL(*app, GetDeck()).WillRepeatedly(Return(deck));
    EXPECT_CALL(*app, GetSettings()).WillRepeatedly(Return(settings));
    EXPECT_CALL(*app, GetCurrentConventionSet()).WillRepeatedly(Return(set.get()));
    EXPECT_CALL(*app, GetConventionPool()).WillRepeatedly(Return(conventionPool));

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
    EXPECT_CALL(*app, SetAllIndicators()).Times(AnyNumber());
    EXPECT_CALL(*app, HasDoc()).WillRepeatedly(Return(true));

    deck->InitializeCards();
    set->Initialize();
    settings->Initialize();
    settings->InitSettings();
    settings->ParseVersion("4.0.2");
    settings->SetDebugMode(false);
    settings->GetAutoTestMode();
    settings->SetInsertBiddingPause(0);
    d = std::make_shared<Deal>(app);

    EXPECT_CALL(*app, GetDeal()).WillRepeatedly(Return(d));
    EXPECT_CALL(*app, GetToday()).WillRepeatedly(Return("2016.07.12"));
    EXPECT_CALL(*app, SetBiddingHistory(_, false)).Times(AnyNumber());
    EXPECT_CALL(*app, SetPlainBiddingHistory(_)).Times(AnyNumber());
    EXPECT_CALL(*app, SuspendHints()).Times(AnyNumber());
    EXPECT_CALL(*app, ResumeHints()).Times(AnyNumber());

    set->InitConventions();
    d->InitNewHand();
  }

  virtual ~DealTests() {}

  virtual void TearDown() {
  }

  shared_ptr<MockApp> app;
  shared_ptr<CDeck> deck;
  shared_ptr<Settings> settings;
  shared_ptr<ConventionPool> conventionPool;
  unique_ptr<CConventionSet> set;
  std::shared_ptr<Deal> d;
};

TEST_P(DealTests, DealNumberedHand) {
  d->DealNumberedHand(0, 0, 0, ::get<0>(GetParam()));
  
  bool isBiddingFinished = false;
  Position player = SOUTH;
  while (!isBiddingFinished) {
    // 1st bidding round
    int bid = d->GetPlayer(player)->Bid();
    isBiddingFinished = d->EnterBid(player, bid) == 1;
    player = (Position)GetNextPlayer(player);
  }

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

  d->UpdateDuplicateScore();

  string pbn = d->WriteFilePBN();

  const char* expectedPbn = ::get<1>(GetParam());
  EXPECT_STREQ(expectedPbn, pbn.c_str());
  EXPECT_EQ(::get<2>(GetParam()), d->GetTotalScoreNS());

  d.reset();
  EXPECT_TRUE(Mock::VerifyAndClearExpectations(app.get()));
}

const char* expectedPbnFor1 = "%% \n"
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
    "1NT Pass 3NT Pass \n"
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

const char* expectedPbnFor4 = "%% \n"
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
    "[DEAL \"W:52.AT98.5.AKT975 K8743.J4.982.J64 A.KQ6.KQJ7643.Q3 QJT96.7532.AT.82\"]\n"
    "[SCORING \"None\"]\n"
    "[DECLARER \"E\"]\n"
    "[CONTRACT \"5D\"]\n"
    "[RESULT \"10\"]\n"
    "{\n"
    "                S: K 8 7 4 3 \n"
    "                H: J 4 \n"
    "                D: 9 8 2 \n"
    "                C: J 6 4 \n"
    "S: 5 2                          S: A \n"
    "H: A T 9 8                      H: K Q 6 \n"
    "D: 5                            D: K Q J 7 6 4 3 \n"
    "C: A K T 9 7 5                  C: Q 3 \n"
    "                S: Q J T 9 6 \n"
    "                H: 7 5 3 2 \n"
    "                D: A T \n"
    "                C: 8 2 \n"
    "}\n"
    "[AUCTION \"S\"]\n"
    "Pass Pass Pass 1D \n"
    "Pass 2C Pass 5D \n"
    "Pass Pass Pass \n"
    "[PLAY \"S\"]\n"
    "SQ S2 S3 SA \n"
    "H2 H8 H4 HK \n"
    "H3 H9 HJ HQ \n"
    "H5 HA D2 H6 \n"
    "S6 S5 SK D3 \n"
    "C2 C5 C4 CQ \n"
    "C8 CA C6 C3 \n"
    "DT CK CJ D4 \n"
    "H7 HT D8 DJ \n"
    "DA D5 D9 DK \n"
    "S9 C7 S4 D6 \n"
    "ST C9 S7 DQ \n"
    "SJ CT S8 D7 \n"
    "[GENERATOR \"Easy Bridge version Version 4.0.2\"]\n"
    "[DESCRIPTION \"\"]\n";

const char* expectedPbnFor26 = "%% \n"
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
    "[DEAL \"W:6.KJT2.QJ6532.93 .AQ9876.KT8.A654 JT987.43.A94.JT7 AKQ5432.5.7.KQ82\"]\n"
    "[SCORING \"None\"]\n"
    "[DECLARER \"N\"]\n"
    "[CONTRACT \"6H\"]\n"
    "[RESULT \"10\"]\n"
    "{\n"
    "                S: \n"
    "                H: A Q 9 8 7 6 \n"
    "                D: K T 8 \n"
    "                C: A 6 5 4 \n"
    "S: 6                            S: J T 9 8 7 \n"
    "H: K J T 2                      H: 4 3 \n"
    "D: Q J 6 5 3 2                  D: A 9 4 \n"
    "C: 9 3                          C: J T 7 \n"
    "                S: A K Q 5 4 3 2 \n"
    "                H: 5 \n"
    "                D: 7 \n"
    "                C: K Q 8 2 \n"
    "}\n"
    "[AUCTION \"S\"]\n"
    "2C Pass 2H Pass \n"
    "2S Pass 4NT Pass \n"
    "5D Pass 6H Pass \n"
    "Pass Pass \n"
    "[PLAY \"E\"]\n"
    "SJ SA S6 C4 \n"
    "S7 SK H2 H6 \n"
    "CT CK C3 C5 \n"
    "S8 S2 HT HQ \n"
    "C7 C2 C9 CA \n"
    "CJ CQ HJ C6 \n"
    "DA D7 D2 DT \n"
    "S9 S3 D3 H7 \n"
    "D4 H5 D5 DK \n"
    "ST S4 HK HA \n"
    "H3 C8 D6 H8 \n"
    "H4 S5 DJ H9 \n"
    "D9 SQ DQ D8 \n"
    "[GENERATOR \"Easy Bridge version Version 4.0.2\"]\n"
    "[DESCRIPTION \"\"]\n";

const char* expectedPbnFor36 = "%% \n"
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
    "[DEAL \"W:AJ73.KQ9.T983.AK Q94.AJT732.42.T6 KT52.8654.AJ6.72 86..KQ75.QJ98543\"]\n"
    "[SCORING \"None\"]\n"
    "[DECLARER \"W\"]\n"
    "[CONTRACT \"4S\"]\n"
    "[RESULT \"8\"]\n"
    "{\n"
    "                S: Q 9 4 \n"
    "                H: A J T 7 3 2 \n"
    "                D: 4 2 \n"
    "                C: T 6 \n"
    "S: A J 7 3                      S: K T 5 2 \n"
    "H: K Q 9                        H: 8 6 5 4 \n"
    "D: T 9 8 3                      D: A J 6 \n"
    "C: A K                          C: 7 2 \n"
    "                S: 8 6 \n"
    "                H: \n"
    "                D: K Q 7 5 \n"
    "                C: Q J 9 8 5 4 3 \n"
    "}\n"
    "[AUCTION \"S\"]\n"
    "Pass 1NT Pass 2C \n"
    "Pass 2S Pass 4S \n"
    "Pass Pass Pass \n"
    "[PLAY \"N\"]\n"
    "HA H4 D5 HQ \n"
    "H2 H5 S6 H9 \n"
    "C6 C2 C3 CA \n"
    "S4 SK S8 S3 \n"
    "S9 S2 C4 SA \n"
    "D2 DA D7 D3 \n"
    "D4 D6 DQ D8 \n"
    "CT DJ DK D9 \n"
    "SQ C7 C5 CK \n"
    "H3 H6 C8 HK \n"
    "H7 H8 C9 DT \n"
    "HT S5 CJ SJ \n"
    "HJ ST CQ S7 \n"
    "[GENERATOR \"Easy Bridge version Version 4.0.2\"]\n"
    "[DESCRIPTION \"\"]\n";

const char* expectedPbnFor76 = "%% \n"
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
    "[DEAL \"W:53.AKQ65..KT8652 Q2.72.AQT987.A93 K84.T983.KJ.QJ74 AJT976.J4.65432.\"]\n"
    "[SCORING \"None\"]\n"
    "[DECLARER \"N\"]\n"
    "[CONTRACT \"3D\"]\n"
    "[RESULT \"9\"]\n"
    "{\n"
    "                S: Q 2 \n"
    "                H: 7 2 \n"
    "                D: A Q T 9 8 7 \n"
    "                C: A 9 3 \n"
    "S: 5 3                          S: K 8 4 \n"
    "H: A K Q 6 5                    H: T 9 8 3 \n"
    "D:                              D: K J \n"
    "C: K T 8 6 5 2                  C: Q J 7 4 \n"
    "                S: A J T 9 7 6 \n"
    "                H: J 4 \n"
    "                D: 6 5 4 3 2 \n"
    "                C: \n"
    "}\n"
    "[AUCTION \"S\"]\n"
    "Pass 1H 2D Pass \n"
    "3D Pass Pass Pass \n"
    "[PLAY \"E\"]\n"
    "H3 HJ HQ H2 \n"
    "H8 H4 HK H7 \n"
    "H9 D2 HA D7 \n"
    "DJ D3 S3 DA \n"
    "C4 D4 C2 CA \n"
    "SK S6 S5 SQ \n"
    "HT D5 H5 C3 \n"
    "S4 SA C5 S2 \n"
    "S8 SJ C6 C9 \n"
    "DK ST C8 D8 \n"
    "C7 D6 CT D9 \n"
    "CJ S7 H6 DQ \n"
    "CQ S9 CK DT \n"
    "[GENERATOR \"Easy Bridge version Version 4.0.2\"]\n"
    "[DESCRIPTION \"\"]\n";


INSTANTIATE_TEST_CASE_P(Params, DealTests, ::Values(
  ::tuple<int, const char*, int>(1, expectedPbnFor1, 600),
  ::tuple<int, const char*, int>(4, expectedPbnFor4, 50),
  ::tuple<int, const char*, int>(26, expectedPbnFor26, 250), // Blackwood, but wrong suit
  ::tuple<int, const char*, int>(36, expectedPbnFor36, 100), // Stayman
  ::tuple<int, const char*, int>(76, expectedPbnFor76, 110) // Concurrent, very passive
));

} // namespace UnitTests
