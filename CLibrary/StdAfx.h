// stdafx.h : include file for standard system include files,
//  or project specific include files that are used frequently, but
//      are changed infrequently
// Copyright © 1998-1999 CodeJock.com, All Rights Reserved.
// See ReadMe.txt for TERMS OF USE.
//
/////////////////////////////////////////////////////////////////////////////
/****************************************************************************
 *
 * $Date: 10/24/99 12:01a $
 * $Revision: 9 $
 * $Archive: /CodeJock/CJLibrary/StdAfx.h $
 *
 * $History: StdAfx.h $
 * 
 * *****************  Version 9  *****************
 * User: Kirk Stowell Date: 10/24/99   Time: 12:01a
 * Updated in $/CodeJock/CJLibrary
 * Fixed potential resource and memory leak problems.
 * 
 * *****************  Version 8  *****************
 * User: Kirk Stowell Date: 10/14/99   Time: 12:41p
 * Updated in $/CodeJock/CJLibrary
 * Added source control history to file header.
 *
 ***************************************************************************/
/////////////////////////////////////////////////////////////////////////////

#if !defined(AFX_STDAFX_H__F235A078_2921_11D3_8733_000000000000__INCLUDED_)
#define AFX_STDAFX_H__F235A078_2921_11D3_8733_000000000000__INCLUDED_

#if _MSC_VER >= 1000
#pragma once
#endif // _MSC_VER >= 1000

#define VC_EXTRALEAN		// Exclude rarely-used stuff from Windows headers

#ifdef _UNICODE
#define UNICODE
#endif

#include <afxwin.h>         // MFC core and standard components
#include <afxext.h>         // MFC extensions

#ifndef _AFX_NO_OLE_SUPPORT
#include <afxole.h>         // MFC OLE classes
#include <afxodlgs.h>       // MFC OLE dialog classes
#include <afxdisp.h>        // MFC OLE automation classes
#endif // _AFX_NO_OLE_SUPPORT


#ifndef _AFX_NO_DB_SUPPORT
#include <afxdb.h>			// MFC ODBC database classes
#endif // _AFX_NO_DB_SUPPORT

#ifndef _AFX_NO_DAO_SUPPORT
#include <afxdao.h>			// MFC DAO database classes
#endif // _AFX_NO_DAO_SUPPORT

#ifndef _AFX_NO_AFXCMN_SUPPORT
#include <afxcmn.h>			// MFC support for Windows Common Controls
#endif // _AFX_NO_AFXCMN_SUPPORT


#if _MSC_VER < 1200
#define _VC_VERSION_5
#endif  // _VC_VERSION_5

#ifndef _CJXLIB_INLINE
#define _CJXLIB_INLINE inline
#endif // _AFXCMN_INLINE

#ifndef _CJX_EXT_CLASS
#ifdef _AFXDLL
#define _CJX_EXT_CLASS	AFX_CLASS_EXPORT // Always export CJLibrary files...
#else
#define _CJX_EXT_CLASS	// not used with static builds.
#endif
#endif // _CJX_EXT_CLASS

#ifndef __AFXTEMPL_H__
#include <afxtempl.h>
#endif

#ifndef __AFXPRIV_H__
#include <afxpriv.h>
#endif

#include <..\src\mfc\afximpl.h>

#define GWL_WNDPROC (-4)

#define _delete(p){if(p){delete p;p=NULL;}}
#define _destroyIcon(h){if(h){::DestroyIcon(h);h=NULL;}}

//{{AFX_INSERT_LOCATION}}
// Microsoft Developer Studio will insert additional declarations immediately before the previous line.

#endif // !defined(AFX_STDAFX_H__F235A078_2921_11D3_8733_000000000000__INCLUDED_)
