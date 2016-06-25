#include "stdafx.h"
#include "model/deal.h"
#include "engine/CARD.H"
#include "engine/Player.h"


Deal::Deal(std::shared_ptr<AppInterface> app) : app_(app) {
  m_nDealer_deal = NONE;
  m_nCurrPlayer_deal = NULL;

  // create the players
  for (int i = 0; i < 4; i++)
    m_pPlayer_deal[i] = new CPlayer(app);

  // and init each player's info
  for (int i = 0; i < 4; i++) {
    CPlayer* pLHOpponent = m_pPlayer_deal[(i + 1) % 4];
    CPlayer* pPartner = m_pPlayer_deal[(i + 2) % 4];
    CPlayer* pRHOpponent = m_pPlayer_deal[(i + 3) % 4];
    m_pPlayer_deal[i]->InitializePlayer((Position)i, pPartner, pLHOpponent, pRHOpponent);
  }

  // init the players' engines (must do this after the above inits!!!)
  for (int i = 0; i < 4; i++)
    m_pPlayer_deal[i]->InitializeEngines();
}

Deal::~Deal() {
  // clean up memory
  for (int i = 0; i < 4; i++)
    delete m_pPlayer_deal[i];
}


//
const CString Deal::GetContractString() const {
  return app_->ContractToString(m_nContract_deal, m_nContractModifier_deal);
}

//
const CString Deal::GetFullContractString() const {
  return app_->ContractToFullString(m_nContract_deal, m_nContractModifier_deal);
}

//
int Deal::GetBidByPlayer(CPlayer* pPlayer, int nRound) const {
  return m_nBidsByPlayer_deal[pPlayer->GetPosition()][nRound];
}

//
BOOL Deal::WasTrumpPlayed() const {
  int nIndex = m_nRoundLead_deal;
  //
  for (int i = 0; i < m_numCardsPlayedInRound_deal; i++) {
    CCard* pCard = m_pCurrTrick_deal[nIndex];
    if ((pCard) && (pCard->GetSuit() == m_nTrumpSuit_deal))
      return TRUE;
    nIndex = app_->GetNextPlayer(nIndex);
  }
  return FALSE;
}



//
CCard* Deal::GetCurrentTrickCardByOrder(int nOrder) const {
  if ((nOrder < 0) || (nOrder >= m_numCardsPlayedInRound_deal))
    return NULL;
  int nIndex = m_nRoundLead_deal;
  for (int i = 0; i < nOrder; i++)
    nIndex = app_->GetNextPlayer(nIndex);
  //
  ASSERT(m_pCurrTrick_deal[nIndex] != NULL);
  return m_pCurrTrick_deal[nIndex];
}

//
// GetCurrentTrickHighCard()
//
// returns the current high card for the trick
//
CCard* Deal::GetCurrentTrickHighCard(int* nPos) const {
  // set the round lead as the initial high card
  int nHighPos = m_nRoundLead_deal;
  CCard* pHighCard = m_pCurrTrick_deal[m_nRoundLead_deal];
  if (pHighCard == NULL)
    return NULL;
  int nSuit = pHighCard->GetSuit();
  // and start comparing with the second player
  int nIndex = app_->GetNextPlayer(m_nRoundLead_deal);
  // see if a trump was played in this round
  BOOL bTrumpPlayed = WasTrumpPlayed();
  //
  for (int i = 0; i < m_numCardsPlayedInRound_deal - 1; i++) {
    CCard* pCard = m_pCurrTrick_deal[nIndex];
    if (!bTrumpPlayed) {
      // no trump played so far in this round, 
      // so the top card of the suit led will be the high man
      if ((pCard->GetSuit() == nSuit) && (*pCard > *pHighCard)) {
        pHighCard = pCard;
        nHighPos = nIndex;
      }
    } else {
      // one or more trumps were played in the current trick
      // so is the current high card a trump?  
      if (pHighCard->GetSuit() == m_nTrumpSuit_deal) {
        // in that case, only a higher trump will do
        if ((pCard->GetSuit() == m_nTrumpSuit_deal) &&
          (*pCard > *pHighCard)) {
          pHighCard = pCard;
          nHighPos = nIndex;
        }
      } else if (pCard->GetSuit() == m_nTrumpSuit_deal) {
        // else current high card is not a trump, 
        // so any trump that's played is tops
        pHighCard = pCard;
        nHighPos = nIndex;
      }
    }
    // advance to the next player
    nIndex = app_->GetNextPlayer(nIndex);
  }
  //
  if (nPos)
    *nPos = nHighPos;
  return pHighCard;
}

