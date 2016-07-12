//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

// WrfilePBN.cpp : implementation of PBN file writing
//

#include "stdafx.h"
#include "engine/playeropts.h"
#include "model/filecodePBN.h"
#include "engine/Player.h"
#include "engine/Card.h"
#include "engine/play/HandHoldings.h"
#include "engine/play/CardHoldings.h"
#include "model/deal.h"
#include "model/file_exporter.h"

#ifdef _DEBUG
#undef THIS_FILE
static char BASED_CODE THIS_FILE[] = __FILE__;
#endif


extern const char* tszTagName[];


//
//---------------------------------------------------------
//
// PBN File output routine
//
std::string Deal::WriteFilePBN() {
  FileExporter fe{};

  // write header
  fe.WriteComment("");
  fe.WriteComment("EXPORT");
  fe.WriteComment("PBN Format 1.0");
  fe.WriteComment((const char*)FormString("File generated by Easy Bridge version %s", app_->GetProgramVersionString()));
  fe.WriteComment("");

  //
  // write the data
  //

  // Event tag
  fe.WriteLine(TAG_EVENT, (const char*)FormString("%s Game", app_->GetProgramTitle()));

  // Site Tag
  fe.WriteLine(TAG_SITE, "");

  // Date Tag
  fe.WriteLine(TAG_DATE, app_->GetToday());

  /*
  * skip the round tag -- no longer mandatory in PBN 0.91+
  *
  // Round Tag
  WriteLine(TAG_ROUND, "");
  */

  // Board Tag
  fe.WriteLine(TAG_BOARD, "");

  // West/North/East/South Tags
  fe.WriteLine(TAG_WEST, "Computer");
  fe.WriteLine(TAG_NORTH, "Computer");
  fe.WriteLine(TAG_EAST, "Computer");
  fe.WriteLine(TAG_SOUTH, "Human Player");

  // Dealer Tag
  fe.WriteLine(TAG_DEALER, (const char*)FormString("%c", PositionToChar(m_nDealer)));

  // Vulnerable Tag
  std::string strVulnerable;
  if ((m_bVulnerable[NORTH_SOUTH]) && (m_bVulnerable[EAST_WEST]))
    strVulnerable = "Both";
  else if (m_bVulnerable[NORTH_SOUTH])
    strVulnerable = "NS";
  else if (m_bVulnerable[EAST_WEST])
    strVulnerable = "EW";
  else
    strVulnerable = "None";
  fe.WriteLine(TAG_VULNERABLE, strVulnerable);

  // deal tag
  std::string strDeal = "W:";
  int nPos = WEST;
  for (int i = 0; i<4; i++) {
    CCardHoldings& cards = m_pPlayer[nPos]->GetHand().GetInitialHand();
    strDeal += cards.GetGIBFormatHoldingsString();
    nPos = GetNextPlayer(nPos);
    if (i < 3)
      strDeal += ' ';
  }
  fe.WriteLine(TAG_DEAL, strDeal);

  // Scoring tag
  if (app_->IsRubberInProgress())
    fe.WriteLine(TAG_SCORING, _T("Rubber"));
  else
    fe.WriteLine(TAG_SCORING, _T("None"));

  // Declarer Tag
  if (ISPOSITION(m_nDeclarer))
    fe.WriteLine(TAG_DECLARER, (const char*)FormString("%c", PositionToChar(m_nDeclarer)));
  else
    fe.WriteLine(TAG_DECLARER, "?");

  // Contract Tag
  if (ISBID(m_nContract))
    fe.WriteLine(TAG_CONTRACT, (const char*)ContractToString(m_nContract, 0));
  else
    fe.WriteLine(TAG_CONTRACT, "?");

  // Result tag
  if (m_numTricksPlayed == 13)
    fe.WriteLine(TAG_RESULT, (const char*)FormString("\"%d\"", m_numTricksWon[m_nContractTeam]));
  else
    fe.WriteLine(TAG_RESULT, "?");

  //
  // write out the hands in comment form
  //
  std::string strHands = std::string("{\n") + (const char*)FormatOriginalHands() + "}";
  fe.WriteLine(strHands);

  //
  // write out auction
  //
  std::string strBids = (const char*)FormString("[AUCTION \"%c\"]", PositionToChar(m_nDealer));
  if (m_numBidsMade > 0)
    strBids += "\n";
  nPos = m_nDealer;
  for (int i = 0; i<m_numBidsMade; i++) {
    strBids += (const char*)FormString("%s ", BidToPBNString(m_nBiddingHistory[i]));
    nPos = GetNextPlayer(nPos);
    if ((((i + 1) % 4) == 0) && (i < m_numBidsMade - 1))
      strBids += "\n";
  }
  // add marker if needed
  if (!ISBID(m_nContract))
    strBids += "\n*";
  // and write out
  fe.WriteLine(strBids);


  //
  // write out plays
  //
  std::string strPlays = (const char*)FormString("[PLAY \"%c\"]", PositionToChar(m_nGameLead));
  if (m_numTricksPlayed> 0)
    strPlays += "\n";
  for (int i = 0; i<m_numTricksPlayed; i++) {
    int nPos = m_nGameLead;
    for (int j = 0; j<4; j++) {
      CCard* pCard = m_pGameTrick[i][nPos];
      if (pCard == NULL)
        strPlays += "-  ";
      else
        strPlays += FormString("%s ", pCard->GetName());
      nPos = GetNextPlayer(nPos);
    }
    if (i < m_numTricksPlayed - 1)
      strPlays += "\n";
  }
  // add marker if needed
  if (m_numTricksPlayed < 13)
    strPlays += "\n*";
  // and write out
  fe.WriteLine(strPlays);


  // Generator Tag
  fe.WriteLine(TAG_GENERATOR, (const char*)FormString("Easy Bridge version %s", app_->GetProgramVersionString()));

  // Description Tag
  fe.WriteLine(TAG_DESCRIPTION, (const char*)m_strFileDescription);

  // blank line
  //	SkipLine();

  //
  // write out the auction
  //

  //	
  // All done
  //
  return fe.GetFileContent();
}
