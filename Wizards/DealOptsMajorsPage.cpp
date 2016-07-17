//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// DealOptsMajorsPage.cpp : implementation file
//

#include "stdafx.h"
#include "resource.h"
#include "model/settings.h"
#include "DealOptsMajorsPage.h"

#ifdef _DEBUG
#undef THIS_FILE
static char BASED_CODE THIS_FILE[] = __FILE__;
#endif

#define ACE	14

/////////////////////////////////////////////////////////////////////////////
// CDealOptsMajorsPage property page

IMPLEMENT_DYNCREATE(CDealOptsMajorsPage, CPropertyPage)

CDealOptsMajorsPage::CDealOptsMajorsPage(Settings* pApp) : 
		CPropertyPage(CDealOptsMajorsPage::IDD),
		m_app(*pApp)
{
	//{{AFX_DATA_INIT(CDealOptsMajorsPage)
	m_nMinCardsInSuit = -1;
	m_nMinSuitTopper = -1;
	m_nMinTeamDistribution = -1;
	//}}AFX_DATA_INIT
	m_nMinCardsInSuit = m_app.GetMinCardsInMajor() - 7;
	m_nMinSuitTopper = ACE - m_app.GetMinTopMajorCard();
	m_nMinTeamDistribution = m_app.GetMinSuitDistributions(1);
}

CDealOptsMajorsPage::~CDealOptsMajorsPage()
{
}

void CDealOptsMajorsPage::DoDataExchange(CDataExchange* pDX)
{
	CPropertyPage::DoDataExchange(pDX);
	//{{AFX_DATA_MAP(CDealOptsMajorsPage)
	DDX_Radio(pDX, IDC_RADIO1, m_nMinCardsInSuit);
	DDX_Radio(pDX, IDC_RADIO4, m_nMinSuitTopper);
	DDX_Radio(pDX, IDC_RADIO7, m_nMinTeamDistribution);
	//}}AFX_DATA_MAP
}


BEGIN_MESSAGE_MAP(CDealOptsMajorsPage, CPropertyPage)
	//{{AFX_MSG_MAP(CDealOptsMajorsPage)
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()


/////////////////////////////////////////////////////////////////////////////
// CDealOptsMajorsPage message handlers



//
void CDealOptsMajorsPage::Update()
{
	// store results
	m_app.SetMinCardsInMajor(m_nMinCardsInSuit + 7);
	m_app.SetMinTopMajorCard(ACE - m_nMinSuitTopper);
	m_app.SetMinSuitDistributions(m_nMinTeamDistribution, 1);
}
