#ifndef EZ_MODEL_VIEW_STATE_
#define EZ_MODEL_VIEW_STATE_

#include <memory>

class AppInterface;

class ViewState {
public:
  enum ScreenMode {
    MODE_NONE = 0,
    MODE_UNKNOWN = 0,
    MODE_TITLESCREEN = 10,	// opening screen
    MODE_INTROSCREEN = 15,	// intro screen
    MODE_WAITCARDPLAY = 20,	// waiting for a card to play
    MODE_CLICKTOBEGINPLAY = 30,	// waiting for a mouse click
    MODE_CLICKTORESUMEPLAY = 35,   // waiting for a mouse click
    MODE_CLICKFORNEXTTRICK = 40,	// waiting for a mouse click
    MODE_CLICKTORESTARTTRICK = 50,	// after restarting a trick
    MODE_CLICKTOCONTINUE = 60,	// waiting for a mouse click
    MODE_CLICKFORNEXTGAME = 70,	// waiting for a mouse click
    MODE_WAITKEYPRESS = 80,	// waiting for a key press
    MODE_CARDLAYOUT = 100,	// laying out cards
    MODE_EDITHANDS = 120,	// editing hands
    MODE_WAITTOBID = 140,	// waiting to bid
    MODE_THINKING = 160,	// thinking
    MODE_GAMEREVIEW = 180,	// reviewing a game
    MODE_GAMERESTORE = 185,	// restoring a game position
    MODE_WAITSPECIALDEAL = 190,	// waiting for a special deal
    MODE_WAITTIMER = 200,	// waiting for a timer
  };


  ViewState();
  ~ViewState();

  void SetApp(std::shared_ptr<AppInterface> app) { app_ = app; }

  bool IsAllCardVisible() const { return m_nCurrMode == MODE_CARDLAYOUT || m_nCurrMode == MODE_EDITHANDS; }
  bool IsInCardLayoutMode() const { return m_nCurrMode == MODE_CARDLAYOUT; }

  int GetCurrentMode() { return (int)m_nCurrMode; }
  bool CanDealNewHand();
  bool CanSaveFile();
  void SuppressRefresh() { m_nSuppressRefresh++; }
  void EnableRefresh(bool bReset = false) { if (bReset) m_nSuppressRefresh = 0; else m_nSuppressRefresh--; }
  bool IsRefreshSuppressed() { return m_nSuppressRefresh > 0; }

  bool EnableCardAnimation(bool bEnable);
  void ResetSuitSequence();
  void ResetDummySuitSequence();
  int GetSuitToScreenIndex(int nIndex) { return m_nSuitToScreenIndex[nIndex]; }
  int GetDummySuitToScreenIndex(int nIndex) { return m_nDummySuitToScreenIndex[nIndex]; }
  
  int GetAnimationGranularity() { return m_nAnimationGranularity; }
  bool GetAnimateCards() { return m_bAnimateCards; }
  bool GetTripleBuffer() { return m_bTripleBuffer; }
  bool GetOffsetVerticalSuits() { return m_bOffsetVertSuits; }
  bool CanDisplayBitmap() { return m_bCanDisplayBitmap; }
  CString GetBackgroundBitmap() { return m_strBackgroundBitmap; }

  void SetAnimationGranularity(int value) { m_nAnimationGranularity = value; }
  void SetAnimateCards(bool value) { m_bAnimateCards = value; }
  void SetTripleBuffer(bool value) { m_bTripleBuffer = value; }
  void SetOffsetVerticalSuits(bool value) { m_bOffsetVertSuits = value; }
  virtual bool SetBackgroundBitmap(LPCTSTR szFileName, BOOL bTest) { return true; }

public:
  //
  std::shared_ptr<AppInterface> app_;

  ScreenMode m_nCurrMode;
  ScreenMode m_nOldMode;
  int m_nSuppressRefresh;
  bool m_bAnimateCards;
  bool m_bCanDisplayBitmap;
  bool m_bTripleBuffer;
  bool m_bOffsetVertSuits;
  int m_nAnimationGranularity;

  int m_nSuitToScreenIndex[4];
  int m_nDummySuitToScreenIndex[4];
  CString m_strBackgroundBitmap;
};

#endif // EZ_MODEL_VIEW_STATE_
