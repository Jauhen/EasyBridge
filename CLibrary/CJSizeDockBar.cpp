// CJSizeDockBar.cpp : implementation file
// Copyright © 1998-1999 CodeJock.com, All Rights Reserved.
// See ReadMe.txt for TERMS OF USE.
//
/////////////////////////////////////////////////////////////////////////////
/****************************************************************************
 *
 * $Date: 10/31/99 11:14p $
 * $Revision: 12 $
 * $Archive: /CodeJock/CJLibrary/CJSizeDockBar.cpp $
 *
 * $History: CJSizeDockBar.cpp $
 * 
 * *****************  Version 12  *****************
 * User: Kirk Stowell Date: 10/31/99   Time: 11:14p
 * Updated in $/CodeJock/CJLibrary
 * Minor update to tracker.
 * 
 * *****************  Version 11  *****************
 * User: Kirk Stowell Date: 10/29/99   Time: 12:44a
 * Updated in $/CodeJock/CJLibrary
 * Added static member variable CCJSizeDockBar::m_bIsDockBar used for save
 * and restore bar state.
 * 
 * *****************  Version 10  *****************
 * User: Kirk Stowell Date: 10/15/99   Time: 1:28a
 * Updated in $/CodeJock/CJLibrary
 * Fixed bug with just clicking on the sizing tracker and the control bar
 * resizing one pixel to the left or right. The bar will only be sized if
 * the cursor has changed its location.
 * 
 * *****************  Version 9  *****************
 * User: Kirk Stowell Date: 9/16/99    Time: 2:35p
 * Updated in $/CodeJockey/CJLibrary
 * Fixed bug with save / restore bar state, and with saved bar size
 * changing whenever the application starts.
 * 
 * *****************  Version 8  *****************
 * User: Kirk Stowell Date: 8/31/99    Time: 1:11a
 * Updated in $/CodeJockey/CJLibrary
 * Updated copyright and contact information.
 * 
 * *****************  Version 7  *****************
 * User: Kirk Stowell Date: 7/25/99    Time: 12:30a
 * Updated in $/CodeJockey/CJLibrary
 * 
 * *****************  Version 6  *****************
 * User: Kirk Stowell Date: 7/18/99    Time: 10:29p
 * Updated in $/CodeJockey/CJLibrary
 * Added vc5 compatibility.
 * 
 * *****************  Version 5  *****************
 * User: Kirk Stowell Date: 6/09/99    Time: 8:33p
 * Updated in $/CodeJockey/CJ60Lib
 * Ioannhs Stamatopoulos (Yiannhs) [ystamat@mail.datamedia.gr] - Extended
 * docking windows, removed ::GetSysColor(...) calls and WM_SYSCOLORCHANGE
 * message handler, this is now automatically handled by the base class.
 * Added redraw flags to the create method and modified paint and layout
 * handlers to reduce flicker and un-necessary command handling. Dragging
 * rect now reflects actual control bar docked size. Added "flat" look to
 * the control bars, the control bars can now use the classic DevStudio
 * look, or use flat gradient gripper, borders and frame buttons. Overall,
 * docking windows now handle dragging, docking and floating much better,
 * and behave more like DevStudio.
 * 
 * *****************  Version 4  *****************
 * User: Kirk Stowell Date: 4/14/99    Time: 11:07p
 * Updated in $/CodeJockey/CJ60Lib
 * Changed CFrameWnd *pFrame = (CFrameWnd*)AfxGetApp()->m_pMainWnd; to
 * CFrameWnd *pFrame = GetParentFrame(); see line 432.
 * 
 * *****************  Version 3  *****************
 * User: Kirk Stowell Date: 4/03/99    Time: 11:06p
 * Updated in $/CodeJockey/CJ60Lib
 * Added comments and cleaned up code.
 * 
 * *****************  Version 2  *****************
 * User: Kirk Stowell Date: 1/29/99    Time: 11:06p
 * Updated in $/CodeJockey/CJ60Lib
 * Made some cosmetic enhancements to more closely match DevStudio docking
 * windows.
 * 
 * *****************  Version 1  *****************
 * User: Kirk Stowell Date: 1/12/99    Time: 11:06p
 * Created in $/CodeJockey/CJ60Lib
 * Initial release to add side-by-side docking support for CCJControlBar
 * class.
 *
 ***************************************************************************/
/////////////////////////////////////////////////////////////////////////////

#include "stdafx.h"
#include "CJSizeDockBar.h"
#include "CJControlBar.h"
#include "CJToolBar.h"
#include "CJResource.h"

#ifdef _DEBUG
#define new DEBUG_NEW
#undef THIS_FILE
static char THIS_FILE[] = __FILE__;
#endif

#define TRACK_BORDER_SIZE		4

bool CCJSizeDockBar::m_bIsDockBar = false;

/////////////////////////////////////////////////////////////////////////////
// CCJSizeDockBar

CCJSizeDockBar::CCJSizeDockBar()
{
	m_cxLeftBorder		= 0;
	m_cyTopBorder		= 0;
	m_cxRightBorder		= 0;
	m_cyBottomBorder	= 0;
	m_iActualSize		= 100;
	m_iSafeSpace		= 25;
	m_bOkToDrag			= FALSE;
	m_bDragging			= FALSE;
	m_bAutoDelete		= TRUE;
    m_bFlatBorder       = TRUE;     //Yiannhs v6.06 for Docking bar flat border
	m_ptCurrent			= CPoint(0,0);
}

CCJSizeDockBar::~CCJSizeDockBar()
{
	// TODO: add destruction code here.
}

IMPLEMENT_DYNAMIC(CCJSizeDockBar, CDockBar)

BEGIN_MESSAGE_MAP(CCJSizeDockBar, CDockBar)
	//{{AFX_MSG_MAP(CCJSizeDockBar)
	ON_WM_NCPAINT()
	ON_WM_NCCALCSIZE()
	ON_WM_SETCURSOR()
	ON_WM_NCHITTEST()
	ON_WM_NCLBUTTONDOWN()
	ON_WM_LBUTTONUP()
	ON_WM_MOUSEMOVE()
	//}}AFX_MSG_MAP
END_MESSAGE_MAP()

/////////////////////////////////////////////////////////////////////////////
// CCJSizeDockBar overrides

CSize CCJSizeDockBar::CalcDynamicLayout(int /*nLength*/, DWORD nMode)
{
	int ActualSize = 0;
	for(int i=0;i<= m_arrBars.GetUpperBound();++i)
	{
		CCJControlBar *pBar = (CCJControlBar *)GetDockedControlBar(i);
		if (pBar != NULL && pBar->IsVisible())
		{
			ActualSize = m_iActualSize;
			break;
		}
	}

	int cx=0,cy=0;
	if (nMode & LM_VERTDOCK) {
		cx = ActualSize ;
		cy = 32767;
	}
	
	if (nMode & LM_HORZDOCK) {
		cx= 32767;
		cy = ActualSize;
	}
    
    //Yiannhs. Use selective layout. Since the dock bar does not calculate the bar sizes yet
    if( !m_bLayoutQuery )   
	    CalcSizeBarLayout();

	return CSize(cx,cy);
}

void CCJSizeDockBar::DoPaint(CDC *pDC)
{
	CDockBar::DoPaint(pDC);
}

void CCJSizeDockBar::OnInvertTracker(const CRect& rect)
{
	ASSERT_VALID(this);
	ASSERT(!rect.IsRectEmpty());
	
	CDC* pDC = GetDockingFrame()->GetDC();
	CBrush* pBrush = CDC::GetHalftoneBrush();
	CBrush* pOldBrush = NULL;
	
	if (pBrush != NULL) {
		pOldBrush = pDC->SelectObject(pBrush);
	}

	pDC->PatBlt(rect.left, rect.top, rect.Width(), rect.Height(), PATINVERT);
	
	if (pOldBrush != NULL) {
		pDC->SelectObject(pOldBrush);
	}
	GetDockingFrame()->ReleaseDC(pDC);
}

void CCJSizeDockBar::HitTest(const CPoint & point)
{
	UINT nID = ((UINT)(WORD)::GetDlgCtrlID(m_hWnd));
	CRect rcWin;
	GetWindowRect(&rcWin);
	HCURSOR hCur = NULL;
	
    //Yiannhs: Check the if statements, and change of variable TRackBorder size
	if (nID == AFX_IDW_SIZEBAR_LEFT || nID == AFX_IDW_SIZEBAR_RIGHT ) {
        //we are sure the DOCK bar is vertical
        if( nID == AFX_IDW_SIZEBAR_LEFT )
		    rcWin.left = rcWin.right - TRACK_BORDER_SIZE;
		else
            rcWin.right = rcWin.left + TRACK_BORDER_SIZE;

        if( rcWin.PtInRect(point) )
            hCur = AfxGetApp()->LoadCursor(IDC_HSPLITBAR);

	} else {
        //The DOCK bar is horizontal
        if (nID == AFX_IDW_SIZEBAR_TOP)
		    rcWin.top = rcWin.bottom - TRACK_BORDER_SIZE;
        else
            rcWin.bottom = rcWin.top + TRACK_BORDER_SIZE;

        if( rcWin.PtInRect(point) )
            hCur = AfxGetApp()->LoadCursor(IDC_VSPLITBAR);
    }
	
	if( hCur )
        SetCursor(hCur);
	
	m_bOkToDrag = BOOL((long)hCur);
}

/////////////////////////////////////////////////////////////////////////////
// CCJSizeDockBar message handlers

void CCJSizeDockBar::OnNcPaint() 
{
	EraseNonClient();
}

void CCJSizeDockBar::OnNcCalcSize(BOOL bCalcValidRects, NCCALCSIZE_PARAMS FAR* lpncsp) 
{
	UINT nID = ((UINT)(WORD)::GetDlgCtrlID(m_hWnd));
	//Yiannhs changed the tracksize variable
	if (nID == AFX_IDW_SIZEBAR_LEFT) {
		m_cyBottomBorder += TRACK_BORDER_SIZE;
		CDockBar::OnNcCalcSize(bCalcValidRects, lpncsp);
		m_cyBottomBorder -= TRACK_BORDER_SIZE;
	}
	
	else if (nID == AFX_IDW_SIZEBAR_TOP) {
		m_cyBottomBorder += TRACK_BORDER_SIZE;
		CDockBar::OnNcCalcSize(bCalcValidRects, lpncsp);
		m_cyBottomBorder -= TRACK_BORDER_SIZE;
	}
	
	else if (nID == AFX_IDW_SIZEBAR_RIGHT) {
		m_cyTopBorder += TRACK_BORDER_SIZE;
		CDockBar::OnNcCalcSize(bCalcValidRects, lpncsp);
		m_cyTopBorder -= TRACK_BORDER_SIZE;
	}
	
	else if (nID == AFX_IDW_SIZEBAR_BOTTOM) {
		m_cyTopBorder += TRACK_BORDER_SIZE;
		CDockBar::OnNcCalcSize(bCalcValidRects, lpncsp);
		m_cyTopBorder -= TRACK_BORDER_SIZE;
	}
}

BOOL CCJSizeDockBar::OnSetCursor(CWnd* pWnd, UINT nHitTest, UINT message) 
{
	return (nHitTest == HTCLIENT)?
		CDockBar::OnSetCursor(pWnd, nHitTest, message):FALSE;
}

UINT CCJSizeDockBar::OnNcHitTest(CPoint point) 
{
	HitTest(point);
	return (m_bOkToDrag)?HTBORDER:CDockBar::OnNcHitTest(point);
}

void CCJSizeDockBar::OnNcLButtonDown(UINT nHitTest, CPoint point) 
{
	// save the current cursor postion.
	m_ptCurrent = point;
	ScreenToClient(&m_ptCurrent);

	if( m_bOkToDrag )
	{
		UINT nID = ((UINT)(WORD)::GetDlgCtrlID(m_hWnd));
		CFrameWnd *pFrame=GetDockingFrame();
		GetWindowRect(m_rcTrack);
		
        //Yiannhs changed tracsize variable
		if (nID == AFX_IDW_SIZEBAR_LEFT)
			m_rcTrack.left = m_rcTrack.right - TRACK_BORDER_SIZE;
		
		else if (nID == AFX_IDW_SIZEBAR_TOP)
			m_rcTrack.top = m_rcTrack.bottom - TRACK_BORDER_SIZE;
		
		else if (nID == AFX_IDW_SIZEBAR_RIGHT)
			m_rcTrack.right = m_rcTrack.left + TRACK_BORDER_SIZE;
		
		else if (nID == AFX_IDW_SIZEBAR_BOTTOM)
			m_rcTrack.bottom = m_rcTrack.top + TRACK_BORDER_SIZE;
		
		pFrame->ScreenToClient(&m_rcTrack);
		pFrame->ScreenToClient(&point);
		
		m_ptStartDrag = point;
		m_ptCurDrag = point;
		
		SetCapture();
		m_bDragging = TRUE;
		OnInvertTracker(m_rcTrack);

	} else {	
        //Yiannhs
	    CDockBar::OnNcLButtonDown(nHitTest, point);
    }
}

void CCJSizeDockBar::OnLButtonUp(UINT nFlags, CPoint point) 
{
	if( m_ptCurrent == point ) {
		ReleaseCapture();
		m_bDragging = FALSE;
		OnInvertTracker(m_rcTrack);
		CDockBar::OnLButtonUp(nFlags, point);
	}

	else if( m_bDragging )
	{
		CRect rectWin;
		CRect rectAvail;
		GetWindowRect(&rectWin);
		ReleaseCapture();
		m_bDragging = FALSE;
		OnInvertTracker(m_rcTrack);
		GetAvailableRect(rectAvail);
		UINT nID = ((UINT)(WORD)::GetDlgCtrlID(m_hWnd));
		
		if (nID == AFX_IDW_SIZEBAR_LEFT ) {
			int maxWidth = rectAvail.Width()-m_iSafeSpace;
			int newWidth = m_rcTrack.left-m_ptStartDrag.x;
			m_iActualSize = newWidth>maxWidth ? maxWidth: newWidth;
			m_iActualSize += rectWin.Width();
		}
		
		else if (nID == AFX_IDW_SIZEBAR_TOP) {
			int maxHeight = rectAvail.Height()-m_iSafeSpace;
			int newHeight = m_rcTrack.top-m_ptStartDrag.y;
			m_iActualSize = newHeight>maxHeight ? maxHeight : newHeight;
			m_iActualSize += rectWin.Height();
		}
		
		else if (nID == AFX_IDW_SIZEBAR_RIGHT) {
			int maxWidth = rectAvail.Width()-m_iSafeSpace;
			int newWidth = m_ptStartDrag.x-m_rcTrack.left;
			m_iActualSize = newWidth>maxWidth ? maxWidth: newWidth;
			m_iActualSize += rectWin.Width();
		}
		
		else if (nID == AFX_IDW_SIZEBAR_BOTTOM) {
			int maxHeight = rectAvail.Height()-m_iSafeSpace;
			int newHeight = m_ptStartDrag.y-m_rcTrack.top;
			m_iActualSize = newHeight>maxHeight ? maxHeight : newHeight;
			m_iActualSize += rectWin.Height();
		}
		
		if(m_iActualSize< TRACK_BORDER_SIZE )
			m_iActualSize = TRACK_BORDER_SIZE;
		
		for (int i = 0; i < m_arrBars.GetSize(); i++)
		{
			CCJControlBar* pBar = STATIC_DOWNCAST(CCJControlBar, (CObject*)GetDockedControlBar(i));
			if (pBar != NULL && pBar->IsVisible())
			{
				if(!pBar->IsKindOf(RUNTIME_CLASS(CCJControlBar)))
					continue;

		        if( nID == AFX_IDW_SIZEBAR_TOP || nID == AFX_IDW_SIZEBAR_BOTTOM ) 
					pBar->m_sizeHorz.cy = m_iActualSize;
				else if( nID == AFX_IDW_SIZEBAR_LEFT || nID == AFX_IDW_SIZEBAR_RIGHT ) 
					pBar->m_sizeVert.cx = m_iActualSize;
			}
		}

		GetDockingFrame()->RecalcLayout();
		RecalcAllExcept(NULL);

	} else {
	    //Yiannhs
	    CDockBar::OnLButtonUp(nFlags, point);
    }
}

void CCJSizeDockBar::OnMouseMove(UINT nFlags, CPoint point) 
{
	if( m_bDragging )
	{
		CRect rectWin;
		GetWindowRect(&rectWin);
		CRect rectAvail;
		GetAvailableRect(rectAvail);
		CFrameWnd *pFrame=GetDockingFrame();
		ClientToScreen(&point);
		pFrame->ScreenToClient(&point);
		UINT nID = ((UINT)(WORD)::GetDlgCtrlID(m_hWnd));
		
		if (nID == AFX_IDW_SIZEBAR_LEFT) {
			point.x = point.x > rectAvail.right ? rectAvail.right : point.x;
			point.x = point.x < TRACK_BORDER_SIZE ? TRACK_BORDER_SIZE : point.x;
		}
		
		else if (nID == AFX_IDW_SIZEBAR_TOP) {
			point.y = point.y > rectAvail.bottom ? rectAvail.bottom : point.y;
			point.y = point.y < TRACK_BORDER_SIZE ? TRACK_BORDER_SIZE : point.y;
		}
		
		else if (nID == AFX_IDW_SIZEBAR_RIGHT) {
			point.x = point.x < rectAvail.left ? rectAvail.left:point.x;
			point.x = point.x > rectAvail.right + m_iActualSize - TRACK_BORDER_SIZE ? 
                                rectAvail.right - TRACK_BORDER_SIZE + m_iActualSize : point.x;
		}
		
		else if (nID == AFX_IDW_SIZEBAR_BOTTOM) {
			point.y = point.y < rectAvail.top ? rectAvail.top : point.y;
			point.y = point.y > rectAvail.bottom + m_iActualSize - TRACK_BORDER_SIZE ? 
                                rectAvail.bottom - TRACK_BORDER_SIZE + m_iActualSize : point.y;		
		}
		
		int deltaX = point.x - m_ptCurDrag.x;
		int deltaY = point.y - m_ptCurDrag.y;
		
		m_ptCurDrag = point;
		
		if (nID == AFX_IDW_SIZEBAR_LEFT || nID == AFX_IDW_SIZEBAR_RIGHT && deltaX)
		{	
			OnInvertTracker(m_rcTrack);
			m_rcTrack.left+=deltaX;
			m_rcTrack.right+=deltaX;
			OnInvertTracker(m_rcTrack);
		}
		
		else if( nID == AFX_IDW_SIZEBAR_TOP || nID == AFX_IDW_SIZEBAR_BOTTOM && deltaY)
		{
			OnInvertTracker(m_rcTrack);
			m_rcTrack.top+=deltaY;
			m_rcTrack.bottom+=deltaY;
			OnInvertTracker(m_rcTrack);
		}

	} else {
	    //Yiannhs
	    CDockBar::OnMouseMove(nFlags, point);
    }
}

/////////////////////////////////////////////////////////////////////////////
// CCJControlBar operations

void CCJSizeDockBar::GetAvailableRect(CRect &rect)
{
	GetDockingFrame()->GetClientRect(&rect);
	GetDockingFrame()->RepositionBars(0xffff, 0xffff, AFX_IDW_PANE_FIRST,reposQuery,
		&rect, &rect, TRUE);
}

BOOL CCJSizeDockBar::IsLastControlBar(int index)
{
	for( int i=index; i<m_arrBars.GetSize(); ++i)
	{
		CCJControlBar *pOther = (CCJControlBar *)GetDockedControlBar(i);
		if (pOther != NULL && pOther->IsVisible())
		{
			return FALSE;
		}
	}
	
	return TRUE;
}

CCJControlBar* CCJSizeDockBar::GetDockedSizeBar(int nPos)
{
	return (CCJControlBar*)GetDockedControlBar(nPos);
}

void CCJSizeDockBar::RecalcAllExcept(CCJSizeDockBar *pBar)
{
	CFrameWnd *pFrame = GetParentFrame();
	ASSERT_VALID(pFrame);
	
	for (int i = 0; i < 4; i++)
	{
		CCJSizeDockBar* pDock = (CCJSizeDockBar*)pFrame->GetControlBar(dwSizeBarMap[i][0]);
		if (pDock != NULL && pDock != pBar) {
			pDock->CalcSizeBarLayout();	
		}
	}
}

void CCJSizeDockBar::DrawBorders(CDC *pDC, CRect &rect)
{
	int cxBorderLeft	= 0;
	int cxBorderRight	= 0;
	int cyBorderTop		= 0;
	int cyBorderBottom	= 0;
	
	CRect rc;
	rc.CopyRect(&rect);
	
    //Yiannhs: i've replaced color variables with the afxdata ones.
	if (m_dwStyle & CBRS_BORDER_TOP) {
		pDC->FillSolidRect(rc.left, rc.top, rc.Width(), 1, afxData.clrBtnShadow);     
		pDC->FillSolidRect(rc.left, rc.top+1, rc.Width(), 1, afxData.clrBtnHilite);
		cyBorderTop+=2;
	}
	
	if (m_dwStyle & CBRS_BORDER_BOTTOM) {
		pDC->FillSolidRect(rc.left, rc.bottom-1, rc.Width(), 1, afxData.clrBtnHilite);
		pDC->FillSolidRect(rc.left, rc.bottom-2, rc.Width(), 1, afxData.clrBtnShadow);
		cyBorderBottom+=2;
	}
	
	if (m_dwStyle & CBRS_BORDER_LEFT) {
		pDC->FillSolidRect(rc.left, rc.top, 1, rc.Height(), afxData.clrBtnShadow);
		pDC->FillSolidRect(rc.left+1, rc.top, 1, rc.Height(), afxData.clrBtnHilite);
		cxBorderLeft+=2;
	}
	
	if (m_dwStyle & CBRS_BORDER_RIGHT) {
		pDC->FillSolidRect(rc.right-2, rc.top, 1, rc.Height(), afxData.clrBtnShadow);
		pDC->FillSolidRect(rc.right-1, rc.top, 1, rc.Height(), afxData.clrBtnHilite);
		cxBorderRight+=2;
	}
	
	UINT nID = ((UINT)(WORD)::GetDlgCtrlID(m_hWnd));
	
	CRect rcTrack;
	rcTrack.CopyRect(&rc);
	
	if (nID == AFX_IDW_SIZEBAR_LEFT) {
		rcTrack.left    = rc.right - TRACK_BORDER_SIZE;
		rcTrack.right  += 1;
		rcTrack.top    += 1;
		rcTrack.bottom -= 1;
		//Yiannhs moved below
		cxBorderRight = TRACK_BORDER_SIZE;
	}
	
	else if (nID == AFX_IDW_SIZEBAR_TOP) {
		rcTrack.top = rc.bottom - TRACK_BORDER_SIZE;
		rcTrack.bottom+=1;
		//Yiannhs moved below
		cyBorderBottom = TRACK_BORDER_SIZE;
	}
	
	else if (nID == AFX_IDW_SIZEBAR_RIGHT) {
		rcTrack.right   = rc.left + TRACK_BORDER_SIZE;
		rcTrack.left   -= 1;
		rcTrack.top    += 1;
		rcTrack.bottom -= 1;
		//Yiannhs moved below
		cxBorderLeft = TRACK_BORDER_SIZE;
	}
	
	else if (nID == AFX_IDW_SIZEBAR_BOTTOM) {
		rcTrack.bottom = rc.top + TRACK_BORDER_SIZE;
		rcTrack.top-=1;
		//Yiannhs moved below
		cyBorderTop = TRACK_BORDER_SIZE;
	}
    
    //Yiannhs Moved these here. in one place. The optimizer may do this, but lets help it.
	pDC->FillSolidRect(rcTrack, afxData.clrBtnFace);
    if( !m_bFlatBorder )    //Yiannhs handle flat borders
	    pDC->Draw3dRect(rcTrack, afxData.clrBtnHilite, afxData.clrBtnShadow);

	rect.left	+= cxBorderLeft;
	rect.right	-= cxBorderRight;
	rect.top	+= cyBorderTop;
	rect.bottom	-= cyBorderBottom;
}

void CCJSizeDockBar::EraseNonClient()
{
	CWindowDC dc(this);
	CRect rectClient;
	GetClientRect(rectClient);
	CRect rectWindow;
	GetWindowRect(rectWindow);
	ScreenToClient(rectWindow);
	rectClient.OffsetRect(-rectWindow.left, -rectWindow.top);
	dc.ExcludeClipRect(rectClient);
	rectWindow.OffsetRect(-rectWindow.left, -rectWindow.top);
	DrawBorders(&dc, rectWindow);
}


//1999-05-18    Yiannhs
void CCJSizeDockBar::CalcSizeBarLayout()
{
    //Yiannhs: It is necessary to set all Control bars in one row.
    //         till now multiple rows are not handled
	int VisCount = GetDockedVisibleCount();
    if( !VisCount )
        return;      //Yiannhs v6.07 moved this on top
	
	AFX_SIZEPARENTPARAMS layout;
	layout.hDWP = ::BeginDeferWindowPos( m_arrBars.GetSize( ));
	CRect rectAvail;
	GetClientRect(&rectAvail);
	
	int nCount = 0;
	int lastLeft = 0;
    int lastTop = 0;
	
	for (int i = 0; i < m_arrBars.GetSize(); i++)
	{
		CCJControlBar* pBar = STATIC_DOWNCAST(CCJControlBar, (CObject*)GetDockedControlBar(i));
		if (pBar != NULL && pBar->IsVisible())
		{
			if(!pBar->IsKindOf(RUNTIME_CLASS(CCJControlBar)))
				continue;

			CRect rectBar;
			++nCount;
			pBar->GetWindowRect(&rectBar);
			pBar->m_bUnique = FALSE;        //Yiannhs ok in Ver 6.07
			ScreenToClient(&rectBar);
			CSize sizeIdeal = pBar->CalcDynamicLayout(-1, 0);  
			
			//Yiannhs  moved [if] code at the begining. It helps make these calculations near the top
			//         for checking the size of the last control bars 
			int bIsLast = IsLastControlBar(i+1);
			pBar->m_bToFit = bIsLast;           //check fitting is setup here
			if( bIsLast && nCount == 1 ) {
				pBar->m_bUnique = TRUE;
			}
			
			////Yiannhs check for new docked bar being positioned on the last place.
			//  so it is not completely hidden
			if( rectBar.right >= rectAvail.right && !bIsLast && rectAvail.right > 0)
				sizeIdeal.cx -= (sizeIdeal.cx / 4);
			if( rectBar.bottom >= rectAvail.bottom && !bIsLast && rectAvail.bottom > 0)
				sizeIdeal.cy -= (sizeIdeal.cy / 4);

			//Yiannhs: The Dock bar is either horizontally or vertically docked itself.
			//         So are the ControlBars enclosed inside it. Since the control bars
			//         are docked, and Sizing dockbar does not derive from CCJControlBar
			//         we may be a bit more clever.
			if( m_dwStyle & CBRS_ORIENT_HORZ ) {//use some default data members
				//horizontal;
				if (m_iActualSize == 100)
					m_iActualSize = rectBar.Height();

				rectBar.left = lastLeft;
				rectBar.top = 0;
				rectBar.bottom = rectAvail.Height();
				rectBar.right = rectBar.left + sizeIdeal.cx;	
				
				if( rectBar.left > lastLeft )
					rectBar.left = lastLeft;
				
				lastLeft = rectBar.right;
				if ( bIsLast ) {    //Yiannhs
					rectBar.right = rectAvail.right;
				}
				pBar->m_sizeDesired.cx = rectBar.Width();

			} else if( m_dwStyle & CBRS_ORIENT_VERT ) {
				//Vertical
				if (m_iActualSize == 100)
					m_iActualSize = rectBar.Width();

				rectBar.top = lastTop;
				rectBar.left = 0;
				rectBar.right = rectAvail.Width();
				rectBar.bottom = rectBar.top + sizeIdeal.cy;
				
				if (rectBar.top > lastTop)
					rectBar.top = lastTop;
				
				lastTop = rectBar.bottom;
				if ( bIsLast ) {    //Yiannhs
					rectBar.bottom = rectAvail.bottom;
				}
				pBar->m_sizeDesired.cy = rectBar.Height();
			}
			
			AfxRepositionWindow( &layout, pBar->m_hWnd, &rectBar );
		}
	}
	
	// move and resize all the windows at once!
	if( layout.hDWP == NULL || !::EndDeferWindowPos( layout.hDWP ))
		TRACE0("Warning: DeferWindowPos failed - low system resources.\n");
}

void CCJSizeDockBar::Maximize(CCJControlBar* pBar)
{
	int iExt=0;
	CRect rectAvail;
	GetClientRect(rectAvail);
	
	for (int i=0; i<m_arrBars.GetSize(); ++i)
	{
		CCJControlBar *pBarDock = (CCJControlBar *)GetDockedControlBar(i);
		if (pBarDock && pBarDock->IsVisible() && pBarDock != pBar) {
			pBarDock->Minimize();
			iExt += pBarDock->GetMinExt();
		}
	}
	
	if (pBar->IsLeftDocked() || pBar->IsRightDocked()) {
		iExt = rectAvail.Height()-iExt;
	}
	
	if (pBar->IsTopDocked() || pBar->IsBottomDocked()) {
		iExt = rectAvail.Width()-iExt;
	}
	
	pBar->Maximize(iExt);
	
	//1999-05-26 Yiannhs	
	//do not care too much about flickering when maximizing controlbars
	CalcSizeBarLayout();
	
	for (i=0; i<m_arrBars.GetSize(); ++i)
	{
		CCJControlBar *pBarDock = (CCJControlBar *)GetDockedControlBar(i);
		if (pBarDock && pBarDock->IsVisible() ) {
			pBarDock->InvalidateRect(NULL, TRUE);
			pBarDock->UpdateWindow();
		}
	}
	//1999-05-26 Yiannhs
}

void CCJSizeDockBar::Average(CCJControlBar *)
{
	int VisCount = GetDockedVisibleCount();
    if( VisCount<=1 )
        return;      

	CRect rectAvail;
	GetClientRect(rectAvail);

	for( int i=0; i<m_arrBars.GetSize(); ++i) {
		CCJControlBar *pBar = (CCJControlBar*)GetDockedControlBar(i);
		if (pBar && pBar->IsVisible()) {
			if (pBar->IsHorzDocked())
				pBar->m_sizeDesired.cx = rectAvail.Width()/VisCount;
			else
				pBar->m_sizeDesired.cy = rectAvail.Height()/VisCount;
		}
	}
	CalcSizeBarLayout();
}


void CCJSizeDockBar::Normalize(CCJControlBar *)
{
	for( int i=0; i<m_arrBars.GetSize(); ++i) {
		CCJControlBar *pBarDock = (CCJControlBar*)GetDockedControlBar(i);
		if (pBarDock && pBarDock->IsVisible())
			pBarDock->Normalize();
	}
	
	
	//1999-05-26 Yiannhs	
	//do not care too much about flickering when maximizing controlbars
	
	CalcSizeBarLayout();
	
	for (i=0; i<m_arrBars.GetSize(); ++i)
	{
		CCJControlBar *pBarDock = (CCJControlBar *)GetDockedControlBar(i);
		if (pBarDock && pBarDock->IsVisible() ) {
			pBarDock->InvalidateRect(NULL, TRUE);
			pBarDock->UpdateWindow();
		}
	}
	//1999-05-26 Yiannhs
}

void CCJSizeDockBar::DockControlBar(CControlBar* pBar, LPCRECT lpRect)
{
	ASSERT_VALID(this);
	ASSERT_VALID(pBar);
	ASSERT_KINDOF(CControlBar, pBar);

	CRect rectBar;
	pBar->GetWindowRect(&rectBar);
	if (pBar->m_pDockBar == this && (lpRect == NULL || rectBar == *lpRect))
	{
		// already docked and no change in position
		return;
	}

	// set CBRS_FLOAT_MULTI style if docking bar has it
	if (m_bFloating && (pBar->m_dwDockStyle & CBRS_FLOAT_MULTI))
		m_dwStyle |= CBRS_FLOAT_MULTI;

	m_dwStyle &= ~(CBRS_SIZE_FIXED | CBRS_SIZE_DYNAMIC);
	m_dwStyle |= pBar->m_dwStyle & (CBRS_SIZE_FIXED | CBRS_SIZE_DYNAMIC);

	if (!(m_dwStyle & CBRS_FLOAT_MULTI))
	{
		TCHAR szTitle[_MAX_PATH];
		pBar->GetWindowText(szTitle, _countof(szTitle));
		AfxSetWindowText(m_hWnd, szTitle);
	}

	// align correctly and turn on all borders
	DWORD dwStyle = pBar->GetBarStyle();
	dwStyle &= ~(CBRS_ALIGN_ANY);
	dwStyle |=  (m_dwStyle & CBRS_ALIGN_ANY) | CBRS_BORDER_ANY;

	if (m_bFloating)
		dwStyle |= CBRS_FLOATING;
	else
		dwStyle &= ~CBRS_FLOATING;

	pBar->SetBarStyle(dwStyle);

	// hide first if changing to a new docking site to avoid flashing
	BOOL bShow = FALSE;
	if (pBar->m_pDockBar != this && pBar->IsWindowVisible())
	{
		pBar->SetWindowPos(NULL, 0, 0, 0, 0,
			SWP_NOSIZE|SWP_NOMOVE|SWP_NOZORDER|SWP_NOACTIVATE|SWP_HIDEWINDOW);
		bShow = TRUE;
	}

	int nPos = -1;
	if (lpRect != NULL)
	{
		// insert into appropriate row
		CRect rect(lpRect);
		ScreenToClient(&rect);
		CPoint ptMid(rect.left + rect.Width()/2, rect.top + rect.Height()/2);
		nPos = Insert((CCJControlBar*)pBar, rect, ptMid);

		// position at requested position
		pBar->SetWindowPos(NULL, rect.left, rect.top, rect.Width(),
			rect.Height(), SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOCOPYBITS);
	}
	else
	{
		// always add on current row, then create new one
		m_arrBars.Add(pBar);
		m_arrBars.Add(NULL);

		// align off the edge initially
		pBar->SetWindowPos(NULL, -afxData.cxBorder2, -afxData.cyBorder2, 0, 0,
			SWP_NOSIZE|SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOCOPYBITS);
	}

	// attach it to the docking site
	if (pBar->GetParent() != this)
		pBar->SetParent(this);
	if (pBar->m_pDockBar == this)
		pBar->m_pDockBar->RemoveControlBar(pBar, nPos);
	else if (pBar->m_pDockBar != NULL)
		pBar->m_pDockBar->RemoveControlBar(pBar, -1, m_bFloating && !pBar->m_pDockBar->m_bFloating);
	pBar->m_pDockBar = this;

	if (bShow)
	{
		ASSERT(!pBar->IsWindowVisible());
		pBar->SetWindowPos(NULL, 0, 0, 0, 0,
			SWP_NOSIZE|SWP_NOMOVE|SWP_NOZORDER|SWP_NOACTIVATE|SWP_SHOWWINDOW);
	}

	// remove any place holder for pBar in this dockbar
	RemovePlaceHolder(pBar);

	// get parent frame for recalc layout
	CFrameWnd* pFrameWnd = GetDockingFrame();
	pFrameWnd->DelayRecalcLayout();
}

int CCJSizeDockBar::Insert(CCJControlBar* pBarIns, CRect rect, CPoint ptMid)
{
	ASSERT_VALID(this);
	ASSERT(pBarIns != NULL);

	int nPos = 0;
	int nPosInsAfter = 0;
	int nWidth = 0;
	int nTotalWidth = 0;
	BOOL bHorz = m_dwStyle & CBRS_ORIENT_HORZ;

	for (nPos = 0; nPos < m_arrBars.GetSize(); nPos++)
	{
		CCJControlBar* pBar = (CCJControlBar*)GetDockedControlBar(nPos);
		if (pBar != NULL && pBar->IsVisible())
		{
			CRect rectBar;
			pBar->GetWindowRect(&rectBar);
			ScreenToClient(&rectBar);
			nWidth = max(nWidth,
				bHorz ? rectBar.Size().cx - 1: rectBar.Size().cy);
			if (bHorz ? rect.left > rectBar.left : rect.top > rectBar.top)
				nPosInsAfter = nPos;
		}
		else // end of row because pBar == NULL
		{
			nTotalWidth += nWidth - afxData.cyBorder2;
			nWidth = 0;
			if ((bHorz ? ptMid.x : ptMid.y) < nTotalWidth)
			{
				if (nPos == 0) // first section
					m_arrBars.InsertAt(nPosInsAfter+1, (CObject*)NULL);
				m_arrBars.InsertAt(nPosInsAfter+1, pBarIns);
				return nPosInsAfter+1;
			}
			nPosInsAfter = nPos;
		}
	}

	// create a new row
	m_arrBars.InsertAt(nPosInsAfter+1, (CObject*)NULL);
	m_arrBars.InsertAt(nPosInsAfter+1, pBarIns);

	return nPosInsAfter+1;
}

//2001-03-09    
// ReCalc SizeBar Layout, bFlag 1 add pBar -1-remove pBar 0--only move size
void CCJSizeDockBar::CalcSizeBarLayout(CCJControlBar* pBarDock, BOOL bFlag)
{
    //Yiannhs: It is necessary to set all Control bars in one row.
    //         till now multiple rows are not handled
	int VisCount = GetDockedVisibleCount();
    if( !VisCount )
        return;      //Yiannhs v6.07 moved this on top
	
	AFX_SIZEPARENTPARAMS layout;
	layout.hDWP = ::BeginDeferWindowPos( m_arrBars.GetSize( ));
	CRect rectAvail;
	GetClientRect(&rectAvail);
	if (rectAvail.right < 0)
		rectAvail.right = pBarDock->m_sizeHorz.cy;
	if (rectAvail.bottom < 0)
		rectAvail.bottom = pBarDock->m_sizeVert.cx;

	int i;
	for (i = 0; i < m_arrBars.GetSize(); i++)
	{
		if (VisCount <= 1)
			break;
		CCJControlBar* pBar = STATIC_DOWNCAST(CCJControlBar, (CObject*)GetDockedControlBar(i));
		if (pBar != NULL && pBar->IsVisible() && pBar != pBarDock)
		{
			if(!pBar->IsKindOf(RUNTIME_CLASS(CCJControlBar)))
				continue;
			if (pBar->m_bMaximized)
			{
				Maximize(pBar);
				return;
			}
		}
	}

	CRect rectBar;
	BOOL bMax = FALSE;
	if (bFlag == 1)
	{
		if( m_dwStyle & CBRS_ORIENT_HORZ ) {
			if (pBarDock->m_sizeFloat.cx + (VisCount-1)*pBarDock->GetMinExt() >= rectAvail.Width())
				bMax = TRUE;
		}
		else if( m_dwStyle & CBRS_ORIENT_VERT ) {
			if (pBarDock->m_sizeFloat.cy + (VisCount-1)*pBarDock->GetMinExt() >= rectAvail.Height())
				bMax = TRUE;
		}
	}

	int nCount = 0;
	int lastLeft = 0;
    int lastTop = 0;
	
	for (i = 0; i < m_arrBars.GetSize(); i++)
	{
		CCJControlBar* pBar = STATIC_DOWNCAST(CCJControlBar, (CObject*)GetDockedControlBar(i));
		if (pBar != NULL && pBar->IsVisible())
		{
			if(!pBar->IsKindOf(RUNTIME_CLASS(CCJControlBar)))
				continue;

			++nCount;
			pBar->m_bUnique = FALSE;        //Yiannhs ok in Ver 6.07
			
			//Yiannhs  moved [if] code at the begining. It helps make these calculations near the top
			//         for checking the size of the last control bars 
			int bIsLast = IsLastControlBar(i+1);
			pBar->m_bToFit = bIsLast;           //check fitting is setup here
			if( bIsLast && nCount == 1 ) {
				pBar->m_bUnique = TRUE;
			}
			
			//Yiannhs: The Dock bar is either horizontally or vertically docked itself.
			//         So are the ControlBars enclosed inside it. Since the control bars
			//         are docked, and Sizing dockbar does not derive from CCJControlBar
			//         we may be a bit more clever.
			if (m_bFloating)
			{
				rectBar = CRect(0, 0, pBar->m_sizeFloat.cx, pBar->m_sizeFloat.cy);
				pBar->m_sizeDesired = pBar->m_sizeFloat;
			}
			else if( m_dwStyle & CBRS_ORIENT_HORZ ) {//use some default data members
				//horizontal;
				rectBar.left = lastLeft;
				rectBar.top = 0;
				rectBar.bottom = rectAvail.Height();
				if (bMax) {
					if (pBar == pBarDock)
						rectBar.right = rectBar.left + (rectAvail.Width() - (VisCount-1)*pBar->GetMinExt());
					else
						rectBar.right = rectBar.left + pBar->GetMinExt();
				}
				else {
					if (bFlag == 0) //move
						rectBar.right = rectBar.left + pBar->m_sizeHorz.cx;
					else if (pBar == pBarDock)
						rectBar.right = rectBar.left + pBar->m_sizeHorz.cx>0?pBar->m_sizeHorz.cx:pBar->m_sizeFloat.cx;
					else if (bFlag == 1) //add
						rectBar.right = rectBar.left + (pBar->m_sizeHorz.cx * (rectAvail.Width()-pBarDock->m_sizeFloat.cx))/rectAvail.Width();
					else				//remove
						rectBar.right = rectBar.left + (pBar->m_sizeHorz.cx * rectAvail.Width())/(rectAvail.Width()-pBarDock->m_sizeFloat.cx);
				}
				
				lastLeft = rectBar.right;
				if ( bIsLast ) {    //Yiannhs
					rectBar.right = rectAvail.right;
				}
				if ( pBar->m_bUnique )
					m_iActualSize = pBar->m_sizeHorz.cy;

				pBar->m_sizeHorz.cx = rectBar.Width();
				pBar->m_sizeDesired.cx = rectBar.Width();
				
			} else if( m_dwStyle & CBRS_ORIENT_VERT ) {
				//Vertical
				rectBar.top = lastTop;
				rectBar.left = 0;
				rectBar.right = rectAvail.Width();
				if (bMax) {
					if (pBar == pBarDock)
						rectBar.bottom = rectBar.top + (rectAvail.Height() - (VisCount-1)*pBar->GetMinExt());
					else
						rectBar.bottom = rectBar.top + pBar->GetMinExt();
				}
				else {
					if (bFlag == 0)
						rectBar.bottom = rectBar.top + pBar->m_sizeVert.cy;
					else if (pBar == pBarDock)
						rectBar.bottom = rectBar.top + pBar->m_sizeVert.cy>0?pBar->m_sizeVert.cy:pBar->m_sizeFloat.cy;
					else if (bFlag == 1)
						rectBar.bottom = rectBar.top + (pBar->m_sizeVert.cy * (rectAvail.Height()-pBarDock->m_sizeFloat.cy))/rectAvail.Height();
					else
						rectBar.bottom = rectBar.top + (pBar->m_sizeVert.cy * rectAvail.Height())/(rectAvail.Height()-pBarDock->m_sizeFloat.cy);
				}
				
				lastTop = rectBar.bottom;
				if ( bIsLast ) {    //Yiannhs
					rectBar.bottom = rectAvail.bottom;
				}
				if ( pBar->m_bUnique )
					m_iActualSize = pBar->m_sizeVert.cx;

				pBar->m_sizeVert.cy = rectBar.Height();
				pBar->m_sizeDesired.cy = rectBar.Height();
			}
			
			AfxRepositionWindow( &layout, pBar->m_hWnd, &rectBar );
//			AfxRepositionWindow( &layout, m_hWnd, &rectBar );
		}
	}
	
	// move and resize all the windows at once!
	if( layout.hDWP == NULL || !::EndDeferWindowPos( layout.hDWP ))
		TRACE0("Warning: DeferWindowPos failed - low system resources.\n");
}