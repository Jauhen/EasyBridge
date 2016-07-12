#include "stdafx.h"
#include "model/deal.h"
#include "engine/CARD.h"
#include "engine/Deck.h"
#include "model/GameRecord.h"
#include "engine/Player.h"
#include "engine/play/CardHoldings.h"
#include "engine/play/HandHoldings.h"

#include "MyException.h"
#include "dialogs/roundfinisheddialog.h"

BOOL Deal::m_bInitialized = FALSE;

Deal::Deal(std::shared_ptr<AppInterface> app) : app_(app) {
  //
  m_strFileProgTitle = app_->GetProgramTitle();
  m_nFileProgMajorVersion = app_->GetProgramMajorVersion();
  m_nFileProgMinorVersion = app_->GetProgramMinorVersion();
  m_nFileProgIncrementVersion = app_->GetProgramIncrementVersion();
  m_nFileProgBuildNumber = app_->GetProgramBuildNumber();
  m_strFileProgBuildDate = app_->GetProgramBuildDate();
  m_strFileDate = "??/??/??";

  //
  ClearFileParameters();
  //
  m_bSuppressBidHistoryUpdate = FALSE;
  m_bSuppressPlayHistoryUpdate = FALSE;
  m_bHandsDealt = FALSE;
  m_nDealer = NONE;
  m_nCurrPlayer = NULL;
  for (int i = 0; i < 4; i++) {
    m_bSavePlayerAnalysis[i] = FALSE;
  }
  m_bSaveIntermediatePositions = app_->IsSaveIntermediatePositions();

  // create the players
  for (int i = 0; i < 4; i++)
    m_pPlayer[i] = new CPlayer(app);

  // and init each player's info
  for (int i = 0; i < 4; i++) {
    CPlayer* pLHOpponent = m_pPlayer[(i + 1) % 4];
    CPlayer* pPartner = m_pPlayer[(i + 2) % 4];
    CPlayer* pRHOpponent = m_pPlayer[(i + 3) % 4];
    m_pPlayer[i]->InitializePlayer((Position)i, pPartner, pLHOpponent, pRHOpponent);
  }

  // init the players' engines (must do this after the above inits!!!)
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->InitializeEngines();

  // clear out some info
  ClearAllInfo();

  // and read in stuff from the .INI file
  Initialize();
}

Deal::~Deal() {
  //
  Terminate();

  // clean up memory
  for (int i = 0; i < 4; i++)
    delete m_pPlayer[i];
  //
  m_bInitialized = FALSE;
}


//
// Read in some values from the INI file
//

//
void Deal::Initialize() {
}


//
void Deal::Terminate() {
}


//
// InitNewGame()
//
// called at the start of a new game
//
void Deal::InitNewGame() {
  int i, j;
  // clear game record
  for (i = 0; i < 13; i++) {
    for (j = 0; j < 4; j++)
      m_pGameTrick[i][j] = NULL;
  }
  //
  m_bHandsDealt = FALSE;
}


//
void Deal::PrepForNewDeal() {
  // cancel review mode
  if (m_bReviewingGame)
    app_->EndGameReview();
  m_bReviewingGame = FALSE;
  m_bGameReviewAvailable = FALSE;

  // turn off game auto-play
  if (app_->IsFullAutoPlayMode() || app_->IsFullAutoExpressPlayMode()) {
    app_->SetNormalPlayMode();
    m_bExpressPlayMode = FALSE;
    m_bAutoReplayMode = FALSE;
  }

  // init a new document ONLY if a rubber is not in progress
  // else it's still the same "Document"
  if (!app_->IsRubberInProgress())
    app_->OnNewDocument();

  // and update status display
  app_->UpdateStatusWindow();
}


//
void Deal::RestartCurrentHand(BOOL bUpdateView) {
  if (!app_->IsGameInProgress())
    return;

  // replay the hands
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RestartPlay();

  // clear play info
  ClearPlayInfo();

  // and reset play info
  m_nRoundLead = m_nGameLead;
  m_nCurrPlayer = m_nRoundLead;
  m_nTrickLead[0] = m_nRoundLead;
  m_bExposeDummy = FALSE;
  m_pLastPlayHint = NULL;

  // need to set the dummy again cuz it got cleared
  m_pPlayer[m_nDummy]->SetDummyFlag(TRUE);

  // always expose south's hand
  m_pPlayer[SOUTH]->ExposeCards(TRUE, FALSE);

  // and expose north as well if north is declaring
  if (m_nDeclarer == NORTH)
    m_pPlayer[NORTH]->ExposeCards(TRUE, FALSE);

  // reset auto play if enabled
  if (app_->IsFullAutoPlayMode() || app_->IsFullAutoExpressPlayMode()) {
    app_->SetNormalPlayMode();
    m_bExpressPlayMode = FALSE;
    //		m_bAutoReplayMode = FALSE;
  }

  // and update the view
  if (bUpdateView) {
    app_->RestartPlay();
  }
}






// 
// InitializeVulnerability()
//
void Deal::InitializeVulnerability() {
  // if playing in practice mode with duplicate scoring, randomize vulnerability
  if (!app_->IsRubberInProgress() && app_->IsUsingDuplicateScoring())
    m_nVulnerableTeam = (Team)(GetRandomValue(3) - 1);
  //
  if ((m_nVulnerableTeam == NORTH_SOUTH) || (m_nVulnerableTeam == BOTH))
    m_bVulnerable[NORTH_SOUTH] = TRUE;
  if ((m_nVulnerableTeam == EAST_WEST) || (m_nVulnerableTeam == BOTH))
    m_bVulnerable[EAST_WEST] = TRUE;
}



//
// ClearPlayInfo()
//
// clears the play information
//
void Deal::ClearPlayInfo() {
  m_numTricksPlayed = 0;
  m_numActualTricksPlayed = 0;
  m_numCardsPlayedInRound = 0;
  m_numCardsPlayedInGame = 0;
  for (int i = 0; i < 4; i++)
    m_pCurrTrick[i] = NULL;
  //
  m_nSuitLed = NONE;
  m_nHighVal = 0;
  m_nHighTrumpVal = 0;
  m_pHighCard = NULL;
  m_nHighPos = NONE;
  //	m_nPlayRound = 0;
  m_nRoundWinner = NONE;
  m_nRoundWinningTeam = NEITHER;
  m_numTricksWon[0] = 0;
  m_numTricksWon[1] = 0;
  m_bExposeDummy = FALSE;
  if (ISPLAYER(m_nDummy) && (m_nDummy != SOUTH))
    m_pPlayer[m_nDummy]->ExposeCards(FALSE, FALSE);

  //
  m_nLastBiddingHint = NONE;
  m_pLastPlayHint = NULL;
  m_bHintMode = FALSE;
  m_bHintFollowed = TRUE;

  // clear play record
  for (int i = 0; i < 13; i++) {
    m_nTrickLead[i] = NONE;
    m_nTrickWinner[i] = NONE;
  }
  for (int i = 0; i < 52; i++)
    m_nPlayRecord[i] = -1;

  // clear GIB Monitor && play history
  if (app_->IsMainFrameExists()) {
    app_->SetGIBMonitorText(NULL);
    UpdatePlayHistory();
  }
}





//
// UpdateScore()
//
void Deal::UpdateScore() {
  // calculate the game score
  int numTricksMade = m_numTricksWon[m_nContractTeam];
  int nContractLevel = BID_LEVEL(m_nContract);
  int numRequiredTricks = nContractLevel + 6;
  int numTrickPoints = 0;
  int numBonusPoints = 0;
  int numOvertrickPoints = 0;
  BOOL bVulnerable = m_bVulnerable[m_nContractTeam];
  BOOL bDoubled = m_bDoubled;
  BOOL bRedoubled = m_bRedoubled;
  CString strTrickPoints, strBonusPoints;

  // first check trick points & overtrick points
  if (numTricksMade >= numRequiredTricks) {
    int numOvertricks = numTricksMade - numRequiredTricks;
    if (numOvertricks < 0)
      numOvertricks = 0;
    switch (m_nContractSuit) {
    case CLUBS:  case DIAMONDS:
      numTrickPoints = nContractLevel * 20;
      numOvertrickPoints = numOvertricks * 20;
      break;

    case HEARTS: case SPADES:
      numTrickPoints = nContractLevel * 30;
      numOvertrickPoints = numOvertricks * 30;
      break;

    case NOTRUMP:
      numTrickPoints = 40 + (nContractLevel - 1) * 30;
      numOvertrickPoints = numOvertricks * 30;
      break;
    }

    // adjust for doubling/redoubling
    if (bDoubled)
      numTrickPoints *= 2;
    else if (bRedoubled)
      numTrickPoints *= 4;

    // record trick points
    m_nGameScore[m_nCurrGame][m_nContractTeam] += numTrickPoints;
    strTrickPoints.Format("%s%4d%s\t%s%s made",
      ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
      numTrickPoints,
      ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""),
      ContractToFullString(m_nContract, m_nContractModifier),
      (bDoubled ? " doubled" : bRedoubled ? " redoubled" : ""));
    // and save
    m_strArrayTrickPointsRecord.push_back(strTrickPoints);

    // record doubled contract bonus, if appropriate
    if (bDoubled) {
      // record doubled contract bonus of 50 points
      numBonusPoints = 50;
      m_nBonusScore[m_nContractTeam] += numBonusPoints;
      strBonusPoints.Format("%s%4d%s\tDoubled contract",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numBonusPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""));
      // and save
      m_strArrayBonusPointsRecord.push_back(strBonusPoints);
    } else if (bRedoubled) {
      // record re-doubled contract bonus of 100 points
      numBonusPoints = 100;
      m_nBonusScore[m_nContractTeam] += numBonusPoints;
      strBonusPoints.Format("%s%4d%s\tRedoubled contract",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numBonusPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""));
      // and save
      m_strArrayBonusPointsRecord.push_back(strBonusPoints);
    }

    // record overtricks bonus, if any
    if (numOvertricks > 0) {
      // adjust overtrick points if doubled/redoubled
      if (bDoubled) {
        if (!bVulnerable)
          numOvertrickPoints = numOvertricks * 100;	// 100 pts/overtrick
        else
          numOvertrickPoints = numOvertricks * 200;
      } else if (bRedoubled) {
        if (!bVulnerable)
          numOvertrickPoints = numOvertricks * 200;
        else
          numOvertrickPoints = numOvertricks * 400;
      }
      m_nBonusScore[m_nContractTeam] += numOvertrickPoints;
      strBonusPoints.Format("%s%4d%s\t%1d overtrick%s%s%s",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numOvertrickPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""),
        numOvertricks,
        ((numOvertricks > 1) ? "s" : ""),
        (bVulnerable ? ", vulnerable" : ""),
        (bDoubled ? ", doubled" : bRedoubled ? ", redoubled" : ""));
      // and save
      m_strArrayBonusPointsRecord.push_back(strBonusPoints);
    }

    // check for a slam bonus
    if (nContractLevel >= 6) {
      if (nContractLevel == 6) {
        if (!bVulnerable)
          numBonusPoints = 500;
        else
          numBonusPoints = 750;
      } else {
        if (!bVulnerable)
          numBonusPoints = 1000;
        else
          numBonusPoints = 1500;
      }
      m_nBonusScore[m_nContractTeam] += numBonusPoints;
      strBonusPoints.Format("%s%4d%s\t%s slam contract%s",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numBonusPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""),
        ((nContractLevel == 6) ? "Small" : "Grand"),
        (bVulnerable ? ", vulnerable" : ""));
      // and save
      m_strArrayBonusPointsRecord.push_back(strBonusPoints);
    }

  } else {
    // ouch -- check undertrick points
    int numUndertricks = numRequiredTricks - numTricksMade;
    int numUndertrickPoints = 0;
    int nFirst = 1;								// first undertrick
    int nSecondAndThird = numUndertricks - 1;	// 2nd & third undertricks
    if (nSecondAndThird < 0)
      nSecondAndThird = 0;
    if (nSecondAndThird > 2)
      nSecondAndThird = 2;
    int nAdditional = numUndertricks - 3;		// undertricks beyond 3
    if (nAdditional < 0)
      nAdditional = 0;
    int nBeyondOne = numUndertricks - 1;
    if (nBeyondOne < 0)
      nBeyondOne = 0;
    //
    if (bDoubled) {
      // doubled contract
      if (!bVulnerable)
        numUndertrickPoints = (nFirst * 100) + (nSecondAndThird * 200) + (nAdditional * 300);
      else
        numUndertrickPoints = (nFirst * 200) + (nBeyondOne * 300);
    } else if (bRedoubled) {
      // redoubled contract
      if (!bVulnerable)
        numUndertrickPoints = (nFirst * 200) + (nSecondAndThird * 400) + (nAdditional * 600);
      else
        numUndertrickPoints = (nFirst * 400) + (nBeyondOne * 600);
    } else {
      // neither doubled or redoubled
      if (!bVulnerable)
        numUndertrickPoints = numUndertricks * 50;
      else
        numUndertrickPoints = numUndertricks * 100;
    }
    //
    numBonusPoints += numUndertrickPoints;
    m_nBonusScore[m_nDefendingTeam] += numBonusPoints;
    strBonusPoints.Format("%s%4d%s\tBonus for defeating %scontract by %d trick%s",
      ((m_nDefendingTeam == NORTH_SOUTH) ? "" : "\t"),
      numUndertrickPoints,
      ((m_nDefendingTeam == NORTH_SOUTH) ? "\t" : ""),
      (bVulnerable ? "vulnerable " : ""),
      numUndertricks,
      ((numUndertricks > 1) ? "s" : ""));
    // and save
    m_strArrayBonusPointsRecord.push_back(strBonusPoints);
  }

  // check for honors bonuses
  if (app_->IsScoreHonorsBonuses()) {
    if (ISSUIT(m_nTrumpSuit)) {
      // check to see if a player had 4 or 5 trump honors
      for (int i = 0; i < 4; i++) {
        int numHonors = 0;
        CCardHoldings& origHand = m_pPlayer[i]->GetHand().GetInitialHand();
        for (int j = TEN; j <= ACE; j++)
          if (origHand.HasCard(MAKEDECKVALUE(m_nTrumpSuit, j)))
            numHonors++;
        //
        if (numHonors == 5) {
          int nTeam = GetPlayerTeam(i);
          m_nBonusScore[nTeam] += 150;
          strBonusPoints.Format("%s150%s\tHonors bonus for holding 5 trump honors",
            ((nTeam == NORTH_SOUTH) ? "" : "\t"),
            ((nTeam == NORTH_SOUTH) ? "\t" : ""));
          m_strArrayBonusPointsRecord.push_back(strBonusPoints);
          break;
        } else if (numHonors == 4) {
          int nTeam = GetPlayerTeam(i);
          m_nBonusScore[nTeam] += 100;
          strBonusPoints.Format("%s100%s\tHonors bonus for holding 4 trump honors",
            ((nTeam == NORTH_SOUTH) ? "" : "\t"),
            ((nTeam == NORTH_SOUTH) ? "\t" : ""));
          m_strArrayBonusPointsRecord.push_back(strBonusPoints);
          break;
        }
      }
    } else {
      // check if a player had all four Aces
      for (int i = 0; i < 4; i++) {
        int numAces = 0;
        CCardHoldings& origHand = m_pPlayer[i]->GetHand().GetInitialHand();
        for (int j = CLUBS; j <= SPADES; j++)
          if (origHand.HasCard(MAKEDECKVALUE(j, ACE)))
            numAces++;
        //
        if (numAces == 4) {
          int nTeam = GetPlayerTeam(i);
          m_nBonusScore[nTeam] += 150;
          strBonusPoints.Format("%s150%s\tHonors bonus for holding all 4 Aces in NT contract",
            ((nTeam == NORTH_SOUTH) ? "" : "\t"),
            ((nTeam == NORTH_SOUTH) ? "\t" : ""));
          m_strArrayBonusPointsRecord.push_back(strBonusPoints);
          break;
        }
      }
    }
  }

  // now see if a game has been won
  if (m_nGameScore[m_nCurrGame][m_nContractTeam] >= 100) {
    // if so, update and draw a line underneath
    m_numGamesWon[m_nContractTeam]++;
    m_strArrayTrickPointsRecord.push_back("----------------------------------------------------------------------------------------------------------------");

    // update other game variables here
    m_nCurrGame++;
    m_bVulnerable[m_nContractTeam] = TRUE;
    if (m_nVulnerableTeam == NONE)
      m_nVulnerableTeam = (Team)m_nContractTeam;
    else
      m_nVulnerableTeam = (Team)BOTH;

    // then see if the rubber has been won
    if (m_numGamesWon[m_nContractTeam] == 2) {
      // see if the team won 2-1 or 2-0
      int numBonusPoints;
      if (m_numGamesWon[m_nDefendingTeam] == 0)
        numBonusPoints = 700;
      else
        numBonusPoints = 500;
      //
      m_nBonusScore[m_nContractTeam] += numBonusPoints;
      strBonusPoints.Format("%s%4d%s\tRubber bonus",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numBonusPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""));

      // update game record
      m_strArrayBonusPointsRecord.push_back(strBonusPoints);

      // and update total score
      m_nTotalScore[NORTH_SOUTH] = m_nGameScore[0][NORTH_SOUTH] +
        m_nGameScore[1][NORTH_SOUTH] +
        m_nGameScore[2][NORTH_SOUTH] +
        m_nBonusScore[NORTH_SOUTH];
      m_nTotalScore[EAST_WEST] = m_nGameScore[0][EAST_WEST] +
        m_nGameScore[1][EAST_WEST] +
        m_nGameScore[2][EAST_WEST] +
        m_nBonusScore[EAST_WEST];
      m_strTotalPointsRecord.Format("%4d\t%4d\tFinal Score", m_nTotalScore[NORTH_SOUTH], m_nTotalScore[EAST_WEST]);

      // and rubber is over!
      app_->SetRubberInProgress(false);

      if (m_nTotalScore[NORTH_SOUTH] > m_nTotalScore[EAST_WEST])
        app_->SetStatusMessage("Rubber is over -- North/South won the match.");
      else if (m_nTotalScore[EAST_WEST] > m_nTotalScore[NORTH_SOUTH])
        app_->SetStatusMessage("Rubber is over -- East/West won the match.");
      else
        app_->SetStatusMessage("Rubber is over -- the match was a tie.");
    }
  }

}


//
// DisplayScore() 
//
void Deal::DisplayScore() {
  // temporarily mark the game as inactive
  app_->SetGameInProgress(false);

  // show the score
  app_->DisplayScoreDialog(m_strArrayBonusPointsRecord, m_strArrayTrickPointsRecord, m_strTotalPointsRecord);

  // temporarily mark the game as inactive
  app_->SetGameInProgress(true);

  // and proceed to the next hand, if appropriate
  if (app_->IsRubberInProgress()) {
    app_->OnDealNewHand();
  } else {
    ClearAllInfo();
    app_->ClearAllIndicators();
    app_->SetStatusMessage("Rubber is over.  Press F2 or Shift+F2 for a new game.");
  }
}


//
// UpdateDuplicateScore() 
//
// - this is purely preliminary code
//
void Deal::UpdateDuplicateScore() {
  CString strScore;

  // calculate the duplicate score
  int numTricksRequired = 6 + m_nContractLevel;
  int numTricksMade = m_numTricksWon[m_nContractTeam];
  int numTricksShort = numTricksRequired - numTricksMade;
  if (numTricksShort < 0)
    numTricksShort = 0;
  int numRequiredTricks = m_nContractLevel + 6;
  int numTrickPoints = 0;
  int numBonusPoints = 0;
  int numOvertrickPoints = 0;
  BOOL bVulnerable = m_bVulnerable[m_nContractTeam];
  BOOL bDoubled = m_bDoubled;
  BOOL bRedoubled = m_bRedoubled;
  CString strTrickPoints, strBonusPoints;

  //
  // clear scores
  //
  m_nGameScore[m_nCurrGame][m_nContractTeam] = 0;
  m_nBonusScore[m_nContractTeam] = 0;
  m_nBonusScore[m_nDefendingTeam] = 0;

  // first check trick points & overtrick points
  if (numTricksMade >= numRequiredTricks) {
    int numOvertricks = numTricksMade - numRequiredTricks;
    if (numOvertricks < 0)
      numOvertricks = 0;
    switch (m_nContractSuit) {
    case CLUBS:  case DIAMONDS:
      numTrickPoints = m_nContractLevel * 20;
      numOvertrickPoints = numOvertricks * 20;
      break;

    case HEARTS: case SPADES:
      numTrickPoints = m_nContractLevel * 30;
      numOvertrickPoints = numOvertricks * 30;
      break;

    case NOTRUMP:
      numTrickPoints = 40 + (m_nContractLevel - 1) * 30;
      numOvertrickPoints = numOvertricks * 30;
      break;
    }

    // adjust for doubling/redoubling
    if (bDoubled)
      numTrickPoints *= 2;
    else if (bRedoubled)
      numTrickPoints *= 4;

    // record trick points
    m_nGameScore[m_nCurrGame][m_nContractTeam] = numTrickPoints;
    strTrickPoints.Format("%s%4d%s\t%s%s made",
      ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
      numTrickPoints,
      ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""),
      ContractToFullString(m_nContract, m_nContractModifier),
      (bDoubled ? " doubled" : bRedoubled ? " redoubled" : ""));
    // and save
    //		m_strArrayTrickPointsRecord.Add(strTrickPoints);

    // record doubled contract bonus, if appropriate
    if (bDoubled) {
      // record doubled contract bonus of 50 points
      numBonusPoints = 50;
      m_nBonusScore[m_nContractTeam] += numBonusPoints;
      strBonusPoints.Format("%s%4d%s\tDoubled contract",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numBonusPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""));
      // and save
      //			m_strArrayBonusPointsRecord.Add(strBonusPoints);
    } else if (bRedoubled) {
      // record re-doubled contract bonus of 100 points
      numBonusPoints = 100;
      m_nBonusScore[m_nContractTeam] += numBonusPoints;
      strBonusPoints.Format("%s%4d%s\tRedoubled contract",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numBonusPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""));
      // and save
      //			m_strArrayBonusPointsRecord.Add(strBonusPoints);
    }

    // record overtricks bonus, if any
    if (numOvertricks > 0) {
      // adjust overtrick points if doubled/redoubled
      if (bDoubled) {
        if (!bVulnerable)
          numOvertrickPoints = numOvertricks * 100;	// 100 pts/overtrick
        else
          numOvertrickPoints = numOvertricks * 200;
      } else if (bRedoubled) {
        if (!bVulnerable)
          numOvertrickPoints = numOvertricks * 200;
        else
          numOvertrickPoints = numOvertricks * 400;
      }
      m_nBonusScore[m_nContractTeam] += numOvertrickPoints;
      strBonusPoints.Format("%s%4d%s\t%1d overtrick%s%s%s",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numOvertrickPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""),
        numOvertricks,
        ((numOvertricks > 1) ? "s" : ""),
        (bVulnerable ? ", vulnerable" : ""),
        (bDoubled ? ", doubled" : bRedoubled ? ", redoubled" : ""));
      // and save
      //			m_strArrayBonusPointsRecord.Add(strBonusPoints);
    }

    // check for a slam bonus
    if (m_nContractLevel >= 6) {
      if (m_nContractLevel == 6) {
        if (!bVulnerable)
          numBonusPoints = 500;
        else
          numBonusPoints = 750;
      } else {
        if (!bVulnerable)
          numBonusPoints = 1000;
        else
          numBonusPoints = 1500;
      }
      m_nBonusScore[m_nContractTeam] += numBonusPoints;
      strBonusPoints.Format("%s%4d%s\t%s slam contract%s",
        ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
        numBonusPoints,
        ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""),
        ((m_nContractLevel == 6) ? "Small" : "Grand"),
        (bVulnerable ? ", vulnerable" : ""));
      //			// and save
      m_strArrayBonusPointsRecord.push_back(strBonusPoints);
    }

  } else {
    // ouch -- check undertrick points
    int numUndertricks = numRequiredTricks - numTricksMade;
    int numUndertrickPoints = 0;
    int nFirst = 1;								// first undertrick
    int nSecondAndThird = numUndertricks - 1;	// 2nd & third undertricks
    if (nSecondAndThird < 0)
      nSecondAndThird = 0;
    if (nSecondAndThird > 2)
      nSecondAndThird = 2;
    int nAdditional = numUndertricks - 3;		// undertricks beyond 3
    if (nAdditional < 0)
      nAdditional = 0;
    int nBeyondOne = numUndertricks - 1;
    if (nBeyondOne < 0)
      nBeyondOne = 0;
    //
    if (bDoubled) {
      // doubled contract
      if (!bVulnerable)
        numUndertrickPoints = (nFirst * 100) + (nSecondAndThird * 200) + (nAdditional * 300);
      else
        numUndertrickPoints = (nFirst * 200) + (nBeyondOne * 300);
    } else if (bRedoubled) {
      // redoubled contract
      if (!bVulnerable)
        numUndertrickPoints = (nFirst * 200) + (nSecondAndThird * 400) + (nAdditional * 600);
      else
        numUndertrickPoints = (nFirst * 400) + (nBeyondOne * 600);
    } else {
      // neither doubled or redoubled
      if (!bVulnerable)
        numUndertrickPoints = numUndertricks * 50;
      else
        numUndertrickPoints = numUndertricks * 100;
    }
    //
    numBonusPoints += numUndertrickPoints;
    m_nBonusScore[m_nDefendingTeam] = numBonusPoints;
    strBonusPoints.Format("%s%4d%s\tBonus for defeating %scontract by %d trick%s",
      ((m_nDefendingTeam == NORTH_SOUTH) ? "" : "\t"),
      numUndertrickPoints,
      ((m_nDefendingTeam == NORTH_SOUTH) ? "\t" : ""),
      (bVulnerable ? "vulnerable " : ""),
      numUndertricks,
      ((numUndertricks > 1) ? "s" : ""));
    // and save
    //		m_strArrayBonusPointsRecord.Add(strBonusPoints);
  }


  // now see if a game has been won
  if (numTrickPoints >= 100) {
    // if so, add game bonus
    if (bVulnerable)
      numBonusPoints = 500;
    else
      numBonusPoints = 300;
    m_nBonusScore[m_nContractTeam] += numBonusPoints;
    strBonusPoints.Format("%s%4d%s\t%s game made",
      ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
      numBonusPoints,
      ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""),
      (bVulnerable ? ", vulnerable" : ""));
    // and save
    //		m_strArrayBonusPointsRecord.Add(strBonusPoints);
  } else {
    // add part score bonus
    numBonusPoints += 50;
    m_nBonusScore[m_nContractTeam] += numBonusPoints;
    strBonusPoints.Format("%s50%s\tpart score bonus",
      ((m_nContractTeam == NORTH_SOUTH) ? "" : "\t"),
      ((m_nContractTeam == NORTH_SOUTH) ? "\t" : ""));
    // and save
    //		m_strArrayBonusPointsRecord.Add(strBonusPoints);
  }

  // add up the total score
  m_nTotalScore[NORTH_SOUTH] = m_nGameScore[0][NORTH_SOUTH] +
    m_nGameScore[1][NORTH_SOUTH] +
    m_nGameScore[2][NORTH_SOUTH] +
    m_nBonusScore[NORTH_SOUTH];
  m_nTotalScore[EAST_WEST] = m_nGameScore[0][EAST_WEST] +
    m_nGameScore[1][EAST_WEST] +
    m_nGameScore[2][EAST_WEST] +
    m_nBonusScore[EAST_WEST];
  m_strTotalPointsRecord.Format("%4d\t%4d\tFinal Score", m_nTotalScore[NORTH_SOUTH], m_nTotalScore[EAST_WEST]);

}




//
// DisplayDuplicateScore() 
//
// - this is purely preliminary code
//
void Deal::DisplayDuplicateScore() {
  // temporarily mark the game as inactive
  app_->SetGameInProgress(false);

  // show the score
  app_->DisplayScoreDialog(m_strArrayBonusPointsRecord, m_strArrayTrickPointsRecord, m_strTotalPointsRecord);

  // temporarily mark the game as inactive
  app_->SetGameInProgress(true);

  // and proceed to the next hand, if appropriate
  if (app_->IsRubberInProgress()) {
    app_->OnDealNewHand();
  } else {
    ClearAllInfo();
    app_->ClearAllIndicators();
    app_->SetStatusMessage("Rubber is over.  Press F2 or Shift+F2 for a new game.");
  }
}




//
// SwapPartialHands() 
//
void Deal::SwapPartialHands(int nPos1, int nPos2) {
  ASSERT(ISPLAYER(nPos1) && ISPLAYER(nPos2));
  CPlayer* pPlayer1 = m_pPlayer[nPos1];
  CPlayer* pPlayer2 = m_pPlayer[nPos2];

  // first remove player 1's cards
  CCardList tempCards{ app_ };
  int numCards1 = pPlayer1->GetNumCards();
  for (int i = 0; i < numCards1; i++)
    tempCards << pPlayer1->RemoveCardFromHand(0);

  // then take player 2's cards and give them to player 1
  int numCards2 = pPlayer2->GetNumCards();
  for (int i = 0; i < numCards2; i++)
    pPlayer1->AddCardToHand(pPlayer2->RemoveCardFromHand(0));

  // then place the saved cards from player 1's hand into player 2's hand
  for (int i = 0; i < numCards1; i++)
    pPlayer2->AddCardToHand(tempCards[i]);

  //
  // now swap initial cards
  //
  CCardList tempInitialCards{ app_ };
  for (int i = 0; i < 13; i++)
    tempInitialCards << pPlayer1->RemoveCardFromInitialHand(0);

  // take player 2's initial cards and give them to player 1
  for (int i = 0; i < 13; i++)
    pPlayer1->AddCardToInitialHand(pPlayer2->RemoveCardFromInitialHand(0));

  // then place the saved cards from player 1's initial hand into player 2's initial hand
  for (int i = 0; i < 13; i++)
    pPlayer2->AddCardToInitialHand(tempInitialCards[i]);
}



//
BOOL Deal::SwapPlayersHands(Position player1, Position player2, BOOL bRefresh, BOOL bRestartBidding) {
  if (m_pPlayer[player1]->GetNumCards() != m_pPlayer[player2]->GetNumCards()) {
    AfxMessageBox("The two players do not have an equal number of cards!");
    return FALSE;
  }
  //
  CCard *pTempCard[13];
  int i, numCards = m_pPlayer[player1]->GetNumCards();

  // first remove player 1's cards
  for (i = 0; i < numCards; i++)
    pTempCard[i] = m_pPlayer[player1]->RemoveCardFromHand(0);

  // then take player 2's cards and give them to player 1
  for (i = 0; i < numCards; i++)
    m_pPlayer[player1]->AddCardToHand(m_pPlayer[player2]->RemoveCardFromHand(0));

  // then place the saved cards from player 1's hand into player 2's hand
  for (i = 0; i < numCards; i++)
    m_pPlayer[player2]->AddCardToHand(pTempCard[i]);

  // and re-init the hands
  //	m_pPlayer[player1]->InitializeHand();
  //	m_pPlayer[player2]->InitialEvaluateHand();
  if (bRestartBidding) {
    m_pPlayer[player1]->InitializeHand();
    m_pPlayer[player1]->RestartBidding();
  }
  //
  //	m_pPlayer[player2]->InitializeHand();
  //	m_pPlayer[player2]->InitialEvaluateHand();
  if (bRestartBidding) {
    m_pPlayer[player2]->InitializeHand();
    m_pPlayer[player2]->RestartBidding();
  }

  // if one of the players was South, correct the cards face up/down status
  if ((player1 == SOUTH) || (player2 == SOUTH)) {
    BOOL bAllCardsFaceUp = app_->AreCardsFaceUp();
    if (player1 == SOUTH)
      m_pPlayer[player1]->ExposeCards(TRUE, FALSE);
    else
      m_pPlayer[player1]->ExposeCards(FALSE, FALSE);
    //
    if (player2 == SOUTH)
      m_pPlayer[player2]->ExposeCards(TRUE, FALSE);
    else
      m_pPlayer[player2]->ExposeCards(FALSE, FALSE);
  }

  // and update
  if (bRestartBidding && app_->IsBiddingInProgress()) {
    app_->RestartBidding();
  }

  // redisplay
  if (bRefresh)
    ResetDisplay();
  return TRUE;
}



//
void Deal::RotatePlayersHands(int nDirection, BOOL bRefresh, BOOL bRestartBidding) {
  // suspend trace
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->SuspendTrace();
  //
  if (nDirection == 0) {
    // clockwise
    // first south & west
    SwapPlayersHands(SOUTH, WEST, FALSE, FALSE);
    // then north & south
    SwapPlayersHands(NORTH, SOUTH, FALSE, FALSE);
    // then south & east
    SwapPlayersHands(SOUTH, EAST, bRefresh, FALSE);
  } else {
    // ccw
    // first south & east
    SwapPlayersHands(SOUTH, EAST, FALSE, FALSE);
    // then west & north
    SwapPlayersHands(WEST, NORTH, FALSE, FALSE);
    // then north & south
    SwapPlayersHands(NORTH, SOUTH, bRefresh, FALSE);
  }

  // resume trace
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->ResumeTrace();

  //
  if (bRestartBidding) {
    for (int i = 0; i < 4; i++) {
      m_pPlayer[i]->InitializeHand();
      if (bRestartBidding)
        m_pPlayer[i]->RestartBidding();
    }
    app_->RestartBidding();
  }
}



//
// RotatePartialHands() 
//
void Deal::RotatePartialHands(int numPositions) {
  // hide dummy
  if (m_bExposeDummy)
    m_pPlayer[m_nDummy]->ExposeCards(FALSE, FALSE);

  // rotate hands clockwise as necessary
  for (int i = 0; i < numPositions; i++) {
    // first south & west
    SwapPartialHands(SOUTH, WEST);
    // then north & south
    SwapPartialHands(NORTH, SOUTH);
    // then south & east
    SwapPartialHands(SOUTH, EAST);

    // rotate round play history
    CCard* pTemp = m_pCurrTrick[SOUTH];
    m_pCurrTrick[SOUTH] = m_pCurrTrick[WEST];
    m_pCurrTrick[WEST] = pTemp;
    //
    pTemp = m_pCurrTrick[NORTH];
    m_pCurrTrick[NORTH] = m_pCurrTrick[SOUTH];
    m_pCurrTrick[SOUTH] = pTemp;
    //
    pTemp = m_pCurrTrick[SOUTH];
    m_pCurrTrick[SOUTH] = m_pCurrTrick[EAST];
    m_pCurrTrick[EAST] = pTemp;

    // adjust the player(s) info
    m_nCurrPlayer = GetNextPlayer(m_nCurrPlayer);
    m_nRoundLead = GetNextPlayer(m_nRoundLead);
    m_nRoundWinner = GetNextPlayer(m_nRoundWinner);
    m_nRoundWinningTeam = (Team)GetOpposingTeam(m_nRoundWinningTeam);

    // adjust other stuff
    m_nDealer = GetNextPlayer(m_nDealer);
    m_nDeclarer = GetNextPlayer(m_nDeclarer);
    m_nDummy = GetNextPlayer(m_nDummy);
    m_nDoubler = GetNextPlayer(m_nDoubler);
    m_nRedoubler = GetNextPlayer(m_nRedoubler);
    m_nOpeningBidder = GetOpposingTeam(m_nOpeningBidder);
    m_nGameLead = GetNextPlayer(m_nGameLead);
    m_nPrevDealer = GetNextPlayer(m_nPrevDealer);

    // the following is not the most efficient, but...
    m_nContractTeam = GetOpposingTeam(m_nContractTeam);
    m_nDefendingTeam = GetOpposingTeam(m_nDefendingTeam);
    if (ISTEAM(m_nVulnerableTeam))
      m_nVulnerableTeam = (Team)GetOpposingTeam(m_nDefendingTeam);
    m_nLastValidBidTeam = (Team)GetOpposingTeam(m_nLastValidBidTeam);

    // and team lead info
    for (int j = 0; j < 5; j++) {
      int nTemp = m_nPartnershipLead[0][j];
      m_nPartnershipLead[0][j] = m_nPartnershipLead[1][j];
      m_nPartnershipLead[1][j] = nTemp;
    }
  }

  // expose dummy's cards again if necessary
  if (m_numCardsPlayedInGame > 0)
    m_pPlayer[m_nDummy]->ExposeCards(TRUE, FALSE);

  // adjust bidding history
  int numRounds = m_numBidsMade / 4;
  if ((m_numBidsMade % 4) > 0)
    numRounds++;
  for (int i = 0; i < numRounds; i++) {
    for (int j = 0; j < numPositions; j++) {
      // rotate bid history
      int nTemp = m_nBidsByPlayer[SOUTH][i];
      m_nBidsByPlayer[SOUTH][i] = m_nBidsByPlayer[WEST][i];
      m_nBidsByPlayer[WEST][i] = nTemp;
      //
      nTemp = m_nBidsByPlayer[NORTH][i];
      m_nBidsByPlayer[NORTH][i] = m_nBidsByPlayer[SOUTH][i];
      m_nBidsByPlayer[SOUTH][i] = nTemp;
      //
      nTemp = m_nBidsByPlayer[SOUTH][i];
      m_nBidsByPlayer[SOUTH][i] = m_nBidsByPlayer[EAST][i];
      m_nBidsByPlayer[EAST][i] = nTemp;
    }
  }

  // and redisplay
  UpdateBiddingHistory();

  // adjust play history
  for (int i = 0; i <= m_numTricksPlayed && i < 13; i++) {
    // rotate play record
    for (int j = 0; j < numPositions; j++) {
      CCard* pTemp = m_pGameTrick[i][SOUTH];
      m_pGameTrick[i][SOUTH] = m_pGameTrick[i][WEST];
      m_pGameTrick[i][WEST] = pTemp;
      //
      pTemp = m_pGameTrick[i][NORTH];
      m_pGameTrick[i][NORTH] = m_pGameTrick[i][SOUTH];
      m_pGameTrick[i][SOUTH] = pTemp;
      //
      pTemp = m_pGameTrick[i][SOUTH];
      m_pGameTrick[i][SOUTH] = m_pGameTrick[i][EAST];
      m_pGameTrick[i][EAST] = pTemp;

      // adjust trick lead and winner for each round
      m_nTrickLead[i] = GetNextPlayer(m_nTrickLead[i]);
      m_nTrickWinner[i] = GetNextPlayer(m_nTrickWinner[i]);
    }
  }
  UpdatePlayHistory();

  // update other status
  app_->SetAllIndicators();

  //
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->InitializeSwappedHand();
}


//
// ClearAllInfo()
//
void Deal::ClearAllInfo() {
  // do all inits
  ClearMatchInfo();
  ClearBiddingInfo();
  ClearPlayInfo();
  ClearHands();
  InitNewHand();

  // turn off review mode
  m_bReviewingGame = FALSE;
  m_bGameReviewAvailable = FALSE;

  // turn off game auto-play, if it's on
  if (app_->IsFullAutoPlayMode() || app_->IsFullAutoExpressPlayMode()) {
    app_->SetNormalPlayMode();
  }
  //
  m_bExpressPlayMode = FALSE;
  m_bAutoReplayMode = FALSE;
  m_bBatchMode = FALSE;

  // turn off rubber
  app_->SetRubberInProgress(false);

  // clear view mode
  app_->ClearMode();
}




//
// ClearMatchInfo()
//
void Deal::ClearMatchInfo() {
  int i, j;
  for (i = 0; i<2; i++) {
    m_numGamesWon[i] = 0;
    m_nBonusScore[i] = 0;
    m_nTotalScore[i] = 0;
    m_bVulnerable[i] = FALSE;
  }
  for (i = 0; i<3; i++)
    for (j = 0; j<2; j++)
      m_nGameScore[i][j] = 0;
  m_nVulnerableTeam = NEITHER;
  m_nCurrGame = 0;
  //
  m_strArrayBonusPointsRecord.clear();
  m_strArrayTrickPointsRecord.clear();
  m_strTotalPointsRecord.Empty();
  //
  m_bHandsDealt = FALSE;
}




//
// ClearFileParameters()
//
void Deal::ClearFileParameters() {
  m_bReviewingGame = FALSE;
  m_bGameReviewAvailable = FALSE;
  m_bShowCommentsUponOpen = FALSE;
  m_bShowBidHistoryUponOpen = FALSE;
  m_bShowPlayHistoryUponOpen = FALSE;
  m_bShowAnalysesUponOpen = FALSE;
  m_bDealNumberAvailable = FALSE;
  m_nDealNumber = 0;
  m_nSpecialDealCode = 0;
}


//
// DealCards() 
//
// called only from th DealSpecial() routine
// shuffles the deck and assigns the cards to the players
//
int Deal::DealCards() {
  int newDealNumber = app_->GetDeck()->Shuffle(0, true);

  // 
  InitializeVulnerability();

  //
  int i, j, nCount = 0;
  for (i = 0; i < 4; i++)
    m_pPlayer[i]->ClearHand();
  //
  for (i = 0; i < 13; i++) {
    for (j = 0; j < 4; j++) {
      CCard* pCard = (*app_->GetDeck().get())[nCount++];
      m_pPlayer[j]->AddCardToHand(pCard);
    }
  }

  //
  for (i = 0; i < 4; i++)
    m_pPlayer[i]->InitializeHand();

  //
  return newDealNumber;
}




//
// DealHands() 
//
// does the same thing as DealCards(), plus a little bit more
//
void Deal::DealHands(BOOL bUseDealNumber, int nDealNumber) {
  // init vulnerability for random hands
  if (!bUseDealNumber)
    InitializeVulnerability();

  // temp
  app_->SetAllIndicators();

  //
  m_nDealNumber = app_->GetDeck()->Shuffle(bUseDealNumber ? nDealNumber : 0);
  m_nSpecialDealCode = 0;

  // assign cards
  int i, j, nCount = 0;
  for (i = 0; i < 4; i++)
    m_pPlayer[i]->ClearHand();
  //
  for (i = 0; i < 13; i++) {
    for (j = 0; j < 4; j++) {
      CCard* pCard = (*app_->GetDeck().get())[nCount++];
      m_pPlayer[j]->AddCardToHand(pCard);
    }
  }

  // adjust dealer if using deal number
  if (bUseDealNumber)
    m_nDealer = GetPrevPlayer(m_nDealer);
  m_nCurrPlayer = m_nDealer;

  //
  m_bDealNumberAvailable = TRUE;

  //
  InitPlay();
}





//
// InitNewMatch()
//
// called at the start of a new rubber
//
void Deal::InitNewMatch() {
  // temp
  /*
  pMAINFRAME->DisplayTricks();
  pMAINFRAME->DisplayScore();
  pMAINFRAME->DisplayVulnerable();
  */
  // clear out match info
  ClearMatchInfo();

  // if playing rubber, init the dealer to East -- will advance to south
  // upon first deal
  if (app_->IsRubberInProgress()) {
    m_nPrevDealer = EAST;
    m_nDealer = EAST;
    m_nCurrPlayer = m_nDealer;
  }

  // and prepare for a new game 
  InitNewGame();
}


//
// InitNewHand()
//
// called at the start of each new hand
//
void Deal::InitNewHand(BOOL bRestarting) {
  //	pMAINFRAME->ClearStatusText(0, TRUE);
  //
  app_->SetGameInProgress(false);

  // clear bidding info
  ClearBiddingInfo();

  // clear play record info
  ClearPlayInfo();

  // rotate the deal (if not rebidding the same hand)
  if (!bRestarting) {
    if (ISPLAYER(m_nDealer)) {
      m_nPrevDealer = m_nDealer;
      m_nDealer = GetNextPlayer(m_nDealer);
    } else {
      m_nPrevDealer = EAST;
      m_nDealer = SOUTH;
    }
    m_nCurrPlayer = m_nDealer;
    m_nGameLead = NONE;
  }
}




//
// ClearBiddingInfo()
//
// clears the bidding information
//
void Deal::ClearBiddingInfo() {
  //
  int i, j;
  for (i = 0; i<4; i++)
    m_pPlayer[i]->ClearBiddingInfo();
  //
  m_nContract = 0;
  m_nContractSuit = NOTRUMP;
  m_nContractLevel = 0;
  m_bDoubled = FALSE;
  m_nDoubler = NONE;
  m_bRedoubled = FALSE;
  m_nRedoubler = NONE;
  m_nContractModifier = 0;
  m_nLastValidBid = BID_PASS;
  m_nLastValidBidTeam = NEITHER;
  m_nContractTeam = NEITHER;
  m_nDefendingTeam = NEITHER;
  m_nDeclarer = NONE;
  m_nDummy = NONE;
  for (i = 0; i<4; i++) {
    m_pPlayer[i]->SetDeclarerFlag(FALSE);
    m_pPlayer[i]->SetDummyFlag(FALSE);
  }
  m_nPartnershipSuit[0] = m_nPartnershipSuit[1] = -1;
  for (i = 0; i<5; i++) {
    m_nPartnershipLead[0][i] = NONE;
    m_nPartnershipLead[1][i] = NONE;
  }
  m_numPasses = 0;
  m_numBidsMade = 0;
  m_nOpeningBid = 0;
  m_nOpeningBidder = NONE;
  m_nBiddingRound = 0;
  m_numValidBidsMade = 0;
  for (i = 0; i<100; i++) {
    m_nBiddingHistory[i] = 0;
    m_nValidBidHistory[i] = 0;
  }
  for (i = 0; i<4; i++)
    for (j = 0; j<50; j++)
      m_nBidsByPlayer[i][j] = 0;
  //
  if (app_->IsMainFrameExists())
    UpdateBiddingHistory();
  //
  m_nTrumpSuit = NOTRUMP;
  m_nGameLead = NONE;
  m_nRoundLead = NONE;
  m_nDeclarer = NONE;
  //
  m_nLastBiddingHint = NONE;
  m_bHintFollowed = TRUE;
  //
  app_->SetBiddingInProgress(false);
}





//
// InitPlay()
//
// called after each deal to initialize the playing of a new
// hand.  Calls the InitNewHand() above
//
void Deal::InitPlay(BOOL bRedrawScreen, BOOL bRestarting) {
  // limit certain inits if restarting a hand
  InitNewHand(bRestarting);
  //
  m_bHandsDealt = TRUE;

  // initialize each hand's holdings
  for (int i = 0; i<4; i++) {
    // make sure cards face-up status is properly set
    if (i == 0)
      m_pPlayer[i]->ExposeCards(TRUE, FALSE);
    else
      m_pPlayer[i]->ExposeCards(FALSE, FALSE);

    // give the players a chance to init their holdings
    m_pPlayer[i]->InitializeHand();
    m_pPlayer[i]->InitialEvaluateHand();
  }

  // return at this point if in test mode
  if (app_->IsInAutoTestMode()) {
    return;
  }

  // if debugging, save out the hand
  if ((app_->IsDebugModeActive()) && (!bRestarting)) {
    CFile file;
    CFileException fileException;
    CString strPath;
    strPath.Format("%s\\AutoSave.brd", app_->GetProgramDirectory());
    int nCode = file.Open((LPCTSTR)strPath,
      CFile::modeWrite | CFile::modeCreate | CFile::shareDenyWrite,
      &fileException);
    CArchive ar(&file, CArchive::store);
    WriteFile(ar);
    ar.Close();
    file.Close();
  }

  // see if we should block a redraw
  if (!bRedrawScreen)
    app_->SuppressRefresh();

  //
  if (bRedrawScreen)
    app_->InitNewRound();
  //
  //	pVIEW->PostMessage(WM_COMMAND, WMS_INITNEWDEAL, 1L);
  app_->InitNewDeal();

  if (!bRedrawScreen) {
    // restore drawing ability
    app_->EnableRefresh();
    //		pVIEW->Refresh();
  }
}


void Deal::LoadFirstGameRecord() {
  LoadGameRecord(*(m_gameRecords[0]));
}


//
// LoadGameRecord() 
//
// load info from a game (PBN, typically)
//
void Deal::LoadGameRecord(const CGameRecord& game) {
  // init
  ClearMatchInfo();
  ClearBiddingInfo();
  ClearPlayInfo();
  ClearHands();

  // clear players' states
  for (int i = 0; i<4; i++) {
    m_pPlayer[i]->ClearHand();
    m_pPlayer[i]->ClearBiddingInfo();
    m_pPlayer[i]->ClearAnalysis();
  }

  // and assign
  try {
    // try the assign
    CString strDeal = game.GetTagValue("DEAL");
    AssignCardsPBN(strDeal);
  } catch (CFileException* exception) {
    AfxMessageBox("Error in the game deal");
    delete exception;
  }

  // init
  InitNewGame();
  InitNewHand();

  // set game information
  m_bHandsDealt = TRUE;
  m_nDealer = game.m_nDealer;
  m_nCurrPlayer = m_nDealer;
  if (ISBID(game.m_nContract)) {
    m_nContract = game.m_nContract;
    m_nContractModifier = game.m_nContractModifier;
    if (m_nContractModifier == 1)
      m_bDoubled = TRUE;
    else if (m_nContractModifier == 2)
      m_bRedoubled = TRUE;
    m_nContractSuit = BID_SUIT(m_nContract);
    m_nContractLevel = BID_LEVEL(m_nContract);
    m_nTrumpSuit = m_nContractSuit;
    m_nContractTeam = (game.m_nDeclarer == SOUTH || game.m_nDeclarer == NORTH) ? NORTH_SOUTH : EAST_WEST;
    m_nDefendingTeam = (m_nContractTeam == NORTH_SOUTH) ? EAST_WEST : NORTH_SOUTH;
    m_nDeclarer = game.m_nDeclarer;
    m_nGameLead = GetNextPlayer(m_nDeclarer);
    m_nDummy = GetNextPlayer(m_nGameLead);
    m_pPlayer[m_nDummy]->SetDummyFlag(TRUE);
    m_pPlayer[m_nDeclarer]->SetDeclarerFlag(TRUE);
    m_nRoundLead = m_nGameLead;
    m_nCurrPlayer = m_nRoundLead;
    m_nTrickLead[0] = m_nRoundLead;
    //
    if ((m_nDeclarer == SOUTH) || (m_nDeclarer == NORTH)) {
      m_nContractTeam = NORTH_SOUTH;
      m_nDefendingTeam = EAST_WEST;
    } else {
      m_nContractTeam = EAST_WEST;
      m_nDefendingTeam = NORTH_SOUTH;
    }
  }

  //
  m_nVulnerableTeam = (Team)game.m_nVulnerability;
  if ((m_nVulnerableTeam == NORTH_SOUTH) || (m_nVulnerableTeam == BOTH))
    m_bVulnerable[0] = TRUE;
  else if ((m_nVulnerableTeam == EAST_WEST) || (m_nVulnerableTeam == BOTH))
    m_bVulnerable[1] = TRUE;
  //
  m_numBidsMade = game.GetNumBids();
  for (int i = 0; i<m_numBidsMade; i++)
    m_nBiddingHistory[i] = game.m_nBids[i];

  // finally, have the players init their hands
  for (int i = 0; i<4; i++)
    m_pPlayer[i]->InitializeRestoredHand();

  // then set cards face up if desired
  if (app_->IsExposePBNGameCards() && !app_->AreCardsFaceUp()) {
    app_->ExposeAllCards();
  }

  //	for(i=0;i<4;i++)
  //		m_pPlayer[i]->ExposeCards(TRUE, FALSE);

  // done
}



//
// InitGameReview() 
//
void Deal::InitGameReview() {
  m_bReviewingGame = TRUE;
}






//
// PlayGameRecord() 
//
// play the recorded game (PBN, typically)
//
void Deal::PlayGameRecord(int nGameIndex) {
  //
  ASSERT(nGameIndex < m_gameRecords.GetSize());
  const CGameRecord& game = *(m_gameRecords.GetAt(nGameIndex));

  int position = SOUTH;
  if (ISPLAYER(game.m_nDeclarer)) {
    position = game.m_nDeclarer;
  }

  // ask for the position to assume
  position = app_->DisplaySelectHandDialog(position);
  if (!ISPLAYER(position)) {
    return;
  }

  // init data
  m_nDeclarer = game.m_nDeclarer;
  m_nDealer = game.m_nDealer;

  //
  if (ISBID(game.m_nContract)) {
    // reset suit sequence
    app_->InitDummySuitSequence(BID_SUIT(game.m_nContract), GetPartner(m_nDeclarer));
  }

  // get count of positions to rotate (clockwise)
  int numPositions = 4 - position;

  // rotate the hands
  CWaitCursor wait;
  RotatePartialHands(numPositions);

  //
  // and finally begin play
  //
  m_bReviewingGame = FALSE;
  app_->SetGameInProgress(true);
  //
  app_->EndGameReview();
  app_->EnableRefresh(true);
  //	if (numPositions > 0)
  ResetDisplay();

  //
  // new code
  //
  if (m_numTricksPlayed < 13) {
    // then pick up where we left off
    app_->ResumeGame();
  } else {
    // shouldn't even get here!
    AfxMessageBox(_T("The hand is over."));
  }


  /*
  * this old code is appropriate if restarting the game
  *
  //
  pMAINFRAME->SetStatusMessage("Initializing hands...");

  // first restore initial hands
  for(int i=0;i<4;i++)
  m_pPlayer[i]->RestoreInitialHand();

  // clear dummy flag
  if (ISPLAYER(m_nDummy))
  m_pPlayer[m_nDummy]->SetDummyFlag(FALSE);

  // get count of positions to rotate
  int numPositions = handDialog.m_nPosition;

  // prep
  m_nDeclarer = game.m_nDeclarer;
  m_nDealer = game.m_nDealer;

  // and rotate everything (counter-clockwise) as necessary
  for(i=0;i<numPositions;i++)
  {
  RotatePlayersHands(1, FALSE, FALSE);
  //
  if (ISPLAYER(m_nDoubler))
  m_nDoubler = ::GetPrevPlayer(m_nDoubler);
  if (ISPLAYER(m_nRedoubler))
  m_nRedoubler = ::GetPrevPlayer(m_nRedoubler);
  //
  if (ISPLAYER(m_nDeclarer))
  m_nDeclarer = ::GetPrevPlayer(m_nDeclarer);
  if (ISPLAYER(m_nDealer))
  m_nDealer = ::GetPrevPlayer(m_nDealer);
  }
  // set current bidder
  m_nCurrPlayer = m_nDealer;

  // reset teams as well
  if (ISBID(m_nContract) && (numPositions == 1) || (numPositions == 3))
  {
  if (m_nContractTeam == NORTH_SOUTH)
  {
  m_nContractTeam = EAST_WEST;
  m_nDefendingTeam = NORTH_SOUTH;
  }
  else
  {
  m_nContractTeam = NORTH_SOUTH;
  m_nDefendingTeam = EAST_WEST;
  }
  //
  if (m_nVulnerableTeam == NORTH_SOUTH)
  m_nVulnerableTeam = EAST_WEST;
  else
  m_nVulnerableTeam = NORTH_SOUTH;

  }

  if (ISBID(m_nContract))
  {
  // reset other position info
  m_nRoundLead = ::GetNextPlayer(m_nDeclarer);
  m_nCurrPlayer = m_nRoundLead;
  m_nGameLead = m_nRoundLead;

  // set new dummy
  m_nDummy = GetPartner(m_nDeclarer);
  m_pPlayer[m_nDummy]->SetDummyFlag(TRUE);
  m_pPlayer[m_nDeclarer]->SetDeclarerFlag(TRUE);

  //
  theApp.SetValue(tbGameInProgress, TRUE);
  }

  //
  m_bReviewingGame = FALSE;
  m_bExposeDummy = FALSE;
  //	theApp.SetValue(tbShowCardsFaceUp, FALSE);

  // reset cards' face up status
  m_pPlayer[WEST]->ExposeCards(FALSE, FALSE);
  m_pPlayer[NORTH]->ExposeCards(FALSE, FALSE);
  m_pPlayer[EAST]->ExposeCards(FALSE, FALSE);
  m_pPlayer[SOUTH]->ExposeCards(TRUE, FALSE);

  // and start bidding or play
  if (ISBID(m_nContract))
  {
  // reset hand & play info
  ClearPlayInfo();
  for(i=0;i<4;i++)
  m_pPlayer[i]->InitializeRestoredHand();
  // and start play
  pVIEW->InitNewRound();
  pVIEW->Notify(WM_COMMAND, WMS_FILE_LOADED, 0);
  }
  else
  {
  // reset suits
  pVIEW->ResetSuitOffsets();
  // and jump into bidding
  InitPlay(FALSE, TRUE);	// restarting saved game
  }

  // done
  pVIEW->EnableRefresh(TRUE);
  //	ResetDisplay();

  //
  //	OnRestartCurrentHand();
  //	InitPlay(TRUE);
  *
  *
  */
}


//
// ClearHands() 
//
// empty the players' hands
//
void Deal::ClearHands() {
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->ClearHand();
  ClearPlayInfo();
  // also clear the deck
  app_->GetDeck()->Clear();
}

//
void Deal::PrepForCardLayout() {
  // if laying out cards, reset everything
  DeleteContents();
  PrepForNewDeal();

  // and init
  InitNewHand();
}

void Deal::DeleteContents() {
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->ClearHand();

  //
  m_strDocTitle.Empty();
  m_strFileComments.Empty();
  m_strFileDescription.Empty();
  // make sure to empty the file comments dialog
  if (m_bInitialized) {
    if (app_->IsMainFrameExists()) {
      app_->UpdateFileCommentsDialog();
    }
  }
  //
  ClearFileParameters();

  // empty out game record
  int numGames = m_gameRecords.GetSize();
  for (int i = 0; i < numGames; i++)
    delete m_gameRecords[i];
  m_gameRecords.RemoveAll();

  //
  //	pVIEW->SetCurrentMode(CEasyBView::MODE_NONE);
  app_->ClearMode();
}

////////////////////////////////////////////////////////////////////
//                                                                //
// Bid processing routines                                        //
//                                                                //
////////////////////////////////////////////////////////////////////


//
// Check bid's validity
//
BOOL Deal::IsBidValid(int nBid) {
  // check limits
  if ((nBid < BID_PASS) || (nBid > BID_REDOUBLE))
    return FALSE;
  // check legality of redouble
  if (((nBid == BID_REDOUBLE) && (!m_bDoubled)) ||
    ((nBid == BID_REDOUBLE) && (m_bRedoubled)))
    return FALSE;
  // check legality of double
  if (((nBid == BID_DOUBLE) && (m_nLastValidBid == BID_PASS)) ||
    ((nBid == BID_DOUBLE) && ((m_bDoubled) || (m_bRedoubled))))
    return FALSE;
  // check for basic conditions
  if ((nBid == BID_PASS) || (m_numBidsMade == 0) || (m_nLastValidBid == BID_PASS))
    return TRUE;
  // compare against last valid bid
  if (nBid > m_nLastValidBid)
    return TRUE;
  else
    return FALSE;
}



//
// Record a bid
// 
int Deal::EnterBid(int nPos, int nBid) {
  CString strTemp;
  if ((nPos < SOUTH) || (nPos > EAST)) {
    strTemp.Format("Illegal call to 'EnterBid() with #%d as the bidder.", nPos);
    AfxMessageBox(strTemp);
    return -1;
  }
  if (!IsBidValid(nBid)) {
    strTemp.Format("Caught logic error: %s attempted an illegal bid of %s.",
      PositionToString(nPos),
      BidToShortString(nBid));
    AfxMessageBox(strTemp, MB_ICONEXCLAMATION);
    return -1;
  }

  // update records
  // check for bid type
  if (nBid == BID_PASS) {
    m_numPasses++;
  } else if (nBid == BID_DOUBLE) {
    m_bDoubled = TRUE;
    m_bRedoubled = FALSE;
    m_nContractModifier = 1;
    m_numPasses = 0;
  } else if (nBid == BID_REDOUBLE) {
    m_bDoubled = FALSE;
    m_bRedoubled = TRUE;
    m_nContractModifier = 2;
    m_numPasses = 0;
  } else {
    int nTeam;
    if ((nPos == SOUTH) || (nPos == NORTH))
      nTeam = NORTH_SOUTH;
    else
      nTeam = EAST_WEST;
    m_numPasses = 0;
    m_nLastValidBid = nBid;
    m_nLastValidBidTeam = nTeam;
    m_nValidBidHistory[m_numValidBidsMade] = nBid;
    m_numValidBidsMade++;

    // see if this is a new suit for the partnership
    int nSuit = (nBid - 1) % 5;
    if (nSuit != m_nPartnershipSuit[nTeam]) {
      m_nPartnershipSuit[nTeam] = nSuit;
      if (m_nPartnershipLead[nTeam][nSuit] == NONE)
        m_nPartnershipLead[nTeam][nSuit] = nPos;
    }

    // see if this is the first bid made
    if (m_nOpeningBid == 0) {
      m_nOpeningBid = nBid;
      m_nOpeningBidder = nPos;
    }

    //
    m_bDoubled = FALSE;
    m_bRedoubled = FALSE;
    m_nContractModifier = 0;
  }

  // record the bid
  m_nBiddingHistory[m_numBidsMade] = nBid;
  m_nBidsByPlayer[nPos][m_nBiddingRound] = nBid;

  // and advance the bid counter
  m_numBidsMade++;
  m_nBiddingRound = m_numBidsMade / 4;
  m_nCurrPlayer = GetNextPlayer(m_nCurrPlayer);

  // see if our bidding hint was followed
  if ((nPos == SOUTH) && (m_nLastBiddingHint != NONE)) {
    if (nBid == m_nLastBiddingHint) {
      m_bHintFollowed = TRUE;
    } else {
      // advice overridden!
      m_bHintFollowed = FALSE;
      app_->SetHintDialogText("Bidding hints not available.");
    }
  }

  // then clear pending hint
  m_nLastBiddingHint = NONE;

  // update display
  UpdateBiddingHistory();

  // give each player a chance to note the bid
  for (int i = 0; i<4; i++)
    m_pPlayer[i]->RecordBid(nPos, nBid);

  // see if the hand was passed out 
  if ((m_numPasses >= 4) && (m_nLastValidBid == BID_PASS)) {
    // passes all around, so gotta redeal
    return -99;
  }

  // check to see if contract has been reached
  if ((m_numPasses >= 3) && (m_nLastValidBid != BID_PASS)) {
    // contract has been set
    m_nContract = m_nLastValidBid;
    m_nContractSuit = BID_SUIT(m_nLastValidBid);
    m_nContractLevel = BID_LEVEL(m_nLastValidBid);
    m_nTrumpSuit = m_nContractSuit;
    m_nContractTeam = m_nLastValidBidTeam;
    m_nDefendingTeam = (m_nContractTeam == NORTH_SOUTH) ? EAST_WEST : NORTH_SOUTH;
    m_nDeclarer = m_nPartnershipLead[m_nContractTeam][m_nContractSuit];
    m_nGameLead = GetNextPlayer(m_nDeclarer);
    m_nDummy = GetNextPlayer(m_nGameLead);
    m_pPlayer[m_nDummy]->SetDummyFlag(TRUE);
    m_pPlayer[m_nDeclarer]->SetDeclarerFlag(TRUE);
    m_nRoundLead = m_nGameLead;

    // ### TEMP ###
    ASSERT(m_nRoundLead >= 0);

    m_nCurrPlayer = m_nRoundLead;
    m_nTrickLead[0] = m_nRoundLead;

    // record end of bidding 
    for (int i = 0; i<4; i++)
      m_pPlayer[i]->BiddingFinished();

    //
    app_->ClearHintDialog();
    app_->DisableHintDialog();

    //
    UpdatePlayHistory();
    //
    return 1;
  } else {
    return 0;
  }
}




//
//
// UndoBid()
//
// Undo last bid
// 
int Deal::UndoBid() {
  if (!app_->IsBiddingInProgress() || (m_numBidsMade == 0))
    return 0;

  /*
  // restore neural net weights
  if (theApp.GetValue(tnBiddingEngine) == 1)
  {
  CNeuralNet* pNet = theApp.GetNeuralNet();
  pNet->RestoreWeights();
  }
  */
  // clear "first bid" setting if appropriate
  int nCurrentBid = m_nBiddingHistory[m_numBidsMade];
  if (m_nOpeningBid == nCurrentBid) {
    m_nOpeningBid = 0;
    m_nOpeningBidder = NONE;
  }

  // update counts
  m_numBidsMade--;
  if (m_numBidsMade == 0) {
    // backed up to start of bidding
    m_bDoubled = FALSE;
    m_bRedoubled = FALSE;
    m_nContractModifier = 0;
    m_nLastValidBid = 0;
    m_nLastValidBidTeam = NONE;
    return 0;
  }

  // recall the previous bid
  int nBid = m_nBiddingHistory[m_numBidsMade];
  m_nCurrPlayer = GetPrevPlayer(m_nCurrPlayer);
  int nPos = m_nCurrPlayer;
  //
  m_nBiddingHistory[m_numBidsMade] = NONE;
  m_nBidsByPlayer[nPos][m_nBiddingRound] = NONE;
  m_nBiddingRound = m_numBidsMade / 4;
  m_nLastBiddingHint = NONE;

  // check state
  if (nBid == BID_PASS) {
    m_numPasses--;
  } else if (nBid == BID_DOUBLE) {
    m_bDoubled = FALSE;
    m_nContractModifier = 0;
    // check # of passes
    m_numPasses = 0;
    for (int i = m_numBidsMade - 1; i >= 0; i--) {
      if (m_nBiddingHistory[i] != BID_DOUBLE)
        break;
      m_numPasses++;
    }
  } else if (nBid == BID_REDOUBLE) {
    m_bRedoubled = FALSE;
    m_nContractModifier = 1;
    // check # of passes
    m_numPasses = 0;
    for (int i = m_numBidsMade - 1; i >= 0; i--) {
      if (m_nBiddingHistory[i] != BID_DOUBLE)
        break;
      m_numPasses++;
    }
  } else {
    //
    int nTeam;
    if ((nPos == SOUTH) || (nPos == NORTH))
      nTeam = NORTH_SOUTH;
    else
      nTeam = EAST_WEST;
    m_numPasses = 0;

    // search back for the last valid bid
    int i = 0;
    for (i = m_numBidsMade - 1; i >= 0; i--) {
      if ((m_nBiddingHistory[i] != BID_PASS) && (m_nBiddingHistory[i] != BID_DOUBLE) && (m_nBiddingHistory[i] != BID_DOUBLE))
        break;
    }
    if (i >= 0) {
      m_nLastValidBid = nBid;
      m_nLastValidBidTeam = nTeam;
      m_nValidBidHistory[m_numValidBidsMade] = nBid;
    } else {
      m_nLastValidBid = NONE;
      m_nLastValidBidTeam = NEITHER;
      m_nValidBidHistory[m_numValidBidsMade] = NONE;
    }

    // one less valid bid was made 
    m_numValidBidsMade--;

    // re-check to see which player led for team
    // first clear 
    m_nPartnershipSuit[NORTH_SOUTH] = m_nPartnershipSuit[EAST_WEST] = NONE;
    for (int i = 0; i<4; i++) {
      m_nPartnershipLead[NORTH_SOUTH][i] = NONE;
      m_nPartnershipLead[EAST_WEST][i] = NONE;
    }
    // then scan
    for (int i = 0; i<m_numBidsMade; i++) {
      int nBid = m_nBiddingHistory[i];
      int nSuit = (nBid - 1) % 5;
      if (nSuit != m_nPartnershipSuit[nTeam]) {
        m_nPartnershipSuit[nTeam] = nSuit;
        if (m_nPartnershipLead[nTeam][nSuit] == NONE)
          m_nPartnershipLead[nTeam][nSuit] = nPos;
      }
    }
  }

  // update display
  UpdateBiddingHistory();

  // give each player a chance to note the bid
  /*
  if (!m_bReviewingGame)
  {
  for(int i=0;i<4;i++)
  m_pPlayer[i]->RecordBidUndo(nPos,nBid);
  }
  */
  //
  return 0;
}



//
// WasSuitBid()
//
int Deal::WasSuitBid(int nSuit) const {
  for (int i = 0; i<m_numValidBidsMade; i++) {
    if (nSuit == BID_SUIT(m_nValidBidHistory[i]))
      return TRUE;
  }
  //
  return FALSE;
}



//
// GetSuitsBid()
//
int Deal::GetSuitsBid(CArray<int, int>& suits) const {
  BOOL nSuitsBid[4] = { FALSE, FALSE, FALSE, FALSE };
  suits.RemoveAll();
  //
  for (int i = 0; i<m_numValidBidsMade; i++) {
    int nSuit = BID_SUIT(m_nValidBidHistory[i]);
    if (!nSuitsBid[nSuit]) {
      nSuitsBid[nSuit] = TRUE;
      suits.InsertAt(0, nSuit);
    }
  }
  //
  return suits.GetSize();
}



//
// GetSuitsUnbid()
//
int Deal::GetSuitsUnbid(CArray<int, int>& suits) const {
  for (int i = 0; i<4; i++) {
    if (!WasSuitBid(i))
      suits.InsertAt(0, i);
  }
  return suits.GetSize();
}




//
// SetBiddingComplete()
//
// - called from the view to inform that the bidding has completed
//   and the bidding dialog has closed
//
void Deal::SetBiddingComplete() {
  // if declarer is north, expose north's cards
  if (m_nDeclarer == NORTH)
    m_pPlayer[NORTH]->ExposeCards(TRUE);
}



//
void Deal::UpdateBiddingHistory() {
  CString strBids, strPlainBids, strScreenBids, strTemp, strTempPlain;

  // return if output suppressed
  if (m_bSuppressBidHistoryUpdate)
    return;

  // return if dealer is not yet set
  int nPos = m_nDealer;
  if (!ISPOSITION(nPos)) {
    app_->SetBiddingHistory("");
    return;
  }

  // check resolution
  BOOL bSmallCards = app_->IsLowResOption();

  // check mode
  bool bUseSymbols = app_->IsUseSuitSymbols();

  //
  for (int i = 0; i<4; i++) {
    strTemp.Format("%-5s", PositionToString(nPos));
    strBids += strTemp;
    strBids += " ";
    nPos = GetNextPlayer(nPos);
  }
  strBids += "\r\n----- ----- ----- -----\r\n";
  strPlainBids = strBids;
  //
  CString strSpace = "    ";

  for (int i = 0; i<m_numBidsMade; i++) {
    // get the bid string
    int nBid = m_nBiddingHistory[i];
    if (bUseSymbols && ISBID(nBid)) {
      // use symbols
      int nSuit = BID_SUIT(nBid);
      if (nSuit != NOTRUMP)
        strTemp.Format(_T("%1d%c"), BID_LEVEL(nBid), (unsigned char)(tSuitLetter + nSuit));
      else
        strTemp.Format(_T("%1dNT"), BID_LEVEL(nBid));
    } else {
      strTemp = BidToShortString(m_nBiddingHistory[i]);
    }

    // letter version
    strTempPlain = BidToShortString(m_nBiddingHistory[i]);

    // center the bid string by adding spaces fore & aft
    int nLen = strTemp.GetLength();
    int nBegOffset = (5 - nLen) / 2;
    int nEndOffset = nBegOffset;
    if ((nBegOffset + nLen + nEndOffset) < 5)
      nEndOffset++;

    // letter/symbol version
    strBids += strSpace.Left(nBegOffset);
    strBids += strTemp;
    strBids += strSpace.Left(nEndOffset);
    strBids += " ";
    if ((i % 4) == 3)
      strBids += "\r\n";

    // plain version
    nLen = strTempPlain.GetLength();
    nBegOffset = (5 - nLen) / 2;
    nEndOffset = nBegOffset;
    if ((nBegOffset + nLen + nEndOffset) < 5)
      nEndOffset++;
    //
    strPlainBids += strSpace.Left(nBegOffset);
    strPlainBids += strTempPlain;
    strPlainBids += strSpace.Left(nEndOffset);
    strPlainBids += " ";
    if ((i % 4) == 3)
      strPlainBids += "\r\n";
  }
  //
  app_->SetBiddingHistory(strBids, bUseSymbols);
  app_->SetPlainBiddingHistory((LPCTSTR)strPlainBids);
}



//
void Deal::RestartBidding() {
  // reset dummy's info before dummy index gets cleared below in InitNewHand()
  //	theApp.InitDummySuitSequence(NONE, NONE);
  if (ISPLAYER(m_nDummy) && (m_nDummy != SOUTH)) {
    m_pPlayer[m_nDummy]->SetDummyFlag(FALSE);
    m_pPlayer[m_nDummy]->ExposeCards(FALSE, FALSE);
    m_nDummy = NONE;
  }

  //
  InitNewHand(TRUE);	// restarting

                      // reset auto play if enabled
  if (app_->IsFullAutoPlayMode() || app_->IsFullAutoExpressPlayMode()) {
    app_->SetNormalPlayMode();
    m_bExpressPlayMode = FALSE;
    m_bAutoReplayMode = FALSE;
  }

  // reset current player 
  m_nCurrPlayer = m_nDealer;

  // clear game review flag
  m_bReviewingGame = FALSE;

  // clear pending hint
  m_nLastBiddingHint = NONE;

  // always expose south's hand
  m_pPlayer[SOUTH]->ExposeCards(TRUE, FALSE);

  // notify each player
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RestartBidding();

  // and set global flag
  app_->SetBiddingInProgress(true);
}


////////////////////////////////////////////////////////////
//                                                        //
// Trick processing routines                              //
//                                                        //
////////////////////////////////////////////////////////////



//
// BeginRound()
//
// called after bidding is finished to get the play started
//
void Deal::BeginRound() {
  // make sure the view reflects the new dummy suit sequence
  if (app_->IsShowDummyTrumpsOnLeft()) {
    app_->InitDummySuitSequence(m_nTrumpSuit, m_nDummy);
    app_->ResetDummySuitSequence();
  }

  // then start the play
  app_->AdvanceToNextPlayer();
  //	InvokeNextPlayer();
}



//
// ExposeDummy()
//
// called to show the dummy's cards
//
void Deal::ExposeDummy(BOOL bExpose, BOOL bRedraw) {
  m_bExposeDummy = bExpose;
  // never hide south
  if ((m_nDummy == SOUTH) && (!bExpose))
    bExpose = TRUE;
  //
  m_pPlayer[m_nDummy]->ExposeCards(bExpose, bRedraw);
}




//
// TestPlayValidity()
//
// called to see if a play is valid
//
BOOL Deal::TestPlayValidity(Position nPos, CCard* pCard, BOOL bAlert) {
  // see if it's from the proper hand
  if ((pCard->GetOwner() != nPos) || (nPos != m_nCurrPlayer))
    return FALSE;

  // see if this card is valid
  if (m_numCardsPlayedInRound > 0) {
    // see if we're playing the wrong suit
    if ((pCard->GetSuit() != m_nSuitLed) &&
      (m_pPlayer[nPos]->GetNumCardsInSuit(m_nSuitLed) > 0)) {
      if (bAlert)
        AfxMessageBox("You have to follow suit.", MB_OK | MB_ICONEXCLAMATION);
      return FALSE;
    }
  }

  // else all's ok
  return TRUE;
}





//
// EnterCardPlay() 
//
// called when a card is played onto the table
//
void Deal::EnterCardPlay(Position nPos, CCard* pCard) {
  // sanity check
  if (m_numCardsPlayedInRound > 0) {
    int nSuitLed = m_pCurrTrick[m_nRoundLead]->GetSuit();
    // did the player not follow suit?
    if (pCard->GetSuit() != nSuitLed) {
      // make sure he has no more cards in the suit led
      ASSERT(m_pPlayer[nPos]->GetNumCardsInSuit(nSuitLed) == 0);
    }
  }

  // process the play
  m_pPlayer[nPos]->RemoveCardFromHand(pCard);

  // then establish the card as being in the current trick
  SetCurrentTrickCard(nPos, pCard);
  if (m_numCardsPlayedInRound == 0)
    m_nSuitLed = pCard->GetSuit();
  m_numCardsPlayedInRound++;
  ASSERT(m_numCardsPlayedInRound <= 4);

  // update running play record
  m_nPlayRecord[m_numCardsPlayedInGame] = pCard->GetDeckValue();
  m_numCardsPlayedInGame++;
  m_nCurrPlayer = GetNextPlayer(nPos);

  // get players' reactions
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RecordCardPlay(nPos, pCard);

  // clear pending hint
  m_pLastPlayHint = NULL;

  // update status display
  app_->UpdateStatusWindow();
  // and record
  UpdatePlayHistory();
}




//
// InvokeNextPlayer()
//
// invokes the next computer player 
// called after a card has been selected for play
//
void Deal::InvokeNextPlayer() {
  CPlayer* pCurrPlayer = m_pPlayer[m_nCurrPlayer];

  // disable player hints
  app_->DisableHintDialog();

  // see if we'll be pausing between plays
  int nPauseLength = 0, nStartTime = 0;
  if (app_->IsInsertBiddingPause() && !m_bExpressPlayMode) {
    // get pause duration
    nPauseLength = app_->GetPlayPauseLength() * 100;

    // and the time
    if (nPauseLength > 0)
      nStartTime = app_->TimeGetTime();
  }

  // now call the card play function
  CCard* pCard;
  try {
    pCard = pCurrPlayer->PlayCard();
  }
  //	catch(int& nExceptionCode)
  catch (int) {
    // escape clause
    //		if (nExceptionCode == 1)	// computer player claimed the remaining tricks
    return;
  } catch (CGIBException& exception) {
    // see if there was an error
    if (exception.GetErrorCode() != 0)
      AfxMessageBox("An error ocurred while attempting to run GIB.  Please check to be sure GIB is installed properly.");
    // restart the hand
    app_->RestartCurrentHand();
    return;
  }
  // do some sanity checks here
  ASSERT(pCard->IsValid());
  ASSERT(pCurrPlayer->GetHand().HasCard(pCard));
  ASSERT((Position)pCard->GetOwner() == pCurrPlayer->GetPosition());

  // see if we should sleep
  if (nPauseLength > 0) {
    int nEndTime = app_->TimeGetTime();
    int nElapsedTime = nEndTime - nStartTime;
    int nTimeToSleep = nPauseLength - nElapsedTime;
    if (nTimeToSleep > 0)
      Sleep(nTimeToSleep);
  }

  // and then we POST a card play message to the view 
  // (instead of SENDing a messge or calling a function) 
  // in order to prevent recursive calls
  app_->PlayCard(pCard, 1001);
}




//
// UndoLastCardPlayed() 
//
// called to undo a card play
//
void Deal::UndoLastCardPlayed() {
  if (m_numCardsPlayedInRound < 1)
    return;
  int nPos = GetPrevPlayer(m_nCurrPlayer);

  CCard* pCard = m_pCurrTrick[nPos];
  // turn card back over if necessary -- i.e., if all cards are face up, 
  // or if the card belongs to South, or to dummy, or to North when South is dummy
  if ((nPos == SOUTH) || (nPos == m_nDummy) || ((nPos == NORTH) && (m_nDummy == SOUTH)))
    pCard->SetFaceUp();
  else
    pCard->SetFaceDown();

  // and reinsert card into the hand
  m_pPlayer[nPos]->AddCardToHand(pCard, TRUE);

  // and inform all players of the undo
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RecordCardUndo(nPos, pCard);

  // clear pending hint
  m_pLastPlayHint = NULL;

  // reset the current trick card
  m_pCurrTrick[nPos] = NULL;
  m_numCardsPlayedInRound--;
  m_numCardsPlayedInGame--;
  m_nPlayRecord[m_numCardsPlayedInGame] = -1;
  m_nCurrPlayer = nPos;
  UpdatePlayHistory();
}



//
// UndoTrick() 
//
// called to undo the current trick
//
void Deal::UndoTrick() {
  // start with the most recent card and work backwards
  int numCardsPlayed = m_numCardsPlayedInRound;
  for (int i = 0; i < numCardsPlayed; i++)
    UndoLastCardPlayed();
  //
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RecordTrickUndo();

  // update info
  m_nRoundWinner = NONE;
  //	UpdatePlayHistory();
  //	SetCurrentPlayer(m_nRoundLead);

  // update status display
  app_->UpdateStatusWindow();

  // see if we should hide dummy
  if (m_numTricksPlayed == 0) {
    // turn off dumy exposure flag
    if (m_nDummy != SOUTH)
      m_pPlayer[m_nDummy]->ExposeCards(FALSE, FALSE);
    m_bExposeDummy = FALSE;
    //		pVIEW->DisplayHand((Position)m_nDummy);
    //		ResetDisplay();
  }
}



//
// UndoPreviousTrick() 
//
// called to undo the _previous_ trick
//
void Deal::UndoPreviousTrick() {
  if (m_numTricksPlayed == 0)
    return;
  //
  int nRound = m_numTricksPlayed - 1;
  m_nRoundLead = m_nTrickLead[nRound];

  // return each card from the previous trick to the players
  int nPos = m_nRoundLead;
  for (int i = 0; i < 4; i++) {
    // retrieve the card and turn face up or down
    CCard* pCard = m_pGameTrick[nRound][nPos];
    if ((nPos == SOUTH) || (nPos == m_nDummy) || ((nPos == NORTH) && (m_nDummy == SOUTH)))
      //				((nPos == NORTH) && (m_nDummy == SOUTH) && (m_numTricksPlayed > 1)) )
      pCard->SetFaceUp();
    else
      pCard->SetFaceDown();

    // and reinsert card into the hand
    m_pPlayer[nPos]->AddCardToHand(pCard, TRUE);

    // inform each player of the card undo
    for (int i = 0; i < 4; i++)
      m_pPlayer[i]->RecordCardUndo(nPos, pCard);

    // adjust counters
    m_numCardsPlayedInGame--;
    m_nPlayRecord[m_numCardsPlayedInGame] = -1;

    // move to the next player
    nPos = GetNextPlayer(nPos);
  }

  // inform each player of the trick undo
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RecordTrickUndo();

  // clear pending hint
  m_pLastPlayHint = NULL;

  // adjust count
  m_numTricksPlayed--;
  m_numActualTricksPlayed--;
  m_numCardsPlayedInRound = 0;
  m_nRoundWinner = NONE;

  // also adjust trick count
  switch (m_nTrickWinner[nRound]) {
  case SOUTH: case NORTH:
    m_numTricksWon[NORTH_SOUTH]--;
    break;
  case EAST: case WEST:
    m_numTricksWon[EAST_WEST]--;
    break;
  }

  // see if we should hide dummy
  if (m_numTricksPlayed == 0) {
    // turn off dumy exposure flag
    if (m_nDummy != SOUTH)
      m_pPlayer[m_nDummy]->ExposeCards(FALSE, FALSE);
    m_bExposeDummy = FALSE;
    //		ResetDisplay();
  }

  // reset the current player
  m_nCurrPlayer = m_nRoundLead;

  // update displays
  UpdatePlayHistory();
  app_->UpdateStatusWindow();
}




//
// EvaluateTrick() 	
//
void Deal::EvaluateTrick(BOOL bQuietMode) {
  CCard *pCard;
  // evaluate winner
  int nPos;
  m_nHighVal = 0;
  m_nHighTrumpVal = 0;
  BOOL bTrumpPlayed = FALSE;
  //
  for (nPos = SOUTH; nPos <= EAST; nPos++) {
    pCard = m_pCurrTrick[nPos];
    int nSuit = pCard->GetSuit();
    int nCardVal = pCard->GetFaceValue();
    //
    if ((m_nContractSuit != NOTRUMP) && (nSuit == m_nContractSuit))
      bTrumpPlayed = TRUE;
    if (bTrumpPlayed) {
      // a trump has been played in this round, so only
      // a trump card can win the trick
      if ((nSuit == m_nContractSuit) && (nCardVal > m_nHighTrumpVal)) {
        m_nHighVal = m_nHighTrumpVal = nCardVal;
        m_pHighCard = pCard;
        m_nHighPos = nPos;
      }
    } else {
      // trump has not yet been played in this trick
      // see if this is the highest card of the suit led
      if ((nSuit == m_nSuitLed) && (nCardVal > m_nHighVal)) {
        m_nHighVal = nCardVal;
        m_nHighTrumpVal = 0;
        m_pHighCard = pCard;
        m_nHighPos = nPos;
      }
    }
  }
  // this is pending the addition of trump logic
  m_nRoundWinner = m_nHighPos;
  m_nRoundWinningTeam = (Team)GetPlayerTeam(m_nRoundWinner);

  // update play history
  UpdatePlayHistory();

  // see if we're on full auto
  if (m_bExpressPlayMode) {
    // proceed without stopping
    ClearTrick();
    return;
  }

  // declare winner if in interactive mode
  CString strMessage;
  strMessage.Format("%s wins the trick.", PositionToString(m_nRoundWinner));
  if (!m_bReviewingGame)
    strMessage += "  Click for the next round.";
  app_->SetStatusText(strMessage);

  // we don't finalize anything yet, since the last move can
  // still be taken back
  if (!m_bReviewingGame && !m_bBatchMode) {
    	app_->ClickForNextTrickMode();
  }
}



//
// ClearTrick()
//
// called after the user clicks to continue after playing a trick
//
void Deal::ClearTrick() {
  // inform the players
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RecordRoundComplete(m_nRoundWinner, m_pHighCard);

  // record trick in game record
  for (int i = 0; i < 4; i++)
    m_pGameTrick[m_numTricksPlayed][i] = m_pCurrTrick[i];
  m_numTricksWon[m_nRoundWinningTeam]++;
  m_nTrickWinner[m_numTricksPlayed] = m_nRoundWinner;
  m_numTricksPlayed++;
  m_numActualTricksPlayed++;

  // clear round
  m_numCardsPlayedInRound = 0;
  for (int i = 0; i < 4; i++)
    m_pCurrTrick[i] = NULL;

  // update counts
  if (!app_->IsInAutoTestMode()) {
    UpdatePlayHistory();
    app_->DisplayTricks();
    app_->DisplayTricksView();
  }
  //	m_nPlayRound++;

  // and prep for the next round
  m_nRoundLead = m_nRoundWinner;

  // ### TEMP ###
  ASSERT(m_nRoundLead >= 0);

  m_nCurrPlayer = m_nRoundLead;
  m_nTrickLead[m_numTricksPlayed] = m_nCurrPlayer;
  m_nRoundWinner = NONE;
  //	for(i=0;i<4;i++)
  //		m_pCurrTrick[i] = NULL;

  //
  if (m_bReviewingGame)
    return;

  //
  if (m_numTricksPlayed == 13) {
    // game is finished
    OnGameComplete();
  } else {
    // if we're playing normally (i.e., not auto playing through, 
    // _and_ not loading a saved position), then prompt the user and 
    // go on to the next round
    if (!m_bExpressPlayMode && !m_bBatchMode) {
      app_->PromptLead();
      app_->WaitCardPlayMode();
      BeginRound();
    } else if (!m_bBatchMode) {
      // else if we're playing through (and not not loading a saved position), 
      // automatically go on to the next round
      BeginRound();
    }
  }
}


//
// OnGameComplete()
//
//
void Deal::OnGameComplete() {
  // game over -- see if the contract was made
  app_->ClearStatusMessage();
  int nRqmt = BID_LEVEL(m_nContract) + 6;
  int nDiff = m_numTricksWon[m_nContractTeam] - nRqmt;
  CString strTeam = TeamToString(m_nContractTeam);
  CString strMessage, strOldMessage;

  // see if we're in autotest
  if (app_->IsInAutoTestMode()) {
    // simply return
    return;
  }

  // clear hints if enabled
  if (app_->GetAutoHintMode() > 0)
    app_->ClearAutoHints();

  // see if we're in practice mode using duplicate scoring
  if (!app_->IsRubberInProgress() && app_->IsUsingDuplicateScoring()) {
    // if duplicate scoring is enabled, get the score
    UpdateDuplicateScore();
    int nResult = (nDiff >= 0) ? (m_numTricksWon[m_nContractTeam] - 6) : nDiff;
    int nScore;
    if (nResult > 0)
      nScore = m_nTotalScore[m_nContractTeam];
    else
      nScore = -m_nTotalScore[m_nDefendingTeam];
    // check play mode
    strMessage.Format("%s Result = %s%d;  Score = %s%d.",
      strTeam,
      ((nResult < 0) ? "" : "+"), nResult,
      ((nScore < 0) ? "" : "+"), nScore);
  } else {
    // normal rubber or practice mode, no duplicate
    if (nDiff > 0) {
      strMessage.Format("%s made %d overtrick%s", strTeam, nDiff,
        (nDiff > 1) ? "s." : ".");
    } else if (nDiff < 0) {
      strMessage.Format("%s were set %d trick%s", strTeam, -nDiff,
        (nDiff < -1) ? "s." : ".");
    } else {
      strMessage.Format("%s made the contract.", strTeam);
    }
  }

  // format "old" message
  if (!m_bAutoReplayMode)
    strOldMessage = _T("You: ") + strMessage;

  // check the mode
  if (m_bAutoReplayMode)
    strMessage = _T("Computer: ") + strMessage;

  // inform the players
  if (!m_bReviewingGame) {
    for (int i = 0; i < 4; i++)
      m_pPlayer[i]->RecordHandComplete(nDiff);
  }

  // reset suit sequence w/ no dummy
  app_->InitDummySuitSequence(NONE, NONE);

  // show the original hands
  BOOL bCardsFaceUpMode = app_->AreCardsFaceUp();
  m_pPlayer[m_nDummy]->SetDummyFlag(FALSE);
  app_->SetShowCardsFaceUp(true);
  //
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RestoreInitialHand();

  // and force display of the original cards
  ResetDisplay();

  // if playing rubber, save the old score so the proper update is
  // done in the rubber score window
  if (app_->IsRubberInProgress()) {
    if (m_bAutoReplayMode) {
      // computer just replayed -- restore old score
      m_numTricksWon[m_nContractTeam] = m_numActualTricksWon;
    } else {
      // human played, so save actual score
      m_numActualTricksWon = m_numTricksWon[m_nContractTeam];
    }
  }

  // turn off game auto-play
  BOOL bReplayMode = m_bAutoReplayMode;	// but save setting first
  if (app_->IsFullAutoPlayMode() || app_->IsFullAutoExpressPlayMode()) {
    if (app_->IsFullAutoExpressPlayMode()) {
      app_->EndWaitCursorDoc();
    }
    app_->SetNormalPlayMode();
    m_bExpressPlayMode = FALSE;
    m_bAutoReplayMode = FALSE;
    //		pVIEW->EnableRefresh();		// not necessary due to ResetDisplay() above
  }

  // return here if reviewing game
  if (m_bReviewingGame) {
    app_->SetStatusMessage(strMessage);
    return;
  }

  // else prompt hand finished and optionally restart play/bid
  int roundFinishedDlgCode = app_->DisplayRoundFinishedDialog(bReplayMode, m_bGameReviewAvailable, strMessage, strOldMessage);

  if (roundFinishedDlgCode > -1) {
    // cancel, replay, or rebid the current hand
    app_->SetShowCardsFaceUp(bCardsFaceUpMode);
    switch (roundFinishedDlgCode) {
    case CRoundFinishedDialog::RF_NONE:
    {
      // return to just after the last trick
      for (int i = 0; i < 4; i++)
        m_pPlayer[i]->RemoveAllCardsFromHand();
      m_pPlayer[m_nDummy]->SetDummyFlag(TRUE);
      app_->RefreshScreen();
      app_->GameFinished();
      break;
    }

    case CRoundFinishedDialog::RF_REBID:
      app_->BidCurrentHand();
      break;

    case CRoundFinishedDialog::RF_REPLAY:
      // replay game
      app_->OnRestartCurrentHand();
      break;

    case CRoundFinishedDialog::RF_AUTOPLAY:
      ComputerReplay(FALSE);
      break;

    case CRoundFinishedDialog::RF_AUTOPLAY_FULL:
      ComputerReplay(TRUE);
      break;

    default:
      ASSERT(FALSE);
      break;
    }
    // return now
    return;
  }

  // restore the cards' face-up/down status
  app_->SetShowCardsFaceUp(bCardsFaceUpMode);

  //
  PostProcessGame();
}



//
// PostProcessGame()
//
void Deal::PostProcessGame() {
  // here, if we played from a game record, return
  if (m_bGameReviewAvailable) {
    // clean up dummy
    if (m_nDummy != SOUTH)
      m_pPlayer[m_nDummy]->ExposeCards(FALSE, FALSE);
    m_bExposeDummy = FALSE;
    m_bReviewingGame = TRUE;
    // and show game review dialog
    app_->RestoreGameReview();
    app_->MakeGameReviewDialogVisible();
    return;
  }

  // at this point, if we're playing rubber, show the score
  // else we're practicing, so just deal the next hand
  if (app_->IsRubberInProgress()) {
    // update score
    UpdateScore();
    // display score and deal next hand or end rubber as appropriate
    DisplayScore();
  } else {
    // else not playing rubber
    // but if using duplicate scoring, show the score
    //		if (theApp.IsUsingDuplicateScoring())
    //			DisplayDuplicateScore();

    // deal the next hand
    app_->OnDealNewHand();
  }
}







//
void Deal::UpdatePlayHistory() {
  //
  if (m_bSuppressPlayHistoryUpdate)
    return;

  //
  CString strPlays, strTemp, strPlaysPlain, strTempPlain;
  //
  int i, j;
  int nPos = m_nGameLead;
  if (nPos == NONE) {
    // not initialized yet
    app_->SetPlayHistory("");
    return;
  }

  // check resolution
  BOOL bSmallCards = app_->IsLowResOption();

  // check mode
  BOOL bUseSymbols = app_->IsUseSuitSymbols();

  //
  strPlays = "Trk ";
  for (i = 0; i < 4; i++) {
    // use suit letters
    if (bSmallCards)
      strTemp.Format("%-4s", PositionToShortString(nPos));
    else
      strTemp.Format("%-5s", PositionToString(nPos));
    strPlays += strTemp;
    strPlays += " ";
    nPos = GetNextPlayer(nPos);
  }
  if (bSmallCards)
    strPlays += "\r\n--- ---- ---- ---- ----\r\n";
  else
    strPlays += "\r\n--- ----- ----- ----- -----\r\n";

  // dup the string so far
  strPlaysPlain = strPlays;

  CString strSpace = "    ";

  // iterate over tricks
  int numRounds;
  // see if the game is finished -- if not, display n+1 tricks
  if (m_numTricksPlayed < 13)
    numRounds = Min(m_numActualTricksPlayed + 1, 13);
  else
    numRounds = Min(m_numActualTricksPlayed, 13);	// game's finished
  for (i = 0; i < numRounds; i++) {
    // display round #
    strTemp.Format("%2d: ", i + 1);
    // bail at this point if no cards played in this round
    if ((i == m_numActualTricksPlayed) && (m_numCardsPlayedInRound == 0)) {
      strPlays += strTemp + "\r\n";
      strPlaysPlain += strTemp + "\r\n";
      continue;
    }
    //
    strPlays += strTemp;
    strPlaysPlain += strTemp;
    nPos = m_nGameLead;
    for (j = 0; j < 4; j++) {
      strTemp = strTempPlain = " ";
      if (i < m_numActualTricksPlayed) {
        if (bUseSymbols) {
          // use suit symbols
          strTemp += FormString("%c%c", CCard::GetCardLetter(m_pGameTrick[i][nPos]->GetFaceValue()), (unsigned char)(tSuitLetter + m_pGameTrick[i][nPos]->GetSuit()));
        } else {
          // use suit letters
          strTemp += m_pGameTrick[i][nPos]->GetName();
        }
        //
        strTempPlain += m_pGameTrick[i][nPos]->GetName();
        //
        strTemp += bSmallCards ? "  " : "   ";
        strTempPlain += bSmallCards ? "  " : "   ";
      } else {
        if (m_pCurrTrick[nPos] != NULL) {
          if (bUseSymbols) {
            // use suit symbols
            strTemp += FormString("%c%c", CCard::GetCardLetter(m_pCurrTrick[nPos]->GetFaceValue()), (unsigned char)(tSuitLetter + m_pCurrTrick[nPos]->GetSuit()));
          } else {
            // use suit letters
            strTemp += m_pCurrTrick[nPos]->GetName();
          }
          //
          strTempPlain += m_pCurrTrick[nPos]->GetName();
          //
          strTemp += bSmallCards ? "  " : "   ";
          strTempPlain += bSmallCards ? "  " : "   ";
        } else {
          strTemp += bSmallCards ? "    " : "     ";
          strTempPlain += bSmallCards ? "    " : "     ";
        }
      }
      // if cards have been played, identify round lead
      if (((m_numActualTricksPlayed > 0) || (m_numCardsPlayedInRound > 0)) &&
        (nPos == m_nTrickLead[i])) {
        strTemp.SetAt(0, '(');
        strTemp.SetAt(3, ')');
        strTempPlain.SetAt(0, '(');
        strTempPlain.SetAt(3, ')');
      }
      // also identify round winners
      if (((i < m_numTricksPlayed) && (nPos == m_nTrickWinner[i])) ||
        ((i == m_numTricksPlayed) && (nPos == m_nRoundWinner))) {
        strTemp.SetAt(0, '*');
        strTemp.SetAt(3, '*');
        strTempPlain.SetAt(0, '*');
        strTempPlain.SetAt(3, '*');
      }
      strPlays += strTemp;
      strPlaysPlain += strTempPlain;
      nPos = GetNextPlayer(nPos);
    }
    if (i < m_numTricksPlayed) {
      strPlays += "\r\n";
      strPlaysPlain += "\r\n";
    }
  }

  // mark any skipped tricks
  for (; i < m_numTricksPlayed; i++) {
    strPlays += FormString("%2d: Skipped\r\n", i + 1);
    strPlaysPlain += FormString("%2d: Skipped\r\n", i + 1);
  }

  //
  app_->SetPlayHistory(strPlays, bUseSymbols);
  app_->SetPlainPlayHistory((LPCTSTR)strPlaysPlain);
}



//
// ClaimTricks() 
//
void Deal::ClaimTricks(int nPos, int numTricks) {
  m_numActualTricksPlayed = m_numTricksPlayed;
  int numRemainingTricks = 13 - m_numTricksPlayed;
  m_nRoundWinningTeam = (Team)GetPlayerTeam(nPos);
  // default # of tricks claimed = all remaining
  int numTricksToClaim;
  if (numTricks == 0)
    numTricksToClaim = 13 - m_numTricksPlayed;
  else
    numTricksToClaim = numTricks;
  //
  for (int i = m_numTricksPlayed; i < 13; i++, numTricksToClaim--) {
    // increment tricks won for a side
    if (numTricksToClaim > 0)
      m_numTricksWon[m_nRoundWinningTeam]++;
    else
      m_numTricksWon[GetOpposingTeam(m_nRoundWinningTeam)]++;
    m_numTricksPlayed++;
    // clear trick record
    for (int j = 0; j < 4; j++)
      m_pGameTrick[i][j] = NULL;
  }

  // clear the current round
  for (int i = 0; i < 4; i++)
    m_pCurrTrick[i] = NULL;

  // mark the game complete
  //	theApp.SetValue(tbGameInProgress, FALSE);

  // update display
  UpdatePlayHistory();
  // and inform the players
  if (!m_bReviewingGame) {
    for (int i = 0; i < 4; i++)
      m_pPlayer[i]->RecordSpecialEvent(EVENT_CLAIMED, nPos, numRemainingTricks);
  }

  // and continue
  OnGameComplete();
}



//
// ConcedeTricks() 
//
void Deal::ConcedeTricks(int nPos) {
  // process the concession
  m_numActualTricksPlayed = m_numTricksPlayed;
  int numRemainingTricks = 13 - m_numTricksPlayed;
  int nConcedingTeam = GetPlayerTeam(nPos);
  m_nRoundWinningTeam = (nConcedingTeam == NORTH_SOUTH) ? EAST_WEST : NORTH_SOUTH;
  for (int i = m_numTricksPlayed; i < 13; i++) {
    // increment tricks won
    m_numTricksWon[m_nRoundWinningTeam]++;
    m_numTricksPlayed++;
    // clear trick record
    for (int j = 0; j < 4; j++)
      m_pGameTrick[i][j] = NULL;
  }

  // clear the current round
  for (int i = 0; i < 4; i++)
    m_pCurrTrick[i] = NULL;

  // mark the game complete
  //	theApp.SetValue(tbGameInProgress, FALSE);

  // update display
  UpdatePlayHistory();

  // and inform the players
  if (!m_bReviewingGame) {
    for (int i = 0; i < 4; i++)
      m_pPlayer[i]->RecordSpecialEvent(EVENT_CONCEDED, nPos, numRemainingTricks);
  }

  // and continue
  OnGameComplete();
}


//
void Deal::RestoreInitialHands() {
  ClearPlayInfo();
  for (int i = 0; i < 4; i++)
    m_pPlayer[i]->RestoreInitialHand();
}


//
// ComputerReplay()
//
void Deal::ComputerReplay(BOOL bFullAuto) {
  // this routine is similar to OnRestartCurrentHand() above, but 
  // slightly different, as the view will launch play immediately
  if (!app_->IsGameInProgress())
    return;

  // restart the hands, but don't update the view yet
  RestartCurrentHand(FALSE);

  // set flags before updating the view
  m_bAutoReplayMode = TRUE;
  m_bExpressPlayMode = bFullAuto;
  app_->HideAutoHintDialog();
  if (!bFullAuto)
    app_->SetStatusMessage("Click to begin computer replay.");
  app_->SetModeIndicator();

  // NOW we update the view, as everything is finally ready
  if (!bFullAuto)
    app_->RestartPlay();

  // and send the program into auto play mode
  app_->SetAutoPlayMode(bFullAuto);
}



//
//=======================================================
//
// Utilities
//

//
void Deal::UpdateDisplay() {
  // update is a simple redraw
  app_->UpdateDisplay();
}

//
void Deal::RefreshDisplay() {
  // refresh is suit rest + redraw
  app_->RefreshDisplay();
}

//
void Deal::ResetDisplay() {
  // reset is complete reset + redraw
  app_->ResetDisplay();
}

//
int Deal::GetBidByPlayer(CPlayer* pPlayer, int nRound) const {
  return m_nBidsByPlayer[pPlayer->GetPosition()][nRound];
}


//
BOOL Deal::WasTrumpPlayed() const {
  int nIndex = m_nRoundLead;
  //
  for (int i = 0; i < m_numCardsPlayedInRound; i++) {
    CCard* pCard = m_pCurrTrick[nIndex];
    if ((pCard) && (pCard->GetSuit() == m_nTrumpSuit))
      return TRUE;
    nIndex = GetNextPlayer(nIndex);
  }
  return FALSE;
}


//
CCard* Deal::GetCurrentTrickCardByOrder(int nOrder) const {
  if ((nOrder < 0) || (nOrder >= m_numCardsPlayedInRound))
    return NULL;
  int nIndex = m_nRoundLead;
  for (int i = 0; i < nOrder; i++)
    nIndex = GetNextPlayer(nIndex);
  //
  ASSERT(m_pCurrTrick[nIndex] != NULL);
  return m_pCurrTrick[nIndex];
}


//
// GetCurrentTrickHighCard()
//
// returns the current high card for the trick
//
CCard* Deal::GetCurrentTrickHighCard(int* nPos) const {
  // set the round lead as the initial high card
  int nHighPos = m_nRoundLead;
  CCard* pHighCard = m_pCurrTrick[m_nRoundLead];
  if (pHighCard == NULL)
    return NULL;
  int nSuit = pHighCard->GetSuit();
  // and start comparing with the second player
  int nIndex = GetNextPlayer(m_nRoundLead);
  // see if a trump was played in this round
  BOOL bTrumpPlayed = WasTrumpPlayed();
  //
  for (int i = 0; i < m_numCardsPlayedInRound - 1; i++) {
    CCard* pCard = m_pCurrTrick[nIndex];
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
      if (pHighCard->GetSuit() == m_nTrumpSuit) {
        // in that case, only a higher trump will do
        if ((pCard->GetSuit() == m_nTrumpSuit) &&
          (*pCard > *pHighCard)) {
          pHighCard = pCard;
          nHighPos = nIndex;
        }
      } else if (pCard->GetSuit() == m_nTrumpSuit) {
        // else curent high card is not a trump, 
        // so any trump that's played is tops
        pHighCard = pCard;
        nHighPos = nIndex;
      }
    }
    // advance to the next player
    nIndex = GetNextPlayer(nIndex);
  }
  //
  if (nPos)
    *nPos = nHighPos;
  return pHighCard;
}


//
const CString Deal::GetContractString() const {
  return ContractToString(m_nContract, m_nContractModifier);
}

//
const CString Deal::GetFullContractString() const {
  return ContractToFullString(m_nContract, m_nContractModifier);
}




//
// IsHintAvailable()
//
BOOL Deal::IsHintAvailable() {
  if ((app_->IsBiddingInProgress() && (m_nLastBiddingHint >= 0) && m_bHintFollowed) ||
    (app_->IsGameInProgress() && m_pLastPlayHint))
    return TRUE;
  else
    return FALSE;
}


//
// ShowAutoHint()
//
void Deal::ShowAutoHint() {
  // see if auto hints are enabled
  if (!app_->IsAutoHintEnabled()) {
    // no auto hints
    // still, if we're bidding & we're South, get a fake bid 
    // to fill out internal variables
    if (app_->IsBiddingInProgress() && (m_nCurrPlayer == SOUTH)) {
      // this is a terrible hack, but it's necessary to keep from 
      // screwing up the internal state variables
      m_pPlayer[m_nCurrPlayer]->SetTestBiddingMode(true);
      m_pPlayer[m_nCurrPlayer]->BidInternal();
      m_pPlayer[m_nCurrPlayer]->SetTestBiddingMode(false);
    }
    return;
  }

  // no more hints if user didn't follow our previous advice
  if (app_->IsBiddingInProgress() && !m_bHintFollowed)
    return;

  //
  BOOL bCanGiveHint = FALSE;
  if (m_nCurrPlayer == SOUTH)
    bCanGiveHint = TRUE;
  if (app_->IsGameInProgress() && (m_nContractTeam == NORTH_SOUTH) &&
    (m_nCurrPlayer == NORTH))
    bCanGiveHint = TRUE;
  //
  if (!bCanGiveHint)
    return;

  // 
  app_->ShowAutoHintDialog();
  if (app_->IsBiddingInProgress()) {
    // get the hint
    m_bHintMode = FALSE;
    app_->EnableHintDialog();
    int nBid = m_pPlayer[SOUTH]->GetBiddingHint(TRUE);
    app_->FlashBidDialogButton(nBid);
    m_nLastBiddingHint = nBid;
  } else if (app_->IsGameInProgress()) {
    // get the play hint
    CCard* pCard = m_pPlayer[m_nCurrPlayer]->GetPlayHint(TRUE);
    if (pCard) {
      app_->EnableHintDialog();
      pCard->FlashCard(app_->GetWindowDC());
      // save the hint as pending hint
      m_pLastPlayHint = pCard;
    }
  }
}



//
// GetGameHint()
//
void Deal::GetGameHint(BOOL bAutoHintRequest) {
  // hints are invalid if the user ignored our previous bidding hint
  //	if (theApp.IsBiddingInProgress() && !m_bHintFollowed)
  //		return;

  // 
  if (app_->IsBiddingInProgress()) {
    // see if a hint is pending
    if (m_nLastBiddingHint >= 0) {
      // accept the hint
      app_->RegisterBid(m_nLastBiddingHint);
      // clear hint info
      //			m_nLastBiddingHint = NONE;
      //			CAutoHintDialog* pHintDlg = (CAutoHintDialog*) pMAINFRAME->GetDialog(twAutoHintDialog);
      //			pHintDlg->Clear();
    } else {
      // no hint given yet, and a hint was requested
      // reject a manual request if auto hints are on (wait for auto hint to be generated)
      if (!bAutoHintRequest && (app_->GetAutoHintMode() > 0))
        return;
      // get the hint
      m_bHintMode = FALSE;
      //			m_nLastBiddingHint = m_pPlayer[SOUTH]->GetBiddingHint();
      m_nLastBiddingHint = m_pPlayer[m_nCurrPlayer]->GetBiddingHint();
      app_->FlashBidDialogButton(m_nLastBiddingHint);
    }
  } else if (app_->IsGameInProgress()) {
    // special code -- allow a <space> to be used to clear a trick
    if (m_numCardsPlayedInRound == 4) {
      if (app_->IsInClickForNextTrickMode()) {
        app_->ClearTable();
        ClearTrick();
      }
      //
      return;
    }

    // see if a hint is pending
    if (m_pLastPlayHint) {
      // accept the hint
      app_->SetStatusText("Playing hint card...");
      ASSERT(m_pLastPlayHint->GetOwner() == m_nCurrPlayer);
      app_->PlayCard(m_pLastPlayHint, 1000);
      // clear hint info
      m_pLastPlayHint = NULL;
      //			CAutoHintDialog* pHintDlg = (CAutoHintDialog*) pMAINFRAME->GetDialog(twAutoHintDialog);
      //			pHintDlg->Clear();
    } else {
      // no hint given yet, and a hint was requested
      // reject a manual request if auto hints are on (wait for auto hint to be generated)
      if (!bAutoHintRequest && (app_->GetAutoHintMode() > 0))
        return;
      // get the hint
      CCard* pCard = m_pPlayer[m_nCurrPlayer]->GetPlayHint();
      if (pCard) {
        pCard->FlashCard(app_->GetWindowDC());
        // save the hint as pending hint
        m_pLastPlayHint = pCard;
      } else {
        AfxMessageBox("No hint available.");
      }
    }
  }
}



//
//==================================================================
//
//
// Utilities
//
//
//==================================================================
//


//
// FormatOriginalHands()
//
CString Deal::FormatOriginalHands() {
  CString strHands;

  // write out North
  CCardList& northCards = m_pPlayer[NORTH]->GetHand().GetInitialHand();
  int numCards = northCards.GetNumCards();
  for (int nSuit = SPADES; nSuit >= CLUBS; nSuit--) {
    strHands += CString(' ', 16) + CCard::GetSuitLetter(nSuit) + ": ";
    for (int nIndex = 0; nIndex < numCards; nIndex++) {
      if (northCards[nIndex]->GetSuit() != nSuit)
        continue;
      strHands += northCards[nIndex]->GetCardLetter();
      strHands += ' ';
    }
    strHands += "\r\n";
  }

  // write out West & East
  CCardList& westCards = m_pPlayer[WEST]->GetHand().GetInitialHand();
  CCardList& eastCards = m_pPlayer[EAST]->GetHand().GetInitialHand();
  int numWestCards = westCards.GetNumCards();
  int numEastCards = eastCards.GetNumCards();
  CString strTemp;
  for (int nSuit = SPADES; nSuit >= CLUBS; nSuit--) {
    strHands += CString(CCard::GetSuitLetter(nSuit)) + ": ";
    int nCount = 3;
    // show west suit
    for (int nIndex = 0; nIndex < numWestCards; nIndex++) {
      if (westCards[nIndex]->GetSuit() != nSuit)
        continue;
      strHands += westCards[nIndex]->GetCardLetter();
      strHands += ' ';
      nCount += 2;
    }
    // pad out to 32 chars
    strHands += CString(' ', 32 - nCount);
    strHands += CString(CCard::GetSuitLetter(nSuit)) + ": ";
    // show east suit
    for (int nIndex = 0; nIndex < numEastCards; nIndex++) {
      if (eastCards[nIndex]->GetSuit() != nSuit)
        continue;
      strHands += eastCards[nIndex]->GetCardLetter();
      strHands += ' ';
    }
    strHands += "\r\n";
  }
  strHands += strTemp;

  // write out South
  CCardList& southCards = m_pPlayer[SOUTH]->GetHand().GetInitialHand();
  numCards = southCards.GetNumCards();
  for (int nSuit = SPADES; nSuit >= CLUBS; nSuit--) {
    strHands += CString(' ', 16) + CCard::GetSuitLetter(nSuit) + ": ";
    for (int nIndex = 0; nIndex < numCards; nIndex++) {
      if (southCards[nIndex]->GetSuit() != nSuit)
        continue;
      strHands += southCards[nIndex]->GetCardLetter();
      strHands += ' ';
    }
    strHands += "\r\n";
  }

  //
  return strHands;
}



//
// FormatCurrentHands()
//
CString Deal::FormatCurrentHands() {
  CString strHands;

  // write out North
  CCardList& northCards = m_pPlayer[NORTH]->GetHand();
  int numCards = northCards.GetNumCards();
  for (int nSuit = SPADES; nSuit >= CLUBS; nSuit--) {
    strHands += CString(' ', 16) + CCard::GetSuitLetter(nSuit) + ": ";
    for (int nIndex = 0; nIndex < numCards; nIndex++) {
      if (northCards[nIndex]->GetSuit() != nSuit)
        continue;
      strHands += northCards[nIndex]->GetCardLetter();
      strHands += ' ';
    }
    strHands += "\r\n";
  }

  // write out West & East
  CCardList& westCards = m_pPlayer[WEST]->GetHand();
  CCardList& eastCards = m_pPlayer[EAST]->GetHand();
  int numWestCards = westCards.GetNumCards();
  int numEastCards = eastCards.GetNumCards();
  CString strTemp;
  for (int nSuit = SPADES; nSuit >= CLUBS; nSuit--) {
    strHands += CString(CCard::GetSuitLetter(nSuit)) + ": ";
    int nCount = 3;
    // show west suit
    for (int nIndex = 0; nIndex < numWestCards; nIndex++) {
      if (westCards[nIndex]->GetSuit() != nSuit)
        continue;
      strHands += westCards[nIndex]->GetCardLetter();
      strHands += ' ';
      nCount += 2;
    }
    // pad out to 32 chars
    strHands += CString(' ', 32 - nCount);
    strHands += CString(CCard::GetSuitLetter(nSuit)) + ": ";
    // show east suit
    for (int nIndex = 0; nIndex < numEastCards; nIndex++) {
      if (eastCards[nIndex]->GetSuit() != nSuit)
        continue;
      strHands += eastCards[nIndex]->GetCardLetter();
      strHands += ' ';
    }
    strHands += "\r\n";
  }
  strHands += strTemp;

  // write out South
  CCardList& southCards = m_pPlayer[SOUTH]->GetHand();
  numCards = southCards.GetNumCards();
  for (int nSuit = SPADES; nSuit >= CLUBS; nSuit--) {
    strHands += CString(' ', 16) + CCard::GetSuitLetter(nSuit) + ": ";
    for (int nIndex = 0; nIndex < numCards; nIndex++) {
      if (southCards[nIndex]->GetSuit() != nSuit)
        continue;
      strHands += southCards[nIndex]->GetCardLetter();
      strHands += ' ';
    }
    strHands += "\r\n";
  }

  //
  return strHands;
}




//
// GetDealIDString()
//
CString Deal::GetDealIDString() {
  CString strDealID;
  if (m_bDealNumberAvailable && app_->IsEnableDealNumbering()) {
    strDealID.Format("%08lX", m_nDealNumber);

    // appended code = vulnerability + dealer
    int nAppend = (m_nVulnerableTeam << 2) | m_nDealer;
    strDealID += FormString("%1X", (BYTE)(nAppend & 0x0F));

    // append special deal code if necessary
    if (m_nSpecialDealCode != 0)
      strDealID += FormString("%2X", (BYTE)(m_nSpecialDealCode & 0xFF));
  }
  //
  return strDealID;
}




void Deal::InitNewDocument() {
  // do init
  if (app_->IsRubberInProgress() || app_->IsUsingDuplicateScoring()) {
    InitNewMatch();
  } else {
    InitNewGame();
  }

  // done
  m_bInitialized = TRUE;
}


void Deal::DealNumberedHand(int dealer, int vulnerability, int specialDealCode, int dealNumber) {
  // set vulnerability & dealer
  m_nDealer = dealer;
  m_nCurrPlayer = m_nDealer;
  m_nVulnerableTeam = (Team)vulnerability;
  if ((m_nVulnerableTeam == NORTH_SOUTH) || (m_nVulnerableTeam == BOTH))
    m_bVulnerable[NORTH_SOUTH] = TRUE;
  if ((m_nVulnerableTeam == EAST_WEST) || (m_nVulnerableTeam == BOTH))
    m_bVulnerable[EAST_WEST] = TRUE;

  // and call the appropriate function to deal a new hand
  m_nSpecialDealCode = specialDealCode;
  if (m_nSpecialDealCode == 0) {
    DealHands(TRUE, dealNumber);
  } else {
    DealSpecial(dealNumber, m_nSpecialDealCode);
  }
}

bool Deal::PlayClaimTricks() {
  // player claiming tricks
  int nPos = GetHumanPlayerPos();
  // may be claiming as declarer or defender
  // if human has contract, get the declarer, be it human or computer partner
  if ((nPos == NORTH) || (nPos == SOUTH))
    nPos = GetDeclarerPosition();

  // and check the claim
  int numTricksRequired = 13 - m_numTricksPlayed;
  int numClaimableTricks = m_pPlayer[nPos]->GetNumClaimableTricks();
  if (numClaimableTricks < numTricksRequired) {
    AfxMessageBox(FormString("The claim isn't evident yet -- you have only %d clear tricks versus %d more required.\nPlease play on.", numClaimableTricks, numTricksRequired), MB_ICONINFORMATION);
    return false;
  }
  
  // process the claim
  ClaimTricks(nPos);
  return true;
}

bool Deal::PlayClaimContract() {
  // player claiming enough tricks for contract -- can only do so as declarer or dummy
  int nPos = GetHumanPlayerPos();
  // may be claiming as declarer or defender
  // if human has contract, get the declarer, be it human or computer partner
  if ((nPos != NORTH) && (nPos != SOUTH)) {
    AfxMessageBox("You cannot claim the contract when defending.");
    return true;
  }

  // and check the claim
  int numTricksRequired = 6 + m_nContractLevel;
  int numTricksLeft = numTricksRequired - m_numTricksWon[GetPlayerTeam(nPos)];
  int numClaimableTricks = m_pPlayer[nPos]->GetNumClaimableTricks();
  if (numClaimableTricks < numTricksLeft) {
    AfxMessageBox(FormString("The claim isn't evident yet -- you have only %d clear tricks versus %d more required.\nPlease play on.", numClaimableTricks, numTricksLeft), MB_ICONINFORMATION);
    return true;
  }

  // process the claim -- credit the player for all claimable tricks
  ClaimTricks(nPos, numClaimableTricks);
  return false;
}


void Deal::SwapPositionsAlreadyInPlay(int pos1, int pos2) {
  // play has started
  SwapPartialHands(pos1, pos2);
  ResetDisplay();
  GetPlayer(pos1)->InitializeSwappedHand();
  GetPlayer(pos2)->InitializeSwappedHand();
}


bool Deal::IsGameNotFinished() {
  return app_->IsGameInProgress() && GetNumTricksPlayed() < 13;
}
