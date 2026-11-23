//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CCardLocation (CardLocation.H / CardLocation.cpp)
//

import { Card } from './card.js';
import { isDeckVal } from './constants.js';
import { GuessedCard } from './guessedCard.js';

export class CardLocation {
  private readonly cards: GuessedCard[];

  //
  // construction / destruction
  //
  constructor() {
    this.cards = Array.from({ length: 52 }, (_, deckValue) =>
      new GuessedCard(Card.fromDeckValue(deckValue)),
    );
  }

  //
  // Clear()
  //
  clear(): void {
    for (let i = 0; i < 52; i++) {
      this.cards[i].clear();
    }
  }

  //
  // operator[]
  //
  at(deckValue: number): GuessedCard {
    if (!isDeckVal(deckValue)) {
      throw new RangeError(`Invalid deck value ${deckValue}`);
    }
    return this.cards[deckValue];
  }

  get all(): readonly GuessedCard[] {
    return this.cards;
  }
}
