//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CSlamConvention (SlamConvention.h / SlamConvention.cpp)
//
// Base convention for Blackwood/RKCB and cue-bid slam inquiry.
// CSlamConvention::ApplyTest returns FALSE until explicitly invoked by CBidEngine.
//

import { Bid } from '../constants.js';
import { Convention, ConventionContext } from './convention.js';
import { ConventionStatus } from './biddingCodes.js';

export class SlamConvention extends Convention {
  constructor(id: number) {
    super(id);
  }

  override applyTest(context: ConventionContext): Bid | null {
    void context;
    return null;
  }

  override tryConvention(context: ConventionContext): Bid | null {
    context.bidContext.status = ConventionStatus.Inactive;
    return null;
  }
}
