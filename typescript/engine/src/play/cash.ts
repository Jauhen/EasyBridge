//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CCash (Cash.h / Cash.cpp)
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { isFaceVal, isSuit, NONE, Suit } from '../constants.js';
import {
  ENTRY_DUMMY,
  ENTRY_HAND,
  IN_DUMMY,
  IN_EITHER,
  IN_HAND,
  Play,
  PlayDependencies,
  PlayProspect,
  PlayResult,
  PlayType,
} from './play.js';

export class Cash extends Play {
  cardVal: number = NONE;

  constructor(
    suitOrCard: Suit | typeof NONE | Card = NONE,
    prospect: PlayProspect = PlayProspect.LikelyWinner,
    targetHand: number = IN_EITHER,
    startingHand: number = IN_EITHER,
    requiredPlayedCards?: CardList | Card[],
    cardVal: number = NONE,
    opportunistic = false,
  ) {
    if (suitOrCard instanceof Card) {
      super(PlayType.Cash, targetHand, suitOrCard.suit, prospect, opportunistic);
      this.startingHand = startingHand;
      this.cardVal = suitOrCard.faceValue;
    } else {
      super(PlayType.Cash, targetHand, suitOrCard, prospect, opportunistic);
      this.startingHand = startingHand;
      this.cardVal = cardVal;
    }
    if (requiredPlayedCards) {
      this.setRequiredPlayedCards(requiredPlayedCards);
    }
    if (isSuit(this.suit) && isFaceVal(this.cardVal)) {
      this.init();
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
      // form name & description
      this.strName = `${this.consumedCard.name} Cash`;
      this.strDescription = `Cash the ${this.consumedCard.name}`;
    }
  }

  override getFullDescription(): string {
    if (!this.consumedCard) return 'Cash a winner.';
    return `Cash the ${this.consumedCard.fullName} in ${this.targetHand === IN_HAND ? 'hand' : 'dummy'}.`;
  }

  override usesUpEntry(): number {
    // this play does use up an entry
    return this.targetHand === IN_DUMMY ? ENTRY_DUMMY : ENTRY_HAND;
  }

  //
  // Perform()
  //
  // called to do the deed
  //
  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit) || !this.consumedCard) {
      this.status = PlayResult.Complete;
      return this.status;
    }

    const { combinedHand, status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const playerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const declarerSuit = playerHand?.getSuit(this.suit);
    const dummySuit = dummyHand?.getSuit(this.suit);
    const combinedSuit = combinedHand.getSuit(this.suit);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const trumpSuit = dependencies.trumpSuit ?? NONE;
    const topCard = dependencies.currentBestCard ?? cardLed;
    const trumped =
      isSuit(trumpSuit) &&
      suitLed !== trumpSuit &&
      topCard !== null &&
      topCard.suit === trumpSuit;

    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    // see if one or more opponents are void in the suit AND have not shown out of trumps
    if (isSuit(trumpSuit) && dependencies.guessedHands && dependencies.playerPosition !== undefined) {
      const lhoPos = (dependencies.playerPosition + 1) % 4;
      const rhoPos = (dependencies.playerPosition + 3) % 4;
      const lhoHand = dependencies.guessedHands[lhoPos];
      const rhoHand = dependencies.guessedHands[rhoPos];
      const outstandingTrumps = combinedHand.getSuit(trumpSuit).numOutstandingCards;
      let skipPlay = false;
      if (
        ordinal === 0 &&
        outstandingTrumps > 0 &&
        lhoHand?.isSuitShownOut(this.suit) &&
        !lhoHand.isSuitShownOut(trumpSuit)
      ) {
        skipPlay = true;
        status?.stream(
          `5PLCSHZ1! The play <${this.name}> is not yet safe as LHO has shown out of the suit and may ruff.\n`,
        );
      }
      if (
        outstandingTrumps > 0 &&
        rhoHand?.isSuitShownOut(this.suit) &&
        !rhoHand.isSuitShownOut(trumpSuit)
      ) {
        skipPlay = true;
        status?.stream(
          `5PLCSHZ2! The play <${this.name}> is not yet safe as RHO has shown out of the suit and may ruff.\n`,
        );
      }
      if (skipPlay) {
        this.status = PlayResult.Inactive;
        return PlayResult.Postpone;
      }
    }

    const activeHand = playingInHand ? playerHand : dummyHand;
    const getDiscardCard = (): Card | null =>
      activeHand
        ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
        : null;

    let playCard: Card | null = null;

    switch (ordinal) {
      case 0: {
        // we're leading, player #0
        if (playingInHand) {
          if (this.targetHand === IN_HAND) {
            if (
              dummySuit &&
              declarerSuit &&
              !(
                dummySuit.length === 1 &&
                combinedSuit.numDummyLosers === 0 &&
                combinedSuit.numDeclarerLosers === 0 &&
                (dummySuit.at(0)?.deckValue ?? 0) < this.consumedCard.deckValue
              ) &&
              dummySuit.length > 0 &&
              combinedSuit.numDummyLosers === 0 &&
              combinedSuit.numDeclarerLosers > 0 &&
              combinedSuit.numDummyWinners < declarerSuit.length &&
              (dummySuit.at(0)?.deckValue ?? 0) > (declarerSuit.at(0)?.deckValue ?? 0) &&
              combinedSuit.declaredEntries === 1
            ) {
              status?.stream(
                `5PLCSH02! We could cash the ${this.consumedCard.name} from hand, but dummy has no losers to discard in the suit and could get stranded there.\n`,
              );
              this.status = PlayResult.Inactive;
              return PlayResult.Postpone;
            }
            playCard = this.consumedCard;
            status?.stream(`PLCSH10! Cash the ${playCard.name} from hand.\n`);
          } else {
            // playing from hand, but cashing from dummy: lead a low card from hand
            if (declarerSuit && declarerSuit.length > 0) {
              if (declarerSuit.getNumCardsBelow(this.consumedCard) > 0) {
                playCard = declarerSuit.bottomCard;
                if (
                  playCard &&
                  combinedSuit.areEquivalentCards(playCard, this.consumedCard) &&
                  combinedSuit.numDummyLosers > 0
                ) {
                  status?.stream(
                    `4PLCSH15! Oops, the lowest card we can lead from hand for the cash is the ${playCard.faceName}, which is equivalent to the ${this.consumedCard.faceName}, so skip the cash play.\n`,
                  );
                  this.status = PlayResult.Inactive;
                  return PlayResult.Postpone;
                }
                status?.stream(
                  `PLCSH20! Lead a low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from hand in order to cash the ${this.consumedCard.faceName} in dummy.\n`,
                );
              } else {
                status?.stream(
                  `4PLCSH21! Oops, we wanted to cash a ${Card.suitToSingularString(this.suit)} in dummy, but we have no low ${Card.suitToString(this.suit)} in hand to lead, so we have to abandon that play.\n`,
                );
                this.status = PlayResult.Inactive;
                return PlayResult.Postpone;
              }
            } else {
              status?.stream(
                `4PLCSH22! Oops, we wanted to cash a ${Card.suitToSingularString(this.suit)} in dummy, but we have no ${Card.suitToString(this.suit)} in hand to lead, so we have to abandon that play.\n`,
              );
              this.status = PlayResult.NotViable;
              return this.status;
            }
          }
        } else {
          // playing in dummy
          if (this.targetHand === IN_DUMMY) {
            if (
              declarerSuit &&
              dummySuit &&
              !(
                declarerSuit.length === 1 &&
                combinedSuit.numDeclarerLosers === 0 &&
                combinedSuit.numDummyLosers === 0 &&
                (declarerSuit.at(0)?.deckValue ?? 0) < this.consumedCard.deckValue
              ) &&
              declarerSuit.length > 0 &&
              combinedSuit.numDeclarerLosers === 0 &&
              combinedSuit.numDummyLosers > 0 &&
              combinedSuit.numDeclarerWinners < dummySuit.length &&
              (declarerSuit.at(0)?.deckValue ?? 0) > (dummySuit.at(0)?.deckValue ?? 0) &&
              combinedSuit.dummyEntries === 1
            ) {
              status?.stream(
                `5PLCSH12! We could cash the ${this.consumedCard.name} from dummy, but we have no losers in hand to discard in the suit and could get stranded there.\n`,
              );
              this.status = PlayResult.Inactive;
              return PlayResult.Postpone;
            }
            playCard = this.consumedCard;
            status?.stream(`PLCSH30! Cash the ${playCard.name} from dummy.\n`);
          } else {
            // leading from dummy, but cashing from hand
            if (dummySuit && dummySuit.length > 0) {
              if (dummySuit.getNumCardsBelow(this.consumedCard) > 0) {
                playCard = dummySuit.bottomCard;
                if (
                  playCard &&
                  combinedSuit.areEquivalentCards(playCard, this.consumedCard) &&
                  combinedSuit.numDeclarerLosers > 0
                ) {
                  status?.stream(
                    `4PLCSH35! Oops, the lowest card we can lead from dummy for the cash is the ${playCard.faceName}, which is equivalent to the ${this.consumedCard.faceName}, so skip the cash play.\n`,
                  );
                  this.status = PlayResult.Inactive;
                  return PlayResult.Postpone;
                }
                status?.stream(
                  `PLCSH40! Lead a low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from dummy in order to cash the ${this.consumedCard.faceName} in hand.\n`,
                );
              } else {
                status?.stream(
                  `4PLCSH41! Oops, we wanted to cash a ${Card.suitToSingularString(this.suit)} in hand, but we have no low ${Card.suitToString(this.suit)} in dummy to lead, so we have to abandon that play.\n`,
                );
                this.status = PlayResult.Inactive;
                return PlayResult.Postpone;
              }
            } else {
              status?.stream(
                `4PLCSH42! Oops, we wanted to cash a ${Card.suitToSingularString(this.suit)} in hand, but we have no ${Card.suitToString(this.suit)} in dummy to lead, so we have to abandon that play.\n`,
              );
              this.status = PlayResult.NotViable;
              return this.status;
            }
          }
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 1: {
        // playing second
        if (suitLed !== this.suit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (cardLed && cardLed.deckValue > this.consumedCard.deckValue) {
          status?.stream(
            `3PLCSH53! the card led (${cardLed.name})  beats the ${this.consumedCard.name} we were going to play, so skip the cash for now.\n`,
          );
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          if (
            (playingInHand && dummySuit && dummySuit.length === 1 && (dummySuit.at(0)?.deckValue ?? 0) > this.consumedCard.deckValue) ||
            (!playingInHand && declarerSuit && declarerSuit.length === 1 && (declarerSuit.at(0)?.deckValue ?? 0) > this.consumedCard.deckValue)
          ) {
            status?.stream(
              `3PLCSH54! Partner has a singleton which is higher than the ${this.consumedCard.name} we were going to cash, so skip the cash play for now.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          playCard = this.consumedCard;
          status?.stream(
            `PLCSH55! The opponents led a ${Card.suitToSingularString(this.suit)}, so cash the ${playCard.faceName} now.\n`,
          );
        } else {
          playCard = getDiscardCard();
          status?.stream(
            `PLCSH56! Discard a ${Card.suitToSingularString(this.suit)} from ${playingInHand ? 'hand' : 'dummy'} in anticipation of cashing the ${this.consumedCard.faceName} in ${playingInHand ? 'dummy' : 'hand'}.\n`,
          );
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 2: {
        // playing third
        if (suitLed !== this.suit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (trumped) {
          status?.stream('2PLCSH64! RHO has trumped, so abandon the cashing play for this round.\n');
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (topCard && topCard.deckValue > this.consumedCard.deckValue) {
          status?.stream(
            `2PLCSH66! the ${this.consumedCard.name} can't beat the ${topCard.name}, so skip the cash.\n`,
          );
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (playingInHand) {
          if (this.targetHand === IN_HAND) {
            playCard = this.consumedCard;
            status?.stream(`PLCSH68! Cash the ${playCard.name} from hand.\n`);
          } else {
            if (
              dummySuit &&
              declarerSuit &&
              dummySuit.length === 0 &&
              declarerSuit.length > 1 &&
              declarerSuit.numLosers === 0 &&
              cardLed &&
              (declarerSuit.at(0)?.deckValue ?? 0) > cardLed.deckValue
            ) {
              playCard = declarerSuit.getLowestCardAbove(cardLed);
              status?.stream(
                `PLCSH71! Our cash of the ${cardLed.name} from dummy is holding, but we need to win in the hand to cash the remaining winners, so play the ${playCard?.name} here.\n`,
              );
            } else {
              playCard = getDiscardCard();
              status?.stream(
                `PLCSH72! Our cash of the ${cardLed?.name} from dummy is holding, so discard the ${playCard?.name}.\n`,
              );
            }
          }
        } else {
          if (this.targetHand === IN_DUMMY) {
            playCard = this.consumedCard;
            status?.stream(`PLCSH74! Cash the ${playCard.name} from dummy.\n`);
          } else {
            if (
              declarerSuit &&
              dummySuit &&
              declarerSuit.length === 0 &&
              dummySuit.length > 1 &&
              dummySuit.numLosers === 0 &&
              cardLed &&
              (dummySuit.at(0)?.deckValue ?? 0) > cardLed.deckValue
            ) {
              playCard = dummySuit.getLowestCardAbove(cardLed);
              status?.stream(
                `PLCSH77! Our cash of the ${cardLed.name} from hand is holding, but we need to win in dummy to cash the remaining winners, so play the ${playCard?.name} here.\n`,
              );
            } else {
              playCard = getDiscardCard();
              status?.stream(
                `PLCSH78! Our cash of the ${cardLed?.name} from hand is holding, so discard the ${playCard?.name}.\n`,
              );
            }
          }
        }
        this.status = PlayResult.Complete;
        break;
      }

      case 3: {
        // playing fourth
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        status?.stream(
          `3PLCSH80! the opponents led a ${isSuit(suitLed) ? Card.suitToSingularString(suitLed) : 'card'}, so see if we can finish up the cash play here.\n`,
        );
        if (trumped) {
          status?.stream('2PLCSH82! The suit was trumped, so abandon the cashing play for this round.\n');
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (topCard && topCard.deckValue > this.consumedCard.deckValue) {
          status?.stream(
            `2PLCSH83! the ${this.consumedCard.name} we intended to cash can't beat the ${topCard.name}, so skip the cash.\n`,
          );
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          const activeSuit = playingInHand ? declarerSuit : dummySuit;
          if (activeSuit && topCard && activeSuit.getNumCardsAbove(topCard) > 1) {
            const lowerWinner = activeSuit.getLowestCardAbove(topCard);
            status?.stream(
              `${playingInHand ? '3PLCSH85' : '3PLCSH89'}! We can actually play the ${lowerWinner?.faceName} to win this trick, so postpone the cash of the ${this.consumedCard.faceName}.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          playCard = this.consumedCard;
          status?.stream(
            `${playingInHand ? 'PLCSH86' : 'PLCSH90'}! Cash the ${playCard.name} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
          );
        } else {
          playCard = getDiscardCard();
          status?.stream(
            `${playingInHand ? 'PLCSH88b' : 'PLCSH92b'}! Our cash of the ${this.consumedCard.name} from ${playingInHand ? 'dummy' : 'hand'} is holding, so discard the ${playCard?.name}.\n`,
          );
        }
        this.status = PlayResult.Complete;
        break;
      }
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}
