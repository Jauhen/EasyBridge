//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// GameOptsMechanicsPage.h : header file
//
#include <memory>
class Settings;

/////////////////////////////////////////////////////////////////////////////
// CGameOptsMechanicsPage dialog

class CGameOptsMechanicsPage : public CPropertyPage
{
	DECLARE_DYNCREATE(CGameOptsMechanicsPage)

// operations
public:
	void Update();

// data
private:
  std::shared_ptr<Settings>	m_app;


// Construction
public:
	CGameOptsMechanicsPage(std::shared_ptr<Settings> pApp=NULL);
	~CGameOptsMechanicsPage();

// Dialog Data
	//{{AFX_DATA(CGameOptsMechanicsPage)
	enum { IDD = IDP_GAME_MECHANICS };
	CComboBox	m_listTraceLevel;
	BOOL	m_bAutoBidStart;
	BOOL	m_bComputerCanClaim;
	BOOL	m_bAllowRebidPassedHand;
	BOOL	m_bShowPassedHands;
	BOOL	m_bEnableAnalysisTracing;
	BOOL	m_bEnableAnalysisDuringHints;
	int		m_nTraceLevel;
	//}}AFX_DATA


// Overrides
	// ClassWizard generate virtual function overrides
	//{{AFX_VIRTUAL(CGameOptsMechanicsPage)
	protected:
	virtual void DoDataExchange(CDataExchange* pDX);    // DDX/DDV support
	//}}AFX_VIRTUAL

// Implementation
protected:
	// Generated message map functions
	//{{AFX_MSG(CGameOptsMechanicsPage)
	afx_msg void OnEnableAnalysisTracing();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()

};
