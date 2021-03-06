//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// DealOptsMiscPage.cpp : implementation file
//

#include "stdafx.h"
#include "resource.h"
#include "model/settings.h"
#include "DealOptsMiscPage.h"

#ifdef _DEBUG
#define new DEBUG_NEW
#undef THIS_FILE
static char THIS_FILE[] = __FILE__;
#endif

/////////////////////////////////////////////////////////////////////////////
// CDealOptsMiscPage property page

IMPLEMENT_DYNCREATE(CDealOptsMiscPage, CPropertyPage)

CDealOptsMiscPage::CDealOptsMiscPage(std::shared_ptr<Settings> pApp) :
		CPropertyPage(CDealOptsMiscPage::IDD),
		m_app(pApp)
{
	//{{AFX_DATA_INIT(CDealOptsMiscPage)
	m_bBalanceHands = FALSE;
	m_bGiveSouthBestHand = FALSE;
	m_bEnableDealNumbering = FALSE;
	//}}AFX_DATA_INIT
	m_bBalanceHands = m_app->GetBalanceTeamHands();
	m_bGiveSouthBestHand = m_app->GetGiveSouthBestHandInPartnership();
	m_bEnableDealNumbering = m_app->GetEnableDealNumbering();
	//m_bGiveSouthBestHandInGame = m_app->GetValue(tbGiveSouthBestHandInGame);
}

CDealOptsMiscPage::~CDealOptsMiscPage()
{
}

void CDealOptsMiscPage::DoDataExchange(CDataExchange* pDX)
{
	CPropertyPage::DoDataExchange(pDX);
	//{{AFX_DATA_MAP(CDealOptsMiscPage)
	DDX_Check(pDX, IDC_BALANCE_HANDS, m_bBalanceHands);
	DDX_Check(pDX, IDC_GIVE_SOUTH_BEST_HAND, m_bGiveSouthBestHand);
	DDX_Check(pDX, IDC_ENABLE_DEAL_NUMBERING, m_bEnableDealNumbering);
	//}}AFX_DATA_MAP
}


BEGIN_MESSAGE_MAP(CDealOptsMiscPage, CPropertyPage)
	//{{AFX_MSG_MAP(CDealOptsMiscPage)
		// NOTE: the ClassWizard will add message map macros here
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// CDealOptsMiscPage message handlers


//
void CDealOptsMiscPage::Update()
{
	// validate inputs
	m_app->SetGiveSouthBestHandInPartnership(m_bGiveSouthBestHand);
	//m_app->SetValue(tbGiveSouthBestHandInGame,m_bGiveSouthBestHandInGame);
	m_app->SetBalanceTeamHands(m_bBalanceHands);
	m_app->SetEnableDealNumbering(m_bEnableDealNumbering);
}

