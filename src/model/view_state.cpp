#include "stdafx.h"
#include "model/view_state.h"

ViewState::ViewState() {
  m_nCurrMode = MODE_NONE;
  m_nOldMode = MODE_NONE;
}

ViewState::~ViewState() {}
