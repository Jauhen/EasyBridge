//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

// EasyB.h : main header file for the EASYB application
//
#ifndef __EASYB_H__
#define __EASYB_H__

#ifndef __AFXWIN_H__
	#error include 'stdafx.h' before including this file for PCH
#endif

#include "../resource.h"       // main symbols
#include "defines.h"        // other global info
#include "model/globals.h"
#include "ObjectWithProperties.h"
#include "EventProcessor.h"
#include <memory>
#include "model/settings.h"

class AppInterface;
class ConventionPool;
class CDeck;
class CPlayer;
class CGIB;
class CConventionSet;
class CSplashWnd;
class CNeuralNet;
extern const LPCTSTR szSuitName[];


/////////////////////////////////////////////////////////////////////////////
// CEasyBApp:
// See EasyB.cpp for the implementation of this class
//

#define DllImport   __declspec( dllimport )


class CEasyBApp : public Settings, public CWinApp, public CObjectWithProperties, public CEventProcessor
{
public:
	enum { PLAY_NORMAL, PLAY_MANUAL, PLAY_MANUAL_DEFEND, PLAY_FULL_AUTO, PLAY_FULL_AUTO_EXPRESS };

// public routines
public:
	// property get/set operations
	LPVOID GetValuePV(int nItem, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	LPCTSTR GetValueString(int nItem, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	double GetValueDouble(int nItem, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	int GetValue(int nItem, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	int SetValuePV(int nItem, LPVOID value, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	int SetValue(int nItem, double fValue, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	int SetValue(int nItem, LPCTSTR szValue=NULL, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	int SetValue(int nItem, int nValue, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	int SetValueDouble(int nItem, double fValue, int nIndex1=0, int nIndex2=0, int nIndex3=0);
	// Event Processor
	bool Notify(long lCode, long param1=0, long param2=0, long param3=0) { return false; }
	//
	CString GetProgramTitle() { return m_strProgTitle; }
	CString GetProgramVersionString();
	CString GetFullProgramVersionString();
	CWnd* GetFrame() { return m_pMainWnd; }
	int GetMinimumOpeningValue(CPlayer* pPlayer=NULL) const;
	// inline functions
	BOOL AreCardsFaceUp() const;
	void SetCardsFaceUp(BOOL bFaceUp); 
	int GetLHO(int nPos) const { return GetNextPlayer(nPos); }
	int GetRHO(int nPos) const { return GetPrevPlayer(nPos); }
	int	GetCurrentConvention() const { return m_nCurrConventionSet; }
	int	GetSuitSequence(int nIndex) const { return m_nSuitSequence[nIndex]; }
	void SetSuitSequence(int nIndex, int nValue) { m_nSuitSequence[nIndex] = nValue; }
	int	GetDummySuitSequence(int nIndex) const { return m_nDummySuitSequence[nIndex]; }
	void InitDummySuitSequence(int nTrumpSuit, int nDummyPosition=NONE);
	void InitPointCountRequirements();
	double GetBiddingAgressiveness() const { return m_fBiddingAggressiveness; }
	int	GetSuitSequenceOption() const { return m_nSuitSeqOption; }
	LPCTSTR GetSuitName(int nSuit) const { return szSuitName[nSuit]; }
	BOOL InExpressAutoPlay() const { return (m_nPlayMode == PLAY_FULL_AUTO_EXPRESS); }
	BOOL IsAutoHintEnabled() const { return (m_nAutoHintMode > 0); }
	int GetAutoHintLevel() const { return m_nAutoHintMode; }
	int GetNumAcesRequiredForSlam(int nIndex) const { return m_numAcesForSlam[nIndex]; }
	int GetNumKingsRequiredForSlam(int nIndex) const { return m_numKingsForSlam[nIndex]; }
	void SetNumAcesRequiredForSlam(int nIndex, int nCount) { m_numAcesForSlam[nIndex] = nCount; }
	void SetNumKingsRequiredForSlam(int nIndex, int nCount) { m_numKingsForSlam[nIndex] = nCount; }
	double GetHonorValue() const;
	CGIB* GetGIB() { return m_pGIBWrapper; }
  std::shared_ptr<ConventionPool> GetConventionPool() {
    return conventionPool_;
  };
  std::shared_ptr<CDeck> GetDeck() {
    return deck_;
  }
//	CNeuralNet* GetNeuralNet() { return m_pNeuralNet; }

// static data
public:

// pricate data
private:
	// prog info
	CString		m_strProgTitle;
	CString		m_strProgPath;
	CString		m_strProgDirectory;
	int			m_nProgVersion[4];
	int			m_nProgMajorVersion;
	int			m_nProgMinorVersion;
	int			m_nProgIncrementVersion;
	int			m_nProgBuildNumber;
	CString	    m_strProgCopyright;
	CString		m_strProgBuildDate;
	CString		m_strSpecialBuildCode;
	//
	CDocument* m_pActiveDocument;
	//




	// GIB options
	CGIB*	m_pGIBWrapper;

	//
	// Platform info
	//
	int		m_nWinMajorVer; // Windows Platform Major Version #
	int		m_nWinMinorVer; // Windows Platform Minor Version #
	int		m_nWinBuildNum; // Windows Platform Build #
	int		m_nWinMode;		// 0 = NT, 1 = Chicago, 2 = Win32s
	BOOL	m_bWin32;		// Win32 flag
	//
	CSplashWnd*	m_pSplash;
	DWORD 		m_dwSplashTime;

  // global deck objects
  std::shared_ptr<CDeck>	deck_;
  std::shared_ptr<ConventionPool> conventionPool_;

// internal routines
public:
	CEasyBApp(std::shared_ptr<AppInterface> app);
private:
	void Initialize();
	void Terminate();
	void InitSettings();
	void InitNeuralNet();
	void CloseNeuralNet();
	void SetSuitSequence(int nSeq);
	// helpful functions
	int	MinimumOpeningValue(CPlayer* pPlayer=NULL);

// Overrides
	// ClassWizard generated virtual function overrides
	//{{AFX_VIRTUAL(CEasyBApp)
	public:
	virtual BOOL InitInstance();
	virtual int ExitInstance();
	//}}AFX_VIRTUAL

// Implementation

	//{{AFX_MSG(CEasyBApp)
	afx_msg void OnAppAbout();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()
};


/////////////////////////////////////////////////////////////////////////////

extern CEasyBApp theApp;
extern std::shared_ptr<AppInterface> appImpl;
extern CConventionSet* pConventionSet[];
extern CConventionSet* pCurrConvSet;

#endif
