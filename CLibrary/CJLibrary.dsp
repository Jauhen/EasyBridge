# Microsoft Developer Studio Project File - Name="CJLibrary" - Package Owner=<4>
# Microsoft Developer Studio Generated Build File, Format Version 6.00
# ** DO NOT EDIT **

# TARGTYPE "Win32 (x86) Dynamic-Link Library" 0x0102

CFG=CJLibrary - Win32 Debug
!MESSAGE This is not a valid makefile. To build this project using NMAKE,
!MESSAGE use the Export Makefile command and run
!MESSAGE 
!MESSAGE NMAKE /f "CJLibrary.mak".
!MESSAGE 
!MESSAGE You can specify a configuration when running NMAKE
!MESSAGE by defining the macro CFG on the command line. For example:
!MESSAGE 
!MESSAGE NMAKE /f "CJLibrary.mak" CFG="CJLibrary - Win32 Debug"
!MESSAGE 
!MESSAGE Possible choices for configuration are:
!MESSAGE 
!MESSAGE "CJLibrary - Win32 Release" (based on "Win32 (x86) Dynamic-Link Library")
!MESSAGE "CJLibrary - Win32 Debug" (based on "Win32 (x86) Dynamic-Link Library")
!MESSAGE "CJLibrary - Win32 Unicode Release" (based on "Win32 (x86) Dynamic-Link Library")
!MESSAGE "CJLibrary - Win32 Unicode Debug" (based on "Win32 (x86) Dynamic-Link Library")
!MESSAGE 

# Begin Project
# PROP AllowPerConfigDependencies 0
# PROP Scc_ProjName ""
# PROP Scc_LocalPath ""
CPP=cl.exe
MTL=midl.exe
RSC=rc.exe

!IF  "$(CFG)" == "CJLibrary - Win32 Release"

# PROP BASE Use_MFC 6
# PROP BASE Use_Debug_Libraries 0
# PROP BASE Output_Dir "Release"
# PROP BASE Intermediate_Dir "Release"
# PROP BASE Target_Dir ""
# PROP Use_MFC 6
# PROP Use_Debug_Libraries 0
# PROP Output_Dir "Release"
# PROP Intermediate_Dir "Release"
# PROP Ignore_Export_Lib 0
# PROP Target_Dir ""
# ADD BASE CPP /nologo /MD /W3 /GX /O2 /D "WIN32" /D "NDEBUG" /D "_WINDOWS" /D "_WINDLL" /D "_AFXDLL" /Yu"stdafx.h" /FD /c
# ADD CPP /nologo /MD /W4 /GX /O2 /I "../Include" /D "WIN32" /D "NDEBUG" /D "_WINDOWS" /D "_WINDLL" /D "_AFXDLL" /D "_AFXEXT" /FR /Yu"stdafx.h" /FD /c
# ADD BASE MTL /nologo /D "NDEBUG" /mktyplib203 /o "NUL" /win32
# ADD MTL /nologo /D "NDEBUG" /mktyplib203 /o "NUL" /win32
# ADD BASE RSC /l 0x409 /d "NDEBUG" /d "_AFXDLL"
# ADD RSC /l 0x409 /i "../Include" /d "NDEBUG" /d "_AFXDLL"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 /nologo /subsystem:windows /dll /machine:I386
# ADD LINK32 shlwapi.lib /nologo /subsystem:windows /dll /machine:I386 /out:"../Lib/CJ609Lib.dll" /implib:"../Lib/CJ609Lib.lib"
# SUBTRACT LINK32 /pdb:none

!ELSEIF  "$(CFG)" == "CJLibrary - Win32 Debug"

# PROP BASE Use_MFC 6
# PROP BASE Use_Debug_Libraries 1
# PROP BASE Output_Dir "Debug"
# PROP BASE Intermediate_Dir "Debug"
# PROP BASE Target_Dir ""
# PROP Use_MFC 6
# PROP Use_Debug_Libraries 1
# PROP Output_Dir "Debug"
# PROP Intermediate_Dir "Debug"
# PROP Ignore_Export_Lib 0
# PROP Target_Dir ""
# ADD BASE CPP /nologo /MDd /W3 /Gm /GX /Zi /Od /D "WIN32" /D "_DEBUG" /D "_WINDOWS" /D "_WINDLL" /D "_AFXDLL" /Yu"stdafx.h" /FD /c
# ADD CPP /nologo /MDd /W3 /Gm /GX /ZI /Od /I "../Include" /D "WIN32" /D "_DEBUG" /D "_WINDOWS" /D "_WINDLL" /D "_AFXDLL" /D "_AFXEXT" /FR /Yu"stdafx.h" /FD /c
# ADD BASE MTL /nologo /D "_DEBUG" /mktyplib203 /o "NUL" /win32
# ADD MTL /nologo /D "_DEBUG" /mktyplib203 /o "NUL" /win32
# ADD BASE RSC /l 0x409 /d "_DEBUG" /d "_AFXDLL"
# ADD RSC /l 0x409 /i "../Include" /d "_DEBUG" /d "_AFXDLL"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 /nologo /subsystem:windows /dll /debug /machine:I386 /pdbtype:sept
# ADD LINK32 shlwapi.lib /nologo /subsystem:windows /dll /incremental:no /map /debug /debugtype:both /machine:I386 /out:"../Lib/CJ609Libd.dll" /implib:"../Lib/CJ609Libd.lib" /pdbtype:sept
# SUBTRACT LINK32 /pdb:none

!ELSEIF  "$(CFG)" == "CJLibrary - Win32 Unicode Release"

# PROP BASE Use_MFC 6
# PROP BASE Use_Debug_Libraries 0
# PROP BASE Output_Dir "Release"
# PROP BASE Intermediate_Dir "Release"
# PROP BASE Target_Dir ""
# PROP Use_MFC 6
# PROP Use_Debug_Libraries 0
# PROP Output_Dir "Release_Unicode"
# PROP Intermediate_Dir "Release_Unicode"
# PROP Ignore_Export_Lib 0
# PROP Target_Dir ""
# ADD BASE CPP /nologo /MD /W3 /GX /O2 /D "WIN32" /D "NDEBUG" /D "_WINDOWS" /D "_WINDLL" /D "_AFXDLL" /Yu"stdafx.h" /FD /c
# ADD CPP /nologo /MD /W3 /GX /O2 /I "../Include" /D "WIN32" /D "NDEBUG" /D "_WINDOWS" /D "_WINDLL" /D "_AFXDLL" /D "_AFXEXT" /D "_UNICODE" /Yu"stdafx.h" /FD /c
# ADD BASE MTL /nologo /D "NDEBUG" /mktyplib203 /o "NUL" /win32
# ADD MTL /nologo /D "NDEBUG" /mktyplib203 /o "NUL" /win32
# ADD BASE RSC /l 0x409 /d "NDEBUG" /d "_AFXDLL"
# ADD RSC /l 0x409 /i "../Include" /d "NDEBUG" /d "_AFXDLL"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 /nologo /subsystem:windows /dll /machine:I386
# ADD LINK32 shlwapi.lib /nologo /subsystem:windows /dll /machine:I386 /out:"../Lib/CJ609Libu.dll" /implib:"../Lib/CJ609Libu.lib"
# SUBTRACT LINK32 /pdb:none

!ELSEIF  "$(CFG)" == "CJLibrary - Win32 Unicode Debug"

# PROP BASE Use_MFC 6
# PROP BASE Use_Debug_Libraries 1
# PROP BASE Output_Dir "Debug"
# PROP BASE Intermediate_Dir "Debug"
# PROP BASE Target_Dir ""
# PROP Use_MFC 6
# PROP Use_Debug_Libraries 1
# PROP Output_Dir "Debug_Unicode"
# PROP Intermediate_Dir "Debug_Unicode"
# PROP Ignore_Export_Lib 0
# PROP Target_Dir ""
# ADD BASE CPP /nologo /MDd /W3 /Gm /GX /Zi /Od /D "WIN32" /D "_DEBUG" /D "_WINDOWS" /D "_WINDLL" /D "_AFXDLL" /Yu"stdafx.h" /FD /c
# ADD CPP /nologo /MDd /W3 /Gm /GX /ZI /Od /I "../Include" /D "WIN32" /D "_DEBUG" /D "_WINDOWS" /D "_WINDLL" /D "_AFXDLL" /D "_AFXEXT" /D "_UNICODE" /Yu"stdafx.h" /FD /c
# ADD BASE MTL /nologo /D "_DEBUG" /mktyplib203 /o "NUL" /win32
# ADD MTL /nologo /D "_DEBUG" /mktyplib203 /o "NUL" /win32
# ADD BASE RSC /l 0x409 /d "_DEBUG" /d "_AFXDLL"
# ADD RSC /l 0x409 /i "../Include" /d "_DEBUG" /d "_AFXDLL"
BSC32=bscmake.exe
# ADD BASE BSC32 /nologo
# ADD BSC32 /nologo
LINK32=link.exe
# ADD BASE LINK32 /nologo /subsystem:windows /dll /debug /machine:I386 /pdbtype:sept
# ADD LINK32 shlwapi.lib /nologo /subsystem:windows /dll /incremental:no /map /debug /debugtype:both /machine:I386 /out:"../Lib/CJ609Libud.dll" /implib:"../Lib/CJ609Libud.lib" /pdbtype:sept
# SUBTRACT LINK32 /pdb:none

!ENDIF 

# Begin Target

# Name "CJLibrary - Win32 Release"
# Name "CJLibrary - Win32 Debug"
# Name "CJLibrary - Win32 Unicode Release"
# Name "CJLibrary - Win32 Unicode Debug"
# Begin Group "Source Files"

# PROP Default_Filter "cpp;c;cxx;rc;def;r;odl;idl;hpj;bat"
# Begin Source File

SOURCE=.\CJBrowseEdit.cpp
# End Source File
# Begin Source File

SOURCE=.\CJCaption.cpp
# End Source File
# Begin Source File

SOURCE=.\CJCaptionPopupWnd.cpp
# End Source File
# Begin Source File

SOURCE=.\CJColorPicker.cpp
# End Source File
# Begin Source File

SOURCE=.\CJColorPopup.cpp
# End Source File
# Begin Source File

SOURCE=.\CJComboBoxEx.cpp
# End Source File
# Begin Source File

SOURCE=.\CJControlBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJDateTimeCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJDockBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJDockContext.cpp
# End Source File
# Begin Source File

SOURCE=.\CJExplorerBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJFlatButton.cpp
# End Source File
# Begin Source File

SOURCE=.\CJFlatComboBox.cpp
# End Source File
# Begin Source File

SOURCE=.\CJFlatHeaderCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJFlatSplitterWnd.cpp
# End Source File
# Begin Source File

SOURCE=.\CJFlatTabCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJFontCombo.cpp
# End Source File
# Begin Source File

SOURCE=.\CJFrameWnd.cpp
# End Source File
# Begin Source File

SOURCE=.\CJHexEdit.cpp
# End Source File
# Begin Source File

SOURCE=.\CJHtmlView.cpp
# End Source File
# Begin Source File

SOURCE=.\CJHyperLink.cpp
# End Source File
# Begin Source File

SOURCE=.\CJLibrary.cpp
# End Source File
# Begin Source File

SOURCE=.\CJLibrary.def
# End Source File
# Begin Source File

SOURCE=.\CJLibrary.rc
# End Source File
# Begin Source File

SOURCE=.\CJListBox.cpp
# End Source File
# Begin Source File

SOURCE=.\CJListCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJListView.cpp
# End Source File
# Begin Source File

SOURCE=.\CJLogoPane.cpp
# End Source File
# Begin Source File

SOURCE=.\CJMaskEdit.cpp
# End Source File
# Begin Source File

SOURCE=.\CJMDIChildWnd.cpp
# End Source File
# Begin Source File

SOURCE=.\CJMDIFrameWnd.cpp
# End Source File
# Begin Source File

SOURCE=.\CJMemFile.cpp
# End Source File
# Begin Source File

SOURCE=.\CJMenu.cpp
# End Source File
# Begin Source File

SOURCE=.\CJMenuBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJMetaFileButton.cpp
# End Source File
# Begin Source File

SOURCE=.\CJMiniDockFrameWnd.cpp
# End Source File
# Begin Source File

SOURCE=.\CJOutlookBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJPagerCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJReBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJReBarCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJShell.cpp
# End Source File
# Begin Source File

SOURCE=.\CJShellList.cpp
# End Source File
# Begin Source File

SOURCE=.\CJShellTree.cpp
# End Source File
# Begin Source File

SOURCE=.\CJSizeDockBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJSortClass.cpp
# End Source File
# Begin Source File

SOURCE=.\CJStatusBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJTabCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJTabCtrlBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJTabView.cpp
# End Source File
# Begin Source File

SOURCE=.\CJToolBar.cpp
# End Source File
# Begin Source File

SOURCE=.\CJToolBarBase.cpp
# End Source File
# Begin Source File

SOURCE=.\CJToolBarCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJTreeCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\CJWindowPlacement.cpp
# End Source File
# Begin Source File

SOURCE=.\GfxGroupEdit.cpp
# End Source File
# Begin Source File

SOURCE=.\GfxOutBarCtrl.cpp
# End Source File
# Begin Source File

SOURCE=.\GfxSplitterWnd.cpp
# End Source File
# Begin Source File

SOURCE=.\StdAfx.cpp
# ADD CPP /Yc"stdafx.h"
# End Source File
# Begin Source File

SOURCE=.\Subclass.cpp
# End Source File
# End Group
# Begin Group "Header Files"

# PROP Default_Filter "h;hpp;hxx;hm;inl"
# Begin Source File

SOURCE=..\Include\CJBrowseEdit.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJCaption.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJCaptionPopupWnd.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJColorPicker.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJColorPopup.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJComboBoxEx.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJControlBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJDateTimeCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJDockBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJDockContext.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJExplorerBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJFlatButton.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJFlatComboBox.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJFlatHeaderCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJFlatSplitterWnd.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJFlatTabCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJFontCombo.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJFrameWnd.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJHexEdit.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJHtmlView.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJHyperLink.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJLibrary.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJListBox.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJListCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJListView.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJLogoPane.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJMaskEdit.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJMDIChildWnd.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJMDIFrameWnd.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJMemFile.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJMenu.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJMenuBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJMetaFileButton.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJMiniDockFrameWnd.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJOutlookBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJPagerCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJReBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJReBarCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJShell.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJShellList.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJShellTree.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJSizeDockBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJSortClass.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJStatusBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJTabCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJTabCtrlBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJTabView.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJToolBar.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJToolBarBase.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJToolBarCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJTreeCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\CJWindowPlacement.h
# End Source File
# Begin Source File

SOURCE=..\Include\GfxGroupEdit.h
# End Source File
# Begin Source File

SOURCE=..\Include\GfxOutBarCtrl.h
# End Source File
# Begin Source File

SOURCE=..\Include\GfxSplitterWnd.h
# End Source File
# Begin Source File

SOURCE=.\Resource.h
# End Source File
# Begin Source File

SOURCE=.\StdAfx.h
# End Source File
# Begin Source File

SOURCE=..\Include\Subclass.h
# End Source File
# End Group
# Begin Group "Resource Files"

# PROP Default_Filter "ico;cur;bmp;dlg;rc2;rct;bin;cnt;rtf;gif;jpg;jpeg;jpe"
# Begin Source File

SOURCE=.\res\CJLibrary.rc2
# End Source File
# End Group
# Begin Source File

SOURCE=.\Modify.txt
# End Source File
# Begin Source File

SOURCE=.\ReadMe.txt
# End Source File
# End Target
# End Project
