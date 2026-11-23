//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CHoldUp (HoldUp.h / HoldUp.cpp)
//
// - a play of throwing away losing cards / holding up a round
//

import { Card } from '../card.js';
import { isSuit, NONE, Suit } from '../constants.js';
import { IN_EITHER, Play, PlayDependencies, PlayProspect, PlayResult, PlayType } from './play.js';

export class HoldUp extends Play {
  constructor(suit: Suit | typeof NONE = NONE) {
    super(PlayType.HoldUp, IN_EITHER, suit, PlayProspect.Loser);
    this.init();
  }

  override clear(): void {
    super.clear();
  }

  override init(): void {
    super.init();
    if (isSuit(this.suit)) {
      // form name & description
      this.strName = `${Card.suitToSingularString(this.suit)} Hold up`;
      this.strDescription = `Hold up a round of ${Card.suitToString(this.suit)}`;
    }
  }

  override getFullDescription(): string {
    if (!isSuit(this.suit)) return 'Hold up a round.';
    return `Hold up a round of ${Card.suitToString(this.suit)}.`;
  }

  //
  // Perform()
  //
  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit)) {
      this.status = PlayResult.InProgress;
      return this.status;
    }

    const { status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const activeHand = playingInHand ? dependencies.declarerHand : dependencies.dummyHand;
    const cardLed = dependencies.leadCard ?? null;
    const trumpSuit = dependencies.trumpSuit ?? NONE;

    // test preconditions
    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    // a holdup is simple -- discard instead of winning
    let playCard: Card | null = null;
    switch (ordinal) {
      case 0:
        // can't hold up here
        this.status = PlayResult.Inactive;
        return PlayResult.Postpone;

      case 1:
        playCard = activeHand
          ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
          : null;
        status?.stream(
          `PLHLD04! Hold up a round of ${Card.suitToString(this.suit)} and discard the ${playCard?.faceName} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
        );
        this.status = PlayResult.InProgress;
        break;

      case 2:
        // can't hold up here
        this.status = PlayResult.Inactive;
        return PlayResult.Postpone;

      case 3:
        // complete the hold-up
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        playCard = activeHand
          ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
          : null;
        status?.stream(
          `PLHLD08! Finish the hold-up and discard the ${playCard?.faceName} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
        );
        this.status = PlayResult.Complete;
        break;
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}
