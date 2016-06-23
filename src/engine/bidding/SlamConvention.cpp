//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CSlamConvention.cpp
//

#include "stdafx.h"
#include "engine/card_constants.h"
#include "engine/bidding/SlamConvention.h"


//
BOOL CSlamConvention::ApplyTest(const CPlayer& player, 
							    const CConventionSet& conventions, 
							    CHandHoldings& hand, 
							    CCardLocation& cardLocation, 
							    CGuessedHandHoldings** ppGuessedHands,
						        CBidEngine& playerBidState, 
							    CPlayerStatusDialog& status)
{
	return FALSE;
}


//
//==================================================================
// construciton & destruction
CSlamConvention::CSlamConvention(std::shared_ptr<AppInterface> app)
  : CConvention(app) {
}

CSlamConvention::~CSlamConvention() 
{
}



