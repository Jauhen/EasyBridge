#include "stdafx.h"
#include "model/deal.h"
#include "engine/CARD.H"
#include "engine/Player.h"


Deal::Deal(std::shared_ptr<AppInterface> app) : app_(app) {
}

Deal::~Deal() {
}
