//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CFinesse (Finesse.h / Finesse.cpp)
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import {
  isFaceVal,
  isPosition,
  isSuit,
  nextPosition,
  NONE,
  Position,
  prevPosition,
  Suit,
} from '../constants.js';
import {
  IN_DUMMY,
  IN_EITHER,
  IN_HAND,
  Play,
  PlayDependencies,
  PlayProspect,
  PlayResult,
  PlayType,
} from './play.js';

export enum FinesseTarget {
  AgainstLHO = 0,
  AgainstRHO = 1,
  AgainstBoth = 2,
}

export enum FinesseSubType {
  TypeI = 0,
  TypeII = 1,
  TypeIII = 2,
  TypeIV = 3,
  TypeA = 4,
  TypeB = 5,
}

export class Finesse extends Play {
  subType: FinesseSubType = FinesseSubType.TypeI;
  playerPosition: Position | typeof NONE = NONE;
  target: FinesseTarget = FinesseTarget.AgainstLHO;
  targetPos: Position | typeof NONE = NONE;
  gapSize = 0;
  cardVal: number = NONE;
  gapCards: CardList | null = null;
  protected trumpSuit: Suit | typeof NONE = NONE;

  constructor(
    suitOrCard: Suit | typeof NONE | Card = NONE,
    options: {
      subType?: FinesseSubType;
      targetHand?: number;
      playerPosition?: Position | typeof NONE;
      gapCards?: CardList | Card[];
      cardVal?: number;
      opportunistic?: boolean;
      trumpSuit?: Suit | typeof NONE;
    } = {},
  ) {
    const suit = suitOrCard instanceof Card ? suitOrCard.suit : suitOrCard;
    const cardVal = suitOrCard instanceof Card ? suitOrCard.faceValue : (options.cardVal ?? NONE);
    super(
      PlayType.Finesse,
      options.targetHand ?? IN_EITHER,
      suit,
      PlayProspect.Speculative,
      options.opportunistic ?? false,
    );
    this.subType = options.subType ?? FinesseSubType.TypeI;
    this.playerPosition = options.playerPosition ?? NONE;
    this.cardVal = cardVal;
    this.trumpSuit = options.trumpSuit ?? NONE;
    if (options.gapCards) {
      this.gapCards = options.gapCards instanceof CardList
        ? options.gapCards
        : new CardList(options.gapCards);
    }
    this.init();
  }

  override clear(): void {
    super.clear();
    this.playerPosition = NONE;
    this.startingHand = IN_EITHER;
    this.endingHand = IN_EITHER;
    this.target = FinesseTarget.AgainstLHO;
    this.targetPos = NONE;
    this.gapSize = 0;
    this.cardVal = NONE;
  }

  override init(): void {
    super.init();

    if (this.gapCards) {
      this.gapSize = this.gapCards.length;
      this.setEnemyAlternativeKeyCards(this.gapCards);
      // check enemy target card(s)
      if (this.gapCards.length === 1) {
        this.targetCard = this.gapCards.at(0) ?? null;
      }
    }

    if (isSuit(this.suit) && isFaceVal(this.cardVal)) {
      this.consumedCard = new Card(this.suit, this.cardVal);
    }

    // the target hand is the ending hand
    this.endingHand = this.targetHand;
    this.startingHand = this.endingHand === IN_HAND ? IN_DUMMY : IN_HAND;

    // check the enemy and location
    this.target = this.endingHand === IN_DUMMY
      ? FinesseTarget.AgainstRHO
      : FinesseTarget.AgainstLHO;
    if (isPosition(this.playerPosition)) {
      this.targetPos = this.target === FinesseTarget.AgainstLHO
        ? nextPosition(this.playerPosition)
        : prevPosition(this.playerPosition);
    }

    // form name & description
    if (this.consumedCard) {
      if (this.suit === this.trumpSuit) {
        this.strName = `Trump ${this.consumedCard.faceName} Finesse`;
        this.strDescription = `Finesse the ${this.consumedCard.faceName} of trumps`;
      } else {
        this.strName = `${this.consumedCard.name} Finesse`;
        this.strDescription = `Finesse the ${this.consumedCard.name}`;
      }
    }
  }

  get depth(): number {
    return this.gapSize;
  }

  override perform(_dependencies?: PlayDependencies): PlayResult {
    this.status = PlayResult.InProgress;
    return this.status;
  }
}
