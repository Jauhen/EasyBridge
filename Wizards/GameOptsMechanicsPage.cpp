//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// GameOptsMechanicsPage.cpp : implementation file
//

#include "stdafx.h"
#include "model/settings.h"
#include "resource.h"
#include "ObjectWithProperties.h"
#include "GameOptsMechanicsPage.h"
#include "progopts.h"

#ifdef _DEBUG
#undef THIS_FILE
static char BASED_CODE THIS_FILE[] = __FILE__;
#endif

/////////////////////////////////////////////////////////////////////////////
// CGameOptsMechanicsPage property page

IMPLEMENT_DYNCREATE(CGameOptsMechanicsPage, CPropertyPage)

CGameOptsMechanicsPage::CGameOptsMechanicsPage(Settings* pApp) :
		CPropertyPage(CGameOptsMechanicsPage::IDD),
		m_app(*pApp)
{
	//{{AFX_DATA_INIT(CGameOptsMechanicsPage)
	m_bAutoBidStart = FALSE;
	m_bComputerCanClaim = FALSE;
	m_bAllowRebidPassedHand = FALSE;
	m_bShowPassedHands = FALSE;
	m_bEnableAnalysisTracing = FALSE;
	m_bEnableAnalysisDuringHints = FALSE;
	m_nTraceLevel = -1;
	//}}AFX_DATA_INIT
	m_bAutoBidStart = m_app.GetAutoBidStart();
	m_bAllowRebidPassedHand = m_app.GetAllowRebidPassedHands();
	m_bShowPassedHands = m_app.GetShowPassedHands();
	m_bEnableAnalysisTracing = m_app.GetEnableAnalysisTracing();
	m_bEnableAnalysisDuringHints = m_app.GetEnableAnalysisDuringHints();
	m_nTraceLevel = m_app.GetAnalysisTraceLevel() - 1;
	m_bComputerCanClaim = m_app.GetComputerCanClaim();
}

CGameOptsMechanicsPage::~CGameOptsMechanicsPage()
{
}

void CGameOptsMechanicsPage::DoDataExchange(CDataExchange* pDX)
{
	CPropertyPage::DoDataExchange(pDX);
	//{{AFX_DATA_MAP(CGameOptsMechanicsPage)
	DDX_Check(pDX, IDC_AUTO_START_BIDDING, m_bAutoBidStart);
	DDX_Check(pDX, IDC_COMPUTER_CAN_CLAIM, m_bComputerCanClaim);
	DDX_Check(pDX, IDC_ALLOW_REBID_PASSED_HANDS, m_bAllowRebidPassedHand);
	DDX_Check(pDX, IDC_SHOW_PASSED_HANDS, m_bShowPassedHands);
	DDX_Check(pDX, IDC_ENABLE_ANALYSIS_TRACING, m_bEnableAnalysisTracing);
	DDX_Check(pDX, IDC_ENABLE_TRACING_DURING_HINTS, m_bEnableAnalysisDuringHints);
	DDX_CBIndex(pDX, IDC_TRACE_LEVEL, m_nTraceLevel);
	DDX_Control(pDX, IDC_TRACE_LEVEL, m_listTraceLevel);
	//}}AFX_DATA_MAP
}


BEGIN_MESSAGE_MAP(CGameOptsMechanicsPage, CPropertyPage)
	//{{AFX_MSG_MAP(CGameOptsMechanicsPage)
	ON_BN_CLICKED(IDC_ENABLE_ANALYSIS_TRACING, OnEnableAnalysisTracing)
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()


/////////////////////////////////////////////////////////////////////////////
// CGameOptsMechanicsPage message handlers



//
void CGameOptsMechanicsPage::Update()
{
	// store results
	m_app.SetAutoBidStart(m_bAutoBidStart);
	m_app.SetComputerCanClaim(m_bComputerCanClaim);
	m_app.SetAllowRebidPassedHands(m_bAllowRebidPassedHand);
	m_app.SetShowPassedHands(m_bShowPassedHands);
	m_app.SetEnableAnalysisTracing(m_bEnableAnalysisTracing);
	m_app.SetAnalysisTraceLevel(m_nTraceLevel + 1);
	m_app.SetEnableAnalysisDuringHints(m_bEnableAnalysisDuringHints);
}


void CGameOptsMechanicsPage::OnEnableAnalysisTracing() 
{
	UpdateData(TRUE);
	m_listTraceLevel.EnableWindow(m_bEnableAnalysisTracing);
}

