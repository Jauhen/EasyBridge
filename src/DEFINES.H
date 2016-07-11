//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// Defines.h
//
//===========================================================

#ifndef __DEFINES_H__
#define __DEFINES_H__

// forward declaration
class CCard;

// constant suit symbol
const unsigned char tSuitLetter = _T('§');

#include "engine/card_constants.h"

// Shortcuts (Macros)
#define pMAINFRAME		 ((CMainFrame*) theApp.GetFrame())
#define pDOC			 (CEasyBDoc::m_pDoc)
#define pVIEW			 (CEasyBView::m_pView)
#define DECK			 theApp.m_deck
#define PLAYER(x)		 (*(CEasyBDoc::GetDoc()->GetDeal()->GetPlayer(x)))
#define	ABS(x)			 ((x>=0)?x:-x)

#define SETSTATUSMSG(x)		((CMainFrame*)theApp.GetFrame())->SetStatusText(x)
#define RESETSTATUSMSG()	((CMainFrame*)theApp.GetFrame())->SetStatusText(AFX_IDS_IDLEMESSAGE)
#define CLEARSTATUSMSG()	((CMainFrame*)theApp.GetFrame())->SetStatusText("")


// misc
#define SHOW_STATUSDLG() ((CMainFrame*)theApp.GetFrame())->MakeStatusDialogVisible()
#define SHOW_FEEDBACK() ((CMainFrame*)theApp.GetFrame())->MakeStatusDialogVisible()
#define FEEDBACK(s)  ((CMainFrame*)theApp.GetFrame())->SetFeedbackText(s)

//
#define MIN(a,b) ( ((a) <= (b))? (a): (b) )
#define MAX(a,b) ( ((a) >= (b))? (a): (b) )


// Windoze user messages
#define WMS_UPDATE				WM_USER + 100
#define WMS_DOREALIZE   		WM_USER + 120
#define WMS_RESET_DISPLAY		WM_USER + 140
#define WMS_UPDATE_DISPLAY		WM_USER + 160
#define WMS_REFRESH_DISPLAY		WM_USER + 180
#define WMS_FLASH_BUTTON		WM_USER + 190
#define WMS_UPDATE_TEXT			WM_USER + 200
#define WMS_UPDATE_TOOLTIP_TEXT	WM_USER + 210
#define WMS_SET_ANALYSIS_FONT	WM_USER + 220
#define WMS_SETTEXT				WM_USER + 240
#define WMS_SET_FEEDBACK_TEXT	WM_USER + 242
#define WMS_SET_GIB_TEXT		WM_USER + 244
//
#define WMS_FILE_LOADED			WM_USER + 300
#define WMS_INITNEWDEAL			WM_USER + 320
#define WMS_BIDDING_DONE		WM_USER + 340
#define WMS_BIDDING_CANCELLED	WM_USER + 360
#define WMS_BIDDING_RESTART		WM_USER + 380
#define WMS_CARD_PLAY			WM_USER + 400
#define WMS_PLAY_RESTART		WM_USER + 420
#define WMS_SET_CARD_LIMIT		WM_USER + 520
#define WMS_LAYOUT_DONE			WM_USER + 540
#define WMS_RESUME_GAME			WM_USER + 560
//
#define WMS_FLUSH_MESSAGES		WM_USER + 590
//
#define WMS_F1DOWN				WM_USER + 600



// Win95 support
#define OFN_EXPLORER                 0x00080000     // new look commdlg
#define OFN_NODEREFERENCELINKS       0x00100000
#define OFN_LONGNAMES                0x00200000     // force long names for 3.x modules


#endif