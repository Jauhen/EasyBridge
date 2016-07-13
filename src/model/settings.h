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
  BOOL	m_bBiddingInProgress;	// bidding
  BOOL	m_bGameInProgress;		// playing tricks
  BOOL	m_bRubberInProgress;	// playing rubber?
  BOOL	m_bDuplicateScoring;	// duplicate scoring?
  int		m_nAutoHintMode;		// Auto Hint in effect?
  int		m_nAutoHintTraceLevel;  // Auto Hint trace level
  BOOL	m_bFirstTimeRunning;	// first time running?

                              // debug options
  BOOL	m_bDebugMode;			// debug mode
  int		m_nTestMode;
  BOOL	m_bShowCardsFaceUp;
  BOOL	m_bManualPlayMode;
  int		m_nPlayMode;
  BOOL	m_bPlayModeLocked;
  BOOL	m_bAutoTestMode;

  // game options
  BOOL	m_bAutoBidStart;
  BOOL	m_bAutoJumpCursor;
  BOOL	m_bAutoPlayLastCard;
  BOOL	m_bEnableAnalysisTracing;
  BOOL	m_bEnableAnalysisDuringHints;
  int		m_nAnalysisTraceLevel;
  BOOL	m_bShowCommentIdentifiers;
  BOOL	m_bInsertBiddingPause;
  int		m_nBiddingPauseLength;
  BOOL	m_bInsertPlayPause;
  int		m_nPlayPauseLength;
  BOOL	m_bComputerCanClaim;
  BOOL	m_bShowPassedHands;
  BOOL	m_bAllowRebidPassedHands;
  int		m_nPassedHandWaitInterval;
  BOOL	m_bAutoShowBidHistory;
  BOOL	m_bAutoShowPlayHistory;
  BOOL	m_bAutoHideBidHistory;
  BOOL	m_bAutoHidePlayHistory;
  BOOL	m_bAutoShowNNetOutputWhenTraining;
  BOOL 	m_bShowLayoutOnEdit;

  // bidding config
  double		m_fBiddingAggressiveness;
  BOOL		m_bManualBidding;		// transient
  /*
  int			m_nBiddingEngine;
  BOOL		m_bNNetTrainingMode;
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
  BOOL	m_bAcelessPenalty;
  BOOL	m_b4AceBonus;
  BOOL	m_bPenalizeUGHonors;
  BOOL	m_bCountShortSuits;

  // deal options
  int 	m_nReqPointsGame[4][2];
  int 	m_nReqPointsSlam[3][2];
  int 	m_nPointsAbsGameLimits[4][2];
  int 	m_nPointsAbsSlamLimits[3][2];
  BOOL	m_bBalanceTeamHands;
  BOOL	m_bGiveSouthBestHandInPartnership;
  BOOL	m_bGiveSouthBestHandInGame;
  int 	m_nMinCardsInMajor;
  int 	m_nMinCardsInMinor;
  int		m_nMinSuitDistTable[2][4][2];
  int		m_nMinSuitDist[2];
  int 	m_nMinTopMajorCard;
  int 	m_nMinTopMinorCard;
  int 	m_nMaxImbalanceForNT;
  BOOL	m_bNeedTwoBalancedTrumpHands;
  int		m_numAcesForSlam[3];
  int		m_numKingsForSlam[3];
  BOOL	m_bEnableDealNumbering;
  // scoring options
  BOOL	m_bScoreHonorsBonuses;

  BOOL	m_bEnableSpokenBids;
  BOOL	m_bSaveIntermediatePositions;
  BOOL	m_bExposePBNGameCards;
  CString	m_strGIBPath;
  BOOL	m_bEnableGIBForDeclarer;
  BOOL	m_bEnableGIBForDefender;
  int		m_nGIBAnalysisTime;
  int		m_nGIBSampleSize;
  BOOL	m_bShowGIBOutput;

};

#endif
