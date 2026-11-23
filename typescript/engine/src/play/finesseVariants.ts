//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// Type1Finesse, Type2Finesse, Type3Finesse, TypeAFinesse, TypeBFinesse
//

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import {
  isPosition,
  isSuit,
  nextPosition,
  NONE,
  Position,
  positionToString,
  prevPosition,
  Suit,
} from '../constants.js';
import { Finesse, FinesseSubType, FinesseTarget } from './finesse.js';
import { IN_DUMMY, IN_HAND, PlayDependencies, PlayResult } from './play.js';

export interface FinesseVariantOptions {
  playerPosition?: Position | typeof NONE;
  targetHand?: number;
  gapCards?: CardList | Card[];
  coverCards?: CardList | Card[];
  leadCards?: CardList | Card[];
  cardVal?: number;
  trumpSuit?: Suit | typeof NONE;
}

//
// Type I Finesse
// - lead of a low card towards a higher card in the opposite hand,
//   which holds a higher cover card and a commanding top card.
//   e.g., AQ3 (dummy) / 4 (hand) -- lead the 4, then finesse the Q
//
export class Type1Finesse extends Finesse {
  coverCards: CardList | null = null;
  leadCards: CardList | null = null;

  constructor(suitOrCard: Suit | typeof NONE | Card = NONE, options: FinesseVariantOptions = {}) {
    super(suitOrCard, {
      ...options,
      subType: FinesseSubType.TypeI,
    });
    if (options.coverCards) {
      this.coverCards = options.coverCards instanceof CardList
        ? options.coverCards
        : new CardList(options.coverCards);
      this.setAlternativeKeyCards(this.coverCards);
    }
    if (options.leadCards) {
      this.leadCards = options.leadCards instanceof CardList
        ? options.leadCards
        : new CardList(options.leadCards);
      this.setAlternativeKeyCards2(this.leadCards);
    }
  }

  override getFullDescription(): string {
    if (!this.consumedCard || !isSuit(this.suit)) return 'Type I Finesse.';
    const suitDesc = this.suit === this.trumpSuit ? 'trump' : Card.suitToSingularString(this.suit);
    const fromHand = this.targetHand === IN_HAND ? 'dummy' : 'hand';
    const inHand = this.targetHand === IN_HAND ? 'hand' : 'dummy';
    const targetName = isPosition(this.targetPos) ? positionToString(this.targetPos) : 'opponent';
    if (this.coverCards && this.coverCards.length > 1) {
      return `Lead a low ${suitDesc} from ${fromHand} to finesse the ${this.consumedCard.faceName} in ${inHand} against ${targetName}, with the { ${this.coverCards.holdingsString} } as possible cover cards.`;
    }
    const coverName = this.coverCards?.at(0)?.faceName ?? 'cover card';
    return `Lead a low ${suitDesc} from ${fromHand} to finesse the ${this.consumedCard.faceName} in ${inHand} against ${targetName}, with the ${coverName} as cover.`;
  }

  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit) || !this.consumedCard) {
      this.status = PlayResult.InProgress;
      return this.status;
    }

    const { status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const playerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const playerSuit = playerHand?.getSuit(this.suit);
    const dummySuit = dummyHand?.getSuit(this.suit);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const trumpSuit = dependencies.trumpSuit ?? NONE;
    const trumped =
      isSuit(trumpSuit) &&
      suitLed !== trumpSuit &&
      dependencies.currentBestCard?.suit === trumpSuit;
    const strRHO = playingInHand ? 'RHO' : 'LHO';

    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    let playCard: Card | null = null;

    switch (ordinal) {
      case 0: {
        if (playingInHand) {
          if (this.targetHand === IN_HAND) {
            status?.stream(
              `4PL1FNS10! Can't use this (Type I) finesse leading from hand, as the finesse card (${this.consumedCard.name}) and its covers are in our own hand.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          if (playerSuit && playerSuit.length > 0) {
            playCard = playerSuit.bottomCard;
            status?.stream(
              `PL1FN12! Leading a low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from hand to finesse the ${this.consumedCard.faceName} in dummy.\n`,
            );
          } else {
            status?.stream(
              `4PL1FN14! Oops, we wanted to finesse a ${Card.suitToSingularString(this.suit)} in dummy, but we have no ${Card.suitToString(this.suit)} in hand to lead, so we have to abandon the play.\n`,
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
        } else {
          if (this.targetHand === IN_DUMMY) {
            status?.stream(
              `4PL1FNS20! Can't use this (Type I) finesse leading from dummy, as the finesse card (${this.consumedCard.name}) and its covers are in dummy.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          if (dummySuit && dummySuit.length > 0) {
            playCard = dummySuit.bottomCard;
            status?.stream(
              `PL1FN22! Lead a low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from dummy to finesse the ${this.consumedCard.faceName} in hand.\n`,
            );
          } else {
            status?.stream(
              `4PL1FN24! Oops, we wanted to finesse a ${Card.suitToSingularString(this.suit)} in hand, but we have no ${Card.suitToString(this.suit)} in dummy to lead, so we have to abandon the play.\n`,
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 1:
        this.status = PlayResult.Inactive;
        return PlayResult.Postpone;

      case 2: {
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        if (suitLed !== this.suit) {
          this.status = PlayResult.NotViable;
          return this.status;
        }
        if (trumped) {
          status?.stream('3PL1FN50! the opponent has trumped, so abandon the finesse for this round.\n');
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        const oppCard = dependencies.currentBestCard ?? null;
        if (oppCard && oppCard.suit !== suitLed) {
          status?.stream(
            `3PL1FN55! Oops -- RHO (${strRHO}) showed out of ${Card.suitToString(suitLed)}, meaning that LHO holds the ${this.gapCards?.at(0)?.faceName ?? 'gap card'}, so the finesse cannot succeed -- so skip it.\n`,
          );
          this.status = PlayResult.NotViable;
          return this.status;
        }
        if (playingInHand) {
          if (this.targetHand === IN_HAND) {
            if (oppCard && oppCard.deckValue > this.consumedCard.deckValue) {
              playCard = playerSuit?.topSequence?.bottomCard ?? playerSuit?.topCard ?? null;
              status?.stream(
                `PL1FN62! RHO has played a higher card (the ${oppCard.faceName}) than our intended finesse (the ${this.consumedCard.faceName}), so cover with the ${playCard?.faceName}.\n`,
              );
            } else {
              playCard = this.consumedCard;
              status?.stream(`PL1FN64! Finesse the ${playCard.name} from hand.\n`);
            }
          } else {
            status?.stream(
              '4PL1FN66! We intended to finesse in hand, but ended up here in dummy in third position -- so skip this play.\n',
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
        } else {
          if (this.targetHand === IN_DUMMY) {
            if (oppCard && oppCard.deckValue > this.consumedCard.deckValue) {
              playCard = dummySuit?.topSequence?.bottomCard ?? dummySuit?.topCard ?? null;
              status?.stream(
                `PL1FN72! LHO has played a higher card (the ${oppCard.faceName}) than our intended finesse (the ${this.consumedCard.faceName}), so cover with the ${playCard?.faceName}.\n`,
              );
            } else {
              playCard = this.consumedCard;
              status?.stream(`PLCSH74! Finesse the ${playCard.name} from dummy.\n`);
            }
          } else {
            status?.stream(
              '4PL1FN76! We intended to finesse in hand, but ended up here in dummy in third position -- so skip this play.\n',
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
        }
        this.status = PlayResult.Complete;
        break;
      }

      case 3:
        this.status = PlayResult.Inactive;
        return PlayResult.Postpone;
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}

//
// Type II Finesse
// - lead of the finesse card, when a lower card is held in the same hand,
//   towards the opposite hand, which holds a cover card
//   e.g., K42 / AJT -- lead the J, cover if West plays Q; the T is
//                      then good; else, finesse the J against East
//
export class Type2Finesse extends Finesse {
  coverCards: CardList | null = null;

  constructor(suitOrCard: Suit | typeof NONE | Card = NONE, options: FinesseVariantOptions = {}) {
    super(suitOrCard, {
      ...options,
      subType: FinesseSubType.TypeII,
    });
    this.target = FinesseTarget.AgainstBoth;
    if (options.coverCards) {
      this.coverCards = options.coverCards instanceof CardList
        ? options.coverCards
        : new CardList(options.coverCards);
      this.setAlternativeKeyCards(this.coverCards);
    }
  }

  override getFullDescription(): string {
    if (!this.consumedCard || !isSuit(this.suit)) return 'Type II Finesse.';
    const suitDesc = this.suit === this.trumpSuit ? 'trump' : Card.suitToSingularString(this.suit);
    const fromHand = this.targetHand === IN_HAND ? 'hand' : 'dummy';
    const inHand = this.targetHand === IN_HAND ? 'dummy' : 'hand';
    if (this.coverCards && this.coverCards.length > 1) {
      return `Lead the ${suitDesc} ${this.consumedCard.faceName} from ${fromHand} and finesses it, with the { ${this.coverCards.holdingsString} } in ${inHand} as possible cover cards.`;
    }
    const coverName = this.coverCards?.at(0)?.faceName ?? 'cover card';
    return `Lead the ${suitDesc} ${this.consumedCard.faceName} from ${fromHand} and finesse it, with the ${coverName} in ${inHand} as cover.`;
  }

  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit) || !this.consumedCard) {
      this.status = PlayResult.InProgress;
      return this.status;
    }

    const { status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const playerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const playerSuit = playerHand?.getSuit(this.suit);
    const dummySuit = dummyHand?.getSuit(this.suit);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const trumpSuit = dependencies.trumpSuit ?? NONE;
    const trumped =
      isSuit(trumpSuit) &&
      suitLed !== trumpSuit &&
      dependencies.currentBestCard?.suit === trumpSuit;
    const activeHand = playingInHand ? playerHand : dummyHand;
    const getDiscardCard = (): Card | null =>
      activeHand
        ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
        : null;

    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    let playCard: Card | null = null;
    let leading = true;

    switch (ordinal) {
      case 1: {
        if (suitLed === this.suit && cardLed && cardLed.deckValue < this.consumedCard.deckValue) {
          status?.stream(
            `3PL2FN30! LHO has led the ${cardLed.name}, which is the same suit as our ${this.consumedCard.name} finesse card and lower in value, so we can still try the finesse.\n`,
          );
          leading = false;
        } else {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        // fall through into lead logic
      }
      // eslint-disable-next-line no-fallthrough
      case 0: {
        if (playingInHand) {
          if (this.targetHand === IN_DUMMY) {
            status?.stream(
              `4PL2FNS10! Can't use this (Type II) finesse ${leading ? 'leading' : 'playing'} from hand, as the finesse card (${this.consumedCard.name}) has to be led from dummy.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          playCard = this.consumedCard;
          status?.stream(
            `PL2FN12! ${leading ? 'Lead' : 'Play'} the finesse card (the ${playCard.faceName} from hand.\n`,
          );
        } else {
          if (this.targetHand === IN_HAND) {
            status?.stream(
              `4PL2FNS20! Can't use this (Type II) finesse ${leading ? 'leading' : 'playing'} from dummy, as the finesse card (${this.consumedCard.name}) has to be led from hand.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          playCard = this.consumedCard;
          status?.stream(
            `PL2FN22! ${leading ? 'Lead' : 'Play'} the finesse card (the ${playCard.faceName}) from dummy.\n`,
          );
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 2: {
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        if (suitLed !== this.suit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (trumped) {
          status?.stream('3PL2FN50! the opponent has trumped, so abandon the finesse.\n');
          this.status = PlayResult.NotViable;
          return this.status;
        }
        const oppCard = dependencies.currentBestCard ?? null;
        if (playingInHand) {
          if (this.targetHand === IN_DUMMY) {
            if (oppCard && oppCard.deckValue > this.consumedCard.deckValue) {
              playCard = playerSuit?.topSequence?.bottomCard ?? playerSuit?.topCard ?? null;
              status?.stream(
                `PL2FN62! RHO has played a higher card (the ${oppCard.faceName}) than our finesse card (the ${this.consumedCard.faceName}), so cover with the ${playCard?.faceName}.\n`,
              );
            } else {
              playCard = getDiscardCard();
              status?.stream(
                `PL2FN64! RHO has played low, so let the finesse card ride and discard the ${playCard?.name} from hand.\n`,
              );
            }
          } else {
            status?.stream(
              '4PL2FN66! We intended to finesse in hand, but ended up here in dummy in third position -- so skip this play.\n',
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
        } else {
          if (this.targetHand === IN_HAND) {
            if (oppCard && oppCard.deckValue > this.consumedCard.deckValue) {
              playCard = dummySuit?.topSequence?.bottomCard ?? dummySuit?.topCard ?? null;
              status?.stream(
                `PL2FN72! LHO has played a higher card (the ${oppCard.faceName}) than our finesse card (the ${this.consumedCard.faceName}), so cover with the ${playCard?.faceName}.\n`,
              );
            } else {
              playCard = getDiscardCard();
              status?.stream(
                `PL2FN64! LHO has played low, so let the finesse card ride and discard the ${playCard?.name} from hand.\n`,
              );
            }
          } else {
            status?.stream(
              '4PL2FN76! We intended to finesse from dummy, but ended up here in dummy in third position -- so skip this play.\n',
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
        }
        this.status = PlayResult.Complete;
        break;
      }

      case 3: {
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        const oppCard = dependencies.currentBestCard ?? null;
        status?.stream('3PL2FN80! We played the finesse card in second position, so check the results.\n');
        const activeSuit = playingInHand ? playerSuit : dummySuit;
        if (oppCard && oppCard.suit === suitLed && oppCard.deckValue > this.consumedCard.deckValue) {
          playCard = activeSuit?.getLowestCardAbove(oppCard) ?? getDiscardCard();
          status?.stream(
            `${playingInHand ? 'PL2FN80' : 'PL2FN90'}! ${playingInHand ? 'RHO' : 'LHO'} topped our finesse card, so cover it with the ${playCard?.faceName}.\n`,
          );
        } else {
          playCard = getDiscardCard();
          status?.stream(
            `${playingInHand ? 'PL2FN82' : 'PL2FN92'}! Our finesse card (the ${this.consumedCard.faceName} has held, so discard the ${playCard?.name}.\n`,
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

//
// Type III Finesse
// - lead of a low card towards a higher card in the opposite hand, which
//   does not have a commanding card.
//   e.g., K52 / 853 -- lead the 3 and finesse the King against East,
//                      or play low if West plays the Ace.
//
export class Type3Finesse extends Finesse {
  leadCards: CardList | null = null;

  constructor(suitOrCard: Suit | typeof NONE | Card = NONE, options: FinesseVariantOptions = {}) {
    super(suitOrCard, {
      ...options,
      subType: FinesseSubType.TypeIII,
    });
    this.endingHand = this.targetHand;
    this.startingHand = this.endingHand === IN_HAND ? IN_DUMMY : IN_HAND;
    if (options.leadCards) {
      this.leadCards = options.leadCards instanceof CardList
        ? options.leadCards
        : new CardList(options.leadCards);
      this.setAlternativeKeyCards(this.leadCards);
    }
  }

  override getFullDescription(): string {
    if (!this.consumedCard || !isSuit(this.suit)) return 'Type III Finesse.';
    const suitDesc = this.suit === this.trumpSuit ? 'trump' : Card.suitToSingularString(this.suit);
    const fromHand = this.targetHand === IN_HAND ? 'dummy' : 'hand';
    const inHand = this.targetHand === IN_HAND ? 'hand' : 'dummy';
    const targetName = isPosition(this.targetPos) ? positionToString(this.targetPos) : 'opponent';
    return `Lead a low ${suitDesc} from ${fromHand} and finesse the ${this.consumedCard.faceName} in ${inHand} against ${targetName}.`;
  }

  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit) || !this.consumedCard) {
      this.status = PlayResult.InProgress;
      return this.status;
    }

    const { status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const playerHand = dependencies.declarerHand;
    const dummyHand = dependencies.dummyHand;
    const playerSuit = playerHand?.getSuit(this.suit);
    const dummySuit = dummyHand?.getSuit(this.suit);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const trumpSuit = dependencies.trumpSuit ?? NONE;
    const topCard = dependencies.currentBestCard ?? cardLed;
    const trumped =
      isSuit(trumpSuit) &&
      suitLed !== trumpSuit &&
      topCard !== null &&
      topCard.suit === trumpSuit;
    const activeHand = playingInHand ? playerHand : dummyHand;
    const getDiscardCard = (): Card | null =>
      activeHand
        ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
        : null;

    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    let playCard: Card | null = null;

    switch (ordinal) {
      case 0: {
        if (playingInHand) {
          if (this.targetHand === IN_HAND) {
            status?.stream(
              `4PL3FNS10! Can't use this (Type III) finesse leading from hand, as the finesse card (${this.consumedCard.name}) is in our own hand.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          if (playerSuit && playerSuit.length > 0) {
            playCard = playerSuit.bottomCard;
            status?.stream(
              `PL3FN12! Lead a low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from hand to finesse the ${this.consumedCard.faceName} in dummy.\n`,
            );
          } else {
            status?.stream(
              `4PL3FN14! Oops, we wanted to finesse a ${Card.suitToSingularString(this.suit)} in dummy, but we have no ${Card.suitToString(this.suit)} in hand to lead, so we have to abandon the play.\n`,
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
        } else {
          if (this.targetHand === IN_DUMMY) {
            status?.stream(
              `4PL3FNS20! Can't use this (Type III) finesse leading from dummy, as the finesse card (${this.consumedCard.name}) is in dummy.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          if (dummySuit && dummySuit.length > 0) {
            playCard = dummySuit.bottomCard;
            status?.stream(
              `PL3FN22! Lead a low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from dummy to finesse the ${this.consumedCard.faceName} in hand.\n`,
            );
          } else {
            status?.stream(
              `4PL3FN24! Oops, we wanted to finesse a ${Card.suitToSingularString(this.suit)} in hand, but we have no ${Card.suitToString(this.suit)} in dummy to lead, so we have to abandon the play.\n`,
            );
            this.status = PlayResult.NotViable;
            return this.status;
          }
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 1: {
        if (
          suitLed !== this.suit ||
          (cardLed && cardLed.deckValue > this.consumedCard.deckValue) ||
          (playingInHand && this.targetHand === IN_HAND) ||
          (!playingInHand && this.targetHand === IN_DUMMY)
        ) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        const suitObj = playingInHand ? playerSuit : dummySuit;
        if (suitObj && suitObj.length > 0) {
          playCard = suitObj.bottomCard;
          status?.stream(
            `${playingInHand ? 'PL3FN32' : 'PL3FN36'}! Play low ${Card.suitToSingularString(this.suit)} (the ${playCard?.faceName}) from ${playingInHand ? 'hand' : 'dummy'} to opportunistically finesse the ${this.consumedCard.faceName} in ${playingInHand ? 'dummy' : 'hand'}.\n`,
          );
        } else {
          playCard = getDiscardCard();
          status?.stream(
            `${playingInHand ? 'PL3FN33' : 'PL3FN37'}! We want to opportunistically finesse a ${Card.suitToSingularString(this.suit)} in ${playingInHand ? 'dummy' : 'hand'}, but have no ${Card.suitToString(this.suit)} in ${playingInHand ? 'hand' : 'dummy'}, so discard the ${playCard?.name}.\n`,
          );
        }
        this.status = PlayResult.InProgress;
        break;
      }

      case 2: {
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        if (suitLed !== this.suit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (trumped) {
          status?.stream('3PL3FN50! the opponent has trumped, so abandon the finesse for this round.\n');
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        const oppCard = dependencies.currentBestCard ?? null;
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          if (oppCard && oppCard.deckValue > this.consumedCard.deckValue) {
            playCard = getDiscardCard();
            status?.stream(
              `${playingInHand ? 'PL3FN62' : 'PL3FN72'}! ${playingInHand ? 'RHO' : 'LHO'} has played a higher card (the ${oppCard.faceName}) than our intended finesse (the ${this.consumedCard.faceName}), so play low with the ${playCard?.faceName}.\n`,
            );
          } else {
            playCard = this.consumedCard;
            status?.stream(
              `${playingInHand ? 'PL3FN64' : 'PLCSH74'}! Finesse the ${playCard.name} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
            );
          }
        } else {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        this.status = PlayResult.Complete;
        break;
      }

      case 3: {
        if (this.status !== PlayResult.InProgress) return PlayResult.Inactive;
        if (suitLed !== this.suit || trumped) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        const activeSuit = playingInHand ? playerSuit : dummySuit;
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          if (topCard && topCard.deckValue > this.consumedCard.deckValue) {
            status?.stream(
              `${playingInHand ? '3PL3FN92' : '3PL3FN96'}! RHO has played a higher card (the ${topCard.faceName}) than our intended finesse (the ${this.consumedCard.faceName}), so skip the play.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          if (activeSuit && topCard && activeSuit.getNumCardsAbove(topCard) > 1) {
            status?.stream(
              `${playingInHand ? '3PL3FN93' : '3PL3FN97'}! We can beat the current top card (the ${topCard.faceName}) with multiple cards in ${playingInHand ? 'hand' : 'dummy'}, so the finesse is no longer necessary.\n`,
            );
            this.status = PlayResult.Inactive;
            return PlayResult.Postpone;
          }
          playCard = this.consumedCard;
          status?.stream(
            `${playingInHand ? 'PL3FN94' : 'PLCSH98'}! Finesse the ${playCard.name} from ${playingInHand ? 'hand' : 'dummy'}.\n`,
          );
          this.status = PlayResult.Complete;
        } else {
          this.status = PlayResult.Error;
          return this.status;
        }
        break;
      }
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}

//
// Type A Finesse
// - opportunistic play of a non-top card in second position to finesse against LHO
//
export class TypeAFinesse extends Finesse {
  constructor(suitOrCard: Suit | typeof NONE | Card = NONE, options: FinesseVariantOptions = {}) {
    super(suitOrCard, {
      ...options,
      subType: FinesseSubType.TypeA,
      opportunistic: true,
    });
    this.target = this.endingHand === IN_DUMMY ? FinesseTarget.AgainstLHO : FinesseTarget.AgainstRHO;
    if (isPosition(this.playerPosition)) {
      this.targetPos = this.target === FinesseTarget.AgainstLHO
        ? nextPosition(this.playerPosition)
        : prevPosition(this.playerPosition);
    }
    this.startingHand = this.targetHand;
    this.endingHand = this.targetHand;
  }

  override getFullDescription(): string {
    if (!this.consumedCard) return 'Opportunistic Type A Finesse.';
    const targetName = isPosition(this.targetPos) ? positionToString(this.targetPos) : 'opponent';
    return `Opportunistically play the ${this.consumedCard.faceName} from ${this.targetHand === IN_HAND ? 'hand' : 'dummy'} to finesse against ${targetName}.`;
  }

  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit) || !this.consumedCard) {
      this.status = PlayResult.InProgress;
      return this.status;
    }

    const { status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const topCard = dependencies.currentBestCard ?? cardLed;
    const activeHand = playingInHand ? dependencies.declarerHand : dependencies.dummyHand;
    const trumpSuit = dependencies.trumpSuit ?? NONE;

    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    let playCard: Card | null = null;
    switch (ordinal) {
      case 0:
      case 2:
        this.status = PlayResult.NotViable;
        return this.status;

      case 1: {
        if (suitLed !== this.suit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if ((playingInHand && this.targetHand === IN_HAND) || (!playingInHand && this.targetHand === IN_DUMMY)) {
          playCard = this.consumedCard;
          const oppName = isPosition(this.targetPos) ? positionToString(this.targetPos) : 'opponent';
          status?.stream(
            `${playingInHand ? 'PLAFN20' : 'PLAFN54'}! Opportunistically finesse the ${playCard.name} from ${playingInHand ? 'hand' : 'dummy'} in second position against ${oppName}.\n`,
          );
          this.status = PlayResult.InProgress;
        } else {
          status?.stream(
            `${playingInHand ? '4PLAFN30' : '4PLAFN60'}! We intended to finesse in hand, but ended up here in dummy in third position -- so skip this play.\n`,
          );
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        break;
      }

      case 3: {
        if (this.status === PlayResult.InProgress) {
          if (topCard && topCard.deckValue === this.consumedCard.deckValue) {
            playCard = activeHand
              ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
              : null;
            status?.stream(
              `PLAFN76! The finesse worked; finish the play by discarding the ${playCard?.name}.\n`,
            );
            this.status = PlayResult.Complete;
          } else {
            status?.stream('PLAFN77! The finesse failed, so abandon the play\n');
            this.status = PlayResult.NotViable;
          }
          dependencies.selectedCard = playCard;
          return this.status;
        }
        this.status = PlayResult.Inactive;
        return this.status;
      }
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}

//
// Type B Finesse
// - opportunistic play (or non-play) of a non-top card in fourth position
//   against both LHO and RHO
//   e.g., holding Kx in fourth position, playing low in second hand
//
export class TypeBFinesse extends Finesse {
  constructor(suitOrCard: Suit | typeof NONE | Card = NONE, options: FinesseVariantOptions = {}) {
    super(suitOrCard, {
      ...options,
      subType: FinesseSubType.TypeB,
      opportunistic: true,
    });
    this.target = this.endingHand === IN_DUMMY ? FinesseTarget.AgainstLHO : FinesseTarget.AgainstRHO;
    if (isPosition(this.playerPosition)) {
      this.targetPos = this.target === FinesseTarget.AgainstLHO
        ? nextPosition(this.playerPosition)
        : prevPosition(this.playerPosition);
    }
    this.startingHand = this.targetHand;
    this.endingHand = this.targetHand;
  }

  override getFullDescription(): string {
    if (!this.consumedCard) return 'Opportunistic Type B Finesse.';
    const targetName = isPosition(this.targetPos) ? positionToString(this.targetPos) : 'opponent';
    return `Opportunistically play the ${this.consumedCard.faceName} from ${this.targetHand === IN_HAND ? 'hand' : 'dummy'} to finesse against ${targetName}.`;
  }

  override perform(dependencies?: PlayDependencies): PlayResult {
    if (!dependencies || !dependencies.combinedHand || !isSuit(this.suit) || !this.consumedCard) {
      this.status = PlayResult.InProgress;
      return this.status;
    }

    const { status } = dependencies;
    const ordinal = dependencies.numCardsPlayedInRound ?? 0;
    const playingInHand = !(dependencies.isDummyTurn ?? false);
    const cardLed = dependencies.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const topCard = dependencies.currentBestCard ?? cardLed;
    const activeHand = playingInHand ? dependencies.declarerHand : dependencies.dummyHand;
    const trumpSuit = dependencies.trumpSuit ?? NONE;
    const getDiscardCard = (): Card | null =>
      activeHand
        ? (dependencies.getDiscard?.(activeHand) ?? activeHand.getDiscard(cardLed, trumpSuit))
        : null;

    if (!this.isViable(dependencies)) {
      this.status = PlayResult.Inactive;
      return PlayResult.Postpone;
    }

    let playCard: Card | null = null;
    switch (ordinal) {
      case 0:
      case 2:
        this.status = PlayResult.NotViable;
        return this.status;

      case 1: {
        if (suitLed !== this.suit) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        playCard = getDiscardCard();
        status?.stream(
          `PLBFN20! Sluff the ${playCard?.name} from ${playingInHand ? 'hand' : 'dummy'} in second position to prep the ${this.consumedCard.name} play.\n`,
        );
        this.status = PlayResult.InProgress;
        break;
      }

      case 3: {
        if (this.status !== PlayResult.InProgress) {
          this.status = PlayResult.Inactive;
          return PlayResult.Postpone;
        }
        if (topCard && this.consumedCard.deckValue > topCard.deckValue) {
          playCard = this.consumedCard;
          status?.stream(`PLBFN76! The finesse worked; win with the ${playCard.faceValue}.\n`);
        } else {
          playCard = getDiscardCard();
          status?.stream(`PLBFN77! West played high, so discard the ${playCard?.faceValue}.\n`);
        }
        this.status = PlayResult.Complete;
        break;
      }
    }

    dependencies.selectedCard = playCard;
    return this.status;
  }
}
