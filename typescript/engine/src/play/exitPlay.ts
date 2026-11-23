//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CExitPlay (ExitPlay.h / ExitPlay.cpp)
//

import { Card } from '../card.js';
import { isSuit, NONE, Suit } from '../constants.js';
import { IN_EITHER, Play, PlayDependencies, PlayProspect, PlayResult, PlayType } from './play.js';

export class ExitPlay extends Play {
  constructor(
    suit: Suit | typeof NONE = NONE,
    suit2: Suit | typeof NONE = NONE,
    prerequisites: Play[] = [],
  ) {
    super(PlayType.Exit, IN_EITHER, suit, PlayProspect.Loser);
    this.suit2 = suit2;
    this.prerequisiteList = [...prerequisites];
    this.init();
  }

  override clear(): void {
    super.clear();
    this.suit2 = NONE;
  }

  override init(): void {
    super.init();
    this.strName = 'Exit Play';
    // form description
    if (isSuit(this.suit) && isSuit(this.suit2)) {
      this.strDescription = `Exit with a ${Card.suitToSingularString(this.suit)} or ${Card.suitToString(this.suit2)}.`;
    } else if (isSuit(this.suit)) {
      this.strDescription = `Exit with a ${Card.suitToSingularString(this.suit)}.`;
    }
  }

  override getFullDescription(): string {
    if (isSuit(this.suit) && isSuit(this.suit2)) {
      return `Exit with a ${Card.suitToSingularString(this.suit)} or ${Card.suitToSingularString(this.suit2)} and throw the opponents into the lead.`;
    }
    if (isSuit(this.suit)) {
      return `Exit with a ${Card.suitToSingularString(this.suit)} and throw the opponents into the lead.`;
    }
    return 'Exit and throw the opponents into the lead.';
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
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const playerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const trumpSuit = dependencies.trumpSuit ?? NONE;

    // perform basic tests
    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    let playCard: Card | null = null;
    let playViable = false;

    switch (ordinal) {
      case 1:
      case 3:
        // play cannot be used in the second or fourth positions
        this.status = PlayResult.Inactive;
        return PlayResult.NotViable;

      case 0: {
        // leading this round
        const suit = combinedHand.getSuit(this.suit);
        if (playingInHand) {
          // leading from declarer's hand
          if (suit.numDeclarerLosers >= 1) {
            if (isSuit(this.suit2)) {
              const suit2Obj = combinedHand.getSuit(this.suit2);
              if (suit2Obj.numDummyLosers >= 1) playViable = true;
            } else {
              playViable = true;
            }
            if (playViable) playCard = suit.declarerCards.bottomCard;
          } else if (isSuit(this.suit2)) {
            const suit2Obj = combinedHand.getSuit(this.suit2);
            if (suit2Obj.numDeclarerLosers >= 1 && suit.numDummyLosers >= 1) {
              playViable = true;
              playCard = suit2Obj.declarerCards.bottomCard;
            }
          }
          if (playViable && playCard) {
            status?.stream(`PLEXT1! Start the exit play by leading  the ${playCard.name} from hand.\n`);
            this.status = PlayResult.InProgress;
            dependencies.selectedCard = playCard;
            return this.status;
          } else {
            status?.stream(
              `4PLEXT5! Oops, want to exit with a ${Card.suitToString(this.suit)} from hand, but we have no losers in the suit, so we have to skip this play.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.NotViable;
          }
        } else {
          // leading from dummy's hand
          if (suit.numDummyLosers >= 1) {
            if (isSuit(this.suit2)) {
              const suit2Obj = combinedHand.getSuit(this.suit2);
              if (suit2Obj.numDeclarerLosers >= 1) playViable = true;
            } else {
              playViable = true;
            }
            if (playViable) playCard = suit.dummyCards.bottomCard;
          } else if (isSuit(this.suit2)) {
            const suit2Obj = combinedHand.getSuit(this.suit2);
            if (suit2Obj.numDummyLosers >= 1 && suit.numDeclarerLosers >= 1) {
              playViable = true;
              playCard = suit2Obj.dummyCards.bottomCard;
            }
          }
          if (playViable && playCard) {
            status?.stream(`PLEXT7! Start the exit play by leading  the ${playCard.name} from dummy.\n`);
            this.status = PlayResult.InProgress;
            dependencies.selectedCard = playCard;
            return this.status;
          } else {
            status?.stream(
              `4PLEXT9! Oops, want to exit with a ${Card.suitToString(this.suit)} from dummy, but we have no losers in the suit, so we have to skip this play.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.NotViable;
          }
        }
      }

      case 2: {
        // playing 3rd -- discard a card from the second suit, if specified, else discard any loser
        const activeHand = playingInHand ? playerHand : dummyHand;
        if (activeHand) {
          if (isSuit(suitLed) && activeHand.getSuitLength(suitLed) > 0) {
            playCard = activeHand.getSuit(suitLed).bottomCard;
          } else if (isSuit(this.suit2)) {
            if (suitLed === this.suit || activeHand.getSuitLength(this.suit) === 0) {
              playCard = activeHand.getSuit(this.suit2).bottomCard;
            } else {
              playCard = activeHand.getSuit(this.suit).bottomCard;
            }
          } else {
            playCard = activeHand.getDiscard(cardLed, trumpSuit);
          }
        }
        status?.stream(
          `${playingInHand ? 'PLEXT20' : 'PLEXT21'}! Complete the exit play by discarding the ${playCard?.name} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
        );
        this.status = PlayResult.Complete;
        break;
      }
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}
