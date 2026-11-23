//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CTrumpPull (TrumpPull.h / TrumpPull.cpp)
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { isFaceVal, isSuit, NONE, positionToString, prevPosition, Suit } from '../constants.js';
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

export class TrumpPull extends Play {
  cardVal: number = NONE;
  optional = false;

  constructor(
    suitOrCard: Suit | typeof NONE | Card = NONE,
    targetHand: number = IN_HAND,
    cardVal: number = NONE,
    requiredPlayedCards?: CardList | Card[],
    outstandingCards?: CardList | Card[],
    winner = true,
    optional = false,
  ) {
    if (suitOrCard instanceof Card) {
      super(
        PlayType.TrumpPull,
        targetHand,
        suitOrCard.suit,
        winner ? PlayProspect.GuaranteedWinner : PlayProspect.Loser,
      );
      this.cardVal = suitOrCard.faceValue;
    } else {
      super(
        PlayType.TrumpPull,
        targetHand,
        suitOrCard,
        winner ? PlayProspect.GuaranteedWinner : PlayProspect.Loser,
      );
      this.cardVal = cardVal;
    }
    this.optional = optional;
    if (requiredPlayedCards) this.setRequiredPlayedCards(requiredPlayedCards);
    if (outstandingCards) this.setEnemyAlternativeKeyCards(outstandingCards);
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
      this.strName = `${this.consumedCard.name} Trump Pull`;
      this.strDescription = `Pull trumps with the ${this.consumedCard.cardLetter}`;
    }
  }

  override getFullDescription(): string {
    if (!this.consumedCard) return 'Pull a round of trumps.';
    return `Pull a round of trumps with the ${this.consumedCard.faceName} in ${this.targetHand === IN_HAND ? 'hand' : 'dummy'}${this.optional ? ' if necessary' : ''}.`;
  }

  override usesUpEntry(): number {
    // this play does use up an entry
    return this.targetHand === IN_DUMMY ? ENTRY_DUMMY : ENTRY_HAND;
  }

  //
  // Perform()
  //
  // this is similar to the cashing play, with a few exceptions
  //
  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit)) {
      this.status = PlayResult.Complete;
      return this.status;
    }

    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    if (ordinal !== 0 && ordinal !== 2) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    const { combinedHand, status } = dependencies;
    const trumpSuit = isSuit(dependencies.trumpSuit ?? NONE)
      ? (dependencies.trumpSuit as Suit)
      : this.suit;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const playerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const playerTrumps = playerHand?.getSuit(trumpSuit);
    const dummyTrumps = dummyHand?.getSuit(trumpSuit);
    const combinedTrumps = combinedHand.getSuit(trumpSuit);
    const cardLed = dependencies.leadCard ?? null;
    const topCard = dependencies.currentBestCard ?? cardLed;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const strRHO = dependencies.playerPosition !== undefined
      ? positionToString(prevPosition(dependencies.playerPosition))
      : 'RHO';

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
        if (playingInHand) {
          if (this.targetHand === IN_HAND) {
            if (!playerTrumps || playerTrumps.length === 0) {
              status?.stream(
                "4PLTRMP10! Oops, want to pull a trump, but the declarer's hand does not have any trumps to lead, so skip this play.\n",
              );
              this.status = PlayResult.Inactive;
              return PlayResult.Postpone;
            }
            if (
              dummyTrumps &&
              this.consumedCard &&
              !(
                dummyTrumps.length === 1 &&
                combinedTrumps.numDummyLosers === 0 &&
                combinedTrumps.numDeclarerLosers === 0 &&
                (dummyTrumps.at(0)?.deckValue ?? 0) < this.consumedCard.deckValue
              ) &&
              dummyTrumps.length > 0 &&
              combinedTrumps.numDummyLosers === 0 &&
              combinedTrumps.numDeclarerLosers > 0 &&
              combinedTrumps.numDummyWinners < playerTrumps.length &&
              (dummyTrumps.at(0)?.deckValue ?? 0) > (playerTrumps.at(0)?.deckValue ?? 0) &&
              combinedTrumps.declaredEntries === 1
            ) {
              status?.stream(
                `5PLTRMP11! We could pull trumps with the ${this.consumedCard.name} from hand, but dummy has no trump losers to discard while declarer does.\n`,
              );
              this.status = PlayResult.Inactive;
              return PlayResult.Postpone;
            }
            const topSeq = combinedTrumps.topSequence;
            const playerTop = playerTrumps.topCard;
            if (topSeq && playerTop && topSeq.hasCard(playerTop)) {
              playCard = playerTrumps.topSequence?.bottomCard ?? playerTop;
              status?.stream(
                `PLTRMP12! Lead out the ${playCard.name} from hand to pull in a round of trumps.\n`,
              );
            } else {
              status?.stream('4PLTRMP13! Error - no high trump in hand to lead.\n');
              this.status = PlayResult.Error;
              return this.status;
            }
          } else {
            if (playerTrumps && playerTrumps.length > 0) {
              playCard = playerTrumps.bottomCard;
              if (
                playCard &&
                this.consumedCard &&
                combinedTrumps.areEquivalentCards(playCard, this.consumedCard) &&
                (dummyTrumps?.numLosers ?? 0) > 1
              ) {
                status?.stream(
                  `3PLTMRP15! Oops, the lowest trump we can lead from hand is the ${playCard.faceName}, which is equivalent to the ${this.consumedCard.faceName}, so skip this play.\n`,
                );
                this.status = PlayResult.Inactive;
                return PlayResult.Postpone;
              }
              status?.stream(
                `PLTRMP18! Lead the ${playCard?.name} up to dummy to pull in a round of trumps.\n`,
              );
            } else {
              this.status = PlayResult.Inactive;
              return PlayResult.Postpone;
            }
          }
        } else {
          if (this.targetHand === IN_DUMMY) {
            if (!dummyTrumps || dummyTrumps.length === 0) {
              status?.stream(
                "4PLTRMP20! Oops, want to pull a trump, but the dummy's hand does not have any trumps to lead, so skip this play.\n",
              );
              this.status = PlayResult.Inactive;
              return PlayResult.Postpone;
            }
            const topSeq = combinedTrumps.topSequence;
            const dummyTop = dummyTrumps.topCard;
            if (topSeq && dummyTop && topSeq.hasCard(dummyTop)) {
              playCard = dummyTrumps.topSequence?.bottomCard ?? dummyTop;
              status?.stream(
                `PLTRMP22! Lead out the ${playCard.name} from dummy to pull in a round of trumps.\n`,
              );
            } else {
              status?.stream('4PLTRMP23! Error - no high trump in dummy to lead.\n');
              this.status = PlayResult.Error;
              return this.status;
            }
          } else {
            if (dummyTrumps && dummyTrumps.length > 0) {
              playCard = dummyTrumps.bottomCard;
              if (
                playCard &&
                this.consumedCard &&
                combinedTrumps.areEquivalentCards(playCard, this.consumedCard) &&
                (playerTrumps?.numLosers ?? 0) > 1
              ) {
                status?.stream(
                  `3PLTMRP25! Oops, the lowest trump we can lead from dummy is the ${playCard.faceName}, which is equivalent to the ${this.consumedCard.faceName}, so skip this play.\n`,
                );
                this.status = PlayResult.Inactive;
                return PlayResult.Postpone;
              }
              status?.stream(
                `PLTRMP28! Lead the ${playCard?.name} up to own hand to pull in a round of trumps.\n`,
              );
            } else {
              this.status = PlayResult.Inactive;
              return PlayResult.Postpone;
            }
          }
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 2: {
        if (suitLed !== trumpSuit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        const outstandingTrumps = (dependencies.outstandingCards ?? [])
          .filter(c => c.suit === trumpSuit)
          .sort((a, b) => b.faceValue - a.faceValue);
        const outstandingTop = outstandingTrumps[0] ?? null;
        const activeTrumps = playingInHand ? playerTrumps : dummyTrumps;
        const topFace = topCard ? topCard.faceValue : 0;
        const topTrump = outstandingTop ? Math.max(topFace, outstandingTop.faceValue) : topFace;

        if (activeTrumps && activeTrumps.getNumCardsAbove(topTrump) > 0) {
          playCard = activeTrumps.getLowestCardAbove(topTrump);
          status?.stream(
            `PLTRMP83! Play high to take the round of trumps with the ${playCard?.faceName}.\n`,
          );
        } else if (activeTrumps && topCard && activeTrumps.getNumCardsAbove(topCard) > 0) {
          playCard = activeTrumps.getLowestCardAbove(topCard);
          status?.stream(
            `PLTRMP83a! Top ${strRHO}'s ${topCard.faceName} of trumps with the ${playCard?.faceName}.\n`,
          );
        } else {
          playCard = getDiscardCard();
          status?.stream(
            `PLTRMP82a! Discard the ${playCard?.name} on ${playingInHand ? "dummy's" : "declarer's"} top ${cardLed?.faceName} of trumps.\n`,
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
