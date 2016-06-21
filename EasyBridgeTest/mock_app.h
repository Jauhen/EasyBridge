#pragma once
#include <gmock/gmock.h>
#include "app_interface.h"

class MockApp : public AppInterface {
public:
  MOCK_METHOD0(IsEnableAnalysisTracing, bool());
  MOCK_METHOD0(AnalysisTraceLevel, int());
  MOCK_METHOD0(InExpressAutoPlay, bool());
  MOCK_METHOD0(IsShowCommentIdentifiers, bool());
  MOCK_METHOD0(IsEnableAnalysisDuringHints, bool());
  MOCK_METHOD0(GetConventionPool, std::shared_ptr<ConventionPool>());
  MOCK_METHOD0(GamePts, double());
  MOCK_METHOD0(MajorSuitGamePts, double());
  MOCK_METHOD0(MinorSuitGamePts, double());
  MOCK_METHOD0(NTGamePts, double());
  MOCK_METHOD0(FourthLevelPts, double());
  MOCK_METHOD0(ThirdLevelPts, double());
  MOCK_METHOD0(SecondLevelPts, double());
  MOCK_METHOD0(SlamPts, double());
  MOCK_METHOD0(SmallSlamPts, double());
  MOCK_METHOD0(GrandSlamPts, double());
  MOCK_METHOD0(GetCurrentConventionSet, CConventionSet*());
  MOCK_METHOD1(OpenPoints, double(double points));
  MOCK_METHOD1(PointCount, double(double points));
  MOCK_CONST_METHOD1(GetMinimumOpeningValue, int(CPlayer* player));
  MOCK_METHOD3(GetProfileInt, int(const char* appName, const char* keyName, int defaultValue));
  MOCK_METHOD3(WriteProfileInt, void(const char* appName, const char* keyName, int defaultValue));


  MOCK_METHOD0(GetCurrentTrickCardLed, CCard*());
  MOCK_CONST_METHOD1(GetValidBidRecord, int(int index));
  MOCK_CONST_METHOD0(GetLastValidBid, int());
  MOCK_CONST_METHOD0(GetBiddingRound, int());
  MOCK_CONST_METHOD0(GetNumBidsMade, int());
  MOCK_CONST_METHOD2(GetBidByPlayer, int(int position, int round));
  MOCK_CONST_METHOD2(GetBidByPlayer, int(CPlayer* player, int round));
  MOCK_CONST_METHOD0(GetDealer, int());
  MOCK_METHOD1(IsBidValid, bool(int bid));
  MOCK_CONST_METHOD1(GetBidByIndex, int(int index));
  MOCK_CONST_METHOD1(GetPlayer, CPlayer*(int position));
  MOCK_CONST_METHOD0(GetContract, int());
  MOCK_CONST_METHOD0(GetContractModifier, int());
  MOCK_CONST_METHOD0(GetDeclarerPosition, int());
  MOCK_CONST_METHOD0(GetRoundLead, int());
  MOCK_CONST_METHOD0(GetLastValidBidTeam, int());
  MOCK_METHOD0(IsDocInitialized, bool());
  MOCK_CONST_METHOD0(GetOpeningBid, int());
  MOCK_CONST_METHOD0(GetNumValidBidsMade, int());
  MOCK_CONST_METHOD0(GetOpeningBidder, int());

  MOCK_METHOD1(DisplayHand, void(Position pos));
  MOCK_METHOD1(SetCurrentModeTemp, void(int mode));
  MOCK_METHOD0(RestoreMode, void());
  MOCK_METHOD1(SuitToSingularString, const char*(int suit));

  MOCK_METHOD1(SetAutoHintDialogHintText, void(CString text));
  MOCK_METHOD1(ShowAnalysisDialog, void(Position position));
  MOCK_METHOD1(HideAnalysisDialog, void(Position position));
  MOCK_METHOD2(SetAnalysisText, void(Position position, CString analysis));
  MOCK_METHOD0(SuspendHints, void());
  MOCK_METHOD0(ResumeHints, void());

  MOCK_METHOD2(ContractToFullString, const CString(int contract, int modifier));
  MOCK_METHOD1(PositionToString, const char* (int pos));
  MOCK_METHOD1(BidToFullString, const CString(int bid));
  MOCK_METHOD1(GetCardLetter, char(int i));
  MOCK_METHOD1(GetSuitLetter, char(int i));
  MOCK_METHOD1(SuitToString, const char* (int suit));
  MOCK_METHOD1(BidToShortString, const CString(int bid));
  MOCK_METHOD1(GetPlayerTeam, int(int position));
  MOCK_METHOD1(GetNextPlayer, int(int position));
  MOCK_METHOD1(GetNextSuit, int(int suit));
};
