//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// StaymanConvention.h
//
#ifndef __STAYMAN__
#define __STAYMAN__

#include "engine/bidding/Convention.h"


//
// The CStaymanConvention class
//
class CStaymanConvention : public CConvention {
  // private routines
private:
  BOOL TryConvention(const CPlayer& player, const CConventionSet& conventions, CHandHoldings& hand, CCardLocation& cardLocation, CGuessedHandHoldings** ppGuessedHands, CBidEngine& bidState, CPlayerStatusDialog& status);
  BOOL RespondToConvention(const CPlayer& player, const CConventionSet& conventions, CHandHoldings& hand, CCardLocation& cardLocation, CGuessedHandHoldings** ppGuessedHands, CBidEngine& bidState, CPlayerStatusDialog& status);
  BOOL HandleConventionResponse(const CPlayer& player, const CConventionSet& conventions, CHandHoldings& hand, CCardLocation& cardLocation, CGuessedHandHoldings** ppGuessedHands, CBidEngine& bidState, CPlayerStatusDialog& status);

  // data
private:


  // 
public:
  CStaymanConvention(std::shared_ptr<AppInterface> app);
  virtual ~CStaymanConvention();
};


#endif

