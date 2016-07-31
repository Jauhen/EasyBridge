//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// EasyB.cpp : Defines the class behaviors for the application.
//

#include "stdafx.h"
#include <string>
#include "EasyB.h"
#include "mainfrm.h"
#include "EasyBdoc.h"
#include "EasyBvw.h"
#include "engine/Player.h"
#include "engine/bidding/bidopts.h"
#include "engine/bidding/bidparams.h"
#include "engine/bidding/ConventionSet.h"
#include "engine/bidding/convention_pool.h"
#include "engine/deck.h"
#include "engine/card.h"
#include "SplashWnd.h"
#include "GIB.h"
//#include "NeuralNet.h"
#include "engine/play/Play.h"
#include <mmsystem.h>
#include "AppImpl.h"

#ifdef _DEBUG
#undef THIS_FILE
static char BASED_CODE THIS_FILE[] = __FILE__;
#endif



//const LPCTSTR szPosition[4] = { "South", "West", "North", "East" };

//const LPCTSTR tszAppAboutWAVFile = _T("Ocean.wav");

// global pointer to the current convention set
CConventionSet* pCurrConvSet = NULL;

// neural net settings
const int tnumNNetInputs				= 350;
//const int tnumNNetOutputs				= 38;
const int tnumNNetOutputs				= 608;
const int tnumNNetHiddenLayers			= 1;
const int tnumNNetNodesPerHiddenLayer	= 100;


/////////////////////////////////////////////////////////////////////////////
//
// Global Variables
//
/////////////////////////////////////////////////////////////////////////////

//
std::shared_ptr<AppInterface> appImpl = std::make_shared<AppImpl>();
CEasyBApp theApp{ appImpl };
CConventionSet* pConventionSet[100];



/////////////////////////////////////////////////////////////////////////////
// CEasyBApp

BEGIN_MESSAGE_MAP(CEasyBApp, CWinApp)
	//{{AFX_MSG_MAP(CEasyBApp)
	ON_COMMAND(ID_APP_ABOUT, &CEasyBApp::OnAppAbout)
	//}}AFX_MSG_MAP
	// Standard file based document commands
	ON_COMMAND(ID_FILE_NEW, CWinApp::OnFileNew)
//	ON_COMMAND(ID_FILE_OPEN, OnFileOpen)
	// Standard print setup command
	ON_COMMAND(ID_FILE_PRINT_SETUP, CWinApp::OnFilePrintSetup)
END_MESSAGE_MAP()





/////////////////////////////////////////////////////////////////////////////
// CEasyBApp construction

struct null_deleter {
  void operator()(void const *) const {}
};

CEasyBApp::CEasyBApp(std::shared_ptr<AppInterface> app) {
  conventionPool_ = std::make_shared<ConventionPool>(app);
  deck_ = std::make_shared<CDeck>(app);
  std::shared_ptr<Settings> set(static_cast<Settings*>(this), null_deleter());
  settings_ = set;
	// TODO: add construction code here,
	// Place all significant initialization in InitInstance
}



/////////////////////////////////////////////////////////////////////////////
//
// Utilities
//
/////////////////////////////////////////////////////////////////////////////

//
BOOL CEasyBApp::AreCardsFaceUpSettings() const
{ 
	// see if the face-up flag is set
	if (settings_->GetShowCardsFaceUp())
		return TRUE;

	// else see if we're doing something that causes cards to be face up
	return pVIEW->AreCardsFaceUp(); 
}

//
void CEasyBApp::SetCardsFaceUp(BOOL bFaceUp) 
{ 
  settings_->SetShowCardsFaceUp(bFaceUp);
	pVIEW->Notify(WM_COMMAND, WMS_RESET_DISPLAY, TRUE);
}




/////////////////////////////////////////////////////////////////////////////
//
// CEasyBApp initialization
//
/////////////////////////////////////////////////////////////////////////////

BOOL CEasyBApp::InitInstance()
{
	// Obtain operating system version info
	OSVERSIONINFO versionInfo;
	versionInfo.dwOSVersionInfoSize = sizeof(versionInfo);
	GetVersionEx(&versionInfo);
  settings_->SetVersion(versionInfo);

  if (versionInfo.dwPlatformId == VER_PLATFORM_WIN32s) {
    SetHandleCount(100);
  } else if(versionInfo.dwPlatformId != VER_PLATFORM_WIN32_NT) {
    AfxEnableWin40Compatibility();
  }

	// obtain program version info
  CString progPath {};
	LPTSTR szProgPath = progPath.GetBuffer(1024);
	GetModuleFileName(m_hInstance, szProgPath, 1023);
	DWORD dummy;
	DWORD nFileVersionInfoSize = ::GetFileVersionInfoSize(szProgPath, &dummy);
	LPVOID pVersionBuffer = malloc(nFileVersionInfoSize);
	VERIFY(pVersionBuffer);
	GetFileVersionInfo(szProgPath, (DWORD)0, nFileVersionInfoSize, pVersionBuffer);
  progPath.ReleaseBuffer();
  settings_->SetProgPath(progPath);

  UINT nInfoLength;

	// get version # string
	LPVOID pVersionData;
	VerQueryValue(pVersionBuffer, TEXT("\\StringFileInfo\\040904b0\\ProductVersion"), &pVersionData, &nInfoLength);
  settings_->ParseVersion((LPCTSTR)pVersionData);

	// get copyright string
	LPVOID pCopyrightData;
	VerQueryValue(pVersionBuffer, TEXT("\\StringFileInfo\\040904b0\\LegalCopyright"), &pCopyrightData, &nInfoLength);
  settings_->SetProgramCopyright((LPCTSTR)pCopyrightData);

	// get build #
	LPVOID pBuildNumData;
	VerQueryValue(pVersionBuffer, TEXT("\\StringFileInfo\\040904b0\\PrivateBuild"), &pBuildNumData, &nInfoLength);
  settings_->ParseBuildNumber((LPCTSTR)pBuildNumData);

	// get build date	
	LPVOID pBuildDateData;
	VerQueryValue(pVersionBuffer, TEXT("\\StringFileInfo\\040904b0\\Comments"), &pBuildDateData, &nInfoLength);
  settings_->SetProgramBuildDate((LPCTSTR) pBuildDateData);

	// get special code
	LPVOID pSpecialBuildData;
	if (VerQueryValue(pVersionBuffer, TEXT("\\StringFileInfo\\040904b0\\SpecialBuild"), &pSpecialBuildData, &nInfoLength))
    settings_->SetSpecialBuildCode((LPCTSTR) pSpecialBuildData);
	else
    settings_->SetSpecialBuildCode("");

	// free the version memory
	free(pVersionBuffer);
	
  settings_->ExtractStartupDirectory();

	// set registry info
	if (settings_->GetWin32())
#ifdef RDEBUG
		SetRegistryKey("Steve's Software (RDebug)");	// ReleaseDebug
#elif defined _DEBUG
		SetRegistryKey("Steve's Software (Debug)");		// Debug
#else
		SetRegistryKey("Steve's Software");				// Release
#endif

	//
	Enable3dControls();

	// load main program settings from the registry
  settings_->Initialize();

	// show splash window
	if (false && (m_lpCmdLine[0] == 0) && IsShowSplashWindow())
//			&& (!m_bFirstTimeRunning)) 
	{
		m_pSplash = new CSplashWnd;
		m_pSplash->Create(NULL);
		m_pSplash->ShowWindow(SW_SHOW);
		m_pSplash->UpdateWindow();
		m_pSplash->m_timer = m_pSplash->SetTimer(1, 2000, NULL);
		m_dwSplashTime = ::GetCurrentTime();
	}

	// load other registry settings
//	Initialize();
	LoadStdProfileSettings(5);  // Load standard INI file options (including MRU)

	// and do other inits
  InitSettings();

	//
	// primary inits done, ready to proceed with creating the doc/view
	//

	// check for the registry key indicating first time running
	static TCHAR BASED_CODE szFirstTime[] = _T("First Time Running");
	if (GetProfileInt("Game Options", szFirstTime, 0) > 0)
	{
    settings_->SetFirstTimeRunning(true);
		WriteProfileInt("Game Options", szFirstTime, 0);
	}
	else
	{
    settings_->SetFirstTimeRunning(false);
  }

	// Register the application's document templates.  Document templates
	//  serve as the connection between documents, frame windows and views.
	CSingleDocTemplate* pDocTemplate;
	pDocTemplate = new CSingleDocTemplate(
		IDR_MAINFRAME,
		RUNTIME_CLASS(CEasyBDoc),
		RUNTIME_CLASS(CMainFrame),       // main SDI frame window
		RUNTIME_CLASS(CEasyBView));
	AddDocTemplate(pDocTemplate);
/*
	// add another template for PBN files
	CSingleDocTemplate* pDocTemplatePBN;
	pDocTemplatePBN = new CSingleDocTemplate(
		IDR_PBN_TYPE,
		RUNTIME_CLASS(CEasyBDoc),
		RUNTIME_CLASS(CMainFrame), 
		RUNTIME_CLASS(CEasyBView));
	AddDocTemplate(pDocTemplatePBN);
*/

	// Enable DDE Execute open
	EnableShellOpen();
	RegisterShellFileTypes();

	// create a new (empty) document
	OnFileNew();

//	UINT nToolbars[] = { IDR_MAINFRAME_TOOLBAR, IDR_SECONDARY_TOOLBAR, IDR_TEST_TOOLBAR, IDR_TOOLBAR_HIDDEN_BUTTONS };
//	((CMainFrame*)m_pMainWnd)->InitializeMenu(IDR_MAINFRAME, nToolbars, sizeof(nToolbars) / sizeof(UINT));

	// now that the main window has been created, we can create the cards
	deck_->Initialize();
	// and shuffle the deck
	deck_->Shuffle();

	// initialize the neural net engine
//	m_pNeuralNet = NULL;
//	InitNeuralNet();

	// Enable drag/drop open
	m_pMainWnd->DragAcceptFiles();

	// initialize main frame and document
//	pMAINFRAME->Initialize();

	// now we can safely open an existing document, if so specified
	if (m_lpCmdLine[0] != '\0')	
		OpenDocumentFile(m_lpCmdLine);

	// all done
	return TRUE;
}


//
int CEasyBApp::ExitInstance() 
{
	// Destroy the cards
	deck_->Terminate();

	// and delete the conventions
  for (int i = 0; i < GetConventionSetsNumber(); i++) {
    pConventionSet[i]->Terminate();	// save settings
    delete pConventionSet[i];		// then delete
  }
	
	// delete the GIB wrapper
	delete m_pGIBWrapper;

	// cose out the neural net
//	CloseNeuralNet();

	// perform play class static uninitialization
	CPlay::ClassTerminate();
	
	// and save application settings
  settings_->Terminate();
	
	//
	return CWinApp::ExitInstance();
}




//
// InitSetttings()
//
// - performs primary program initialization tasks
//
void CEasyBApp::InitSettings()
{
  settings_->InitSettings();

	// load program title string
  CString title {};
  title.LoadString(IDS_APPTITLE);
  settings_->SetProgramTitle(title);

	// create the GIB Wrapper
	m_pGIBWrapper = new CGIB();

	// init the GIB object
//	m_gibWrapper.Initialize();

	// initialize conventions
	pConventionSet[0] = new CConventionSet(appImpl);
	pConventionSet[0]->Initialize("Default");	// read in settings
	pConventionSet[0]->InitConventions();		// and prepare conventions
	pCurrConvSet = pConventionSet[0];

	// perform play class static initialization
	CPlay::ClassInitialize();
	// done
}



int CEasyBApp::ReadIntConfig(const char* section, const char* entry, int defaultValue) {
	return GetProfileInt(section, entry, defaultValue);
}

std::string CEasyBApp::ReadStringConfig(const char* section, const char* entry, const char* defaultValue) {
	CString val = GetProfileString(section, entry, defaultValue);
	return std::string(val.GetString());
}

void CEasyBApp::WriteIntConfig(const char* section, const char* entry, int value) {
	WriteProfileInt(section, entry, value);
}

void CEasyBApp::WriteStringConfig(const char* section, const char* entry, const char* value) {
	WriteProfileString(section, entry, value);
}


/*
//
// InitNeuralNet()
//
// - initialize the neural net engine
//
void CEasyBApp::InitNeuralNet()
{
	// close any existing
	CloseNeuralNet();

	// see if we have a valid neural net file path
	BOOL bExisting = !m_strNeuralNetFile.IsEmpty();
	if (bExisting)
	{
		// load the existing neural net file
		CFile file;
		CFileException error;
		if (file.Open(m_strNeuralNetFile, CFile::modeRead, &error))
		{
			m_pNeuralNet = new CNeuralNet;
			CArchive ar(&file, CArchive::load);
			m_pNeuralNet->Serialize(ar);
			file.Close();
		}
		else
		{
			// no existing net fopund
			bExisting = FALSE;
		}
	}

	//
	if (!bExisting)
	{
		// the neural net file was not specified or does not exist
		// so create a new neural net
		m_pNeuralNet = new CNeuralNet(tnumNNetInputs, tnumNNetOutputs, m_numNNetHiddenLayers, m_numNNetNodesPerHiddenLayer);
		m_pNeuralNet->RandomizeWeights();
	}
}



//
// CloseNeuralNet()
//
// - close out the neural net file
//
void CEasyBApp::CloseNeuralNet()
{
	if (m_pNeuralNet == NULL)
		return;

	// check filename
	if (m_strNeuralNetFile.IsEmpty())
	{
		// prompt to see if the user wants to save
		if (AfxMessageBox("Do you wish to save the neural net file?", MB_ICONQUESTION | MB_YESNO) == IDNO)
			return;

		// get the filename
		CFileDialog fileDlg(TRUE, "net", "", 0,
			  				"Neural Net Files (*.net)|*.net|All Files (*.*)|*.*||",
		   					theApp.m_pMainWnd);
		fileDlg.m_ofn.lpstrTitle = "Enter Neural Net Output file";
		fileDlg.m_ofn.lpstrInitialDir = m_strProgDirectory;

		// then show
		if (fileDlg.DoModal() == IDCANCEL)
			return;

		// and get filenmae
		m_strNeuralNetFile = fileDlg.GetPathName();
		if (m_strNeuralNetFile.IsEmpty())
			return;
	}

	// save the neural net file
	CFile file;
	CFileException error;
	if (file.Open(m_strNeuralNetFile, CFile::modeWrite | CFile::modeCreate, &error))
	{
		CArchive ar(&file, CArchive::store);
		m_pNeuralNet->Serialize(ar);
	}
	file.Close();
	
	// and delete 
	delete m_pNeuralNet;
	m_pNeuralNet = NULL;
}
*/





/////////////////////////////////////////////////////////////////////////////
//
//
//
// CAboutDlg dialog used for App About
//
//
//
/////////////////////////////////////////////////////////////////////////////

#include "CJHyperLink.h"

class CAboutDlg : public CDialog
{
public:
	CAboutDlg();

// Dialog Data
	//{{AFX_DATA(CAboutDlg)
	enum { IDD = IDD_ABOUTBOX };
	CCJHyperLink	m_hyperLinkEMail;
	CCJHyperLink	m_hyperLinkURL;
	CString	m_strSecondaryCopyright;
	CString	m_strEmailAddress;
	//}}AFX_DATA

// Implementation
protected:
	virtual void DoDataExchange(CDataExchange* pDX);    // DDX/DDV support
	//{{AFX_MSG(CAboutDlg)
	virtual BOOL OnInitDialog();
	afx_msg void OnShowWindow(BOOL bShow, UINT nStatus);
	afx_msg void OnClose();
	virtual void OnOK();
	afx_msg void OnImageClicked();
	//}}AFX_MSG
	DECLARE_MESSAGE_MAP()

//
private:
	bool	m_bPortraitShown;
	CBitmap m_bitmapPortrait;
};

CAboutDlg::CAboutDlg() : CDialog(CAboutDlg::IDD)
{
	//{{AFX_DATA_INIT(CAboutDlg)
	m_strSecondaryCopyright = _T("");
	m_strEmailAddress = _T("");
	//}}AFX_DATA_INIT
	m_bPortraitShown = false;
}

void CAboutDlg::DoDataExchange(CDataExchange* pDX)
{
	CDialog::DoDataExchange(pDX);
	//{{AFX_DATA_MAP(CAboutDlg)
	DDX_Text(pDX, IDC_SECONDARY_COPYRIGHT, m_strSecondaryCopyright);
	DDX_Control(pDX, IDC_EMAIL_ADDRESS, m_hyperLinkEMail);
	DDX_Control(pDX, IDC_HYPERLINK, m_hyperLinkURL);
	//}}AFX_DATA_MAP
}


BOOL CAboutDlg::OnInitDialog() 
{
	CDialog::OnInitDialog();
	CString strTemp;

	// init hyperlinks
	m_hyperLinkEMail.SetURL(_T("mailto:shan@nyx.net"));
	m_hyperLinkURL.SetURL(_T("http://www.nyx.net/~shan/EasyBridge.html"));
	// show copyright info
	SetDlgItemText(IDC_STATIC_COPYRIGHT, theApp.GetSettings()->GetProgramCopyright());
	// show version number		  
	strTemp = theApp.GetSettings()->GetFullProgramVersionString();
	SetDlgItemText(IDC_STATIC_VERSION, (LPCTSTR)strTemp);	
	// show misc info
	strTemp.Format("Build Date: %s", theApp.GetSettings()->GetProgramBuildDate());
	SetDlgItemText(IDC_STATIC_DATE, (LPCTSTR)strTemp);	

	// show platform info
	if (theApp.GetSettings()->GetWindowsSystemMode() == 0)
		strTemp.Format("Platform: Windows NT version %d.%d",
						   theApp.GetSettings()->GetWindowsMajorVersion(),
						   theApp.GetSettings()->GetWindowsMinorVersion());
	else if (theApp.GetSettings()->GetWindowsSystemMode() == 1)
		strTemp.Format("Platform: Windows 95");
//						   theApp.GetValue(tnWindowsMajorVersion),
//						   theApp.GetValue(tnWindowsMinorVersion));
	else if (theApp.GetSettings()->GetWindowsSystemMode() == 2)
		strTemp.Format("Platform: Windows 98");
//						   theApp.GetValue(tnWindowsMajorVersion),
//						   theApp.GetValue(tnWindowsMinorVersion));
	else if (theApp.GetSettings()->GetWindowsSystemMode() == 9)
		strTemp.Format("Platform: Win32s version %d.%d",
						   theApp.GetSettings()->GetWindowsMajorVersion(),
						   theApp.GetSettings()->GetWindowsMinorVersion());
	SetDlgItemText(IDC_STATIC_PLATFORM, strTemp);	

	// show e-mail address
	m_strEmailAddress.LoadString(IDS_AUTHOR_EMAIL);

	// show secondary copyright
//	m_strSecondaryCopyright.Empty();
	m_strSecondaryCopyright.LoadString(IDS_SECONDARY_COPYRIGHT);

	// and update
	UpdateData(FALSE);

	//
	CenterWindow();

	// done
	return TRUE;  // return TRUE unless you set the focus to a control
	              // EXCEPTION: OCX Property Pages should return FALSE
}

void CAboutDlg::OnShowWindow(BOOL bShow, UINT nStatus) 
{
	CDialog::OnShowWindow(bShow, nStatus);
	
	// play sound if showing window
	if (bShow)
	{
/*
		// see if the WAV file exists
		CString strPath = FormString(_T("%s\\%s"), theApp.GetValue(tszProgramDirectory), theApp.GetValue(tszAboutDialogWAV));
		CFile file;
		if (file.Open(strPath, CFile::modeRead))
		{
			file.Close();
			PlaySound(strPath, NULL, SND_ASYNC | SND_NOSTOP | SND_NOWAIT);
		}
*/
	}
}

void CAboutDlg::OnImageClicked() 
{
	// show bitmap
	if (!m_bPortraitShown)
	{
		// need Ctrl key pressed
		if (GetKeyState(VK_CONTROL) & 0x8000) 
		{
			CStatic* pStaticImage = (CStatic*) GetDlgItem(IDC_IMAGE);
			m_bitmapPortrait.LoadBitmap(IDB_PORTRAIT);
			pStaticImage->SetBitmap(m_bitmapPortrait);
			m_bPortraitShown = true;

			// and also change the text around
			CStatic* pText1 = (CStatic*) GetDlgItem(IDC_COPYRIGHT1);
			CStatic* pText2 = (CStatic*) GetDlgItem(IDC_COPYRIGHT2);
			pText1->SetWindowText(_T("Hi, I'm Steven Han.  I hope you enjoy this program as much as I enjoyed writing it."));
			pText2->SetWindowText(_T(""));
		}
	}
}

void CAboutDlg::OnClose() 
{
	// stop the sound
	PlaySound(NULL, NULL, SND_ASYNC | SND_PURGE | SND_NOSTOP | SND_NOWAIT);

	// free image
	if (m_bPortraitShown)
	{
		CStatic* pStaticImage = (CStatic*) GetDlgItem(IDC_IMAGE);
		pStaticImage->SetBitmap(NULL);
		m_bitmapPortrait.DeleteObject();
	}

	//	
	CDialog::OnClose();
}

void CAboutDlg::OnOK() 
{
	// stop the sound
	PlaySound(NULL, NULL, SND_ASYNC | SND_PURGE | SND_NOSTOP | SND_NOWAIT);
	//	
	CDialog::OnOK();
}

BEGIN_MESSAGE_MAP(CAboutDlg, CDialog)
	//{{AFX_MSG_MAP(CAboutDlg)
	ON_WM_SHOWWINDOW()
	ON_WM_CLOSE()
	ON_BN_CLICKED(IDC_IMAGE, OnImageClicked)
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

// App command to run the dialog
void CEasyBApp::OnAppAbout()
{
	CAboutDlg aboutDlg;
	aboutDlg.DoModal();
}

/////////////////////////////////////////////////////////////////////////////
// CEasyBApp commands

