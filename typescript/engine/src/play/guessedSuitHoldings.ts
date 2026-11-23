//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CGuessedSuitHoldings (GuessedSuitHoldings.H / GuessedSuitHoldings.cpp)
//

import { NONE, Suit } from '../constants.js';
import { GuessedCard } from '../guessedCard.js';
import { GuessedCardHoldings } from './guessedCardHoldings.js';

export class GuessedSuitHoldings extends GuessedCardHoldings {
  suit: Suit = NONE as Suit;
  private shownOut = false;
  private suitWasVoid = false;
  private allCardsIdentified = false;

  constructor() {
    super();
    this.maxRemainingCards = 13;
    this.maxOriginalCards = 13;
  }

  setSuit(suit: Suit): void {
    this.suit = suit;
  }

  override init(): void {
    super.init();
    this.shownOut = false;
    this.suitWasVoid = false;
    this.allCardsIdentified = false;
    //
    this.maxRemainingCards = 13;
    this.maxOriginalCards = 13;
  }

  override clear(deleteCards = true): void {
    super.clear(deleteCards);
  }

  override formatHoldingsString(): void {
    // format the holdings string
    if (this.cards.length > 0) {
      this.strHoldings = this.cards.map(card => card.cardLetter).join('');
    } else {
      this.strHoldings = '---';
    }
  }

  //
  // RemoveByIndex()
  //
  override removeByIndex(index: number): GuessedCard | null {
    // first call base class
    const card = super.removeByIndex(index);

    // then clean up items in this class
    if (card?.wasPlayed && this.shownOut) {
      // "forget" that the suit was shown out
      this.shownOut = false;
    }

    // done
    return card;
  }

  //
  // MarkSuitShownOut()
  //
  // a player has shown out in this suit
  //
  markSuitShownOut(shownOut = true): void {
    if (this.shownOut === shownOut) return;
    this.shownOut = shownOut;

    // see if the player turned out to have been void
    if (this.numPlayedCards === 0) {
      // mark the suit as void
      this.suitWasVoid = true;
    }

    // remove any speculative cards from this list
    for (let i = this.cards.length - 1; i >= 0; i--) {
      if (!this.cards[i].wasPlayed) {
        this.delete(this.cards[i]);
      }
    }

    // adjust counts
    this.definiteCards = this.playedCards;
    this.likelyCards = 0;

    // remaining cards are now zero
    this.remainingCards = 0;
    this.minRemainingCards = 0;
    this.maxRemainingCards = 0;

    // original (starting) cards = cards played
    this.originalCards = this.playedCards;
    this.minOriginalCards = this.playedCards;
    this.maxOriginalCards = this.playedCards;

    // mark status
    this.allCardsIdentified = true;
  }

  get isSuitShownOut(): boolean {
    return this.shownOut;
  }

  markSuitVoid(suitWasVoid = true): void {
    this.suitWasVoid = suitWasVoid;
  }

  get wasSuitVoid(): boolean {
    return this.suitWasVoid;
  }

  markAllCardsIdentified(allCardsIdentified = true): void {
    this.allCardsIdentified = allCardsIdentified;
  }

  get areAllCardsIdentified(): boolean {
    return this.allCardsIdentified;
  }

  //
  // GetNumRemainingCards()
  //
  override get numRemainingCards(): number {
    // see if all cards have been identified
    if (this.allCardsIdentified) {
      return this.originalCards - this.playedCards;
    }
    // don't know yet
    return NONE;
  }
}
