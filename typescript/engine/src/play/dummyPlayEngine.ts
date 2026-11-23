//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//=====================================================================
//
// CDummyPlayEngine (DummyPlayEngine.H / DummyPlayEngine.cpp)
//
// - encapsulates dummy's play engine and delegates to declarer
//
//=====================================================================

import { Card } from '../card.js';
import { NONE, Position, Suit } from '../constants.js';
import { PlayEngine, PlayRoundContext } from './playEngine.js';

export class DummyPlayEngine extends PlayEngine {
  override adjustCardCountFromPlay(_pos: Position, _card: Card): void {
    // do nothing for now (CDummyPlayEngine::AdjustCardCount)
  }

  override adjustHoldingsCount(card: Card): void {
    super.adjustHoldingsCount(card);
  }

  override getLeadCard(roundContext?: PlayRoundContext): Card | null {
    // shouldn't call this routine, unless declarer runs out of plays
    return super.getLeadCard(roundContext);
  }

  //
  // PlayCard()
  //
  // select a card to play
  //
  override playCard(ledSuit: Suit | typeof NONE = NONE, roundContext?: PlayRoundContext): Card | null {
    this.assessPosition(roundContext);

    // pass control over to declarer if wired
    if (this.partner?.playForDummy) {
      const delegated = this.partner.playForDummy();
      if (delegated) return delegated;
    }

    // fallback when invoked standalone without a wired declarer
    if (!this.hand) return null;
    if (ledSuit !== NONE) {
      const following = this.hand.getCardsInSuit(ledSuit);
      if (following.length > 0) {
        const card = following[0];
        this.hand.remove(card);
        return card;
      }
    }
    return super.playCard(ledSuit, roundContext);
  }

  //
  // PlayForSelf()
  //
  // let the dummy play for himself
  //
  playForSelf(ledSuit: Suit | typeof NONE = NONE, roundContext?: PlayRoundContext): Card | null {
    return super.playCard(ledSuit, roundContext);
  }

  //
  // GetPlayHint()
  //
  override getPlayHint(_roundContext?: PlayRoundContext): Card | null {
    return this.partner?.getPlayHintForDummy?.() ?? null;
  }

  //
  // GetNumClaimableTricks()
  //
  override getNumClaimableTricks(): number {
    return this.partner?.getNumClaimableTricks?.() ?? 0;
  }
}
