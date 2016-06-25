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
#include "EasyB.h"
#include "EasyBdoc.h"
#include "EasyBvw.h"
#include "mainfrm.h"
#include "progopts.h"
#include "docopts.h"
#include "engine/playeropts.h"
#include "filecodePBN.h"
#include "engine/Player.h"
#include "engine/Card.h"
#include "MainFrameOpts.h"
#include "engine/play/HandHoldings.h"
#include "engine/play/CardHoldings.h"

#ifdef _DEBUG
#undef THIS_FILE
static char BASED_CODE THIS_FILE[] = __FILE__;
#endif


extern const char* tszTagName[];
static CFile* pFile;

static void SkipLine();
static void WriteLine(const CString& strValue);
static void WriteLine(int nLineCode, int nValue);
static void WriteLine(int nLineCode, const CString& strValue);
static void WriteComment(const CString& strValue);


//
//---------------------------------------------------------
//
// PBN File output routine
//
BOOL CEasyBDoc::WriteFilePBN(CArchive& ar) 
{
	pFile = ar.GetFile();
	ASSERT(pFile != NULL);

	// write header
	WriteComment("");
	WriteComment("EXPORT");
	WriteComment("PBN Format 1.0");
	WriteComment(FormString("File generated by Easy Bridge version %s", theApp.GetProgramVersionString()));
	WriteComment("");

	//
	// write the data
	//

	// Event tag
	WriteLine(TAG_EVENT, FormString("%s Game", theApp.GetValue(tstrProgramTitle)));

	// Site Tag
	WriteLine(TAG_SITE, "");

	// Date Tag
	CTime time = CTime::GetCurrentTime();
	WriteLine(TAG_DATE, time.Format("%Y.%m.%d"));

/*
 * skip the round tag -- no longer mandatory in PBN 0.91+
 *
	// Round Tag
	WriteLine(TAG_ROUND, "");
 */

	// Board Tag
	WriteLine(TAG_BOARD, "");

	// West/North/East/South Tags
	WriteLine(TAG_WEST, "Computer");
	WriteLine(TAG_NORTH, "Computer");
	WriteLine(TAG_EAST, "Computer");
	WriteLine(TAG_SOUTH, "Human Player");

	// Dealer Tag
	WriteLine(TAG_DEALER, FormString("%c", PositionToChar(m_nDealer_deal)));

	// Vulnerable Tag
	CString strVulnerable;
	if ((m_bVulnerable_deal[NORTH_SOUTH]) && (m_bVulnerable_deal[EAST_WEST]))
		strVulnerable = "Both";
	else if (m_bVulnerable_deal[NORTH_SOUTH])
		strVulnerable = "NS";
	else if (m_bVulnerable_deal[EAST_WEST])
		strVulnerable = "EW";
	else
		strVulnerable = "None";
	WriteLine(TAG_VULNERABLE, strVulnerable);

	// deal tag
	CString strDeal = "W:";
	int nPos = WEST;
	for(int i=0;i<4;i++)
	{
		CCardHoldings& cards = m_pPlayer_deal[nPos]->GetHand().GetInitialHand();
		strDeal += cards.GetGIBFormatHoldingsString();
		nPos = GetNextPlayer(nPos);
		if (i < 3)
			strDeal += ' ';
	}
	WriteLine(TAG_DEAL, strDeal);

	// Scoring tag
	if (theApp.IsRubberInProgress())
		WriteLine(TAG_SCORING, _T("Rubber"));
	else
		WriteLine(TAG_SCORING, _T("None"));

	// Declarer Tag
	if (ISPOSITION(m_nDeclarer_deal))
		WriteLine(TAG_DECLARER, FormString("%c", PositionToChar(m_nDeclarer_deal)));
	else
		WriteLine(TAG_DECLARER, "?");

	// Contract Tag
	if (ISBID(m_nContract_deal))
		WriteLine(TAG_CONTRACT, ContractToString(m_nContract_deal));
	else
		WriteLine(TAG_CONTRACT, "?");

	// Result tag
	if (m_numTricksPlayed_deal == 13)
		WriteLine(TAG_RESULT, FormString("\"%d\"",m_numTricksWon_deal[m_nContractTeam_deal]));
	else
		WriteLine(TAG_RESULT, "?");

	//
	// write out the hands in comment form
	//
	CString strHands = "{\r\n" + pDOC->FormatOriginalHands() + "}";
	WriteLine(strHands);

	//
	// write out auction
	//
	CString strBids = FormString("[AUCTION \"%c\"]", PositionToChar(m_nDealer_deal));
	if (m_numBidsMade_deal > 0)
		strBids += "\r\n";
	nPos = m_nDealer_deal;
	for(int i=0;i<m_numBidsMade_deal;i++)
	{
		strBids += FormString("%s ", ::BidToPBNString(m_nBiddingHistory_deal[i]));
		nPos = ::GetNextPlayer(nPos);
		if ( (((i+1) % 4) == 0) && (i < m_numBidsMade_deal-1) )
			strBids += "\r\n";
	}
	// add marker if needed
	if (!ISBID(m_nContract_deal))
		strBids += "\r\n*";
	// and write out
	WriteLine(strBids);


	//
	// write out plays
	//
	CString strPlays = FormString("[PLAY \"%c\"]", PositionToChar(m_nGameLead_deal));
	if (m_numTricksPlayed_deal> 0)
		strPlays += "\r\n";
	for(int i=0;i<m_numTricksPlayed_deal;i++)
	{
		int nPos = m_nGameLead_deal;
		for(int j=0;j<4;j++)
		{
			CCard* pCard = m_pGameTrick_deal[i][nPos];
			if (pCard == NULL)
				strPlays += "-  ";
			else
				strPlays += FormString("%s ", pCard->GetName());
			nPos = ::GetNextPlayer(nPos);
		}
		if (i < m_numTricksPlayed_deal-1)
			strPlays += "\r\n";
	}
	// add marker if needed
	if (m_numTricksPlayed_deal < 13)
		strPlays += "\r\n*";
	// and write out
	WriteLine(strPlays);


	// Generator Tag
	WriteLine(TAG_GENERATOR, FormString("Easy Bridge version %s", theApp.GetProgramVersionString()));

	// Description Tag
	WriteLine(TAG_DESCRIPTION, m_strFileDescription);

	// blank line
//	SkipLine();

	//
	// write out the auction
	//

	//	
	// All done
	//
	ar.Flush();
	return TRUE;
}







//
static void SkipLine()
{
	pFile->Write(CString("\r\n"), 2);
}


//
static void WriteLine(const CString& strLine)
{
	pFile->Write(strLine + "\r\n", strLine.GetLength() + 2);
}


//
static void WriteLine(int nLineCode, int nValue)
{
	if ((nLineCode < 0) || (nLineCode > NUM_TAGS))
		return;
	CString strTag = tszTagName[nLineCode];
	strTag.MakeUpper();
	CString strTemp = FormString("[%s \"%d\"]", strTag, nValue);
	WriteLine(strTemp);
}


//
static void WriteLine(int nLineCode, const CString& strValue)
{
	if ((nLineCode < 0) || (nLineCode > NUM_TAGS))
		return;
	CString strTag = tszTagName[nLineCode];
	strTag.MakeUpper();
	CString strTemp =FormString("[%s \"%s\"]", strTag, strValue);
	WriteLine(strTemp);
}


//
static void WriteComment(const CString& strValue)
{
	CString strTemp;
	strTemp.Format("%% %s", strValue);
	WriteLine(strTemp);
}
