#ifndef EZ_MODEL_SETTINGS_
#define EZ_MODEL_SETTINGS_

#include <string>

class CPlayer;
extern const LPCTSTR szSuitName[];


class Settings {
public:
  enum { PLAY_NORMAL, PLAY_MANUAL, PLAY_MANUAL_DEFEND, PLAY_FULL_AUTO, PLAY_FULL_AUTO_EXPRESS };


  Settings();
  ~Settings();

  virtual int ReadIntConfig(const char* section, const char* entry, int defaultValue);
  virtual std::string ReadStringConfig(const char* section, const char* entry, const char* defaultValue);
  virtual void WriteIntConfig(const char* section, const char* entry, int value) {};
  virtual void WriteStringConfig(const char* section, const char* entry, const char* value) {};

  void Initialize();
  void Terminate();
  void InitHonorsValuations();
  void RefreshProperties();
  void InitPointCountRequirements();
  void InitSettings();
  CString GetProgramVersionString();
  CString GetFullProgramVersionString();
  void SetSuitSequence(int nSeq);

  int	GetCurrentConvention() const { return m_nCurrConventionSet; }
  int	GetSuitSequence(int nIndex) const { return m_nSuitSequence[nIndex]; }
  void SetSuitSequence(int nIndex, int nValue) { m_nSuitSequence[nIndex] = nValue; }
  int	GetDummySuitSequence(int nIndex) const { return m_nDummySuitSequence[nIndex]; }
  void InitDummySuitSequence(int nTrumpSuit, int nDummyPosition = -1);
  double GetBiddingAgressiveness() const { return m_fBiddingAggressiveness; }
  LPCTSTR GetSuitName(int nSuit) const { return szSuitName[nSuit]; }
  BOOL InExpressAutoPlay() const { return (m_nPlayMode == PLAY_FULL_AUTO_EXPRESS); }
  BOOL IsAutoHintEnabled() const { return (m_nAutoHintMode > 0); }
  int GetNumAcesRequiredForSlam(int nIndex) const { return m_numAcesForSlam[nIndex]; }
  int GetNumKingsRequiredForSlam(int nIndex) const { return m_numKingsForSlam[nIndex]; }
  void SetNumAcesRequiredForSlam(int nIndex, int nCount) { m_numAcesForSlam[nIndex] = nCount; }
  void SetNumKingsRequiredForSlam(int nIndex, int nCount) { m_numKingsForSlam[nIndex] = nCount; }



  bool GetAutoBidStart() const { return m_bAutoBidStart; }
  void SetAutoBidStart(bool val) { m_bAutoBidStart = val; }
  bool GetAllowRebidPassedHands() const { return m_bAllowRebidPassedHands; }
  void SetAllowRebidPassedHands(bool val) { m_bAllowRebidPassedHands = val; }
  bool GetShowPassedHands() const { return m_bShowPassedHands; }
  void SetShowPassedHands(bool val) { m_bShowPassedHands = val; }
  bool GetEnableAnalysisTracing() const { return m_bEnableAnalysisTracing; }
  void SetEnableAnalysisTracing(bool val) { m_bEnableAnalysisTracing = val; }
  bool GetEnableAnalysisDuringHints() const { return m_bEnableAnalysisDuringHints; }
  void SetEnableAnalysisDuringHints(bool val) { m_bEnableAnalysisDuringHints = val; }
  int GetAnalysisTraceLevel() const { return m_nAnalysisTraceLevel; }
  void SetAnalysisTraceLevel(int val) { m_nAnalysisTraceLevel = val; }
  bool GetComputerCanClaim() const { return m_bComputerCanClaim; }
  void SetComputerCanClaim(bool val) { m_bComputerCanClaim = val; }
  bool GetAutoPlayLastCard() const { return m_bAutoPlayLastCard; }
  void SetAutoPlayLastCard(bool val) { m_bAutoPlayLastCard = val; }
  bool GetAutoJumpCursor() const { return m_bAutoJumpCursor; }
  void SetAutoJumpCursor(bool val) { m_bAutoJumpCursor = val; }
  bool GetInsertBiddingPause() const { return m_bInsertBiddingPause; }
  void SetInsertBiddingPause(bool val) { m_bInsertBiddingPause = val; }
  bool GetInsertPlayPause() const { return m_bInsertPlayPause; }
  void SetInsertPlayPause(bool val) { m_bInsertPlayPause = val; }
  bool GetEnableSpokenBids() const { return m_bEnableSpokenBids; }
  void SetEnableSpokenBids(bool val) { m_bEnableSpokenBids = val; }
  int GetBiddingPauseLength() const { return m_nBiddingPauseLength; }
  void SetBiddingPauseLength(int val) { m_nBiddingPauseLength = val; }
  int GetPlayPauseLength() const { return m_nPlayPauseLength; }
  void SetPlayPauseLength(int val) { m_nPlayPauseLength = val; }
  int GetHonorsValuationMode() const { return m_nHonorsValuationMode; }
  void SetHonorsValuationMode(int val) { m_nHonorsValuationMode = val; }
  double GetCustomAceValue() const { return m_fCustomAceValue; }
  void SetCustomAceValue(double val) { m_fCustomAceValue = val; }
  double GetCustomKingValue() const { return m_fCustomKingValue; }
  void SetCustomKingValue(double val) { m_fCustomKingValue = val; }
  double GetCustomQueenValue() const { return m_fCustomQueenValue; }
  void SetCustomQueenValue(double val) { m_fCustomQueenValue = val; }
  double GetCustomJackValue() const { return m_fCustomJackValue; }
  void SetCustomJackValue(double val) { m_fCustomJackValue = val; }
  double GetCustomTenValue() const { return m_fCustomTenValue; }
  void SetCustomTenValue(double val) { m_fCustomTenValue = val; }
  bool GetScoreHonorsBonuses() const { return m_bScoreHonorsBonuses; }
  void SetScoreHonorsBonuses(bool val) { m_bScoreHonorsBonuses = val; }
  bool GetUsingDuplicateScoring() const { return m_bDuplicateScoring; }
  void SetUsingDuplicateScoring(bool val) { m_bDuplicateScoring = val; }
  bool GetSaveIntermediatePositions() const { return m_bSaveIntermediatePositions; }
  void SetSaveIntermediatePositions(bool val) { m_bSaveIntermediatePositions = val; }
  bool GetExposePBNGameCards() const { return m_bExposePBNGameCards; }
  void SetExposePBNGameCards(bool val) { m_bExposePBNGameCards = val; }
  CString GetGIBPath() const { return CString(m_strGIBPath.c_str()); }
  void SetGIBPath(CString val) { m_strGIBPath = val; }
  bool GetEnableGIBForDeclarer() const { return m_bEnableGIBForDeclarer; }
  void SetEnableGIBForDeclarer(bool val) { m_bEnableGIBForDeclarer = val; }
  bool GetEnableGIBForDefender() const { return m_bEnableGIBForDefender; }
  void SetEnableGIBForDefender(bool val) { m_bEnableGIBForDefender = val; }
  int GetGIBAnalysisTime() const { return m_nGIBAnalysisTime; }
  void SetGIBAnalysisTime(int val) { m_nGIBAnalysisTime = val; }
  bool GetAutoShowBidHistory() const { return m_bAutoShowBidHistory; }
  void SetAutoShowBidHistory(bool val) { m_bAutoShowBidHistory = val; }
  bool GetAutoShowPlayHistory() const { return m_bAutoShowPlayHistory; }
  void SetAutoShowPlayHistory(bool val) { m_bAutoShowPlayHistory = val; }
  bool GetAutoHideBidHistory() const { return m_bAutoHideBidHistory; }
  void SetAutoHideBidHistory(bool val) { m_bAutoHideBidHistory = val; }
  bool GetAutoHidePlayHistory() const { return m_bAutoHidePlayHistory; }
  void SetAutoHidePlayHistory(bool val) { m_bAutoHidePlayHistory = val; }
  bool GetAutoShowNNetOutputWhenTraining() const { return m_bAutoShowNNetOutputWhenTraining; }
  void SetAutoShowNNetOutputWhenTraining(bool val) { m_bAutoShowNNetOutputWhenTraining = val; }
  bool GetShowLayoutOnEdit() const { return m_bShowLayoutOnEdit; }
  void SetShowLayoutOnEdit(bool val) { m_bShowLayoutOnEdit = val; }
  int GetAutoHintMode() const { return m_nAutoHintMode; }
  void SetAutoHintMode(int val) { m_nAutoHintMode = val; }
  bool GetShowSplashWindow() const { return m_bShowSplashWindow; }
  void SetShowSplashWindow(bool val) { m_bShowSplashWindow = val; }
  bool GetShowBackgroundBitmap() const { return m_bShowBackgroundBitmap; }
  void SetShowBackgroundBitmap(bool val) { m_bShowBackgroundBitmap = val; }
  int GetSuitSequenceOption() const { return m_nSuitSeqOption; }
  void SetSuitSequenceOption(int val) { m_nSuitSeqOption = val; }
  bool GetUseSuitSymbols() const { return m_bUseSuitSymbols; }
  void SetUseSuitSymbols(bool val) { m_bUseSuitSymbols = val; }
  bool GetShowDummyTrumpsOnLeft() const { return m_bShowDummyTrumpsOnLeft; }
  void SetShowDummyTrumpsOnLeft(bool val) { m_bShowDummyTrumpsOnLeft = val; }
  int GetBitmapDisplayMode() const { return m_nBitmapDisplayMode; }
  void SetBitmapDisplayMode(int val) { m_nBitmapDisplayMode = val; }
  bool GetScaleLargeBitmaps() const { return m_bScaleLargeBitmaps; }
  void SetScaleLargeBitmaps(bool val) { m_bScaleLargeBitmaps = val; }
  int GetBackgroundColor() const { return m_nBackgroundColor; }
  void SetBackgroundColor(int val) { m_nBackgroundColor = val; }
  bool GetLowResOption() const { return m_bLowResOption; }
  void SetLowResOption(bool val) { m_bLowResOption = val; }
  bool GetToggleResolutionMode() const { return m_bToggleResolutionMode; }
  void SetToggleResolutionMode(bool val) { m_bToggleResolutionMode = val; }
  bool GetCollapseGameReviewDialog() const { return m_bCollapseGameReviewDialog; }
  void SetCollapseGameReviewDialog(bool val) { m_bCollapseGameReviewDialog = val; }
  bool GetBiddingInProgress() const { return m_bBiddingInProgress; }
  void SetBiddingInProgress(bool val) { m_bBiddingInProgress = val; }
  bool GetGameInProgress() const { return m_bGameInProgress; }
  void SetGameInProgress(bool val) { m_bGameInProgress = val; }
  bool GetRubberInProgress() const { return m_bRubberInProgress; }
  void SetRubberInProgress(bool val) { m_bRubberInProgress = val; }
  bool GetDebugMode() const { return m_bDebugMode; }
  void SetDebugMode(bool val) { m_bDebugMode = val; }
  bool GetAutoTestMode() const { return m_bAutoTestMode; }
  void SetAutoTestMode(bool val) { m_bAutoTestMode = val; }
  bool GetManualBidding() const { return m_bManualBidding; }
  void SetManualBidding(bool val) { m_bManualBidding = val; }
  int GetAutoHintTraceLevel() const { return m_nAutoHintTraceLevel; }
  void SetAutoHintTraceLevel(int val) { m_nAutoHintTraceLevel = val; }
  bool GetShowCommentIdentifiers() const { return m_bShowCommentIdentifiers; }
  void SetShowCommentIdentifiers(bool val) { m_bShowCommentIdentifiers = val; }
  int GetPassedHandWaitInterval() const { return m_nPassedHandWaitInterval; }
  void SetPassedHandWaitInterval(int val) { m_nPassedHandWaitInterval = val; }
  bool GetManualPlayMode() const { return m_bManualPlayMode; }
  void SetManualPlayMode(bool val) { m_bManualPlayMode = val; }
  int GetCardPlayMode() const { return m_bManualPlayMode ? Settings::PLAY_MANUAL : m_nPlayMode; }
  void SetCardPlayMode(int val, bool forse = false) { 
   if (!m_bPlayModeLocked || forse) {
   m_nPlayMode = val;
   }
  }
  bool GetPlayModeLocked() const { return m_bPlayModeLocked; }
  void SetPlayModeLocked(bool val) { m_bPlayModeLocked = val; }
  bool GetShowCardsFaceUp() const { return m_bShowCardsFaceUp; }
  void SetShowCardsFaceUp(bool val) { m_bShowCardsFaceUp = val; }
  bool GetShowDailyTipDialog() const { return m_bShowDailyTipDialog; }
  void SetShowDailyTipDialog(bool val) { m_bShowDailyTipDialog = val; }
  bool GetShowScreenSizeWarning() const { return m_bShowScreenSizeWarning; }
  void SetShowScreenSizeWarning(bool val) { m_bShowScreenSizeWarning = val; }
  int GetWindowsMajorVersion() const { return m_nWinMajorVer; }
  void SetWindowsMajorVersion(int val) { m_nWinMajorVer = val; }
  int GetWindowsMinorVersion() const { return m_nWinMinorVer; }
  void SetWindowsMinorVersion(int val) { m_nWinMinorVer = val; }
  bool GetWin32() const { return m_bWin32; }
  void SetWin32(bool val) { m_bWin32 = val; }
  bool GetFirstTimeRunning() const { return m_bFirstTimeRunning; }
  void SetFirstTimeRunning(bool val) { m_bFirstTimeRunning = val; }
  const char* GetProgramDirectory() const { return m_strProgDirectory; }
  void GetProgramDirectory(CString val) { m_strProgDirectory = val; }
  int GetProgramMajorVersion() const { return m_nProgMajorVersion; }
  void SetProgramMajorVersion(int val) { m_nProgMajorVersion = val; }
  int GetProgramMinorVersion() const { return m_nProgMinorVersion; }
  void SetProgramMinorVersion(int val) { m_nProgMinorVersion = val; }
  int GetProgramIncrementVersion() const { return m_nProgIncrementVersion; }
  void SetProgramIncrementVersion(int val) { m_nProgIncrementVersion = val; }
  int GetProgramBuildNumber() const { return m_nProgBuildNumber; }
  void SetProgramBuildNumber(int val) { m_nProgBuildNumber = val; }
  const char* GetProgramBuildDate() const { return m_strProgBuildDate; }
  void GetProgramBuildDate(CString val) { m_strProgBuildDate = val; }
  const char* GetSpecialBuildCode() const { return m_strSpecialBuildCode; }
  void GetSpecialBuildCode(CString val) { m_strSpecialBuildCode = val; }
  const char* GetProgramCopyright() const { return m_strProgCopyright; }
  void GetProgramCopyright(CString val) { m_strProgCopyright = val; }
  const char* GetProgramTitle() const { return m_strProgTitle; }
  void GetProgramTitle(CString val) { m_strProgTitle = val; }
  bool GetLayoutFollowsDisplayOrder() const { return m_bLayoutFollowsDisplayOrder; }
  void SetLayoutFollowsDisplayOrder(bool val) { m_bLayoutFollowsDisplayOrder = val; }
  int GetWindowsSystemMode() const { return m_nWinMode; }
  void SetWindowsSystemMode(int val) { m_nWinMode = val; }
  int GetRequiredPointsForGame(int suitCode, int side /* 0 - min, 1 - max */) const { return m_nReqPointsGame[suitCode][side]; }
  void SetRequiredPointsForGame(int val, int suitCode, int side /* 0 - min, 1 - max */) { m_nReqPointsGame[suitCode][side] = val; }
  int GetRequiredPointsForSlam(int suitCode, int side /* 0 - min, 1 - max */) const { return m_nReqPointsSlam[suitCode][side]; }
  void SetRequiredPointsForSlam(int val, int suitCode, int side /* 0 - min, 1 - max */) { m_nReqPointsSlam[suitCode][side] = val; }
  int GetPointsAbsoluteGameLimits(int suitCode, int side /* 0 - min, 1 - max */) const { return m_nPointsAbsGameLimits[suitCode][side]; }
  void SetPointsAbsoluteGameLimits(int val, int suitCode, int side /* 0 - min, 1 - max */) { m_nPointsAbsGameLimits[suitCode][side] = val; }
  int GetPointsAbsoluteSlamLimits(int suitCode, int side /* 0 - min, 1 - max */) const { return m_nPointsAbsSlamLimits[suitCode][side]; }
  void SetPointsAbsoluteSlamLimits(int val, int suitCode, int side /* 0 - min, 1 - max */) { m_nPointsAbsSlamLimits[suitCode][side] = val; }
  int GetMinCardsInMinor() const { return m_nMinCardsInMinor; }
  void SetMinCardsInMinor(int val) { m_nMinCardsInMinor = val; }
  int GetMinTopMinorCard() const { return m_nMinTopMinorCard; }
  void SetMinTopMinorCard(int val) { m_nMinTopMinorCard = val; }
  int GetMinSuitDistributions(int type) const { return m_nMinSuitDist[type]; }
  void SetMinSuitDistributions(int val, int type) { m_nMinSuitDist[type] = val; }
  int GetMinCardsInMajor() const { return m_nMinCardsInMajor; }
  void SetMinCardsInMajor(int val) { m_nMinCardsInMajor = val; }
  int GetMinTopMajorCard() const { return m_nMinTopMajorCard; }
  void SetMinTopMajorCard(int val) { m_nMinTopMajorCard = val; }
  bool GetNeedTwoBalancedTrumpHands() const { return m_bNeedTwoBalancedTrumpHands; }
  void SetNeedTwoBalancedTrumpHands(bool val) { m_bNeedTwoBalancedTrumpHands = val; }
  int GetAcesForSlam(int type) const { return m_numAcesForSlam[type]; }
  void SetAcesForSlam(int val, int type) { m_numAcesForSlam[type] = val; }
  int GetKingsForSlam(int type) const { return m_numKingsForSlam[type]; }
  void SetKingsForSlam(int val, int type) { m_numKingsForSlam[type] = val; }
  bool GetBalanceTeamHands() const { return m_bBalanceTeamHands; }
  void SetBalanceTeamHands(bool val) { m_bBalanceTeamHands = val; }
  bool GetGiveSouthBestHandInPartnership() const { return m_bGiveSouthBestHandInPartnership; }
  void SetGiveSouthBestHandInPartnership(bool val) { m_bGiveSouthBestHandInPartnership = val; }
  bool GetEnableDealNumbering() const { return m_bEnableDealNumbering; }
  void SetEnableDealNumbering(bool val) { m_bEnableDealNumbering = val; }
  int GetMinSuitDistributionTable(int code, int distribution, int hand) const {
	  return m_nMinSuitDistTable[code][distribution][hand];
  }
  int GetMaxImbalanceForNT() const { return m_nMaxImbalanceForNT; }
  void SetMaxImbalanceForNT(int val) { m_nMaxImbalanceForNT = val; }
  bool Get4AceBonus() const { return m_b4AceBonus; }
  void Set4AceBonus(bool val) { m_b4AceBonus = val; }
  bool GetAcelessPenalty() const { return m_bAcelessPenalty; }
  void SetAcelessPenalty(bool val) { m_bAcelessPenalty = val; }
  bool GetCountShortSuits() const { return m_bCountShortSuits; }
  void SetCountShortSuits(bool val) { m_bCountShortSuits = val; }
  bool GetPenalizeUGHonors() const { return m_bPenalizeUGHonors; }
  void SetPenalizeUGHonors(bool val) { m_bPenalizeUGHonors = val; }
  double GetBiddingAggressiveness() const { return m_fBiddingAggressiveness; }
  void SetBiddingAggressiveness(double val) { 
	  m_fBiddingAggressiveness = val; 
	  InitPointCountRequirements();
  }


  static double m_fDefaultMajorSuitGamePts;
  static double m_fDefaultMinorSuitGamePts;
  static double m_fDefaultNTGamePts;
  static double m_fDefault4LevelPts;
  static double m_fDefault3LevelPts;
  static double m_fDefault2LevelPts;
  static double m_fDefaultSlamPts;
  static double m_fDefaultGrandSlamPts;
  //
  static double m_fMajorSuitGamePts;
  static double m_fMinorSuitGamePts;
  static double m_fNTGamePts;
  static double m_f4LevelPts;
  static double m_f3LevelPts;
  static double m_f2LevelPts;
  static double m_fSlamPts;
  static double m_fGrandSlamPts;
  //
  static double m_fHonorValue[15];

//private:
  //
  // program status
  //
  int m_nGameMode; // 0=practice, 1=rubber
  bool m_bBiddingInProgress; // bidding
  bool m_bGameInProgress; // playing tricks
  bool m_bRubberInProgress; // playing rubber?
  bool m_bDuplicateScoring; // duplicate scoring?
  int m_nAutoHintMode; // Auto Hint in effect?
  int m_nAutoHintTraceLevel;  // Auto Hint trace level
  bool m_bFirstTimeRunning; // first time running?

                              // debug options
  bool m_bDebugMode; // debug mode
  int m_nTestMode;
  bool m_bShowCardsFaceUp;
  bool m_bManualPlayMode;
  int m_nPlayMode;
  bool m_bPlayModeLocked;
  bool m_bAutoTestMode;

  // game options
  bool m_bAutoBidStart;
  bool m_bAutoJumpCursor;
  bool m_bAutoPlayLastCard;
  bool m_bEnableAnalysisTracing;
  bool m_bEnableAnalysisDuringHints;
  int m_nAnalysisTraceLevel;
  bool m_bShowCommentIdentifiers;
  bool m_bInsertBiddingPause;
  int m_nBiddingPauseLength;
  bool m_bInsertPlayPause;
  int m_nPlayPauseLength;
  bool m_bComputerCanClaim;
  bool m_bShowPassedHands;
  bool m_bAllowRebidPassedHands;
  int m_nPassedHandWaitInterval;
  bool m_bAutoShowBidHistory;
  bool m_bAutoShowPlayHistory;
  bool m_bAutoHideBidHistory;
  bool m_bAutoHidePlayHistory;
  bool m_bAutoShowNNetOutputWhenTraining;
  bool  m_bShowLayoutOnEdit;

  // bidding config
  double m_fBiddingAggressiveness;
  bool m_bManualBidding; // transient
  /*
  int m_nBiddingEngine;
  bool m_bNNetTrainingMode;
  int m_numNNetHiddenLayers;
  int m_numNNetNodesPerHiddenLayer;
  CString m_strNeuralNetFile;
  CNeuralNet* m_pNeuralNet;
  */

                              // counting options
  int m_nHonorsValuationMode;
  double m_fAceValue;
  double m_fKingValue;
  double m_fQueenValue;
  double m_fJackValue;
  double  m_fTenValue;
  double m_fCustomAceValue;
  double m_fCustomKingValue;
  double m_fCustomQueenValue;
  double m_fCustomJackValue;
  double m_fCustomTenValue;
  bool m_bAcelessPenalty;
  bool m_b4AceBonus;
  bool m_bPenalizeUGHonors;
  bool m_bCountShortSuits;

  // deal options
  int  m_nReqPointsGame[4][2];
  int  m_nReqPointsSlam[3][2];
  int  m_nPointsAbsGameLimits[4][2];
  int  m_nPointsAbsSlamLimits[3][2];
  bool m_bBalanceTeamHands;
  bool m_bGiveSouthBestHandInPartnership;
  bool m_bGiveSouthBestHandInGame;
  int  m_nMinCardsInMajor;
  int  m_nMinCardsInMinor;
  int m_nMinSuitDistTable[2][4][2];
  int m_nMinSuitDist[2];
  int  m_nMinTopMajorCard;
  int  m_nMinTopMinorCard;
  int  m_nMaxImbalanceForNT;
  bool m_bNeedTwoBalancedTrumpHands;
  int m_numAcesForSlam[3];
  int m_numKingsForSlam[3];
  bool m_bEnableDealNumbering;
  // scoring options
  bool m_bScoreHonorsBonuses;

  bool m_bEnableSpokenBids;
  bool m_bSaveIntermediatePositions;
  bool m_bExposePBNGameCards;
  std::string m_strGIBPath;
  bool m_bEnableGIBForDeclarer;
  bool m_bEnableGIBForDefender;
  int m_nGIBAnalysisTime;
  int m_nGIBSampleSize;
  bool m_bShowGIBOutput;

  // display options
  bool m_bAutoAlignDialogs;
  bool m_bShowStartupAnimation;
  bool m_bShowSplashWindow;
  bool m_bShowBackgroundBitmap;
  bool m_bShowDailyTipDialog;
  bool m_bShowScreenSizeWarning;
  int m_nBitmapDisplayMode;
  bool m_bScaleLargeBitmaps;
  int m_nBackgroundColor;
  bool m_bUseSuitSymbols;
  bool m_bCollapseGameReviewDialog;
  bool m_bCollapseRoundFinishedDialog;

  int m_nCurrConventionSet;
  int m_numConventionSets;
  int m_nSuitSeqList[5][4];
  int m_nSuitSequence[4];
  int m_nDummySuitSequence[4];
  int m_nSuitSeqOption;
  bool m_bLowResOption;
  bool m_bToggleResolutionMode;
  bool m_bLayoutFollowsDisplayOrder;
  bool m_bShowDummyTrumpsOnLeft;

  //
  // Platform info
  //
  int m_nWinMajorVer;  // Windows Platform Major Version #
  int m_nWinMinorVer;  // Windows Platform Minor Version #
  int m_nWinBuildNum;  // Windows Platform Build #
  int m_nWinMode;      // 0 = NT, 1 = Chicago, 2 = Win32s
  bool m_bWin32;       // Win32 flag

  // prog info
  CString m_strProgTitle;
  CString m_strProgPath;
  CString m_strProgDirectory;
  int m_nProgVersion[4];
  int m_nProgMajorVersion;
  int m_nProgMinorVersion;
  int m_nProgIncrementVersion;
  int m_nProgBuildNumber;
  CString m_strProgCopyright;
  CString m_strProgBuildDate;
  CString m_strSpecialBuildCode;
};

#endif
