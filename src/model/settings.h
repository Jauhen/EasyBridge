#ifndef EZ_MODEL_SETTINGS_
#define EZ_MODEL_SETTINGS_

class Settings {
public:
  Settings();
  ~Settings();

  void Initialize();
  void InitHonorsValuations();
  void RefreshProperties();



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
  CString GetGIBPath() const { return m_strGIBPath; }
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
  int		m_nGameMode;			// 0=practice, 1=rubber
  bool	m_bBiddingInProgress;	// bidding
  bool	m_bGameInProgress;		// playing tricks
  bool	m_bRubberInProgress;	// playing rubber?
  bool	m_bDuplicateScoring;	// duplicate scoring?
  int		m_nAutoHintMode;		// Auto Hint in effect?
  int		m_nAutoHintTraceLevel;  // Auto Hint trace level
  bool	m_bFirstTimeRunning;	// first time running?

                              // debug options
  bool	m_bDebugMode;			// debug mode
  int		m_nTestMode;
  bool	m_bShowCardsFaceUp;
  bool	m_bManualPlayMode;
  int		m_nPlayMode;
  bool	m_bPlayModeLocked;
  bool	m_bAutoTestMode;

  // game options
  bool	m_bAutoBidStart;
  bool	m_bAutoJumpCursor;
  bool	m_bAutoPlayLastCard;
  bool	m_bEnableAnalysisTracing;
  bool	m_bEnableAnalysisDuringHints;
  int		m_nAnalysisTraceLevel;
  bool	m_bShowCommentIdentifiers;
  bool	m_bInsertBiddingPause;
  int		m_nBiddingPauseLength;
  bool	m_bInsertPlayPause;
  int		m_nPlayPauseLength;
  bool	m_bComputerCanClaim;
  bool	m_bShowPassedHands;
  bool	m_bAllowRebidPassedHands;
  int		m_nPassedHandWaitInterval;
  bool	m_bAutoShowBidHistory;
  bool	m_bAutoShowPlayHistory;
  bool	m_bAutoHideBidHistory;
  bool	m_bAutoHidePlayHistory;
  bool	m_bAutoShowNNetOutputWhenTraining;
  bool 	m_bShowLayoutOnEdit;

  // bidding config
  double		m_fBiddingAggressiveness;
  bool		m_bManualBidding;		// transient
  /*
  int			m_nBiddingEngine;
  bool		m_bNNetTrainingMode;
  int			m_numNNetHiddenLayers;
  int			m_numNNetNodesPerHiddenLayer;
  CString		m_strNeuralNetFile;
  CNeuralNet*	m_pNeuralNet;
  */

                              // counting options
  int		m_nHonorsValuationMode;
  double	m_fAceValue;
  double	m_fKingValue;
  double	m_fQueenValue;
  double	m_fJackValue;
  double  m_fTenValue;
  double	m_fCustomAceValue;
  double	m_fCustomKingValue;
  double	m_fCustomQueenValue;
  double	m_fCustomJackValue;
  double	m_fCustomTenValue;
  bool	m_bAcelessPenalty;
  bool	m_b4AceBonus;
  bool	m_bPenalizeUGHonors;
  bool	m_bCountShortSuits;

  // deal options
  int 	m_nReqPointsGame[4][2];
  int 	m_nReqPointsSlam[3][2];
  int 	m_nPointsAbsGameLimits[4][2];
  int 	m_nPointsAbsSlamLimits[3][2];
  bool	m_bBalanceTeamHands;
  bool	m_bGiveSouthBestHandInPartnership;
  bool	m_bGiveSouthBestHandInGame;
  int 	m_nMinCardsInMajor;
  int 	m_nMinCardsInMinor;
  int		m_nMinSuitDistTable[2][4][2];
  int		m_nMinSuitDist[2];
  int 	m_nMinTopMajorCard;
  int 	m_nMinTopMinorCard;
  int 	m_nMaxImbalanceForNT;
  bool	m_bNeedTwoBalancedTrumpHands;
  int		m_numAcesForSlam[3];
  int		m_numKingsForSlam[3];
  bool	m_bEnableDealNumbering;
  // scoring options
  bool	m_bScoreHonorsBonuses;

  bool	m_bEnableSpokenBids;
  bool	m_bSaveIntermediatePositions;
  bool	m_bExposePBNGameCards;
  CString	m_strGIBPath;
  bool	m_bEnableGIBForDeclarer;
  bool	m_bEnableGIBForDefender;
  int		m_nGIBAnalysisTime;
  int		m_nGIBSampleSize;
  bool	m_bShowGIBOutput;

  // display options
  BOOL	m_bAutoAlignDialogs;
  BOOL	m_bShowStartupAnimation;
  BOOL	m_bShowSplashWindow;
  BOOL    m_bShowBackgroundBitmap;
  BOOL	m_bShowDailyTipDialog;
  BOOL	m_bShowScreenSizeWarning;
  int		m_nBitmapDisplayMode;
  BOOL	m_bScaleLargeBitmaps;
  int		m_nBackgroundColor;
  BOOL	m_bUseSuitSymbols;
  BOOL	m_bCollapseGameReviewDialog;
  BOOL	m_bCollapseRoundFinishedDialog;

  int		m_nCurrConventionSet;
  int		m_numConventionSets;
  int		m_nSuitSeqList[5][4];
  int		m_nSuitSequence[4];
  int		m_nDummySuitSequence[4];
  int		m_nSuitSeqOption;
  BOOL	m_bLowResOption;
  BOOL	m_bToggleResolutionMode;
  BOOL	m_bLayoutFollowsDisplayOrder;
  BOOL	m_bShowDummyTrumpsOnLeft;

};

#endif
