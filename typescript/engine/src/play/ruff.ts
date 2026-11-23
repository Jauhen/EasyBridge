//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CRuff (Ruff.h / Ruff.cpp)
//

import { Card } from '../card.js';
import { isSuit, NONE, Suit } from '../constants.js';
import {
  ENTRY_DUMMY,
  ENTRY_HAND,
  IN_DUMMY,
  IN_HAND,
  Play,
  PlayDependencies,
  PlayProspect,
  PlayResult,
  PlayType,
} from './play.js';

export class Ruff extends Play {
  numDiscardsRequired: number;

  constructor(
    suitOrCard: Suit | typeof NONE | Card = NONE,
    targetHand: number = IN_DUMMY,
    numDiscardsRequired = 0,
    prospect: PlayProspect = PlayProspect.GuaranteedWinner,
  ) {
    if (suitOrCard instanceof Card) {
      super(PlayType.Ruff, targetHand, suitOrCard.suit, prospect);
    } else {
      super(PlayType.Ruff, targetHand, suitOrCard, prospect);
    }
    this.numDiscardsRequired = numDiscardsRequired;
    this.init();
  }

  override clear(): void {
    super.clear();
    this.suit = NONE;
  }

  override init(): void {
    super.init();
    this.endingHand = this.targetHand;
    this.startingHand = this.endingHand === IN_HAND ? IN_DUMMY : IN_HAND;
    if (isSuit(this.suit)) {
      this.strName = `${Card.suitToSingularString(this.suit)} Ruff`;
      this.strDescription = `Ruff a ${Card.suitToSingularString(this.suit)} in ${this.targetHand === IN_HAND ? 'hand' : 'dummy'}`;
    }
  }

  override getFullDescription(): string {
    if (!isSuit(this.suit)) return 'Ruff a card.';
    return `Ruff a ${Card.suitToSingularString(this.suit)} in ${this.targetHand === IN_HAND ? 'hand' : 'dummy'}.`;
  }

  override usesUpEntry(): number {
    // this play does use up an entry
    return this.targetHand === IN_DUMMY ? ENTRY_DUMMY : ENTRY_HAND;
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
    const playerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const combinedSuit = combinedHand.getSuit(this.suit);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const trumpSuit = dependencies.trumpSuit ?? NONE;
    const roundTopCard = dependencies.currentBestCard ?? cardLed;
    const trumped =
      isSuit(trumpSuit) &&
      suitLed !== trumpSuit &&
      roundTopCard !== null &&
      roundTopCard.suit === trumpSuit;

    // test preconditions
    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
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
            this.status = PlayResult.Postpone;
            return this.status;
          }
          if (dummyHand && dummyHand.getSuitLength(this.suit) > 0) {
            this.status = PlayResult.Postpone;
            return this.status;
          }
          if (combinedSuit.numDeclarerLosers > 0 && playerHand) {
            playCard = playerHand.getSuit(this.suit).bottomCard;
            status?.stream(
              `PLRUF04! Lead a low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from hand to ruff in dummy.\n`,
            );
          } else {
            status?.stream(
              `4PLRUF08! Oops, we wanted to ruff a ${Card.suitToSingularString(this.suit)} in dummy, but we have no ${Card.suitToSingularString(this.suit)} losers in hand to lead, so we have to abandon the play.\n`,
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
        } else {
          if (this.targetHand === IN_DUMMY) {
            this.status = PlayResult.Postpone;
            return this.status;
          }
          if (playerHand && playerHand.getSuitLength(this.suit) > 0) {
            this.status = PlayResult.Postpone;
            return this.status;
          }
          if (combinedSuit.numDummyLosers > 0 && dummyHand) {
            playCard = dummyHand.getSuit(this.suit).bottomCard;
            status?.stream(
              `PLRUF14! Lead a low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from dummy to ruff in hand.\n`,
            );
          } else {
            status?.stream(
              `4PLRUF18! Oops, we wanted to ruff a ${Card.suitToSingularString(this.suit)} in hand, but we have no ${Card.suitToString(this.suit)} losers in dummy to lead, so we have to abandon the play.\n`,
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 1: {
        if (!isSuit(trumpSuit) || suitLed === trumpSuit || !isSuit(suitLed)) {
          this.status = PlayResult.Postpone;
          return this.status;
        }
        if (
          (this.targetHand === IN_HAND && playerHand?.getSuitLength(suitLed) === 0) ||
          (this.targetHand === IN_DUMMY && dummyHand?.getSuitLength(suitLed) === 0)
        ) {
          status?.stream('3PLRUF20! We can ruff in the suit led by the opponent.\n');
        } else {
          this.status = PlayResult.Postpone;
          return this.status;
        }

        if (playingInHand) {
          if (this.targetHand === IN_HAND) {
            const trumps = playerHand?.getSuit(trumpSuit);
            if (trumps && trumps.length > 0) {
              playCard = trumps.bottomCard;
              status?.stream(`PLRUF30! Ruff in hand with the ${playCard?.name}.\n`);
            } else {
              status?.stream('4PLRUF32! Error - no trumps left in hand to use in a ruff.\n');
              this.status = PlayResult.Error;
              return this.status;
            }
          } else {
            playCard = getDiscardCard();
            status?.stream(
              `PLRUF34! We'll be ruffing in dummy, so discard the ${playCard?.name} from hand.\n`,
            );
          }
        } else {
          if (this.targetHand === IN_DUMMY) {
            const trumps = dummyHand?.getSuit(trumpSuit);
            if (trumps && trumps.length > 0) {
              playCard = trumps.bottomCard;
              status?.stream(`PLRUF40! Ruff in dummy with the ${playCard?.name}.\n`);
            } else {
              status?.stream('4PLRUF42! Error - no trumps left in dummy to use in a ruff.\n');
              this.status = PlayResult.Error;
              return this.status;
            }
          } else {
            playCard = getDiscardCard();
            status?.stream(
              `PLRUF44! We'll be ruffing in hand, so discard the ${playCard?.name} from dummy.\n`,
            );
          }
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 2:
      case 3: {
        if (!isSuit(trumpSuit)) {
          this.status = PlayResult.Postpone;
          return this.status;
        }
        const canRuff =
          this.status === PlayResult.InProgress ||
          (isSuit(suitLed) && suitLed !== trumpSuit && activeHand?.getSuitLength(suitLed) === 0);
        if (!canRuff) {
          this.status = PlayResult.Postpone;
          return this.status;
        }

        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          const trumps = activeHand?.getSuit(trumpSuit);
          if (trumps && trumps.length > 0) {
            if (trumped && roundTopCard) {
              playCard = trumps.getLowestCardAbove(roundTopCard);
              if (playCard) {
                status?.stream(
                  `${playingInHand ? 'PLRUF56' : 'PLRUF70'}! Overruff RHO's trump ${roundTopCard.faceName} with the ${playCard.faceName}.\n`,
                );
              } else {
                status?.stream(
                  `${playingInHand ? '4PLRUF58' : '3PLRUF72'}! RHO ruffed, and we can't overruff.\n`,
                );
                this.status = PlayResult.Postpone;
                return this.status;
              }
            } else {
              playCard = trumps.bottomCard;
              status?.stream(
                `${playingInHand ? 'PLRUF60' : 'PLRUF74'}! Ruff in ${playingInHand ? 'hand' : 'dummy'} with the ${playCard?.name}.\n`,
              );
            }
          } else {
            status?.stream(
              `${playingInHand ? '4PLRUF62' : '4PLRUF76'}! Error - no trumps left in ${playingInHand ? 'hand' : 'dummy'} to use in a ruff.\n`,
            );
            this.status = PlayResult.Error;
            return this.status;
          }
        } else if (ordinal === 3) {
          playCard = getDiscardCard();
          status?.stream(
            `${playingInHand ? 'PLRUF63' : 'PLRUF77'}! Complete the ruff by discarding the ${playCard?.name} from hand.\n`,
          );
        } else {
          this.status = PlayResult.Postpone;
          return this.status;
        }
        this.status = PlayResult.Complete;
        break;
      }
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}
