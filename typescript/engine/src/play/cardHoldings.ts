//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CCardHoldings (CardHoldings.H / CardHoldings.cpp)
//
// a collection of cards
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { Suit } from '../constants.js';

export class CardHoldings extends CardList {
  protected numHCPoints = 0;
  protected countPerformed = false;
  protected strGIBFormatHoldings = '...';

  //
  // Construction/Destruction
  //
  constructor(cards: readonly Card[] | CardList = []) {
    super(cards);
  }

  //
  // Basic routines
  //

  override init(): void {
    super.init();
  }

  //
  // Clear()
  //
  // clear the holding of all cards
  //
  override clear(): void {
    super.clear();
    // always clear the point count when clearing the hand
    this.clearPointCount();
  }

  //
  // ClearPointCount()
  //
  clearPointCount(): void {
    this.countPerformed = false;
    this.numHCPoints = 0;
  }

  //
  // Sort()
  //
  override sort(): void {
    // first call base class to sort the cards in S-H-D-C order
    super.sort();

    // and set the custom hand description for GIB
    this.formatGIBHoldingsString();
  }

  //
  // GetCardsOfSuit()
  //
  getCardsOfSuit(suit: Suit, suitList?: CardList): number {
    let count = 0;
    for (let i = 0; i < this.cards.length; i++) {
      if (this.cards[i].suit === suit) {
        count++;
        if (suitList) suitList.add(this.cards[i]);
      }
    }
    if (suitList && !suitList.isSorted) {
      suitList.sort();
    }
    return count;
  }

  getNumCardsOfSuit(suit: Suit): number {
    return this.getCardsOfSuit(suit);
  }

  //
  // FormatHoldingsString()
  //
  override formatHoldingsString(): void {
    // first call the base class
    super.formatHoldingsString();

    // then format for GIB
    this.formatGIBHoldingsString();
  }

  //
  // FormatGIBHoldingsString()
  //
  formatGIBHoldingsString(): void {
    // format the hand string in GIB style
    let currentSuit = Suit.Spades;
    let index = 0;
    let gib = '';
    for (let i = 0; i < 4; i++) {
      while (index < this.cards.length && this.cards[index].suit === currentSuit) {
        gib += this.cards[index].cardLetter;
        index++;
      }
      if (i < 3) gib += '.';
      currentSuit--;
    }
    this.strGIBFormatHoldings = gib;
  }

  //
  // CountPoints()
  //
  countPoints(forceCount = false): number {
    // avoid repeating the count unless forced to do so
    if (this.countPerformed && !forceCount) {
      return this.numHCPoints;
    }

    // else clear and start the count
    this.clearPointCount();
    for (let i = 0; i < this.cards.length; i++) {
      const faceVal = this.cards[i].faceValue;
      if (faceVal >= 10) {
        this.numHCPoints += this.cards[i].honorPoints;
      }
    }

    // done
    this.countPerformed = true;
    return this.numHCPoints;
  }

  evaluateHoldings(): void {
    // base no-op (CCardHoldings::EvaluateHoldings)
  }

  get hcPoints(): number {
    return this.numHCPoints;
  }

  get cardPoints(): number {
    return this.hcPoints;
  }

  get gibFormatHoldingsString(): string {
    return this.strGIBFormatHoldings;
  }
}
