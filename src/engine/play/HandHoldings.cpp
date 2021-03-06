//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CHandHoldings
//

#include "stdafx.h"
#include "engine/card_constants.h"
#include "engine/Card.h"
#include "engine/play/HandHoldings.h"
#include "engine/Player.h"
#include "engine/play/PlayEngine.h"
#include "engine/PlayerStatusDialog.h"
#include "engine/bidding/ConventionSet.h"
#include "engine/bidding/bidparams.h"
#include "model/deal.h"
#include "app_interface.h"
#include "model/settings.h"


//
//=================================================================
//
// Construction/Destruction
//

// constructor
CHandHoldings::CHandHoldings(std::shared_ptr<AppInterface> app)
  : CCardHoldings(app),
  m_initialHand(app),
  m_displayHand(app),
  m_suit {{app}, {app}, {app}, {app}} {
  // clear all variables
}

// destructor
CHandHoldings::~CHandHoldings() {}

//
void CHandHoldings::Initialize(CPlayer* pPlayer, CPlayerStatusDialog* pStatusDlg) {
  m_pPlayer = pPlayer;
  m_pStatusDlg = pStatusDlg;
  CCardHoldings::Init();
  m_initialHand.Init();
  m_displayHand.Init();
  for (int i = 0; i < 4; i++) {
    m_suit[i].Init();
    m_suit[i].SetSuit(i);
  }
}


//
//--------------------------------------------------------------
//
// Misc routines
//

//
void CHandHoldings::InitNewHand() {
  // first sort the hand & suits
  Sort();

  // then assign card ranks
  // and hide the cards if not the player
  if (m_pPlayer->GetPosition() == SOUTH) {
    for (int i = 0; i < 13; i++)
      m_cards[i]->SetFaceUp();
  } else {
    for (int i = 0; i < 13; i++)
      m_cards[i]->SetFaceDown();
  }

  // now save the cards as the initial hand
  m_initialHand.Clear();
  for (int i = 0; i < 13; i++)
    m_initialHand.Add(m_cards[i]);

  // and sort the initial hand
  m_initialHand.Sort();

  // then count points and then cards (follow this order!)
  m_bCountPerformed = FALSE;
  CountCards();
  CountPoints(TRUE);
  //	CountCards();

    // done
}



//
// InitSwappedHand()
//
// Called after the player's hand has been swapped with another player's in midgame
//
void CHandHoldings::InitSwappedHand() {
  // first sort the hand & suits
  Sort();

  // then assign card ranks
  // and hide the cards if not the player
  if (m_pPlayer->GetPosition() == SOUTH) {
    for (int i = 0; i < m_numCards; i++)
      m_cards[i]->SetFaceUp();
  } else {
    for (int i = 0; i < m_numCards; i++)
      m_cards[i]->SetFaceDown();
  }

  // sort the initial hand
  m_initialHand.Sort();

  // then count points and then cards (follow this order!)
  m_bCountPerformed = FALSE;
  CountCards();
  CountPoints(TRUE);
}



//
void CHandHoldings::ClearHand(BOOL bClearInitialHand) {
  CCardHoldings::Clear();
  m_displayHand.Clear();
  for (int i = 0; i < 4; i++)
    m_suit[i].Clear();
  //
  if (bClearInitialHand)
    m_initialHand.Clear();
  //
  // clear hand holdings variables
  //
  m_numHCPoints = 0;
  m_numShortPoints = 0;
  m_numLongPoints = 0;
  m_numBonusPoints = 0;
  m_numPenaltyPoints = 0;
  m_numTotalPoints = 0;
  m_numAdjustedPoints = 0;	// this is modified later
  m_numAces = 0;
  m_numKings = 0;
  m_numQueens = 0;
  m_numJacks = 0;
  m_numTens = 0;
  m_nBalanceValue = 0;
  m_numVoids = 0;
  m_numSingletons = 0;
  m_numDoubletons = 0;
  for (int i = 0; i < 4; i++) {
    m_nVoidSuits[i] = NONE;
    m_nSingletonSuits[i] = NONE;
    m_nDoubletonSuits[i] = NONE;
  }
  for (int i = 0; i <= 13; i++)
    m_numSuitsOfAtLeast[i] = 0;
  // clear analysis
  for (int i = 0; i < 4; i++)
    m_bRevaluedForSuit[i] = FALSE;
  //
  m_bCardsExposed = FALSE;
}



//
// ExposeCards()
//
void CHandHoldings::ExposeCards(BOOL bExpose) {
  for (int i = 0; i < m_numCards; i++)
    m_cards[i]->SetFaceUp(bExpose);
  m_bCardsExposed = bExpose;
}



//
// clear variables used during the bidding process
//
void CHandHoldings::RestartBidding() {
  // clear analysis
  for (int i = 0; i < 4; i++)
    m_bRevaluedForSuit[i] = FALSE;
}


//
void CHandHoldings::FormatHoldingsString() {
  // format the normal ordered holdings
  m_strHoldings.Format("S:%s  H:%s  D:%s  C:%s",
    m_suit[3].GetHoldingsString(),
    m_suit[2].GetHoldingsString(),
    m_suit[1].GetHoldingsString(),
    m_suit[0].GetHoldingsString());
  // and also in GIB format
  CCardHoldings::FormatGIBHoldingsString();

  // and then the screen holding
  m_displayHand.FormatGIBHoldingsString();
  m_strScreenHolding = "";
  CString strTemp, strTemp2;
  for (int i = 3; i >= 0; i--) {
    int nSuit = app_->GetSettings()->GetSuitSequence(i);
    strTemp.Format("%c:", CCard::GetSuitLetter(nSuit));
    if (m_suit[i].GetLength() == 0) {
      strTemp += "void ";
      if (i > 0)
        strTemp += " ";
    } else {
      for (int j = 0; j < m_suit[i].GetLength(); j++) {
        strTemp2.Format("%c", CCard::GetCardLetter(m_suit[i][j]->GetFaceValue()));
        strTemp += strTemp2;
      }
      if (i > 0)
        strTemp += " ";
    }
    m_strScreenHolding += strTemp;
  }

  // and then the initial holdings
  // let its class do all the work
  m_initialHand.FormatHoldingsString();
}


//
void CHandHoldings::Add(CCard* pCard, const BOOL bSort) {
  CCardHoldings::Add(pCard, bSort);
  // mark the card as ours
  pCard->SetAssigned(TRUE);
  pCard->SetOwner(m_pPlayer->GetPosition());
  //
  m_displayHand.Add(pCard, bSort);
  m_suit[pCard->GetSuit()].Add(pCard, bSort);
  // need to call FormatStringHoldings() again to update w/ suits
  FormatHoldingsString();
}


//
void CHandHoldings::AddToInitialHand(CCard* pCard, const BOOL bSort) {
  m_initialHand.Add(pCard, bSort);
}


//
CCard* CHandHoldings::RemoveByIndex(const int nIndex) {
  ASSERT(nIndex >= 0);
  CCard* pCard = CCardHoldings::RemoveByIndex(nIndex);
  m_displayHand.Remove(pCard);

  // reorganize ordered suit holding
  for (int i = nIndex; i < m_numCards; i++)
    m_cards[i]->DecrementHandIndex();

  // then update the suit
  m_suit[pCard->GetSuit()].Remove(pCard);

  // and update card info
  pCard->ClearAssignment();
  FormatHoldingsString();

  // done
  return pCard;
}




/*
 * right now, there's no real reason to redefine these operations
 *
//
BOOL CHandHoldings::HasCard(int nDeckValue)
{
  if (m_numCards == 0) return FALSE;
  if (m_bSorted)
  {
    for(int i=0;i<m_numCards;i++)
    {
      if (m_cards[i]->GetDeckValue() == nValue)
        return TRUE;
      if (m_cards[i]->GetDeckValue() < nValue)
        return FALSE;	// passed where it should have been
    }
    return FALSE;
  }
  else
  {
    return CCardHoldings::HasCard(nValue);
  }
}

//
BOOL CHandHoldings::HasCardOfFaceValue(int nFaceValue)
{
  if (m_numCards == 0) return FALSE;
  if (m_bSorted)
  {
    for(int i=0;i<m_numCards;i++)
    {
      if (m_cards[i]->GetFaceValue() == nFaceValue)
        return TRUE;
      if (m_cards[i]->GetFaceValue() < nFaceValue)
        return FALSE;	// passed where it should have been
    }
    return FALSE;
  }
  else
  {
    return CCardHoldings::HasCardOfFaceValue(nFaceValue);
  }
}
*/


//
void CHandHoldings::Sort() {
  // first call base class to sort the cards in S-H-D-C order
  CCardHoldings::Sort();

  // then assign card ranks
  for (int i = 0; i < m_numCards; i++) {
    m_cards[i]->SetHandIndex(i);
    m_cards[i]->SetOwner(m_pPlayer->GetPosition());
    m_cards[i]->SetAssigned();
  }

  // and then be sure to sort each of the suits individually
  for (int i = 0; i < 4; i++)
    m_suit[i].Sort();

  // and also sort the display hand
  m_displayHand.Sort();
}




//
//=================================================================
//=================================================================
//
// Main routines
//
//=================================================================
//=================================================================
//




//
// CountCards()
//
// called to count length in the hand's suits
// separated out from the point count cuz the card count can be done many times 
// during the course of a hand, while the point count is only done once, for bidding
//
void CHandHoldings::CountCards() {
  // check suit length
  for (int i = 0; i < 4; i++)
    m_suit[i].CountCards();

  // init
  for (int i = 0; i < 4; i++) {
    m_nVoidSuits[i] = NONE;
    m_nSingletonSuits[i] = NONE;
    m_nDoubletonSuits[i] = NONE;
  }

  //
  // then check for voids, singletons, & doubletons
  //
  m_numVoids = 0;
  m_numSingletons = 0;
  m_numDoubletons = 0;
  //
  for (int i = 0; i < 4; i++) {
    if (m_suit[i].IsVoid()) {
      m_nVoidSuits[m_numVoids] = i;
      m_numVoids++;;
    }
    if (m_suit[i].IsSingleton()) {
      m_nSingletonSuits[m_numSingletons] = i;
      m_numSingletons++;
    }
    if (m_suit[i].IsDoubleton()) {
      m_nDoubletonSuits[m_numDoubletons] = i;
      m_numDoubletons++;
    }
  }

  // count aces and kings
  m_numAces = 0;
  m_numKings = 0;
  m_numQueens = 0;
  m_numJacks = 0;
  m_numTens = 0;
  for (int i = 0; i < 4; i++) {
    if (m_suit[i].HasAce())
      m_numAces++;
    if (m_suit[i].HasKing())
      m_numKings++;
    if (m_suit[i].HasQueen())
      m_numQueens++;
    if (m_suit[i].HasJack())
      m_numJacks++;
    if (m_suit[i].HasTen())
      m_numTens++;
  }

  // mark indicators of how many suits have at least 
  // x # of cards in them
  for (int i = 13; i >= 0; i--) {
    // clear and set
    m_numSuitsOfAtLeast[i] = 0;
    for (int j = 0; j < 4; j++)
      if (m_suit[j].GetLength() >= i)
        m_numSuitsOfAtLeast[i]++;
  }
}




//
// CountPoints()
//
// called right after the deal to count points in the hand
//
double CHandHoldings::CountPoints(const BOOL bForceCount) {
  // avoid repeating the count unless forced to do so
  if ((m_bCountPerformed) && (!bForceCount))
    return m_numTotalPoints;

  // first call the base class to count HC points
  CCardHoldings::CountPoints(bForceCount);

  // sort the hand
  if (!m_bSorted)
    Sort();

  // count the points for each suit
  m_numShortPoints = 0;
  m_numLongPoints = 0;
  m_numBonusPoints = 0;
  m_numPenaltyPoints = 0;
  //	m_numTotalPoints = 0;
    //
  for (int i = 0; i < 4; i++) {
    m_suit[i].CountPoints(bForceCount);
    m_numShortPoints += m_suit[i].GetShortPoints();
    m_numLongPoints += m_suit[i].GetLengthPoints();
    m_numBonusPoints += m_suit[i].GetBonusPoints();
    m_numPenaltyPoints += m_suit[i].GetPenaltyPoints();
    //		m_numTotalPoints += m_suit[i].GetTotalPoints();
  }
  //	m_numDistPoints = m_numShortPoints + m_numLongPoints;
  m_numDistPoints = m_numLongPoints;
  //	m_numAdjustedPoints = m_numTotalPoints;

    //
    // determine hand-level bonuses and penalties
    //

    // deduct 1 point for an aceless hand
  if (app_->GetSettings()->GetAcelessPenalty() && (m_numAces == 0))
    m_numPenaltyPoints++;

  // and add 1 point for holding all 4 aces
  if (app_->GetSettings()->Get4AceBonus() && (m_numAces == 4))
    m_numBonusPoints++;

  //
  // now add up all the points
  // but don't count short points yet
  //
  m_numTotalPoints = m_numHCPoints + m_numLongPoints +
    m_numBonusPoints - m_numPenaltyPoints;
  m_numAdjustedPoints = m_numTotalPoints;

  // determine balanced-ness of each suit & the overall hand
  m_nBalanceValue = 0;
  for (int i = 0; i < 4; i++) {
    int numSuitCards = m_suit[i].GetNumCards();
    if (numSuitCards < 3)
      m_nBalanceValue += 3 - numSuitCards;
    else if (numSuitCards > 4)
      m_nBalanceValue += numSuitCards - 4;
  }
  // a 5/4/3/1 distribution violates the balanced hand rule
  if (m_numSingletons > 0)
    m_nBalanceValue = 3;

  //
  // now summarize the QTs & stoppers 
  //
  m_numQuickTricks = 0.0;
  m_numSuitsStopped = 0;
  m_numSuitsProbStopped = 0;
  m_numSuitsUnstopped = 0;
  m_strSuitsStopped.Empty();
  m_strSuitsUnstopped.Empty();
  //
  for (int i = 0; i < 4; i++) {
    m_nSuitsStopped[i] = NONE;
    m_nSuitsProbStopped[i] = NONE;
    m_nSuitsUnstopped[i] = NONE;
  }

  // count stoppers & quick tricks
  for (int i = 0; i < 4; i++) {
    m_numQuickTricks += m_suit[i].GetNumQuickTricks();
    if (m_suit[i].IsSuitStopped()) {
      m_nSuitsStopped[m_numSuitsStopped] = i;
      m_numSuitsStopped++;
      // record the name of the suit stopped
      m_strSuitsStopped += CCard::SuitToString(i);
      m_strSuitsStopped += ", ";
    } else if (m_suit[i].IsSuitProbablyStopped()) {
      m_nSuitsProbStopped[m_numSuitsStopped] = i;
      m_numSuitsProbStopped++;
      // record the name of the suit probably stopped
      m_strSuitsProbStopped += CCard::SuitToString(i);
      m_strSuitsProbStopped += ", ";
    } else {
      // suit not stopped
      m_nSuitsUnstopped[m_numSuitsUnstopped] = i;
      m_numSuitsUnstopped++;
      // record suit name
      m_strSuitsUnstopped += CCard::SuitToString(i);
      m_strSuitsUnstopped += ", ";
    }
  }
  // trim trailing characters in list of stopped suits (e.g., ", ")
  m_strSuitsStopped.TrimRight();
  if ((m_strSuitsStopped.GetLength() > 0) &&
    (m_strSuitsStopped[m_strSuitsStopped.GetLength() - 1] == ','))
    m_strSuitsStopped.ReleaseBuffer(m_strSuitsStopped.GetLength() - 1);
  m_strSuitsProbStopped.TrimRight();
  if ((m_strSuitsProbStopped.GetLength() > 0) &&
    (m_strSuitsProbStopped[m_strSuitsProbStopped.GetLength() - 1] == ','))
    m_strSuitsProbStopped.ReleaseBuffer(m_strSuitsProbStopped.GetLength() - 1);
  m_strSuitsUnstopped.TrimRight();
  if ((m_strSuitsUnstopped.GetLength() > 0) &&
    (m_strSuitsUnstopped[m_strSuitsUnstopped.GetLength() - 1] == ','))
    m_strSuitsUnstopped.ReleaseBuffer(m_strSuitsUnstopped.GetLength() - 1);

  // all done
  return m_numTotalPoints;
}






//
//----------------------------------------------------------
//
// EvaluateHoldings()
//
// called after hand is dealt and before bidding
//
void CHandHoldings::EvaluateHoldings() {
  CPlayerStatusDialog& status = *m_pStatusDlg;

  // clear the hand's analysis info
  for (int i = 0; i < 5; i++) {
    m_nMarginalSuitList[i] = NONE;
    m_nOpenableSuitList[i] = NONE;
    m_nStrongSuitList[i] = NONE;
    m_nAbsoluteSuitList[i] = NONE;
    m_nPreferredSuitList[i] = NONE;
    m_nSolidSuitList[i] = NONE;
    m_nSuitsByPreference[i] = NONE;
  }
  for (int i = 0; i < 4; i++)
    m_nSuitsByLength[i] = NONE;
  for (int i = 0; i < 4; i++)
    m_bRevaluedForSuit[i] = FALSE;

  // clear hand analysis
  m_numMarginalSuits = 0;
  m_numOpenableSuits = 0;
  m_numStrongSuits = 0;
  m_numAbsoluteSuits = 0;
  m_numPreferredSuits = 0;
  m_numSolidSuits = 0;
  m_nLowestMarginalSuit = NONE;
  m_nLowestOpenableSuit = NONE;
  m_nLowestStrongSuit = NONE;
  m_nLowestAbsoluteSuit = NONE;
  m_nLowestPreferredSuit = NONE;
  m_nLowestSolidSuit = NONE;
  m_nHighestMarginalSuit = NONE;
  m_nHighestOpenableSuit = NONE;
  m_nHighestStrongSuit = NONE;
  m_nHighestAbsoluteSuit = NONE;
  m_nHighestPreferredSuit = NONE;
  m_nHighestSolidSuit = NONE;
  //
  m_nPreferredSuit = NONE;
  m_nLongestSuit = NONE;

  //
  //-------------------------------------------------------
  //
  // first report the hand
  //
  CString strLine, str1;
  status << "4=====================================\n";
  status << "4Received hand:\n  " & m_strHoldings & "\n";

  //
  //-------------------------------------------------------
  //
  // then analyze strength of hand
  //

  // first evaluate the individual suits
  for (int i = 0; i < 4; i++)
    m_suit[i].EvaluateHoldings();

  /*
    // now do the same for no trumps
    if (m_nBalanceValue <= 2)
    {
      // a balanced hand is the minimum rqmt to bid NT
      // but the number of stopped suits is the key
      if (m_numSuitsStopped == 4)
        m_nSuitStatus[4] = SS_STRONG;
      else if (m_numSuitsStopped == 3)
        m_nSuitStatus[4] = SS_OPENABLE;
      else if (m_numSuitsStopped == 2)
        m_nSuitStatus[4] = SS_GOOD_SUPPORT;
      else
        m_nSuitStatus[4] = SS_WEAK_SUPPORT;
    }
  */

  //
  // sort suits by length (and also by suit rank)
  //
  for (int i = 0; i < 4; i++)
    m_nSuitsByLength[i] = 3 - i;	// init, high suit to low suit
  // here's that ol', inefficient bubble sort again
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 3; j++) {
      // move the suit back if it's shorter
      if (m_suit[m_nSuitsByLength[j]].GetLength() < m_suit[m_nSuitsByLength[j + 1]].GetLength()) {
        // swap suits and move this one back
        int nTemp = m_nSuitsByLength[j];
        m_nSuitsByLength[j] = m_nSuitsByLength[j + 1];
        m_nSuitsByLength[j + 1] = nTemp;
      }
    }
  }
  m_nLongestSuit = m_nSuitsByLength[0];

  //
  // summarize info about the suit holdings 
  //
  for (int i = 0; i < 4; i++) {
    if (m_suit[i].GetStrength() >= SS_MARGINAL_OPENER) {
      if (m_numMarginalSuits == 0)
        m_nLowestMarginalSuit = i;
      m_nMarginalSuitList[m_numMarginalSuits] = i;
      m_numMarginalSuits++;
      if (m_nLowestMarginalSuit == NONE)
        m_nLowestMarginalSuit = i;
      if (i > m_nHighestMarginalSuit)
        m_nHighestMarginalSuit = i;
    }
    if (m_suit[i].GetStrength() >= SS_OPENABLE) {
      if (m_numOpenableSuits == 0)
        m_nLowestOpenableSuit = i;
      m_nOpenableSuitList[m_numOpenableSuits] = i;
      m_numOpenableSuits++;
      if (m_nLowestOpenableSuit == NONE)
        m_nLowestOpenableSuit = i;
      if (i > m_nHighestOpenableSuit)
        m_nHighestOpenableSuit = i;
    }
    if (m_suit[i].GetStrength() >= SS_STRONG) {
      if (m_numStrongSuits == 0)
        m_nLowestStrongSuit = i;
      m_nStrongSuitList[m_numStrongSuits] = i;
      m_numStrongSuits++;
      if (m_nLowestStrongSuit == NONE)
        m_nLowestStrongSuit = i;
      if (i > m_nHighestStrongSuit)
        m_nHighestStrongSuit = i;
    }
    if (m_suit[i].GetStrength() >= SS_ABSOLUTE) {
      if (m_numAbsoluteSuits == 0)
        m_nLowestAbsoluteSuit = i;
      m_nAbsoluteSuitList[m_numAbsoluteSuits] = i;
      m_numAbsoluteSuits++;
      // set this suit as preferred
      m_nPreferredSuitList[m_numPreferredSuits] = i;
      m_numPreferredSuits++;
      if (m_nLowestPreferredSuit == NONE)
        m_nLowestPreferredSuit = i;
      if (i > m_nHighestPreferredSuit)
        m_nHighestPreferredSuit = i;
    }
  }

  // if there were no absolute suits found, set the preferred
  // suit among the strong or openable suits
  if (m_numPreferredSuits == 0) {
    for (int i = 0; i < 4; i++) {
      if (m_suit[i].GetStrength() >= SS_STRONG) {
        m_nPreferredSuitList[m_numPreferredSuits] = i;
        m_numPreferredSuits++;
        m_suit[i].SetPreferred();
        if (m_nLowestPreferredSuit == NONE)
          m_nLowestPreferredSuit = i;
        if (i > m_nHighestPreferredSuit)
          m_nHighestPreferredSuit = i;
      }
    }
  }
  // now check the openable suits
  if (m_numPreferredSuits == 0) {
    for (int i = 0; i < 4; i++) {
      if (m_suit[i].GetStrength() == SS_OPENABLE) {
        m_nPreferredSuitList[m_numPreferredSuits] = i;
        m_numPreferredSuits++;
        m_suit[i].SetPreferred();
        if (m_nLowestPreferredSuit == NONE)
          m_nLowestPreferredSuit = i;
        if (i > m_nHighestPreferredSuit)
          m_nHighestPreferredSuit = i;
      }
    }
  }
  // and the marginal opener/strong support suits
  if (m_numPreferredSuits == 0) {
    for (int i = 0; i < 4; i++) {
      if (m_suit[i].GetStrength() == SS_MARGINAL_OPENER) {
        m_nPreferredSuitList[m_numPreferredSuits] = i;
        m_numPreferredSuits++;
        m_suit[i].SetPreferred();
        if (m_nLowestPreferredSuit == NONE)
          m_nLowestPreferredSuit = i;
        if (i > m_nHighestPreferredSuit)
          m_nHighestPreferredSuit = i;
      }
    }
  }

  // else just pick the longest suit
  if (m_numPreferredSuits == 0) {
    m_nPreferredSuitList[0] = m_nLongestSuit;
    m_numPreferredSuits = 1;
    m_suit[m_nLongestSuit].SetPreferred();
    m_nHighestPreferredSuit = m_nLowestPreferredSuit = m_nLongestSuit;
    int nLength = m_suit[m_nLongestSuit].GetLength();

    // see if there are other suits with the same length
    for (int i = 3; i >= 0; i--) {
      if ((i == m_nLongestSuit) || (m_suit[i].GetLength() < nLength))
        continue;
      // found another suit of the same length
      m_nPreferredSuitList[m_numPreferredSuits] = i;
      m_numPreferredSuits++;
      m_suit[i].SetPreferred();
      m_nLowestPreferredSuit = i;
    }
  }

  //
  // test for solid suits
  //
  for (int i = 0; i < 4; i++) {
    if (m_suit[i].IsSolid()) {
      m_nSolidSuitList[m_numSolidSuits] = i;
      m_numSolidSuits++;
      if (i < m_nLowestSolidSuit)
        m_nLowestSolidSuit = i;
      if (i > m_nHighestSolidSuit)
        m_nHighestSolidSuit = i;
    }
  }

  //
  // now rank the suits in order of preference
  //
  m_nPreferredSuit = RankSuits(4, SP_LAST, CLUBS, DIAMONDS, HEARTS, SPADES, m_nSuitsByPreference);
  for (int i = 0; i < 4; i++)
    m_suit[m_nSuitsByPreference[i]].SetRank(i);

  //
  // and see which suits (if any) are rebiddable
  //
  m_numRebiddableSuits = 0;
  for (int i = 0; i < 4; i++)
    if (m_suit[i].IsRebiddable())
      m_numRebiddableSuits++;

  //
  // count winners among the suits
  //
  m_numWinners = 0;
  m_numLikelyWinners = 0;
  m_numTopCards = 0;
  for (int i = 0; i < 4; i++) {
    m_numWinners += m_suit[i].GetNumWinners();
    m_numLikelyWinners += m_suit[i].GetNumLikelyWinners();
    m_numTopCards += m_suit[i].GetNumTopCards();
  }
  m_numLosers = m_numCards - m_numWinners;
  m_numLikelyLosers = 13 - m_numLikelyWinners;

  //
  //------------------------------------------------
  //
  // and finally report on the quality of the hand
  //
  CString strTemp;
  strLine = "Hand evaluation:\n";
  strTemp.Format("  HCPs = %.1f, Distn pts = %.1f, Bonus/Penalty = %.1f/%.1f;\r\nTotal pts = %.1f.\n",
    m_numHCPoints, m_numDistPoints, m_numBonusPoints,
    (m_numPenaltyPoints == 0) ? 0 : -m_numPenaltyPoints,
    m_numTotalPoints);
  strLine += strTemp;
  strTemp.Format("  QT's = %3.1f,\n", m_numQuickTricks);
  strLine += strTemp;
  if (m_numSuitsStopped > 0) {
    int nCount = 0;
    strTemp = "  Sure Stoppers in: ";
    for (int i = 3; i >= 0; i--) {
      if (m_suit[i].IsSuitStopped()) {
        //				str1.Format("%s",SuitToString(i));
        str1.Format("%c", CCard::GetSuitLetter(i));
        strTemp += str1;
        nCount++;
        if (nCount < m_numSuitsStopped)
          strTemp += ", ";
      }
    }
    strTemp += "\n";
    strLine += strTemp;
  } else {
    //		strLine += "  Sure Stoppers: None\n";
    strLine += "  Sure Stoppers:\n";
  }
  //
  int nProbCount = m_numSuitsProbStopped - m_numSuitsStopped;
  if (nProbCount > 0) {
    int nCount = 0;
    strTemp = "  Probable Stoppers in: ";
    for (int i = 3; i >= 0; i--) {
      if ((m_suit[i].IsSuitProbablyStopped()) &&
        (!m_suit[i].IsSuitStopped())) {
        //				str1.Format("%s",SuitToString(i));
        str1.Format("%c", CCard::GetSuitLetter(i));
        strTemp += str1;
        nCount++;
        if (nCount < nProbCount)
          strTemp += ", ";
      }
    }
    strTemp += "\n";
    strLine += strTemp;
  } else {
    //		strLine += "  Probable Stoppers: None\n";
    strLine += "  Probable Stoppers in:\n";
  }
  //
  strTemp.Format("  %d Likely Winners (%d/%d/%d/%d)\n  %d Likely Losers (%d/%d/%d/%d)\n",
    m_numLikelyWinners,
    m_suit[3].GetNumLikelyWinners(),
    m_suit[2].GetNumLikelyWinners(),
    m_suit[1].GetNumLikelyWinners(),
    m_suit[0].GetNumLikelyWinners(),
    m_numLikelyLosers,
    m_suit[3].GetNumLikelyLosers(),
    m_suit[2].GetNumLikelyLosers(),
    m_suit[1].GetNumLikelyLosers(),
    m_suit[0].GetNumLikelyLosers());
  strLine += strTemp;
  //
  // check suit openability
  //
  if (app_->GetCurrentConventionSet()->IsConventionEnabled(tid5CardMajors)) {
    strTemp.Format("Playing five-card majors, ");
    strLine += strTemp;
    if ((m_suit[HEARTS].GetNumCards() >= 5) && (m_suit[SPADES].GetNumCards() >= 5)) {
      // both major suits have 5+ cards
      strLine += "both majors qualify for opening.\n";
    } else if (m_suit[HEARTS].GetNumCards() >= 5) {
      // only hearts has 5+ cards
      strLine += "Hearts can be opened.\n";
    } else if (m_suit[SPADES].GetNumCards() >= 5) {
      // only spades has 5+ cards
      strLine += "Spades can be opened.\n";
    } else {
      strLine += "neither major suit qualifies for opening.\n";
    }
  }
  //
  if (m_numAbsoluteSuits > 0) {
    if (m_numAbsoluteSuits == 1) {
      strTemp.Format("Have a powerful suit in %s.",
        CCard::SuitToString(m_nAbsoluteSuitList[0]));
    } else {
      strTemp = "Have powerful suits in ";
      for (int i = 0; i < m_numAbsoluteSuits; i++) {
        strTemp += CCard::SuitToString(m_nAbsoluteSuitList[i]);
        if (i < m_numAbsoluteSuits - 1)
          strTemp += ", ";
      }
    }
    strLine += strTemp;
    strLine += "\n";
  }

  // see if there are strong suits that are not absolute suits, 
  // and if so, list them
  int nStrongCount = 0;
  int nStrong[5];
  for (int i = 0; i < m_numStrongSuits; i++) {
    if (!m_suit[m_nStrongSuitList[i]].IsAbsolute()) {
      nStrongCount++;
      nStrong[i] = m_nStrongSuitList[i];
    }
  }
  //
  if (nStrongCount > 0) {
    if (nStrongCount == 1) {
      strTemp.Format("Have a strong suit in %s.", CCard::SuitToString(nStrong[0]));
    } else {
      strTemp = "Have strong suits in ";
      for (int i = 0; i < nStrongCount; i++) {
        strTemp += CCard::SuitToString(nStrong[i]);
        if (i < nStrongCount - 1)
          strTemp += ", ";
      }
    }
    strLine += strTemp;
    strLine += "\n";
  }
  //
  if (m_numPreferredSuits == 1) {
    strTemp.Format("Preferred suit is %s.", CCard::SuitToString(m_nPreferredSuitList[0]));
  } else {
    // more than one preferred suit
    strTemp = "Preferred suits are  ";
    for (int i = 0; i < m_numPreferredSuits; i++) {
      strTemp += CCard::SuitToString(m_nPreferredSuitList[i]);
      if (i < m_numPreferredSuits - 1)
        strTemp += ", ";
    }
    strTemp += "\n";
    strLine += strTemp;
    strTemp.Format("The best suit is %s.", CCard::SuitToString(m_nPreferredSuit));
  }
  strLine += strTemp;
  strLine += "\n====================\n";
  //
  //
  status << strLine;
}





//
//----------------------------------------------------------
//
// ReevaluateHoldings()
//
// called after one a cards has been played
//
void CHandHoldings::ReevaluateHoldings(const CCard* pCard) {
  if (pCard) {
    // reevaluate the specified suit
    m_suit[pCard->GetSuit()].ReevaluateHoldings(pCard);
  } else {
    // reevaluate all suits
    for (int i = 0; i < 4; i++)
      m_suit[i].ReevaluateHoldings(pCard);
  }

  // count the cards 
  CountCards();

  // then re-rank suits by general preference
  m_nPreferredSuit = RankSuits(4, SP_LAST, CLUBS, DIAMONDS, HEARTS, SPADES, m_nSuitsByPreference);
  for (int i = 0; i < 4; i++)
    m_suit[m_nSuitsByPreference[i]].SetRank(i);

  // then sort the suits by length
  for (int i = 0; i < 4; i++)
    m_nSuitsByLength[i] = 3 - i;	// init, high suit to low suit
  // 
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 3; j++) {
      // move the suit back if it's shorter
      if (m_suit[m_nSuitsByLength[j]].GetLength() < m_suit[m_nSuitsByLength[j + 1]].GetLength()) {
        // swap suits and move this one back
        int nTemp = m_nSuitsByLength[j];
        m_nSuitsByLength[j] = m_nSuitsByLength[j + 1];
        m_nSuitsByLength[j + 1] = nTemp;
      }
    }
  }
  m_nLongestSuit = m_nSuitsByLength[0];

  //
  // and finally adjust the winners count
  //
  m_numWinners = 0;
  m_numLikelyWinners = 0;
  m_numTopCards = 0;
  for (int i = 0; i < 4; i++) {
    m_numWinners += m_suit[i].GetNumWinners();
    m_numLikelyWinners += m_suit[i].GetNumLikelyWinners();
    m_numTopCards += m_suit[i].GetNumTopCards();
  }
  m_numLosers = m_numCards - m_numWinners;
  m_numLikelyLosers = m_numCards - m_numLikelyWinners;
}





//
// RestoreInitialHand()
//
// restores the hand that was dealt, before play began
//
void CHandHoldings::RestoreInitialHand() {
  // clear existing cards
  CCardHoldings::Clear();
  m_displayHand.Clear();
  for (int i = 0; i < 4; i++)
    m_suit[i].Clear();

  // and restore the original ones
  for (int i = 0; i < m_initialHand.GetNumCards(); i++)
    Add(m_initialHand[i]);

  // then re-initialize
  InitNewHand();
}




//
// RevalueHand()
//
// revalues a hand's points with respect to a trump suit
//
// nOrigin: 0 = player, 1=dummy
// nSuit = trump suit
//
double CHandHoldings::RevalueHand(int nMode, int nTrumpSuit, BOOL bTrace, BOOL bForceRevalue) {
  int nShortPts = 0;
  int nBonusPts = 0;
  CString strMessage, strTemp;
  CPlayerStatusDialog& status = *m_pStatusDlg;

  // start with old count
  double fAdjPts = m_numTotalPoints;
  int i, numLongSuits = 0;
  int nLongSuit[3];

  //
  if (nTrumpSuit == NOTRUMP)
    return m_numHCPoints;

  // see if the hand has already been revalued
  if (m_bRevaluedForSuit[nTrumpSuit] && !bForceRevalue)
    return m_numAdjustedPoints;
  else
    m_bRevaluedForSuit[nTrumpSuit] = TRUE;

  //
  // first perform basic revaluation
  //
  strMessage.Format("3REVAL1: Revaluing hand as %s...\n", ((nMode & REVALUE_DECLARER) ? "declarer" : "dummy"));

  // boost points for trumps and any solid side suits
  m_numLongPoints = 0;
  int nMinTrumpLength;
  if (nMode & REVALUE_DECLARER)
    nMinTrumpLength = app_->GetCurrentConventionSet()->IsConventionEnabled(tid5CardMajors) ? 5 : 4;
  else
    nMinTrumpLength = app_->GetCurrentConventionSet()->IsConventionEnabled(tid5CardMajors) ? 3 : 4;
  int numTrumps = m_suit[nTrumpSuit].GetLength();
  //
  for (i = 0; i < 4; i++) {
    // check the suit
    if (i == nTrumpSuit) {
      // trump suit -- add length pts for a long suit
      int nExtra = numTrumps - nMinTrumpLength;
      if (nExtra >= 2) {
        // 2 or more than necessary? add 1 pt for 1st, 2 pts each extra
        m_numLongPoints += 1 + (nExtra - 1) * 2;
      } else if (nExtra == 1) {
        // 1 more than necessary? add 2 pts
        m_numLongPoints += 1;
      } else if (nExtra < 0) {
        // oops, fewer than required trumps -- deduct 2 pts for each
        if (!(nMode & REVALUE_NOPENALTY_SHORTTRUMP))
          m_numLongPoints -= (-nExtra) * 2;
      }

      //
      if (m_numLongPoints > 0)
        strTemp.Format("3REVAL5: Adding %.0f point(s) for the %d extra trump(s).\n", m_numLongPoints, nExtra);
      else if (m_numLongPoints < 0)
        strTemp.Format("3REVAL6: Deducting %.0f point(s) for the %d trump(s) short of %d.\n", -m_numLongPoints, -nExtra, nMinTrumpLength);
      else
        strTemp = "";
      strMessage += strTemp;
    } else if (IsSuitSolid(i)) {
      // non-trump but solid suits -- 1 pt for a card over 4, plus 2 pts for each add'l
      nLongSuit[numLongSuits] = i;
      numLongSuits++;
      int nSolidPts = 0;
      //
      if (m_suit[i].GetLength() >= 6)
        nSolidPts = (m_suit[i].GetLength() - 5) * 2 + 1;
      else if (m_suit[i].GetLength() == 5)
        nSolidPts = 1;
      //
      strTemp.Format("3REVAL7: Adding %d point(s) for the solid %s suit.\n", nSolidPts, CCard::SuitToSingularString(i));
      strMessage += strTemp;
      m_numLongPoints += nSolidPts;
    }
  }

  // also remove any penalty points in the trump suit
  // so need to recalc total penalty
  m_numPenaltyPoints = 0;
  for (i = 0; i < 4; i++) {
    if (i != nTrumpSuit)
      m_numPenaltyPoints += m_suit[i].GetPenaltyPoints();
  }

  // now perform more specific processing for declarer and dummy
  if (nMode & REVALUE_DECLARER) {
    // we're declarer; so deduct points if we have poor trump honors 
    // i.e., if the suit is topped by less than a King
    if (numTrumps > 0)	// should always be true!
    {
      if (m_suit[nTrumpSuit].GetAt(0)->GetFaceValue() < KING)
        nBonusPts -= (KING - m_suit[nTrumpSuit].GetAt(0)->GetFaceValue());
      //
      strTemp.Format("3REVAL8: Since the trump suit is only topped by a %s, deduct %d points.\n", m_suit[i].GetAt(0)->GetFaceName(), -nBonusPts);
      strMessage += strTemp;
    }

    // tally points and and store
//		fAdjPts = m_numHCPoints + m_numBonusPoints - m_numPenaltyPoints +
//				  nBonusPts + m_numShortPoints + m_numLongPoints;
    fAdjPts = m_numHCPoints + m_numBonusPoints - m_numPenaltyPoints +
      nBonusPts + m_numLongPoints;
    m_numAdjustedPoints = fAdjPts;

    // and comment if there's a change in pts
    if (fAdjPts > m_numTotalPoints) {
      // long trumps?
      if ((nTrumpSuit > NONE) && (numTrumps > nMinTrumpLength)) {
        strMessage.Format("2REVAL10: (with a %d-card trump suit in %s,", numTrumps, CCard::SuitToString(nTrumpSuit));
        // with long side suits?
        if (numLongSuits == 1) {
          strTemp.Format(" plus a solid %d-card second suit in %s,",
            m_suit[nLongSuit[0]].GetLength(), CCard::SuitToString(nLongSuit[0]));
          strMessage += strTemp;
        } else if (numLongSuits > 1) {
          strMessage += " plus long outside suits in ";
          for (i = 0; i < numLongSuits; i++) {
            strMessage += CCard::GetSuitName(nLongSuit[i]);
            if (i < numLongSuits - 1)
              strMessage += " and ";
            else
              strMessage += ", ";
          }
        }
      } else if (numLongSuits == 1) {
        // trumps aren't long, but do we have a long side suit?
        strTemp.Format("2REVAL12: (with a solid %d-card second suit in %s,",
          m_suit[nLongSuit[0]].GetLength(), CCard::SuitToString(nLongSuit[0]));
        strMessage += strTemp;
      } else if (numLongSuits > 1) {
        // or multiple side suits?
        strMessage = "2REVAL14: (with long outside suits in ";
        for (i = 0; i < numLongSuits; i++) {
          strMessage += CCard::GetSuitName(nLongSuit[i]);
          if (i < numLongSuits - 1)
            strMessage += " and ";
          else
            strMessage += ", ";
        }
      } else {
        strMessage += "2REVAL16: (after re-evaluation for distribution,";
      }

      //
      strTemp.Format(" declarer's hand is revalued for a suit contract from %.1f %sto %.1f points)\n",
        m_numTotalPoints, ((fAdjPts < m_numTotalPoints) ? "down " : ""), fAdjPts);
      strMessage += strTemp;
    } else if (fAdjPts < m_numTotalPoints) {
      strTemp.Format("2REVAL18: Declarer's hand is revalued for a suit contract from %.1f %sto %.1f points)\n",
        m_numTotalPoints, ((fAdjPts < m_numTotalPoints) ? "down " : ""), fAdjPts);
      strMessage += strTemp;
    }
    //
    if (bTrace)
      status << strMessage;
    m_numAdjustedPoints = fAdjPts;
    return fAdjPts;

  } else {
    // here we are dummy; boost points for specific support holdings
    // but need 3 or 4 trumps before we can count any bonuses
//		if ( (numTrumps >= 4) || ((numTrumps == 3) && (ISMAJOR(nTrumpSuit))) ) 
    if (numTrumps >= nMinTrumpLength) {
      // add bonus for voids, singletons, & doubletons
      if (numTrumps >= 4) {
        // w/ 4+ trumps, void = 5 pts, singleton = 3, & dbouleton = 1
        nShortPts = (m_numVoids * 5) + (m_numSingletons * 3) + (m_numDoubletons * 1);
      } else if (numTrumps == 3) {
        // with only 3 trumps, bonus schedule is 3/2/1
        nShortPts = (m_numVoids * 3) + (m_numSingletons * 2) + (m_numDoubletons * 1);
      }

      // add 1 pt for holding an honor in the trump suit
      if (m_suit[nTrumpSuit].GetHCPoints() > 0)
        nBonusPts++;

      // and tally and store
      fAdjPts = m_numHCPoints + m_numBonusPoints - m_numPenaltyPoints +
        nBonusPts + nShortPts + m_numLongPoints;
      m_numAdjustedPoints = fAdjPts;

      // and comment if there's a change in pts
      if (fAdjPts > m_numTotalPoints) {
        strMessage.Format("2REVAL38! (with %d-card %s trump support", numTrumps, CCard::SuitToSingularString(nTrumpSuit));
        if (m_suit[nTrumpSuit].GetHCPoints() > 0)
          strMessage += " including a trump honor";

        // mark doubletons
        if (m_numDoubletons > 0) {
          if (m_numDoubletons > 1) {
            strMessage += " & doubletons in ";
            for (int i = 0; i < m_numDoubletons; i++) {
              strMessage += CCard::SuitToString(m_nDoubletonSuits[i]);
              if (i < m_numDoubletons - 1)
                strMessage += " and ";
            }
          } else {
            strTemp.Format(" & a doubleton in %s",
              CCard::SuitToString(m_nDoubletonSuits[0]));
            strMessage += strTemp;
          }
          if ((m_numSingletons > 0) || (m_numVoids > 0))
            strMessage += ", ";
        }

        // mark singletons
        if (m_numSingletons > 0) {
          if (m_numSingletons > 1) {
            strMessage += " & singletons in ";
            for (i = 0; i < m_numSingletons; i++) {
              strMessage += CCard::SuitToString(m_nSingletonSuits[i]);
              if (i < m_numSingletons - 1)
                strMessage += " and ";
            }
          } else {
            strTemp.Format(" & a singleton in %s", CCard::SuitToString(m_nSingletonSuits[0]));
            strMessage += strTemp;
          }
          if (m_numVoids > 0)
            strMessage += ", ";
        }

        // mark voids
        if (m_numVoids > 0) {
          if (m_numVoids > 1) {
            strMessage += " & voids in ";
            for (i = 0; i < m_numVoids; i++) {
              strMessage += CCard::SuitToString(m_nVoidSuits[i]);
              if (i < m_numVoids - 1)
                strMessage += " and ";
            }
          } else {
            strTemp.Format(" & a void in %s", CCard::SuitToString(m_nVoidSuits[0]));
            strMessage += strTemp;
          }
        }
        //
        strTemp.Format(", the hand is revalued for a suit contract as dummy from %.1f %sto %.1f points)\n",
          m_numTotalPoints, ((fAdjPts < m_numTotalPoints) ? "down " : ""), fAdjPts);
        strMessage += strTemp;
      }
    } else if (fAdjPts < m_numTotalPoints) {
      strTemp.Format("2REVAL40: Dummy's hand is revalued for a suit contract from %.1f %sto %.1f points)\n",
        m_numTotalPoints, ((fAdjPts < m_numTotalPoints) ? "down " : ""), fAdjPts);
      strMessage += strTemp;
    }
    //
    if (bTrace)
      status << strMessage;
    m_numAdjustedPoints = fAdjPts;
    return fAdjPts;
  }

}





//
// RankSuits()
//
// compare up to 4 suits and select the best one
//
// nArbitrate: what to return if suits are equal
//   SP_NONE: return NONE
//   SP_FIRST: return first suit
//   SP_SECOND: return second suit
//   SP_THIRD: return third suit
//   SP_FOURTH: return fourth suit
//   SP_LAST: return last suit
// nOrder: array in which to place the suit order
//
int CHandHoldings::RankSuits(int numSuits, int nArbitrate, int nSuit1, int nSuit2,
  int nSuit3, int nSuit4, int* pOrder) {
  // first sort the suits by length
  int nSuit[4];
  int i, j, nTemp;
  nSuit[0] = nSuit1;
  nSuit[1] = nSuit2;
  nSuit[2] = nSuit3;
  nSuit[3] = nSuit4;
  //
  for (i = 0; i < numSuits; i++) {
    for (j = 0; j < numSuits - 1; j++) {
      if (m_suit[nSuit[j + 1]].GetLength() > m_suit[nSuit[j]].GetLength()) {
        nTemp = nSuit[j];
        nSuit[j] = nSuit[j + 1];
        nSuit[j + 1] = nTemp;
      }
    }
  }
  // and then by high cards
  // a suit must have at least as many cards & more HCPs
  // in order to be superior, OR
  // four HCPs per card that it's short.
  for (i = 0; i < numSuits; i++) {
    for (j = 0; j < numSuits - 1; j++) {
      int nLen1 = m_suit[nSuit[j]].GetLength();
      int nLen2 = m_suit[nSuit[j + 1]].GetLength();
      int nLD = nLen1 - nLen2;
      double fPts1 = m_suit[nSuit[j]].GetHCPoints();
      double fPts2 = m_suit[nSuit[j + 1]].GetHCPoints();
      // see if the second suit is superior
      if (((fPts2 > fPts1) && (nLen2 >= nLen1)) ||
        (fPts2 > fPts1 + nLD * 4)) {
        nTemp = nSuit[j];
        nSuit[j] = nSuit[j + 1];
        nSuit[j + 1] = nTemp;
      } else if (((fPts2 == fPts1) && (nLen2 == nLen1)) ||
        (fPts2 == fPts1 + nLD * 4)) {
        // suits identical; sort by suit order
        if (nSuit[j + 1] > nSuit[j]) {
          nTemp = nSuit[j];
          nSuit[j] = nSuit[j + 1];
          nSuit[j + 1] = nTemp;
        }
      }
    }
  }
  // done sorting; now copy	
  if (pOrder) {
    for (i = 0; i < numSuits; i++)
      pOrder[i] = nSuit[i];
    for (i = numSuits; i < 4; i++)
      pOrder[i] = NONE;
  }
  //
  return nSuit[0];
}



//
// AllSuitsStopped()
//
// determines whether all suits are stopped in the hand
//
BOOL CHandHoldings::AllSuitsStopped(BOOL bIncludeProbStoppers) const {
  //
  if (bIncludeProbStoppers) {
    if (m_numSuitsProbStopped < 4)
      return FALSE;
  } else {
    if (m_numSuitsStopped < 4)
      return FALSE;
  }
  //
  return TRUE;
}




//
// AllOtherSuitsStopped()
//
// determines whether all suits other than the ones given are
// stopped.
// useful when deciding whether to go for a NT contract
//
BOOL CHandHoldings::AllOtherSuitsStopped(int nSuit1, int nSuit2, int nSuit3, BOOL bIncludeProbStoppers) const {
  int numSuits = 0;

  //
  if (nSuit1 > NONE)
    numSuits++;
  if (nSuit2 > NONE)
    numSuits++;
  if (nSuit3 > NONE)
    numSuits++;

  //
  if (bIncludeProbStoppers) {
    if (m_numSuitsProbStopped < (4 - numSuits))
      return FALSE;
  } else {
    if (m_numSuitsStopped < (4 - numSuits))
      return FALSE;
  }

  //
  for (int i = 0; i < 4; i++) {
    if ((i == nSuit1) || (i == nSuit2) || (i == nSuit3))
      continue;
    if (bIncludeProbStoppers) {
      if (!m_suit[i].IsSuitProbablyStopped())
        return FALSE;
    } else {
      if (!m_suit[i].IsSuitStopped())
        return FALSE;
    }
  }
  //
  return TRUE;
}


// Balanced hand test
BOOL CHandHoldings::IsBalanced() const {
  // a hand is considered balanced if it has no voids, 
  // no singletons, and no more than one doubleton.
  // e.g., the following qualify:
  // 4/3/3/3, 4/4/3/2, and 5/3/3/2
  if ((m_nBalanceValue <= 2) && (m_numDoubletons <= 1))
    return TRUE;
  else
    return FALSE;
}


// Semi-balanced test
BOOL CHandHoldings::IsSemiBalanced() const {
  // the semi-balanced test is used to see if a hand can
  // support a NT contract opposite a balanced hand.
  // the basic rqmt is no voids, no more than one singleton,
  // and no 7-card suits.
  // e.g., the following qualify, although they are not truly
  // "balanced" in the strictest sense:
  // 6/4/2/1, 5/4/2/2, and 4/4/4/1
  if ((m_numSuitsOfAtLeast[7] == 0) &&
    (m_numVoids == 0) && (m_numSingletons <= 1))
    return TRUE;
  else
    return FALSE;
}


//
// GetLongestSuit()
//
int	CHandHoldings::GetLongestSuit(int nType) const {
  int i;
  switch (nType) {
    case SUIT_ANY:
      return m_nLongestSuit;

    case SUIT_MAJOR:
      for (i = 0; i < 4; i++)
        if (ISMAJOR(m_nSuitsByLength[i]))
          return i;
      break;

    case SUIT_MINOR:
      for (i = 0; i < 4; i++)
        if (ISMINOR(m_nSuitsByLength[i]))
          return i;
      break;
  }
  // should never get here!
  ASSERT(FALSE);
  return NONE;
}




//
// GetDiscard()
//
CCard* CHandHoldings::GetDiscard() {
  CSuitHoldings* pDiscardSuit = NULL;
  CCard* pCard;

  // determine the lead suit and the trump suit
  CCard* pLeadCard = app_->GetDeal()->GetCurrentTrickCardLed();
  ASSERT(pLeadCard);
  int nSuitLed = pLeadCard->GetSuit();
  int nTrumpSuit = app_->GetDeal()->GetTrumpSuit();

  // see if we have cards in the suit led
  CSuitHoldings& suit = m_suit[nSuitLed];
  if (suit.GetNumCards() > 0) {
    // we have no choice but to follow suit
    // so return the lowest card in the suit
    pCard = suit.GetBottomCard();
    return pCard;
  }

  // here we have no more cards in the suit, so discard from another suit
  // but first see whether we're playing with a trump suit (and have trumps left)
  if (ISSUIT(nTrumpSuit)) {
    // playing with a trump suit
    // see if we have any trumps left
    if (GetNumTrumps() > 0) {
      // yes indeed, we do have at least one trump left
      // so return the shortest suit with losers in it
      // first find the shortest suit with no winners, if there is one
      for (int i = 3; i >= 0; i--) {
        int nSuit = m_nSuitsByLength[i];
        // special code -- try to protect high honors, 
        // even if they're not sure winners
        if ((m_suit[nSuit].HasKing()) ||
          (m_suit[nSuit].HasQueen() && (m_suit[nSuit].GetNumCards() >= 2)))
          continue;
        // else discard from the suit if it has no winners
        if ((nSuit != nTrumpSuit) &&
          (GetNumCardsInSuit(nSuit) > 0) &&
          (GetNumWinnersInSuit(nSuit) == 0)) {
          pDiscardSuit = &m_suit[nSuit];
          break;
        }
      }

      // see if we found one
      if (pDiscardSuit == NULL) {
        // here, each of the remaining suits has at least one winner, 
        // or else have no cards in them
        // so just pick the shortest non-void, non-trump suit that has 
        // at least one loser in it
        for (int i = 3; i >= 0; i--) {
          int nSuit = m_nSuitsByLength[i];
          int nSuitLength = GetNumCardsInSuit(nSuit);
          int numLosers = GetNumLosersInSuit(nSuit);
          if ((nSuitLength > 0) && (numLosers > 0) && (nSuit != nTrumpSuit)) {
            pDiscardSuit = &m_suit[nSuit];
            break;
          }
        }
      }

      // see if we still failed to find a suit
      if (pDiscardSuit == NULL) {
        // no suit found -- meaning that there are no suits with losers,
        // or that the only suit left is the trump suit
        if (GetNumCards() == (GetNumCardsInSuit(nTrumpSuit))) {
          // no cards outside the trump suit? then we have no
          // choice -- "discard" a trump
          pDiscardSuit = &m_suit[nTrumpSuit];
        } else {
          // all suits have only winners, so pick the shortest non-trump suit
          for (int i = 3; i >= 0; i--) {
            int nSuit = m_nSuitsByLength[i];
            if ((m_suit[nSuit].GetNumCards() > 0) && (nSuit != nTrumpSuit)) {
              pDiscardSuit = &m_suit[nSuit];
              break;
            }
          }
        }
      }

      // return the bottom card of the discard suit
      pCard = pDiscardSuit->GetBottomCard();

    } else {
      // here, we're out of trumps
      // so just return the bottom card of the worst suit
      int nSuit;
      for (int i = 3; i >= 0; i--) {
        nSuit = m_nSuitsByPreference[i];
        // avoid letting go of winners!
        if ((m_suit[nSuit].GetNumCards() > 0) && (m_suit[nSuit].GetNumCards() > m_suit[nSuit].GetNumWinners())) {
          pDiscardSuit = &m_suit[nSuit];
          break;
        }

      }
      // if we failed above, try again
      if (pDiscardSuit == NULL) {
        for (int i = 3; i >= 0; i--) {
          nSuit = m_nSuitsByPreference[i];
          if (m_suit[nSuit].GetNumCards() > 0) {
            pDiscardSuit = &m_suit[nSuit];
            break;
          }

        }
      }
      //
      pCard = pDiscardSuit->GetBottomCard();
    }
  } else {
    // playing no trumps
    // generally return the bottom card of the longest suit
    int nSuit = m_nSuitsByLength[0];
    // this is a horrible, horrible way of getting the priority information
    int nPrioritySuit = m_pPlayer->GetPlayEngine()->GetPrioritySuit();
    int nPartnersPrioritySuit = m_pPlayer->GetPlayEngine()->GetPartnersPrioritySuit();
    // see if this is the priority suit, or the suit has zero losers
    if ((ISSUIT(nSuit) && ((nSuit == nPrioritySuit) || (nSuit == nPartnersPrioritySuit))) ||
      (m_suit[nSuit].GetNumLosers() == 0)) {
      // don't discard from this suit if possible;
      // try the other suits in descending length
      int i = 1;
      for (i = 1; i < 4; i++) {
        // in order of descending length, find a suit that has losers
        nSuit = m_nSuitsByLength[i];
        if (!ISSUIT(nSuit))
          break;		// no more non-void suits
        if (m_suit[nSuit].GetNumLosers() > 0)
          break;	   // found one
      }
      // if no other suits were found to discard from, return to the first one
      if (!ISSUIT(nSuit) || (i == 4))
        nSuit = m_nSuitsByLength[0];
    }
    // return the bottom card of the suit to discard
    pDiscardSuit = &m_suit[nSuit];
    pCard = pDiscardSuit->GetBottomCard();
  }

  // verify the selected card is OK
  ASSERT(pCard->IsValid());
  ASSERT(HasCard(pCard));
  return pCard;
}




//
int CHandHoldings::GetNumTrumps() const {
  int nTrumpSuit = app_->GetDeal()->GetTrumpSuit();
  if (!ISSUIT(nTrumpSuit))
    return 0;
  //
  return GetNumCardsInSuit(nTrumpSuit);
}
