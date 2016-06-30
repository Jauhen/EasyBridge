#ifndef EZ_MODEL_DEAL_
#define EZ_MODEL_DEAL_

#include "engine/card_constants.h"
#include "app_interface.h"

class CPlayer;
class CGameRecord;
class CCard;

class Deal {
public:
  Deal(std::shared_ptr<AppInterface> app);
  ~Deal();

protected:
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
  int m_nFileFormat;
  int m_nPrevFileFormat;
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
  CStringArray m_strArrayTrickPointsRecord;
  CStringArray m_strArrayBonusPointsRecord;
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
