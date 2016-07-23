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


/////////////////////////////////////////////////////////////////////////////
// CEasyBApp:
// See EasyB.cpp for the implementation of this class
//

#define DllImport   __declspec( dllimport )


class CEasyBApp : private Settings, public CWinApp, public CEventProcessor
{
public:

// public routines
public:
	// Event Processor
	bool Notify(long lCode, long param1=0, long param2=0, long param3=0) { return false; }
	//
	CWnd* GetFrame() { return m_pMainWnd; }
	// inline functions
	BOOL AreCardsFaceUpSettings() const;
	void SetCardsFaceUp(BOOL bFaceUp); 
	CGIB* GetGIB() { return m_pGIBWrapper; }
  std::shared_ptr<ConventionPool> GetConventionPool() { return conventionPool_; };
  std::shared_ptr<CDeck> GetDeck() { return deck_; }
  Settings* GetSettings() { return settings_; }

  virtual int ReadIntConfig(const char* section, const char* entry, int defaultValue);
  virtual std::string ReadStringConfig(const char* section, const char* entry, const char* defaultValue);
  virtual void WriteIntConfig(const char* section, const char* entry, int value);
  virtual void WriteStringConfig(const char* section, const char* entry, const char* value);

//	CNeuralNet* GetNeuralNet() { return m_pNeuralNet; }

// static data
public:

// pricate data
private:
  Settings* settings_;

	// GIB options
	CGIB*	m_pGIBWrapper;

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
	void InitSettings();

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
