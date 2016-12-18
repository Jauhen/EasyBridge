//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CCardLocation
//
#ifndef __CCARDLOCATION__
#define __CCARDLOCATION__

#include "engine/GuessedCard.h"

// 
class CCardLocation {

  // public operations
public:
  void Clear();
  CGuessedCard& operator[](int nIndex) { VERIFY(ISDECKVAL(nIndex)); return *m_cards[nIndex]; }

  // private data
private:
  std::shared_ptr<AppInterface> app_;
  std::vector<std::shared_ptr<CGuessedCard>> m_cards;

  // construction / destruction
public:
  CCardLocation(std::shared_ptr<AppInterface> app);
  ~CCardLocation();
};


#endif