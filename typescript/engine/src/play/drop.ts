//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CDrop (Drop.h / Drop.cpp)
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { isFaceVal, isSuit, NONE, Suit } from '../constants.js';
import { IN_DUMMY, IN_HAND, Play, PlayDependencies, PlayProspect, PlayResult, PlayType } from './play.js';

export const AGAINST_LHO = 0;
export const AGAINST_RHO = 1;
export const AGAINST_EITHER = 2;

export class Drop extends Play {
  targetOpponent: number = AGAINST_EITHER;
  cardVal: number = NONE;
  numTargetCards = 0;
  strDropCards = '';
  strDropMessage = '';

  constructor(
    suitOrCard: Suit | typeof NONE | Card = NONE,
    targetHand: number = IN_HAND,
    targetOpponent: number = AGAINST_EITHER,
    enemyCards?: CardList | Card[],
    cardVal: number = NONE,
  ) {
    if (suitOrCard instanceof Card) {
      super(PlayType.Drop, targetHand, suitOrCard.suit, PlayProspect.LikelyWinner);
      this.targetOpponent = targetOpponent;
      this.cardVal = suitOrCard.faceValue;
    } else {
      super(PlayType.Drop, targetHand, suitOrCard, PlayProspect.LikelyWinner);
      this.targetOpponent = targetOpponent;
      this.cardVal = cardVal;
    }
    if (enemyCards) {
      this.setEnemyAlternativeKeyCards(enemyCards);
    }
    if (isSuit(this.suit) && isFaceVal(this.cardVal)) {
      this.init();
    }
  }

  override clear(): void {
    super.clear();
    this.cardVal = NONE;
    this.targetOpponent = AGAINST_EITHER;
    this.numTargetCards = 0;
    this.strDropCards = '';
    this.strDropMessage = '';
  }

  override init(): void {
    super.init();
    if (isSuit(this.suit) && isFaceVal(this.cardVal)) {
      this.consumedCard = new Card(this.suit, this.cardVal);
    }
    this.numTargetCards = this.enemyAlternativeKeyCards.length;
    if (this.numTargetCards === 1) {
      this.strDropCards = `the ${this.enemyAlternativeKeyCards[0].name}`;
    } else if (this.numTargetCards > 1) {
      const holdings = this.enemyAlternativeKeyCards.map(c => c.name).join(' ');
      this.strDropCards = `one or more of the { ${holdings} }`;
    } else {
      this.strDropCards = 'enemy honors';
    }
    // form name & description
    this.strDropMessage = ` to try and drop ${this.strDropCards}`;
    this.strName = `Drop ${this.strDropCards}`;
    if (this.consumedCard) {
      this.strDescription = `Drop ${this.strDropCards} w/ the ${this.consumedCard.faceName}.`;
    }
  }

  override getFullDescription(): string {
    if (!this.consumedCard) return `Drop ${this.strDropCards}.`;
    return `Play the ${this.consumedCard.name} from ${this.targetHand === IN_HAND ? 'hand' : 'Dummy'}${this.strDropMessage}.`;
  }

  //
  // Perform()
  //
  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit)) {
      this.status = PlayResult.Complete;
      return this.status;
    }

    const { combinedHand, status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const declarerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const playerSuit = declarerHand?.getSuit(this.suit);
    const dummySuit = dummyHand?.getSuit(this.suit);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const trumpSuit = dependencies.trumpSuit ?? NONE;
    const trumped =
      isSuit(trumpSuit) &&
      suitLed !== trumpSuit &&
      dependencies.currentBestCard?.suit === trumpSuit;

    const strLHO = playingInHand ? 'LHO' : 'RHO';
    const strRHO = playingInHand ? 'RHO' : 'LHO';

    // test preconditions
    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    let playCard: Card | null = null;
    const isTargetCard = (c: Card | null): boolean =>
      c !== null && this.enemyAlternativeKeyCards.some(e => e.deckValue === c.deckValue);

    switch (ordinal) {
      case 0: {
        // we're leading, player #0
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          // leading high from hand
          playCard = this.consumedCard;
          status?.stream(`PLDRP10! Lead the ${playCard?.name}${this.strDropMessage}.\n`);
        } else {
          // in the opposite hand, so lead low
          if ((playingInHand && (!playerSuit || playerSuit.isVoid)) || (!playingInHand && (!dummySuit || dummySuit.isVoid))) {
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          playCard = playingInHand ? playerSuit!.bottomCard : dummySuit!.bottomCard;
          status?.stream(
            `PLDRP11! Lead low with the ${playCard?.name} from ${playingInHand ? 'hand' : 'dummy'} up to the ${this.consumedCard?.faceName} in ${playingInHand ? 'dummy' : 'hand'}${this.strDropMessage}.\n`,
          );
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 1: {
        // playing second -- check if the correct suit was led
        if (suitLed !== this.suit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (this.targetOpponent !== AGAINST_RHO && this.targetOpponent !== AGAINST_EITHER) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        const lhoDropped = isTargetCard(cardLed);
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          playCard = this.consumedCard;
          if (lhoDropped) {
            status?.stream(
              `PLDRP50! ${strLHO} led the ${cardLed?.name}; capture it with the ${playCard?.faceName} in ${playingInHand ? 'hand' : 'dummy'}.\n`,
            );
          } else {
            status?.stream(
              `PLDRP51! ${strLHO} led the ${cardLed?.name}; try to drop the ${this.strDropCards} from ${strRHO}by playing the ${playCard?.faceName} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
            );
          }
          this.status = PlayResult.InProgress;
        } else {
          this.status = PlayResult.Postpone;
          return this.status;
        }
        break;
      }

      case 2: {
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        if (suitLed !== this.suit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (trumped) {
          status?.stream(`4PLDRP64! ${strRHO} has trumped, so abandon the drop play for this round.\n`);
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        const rhoCard = dependencies.currentBestCard ?? null;
        const dropSucceeded = isTargetCard(rhoCard);
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          playCard = this.consumedCard;
          if (dropSucceeded) {
            status?.stream(
              `PLDRP60! ${strRHO} drped the ${rhoCard?.name} under our ${cardLed?.faceName} as hoped; rein it in with the ${playCard?.name} in ${playingInHand ? 'hand' : 'dummy'}.\n`,
            );
          } else {
            status?.stream(
              `PLDRP61! ${strRHO} did not drop a desired card (${this.strDropCards}), but perhaps ${strLHO} might, so continue and play the ${playCard?.name} from ${playingInHand ? 'hand' : 'dummy'} and hope ${strLHO} drops ${this.strDropCards}.\n`,
            );
          }
        } else {
          const activeHand = playingInHand ? declarerHand : dummyHand;
          playCard = activeHand
            ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
            : null;
          if (dropSucceeded) {
            status?.stream(
              `PLDRP64! ${strRHO} dropped the ${rhoCard?.name} under our ${cardLed?.faceName} as hoped; now discard the ${playCard?.name} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
            );
          } else {
            status?.stream(
              `PLDRP65! ${strRHO} did not drop a desired card (${this.strDropCards}), but perhaps ${strLHO} might; continue the play by discarding the ${playCard?.name} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
            );
          }
        }
        this.status = PlayResult.Complete;
        break;
      }

      case 3: {
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          this.status = PlayResult.Postpone;
          return this.status;
        }
        const rhoCard = dependencies.currentBestCard ?? null;
        const dropSucceeded = isTargetCard(rhoCard);
        const activeHand = playingInHand ? declarerHand : dummyHand;
        playCard = activeHand
          ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
          : null;
        if (dropSucceeded) {
          status?.stream(
            `PLDRP90! ${strRHO} dropped the ${rhoCard?.name}, so finish the drop play and discard the ${playCard?.name} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
          );
          this.status = PlayResult.Complete;
        } else {
          status?.stream(
            `4PLDRP81! The play failed, as ${strRHO} did not drop the ${rhoCard?.name} as hoped for -- discard the ${playCard?.name} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
          );
          this.status = PlayResult.Inactive;
          dependencies.selectedCard = playCard;
          return PlayResult.Postpone;
        }
        break;
      }
    }

    void combinedHand;
    dependencies.selectedCard = playCard;
    return this.status;
  }
}
