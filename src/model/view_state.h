#ifndef EZ_MODEL_VIEW_STATE_
#define EZ_MODEL_VIEW_STATE_


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

  bool IsAllCardVisible() { return m_nCurrMode == MODE_CARDLAYOUT || m_nCurrMode == MODE_EDITHANDS; }
public:
  //
  ScreenMode m_nCurrMode;
  ScreenMode m_nOldMode;

};

#endif // EZ_MODEL_VIEW_STATE_
