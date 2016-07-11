//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

// saveopts.cpp : implementation file
//

#include "stdafx.h"
#include "EasyB.h"
#include "model/EasyBDoc.h"
#include "saveopts.h"
#include "progopts.h"
#include "../Help/HelpCode.h"

#ifdef _DEBUG
#undef THIS_FILE
static char BASED_CODE THIS_FILE[] = __FILE__;
#endif

/////////////////////////////////////////////////////////////////////////////
// CFileSaveOptionsDlg dialog


CFileSaveOptionsDlg::CFileSaveOptionsDlg(CWnd* pParent /*=NULL*/)
	: CDialog(CFileSaveOptionsDlg::IDD, pParent)
{
	//{{AFX_DATA_INIT(CFileSaveOptionsDlg)
	m_bShowComments = FALSE;
	m_bShowBiddingHistory = FALSE;
	m_bShowPlayHistory = FALSE;
	m_bShowAnalyses = FALSE;
	m_bSaveWestAnalysis = FALSE;
	m_bSaveEastAnalysis = FALSE;
	m_bSaveSouthAnalysis = FALSE;
	m_bSaveNorthAnalysis = FALSE;
	m_bSaveIntermediatePositions = FALSE;
	//}}AFX_DATA_INIT
	CEasyBDoc* pDoc = CEasyBDoc::GetDoc();
	m_bShowComments = pDoc->GetDeal()->IsShowCommentsUponOpen();
	m_bShowBiddingHistory = pDoc->GetDeal()->IsShowBidHistoryUponOpen();
	m_bShowPlayHistory = pDoc->GetDeal()->IsShowPlayHistoryUponOpen();
	m_bShowAnalyses = pDoc->GetDeal()->IsShowAnalysesUponOpen();
	m_bSaveSouthAnalysis = pDoc->GetDeal()->IsSavePlayerAnalysis(SOUTH);
	m_bSaveWestAnalysis = pDoc->GetDeal()->IsSavePlayerAnalysis(WEST);
	m_bSaveNorthAnalysis = pDoc->GetDeal()->IsSavePlayerAnalysis(NORTH);
	m_bSaveEastAnalysis = pDoc->GetDeal()->IsSavePlayerAnalysis(EAST);
	m_bSaveIntermediatePositions = pDoc->GetDeal()->IsSaveIntermediatePositions();
}


void CFileSaveOptionsDlg::DoDataExchange(CDataExchange* pDX)
{
	CDialog::DoDataExchange(pDX);
	//{{AFX_DATA_MAP(CFileSaveOptionsDlg)
	DDX_Check(pDX, IDC_SHOW_FILE_COMMENTS, m_bShowComments);
	DDX_Check(pDX, IDC_SHOW_BID_HISTORY, m_bShowBiddingHistory);
	DDX_Check(pDX, IDC_SHOW_PLAY_HISTORY, m_bShowPlayHistory);
	DDX_Check(pDX, IDC_CHECK4, m_bShowAnalyses);
	DDX_Check(pDX, IDC_CHECK5, m_bSaveWestAnalysis);
	DDX_Check(pDX, IDC_CHECK7, m_bSaveEastAnalysis);
	DDX_Check(pDX, IDC_CHECK8, m_bSaveSouthAnalysis);
	DDX_Check(pDX, IDC_CHECK6, m_bSaveNorthAnalysis);
	DDX_Check(pDX, IDC_SAVE_POSITIONS, m_bSaveIntermediatePositions);
	//}}AFX_DATA_MAP
}


BEGIN_MESSAGE_MAP(CFileSaveOptionsDlg, CDialog)
	//{{AFX_MSG_MAP(CFileSaveOptionsDlg)
	ON_BN_CLICKED(IDOK, OnOk)
	ON_WM_HELPINFO()
	ON_BN_CLICKED(IDHELP, OnHelp)
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()


/////////////////////////////////////////////////////////////////////////////
// CFileSaveOptionsDlg message handlers

void CFileSaveOptionsDlg::OnOk() 
{
	UpdateData(TRUE);
	CEasyBDoc* pDoc = CEasyBDoc::GetDoc();
	pDoc->GetDeal()->ShowCommentsUponOpen(m_bShowComments);
	pDoc->GetDeal()->ShowBidHistoryUponOpen(m_bShowBiddingHistory);
	pDoc->GetDeal()->ShowPlayHistoryUponOpen(m_bShowPlayHistory);
	pDoc->GetDeal()->ShowAnalysesUponOpen(m_bShowAnalyses);
	pDoc->GetDeal()->SavePlayerAnalysis(SOUTH, m_bSaveSouthAnalysis);
	pDoc->GetDeal()->SavePlayerAnalysis(WEST, m_bSaveWestAnalysis);
	pDoc->GetDeal()->SavePlayerAnalysis(NORTH, m_bSaveNorthAnalysis);
	pDoc->GetDeal()->SavePlayerAnalysis(EAST, m_bSaveEastAnalysis);
	pDoc->GetDeal()->SaveIntermediatePositions(m_bSaveIntermediatePositions);
	EndDialog(TRUE);	
}

//
void CFileSaveOptionsDlg::OnCancel() 
{
	EndDialog(FALSE);	
//	CDialog::OnCancel();
}

//
void CFileSaveOptionsDlg::OnHelp() 
{
	WinHelp(DIALOG_FILE_SAVE_OPTIONS);
}

//
BOOL CFileSaveOptionsDlg::OnHelpInfo(HELPINFO* pHelpInfo) 
{
	OnHelp();
	return TRUE;
}

