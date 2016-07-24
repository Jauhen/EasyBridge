//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// dealmjpg.h : header file
//
#include <memory>
class Settings;

/////////////////////////////////////////////////////////////////////////////
// CDealOptsMajorsPage dialog

class CDealOptsMajorsPage : public CPropertyPage
{
	DECLARE_DYNCREATE(CDealOptsMajorsPage)

	friend class CDealOptionsPropSheet;

// routines
private:
	void Update();

// data
private:
  std::shared_ptr<Settings>	m_app;


// Construction
public:
	CDealOptsMajorsPage(std::shared_ptr<Settings> pApp=NULL);
	~CDealOptsMajorsPage();

// Dialog Data
	//{{AFX_DATA(CDealOptsMajorsPage)
	enum { IDD = IDP_DEAL_MAJORS };
	int		m_nMinCardsInSuit;
	int		m_nMinSuitTopper;
	int		m_nMinTeamDistribution;
	//}}AFX_DATA


// Overrides
	// ClassWizard generate virtual function overrides
	//{{AFX_VIRTUAL(CDealOptsMajorsPage)
	protected:
	virtual void DoDataExchange(CDataExchange* pDX);    // DDX/DDV support
	//}}AFX_VIRTUAL

// Implementation
protected:
	// Generated message map functions
	//{{AFX_MSG(CDealOptsMajorsPage)
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()

};
