#ifndef EZ_MODEL_DEAL_
#define EZ_MODEL_DEAL_

#include "engine/card_constants.h"
#include "app_interface.h"
#include "model/globals.h"


class CPlayer;
class CGameRecord;
class CCard;

class Deal {
public:
  // game-related event codes
  enum { EVENT_NONE = 0, EVENT_CLAIMED = 1, EVENT_CONCEDED = 2 };
  enum { tnEasyBridgeFormat = 0, tnPBNFormat = 1, tnTextFormat = 2 };

  Deal(std::shared_ptr<AppInterface> app);
  ~Deal();

  void DeleteContents();
  bool HasRecords() { return m_gameRecords.GetSize() > 0; };
  void SetTitle(const char* title) { m_strDocTitle = title; }
  CString GetTitle() const  { return m_strDocTitle; }
  std::vector<CString> GetBonusPointsRecords() const { return m_strArrayBonusPointsRecord; }
  std::vector<CString> GetTrickPointsRecords() const { return m_strArrayTrickPointsRecord; }
  bool IsHintFollowed() const { return m_bHintFollowed; }
  CCard* GetLastPlayHint() const { return m_pLastPlayHint; }
  void SetBatchMode(bool val) { m_bBatchMode = val; }
  void SwapPositionsAlreadyInPlay(int pos1, int pos2);
  void InitNewDocument();
  bool IsGameNotFinished();
  void AdvanceToNextPlayer();


  //
  void ClearAllInfo();
  void ClearMatchInfo();
  void ClearFileParameters();
  void InitNewMatch();
  void InitNewHand(BOOL bRestarting = FALSE);
  int  DealCards();
  void DealHands(BOOL bUseDealNumber = FALSE, int nDealNumber = 0);
  void InitGameReview();
  void LoadGameRecord(const CGameRecord& game);
  void LoadFirstGameRecord();
  void PlayGameRecord(int nGameIndex);
  void ClearHands();
  void ClearBiddingInfo();
  void PrepForCardLayout();
  void InitPlay(BOOL bRedrawScreen = TRUE, BOOL bRestarting = FALSE);
  BOOL IsBidValid(int nBid);
  int	 EnterBid(int nPos, int nBid);
  int	 UndoBid();
  void RestartBidding();
  int  WasSuitBid(int nSuit) const;
  int  GetSuitsBid(CArray<int, int>& suits) const;
  int  GetSuitsUnbid(CArray<int, int>& suits) const;
  void SetBiddingComplete();
  void UpdateBiddingHistory();
  void UpdatePlayHistory();
  void BeginRound();
  BOOL TestPlayValidity(Position nOrigin, CCard* pCard, BOOL bAlert = TRUE);
  void EnterCardPlay(Position nPos, CCard* pCard);
  void ClaimTricks(int nPos, int numTricks = 0);
  void ConcedeTricks(int nPos);
  void InvokeNextPlayer();
  void EvaluateTrick(BOOL bQuietMode = FALSE);
  void ClearTrick();
  void UndoLastCardPlayed();
  void UndoTrick();
  void UndoPreviousTrick();
  void RestoreInitialHands();
  void OnGameComplete();
  void PostProcessGame();
  void ComputerReplay(BOOL bFullAuto);
  void UpdateDisplay();
  void RefreshDisplay();
  void ResetDisplay();
  void ShowAutoHint();
  BOOL IsHintAvailable();
  CString FormatOriginalHands();
  CString FormatCurrentHands();
  CString GetDealIDString();

  // inline functions
  BOOL IsInitialized() { return m_bInitialized; }
  CPlayer* GetPlayer(int nIndex) const { return m_pPlayer[nIndex]; }
  CPlayer* GetHumanPlayer() const { return m_pPlayer[SOUTH]; }
  int GetHumanPlayerPos() const { return SOUTH; }
  int	GetContract() const { return m_nContract; }
  const CString GetContractString() const;
  const CString GetFullContractString() const;
  int	GetContractSuit() const { return m_nContractSuit; }
  int	GetTrumpSuit() const { return m_nTrumpSuit; }
  int	GetContractLevel() const { return m_nContractLevel; }
  int GetContractModifier() const { return m_nContractModifier; }
  BOOL IsContractDoubled() const { return m_bDoubled; }
  BOOL IsContractRedoubled() const { return m_bRedoubled; }
  int	GetDealer() const { return m_nDealer; }
  void SetDealer(int val) { m_nDealer = val;  }
  CPlayer* GetDeclarer() const { return ISPLAYER(m_nDeclarer) ? m_pPlayer[m_nDeclarer] : NULL; }
  int	GetDeclarerPosition() const { return m_nDeclarer; }
  int GetDeclaringTeam() const { return GetPlayerTeam(m_nDeclarer); }
  int	GetRoundLead() const { return m_nRoundLead; }
  CPlayer* GetRoundLeadPlayer() const { return m_pPlayer[m_nRoundLead]; }
  int	GetBiddingRound() const { return m_nBiddingRound; }
  int	GetNumBidsMade() const { return m_numBidsMade; }
  int GetOpeningBid() const { return m_nOpeningBid; }
  int GetOpeningBidder() const { return m_nOpeningBidder; }
  int	GetNumValidBidsMade() const { return m_numValidBidsMade; }
  int	GetLastValidBid() const { return m_nLastValidBid; }
  int	GetLastValidBidTeam() const { return m_nLastValidBidTeam; }
  int GetBidByPlayer(int nPlayer, int nRound) const { return m_nBidsByPlayer[nPlayer][nRound]; }
  int GetBidByPlayer(CPlayer* pPlayer, int nRound) const;
  int GetBidByIndex(int nIndex) const { return m_nBiddingHistory[nIndex]; }
  int GetValidBidRecord(int nIndex) const { return m_nValidBidHistory[nIndex]; }
  int GetVulnerableTeam() const { return m_nVulnerableTeam; }
  void SetVulnerableTeam(Team val) { m_nVulnerableTeam = val; }
  BOOL IsTeamVulnerable(int nTeam) { return m_bVulnerable[nTeam]; }
  //	int	GetPlayRound() const { return m_nPlayRound; }
  int	GetPlayRound() const { return m_numTricksPlayed; }
  int	GetNumCardsPlayedInRound() const { return m_numCardsPlayedInRound; }
  int	GetNumCardsPlayedInGame() const { return m_numCardsPlayedInGame; }
  int GetNumTricksPlayed() const { return m_numTricksPlayed; }
  void SetNumTricksPlayed(int val) { m_numTricksPlayed = val; }
  int	GetNumTricksRemaining() const { return 13 - m_numTricksPlayed; }
  int	GetPlayRecord(int nIndex) const { return m_nPlayRecord[nIndex]; }
  BOOL WasTrumpPlayed() const;
  int    GetGameTrickLead(int nRound) const { return m_nTrickLead[nRound]; }
  int    GetGameTrickWinner(int nRound) const { return m_nTrickWinner[nRound]; }
  CCard* GetGameTrickCard(int nRound, int nPlayer) const { return m_pGameTrick[nRound][nPlayer]; }
  CCard* GetCurrentTrickCardByOrder(int nOrder) const;
  CCard* GetCurrentTrickCard(int nPos) const { return m_pCurrTrick[nPos]; }
  CCard* GetCurrentTrickCardLed() const { return GetCurrentTrickCardByOrder(0); }
  CCard* GetCurrentTrickHighCard(int* nPos = NULL)  const;
  void SetCurrentTrickCard(int nPos, CCard* pCard) { m_pCurrTrick[nPos] = pCard; }
  int	GetCurrentPlayerPosition() const { return m_nCurrPlayer; }
  CPlayer* GetCurrentPlayer() const { return m_pPlayer[m_nCurrPlayer]; }
  void SetCurrentPlayer(int nPlayer) { m_nCurrPlayer = nPlayer; }
  int GetRoundWinner() const { return m_nRoundWinner; }
  int GetRoundWinningTeam() { return m_nRoundWinningTeam; }
  int GetNumTricksWonByTeam(int nTeam) { return m_numTricksWon[nTeam]; }
  int GetDummyPosition() const { return m_nDummy; }
  CPlayer* GetDummyPlayer() const { return m_pPlayer[m_nDummy]; }
  BOOL IsDummyExposed() const { return m_bExposeDummy; }
  void ExposeDummy(BOOL bExpose = TRUE, BOOL bRedraw = FALSE);
  void GetGameHint(BOOL bAutoHintRequest = TRUE);
  CTypedPtrArray<CPtrArray, CGameRecord*>& GetGameRecords() { return m_gameRecords; }
  CGameRecord* GetGameRecord(int nIndex) { if ((nIndex < 0) || (nIndex > m_gameRecords.GetSize())) return NULL; return m_gameRecords[nIndex]; }
  BOOL IsReviewingGame() { return m_bReviewingGame; }
  BOOL IsGameReviewAvailable() { return m_bGameReviewAvailable; }
  void SuppressBidHistoryUpdate(BOOL bCode = TRUE) { m_bSuppressBidHistoryUpdate = bCode; }
  void SuppressPlayHistoryUpdate(BOOL bCode = TRUE) { m_bSuppressPlayHistoryUpdate = bCode; }
  void DealNumberedHand(int dealer, int vulnerability, int specialDealCode, int dealNumber);
  bool PlayClaimTricks();
  bool PlayClaimContract();
  int GetTotalScoreNS() const { return m_nTotalScore[NORTH_SOUTH]; }


  CString GetFileDescription() const { return m_strFileDescription; }
  void SetFileDescription(CString val) { m_strFileDescription = val; }
  CString GetFileComments() const { return m_strFileComments; }
  void SetFileComments(CString val) { m_strFileComments = val; }
  void SetDealNumberAvailable(BOOL val) { m_bDealNumberAvailable = val; }
  BOOL IsHandsDealt() const { return m_bHandsDealt; }
  BOOL IsShowCommentsUponOpen() const { return m_bShowCommentsUponOpen; }
  void ShowCommentsUponOpen(BOOL val) { m_bShowCommentsUponOpen = val; }
  BOOL IsShowBidHistoryUponOpen() const { return m_bShowBidHistoryUponOpen; }
  void ShowBidHistoryUponOpen(BOOL val) { m_bShowBidHistoryUponOpen = val; }
  BOOL IsShowPlayHistoryUponOpen() const { return m_bShowPlayHistoryUponOpen; }
  void ShowPlayHistoryUponOpen(BOOL val) { m_bShowPlayHistoryUponOpen = val; }
  BOOL IsShowAnalysesUponOpen() const { return m_bShowAnalysesUponOpen; }
  void ShowAnalysesUponOpen(BOOL val) { m_bShowAnalysesUponOpen = val; }
  BOOL IsSavePlayerAnalysis(Position pos) const { return m_bSavePlayerAnalysis[pos]; }
  void SavePlayerAnalysis(Position pos, BOOL val) { m_bSavePlayerAnalysis[pos] = val; }
  BOOL IsSaveIntermediatePositions() const { return m_bSaveIntermediatePositions; }
  void SaveIntermediatePositions(BOOL val) { m_bSaveIntermediatePositions = val; }
  void SetExpressPlayMode(BOOL val) { m_bExpressPlayMode = val; }
  BOOL IsAutoReplayMode() const { return m_bAutoReplayMode; }
  void SetAutoReplayMode(BOOL val) { m_bAutoReplayMode = val; }
  void Initialize();
  void Terminate();
  void InitNewGame();
  void PrepForNewDeal();
  void RestartCurrentHand(BOOL bUpdateView);
  void InitializeVulnerability();
  void ClearPlayInfo();
  void UpdateScore();
  void DisplayScore();
  void UpdateDuplicateScore();
  void DisplayDuplicateScore();

  //
  void DealSpecial(int nGameCode, int nSuitCode, int nSlamCode, int nTeam = NORTH_SOUTH, int nDealNumber = 0);
  void DealSpecial(int nDealNumber, int nSpecialDealCode);
  double SwapPoints(int nDest, int nSource, double fMax, int nGameCode, int nSuitCode, int nSlamCode);
  BOOL SwapPlayersCards(int nPlayer1, int nPlayer2, int nSuit1, int nSuit2, int nCard1, int nCard2, BOOL bResetCounts = FALSE);
  void SwapPartialHands(int nPos1, int nPos2);

  //
  BOOL SwapPlayersHands(Position player1, Position player2, BOOL bRefresh = TRUE, BOOL bRestartBidding = TRUE);
  void RotatePlayersHands(int nDirection, BOOL bRefresh = TRUE, BOOL bRestartBidding = TRUE);
  void RotatePartialHands(int numPositions);

  // I/O routines
  BOOL ReadFile(CArchive& ar);
  int ParseLine(CString& string, int nLineLength);
  BOOL ReadFilePBN(CArchive& ar);
  int ParseLinePBN(CString& string, CString& strTag, CString& strValue, int nLineLength);
  int PreloadPBNFile(CArchive& ar, CStringArray& strLines);
  int ReadLine(CArchive&ar, CString& strDest);
  void AssignCards(CString& str, int nPosition, BOOL bInitialHand = FALSE);
  int  ParseBidsPBN(CArchive& ar, const CString& strValue);
  int  ParsePlaysPBN(CArchive& ar, const CString& strValue);
  void AssignCardsPBN(const CString& str);
  //void SaveCurrentGameRecord(BOOL bAllocNew = FALSE);
  //
  BOOL WriteFile(CArchive& ar);
  std::string WriteFilePBN();
  BOOL ExportGameInfo(CArchive& ar);

 private:
  static BOOL m_bInitialized;

  CPlayer* m_pPlayer[4];
  // file info
  CString m_strFileProgTitle;
  int m_nFileProgMajorVersion;
  int m_nFileProgMinorVersion;
  int m_nFileProgIncrementVersion;
  int m_nFileProgBuildNumber;
  CString m_strFileProgBuildDate;
  CString m_strFileDate;
  CString m_strFileDescription;
  CString m_strFileComments;
  //
  CString m_strDocTitle;
  // match info
  int m_nGameScore[3][2]; // current game score
  int m_nCurrGame;
  int m_nBonusScore[2]; // score above the line
  int m_nTotalScore[2]; // total game score
  int m_numGamesWon[2]; // num games won
  Team m_nVulnerableTeam; // which team is vulnerable
  BOOL m_bVulnerable[2]; // team is vulnerable flag
  std::vector<CString> m_strArrayTrickPointsRecord;
  std::vector<CString> m_strArrayBonusPointsRecord;
  CString m_strTotalPointsRecord;
  // game (contract) info
  int m_nContract;
  int m_nContractLevel;
  int m_nContractSuit;
  int m_nContractTeam; // team with the contract
  int m_nDefendingTeam;
  int m_numBidsMade;
  int m_nBiddingRound;
  BOOL m_bDoubled; // double in effect
  int m_nDoubler; // player who doubled
  BOOL m_bRedoubled; // redouble in effect
  int m_nRedoubler; // player who redoubled
  int m_nContractModifier; // doubled/redoubled status
  int m_nLastValidBid; // last non-pass bid
  int m_nLastValidBidTeam; // team to make that bid
  int m_nPartnershipSuit[2]; // selected suit
  int m_nPartnershipLead[2][5]; // player who called the suit first
  int m_numPasses;
  int m_nBiddingHistory[100];
  int m_nValidBidHistory[100]; // record of non-pass bids
  int m_numValidBidsMade;
  int m_nOpeningBid;
  int m_nOpeningBidder;
  int m_nBidsByPlayer[4][50];
  // game (play) info
  // hand info
  int m_nDealer; // dealer for current hand
  int m_nPrevDealer; // dealer for previous hand
  int m_nDeclarer; // declarer/driver for hand
  int m_nDummy; // current dummy
  BOOL m_bExposeDummy; // dummy show flag
  int m_nTrumpSuit; //
                    //
  int m_nDealNumber; // hand seed number
  int m_nSpecialDealCode;
  BOOL m_bDealNumberAvailable; // hand seed available?
                               // game (play) info
  int m_nGameLead; // player to lead off the game
  int m_nRoundLead; // player to lead this round
  int m_nPlayRound; // current play round
  int m_nCurrPlayer; // next person to play
  int m_nPlayRecord[52]; // record of cards played
  CCard* m_pGameTrick[13][4]; // history of tricks
  int m_nTrickLead[13]; // history of lead players
  int m_nTrickWinner[13]; // history of winners
  CCard* m_pCurrTrick[4]; // cards so far in trick
  int m_numTricksPlayed; // total # tricks played
  int m_numActualTricksPlayed; // actual # tricks played (w/ claim/concede)
  int m_numCardsPlayedInRound; // # played in current trick
  int m_numCardsPlayedInGame; // # played in current game
  int m_numTricksWon[2]; // # won by each team
  int m_numActualTricksWon; // saves # tricks won before auto replay
                            //
  int m_nLastBiddingHint;
  CCard* m_pLastPlayHint;
  BOOL m_bHintFollowed;
  // results info
  int m_nSuitLed;
  int m_nHighVal;
  int m_nHighTrumpVal;
  CCard* m_pHighCard;
  int m_nHighPos;
  int m_nRoundWinner;
  Team m_nRoundWinningTeam;
  // flags
  BOOL m_bHandsDealt; // hand dealt yet?
  BOOL m_bExpressPlayMode;
  BOOL m_bAutoReplayMode;
  BOOL m_bBatchMode;
  BOOL m_bHintMode;
  BOOL m_bSuppressBidHistoryUpdate;
  BOOL m_bSuppressPlayHistoryUpdate;
  // auto window open triggers
  BOOL m_bShowCommentsUponOpen;
  BOOL m_bShowBidHistoryUponOpen;
  BOOL m_bShowPlayHistoryUponOpen;
  BOOL m_bShowAnalysesUponOpen;
  // save options
  BOOL m_bSavePlayerAnalysis[4];
  BOOL m_bSaveIntermediatePositions;
  // file I/O
  BOOL m_bReviewingGame;
  BOOL m_bGameReviewAvailable;
  int m_nLineNumber;

  //
  // misc info
  //
  CTypedPtrArray<CPtrArray, CGameRecord*> m_gameRecords;

  std::shared_ptr<AppInterface> app_;
};

#endif // EZ_MODEL_DEAL_
