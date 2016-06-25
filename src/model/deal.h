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

  CPlayer* GetPlayer(int nIndex) const { return m_pPlayer_deal[nIndex]; }
  CPlayer* GetHumanPlayer() const { return m_pPlayer_deal[SOUTH]; }
  int GetHumanPlayerPos() const { return SOUTH; }
  int	GetContract() const { return m_nContract_deal; }

  const CString GetContractString() const;
  const CString GetFullContractString() const;
  int	GetContractSuit() const { return m_nContractSuit_deal; }
  int	GetTrumpSuit() const { return m_nTrumpSuit_deal; }
  int	GetContractLevel() const { return m_nContractLevel_deal; }
  int GetContractModifier() const { return m_nContractModifier_deal; }
  BOOL IsContractDoubled() const { return m_bDoubled_deal; }
  BOOL IsContractRedoubled() const { return m_bRedoubled_deal; }
  int	GetDealer() const { return m_nDealer_deal; }
  CPlayer* GetDeclarer() const { return ISPLAYER(m_nDeclarer_deal) ? m_pPlayer_deal[m_nDeclarer_deal] : NULL; }
  int	GetDeclarerPosition() const { return m_nDeclarer_deal; }
  int GetDeclaringTeam() const { return app_->GetPlayerTeam(m_nDeclarer_deal); }
  int	GetRoundLead() const { return m_nRoundLead_deal; }
  CPlayer* GetRoundLeadPlayer() const { return m_pPlayer_deal[m_nRoundLead_deal]; }
  int	GetBiddingRound() const { return m_nBiddingRound_deal; }
  int	GetNumBidsMade() const { return m_numBidsMade_deal; }
  int GetOpeningBid() const { return m_nOpeningBid_deal; }
  int GetOpeningBidder() const { return m_nOpeningBidder_deal; }
  int	GetNumValidBidsMade() const { return m_numValidBidsMade_deal; }
  int	GetLastValidBid() const { return m_nLastValidBid_deal; }
  int	GetLastValidBidTeam() const { return m_nLastValidBidTeam_deal; }
  int GetBidByPlayer(int nPlayer, int nRound) const { return m_nBidsByPlayer_deal[nPlayer][nRound]; }
  int GetBidByPlayer(CPlayer* pPlayer, int nRound) const;
  int GetBidByIndex(int nIndex) const { return m_nBiddingHistory_deal[nIndex]; }
  int GetValidBidRecord(int nIndex) const { return m_nValidBidHistory_deal[nIndex]; }
  int GetVulnerableTeam() const { return m_nVulnerableTeam_deal; }
  BOOL IsTeamVulnerable(int nTeam) { return m_bVulnerable_deal[nTeam]; }
  //	int	GetPlayRound() const { return m_nPlayRound; }
  int	GetPlayRound() const { return m_numTricksPlayed_deal; }
  int	GetNumCardsPlayedInRound() const { return m_numCardsPlayedInRound_deal; }
  int	GetNumCardsPlayedInGame() const { return m_numCardsPlayedInGame_deal; }
  int	GetNumTricksPlayed() const { return m_numTricksPlayed_deal; }
  int	GetNumTricksRemaining() const { return 13 - m_numTricksPlayed_deal; }
  int	GetPlayRecord(int nIndex) const { return m_nPlayRecord_deal[nIndex]; }
  BOOL WasTrumpPlayed() const;
  int    GetGameTrickLead(int nRound) const { return m_nTrickLead_deal[nRound]; }
  int    GetGameTrickWinner(int nRound) const { return m_nTrickWinner_deal[nRound]; }
  CCard* GetGameTrickCard(int nRound, int nPlayer) const { return m_pGameTrick_deal[nRound][nPlayer]; }
  CCard* GetCurrentTrickCardByOrder(int nOrder) const;
  CCard* GetCurrentTrickCard(int nPos) const { return m_pCurrTrick_deal[nPos]; }
  CCard* GetCurrentTrickCardLed() const { return GetCurrentTrickCardByOrder(0); }
  CCard* GetCurrentTrickHighCard(int* nPos = NULL)  const;
  void SetCurrentTrickCard(int nPos, CCard* pCard) { m_pCurrTrick_deal[nPos] = pCard; }
  int	GetCurrentPlayerPosition() const { return m_nCurrPlayer_deal; }
  CPlayer* GetCurrentPlayer() const { return m_pPlayer_deal[m_nCurrPlayer_deal]; }
  void SetCurrentPlayer(int nPlayer) { m_nCurrPlayer_deal = nPlayer; }
  int GetRoundWinner() const { return m_nRoundWinner_deal; }
  int GetRoundWinningTeam() { return m_nRoundWinningTeam_deal; }
  int GetNumTricksWonByTeam(int nTeam) { return m_numTricksWon_deal[nTeam]; }
  int GetDummyPosition() const { return m_nDummy_deal; }
  CPlayer* GetDummyPlayer() const { return m_pPlayer_deal[m_nDummy_deal]; }
  BOOL IsDummyExposed() const { return m_bExposeDummy_deal; }
  CTypedPtrArray<CPtrArray, CGameRecord*>& GetGameRecords() { return m_gameRecords_deal; }
  CGameRecord* GetGameRecord(int nIndex) { if ((nIndex < 0) || (nIndex > m_gameRecords_deal.GetSize())) return NULL; return m_gameRecords_deal[nIndex]; }

  void ClearMatchInfo();


protected:
  CPlayer*	m_pPlayer_deal[4];

  // match info
  int			m_nGameScore_deal[3][2];	// current game score
  int			m_nCurrGame_deal;
  int			m_nBonusScore_deal[2];	// score above the line
  int			m_nTotalScore_deal[2];	// total game score
  int	    	m_numGamesWon_deal[2];	// num games won
  Team		m_nVulnerableTeam_deal;	// which team is vulnerable
  BOOL		m_bVulnerable_deal[2];	// team is vulnerable flag
  CStringArray	m_strArrayTrickPointsRecord_deal;
  CStringArray	m_strArrayBonusPointsRecord_deal;
  CString			m_strTotalPointsRecord_deal;
  // game (contract) info
  int			m_nContract_deal;
  int			m_nContractLevel_deal;
  int			m_nContractSuit_deal;
  int			m_nContractTeam_deal;		// team with the contract
  int			m_nDefendingTeam_deal;
  int			m_numBidsMade_deal;
  int			m_nBiddingRound_deal;
  BOOL		m_bDoubled_deal;				// double in efect
  int			m_nDoubler_deal;				// player who doubled
  BOOL		m_bRedoubled_deal;			// redouble in effect
  int			m_nRedoubler_deal;			// player who redoubled
  int			m_nContractModifier_deal;	// doubled/redoubled status
  int			m_nLastValidBid_deal;		// last non-pass bid
  int			m_nLastValidBidTeam_deal;	// team to make that bid
  int			m_nPartnershipSuit_deal[2];	// selected suit
  int			m_nPartnershipLead_deal[2][5];	// player who called the suit first
  int			m_numPasses_deal;
  int			m_nBiddingHistory_deal[100];
  int			m_nValidBidHistory_deal[100];	// record of non-pass bids
  int			m_numValidBidsMade_deal;
  int			m_nOpeningBid_deal;
  int			m_nOpeningBidder_deal;
  int			m_nBidsByPlayer_deal[4][50];
  // game (play) info
  // hand info
  int			m_nDealer_deal;			// dealer for current hand
  int			m_nPrevDealer_deal;		// dealer for previous hand
  int			m_nDeclarer_deal;		// declarer/driver for hand
  int			m_nDummy_deal;			// current dummy
  BOOL		m_bExposeDummy_deal;		// dummy show flag
  int			m_nTrumpSuit_deal;		//
                          //
  int			m_nDealNumber_deal;				// hand seed number
  int			m_nSpecialDealCode_deal;
  BOOL		m_bDealNumberAvailable_deal;		// hand seed available?
                                    // game (play) info
  int			m_nGameLead_deal;		// player to lead off the game
  int			m_nRoundLead_deal;		// player to lead this round
  int			m_nPlayRound_deal;		// current play round
  int			m_nCurrPlayer_deal;		// next person to play
  int			m_nPlayRecord_deal[52];	// record of cards played
  CCard*		m_pGameTrick_deal[13][4]; // history of tricks
  int			m_nTrickLead_deal[13];	// history of lead players
  int			m_nTrickWinner_deal[13];	// history of winners
  CCard*		m_pCurrTrick_deal[4];			// cards so far in trick
  int			m_numTricksPlayed_deal;			// total # tricks played
  int			m_numActualTricksPlayed_deal;	// actual # tricks played (w/ claim/concede)
  int			m_numCardsPlayedInRound_deal; // # played in current trick
  int			m_numCardsPlayedInGame_deal;	 // # played in current game
  int			m_numTricksWon_deal[2];	// # won by each team
  int			m_numActualTricksWon_deal;	// saves # tricks won before auto replay
                                //
  int			m_nLastBiddingHint_deal;
  CCard*		m_pLastPlayHint_deal;
  BOOL		m_bHintFollowed_deal;
  // results info
  int			m_nSuitLed_deal;
  int			m_nHighVal_deal;
  int			m_nHighTrumpVal_deal;
  CCard*		m_pHighCard_deal;
  int			m_nHighPos_deal;
  int			m_nRoundWinner_deal;
  Team 		m_nRoundWinningTeam_deal;
  BOOL		m_bHandsDealt_deal;		// hand dealt yet?
  //
  // misc info
  //
  CTypedPtrArray<CPtrArray, CGameRecord*>	 m_gameRecords_deal;


  std::shared_ptr<AppInterface> app_;
};

#endif // EZ_MODEL_DEAL_
