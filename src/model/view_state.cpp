#include "stdafx.h"
#include "model/view_state.h"
#include "model/settings.h"
#include "app_interface.h"

ViewState::ViewState() {
  m_nCurrMode = MODE_NONE;
  m_nOldMode = MODE_NONE;
}



ViewState::~ViewState() {}

//
bool ViewState::CanDealNewHand() {
  switch (m_nCurrMode) {
    // new deal illegal in the following modes
    case MODE_TITLESCREEN:
    case MODE_INTROSCREEN:
    case MODE_WAITTIMER:
    case MODE_GAMERESTORE:
      //		case MODE_THINKING:
      return false;

      // new deal OK in the following modes
    case MODE_NONE:
    case MODE_WAITCARDPLAY:
    case MODE_CLICKTOBEGINPLAY:
    case MODE_CLICKFORNEXTTRICK:
    case MODE_CLICKTORESTARTTRICK:
    case MODE_CLICKTOCONTINUE:
    case MODE_CLICKFORNEXTGAME:
    case MODE_WAITKEYPRESS:
    case MODE_CARDLAYOUT:
    case MODE_EDITHANDS:
    case MODE_WAITTOBID:
    case MODE_GAMEREVIEW:
    case MODE_THINKING:
      return true;

      // otherwise return false (should never get here!)
    default:
      return false;	// don't know
  }
}


//
// CanSaveFile() 
//
bool ViewState::CanSaveFile() {
  switch (m_nCurrMode) {
    //
    case MODE_CARDLAYOUT:
    case MODE_EDITHANDS:
      //			if (m_numCardsUnassigned > 0)
      return false;
      break;

      // other restrictions?
    case MODE_THINKING:
      return false;

    default:
      break;
  }

  // default is TRUE
  return true;
}

//
// EnableCardAnimation()
//
bool ViewState::EnableCardAnimation(bool bEnable) {
  bool bOldMode = m_bAnimateCards;
  m_bAnimateCards = bEnable;
  return bOldMode;
}

//
void ViewState::ResetSuitSequence() {
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      if (app_->GetSettings()->GetSuitSequence(j) == i)
        m_nSuitToScreenIndex[i] = j;
    }
  }
  //
  ResetDummySuitSequence();
}



//
void ViewState::ResetDummySuitSequence() {
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      if (app_->GetSettings()->GetDummySuitSequence(j) == i)
        m_nDummySuitToScreenIndex[i] = j;
    }
  }
}

