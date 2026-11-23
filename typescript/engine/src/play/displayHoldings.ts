//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CDisplayHoldings (DisplayHoldings.H / DisplayHoldings.cpp)
//

import { Card } from '../card.js';
import { MAXHOLDING } from '../constants.js';
import { CardHoldings } from './cardHoldings.js';

export class DisplayHoldings extends CardHoldings {
  private dummy = false;

  constructor() {
    super();
    this.dummy = false;
  }

  override init(): void {
    super.init();
  }

  override clear(): void {
    super.clear();
    this.dummy = false;
  }

  setDummyFlag(value = true): void {
    this.dummy = value;
  }

  setDummy(dummy = true): void {
    this.setDummyFlag(dummy);
  }

  get isDummy(): boolean {
    return this.dummy;
  }

  override add(card: Card, sort = false): void {
    if (this.cards.length >= MAXHOLDING) return;
    if (sort || this.autoSort) {
      // insert the card into the list, which is sorted in ascending order
      // i.e., with S-H-D-C display order, SA=0, and C2=51
      // but check to see if we're dummy
      let i = 0;
      if (this.dummy) {
        // dummy
        const nValue = card.getDummyDisplayValue();
        for (i = 0; i < this.cards.length; i++) {
          if (nValue < this.cards[i].getDummyDisplayValue()) break;
        }
      } else {
        // not dummy
        const nValue = card.getDisplayValue();
        for (i = 0; i < this.cards.length; i++) {
          if (nValue < this.cards[i].getDisplayValue()) break;
        }
      }
      this.cards.splice(i, 0, card);
      for (let j = i; j < this.cards.length; j++) {
        this.cards[j].setDisplayPosition(j);
      }
      this.sorted = true;
    } else {
      this.cards.push(card);
      this.sorted = false;
    }
  }

  override removeByIndex(index: number): Card | null {
    if (index < 0 || index >= this.cards.length) return null;
    const [card] = this.cards.splice(index, 1);
    // move other cards over and update display indices
    for (let i = index; i < this.cards.length; i++) {
      this.cards[i].setDisplayPosition(i);
    }
    return card ?? null;
  }

  override sort(): void {
    if (this.sorted) return;
    // use screen display order sort
    this.cards.sort((a, b) =>
      this.dummy
        ? a.getDummyDisplayValue() - b.getDummyDisplayValue()
        : a.getDisplayValue() - b.getDisplayValue(),
    );
    for (let i = 0; i < this.cards.length; i++) {
      this.cards[i].setDisplayPosition(i);
    }
    this.sorted = true;
  }
}
