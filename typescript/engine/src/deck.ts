//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CDeck (Deck.H / Deck.cpp)
//
// Encapsulates a deck of cards
// Note: MFC/GDI bitmap and image-list routines (InitializeBitmaps, Terminate) are omitted.
//

import { Card } from './card.js';
import { ACE, makeDeckValue, stringToDeckValue, Suit } from './constants.js';

// default card bitmap dimensions
export const DEFCARDWIDTH = 71;
export const DEFCARDHEIGHT = 96;
export const SMALLCARDWIDTH = 57;
export const SMALLCARDHEIGHT = 78;

//
// Round() from Globals.cpp
//
function cppRound(value: number): number {
  const f = Math.fround(value);
  if (Math.trunc(Math.fround(f + 0.5)) > Math.trunc(f)) {
    return Math.trunc(f) + 1;
  }
  return Math.trunc(f);
}

export class Deck {
  private readonly orderedCards: Card[];
  private shuffledCards: Card[] = [];
  private deckIndex: number[][] = Array.from({ length: 4 }, () => Array<number>(15).fill(-1));
  private initialized = false;
  private prevTime = Math.floor(Date.now() / 1000);
  private rngState = 1;
  private cardWidth = 0;
  private cardHeight = 0;
  private currCardBack = 0;
  private numCardBacks = 1;

  //
  // construction/destruction
  //
  constructor() {
    const cards: Card[] = [];
    let count = 0;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      for (let value = 2; value <= ACE; value++, count++) {
        const card = new Card(suit as Suit, value);
        cards.push(card);
        this.deckIndex[suit][value] = count;
      }
    }
    this.orderedCards = cards;
    this.shuffledCards = [...cards];
    this.initialized = true;
  }

  getCardWidth(lowRes = false): number {
    if (this.cardWidth > 0) return this.cardWidth;
    // not initialized yet
    return lowRes ? SMALLCARDWIDTH : DEFCARDWIDTH;
  }

  getCardHeight(lowRes = false): number {
    if (this.cardWidth > 0) return this.cardHeight;
    // not initialized yet
    return lowRes ? SMALLCARDHEIGHT : DEFCARDHEIGHT;
  }

  getNumCardBacks(): number {
    return this.numCardBacks;
  }

  setCardBackIndex(index: number): void {
    if (index >= 0 && index < this.numCardBacks) {
      this.currCardBack = index;
    }
  }

  getCardBackIndex(): number {
    return this.currCardBack;
  }

  initialize(): void {
    this.initializeCards();
    // init the time
    this.prevTime = Math.floor(Date.now() / 1000);
  }

  initializeCards(): void {
    // init the deck
    let count = 0;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      for (let value = 2; value <= ACE; value++, count++) {
        this.orderedCards[count].clear();
        this.shuffledCards[count] = this.orderedCards[count];
        this.deckIndex[suit][value] = count;
      }
    }
    // done
    this.initialized = true;
  }

  clear(): void {
    if (!this.initialized) return;
    for (let i = 0; i < 52; i++) {
      this.shuffledCards[i].clear();
    }
    this.shuffledCards = [...this.orderedCards];
  }

  get cards(): readonly Card[] {
    return this.shuffledCards;
  }

  at(index: number): Card | undefined {
    return this.shuffledCards[index];
  }

  getSortedCard(index: number): Card | null {
    if (index < 0 || index > 51) return null;
    return this.orderedCards[index] ?? null;
  }

  getDeckIndex(suit: Suit, faceValue: number): number {
    return this.deckIndex[suit]?.[faceValue] ?? -1;
  }

  //
  // return a pointer to the specified value card
  //
  getCard(deckValue: number): Card | null {
    if (deckValue < 0 || deckValue > 51) return null;
    return this.orderedCards[deckValue] ?? null;
  }

  getCardByName(name: string): Card | null {
    const value = stringToDeckValue(name);
    return this.getCard(value);
  }

  getCardBySuitAndFace(suit: Suit, faceValue: number): Card | null {
    const deckValue = makeDeckValue(suit, faceValue);
    return this.getCard(deckValue);
  }

  //
  // Shuffle()
  //
  shuffle(seed = 0, suppressSeed = false, enableDealNumbering = true): number {
    // copy from the ordered deck if deal numbering is enabled
    // else leave shuffled
    if (enableDealNumbering) {
      for (let i = 0; i < 52; i++) {
        this.shuffledCards[i] = this.orderedCards[i];
      }
    }

    // then seed the random number generator
    let actualSeed = seed;
    if (actualSeed === 0) {
      // use the lower 16 bits of the current time since 1970 in seconds
      // OR-ed with the current millitime, and the elapsed time since the last deal
      // structure:
      //
      // +----------------+---------+--------+
      // |    31-17(16)   | 15-8(8) | 7-0(8) |
      // +----------------+---------+--------+
      // |  Time in secs  |Millitime|  E.T.  |
      // +----------------+---------+--------+
      //    0 -- 65,536      0-255     0-255
      //    (~ 18 hrs)   (top 10 bits)
      //
      const nowMs = Date.now();
      const timeSec = Math.floor(nowMs / 1000);
      const millitm = nowMs % 1000;
      const elapsedTime = timeSec - this.prevTime;
      const left = (timeSec << 16) | 0;
      const right = (millitm << 6) | (elapsedTime & 0x00ff);
      actualSeed = (left | right) | 0;
      this.prevTime = timeSec;
    }

    if (!suppressSeed) {
      this.rngState = actualSeed >>> 0;
    }

    // Mirrors Visual C++'s srand/rand implementation used by CDeck::Shuffle:
    // rand() is 15-bit (RAND_MAX = 32767) and advances with state = state * 214013 + 2531011.
    const rand = (): number => {
      this.rngState = (Math.imul(this.rngState, 214013) + 2531011) >>> 0;
      return (this.rngState >>> 16) & 0x7fff;
    };

    // Mirrors GetRandomValue(int nMax) in Globals.cpp
    const getRandomValue = (max: number): number => {
      const ratio = Math.fround(rand() / 32767);
      const value = Math.fround(Math.fround(ratio * (max + 1)) - Math.fround(0.4999));
      let rounded = cppRound(value);
      // sanity check
      if (rounded < 0) rounded = 0;
      if (rounded > max) rounded = max;
      return rounded;
    };

    for (let x = 0; x < 10; x++) {
      for (let i = 0; i < 52; i++) {
        // switch the ith card with a random card
        let nRand = getRandomValue(51);
        if (nRand === i) {
          nRand = getRandomValue(51); // try again
        }
        const tempCard = this.shuffledCards[i];
        const tempSuit = tempCard.suit;
        const tempVal = tempCard.faceValue;

        this.shuffledCards[i] = this.shuffledCards[nRand];
        this.deckIndex[this.shuffledCards[nRand].suit][this.shuffledCards[nRand].faceValue] = i;

        this.shuffledCards[nRand] = tempCard;
        this.deckIndex[tempSuit][tempVal] = nRand;
      }
    }

    // done
    return actualSeed;
  }
}
