#pragma once
#include <gmock/gmock.h>
#include "app_interface.h"
#include "dialogs/roundfinisheddialog.h"
#include "GIB.h"

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
  MOCK_METHOD0(IsInManualCardPlayMode, bool());
  MOCK_METHOD0(AreCardsFaceUp, bool());
  MOCK_METHOD0(IsEnableGIBForDeclarer, bool());
  MOCK_METHOD0(GetGIB, CGIB&());
  MOCK_METHOD0(IsInExpressAutoPlay, bool());
  MOCK_METHOD0(IsComputerCanClaim, bool());
  MOCK_METHOD5(InvokeGIB, int(CGIB& gib, CPlayer* player, CHandHoldings* hand, CHandHoldings* dummyHand, CPlayerStatusDialog* statusDialog));
  MOCK_METHOD0(IsEnableGIBForDefender, bool());
  MOCK_METHOD1(GetHonorValue, double(int faceValue));
  MOCK_CONST_METHOD1(GetSuitSequence, int(int suit));
  MOCK_METHOD0(IsAcelessPenalty, bool());
  MOCK_METHOD0(IsFourAceBonus, bool());
  MOCK_METHOD0(IsCountShortSuits, bool());
  MOCK_METHOD0(IsPenalizeUGHonors, bool());
  MOCK_METHOD0(GetAutoHintMode, int());
  MOCK_METHOD0(IsInsertBiddingPause, bool());
  MOCK_METHOD0(GetPlayPauseLength, int());
  MOCK_METHOD0(GetDeck, std::shared_ptr<CDeck>());
  MOCK_METHOD0(IsLowResOption, bool());
  MOCK_METHOD0(IsEnableDealNumbering, bool());
  MOCK_METHOD1(SetFeedbackText, void(const char* msg));
  MOCK_METHOD2(GetRequiredPointsForGame, int(int suitCode, int side /* 0 - min, 1 - max */));
  MOCK_METHOD2(GetRequiredPointsForSlam, int(int suitCode, int side /* 0 - min, 1 - max */));
  MOCK_METHOD1(GetMinSuitDistributions, int(int code));
  MOCK_METHOD3(GetMinSuitDistributionsTable, int(int code, int distribution, int hand));
  MOCK_METHOD0(GetMaxImbalanceForNT, int());
  MOCK_METHOD0(IsNeedTwoBalancedTrumpHands, bool());
  MOCK_METHOD0(GetMinCardsInMajor, int());
  MOCK_METHOD0(GetMinTopMajorCard, int());
  MOCK_METHOD0(GetMinCardsInMinor, int());
  MOCK_METHOD0(GetMinTopMinorCard, int());
  MOCK_METHOD1(GetAcesForSlam, int(int slamCode));
  MOCK_METHOD1(GetKingsForSlam, int(int slamCode));
  MOCK_METHOD0(IsBalaceTeamHands, bool());
  MOCK_METHOD0(IsFullAutoPlayMode, bool());
  MOCK_METHOD0(IsFullAutoExpressPlayMode, bool());
  MOCK_METHOD0(SetNormalPlayMode, void());
  MOCK_METHOD1(SetRubberInProgress, void(bool value));
  MOCK_METHOD1(SetGameInProgress, void(bool value));
  MOCK_METHOD1(SetBiddingInProgress, void(bool value));
  MOCK_METHOD0(GetProgramTitle, const char* ());
  MOCK_METHOD0(GetProgramMajorVersion, int());
  MOCK_METHOD0(GetProgramMinorVersion, int());
  MOCK_METHOD0(GetProgramIncrementVersion, int());
  MOCK_METHOD0(GetProgramBuildNumber, int());
  MOCK_METHOD0(GetProgramBuildDate, const char* ());
  MOCK_METHOD0(IsRubberInProgress, bool());
  MOCK_METHOD0(IsGameInProgress, bool());
  MOCK_METHOD0(IsBiddingInProgress, bool());
  MOCK_METHOD0(GetProgramVersionString, CString());
  MOCK_METHOD0(IsSaveIntermediatePositions, bool());
  MOCK_METHOD0(IsScoreHonorsBonuses, bool());
  MOCK_METHOD0(IsInAutoTestMode, bool());
  MOCK_METHOD0(GetProgramDirectory, const char*());
  MOCK_METHOD0(IsExposePBNGameCards, bool());
  MOCK_METHOD0(IsUseSuitSymbols, bool());
  MOCK_METHOD1(SetShowCardsFaceUp, void(bool value));
  MOCK_METHOD0(IsShowDummyTrumpsOnLeft, bool());
  MOCK_METHOD2(InitDummySuitSequence, void(int trump, int dummy_position));
  MOCK_METHOD0(IsAutoHintEnabled, bool());
  MOCK_METHOD0(IsUsingDuplicateScoring, bool());
  MOCK_METHOD0(IsDebugModeActive, bool());


  MOCK_METHOD0(GetDeal, std::shared_ptr<Deal>());
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
  MOCK_CONST_METHOD0(GetCurrentPlayerPosition, int());
  MOCK_CONST_METHOD0(GetNumCardsPlayedInRound, int());
  MOCK_CONST_METHOD0(GetCurrentPlayer, CPlayer*());
  MOCK_CONST_METHOD1(GetCurrentTrickCardByOrder, CCard*(int order));
  MOCK_CONST_METHOD0(GetTrumpSuit, int());
  MOCK_CONST_METHOD0(WasTrumpPlayed, bool());
  MOCK_CONST_METHOD1(GetCurrentTrickCard, CCard*(int position));
  MOCK_CONST_METHOD0(GetCurrentTrickHighCard, CCard*());
  MOCK_CONST_METHOD1(GetCurrentTrickHighCard, CCard*(int* pos));
  MOCK_METHOD2(ClaimTricks, void(Position position, int tricks));
  MOCK_CONST_METHOD0(GetPlayRound, int());
  MOCK_CONST_METHOD0(GetNumTricksPlayed, int());
  MOCK_CONST_METHOD0(GetNumCardsPlayedInGame, int());
  MOCK_CONST_METHOD1(GetNumberOfTricksWonByTeam, int(int team));
  MOCK_CONST_METHOD0(GetContractLevel, int());
  MOCK_CONST_METHOD0(GetNumTricksRemaining, int());
  MOCK_CONST_METHOD1(GetGameTrickWinner, int(int round));
  MOCK_CONST_METHOD0(GetDummyPlayer, CPlayer*());
  MOCK_CONST_METHOD0(GetDummyPosition, int());
  MOCK_CONST_METHOD1(GetGameTrickLead, int(int round));
  MOCK_CONST_METHOD2(GetGameTrickCard, CCard*(int round, int position));
  MOCK_CONST_METHOD1(GetNumTricksWonByTeam, int(int team));
  MOCK_METHOD0(IsReviewingGame, bool());
  MOCK_CONST_METHOD0(GetRoundLeadPlayer, CPlayer*());
  MOCK_CONST_METHOD0(GetContractSuit, int());
  MOCK_METHOD1(IsTeamVulnerable, bool(int team));
  MOCK_CONST_METHOD0(IsDummyExposed, bool());
  MOCK_CONST_METHOD1(GetSuitsUnbid, int(CArray<int, int> &suits));
  MOCK_CONST_METHOD0(GetDeclaringTeam, int());
  MOCK_METHOD0(OnNewDocument, void());
  MOCK_METHOD0(OnDealNewHand, void());
  MOCK_METHOD0(EndWaitCursorDoc, void());
  MOCK_METHOD0(OnRestartCurrentHand, void());
  MOCK_METHOD0(AdvanceToNextPlayer, void());


  MOCK_METHOD1(DisplayHand, void(Position pos));
  MOCK_METHOD1(SetCurrentModeTemp, void(int mode));
  MOCK_METHOD0(RestoreMode, void());
  MOCK_METHOD0(RefreshScreen, void());
  MOCK_METHOD0(IsInGameRestoreMode, bool());
  MOCK_METHOD2(PlayCard, void(CCard* card, int shift));
  MOCK_METHOD1(GetSuitToScreenIndex, int(int suit));
  MOCK_METHOD1(GetDummySuitToScreenIndex, int(int suit));
  MOCK_METHOD0(GetAnimationGranularity, int());
  MOCK_METHOD0(EndGameReview, void());
  MOCK_METHOD0(RestartPlay, void());
  MOCK_METHOD0(RestartBidding, void());
  MOCK_METHOD0(ClearMode, void());
  MOCK_METHOD1(ClearMode, void(bool redraw));
  MOCK_METHOD0(SuppressRefresh, void());
  MOCK_METHOD0(InitNewRound, void());
  MOCK_METHOD0(InitNewDeal, void());
  MOCK_METHOD0(EnableRefresh, void());
  MOCK_METHOD1(EnableRefresh, void(bool reset));
  MOCK_METHOD0(ResumeGame, void());
  MOCK_METHOD0(ResetDummySuitSequence, void());
  MOCK_METHOD0(ClickForNextTrickMode, void());
  MOCK_METHOD0(DisplayTricksView, void());
  MOCK_METHOD0(PromptLead, void());
  MOCK_METHOD0(WaitCardPlayMode, void());
  MOCK_METHOD0(GameFinished, void());
  MOCK_METHOD0(BidCurrentHand, void());
  MOCK_METHOD0(RestoreGameReview, void());
  MOCK_METHOD0(UpdateDisplay, void());
  MOCK_METHOD0(RefreshDisplay, void());
  MOCK_METHOD0(ResetDisplay, void());
  MOCK_METHOD0(GetWindowDC, CDC*());
  MOCK_METHOD0(IsInClickForNextTrickMode, bool());
  MOCK_METHOD0(ClearTable, void());
  MOCK_METHOD0(SetWaitSpecialDealMode, void());
  MOCK_METHOD1(SetCurrentMode, void(int value));
  MOCK_METHOD0(IsInCardLayoutMode, bool());
  MOCK_METHOD0(GetCurrentMode, int());


  MOCK_METHOD1(SetAutoHintDialogHintText, void(CString text));
  MOCK_METHOD1(ShowAnalysisDialog, void(Position position));
  MOCK_METHOD1(HideAnalysisDialog, void(Position position));
  MOCK_METHOD2(SetAnalysisText, void(Position position, CString analysis));
  MOCK_METHOD0(SuspendHints, void());
  MOCK_METHOD0(ResumeHints, void());
  MOCK_METHOD0(UpdateStatusWindowWithPlayPlan, void());
  MOCK_METHOD0(UpdateStatusWindowWithSuitStatus, void());
  MOCK_METHOD0(UpdateStatusWindowWithPlayPlanAndSuitStatus, void());
  MOCK_METHOD0(GetDC, CDC*());
  MOCK_METHOD1(ReleaseDC, void(CDC* dc));
  MOCK_METHOD0(UpdateStatusWindow, void());
  MOCK_METHOD1(SetGIBMonitorText, void(const char* text));
  MOCK_METHOD0(IsMainFrameExists, bool());
  MOCK_METHOD1(SetStatusMessage, void(const char* msg));
  MOCK_METHOD0(ClearAllIndicators, void());
  MOCK_METHOD0(SetAllIndicators, void());
  MOCK_METHOD0(ExposeAllCards, void());
  MOCK_METHOD0(UpdateFileCommentsDialog, void());
  MOCK_METHOD1(UpdateFileCommentsDialog, void(bool updateVariable));
  MOCK_METHOD1(SetHintDialogText, void(const char* msg));
  MOCK_METHOD0(ClearHintDialog, void());
  MOCK_METHOD1(SetBiddingHistory, void(const char* msg));
  MOCK_METHOD2(SetBiddingHistory, void(const char* msg, bool useSuitSymbols));
  MOCK_METHOD1(SetPlainBiddingHistory, void(const char* msg));
  MOCK_METHOD0(DisableHintDialog, void());
  MOCK_METHOD0(EnableHintDialog, void());
  MOCK_METHOD0(RestartCurrentHand, void());
  MOCK_METHOD1(SetStatusText, void(const char* msg));
  MOCK_METHOD0(HideAutoHintDialog, void());
  MOCK_METHOD0(SetModeIndicator, void());
  MOCK_METHOD0(DisplayTricks, void());
  MOCK_METHOD0(ClearStatusMessage, void());
  MOCK_METHOD0(ClearAutoHints, void());
  MOCK_METHOD0(NewRoundFinishedDialog, std::shared_ptr<CRoundFinishedDialog>());
  MOCK_METHOD0(MakeGameReviewDialogVisible, void());
  MOCK_METHOD1(SetPlayHistory, void(const char* msg));
  MOCK_METHOD2(SetPlayHistory, void(const char* msg, bool useSuitSymbols));
  MOCK_METHOD1(SetPlainPlayHistory, void(const char* msg));
  MOCK_METHOD1(SetAutoPlayMode, void(bool isFullAuto));
  MOCK_METHOD0(ShowAutoHintDialog, void());
  MOCK_METHOD1(FlashBidDialogButton, void(int bid));
  MOCK_METHOD1(RegisterBid, void(int bid));
  MOCK_METHOD0(ResetStatusMessage, void());
  MOCK_METHOD0(GetBiddingHistory, const CString());
  MOCK_METHOD0(GetPlayHistory, const CString());



  MOCK_METHOD2(ContractToFullString, const CString(int contract, int modifier));
  MOCK_METHOD1(PositionToString, const char* (int pos));
  MOCK_METHOD1(BidToFullString, const CString(int bid));
  MOCK_METHOD1(BidToShortString, const CString(int bid));
  MOCK_METHOD1(GetPlayerTeam, int(int position));
  MOCK_METHOD1(GetNextPlayer, int(int position));
  MOCK_METHOD1(GetNextSuit, int(int suit));
  MOCK_METHOD7(FormString, CString(const char* format, const char* arg1, const char* arg2, const char* arg3, const char* arg4, const char* arg5, const char* arg6));
  MOCK_METHOD6(FormString, CString(const char* format, const char* arg1, const char* arg2, const char* arg3, const char* arg4, const char* arg5));
  MOCK_METHOD4(FormString, CString(const char* format, const char* arg1, const char* arg2, const char* arg3));
  MOCK_METHOD3(FormString, CString(const char* format, const char* arg1, const char* arg2));
  MOCK_METHOD3(FormString, CString(const char* format, int arg1, int arg2));
  MOCK_METHOD3(FormString, CString(const char* format, const char* arg1, int arg2));
  MOCK_METHOD2(FormString, CString(const char* format, const char* arg1));
  MOCK_METHOD2(FormString, CString(const char* format, int arg1));
  MOCK_METHOD2(FormString, CString(const char* format, unsigned char arg1));
  MOCK_METHOD2(ContractToString, CString(int contract, int modifier));
  MOCK_METHOD1(GetPrevPlayer, int(int position));
  MOCK_METHOD1(GetPrevSuit, int(int suit));
  MOCK_METHOD1(IsHonor, bool(int faceValue));
  MOCK_METHOD1(TeamToString, const char*(int team));
  MOCK_METHOD1(StringToDeckValue, int(const char* str));
  MOCK_METHOD1(GetRandomValue, int(int max));
  MOCK_METHOD1(PositionToShortString, const char*(int pos));
  MOCK_METHOD1(GetOpposingTeam, int(int team));
  MOCK_METHOD1(GetPartner, int(int pos));
  MOCK_METHOD1(StringToPosition, int(const char* str));
  MOCK_METHOD1(PositionToChar, const char(int pos));
  MOCK_METHOD1(BidToPBNString, const CString(int bid));
  MOCK_METHOD1(WrapInQuotes, CString(const CString& item));
  MOCK_METHOD1(StripQuotes, CString(const CString& item));
  MOCK_METHOD1(CharToPosition, int(char c));
  MOCK_METHOD1(StringToBid, int(const char* str));
  MOCK_METHOD1(ContractStringToBid, int(const char* str));
  MOCK_METHOD2(ContractParamsToBid, int(int suit, int level));
  MOCK_METHOD0(TimeGetTime, int());
  MOCK_METHOD3(DisplayScoreDialog, void(std::vector<CString> bonusPoints, std::vector<CString> trickPoints, CString totalPoints));
  MOCK_METHOD1(DisplaySelectHandDialog, int(int position));
  MOCK_METHOD4(DisplayRoundFinishedDialog, int(bool isReplayMode, bool isGameReviewAvailable, CString message, CString oldMessage));
};
