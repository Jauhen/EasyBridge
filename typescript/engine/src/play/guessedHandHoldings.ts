//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CGuessedHandHoldings (GuessedHandHoldings.H / GuessedHandHoldings.cpp)
//

import { isSuit, Position, Suit } from '../constants.js';
import { GuessedCard } from '../guessedCard.js';
import { Hand } from '../hand.js';
import { GuessedCardHoldings } from './guessedCardHoldings.js';
import { GuessedSuitHoldings } from './guessedSuitHoldings.js';

export class GuessedHandHoldings extends GuessedCardHoldings {
  readonly suits: GuessedSuitHoldings[] = [
    new GuessedSuitHoldings(),
    new GuessedSuitHoldings(),
    new GuessedSuitHoldings(),
    new GuessedSuitHoldings(),
  ];
  private allCardsIdentified = false;

  //
  // Construction/Destruction
  //
  constructor() {
    super();
    // do one-time init of the suits
    for (let i = 0; i < 4; i++) {
      this.suits[i].setSuit(i as Suit);
    }
    // and perform other inits
    this.init();
  }

  //
  // InitNewHand()
  //
  // called after being dealt a hand
  //
  initNewHand(hand: Hand, position: Position): void {
    // fill our own hand with known cards
    for (const card of hand.cardsList.cardsInAscendingDeckOrder) {
      this.add(new GuessedCard(card, {
        outstanding: true,
        location: position,
        fixProbability: 1,
      }));
    }
  }

  //
  // Init()
  //
  override init(): void {
    // clear analysis variables
    super.init();
    for (let i = 0; i < 4; i++) {
      this.suits[i].init();
    }
    this.allCardsIdentified = false;
    this.formatHoldingsString();
  }

  //
  // Clear()
  //
  override clear(deleteCards = true): void {
    super.clear(deleteCards);
    // be sure NOT to delete the guessed cards again in the suits
    for (let i = 0; i < 4; i++) {
      this.suits[i].clear(false);
    }
    this.formatHoldingsString();
  }

  override formatHoldingsString(): void {
    this.strHoldings = `S:${this.suits[3].holdingsString}  H:${this.suits[2].holdingsString}  D:${this.suits[1].holdingsString}  C:${this.suits[0].holdingsString}`;
  }

  override add(card: GuessedCard, sort = false): void {
    super.add(card, sort);
    this.suits[card.suit].add(card, sort);
    this.formatHoldingsString();
  }

  override removeByIndex(index: number): GuessedCard | null {
    const card = super.removeByIndex(index);
    if (card) {
      this.suits[card.suit].remove(card);
      this.formatHoldingsString();
    }
    return card;
  }

  override sort(): void {
    // first call base class to sort the cards in S-H-D-C order
    super.sort();

    // sort each of the suits individually
    for (let i = 0; i < 4; i++) {
      this.suits[i].sort();
    }

    // and then set the literal hand description
    this.formatHoldingsString();
  }

  getSuit(suit: Suit): GuessedSuitHoldings {
    if (!isSuit(suit)) throw new RangeError(`Invalid suit ${suit}`);
    return this.suits[suit];
  }

  markSuitShownOut(suit: Suit, shownOut = true): void {
    if (!isSuit(suit)) throw new RangeError(`Invalid suit ${suit}`);
    this.suits[suit].markSuitShownOut(shownOut);
  }

  isSuitShownOut(suit: Suit): boolean {
    if (!isSuit(suit)) throw new RangeError(`Invalid suit ${suit}`);
    return this.suits[suit].isSuitShownOut;
  }

  wasSuitVoid(suit: Suit): boolean {
    if (!isSuit(suit)) throw new RangeError(`Invalid suit ${suit}`);
    return this.suits[suit].wasSuitVoid;
  }

  markAllCardsIdentified(allCardsIdentified = true): void {
    this.allCardsIdentified = allCardsIdentified;
  }

  get areAllCardsIdentified(): boolean {
    return this.allCardsIdentified;
  }

  get numSuitsFullyIdentified(): number {
    let numSuitsIdentified = 0;
    for (let i = 0; i < 4; i++) {
      if (this.suits[i].areAllCardsIdentified) numSuitsIdentified++;
    }
    return numSuitsIdentified;
  }
}
