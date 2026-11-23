//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CForce (Force.h / Force.cpp)
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { isFaceVal, isSuit, makeDeckValue, NONE, Suit } from '../constants.js';
import { IN_DUMMY, IN_HAND, Play, PlayDependencies, PlayProspect, PlayResult, PlayType } from './play.js';
import { SuitHoldings } from './suitHoldings.js';

export class Force extends Play {
  targetCardVal: number = NONE;
  cardVal: number = NONE;

  constructor(
    suitOrCard: Suit | typeof NONE | Card = NONE,
    targetHand: number = IN_HAND,
    targetCardVal: number = NONE,
    reqPlayedList?: CardList | Card[],
    cardVal: number = NONE,
  ) {
    if (suitOrCard instanceof Card) {
      super(PlayType.Force, targetHand, suitOrCard.suit, PlayProspect.Loser);
      this.targetCardVal = targetCardVal;
      this.cardVal = suitOrCard.faceValue;
    } else {
      super(PlayType.Force, targetHand, suitOrCard, PlayProspect.Loser);
      this.targetCardVal = targetCardVal;
      this.cardVal = cardVal;
    }
    if (reqPlayedList) {
      this.setRequiredPlayedCards(reqPlayedList);
    }
    if (isSuit(this.suit) && isFaceVal(this.cardVal) && isFaceVal(this.targetCardVal)) {
      this.init();
    }
  }

  override clear(): void {
    super.clear();
    this.targetCardVal = NONE;
    this.suit = NONE;
    this.cardVal = NONE;
  }

  override init(): void {
    super.init();
    if (isSuit(this.suit) && isFaceVal(this.targetCardVal)) {
      this.targetCard = Card.fromDeckValue(makeDeckValue(this.suit, this.targetCardVal));
    }
    if (isSuit(this.suit) && isFaceVal(this.cardVal)) {
      this.consumedCard = Card.fromDeckValue(makeDeckValue(this.suit, this.cardVal));
    }
    if (this.targetCard && this.consumedCard) {
      this.strName = `Force out the ${this.targetCard.name}`;
      this.strDescription = `Force out the ${this.targetCard.name} with the ${this.consumedCard.name}`;
    }
  }

  override getFullDescription(): string {
    if (!isSuit(this.suit) || !isFaceVal(this.cardVal) || !isFaceVal(this.targetCardVal)) {
      return 'Force out an opponent honor.';
    }
    return `Play the ${Card.cardToString(makeDeckValue(this.suit, this.cardVal))} from ${this.targetHand === IN_HAND ? 'hand' : 'dummy'} to force out the opponents' ${Card.cardValToString(this.targetCardVal)}.`;
  }

  //
  // Perform()
  //
  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit) || !isFaceVal(this.targetCardVal)) {
      this.status = PlayResult.Complete;
      return this.status;
    }

    // a "force" is a play of the lowest possible card that will force out a key enemy card
    const { combinedHand, status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const playerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const combinedSuit = combinedHand.getSuit(this.suit);
    const playerSuit = playerHand?.getSuit(this.suit);
    const dummySuit = dummyHand?.getSuit(this.suit);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const trumpSuit = dependencies.trumpSuit ?? NONE;
    const trumped =
      isSuit(trumpSuit) &&
      suitLed !== trumpSuit &&
      dependencies.currentBestCard?.suit === trumpSuit;

    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    let playCard: Card | null = null;
    const activeHand = playingInHand ? playerHand : dummyHand;
    const getDiscardCard = (): Card | null =>
      activeHand
        ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
        : null;

    switch (ordinal) {
      case 0: {
        // we're leading, player #0
        if (playingInHand) {
          if (this.targetHand === IN_HAND) {
            playCard = playerSuit?.getHighestCardBelow(this.targetCardVal) ?? null;
            if (!playCard) {
              status?.stream(
                '4PLFRC02! Error in force play -- no cards in declarer hand usable in a force play.\n',
              );
              this.status = PlayResult.Error;
              return this.status;
            }
            status?.stream(
              `PLFRC04! Play the ${playCard.name} from hand to force out the opponents' ${Card.cardValToString(this.targetCardVal)}.\n`,
            );
          } else {
            if (playerSuit && playerSuit.length > 0) {
              playCard = playerSuit.bottomCard;
              status?.stream(
                `PLFRC06! Lead a low ${Card.suitToSingularString(this.suit)} (${playCard?.faceName}) from hand to trigger a force play in dummy.\n`,
              );
            } else {
              status?.stream(
                `4PLFRC08! Oops, we can't start a force play in the ${Card.suitToSingularString(this.suit)} suit from declarer, since we have no cards in the suit.\n`,
              );
              this.status = PlayResult.Postpone;
              return this.status;
            }
          }
        } else {
          if (this.targetHand === IN_DUMMY) {
            playCard = dummySuit?.getHighestCardBelow(this.targetCardVal) ?? null;
            if (!playCard) {
              status?.stream(
                '4PLFRC10! Error in force play -- no cards in dummy usable in a force play.\n',
              );
              this.status = PlayResult.Error;
              return this.status;
            }
            status?.stream(
              `PLFRC12! Play the ${playCard.name} from dummy to force out the opponents' ${Card.cardValToString(this.targetCardVal)}.\n`,
            );
          } else {
            if (dummySuit && dummySuit.length > 0) {
              playCard = dummySuit.bottomCard;
              status?.stream(
                `PLFRC14! Lead a low ${Card.suitToSingularString(this.suit)} (${playCard?.faceName}) from dummy to trigger a force play in hand.\n`,
              );
            } else {
              status?.stream(
                `4PLFRC16! Oops, we can't start a force play in the ${Card.suitToSingularString(this.suit)} suit from dummy, since we have no cards in the suit.\n`,
              );
              this.status = PlayResult.Postpone;
              return this.status;
            }
          }
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 1: {
        if (suitLed === this.suit && cardLed && cardLed.faceValue < this.targetCardVal) {
          if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
            playCard = (playingInHand ? playerSuit : dummySuit)?.getHighestCardBelow(this.targetCardVal) ?? null;
            if (!playCard) {
              status?.stream(
                `4PLFRC20! Error in force play -- no cards in ${playingInHand ? 'hand' : 'dummy'} usable in a force play.\n`,
              );
              this.status = PlayResult.Error;
              return this.status;
            }
            status?.stream(
              `PLFRC22! The opponents led a ${Card.suitToSingularString(this.suit)}, so play the ${playCard.name} from ${playingInHand ? 'hand' : 'dummy'} to try and force out the ${Card.cardValToString(this.targetCardVal)} now.\n`,
            );
            this.status = PlayResult.Complete;
          } else {
            playCard = getDiscardCard();
            status?.stream(
              `4PLFRC24! We're not in the right position to play a forcing card, so discard the ${playCard?.name}.\n`,
            );
            this.status = PlayResult.Postpone;
          }
        } else {
          this.status = PlayResult.Postpone;
        }
        dependencies.selectedCard = playCard;
        return this.status;
      }

      case 2: {
        if (this.status !== PlayResult.InProgress || suitLed !== this.suit) {
          this.status = PlayResult.Error;
          return this.status;
        }
        if (trumped) {
          status?.stream(
            `5PLFR30! RHO trumped, rendering the force play of the ${this.consumedCard?.faceName} ineffective, so skip the play.\n`,
          );
          this.status = PlayResult.Postpone;
          return this.status;
        }
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          const rhoCard = dependencies.currentBestCard;
          if (rhoCard && rhoCard.faceValue >= this.targetCardVal) {
            status?.stream(
              `5PLFR50! RHO played the ${Card.cardValToString(this.targetCardVal)}, so skip this force play.\n`,
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
          playCard = (playingInHand ? playerSuit : dummySuit)?.getHighestCardBelow(this.targetCardVal) ?? null;

          // see if we played a card from the other hand that's equivalent to this card; if so, discard low
          const testSuit = new SuitHoldings();
          testSuit.merge(combinedSuit);
          if (cardLed && !testSuit.has(cardLed)) testSuit.add(cardLed);
          if (cardLed && playCard && testSuit.areEquivalentCards(cardLed, playCard)) {
            if (playingInHand && playerSuit && playerSuit.length > 1) {
              playCard = playerSuit.bottomCard;
              status?.stream(
                `PLFRC55! The ${cardLed.name} is sufficient for the force, so discard the ${playCard?.faceName} from hand.\n`,
              );
            } else if (!playingInHand && dummySuit && dummySuit.length > 1) {
              playCard = dummySuit.bottomCard;
              status?.stream(
                `PLFRC56! The ${cardLed.name} is sufficient for the force, so discard the ${playCard?.faceName} from dummy.\n`,
              );
            }
            this.status = PlayResult.Complete;
          } else {
            if (!playCard) {
              status?.stream(
                `4PLFRC61! Error in force play -- no cards in ${playingInHand ? 'hand' : 'dummy'} usable in a force play.\n`,
              );
              this.status = PlayResult.Error;
              return this.status;
            }
            status?.stream(
              `PLFRC62! Play the ${playCard.name} from ${playingInHand ? 'hand' : 'dummy'} to try and force out the ${Card.cardValToString(this.targetCardVal)} now.\n`,
            );
            this.status = PlayResult.Complete;
          }
        } else {
          playCard = getDiscardCard();
          status?.stream(
            `PLFRC64! We're in the opposite hand of a force play, so discard the ${playCard?.name}.\n`,
          );
          this.status = PlayResult.Complete;
        }
        break;
      }

      case 3:
        // playing fourth -- can't use a force play here
        return PlayResult.Postpone;
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}
