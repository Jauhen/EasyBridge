//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CDiscard (Discard.h / Discard.cpp)
//

import { Card } from '../card.js';
import { isFaceVal, isSuit, NONE, Suit } from '../constants.js';
import { IN_HAND, Play, PlayDependencies, PlayProspect, PlayResult, PlayType } from './play.js';

export class Discard extends Play {
  cardVal: number = NONE;

  constructor(
    suitOrCard: Suit | typeof NONE | Card = NONE,
    targetHand: number = IN_HAND,
    cardVal: number = NONE,
  ) {
    if (suitOrCard instanceof Card) {
      super(PlayType.Discard, targetHand, suitOrCard.suit, PlayProspect.Loser);
      this.cardVal = suitOrCard.faceValue;
      this.init();
    } else {
      super(PlayType.Discard, targetHand, suitOrCard, PlayProspect.Loser);
      this.cardVal = cardVal;
      if (isSuit(suitOrCard) && isFaceVal(cardVal)) {
        this.init();
      }
    }
  }

  override clear(): void {
    super.clear();
    this.cardVal = NONE;
  }

  override init(): void {
    super.init();
    if (isSuit(this.suit) && isFaceVal(this.cardVal)) {
      this.consumedCard = new Card(this.suit, this.cardVal);
      // form description
      this.strDescription = `Discard the ${this.consumedCard.name}`;
    }
  }

  override getFullDescription(): string {
    if (!this.consumedCard) return 'Discard a card.';
    return `Discard the ${this.consumedCard.name} in ${this.targetHand === IN_HAND ? 'hand' : 'dummy'}.`;
  }

  //
  // Perform()
  //
  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies) {
      this.status = PlayResult.Complete;
      return this.status;
    }
    // not written yet in C++ Discard.cpp (returns PLAY_NOT_VIABLE)
    this.status = PlayResult.NotViable;
    return this.status;
  }
}
