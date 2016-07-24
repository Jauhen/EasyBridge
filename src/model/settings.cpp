#include "stdafx.h"
#include <string>
#include <stdlib.h>
#include "engine/card_constants.h"
#include "engine/PLAYER.H"
#include "engine/bidding/Bidopts.h"
#include "model/DEALPARM.H"
#include "model/Globals.h"
#include "model/settings.h"

// default order in which suits get displayed, left to right
const int defSuitDisplaySequence[5][4] = {
	{SPADES, HEARTS, CLUBS, DIAMONDS},
	{SPADES, HEARTS, DIAMONDS, CLUBS},
	{DIAMONDS, CLUBS, HEARTS, SPADES},
	{CLUBS, DIAMONDS, HEARTS, SPADES},
	{HEARTS, SPADES, DIAMONDS, CLUBS},
};
const int tnumSuitSequences = sizeof(defSuitDisplaySequence) / sizeof(int[4]);

//
const double c_tfDefaultMajorSuitGamePts = 26;
const double c_tfDefaultMinorSuitGamePts = 29;
const double c_tfDefaultNTGamePts = 26;
const double c_tfDefault4LevelPts = 26;
const double c_tfDefault3LevelPts = 23;
const double c_tfDefault2LevelPts = 20;
const double c_tfDefaultSlamPts = 33;
const double c_tfDefaultGrandSlamPts = 37;

// static data
double	Settings::m_fDefaultMajorSuitGamePts = c_tfDefaultMajorSuitGamePts;
double	Settings::m_fDefaultMinorSuitGamePts = c_tfDefaultMinorSuitGamePts;
double	Settings::m_fDefaultNTGamePts = c_tfDefaultNTGamePts;
double	Settings::m_fDefault4LevelPts = c_tfDefault4LevelPts;
double	Settings::m_fDefault3LevelPts = c_tfDefault3LevelPts;
double	Settings::m_fDefault2LevelPts = c_tfDefault2LevelPts;
double	Settings::m_fDefaultSlamPts = c_tfDefaultSlamPts;
double	Settings::m_fDefaultGrandSlamPts = c_tfDefaultGrandSlamPts;
//
double	Settings::m_fMajorSuitGamePts = c_tfDefaultMajorSuitGamePts;
double	Settings::m_fMinorSuitGamePts = c_tfDefaultMinorSuitGamePts;
double	Settings::m_fGamePts = c_tfDefaultNTGamePts;
double	Settings::m_fNTGamePts = c_tfDefaultNTGamePts;
double	Settings::m_f4LevelPts = c_tfDefault4LevelPts;
double	Settings::m_f3LevelPts = c_tfDefault3LevelPts;
double	Settings::m_f2LevelPts = c_tfDefault2LevelPts;
double	Settings::m_fSlamPts = c_tfDefaultSlamPts;
double	Settings::m_fGrandSlamPts = c_tfDefaultGrandSlamPts;


double Settings::m_fHonorValue[] = {
  // 0  1  2  3  4  5  6  7  8  9  T  J  Q  K  A
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
};

//
// default counting options
const int tnDefaultAceValue = 4;
const int tnDefaultKingValue = 3;
const int tnDefaultQueenValue = 2;
const int tnDefaultJackValue = 1;
const double tfGinsburgAceValue = 4.5;
const double tfGinsburgKingValue = 3.0;
const double tfGinsburgQueenValue = 1.5;
const double tfGinsburgJackValue = 0.8;


LPCTSTR tszDefaultAceValue = _T("4");
LPCTSTR tszDefaultKingValue = _T("3");
LPCTSTR tszDefaultQueenValue = _T("2");
LPCTSTR tszDefaultJackValue = _T("1");



Settings::Settings() {
}

Settings::~Settings() {
}


// display options
static TCHAR BASED_CODE szDisplayOptions[] = _T("Display Options");
static TCHAR BASED_CODE szSuitSequence[] = _T("Suit Display Order");
static TCHAR BASED_CODE szLowResOption[] = _T("Low Resolution Option");
static TCHAR BASED_CODE szLayoutFollowsDisplayOrder[] = _T("Card Layout Dialog follows Display Suit Order");
static TCHAR BASED_CODE szShowDummyTrumpsOnLeft[] = _T("Show Dummy Trumps on Left");
static TCHAR BASED_CODE szShowStartupAnimation[] = _T("Show Startup Animation");
static TCHAR BASED_CODE szShowSplashWindow[] = _T("Show Splash Window");
static TCHAR BASED_CODE szShowDailyTips[] = _T("Show Tip of the Day");
static TCHAR BASED_CODE szShowScreenSizeWarning[] = _T("Show Screen Size Warning");
static TCHAR BASED_CODE szShowBackgroundBitmap[] = _T("Show Background Bitmap Display");
static TCHAR BASED_CODE szBitmapDisplayMode[] = _T("Background Bitmap Display Mode (0=Tile, 1=Center)");
static TCHAR BASED_CODE szScaleLargeBitmaps[] = _T("Scale Large Background Bitmaps");
static TCHAR BASED_CODE szBackgroundColor[] = _T("Window Background Color");
static TCHAR BASED_CODE szUseSuitSymbols[] = _T("Use Suit Symbols Instead of Letters");
static TCHAR BASED_CODE szShowLayoutOnEdit[] = _T("Automatically Show Card Layout Dialog When Editing Existing Hands");
static TCHAR BASED_CODE szCollapseGameReviewDialog[] = _T("Hide tags list in Game Review dialog");

// game options
static TCHAR BASED_CODE szGameOptions[] = _T("Game Options");
static TCHAR BASED_CODE szAutoBidStart[] = _T("Auto Start Bidding after Deal");
static TCHAR BASED_CODE szEnableAnalysisTracing[] = _T("Enable Computer Player Analysis Tracing");
static TCHAR BASED_CODE szEnableAnalysisDuringHints[] = _T("Enable Analysis Tracing When Obtaining Hints");
static TCHAR BASED_CODE szAutoHintMode[] = _T("Auto Hint Level");
static TCHAR BASED_CODE szAutoHintTraceLevel[] = _T("Auto Hint Trace Level");
static TCHAR BASED_CODE szAnalysisTraceLevel[] = _T("Computer Player Analysis Trace Level");
//static TCHAR BASED_CODE szShowCommentIdentifiers[] = _T("Suppress Comment Identifier Codes");
static TCHAR BASED_CODE szShowCommentIdentifiers[] = _T("Show Comment Identifier Codes");
static TCHAR BASED_CODE szInsertBiddingPause[] = _T("Insert Pause between Bids");
static TCHAR BASED_CODE szBiddingPauseLength[] = _T("Pause Length between Bids (tenths of a second)");
static TCHAR BASED_CODE szInsertPlayPause[] = _T("Insert Pause between Plays");
static TCHAR BASED_CODE szPlayPauseLength[] = _T("Pause Length between Plays (tenths of a second)");
static TCHAR BASED_CODE szComputerCanClaim[] = _T("Computer Player Can Claim Remaining Tricks");
static TCHAR BASED_CODE szShowPassedHands[] = _T("Show All Four Hands When a Hand Is Passed Out");
static TCHAR BASED_CODE szAllowRebidPassedHands[] = _T("Allow Rebid On a Passed Hand");
static TCHAR BASED_CODE szPassedHandWaitInterval[] = _T("Time to Wait After Passed Hand to Deal New Hand");
static TCHAR BASED_CODE szAutoShowBidHistory[] = _T("Automatically Show Bid History When Biddding");
static TCHAR BASED_CODE szAutoShowPlayHistory[] = _T("Automatically Show Play History During Play");
static TCHAR BASED_CODE szAutoHideBidHistory[] = _T("Automatically Hide Bid History During Play");
static TCHAR BASED_CODE szAutoHidePlayHistory[] = _T("Automatically Hide Play History When Bidding");
//static TCHAR BASED_CODE szAutoShowNNetOutputWhenTraining[] = _T("Automatically show Neural Net Output Dialog When in Training Mode");
static TCHAR BASED_CODE szPlayMode[] = _T("Game Play Mode");
static TCHAR BASED_CODE szPlayModeLocked[] = _T("Game Play Mode Locked");
static TCHAR BASED_CODE szAutoJumpCursor[] = _T("Automatically Jump the Cursor");
static TCHAR BASED_CODE szAutoPlayLastCard[] = _T("Automatically play the last card in the suit led");
static TCHAR BASED_CODE szEnableSpokenBids[] = _T("Enable Spoken Bids");
static TCHAR BASED_CODE szSaveIntermediatePositions[] = _T("Save Intermediate Positions When Saving Hands");
static TCHAR BASED_CODE szExposePBNGameCards[] = _T("Expose All Cards When a PBN Game Is Loaded");

// GIB options
static TCHAR BASED_CODE szGIBOptions[] = _T("GIB Options");
static TCHAR BASED_CODE szGIBPath[] = _T("GIB Executable Path");
static TCHAR BASED_CODE szEnableGIBForDeclarer[] = _T("Enable GIB for Declarer Play");
static TCHAR BASED_CODE szEnableGIBForDefender[] = _T("Enable GIB for Defender Play");
static TCHAR BASED_CODE szGIBAnalysisTime[] = _T("GIB Max Analysis Time");
static TCHAR BASED_CODE szGIBSampleSize[] = _T("GIB Monte Carlo Deal Sample Size");
static TCHAR BASED_CODE szShowGIBOutput[] = _T("Show GIB Program Output");

// counting options
static TCHAR BASED_CODE szCountingOptions[] = _T("Counting Options");
static TCHAR BASED_CODE szAggressivenessRating[] = _T("Bidding Aggressiveness Rating (-2 to + 2)");
static TCHAR BASED_CODE szHonorsValuationMode[] = _T("Honors Valuation Mode");
static TCHAR BASED_CODE szCustomAceValue[] = _T("Custom Value of an Ace");
static TCHAR BASED_CODE szCustomKingValue[] = _T("Custom value of a King");
static TCHAR BASED_CODE szCustomQueenValue[] = _T("Custom value of a Queen");
static TCHAR BASED_CODE szCustomJackValue[] = _T("Custom value of a Jack");
static TCHAR BASED_CODE szMajorSuitGamePts[] = _T("Default Points needed for Game in a Major Suit");
static TCHAR BASED_CODE szMinorSuitGamePts[] = _T("Default Points needed for Game in a Minor Suit");
static TCHAR BASED_CODE szNTGamePts[] = _T("Default Points needed for Game in No Trump");
static TCHAR BASED_CODE sz4LevelPts[] = _T("Default Points needed for a Level 4 Countract");
static TCHAR BASED_CODE sz3LevelPts[] = _T("Default Points needed for a Level 3 Countract");
static TCHAR BASED_CODE sz2LevelPts[] = _T("Default Points needed for a Level 2 Countract");
static TCHAR BASED_CODE szSlamPts[] = _T("Default Points needed for a Small Slam bid");
static TCHAR BASED_CODE szGrandSlamPts[] = _T("Default Points needed for a Grand Slam bid");
static TCHAR BASED_CODE szAcelessPenalty[] = _T("Deduct 1 pt for Aceless Hand");
static TCHAR BASED_CODE sz4AceBonus[] = _T("Add 1 pt for Holding All 4 Aces");
static TCHAR BASED_CODE szPenalizeUGHonors[] = _T("Penalize Unguarded/Poorly Guarded Honors");
static TCHAR BASED_CODE szCountShortSuits[] = _T("Count Points for Short Suits When Opening");

// deal options
static TCHAR BASED_CODE szDealOptions[] = _T("Deal Options");
static TCHAR BASED_CODE szMinGamePts[] = _T("Min Points for Game Hand");
static TCHAR BASED_CODE szMaxGamePts[] = _T("Max Points for Game Hand");
static TCHAR BASED_CODE szMinMinorGamePts[] = _T("Min Points for Minor Game Hand");
static TCHAR BASED_CODE szMaxMinorGamePts[] = _T("Max Points for Minor Game Hand");
static TCHAR BASED_CODE szMinMajorGamePts[] = _T("Min Points for Major Game Hand");
static TCHAR BASED_CODE szMaxMajorGamePts[] = _T("Max Points for Major Game Hand");
static TCHAR BASED_CODE szMinNoTrumpGamePts[] = _T("Min Points for No Trump Game Hand");
static TCHAR BASED_CODE szMaxNoTrumpGamePts[] = _T("Max Points for No Trump Game Hand");
static TCHAR BASED_CODE szMinSlamPts[] = _T("Min Points for Slam Hand");
static TCHAR BASED_CODE szMaxSlamPts[] = _T("Max Points for Slam Hand");
static TCHAR BASED_CODE szMinSmallSlamPts[] = _T("Min Points for Small Slam Hand");
static TCHAR BASED_CODE szMaxSmallSlamPts[] = _T("Max Points for Small Slam Hand");
static TCHAR BASED_CODE szMinGrandSlamPts[] = _T("Min Points for Grand Slam Hand");
static TCHAR BASED_CODE szMaxGrandSlamPts[] = _T("Max Points for Grand Slam Hand");
static TCHAR BASED_CODE szBalanceTeamHands[] = _T("Try to Balance Partnership Hands Points");
static TCHAR BASED_CODE szMinCardsInMajor[] = _T("Min # Cards in Major Suit");
static TCHAR BASED_CODE szMinCardsInMinor[] = _T("Min # Cards in Minor Suit");
static TCHAR BASED_CODE szMinSuitDistMinor[] = _T("Min Distribution for Minor Suit");
static TCHAR BASED_CODE szMinSuitDistMajor[] = _T("Min Distribution for Major Suit");
static TCHAR BASED_CODE szMinTopMajorCard[] = _T("Min Top Cards in Major Suit");
static TCHAR BASED_CODE szMinTopMinorCard[] = _T("Min Top Cards in Minor Suit");
static TCHAR BASED_CODE szMaxImbalanceForNT[] = _T("Max Imbalance for NT Game");
static TCHAR BASED_CODE szNeedTwoBalancedHandsForNT[] = _T("Need 2 Balanced Hands for NT Game");
static TCHAR BASED_CODE szAcesNeededForSlam[] = _T("Number of Aces to Deal for Slam Hand");
static TCHAR BASED_CODE szAcesNeededForSmallSlam[] = _T("Min Number of Aces to Deal for Small Slam Hand");
static TCHAR BASED_CODE szAcesNeededForGrandSlam[] = _T("Min Number of Aces to Deal for Grand Slam Hand");
static TCHAR BASED_CODE szKingsNeededForSlam[] = _T("Min Number of Kings to Deal for Slam Hand");
static TCHAR BASED_CODE szKingsNeededForSmallSlam[] = _T("Min Number of Kings to Deal for Small Slam Hand");
static TCHAR BASED_CODE szKingsNeededForGrandSlam[] = _T("Min Number of Kings to Deal for Grand Slam Hand");
static TCHAR BASED_CODE szEnableDealNumbering[] = _T("Enable Deal Numbering and Recall");

// scoring options
static TCHAR BASED_CODE szScoringOptions[] = _T("Scoring Options");
static TCHAR BASED_CODE szUseDuplicateScoring[] = _T("Use Duplicate Scoring");
static TCHAR BASED_CODE szScoreHonorsBonuses[] = _T("Score Honors Bonuses");

// convention settings
static TCHAR BASED_CODE szCurrConventionSet[] = _T("Current Convention Set");

// bidding config 
static TCHAR BASED_CODE szBiddingConfigOptions[] = _T("Bidding Configuration");
//static TCHAR BASED_CODE szBiddingEngine[] = _T("Bidding Engine (0 = Rule-Based, 1 = Neural Net)");
static TCHAR BASED_CODE szBiddingAggressiveness[] = _T("Bidding Aggressiveness (-2 to +2)");
/*
static TCHAR BASED_CODE szNumNNetHiddenLayers[] = _T("Default Neural Hidden Layers");
static TCHAR BASED_CODE szNumNNetNodesPerHiddenLayer[] = _T("Default Neural Nodes Per Hidden Layer");
static TCHAR BASED_CODE szNeuralNetFile[] = _T("Nueral Net File");
*/

// play options
static TCHAR BASED_CODE szPlayOptions[] = _T("Game Play Options");

// debug options
static TCHAR BASED_CODE szDebugOptions[] = _T("Debug Options");
static TCHAR BASED_CODE szEnableDebugMode[] = _T("Enable Debug Mode");
static TCHAR BASED_CODE szExposeAllCards[] = _T("Expose All Cards");


void Settings::Initialize() {
	// read in display options
	m_nSuitSeqOption = ReadIntConfig(szDisplayOptions, szSuitSequence, 0);
	m_bLayoutFollowsDisplayOrder = ReadIntConfig(szDisplayOptions, szLayoutFollowsDisplayOrder, TRUE);
	m_bLowResOption = ReadIntConfig(szDisplayOptions, szLowResOption, FALSE);
	m_bShowDummyTrumpsOnLeft = ReadIntConfig(szDisplayOptions, szShowDummyTrumpsOnLeft, TRUE);
	m_bShowStartupAnimation = ReadIntConfig(szDisplayOptions, szShowStartupAnimation, FALSE);
	m_bShowSplashWindow = ReadIntConfig(szDisplayOptions, szShowSplashWindow, TRUE);
	m_bShowDailyTipDialog = ReadIntConfig(szDisplayOptions, szShowDailyTips, TRUE);
	m_bShowScreenSizeWarning = ReadIntConfig(szDisplayOptions, szShowScreenSizeWarning, TRUE);
	m_bShowBackgroundBitmap = ReadIntConfig(szDisplayOptions, szShowBackgroundBitmap, TRUE);
	m_nBitmapDisplayMode = ReadIntConfig(szDisplayOptions, szBitmapDisplayMode, 1);
	m_bScaleLargeBitmaps = ReadIntConfig(szDisplayOptions, szScaleLargeBitmaps, FALSE);
	m_nBackgroundColor = ReadIntConfig(szDisplayOptions, szBackgroundColor, RGB(0, 128, 0));
	m_bUseSuitSymbols = ReadIntConfig(szDisplayOptions, szUseSuitSymbols, FALSE);
	m_bShowLayoutOnEdit = ReadIntConfig(szDisplayOptions, szShowLayoutOnEdit, FALSE);
	m_bCollapseGameReviewDialog = ReadIntConfig(szDisplayOptions, szCollapseGameReviewDialog, FALSE);

	// read in game options
	m_bAutoBidStart = ReadIntConfig(szGameOptions, szAutoBidStart, TRUE);
	m_bEnableAnalysisTracing = ReadIntConfig(szGameOptions, szEnableAnalysisTracing, FALSE);
	m_bEnableAnalysisDuringHints = ReadIntConfig(szGameOptions, szEnableAnalysisDuringHints, TRUE);
	m_nAnalysisTraceLevel = ReadIntConfig(szGameOptions, szAnalysisTraceLevel, 3);
#ifdef _DEBUG
	m_bShowCommentIdentifiers = ReadIntConfig(szGameOptions, szShowCommentIdentifiers, TRUE);
#else
	m_bShowCommentIdentifiers = ReadIntConfig(szGameOptions, szShowCommentIdentifiers, FALSE);
#endif
	m_nAutoHintMode = ReadIntConfig(szGameOptions, szAutoHintMode, 0);
	m_nAutoHintTraceLevel = ReadIntConfig(szGameOptions, szAutoHintTraceLevel, 2);
	m_bInsertBiddingPause = ReadIntConfig(szGameOptions, szInsertBiddingPause, TRUE);
	m_nBiddingPauseLength = ReadIntConfig(szGameOptions, szBiddingPauseLength, 3);
	m_bInsertPlayPause = ReadIntConfig(szGameOptions, szInsertPlayPause, TRUE);
	m_nPlayPauseLength = ReadIntConfig(szGameOptions, szPlayPauseLength, 10);
	m_bComputerCanClaim = ReadIntConfig(szGameOptions, szComputerCanClaim, FALSE);
	m_bShowPassedHands = ReadIntConfig(szGameOptions, szShowPassedHands, TRUE);
	m_bAllowRebidPassedHands = ReadIntConfig(szGameOptions, szAllowRebidPassedHands, FALSE);
	m_nPassedHandWaitInterval = ReadIntConfig(szGameOptions, szPassedHandWaitInterval, 1100);
	m_bAutoShowBidHistory = ReadIntConfig(szGameOptions, szAutoShowBidHistory, TRUE);
	m_bAutoShowPlayHistory = ReadIntConfig(szGameOptions, szAutoShowPlayHistory, TRUE);
	m_bAutoHideBidHistory = ReadIntConfig(szGameOptions, szAutoHideBidHistory, FALSE);
	m_bAutoHidePlayHistory = ReadIntConfig(szGameOptions, szAutoHidePlayHistory, FALSE);
	//	m_bAutoShowNNetOutputWhenTraining = ReadIntConfig(szGameOptions, szAutoShowNNetOutputWhenTraining, TRUE);
	m_bAutoJumpCursor = ReadIntConfig(szGameOptions, szAutoJumpCursor, FALSE);
	m_bAutoPlayLastCard = ReadIntConfig(szGameOptions, szAutoPlayLastCard, TRUE);
	//	m_bEnableSpokenBids = ReadIntConfig(szGameOptions, szEnableSpokenBids, FALSE);
	m_bSaveIntermediatePositions = ReadIntConfig(szGameOptions, szSaveIntermediatePositions, TRUE);
	m_bExposePBNGameCards = ReadIntConfig(szGameOptions, szExposePBNGameCards, TRUE);
#ifdef _DEBUG
	m_nPlayMode = ReadIntConfig(szGameOptions, szPlayMode, PLAY_NORMAL);
	m_bPlayModeLocked = ReadIntConfig(szGameOptions, szPlayModeLocked, FALSE);
#else
	m_nPlayMode = m_bPlayModeLocked = FALSE;
#endif

	// counting parameters
	m_nHonorsValuationMode = ReadIntConfig(szCountingOptions, szHonorsValuationMode, 0);
	m_fCustomAceValue = std::stod(ReadStringConfig(szCountingOptions, szCustomAceValue, tszDefaultAceValue));
	m_fCustomKingValue = std::stod(ReadStringConfig(szCountingOptions, szCustomKingValue, tszDefaultKingValue));
	m_fCustomQueenValue = std::stod(ReadStringConfig(szCountingOptions, szCustomQueenValue, tszDefaultQueenValue));
	m_fCustomJackValue = std::stod(ReadStringConfig(szCountingOptions, szCustomJackValue, tszDefaultJackValue));
	m_fDefaultMajorSuitGamePts = std::stod(ReadStringConfig(szCountingOptions, szMajorSuitGamePts, FormString("%f", c_tfDefaultMajorSuitGamePts)));
	m_fDefaultMinorSuitGamePts = std::stod(ReadStringConfig(szCountingOptions, szMinorSuitGamePts, FormString("%f", c_tfDefaultMinorSuitGamePts)));
	m_fDefaultNTGamePts = std::stod(ReadStringConfig(szCountingOptions, szNTGamePts, FormString("%f", c_tfDefaultNTGamePts)));
	m_fDefault4LevelPts = std::stod(ReadStringConfig(szCountingOptions, sz4LevelPts, FormString("%f", c_tfDefault4LevelPts)));
	m_fDefault3LevelPts = std::stod(ReadStringConfig(szCountingOptions, sz3LevelPts, FormString("%f", c_tfDefault3LevelPts)));
	m_fDefault2LevelPts = std::stod(ReadStringConfig(szCountingOptions, sz2LevelPts, FormString("%f", c_tfDefault2LevelPts)));
	m_fDefaultSlamPts = std::stod(ReadStringConfig(szCountingOptions, szSlamPts, FormString("%f", c_tfDefaultSlamPts)));
	m_fDefaultGrandSlamPts = std::stod(ReadStringConfig(szCountingOptions, szGrandSlamPts, FormString("%f", c_tfDefaultGrandSlamPts)));
	/*
	m_bAcelessPenalty = ReadIntConfig(szCountingOptions, szAcelessPenalty, TRUE);
	m_b4AceBonus = ReadIntConfig(szCountingOptions, sz4AceBonus, TRUE);
	m_bPenalizeUGHonors = ReadIntConfig(szCountingOptions, szPenalizeUGHonors, FALSE);
	m_bCountShortSuits = ReadIntConfig(szCountingOptions, szCountShortSuits, TRUE);
	*/
	m_bAcelessPenalty = TRUE;
	m_b4AceBonus = TRUE;
	m_bPenalizeUGHonors = TRUE;
	m_bCountShortSuits = TRUE;

	// get GIB options
	m_strGIBPath = ReadStringConfig(szGIBOptions, szGIBPath, "C:\\");
	m_bEnableGIBForDeclarer = ReadIntConfig(szGIBOptions, szEnableGIBForDeclarer, FALSE);
	//	m_bEnableGIBForDefender = ReadIntConfig(szGIBOptions, szEnableGIBForDefender, FALSE);
	m_bEnableGIBForDefender = FALSE;
	m_nGIBAnalysisTime = ReadIntConfig(szGIBOptions, szGIBAnalysisTime, 30);
	m_nGIBSampleSize = ReadIntConfig(szGIBOptions, szGIBSampleSize, 100);
	m_bShowGIBOutput = ReadIntConfig(szGIBOptions, szShowGIBOutput, FALSE);

	//	m_nCurrConventionSet = ReadIntConfig(szBiddingConventions, szCurrConvSet, 0);
	m_nCurrConventionSet = 0;

	// get deal options
	m_nReqPointsGame[0][0] = ReadIntConfig(szDealOptions, szMinGamePts, nDefReqPointsGame[0][0]);
	m_nReqPointsGame[0][1] = ReadIntConfig(szDealOptions, szMaxGamePts, nDefReqPointsGame[0][1]);
	m_nReqPointsGame[1][0] = ReadIntConfig(szDealOptions, szMinMinorGamePts, nDefReqPointsGame[1][0]);
	m_nReqPointsGame[1][1] = ReadIntConfig(szDealOptions, szMaxMinorGamePts, nDefReqPointsGame[1][1]);
	m_nReqPointsGame[2][0] = ReadIntConfig(szDealOptions, szMinMajorGamePts, nDefReqPointsGame[2][0]);
	m_nReqPointsGame[2][1] = ReadIntConfig(szDealOptions, szMaxMajorGamePts, nDefReqPointsGame[2][1]);
	m_nReqPointsGame[3][0] = ReadIntConfig(szDealOptions, szMinNoTrumpGamePts, nDefReqPointsGame[3][0]);
	m_nReqPointsGame[3][1] = ReadIntConfig(szDealOptions, szMaxNoTrumpGamePts, nDefReqPointsGame[3][1]);
	m_nReqPointsSlam[0][0] = ReadIntConfig(szDealOptions, szMinSlamPts, nDefReqPointsSlam[0][0]);
	m_nReqPointsSlam[0][1] = ReadIntConfig(szDealOptions, szMaxSlamPts, nDefReqPointsSlam[0][1]);
	m_nReqPointsSlam[1][0] = ReadIntConfig(szDealOptions, szMinSmallSlamPts, nDefReqPointsSlam[1][0]);
	m_nReqPointsSlam[1][1] = ReadIntConfig(szDealOptions, szMaxSmallSlamPts, nDefReqPointsSlam[1][1]);
	m_nReqPointsSlam[2][0] = ReadIntConfig(szDealOptions, szMinGrandSlamPts, nDefReqPointsSlam[2][0]);
	m_nReqPointsSlam[2][1] = ReadIntConfig(szDealOptions, szMaxGrandSlamPts, nDefReqPointsSlam[2][1]);
	m_bBalanceTeamHands = ReadIntConfig(szDealOptions, szBalanceTeamHands, bDefBalanceTeamHands);
	//
	m_nMinCardsInMajor = ReadIntConfig(szDealOptions, szMinCardsInMajor, nDefMinCardsInMajor);
	m_nMinCardsInMinor = ReadIntConfig(szDealOptions, szMinCardsInMinor, nDefMinCardsInMinor);
	m_nMinSuitDist[0] = ReadIntConfig(szDealOptions, szMinSuitDistMinor, nDefMinSuitDist[0]);
	m_nMinSuitDist[1] = ReadIntConfig(szDealOptions, szMinSuitDistMajor, nDefMinSuitDist[1]);
	m_nMinTopMajorCard = ReadIntConfig(szDealOptions, szMinTopMajorCard, nDefMinTopMajorCard);
	m_nMinTopMinorCard = ReadIntConfig(szDealOptions, szMinTopMinorCard, nDefMinTopMinorCard);
	//	m_nMaxImbalanceForNT = ReadIntConfig(szDealOptions, szMaxImbalanceForNT, nDefMaxBalancedForNT);
	m_nMaxImbalanceForNT = nDefMaxBalancedForNT;
	m_bNeedTwoBalancedTrumpHands = ReadIntConfig(szDealOptions, szNeedTwoBalancedHandsForNT, bDefNeedTwoBalancedTrumpHands);
	m_numAcesForSlam[0] = ReadIntConfig(szDealOptions, szAcesNeededForSlam, nDefNumAcesForSlam[0]);
	m_numAcesForSlam[1] = ReadIntConfig(szDealOptions, szAcesNeededForSmallSlam, nDefNumAcesForSlam[1]);
	m_numAcesForSlam[2] = ReadIntConfig(szDealOptions, szAcesNeededForGrandSlam, nDefNumAcesForSlam[2]);
	m_numKingsForSlam[0] = ReadIntConfig(szDealOptions, szAcesNeededForSlam, nDefNumKingsForSlam[0]);
	m_numKingsForSlam[1] = ReadIntConfig(szDealOptions, szAcesNeededForSmallSlam, nDefNumKingsForSlam[1]);
	m_numKingsForSlam[2] = ReadIntConfig(szDealOptions, szAcesNeededForGrandSlam, nDefNumKingsForSlam[2]);
	m_bEnableDealNumbering = ReadIntConfig(szDealOptions, szEnableDealNumbering, TRUE);

	// get scoring options
	m_bDuplicateScoring = ReadIntConfig(szScoringOptions, szUseDuplicateScoring, FALSE);
	m_bScoreHonorsBonuses = ReadIntConfig(szScoringOptions, szScoreHonorsBonuses, FALSE);

	// get bidding config options
	m_fBiddingAggressiveness = std::stod(ReadStringConfig(szBiddingConfigOptions, szBiddingAggressiveness, "0.0"));
	/*
	m_nBiddingEngine = ReadIntConfig(szBiddingConfigOptions, szBiddingEngine, 0);
	m_numNNetHiddenLayers = ReadIntConfig(szBiddingConfigOptions, szNumNNetHiddenLayers, tnumNNetHiddenLayers);
	m_numNNetNodesPerHiddenLayer = ReadIntConfig(szBiddingConfigOptions, szNumNNetNodesPerHiddenLayer, tnumNNetNodesPerHiddenLayer);
	m_strNeuralNetFile = ReadStringConfig(szBiddingConfigOptions, szNeuralNetFile, _T(""));
	*/
	// get debug options
	m_bDebugMode = ReadIntConfig(szDebugOptions, szEnableDebugMode, TRUE);
	m_bShowCardsFaceUp = ReadIntConfig(szDebugOptions, szExposeAllCards, FALSE);
}

//
void Settings::Terminate() {
	// read in display options
	WriteIntConfig(szDisplayOptions, szSuitSequence, m_nSuitSeqOption);
	WriteIntConfig(szDisplayOptions, szLayoutFollowsDisplayOrder, m_bLayoutFollowsDisplayOrder);
	WriteIntConfig(szDisplayOptions, szLowResOption, m_bToggleResolutionMode ? !m_bLowResOption : m_bLowResOption);
	WriteIntConfig(szDisplayOptions, szShowDummyTrumpsOnLeft, m_bShowDummyTrumpsOnLeft);
	WriteIntConfig(szDisplayOptions, szShowStartupAnimation, m_bShowStartupAnimation);
	WriteIntConfig(szDisplayOptions, szShowSplashWindow, m_bShowSplashWindow);
	WriteIntConfig(szDisplayOptions, szShowDailyTips, m_bShowDailyTipDialog);
	WriteIntConfig(szDisplayOptions, szShowScreenSizeWarning, m_bShowScreenSizeWarning);
	WriteIntConfig(szDisplayOptions, szShowBackgroundBitmap, m_bShowBackgroundBitmap);
	WriteIntConfig(szDisplayOptions, szBitmapDisplayMode, m_nBitmapDisplayMode);
	WriteIntConfig(szDisplayOptions, szScaleLargeBitmaps, m_bScaleLargeBitmaps);
	WriteIntConfig(szDisplayOptions, szBackgroundColor, m_nBackgroundColor);
	WriteIntConfig(szDisplayOptions, szUseSuitSymbols, m_bUseSuitSymbols);
	WriteIntConfig(szDisplayOptions, szShowLayoutOnEdit, m_bShowLayoutOnEdit);
	WriteIntConfig(szDisplayOptions, szCollapseGameReviewDialog, m_bCollapseGameReviewDialog);

	// write out game options
	WriteIntConfig(szGameOptions, szAutoBidStart, m_bAutoBidStart);
	WriteIntConfig(szGameOptions, szEnableAnalysisTracing, m_bEnableAnalysisTracing);
	WriteIntConfig(szGameOptions, szEnableAnalysisDuringHints, m_bEnableAnalysisDuringHints);
	WriteIntConfig(szGameOptions, szAutoHintMode, m_nAutoHintMode);
	WriteIntConfig(szGameOptions, szAutoHintTraceLevel, m_nAutoHintTraceLevel);
	WriteIntConfig(szGameOptions, szAnalysisTraceLevel, m_nAnalysisTraceLevel);
	WriteIntConfig(szGameOptions, szShowCommentIdentifiers, m_bShowCommentIdentifiers);
	WriteIntConfig(szGameOptions, szInsertBiddingPause, m_bInsertBiddingPause);
	WriteIntConfig(szGameOptions, szBiddingPauseLength, m_nBiddingPauseLength);
	WriteIntConfig(szGameOptions, szInsertPlayPause, m_bInsertPlayPause);
	WriteIntConfig(szGameOptions, szPlayPauseLength, m_nPlayPauseLength);
	WriteIntConfig(szGameOptions, szComputerCanClaim, m_bComputerCanClaim);
	WriteIntConfig(szGameOptions, szShowPassedHands, m_bShowPassedHands);
	WriteIntConfig(szGameOptions, szAllowRebidPassedHands, m_bAllowRebidPassedHands);
	WriteIntConfig(szGameOptions, szPassedHandWaitInterval, m_nPassedHandWaitInterval);
	WriteIntConfig(szGameOptions, szAutoShowBidHistory, m_bAutoShowBidHistory);
	WriteIntConfig(szGameOptions, szAutoShowPlayHistory, m_bAutoShowPlayHistory);
	WriteIntConfig(szGameOptions, szAutoHideBidHistory, m_bAutoHideBidHistory);
	WriteIntConfig(szGameOptions, szAutoHidePlayHistory, m_bAutoHidePlayHistory);
	//	WriteIntConfig(szGameOptions, szAutoShowNNetOutputWhenTraining, m_bAutoShowNNetOutputWhenTraining);
	WriteIntConfig(szGameOptions, szAutoJumpCursor, m_bAutoJumpCursor);
	WriteIntConfig(szGameOptions, szAutoPlayLastCard, m_bAutoPlayLastCard);
	//	WriteIntConfig(szGameOptions, szEnableSpokenBids, m_bEnableSpokenBids);
	WriteIntConfig(szGameOptions, szSaveIntermediatePositions, m_bSaveIntermediatePositions);
	WriteIntConfig(szGameOptions, szExposePBNGameCards, m_bExposePBNGameCards);
#ifdef _DEBUG
	WriteIntConfig(szGameOptions, szPlayMode, m_nPlayMode);
	WriteIntConfig(szGameOptions, szPlayModeLocked, m_bPlayModeLocked);
#endif

	// write out counting parameters
	WriteIntConfig(szCountingOptions, szHonorsValuationMode, m_nHonorsValuationMode);
	if (m_nHonorsValuationMode == 2) {
		WriteStringConfig(szCountingOptions, szCustomAceValue, FormString(_T("%.4f"), m_fCustomAceValue));
		WriteStringConfig(szCountingOptions, szCustomKingValue, FormString(_T("%.4f"), m_fCustomKingValue));
		WriteStringConfig(szCountingOptions, szCustomQueenValue, FormString(_T("%.4f"), m_fCustomQueenValue));
		WriteStringConfig(szCountingOptions, szCustomJackValue, FormString(_T("%.4f"), m_fCustomJackValue));
	}
	WriteStringConfig(szCountingOptions, szMajorSuitGamePts, FormString("%f", m_fDefaultMajorSuitGamePts));
	WriteStringConfig(szCountingOptions, szMinorSuitGamePts, FormString("%f", m_fDefaultMinorSuitGamePts));
	WriteStringConfig(szCountingOptions, szNTGamePts, FormString("%f", m_fDefaultNTGamePts));
	WriteStringConfig(szCountingOptions, sz4LevelPts, FormString("%f", m_fDefault4LevelPts));
	WriteStringConfig(szCountingOptions, sz3LevelPts, FormString("%f", m_fDefault3LevelPts));
	WriteStringConfig(szCountingOptions, sz2LevelPts, FormString("%f", m_fDefault2LevelPts));
	WriteStringConfig(szCountingOptions, szSlamPts, FormString("%f", m_fDefaultSlamPts));
	WriteStringConfig(szCountingOptions, szGrandSlamPts, FormString("%f", m_fDefaultGrandSlamPts));
	/*
	WriteIntConfig(szCountingOptions, szAcelessPenalty, m_bAcelessPenalty);
	WriteIntConfig(szCountingOptions, sz4AceBonus, m_b4AceBonus);
	WriteIntConfig(szCountingOptions, szPenalizeUGHonors, m_bPenalizeUGHonors);
	WriteIntConfig(szCountingOptions, szCountShortSuits, m_bCountShortSuits);
	*/

	// write out GIB options
	WriteStringConfig(szGIBOptions, szGIBPath, m_strGIBPath.c_str());
	WriteIntConfig(szGIBOptions, szEnableGIBForDeclarer, m_bEnableGIBForDeclarer);
	//	WriteIntConfig(szGIBOptions, szEnableGIBForDefender, m_bEnableGIBForDefender);
	WriteIntConfig(szGIBOptions, szGIBAnalysisTime, m_nGIBAnalysisTime);
	WriteIntConfig(szGIBOptions, szGIBSampleSize, m_nGIBSampleSize);
	WriteIntConfig(szGIBOptions, szShowGIBOutput, m_bShowGIBOutput);


	// write out deal options
	WriteIntConfig(szDealOptions, szMinGamePts, m_nReqPointsGame[0][0]);
	WriteIntConfig(szDealOptions, szMaxGamePts, m_nReqPointsGame[0][1]);
	WriteIntConfig(szDealOptions, szMinMinorGamePts, m_nReqPointsGame[1][0]);
	WriteIntConfig(szDealOptions, szMaxMinorGamePts, m_nReqPointsGame[1][1]);
	WriteIntConfig(szDealOptions, szMinMajorGamePts, m_nReqPointsGame[2][0]);
	WriteIntConfig(szDealOptions, szMaxMajorGamePts, m_nReqPointsGame[2][1]);
	WriteIntConfig(szDealOptions, szMinNoTrumpGamePts, m_nReqPointsGame[3][0]);
	WriteIntConfig(szDealOptions, szMaxNoTrumpGamePts, m_nReqPointsGame[3][1]);
	WriteIntConfig(szDealOptions, szMinSlamPts, m_nReqPointsSlam[0][0]);
	WriteIntConfig(szDealOptions, szMaxSlamPts, m_nReqPointsSlam[0][1]);
	WriteIntConfig(szDealOptions, szMinSmallSlamPts, m_nReqPointsSlam[1][0]);
	WriteIntConfig(szDealOptions, szMaxSmallSlamPts, m_nReqPointsSlam[1][1]);
	WriteIntConfig(szDealOptions, szMinGrandSlamPts, m_nReqPointsSlam[2][0]);
	WriteIntConfig(szDealOptions, szMaxGrandSlamPts, m_nReqPointsSlam[2][1]);
	WriteIntConfig(szDealOptions, szBalanceTeamHands, m_bBalanceTeamHands);
	WriteIntConfig(szDealOptions, szMinCardsInMajor, m_nMinCardsInMajor);
	WriteIntConfig(szDealOptions, szMinCardsInMinor, m_nMinCardsInMinor);
	WriteIntConfig(szDealOptions, szMinSuitDistMinor, m_nMinSuitDist[0]);
	WriteIntConfig(szDealOptions, szMinSuitDistMajor, m_nMinSuitDist[1]);
	WriteIntConfig(szDealOptions, szMinTopMajorCard, m_nMinTopMajorCard);
	WriteIntConfig(szDealOptions, szMinTopMinorCard, m_nMinTopMinorCard);
	//	WriteIntConfig(szDealOptions, szMaxImbalanceForNT, m_nMaxImbalanceForNT);
	WriteIntConfig(szDealOptions, szNeedTwoBalancedHandsForNT, m_bNeedTwoBalancedTrumpHands);
	WriteIntConfig(szDealOptions, szAcesNeededForSlam, m_numAcesForSlam[0]);
	WriteIntConfig(szDealOptions, szAcesNeededForSmallSlam, m_numAcesForSlam[1]);
	WriteIntConfig(szDealOptions, szAcesNeededForGrandSlam, m_numAcesForSlam[2]);
	WriteIntConfig(szDealOptions, szKingsNeededForSlam, m_numKingsForSlam[0]);
	WriteIntConfig(szDealOptions, szKingsNeededForSmallSlam, m_numKingsForSlam[1]);
	WriteIntConfig(szDealOptions, szKingsNeededForGrandSlam, m_numKingsForSlam[2]);
	WriteIntConfig(szDealOptions, szEnableDealNumbering, m_bEnableDealNumbering);

	// write out bidding config options
	//	WriteIntConfig(szBiddingConfigOptions, szBiddingEngine, m_nBiddingEngine);
	WriteStringConfig(szBiddingConfigOptions, szBiddingAggressiveness, FormString("%f", m_fBiddingAggressiveness));
	/*
	WriteIntConfig(szBiddingConfigOptions, szNumNNetHiddenLayers, m_numNNetHiddenLayers);
	WriteIntConfig(szBiddingConfigOptions, szNumNNetNodesPerHiddenLayer, m_numNNetNodesPerHiddenLayer);
	WriteStringConfig(szBiddingConfigOptions, szNeuralNetFile, m_strNeuralNetFile );
	*/
	// save scoring options
	WriteIntConfig(szScoringOptions, szUseDuplicateScoring, m_bDuplicateScoring);
	WriteIntConfig(szScoringOptions, szScoreHonorsBonuses, m_bScoreHonorsBonuses);

	//
	//	WriteIntConfig(szBiddingConventions, szCurrConvSet, m_nCurrConvSet);
	// write out play options

	// write out debug options
	// get debug options
	WriteIntConfig(szDebugOptions, szEnableDebugMode, m_bDebugMode);
	WriteIntConfig(szDebugOptions, szExposeAllCards, m_bShowCardsFaceUp);
}


void Settings::InitSettings() {
	// init flags
	m_nTestMode = 0;
	m_bBiddingInProgress = FALSE;
	m_bGameInProgress = FALSE;
	m_bRubberInProgress = FALSE;
	m_bAutoTestMode = FALSE;

	//
	m_bToggleResolutionMode = FALSE;

	//
	InitPointCountRequirements();
	InitHonorsValuations();

	// #### TEMP ####
	m_nGameMode = 0;
	m_bManualPlayMode = FALSE;

	// set suit sequence
	for (int i = 0; i < tnumSuitSequences; i++) {
		for (int j = 0; j < 4; j++) {
			m_nSuitSeqList[i][j] = defSuitDisplaySequence[i][j];
		}
	}

	//
	SetSuitSequence(m_nSuitSeqOption);


	//
	// set default point limits
	//
	int i, j, k;
	for (i = 0; i < 2; i++) {
		for (j = 0; j < 4; j++) {
			for (k = 0; k < 2; k++) {
				m_nMinSuitDistTable[i][j][k] = nDefMinSuitDistTable[i][j][k];
			}
		}
	}
	for (i = 0; i < 4; i++) {
		for (j = 0; j < 2; j++) {
			m_nPointsAbsGameLimits[i][j] = nDefPointsAbsGameLimits[i][j];
		}
	}
	for (i = 0; i < 3; i++) {
		for (j = 0; j < 2; j++) {
			m_nPointsAbsSlamLimits[i][j] = nDefPointsSlamLimits[i][j];
		}
	}

  m_nCurrConventionSet = 0;
  m_numConventionSets = 1;
}



//
// RefreshProperties()
//
// - refreshes info after properties have been changed
//
void Settings::RefreshProperties() {
  //
  InitHonorsValuations();
}


//
// InitHonorsValuations()
//
void Settings::InitHonorsValuations() {
  // set honors values
  switch (m_nHonorsValuationMode) {
    case 1:		// Ginsburg
      m_fAceValue = tfGinsburgAceValue;
      m_fKingValue = tfGinsburgKingValue;
      m_fQueenValue = tfGinsburgQueenValue;
      m_fJackValue = tfGinsburgJackValue;
      m_fTenValue = 0;
      break;
    case 2:		// custom
      m_fAceValue = m_fCustomAceValue;
      m_fKingValue = m_fCustomKingValue;
      m_fQueenValue = m_fCustomQueenValue;
      m_fJackValue = m_fCustomJackValue;
      m_fTenValue = 0;
      break;
    default:
      m_fAceValue = tnDefaultAceValue;
      m_fKingValue = tnDefaultKingValue;
      m_fQueenValue = tnDefaultQueenValue;
      m_fJackValue = tnDefaultJackValue;
      m_fTenValue = 0;
      break;
  }

  // fill the static array
  m_fHonorValue[ACE] = m_fAceValue;
  m_fHonorValue[KING] = m_fKingValue;
  m_fHonorValue[QUEEN] = m_fQueenValue;
  m_fHonorValue[JACK] = m_fJackValue;
  m_fHonorValue[TEN] = m_fTenValue;
}



//
// InitPointCountRequirements()
//
void Settings::InitPointCountRequirements() {
	// adjust point count requirements
	m_fMajorSuitGamePts = m_fDefaultMajorSuitGamePts - m_fBiddingAggressiveness;
	m_fMinorSuitGamePts = m_fDefaultMinorSuitGamePts - m_fBiddingAggressiveness;
	m_fNTGamePts = m_fDefaultNTGamePts - m_fBiddingAggressiveness;
	m_f4LevelPts = m_fDefault4LevelPts - m_fBiddingAggressiveness;
	m_f3LevelPts = m_fDefault3LevelPts - m_fBiddingAggressiveness;
	m_f2LevelPts = m_fDefault2LevelPts - m_fBiddingAggressiveness;
	m_fSlamPts = m_fDefaultSlamPts - m_fBiddingAggressiveness;
	m_fGrandSlamPts = m_fDefaultGrandSlamPts - m_fBiddingAggressiveness;
}

//
CString Settings::GetProgramVersionString() {
	return FormString("Version %d.%d.%d%s",
		GetProgramMajorVersion(),
		GetProgramMinorVersion(),
		GetProgramIncrementVersion(),
		GetSpecialBuildCode());
}

//
CString Settings::GetFullProgramVersionString() {
	CString strVersion, strSpecialBuildCode = GetSpecialBuildCode();
	strVersion.Format("Version %d.%d.%d%s",
		GetProgramMajorVersion(),
		GetProgramMinorVersion(),
		GetProgramIncrementVersion(),
		strSpecialBuildCode);
	//
	int nBuild = GetProgramBuildNumber();
	if (nBuild > 0)
		strVersion += FormString(_T(", Build #%d"), nBuild);
	//
	return strVersion;
}


//


//
void Settings::InitDummySuitSequence(int nTrumpSuit, int nDummyPosition) {
	// set special dummy sequence, if desired
	if (ISSUIT(nTrumpSuit) && ISPLAYER(nDummyPosition) && m_bShowDummyTrumpsOnLeft) {
		// check who's dummy
		if (nDummyPosition == WEST) {
			// if dummy is West, the trump suit goes LAST (on the left)
			m_nDummySuitSequence[3] = nTrumpSuit;
			for (int i = 0, nIndex = 0; i<3; i++) {
				if (m_nSuitSequence[nIndex] != nTrumpSuit)
					m_nDummySuitSequence[i] = m_nSuitSequence[nIndex];
				else
					i--;
				nIndex++;
			}
		} else {
			// otherwise the trump suit goes first
			m_nDummySuitSequence[0] = nTrumpSuit;
			for (int i = 1, nIndex = 0; i<4; i++) {
				if (m_nSuitSequence[nIndex] != nTrumpSuit)
					m_nDummySuitSequence[i] = m_nSuitSequence[nIndex];
				else
					i--;
				nIndex++;
			}
		}
	} else {
		// dummy's sequence is the same as everyone else
		for (int i = 0; i<4; i++)
			m_nDummySuitSequence[i] = m_nSuitSequence[i];
	}
}


//
void Settings::SetSuitSequence(int nSeq) {
	if ((nSeq < 0) || (nSeq >= tnumSuitSequences))
		return;
	//
	m_nSuitSeqOption = nSeq;
	for (int i = 0; i<4; i++)
		m_nSuitSequence[i] = m_nSuitSeqList[nSeq][i];

	// init dummy's suit sequence
	InitDummySuitSequence(NONE);
}


int Settings::ReadIntConfig(const char* section, const char* entry, int defaultValue) {
	return defaultValue;
}

std::string Settings::ReadStringConfig(const char* section, const char* entry, const char* defaultValue) {
	return std::string(defaultValue);
}


void Settings::SetVersion(OSVERSIONINFO versionInfo) {
  m_nWinMajorVer = versionInfo.dwMajorVersion;
  m_nWinMinorVer = versionInfo.dwMinorVersion;
  m_nWinBuildNum = versionInfo.dwBuildNumber;
  // set platform code -- 0 = NT, 1 = Chicago, 2 = Win32s
  if (versionInfo.dwPlatformId == VER_PLATFORM_WIN32_NT) {
    // Windows NT
    m_nWinMode = 0;
    m_bWin32 = TRUE;
  } else if (versionInfo.dwPlatformId == VER_PLATFORM_WIN32s) {
    // Win32s
    m_nWinMode = 9;
    m_bWin32 = FALSE;
  } else {
    // Windows 95 or 98
    if ((m_nWinMajorVer == 4) && (m_nWinMinorVer == 1))
      m_nWinMode = 2;	// version 4.1 = Win98
    else
      m_nWinMode = 1;	// version 4.0 = Win95
    m_bWin32 = TRUE;
  }
}
