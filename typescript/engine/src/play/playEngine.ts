//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CPlayEngine (PlayEngine.H / PlayEngine.cpp)
//
// - encapsulates the play engine and its status variables
//
//===========================================================

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import { CardLocation } from '../cardLocation.js';
import {
  ACE,
  isPosition,
  isSuit,
  makeDeckValue,
  NONE,
  Position,
  positionToString,
  Suit,
  Team,
  TEAM_NAMES,
} from '../constants.js';
import { GuessedCard } from '../guessedCard.js';
import { Hand } from '../hand.js';
import { PlayerStatus } from '../playerStatus.js';
import { GuessedHandHoldings } from './guessedHandHoldings.js';

export interface PlayerRole {
  position: Position;
  hand: Hand;
  status: PlayerStatus;
  isDeclarer?: boolean;
  isDummy?: boolean;
  team?: Team;
  playForDummy?: (roundContext?: PlayRoundContext) => Card | null;
  getPlayHintForDummy?: (roundContext?: PlayRoundContext) => Card | null;
  getNumClaimableTricks?: () => number;
}

export interface PlayEngineContext {
  player: PlayerRole;
  partner: PlayerRole;
  leftOpponent: PlayerRole;
  rightOpponent: PlayerRole;
  hand: Hand;
  cardLocation: CardLocation;
  guessedHands: GuessedHandHoldings[];
  status: PlayerStatus;
  prioritySuit?: Suit | typeof NONE;
  trumpSuit?: Suit | typeof NONE;
  contract?: number;
  contractModifier?: number;
  vulnerable?: boolean;
  opponentsVulnerable?: boolean;
}

export interface TrickRecord {
  lead: Position;
  winner: Position;
  cards: Partial<Record<Position, Card>>;
}

export interface PlayRoundContext {
  numCardsPlayedInRound?: number;
  playRound?: number;
  numTricksPlayed?: number;
  roundLead?: Position | typeof NONE;
  leadCard?: Card | null;
  currentHighCard?: Card | null;
  currentHighPos?: Position | typeof NONE;
  partnersCard?: Card | null;
  trumpSuit?: Suit | typeof NONE;
  wasTrumpPlayed?: boolean;
  dummyHand?: Hand | null;
  dummyPosition?: Position | typeof NONE;
  declarerPosition?: Position | typeof NONE;
  dummyExposed?: boolean;
  unbidSuits?: readonly Suit[];
  contract?: number;
  contractLevel?: number;
  numTricksWonByTeam?: number;
  numTricksWonByDeclarer?: number;
  numTricksWonByDefenders?: number;
  isReviewingGame?: boolean;
  gameTrickHistory?: readonly TrickRecord[];
  partnerBids?: readonly number[];
  lhoBids?: readonly number[];
  rhoBids?: readonly number[];
  currentPlayerPosition?: Position | typeof NONE;
  isDummyTurn?: boolean;
  rhoCard?: Card | null;
  declarersCard?: Card | null;
  dummysCard?: Card | null;
  numTricksRemaining?: number;
}

function nextSuit(suit: Suit): Suit {
  return ((suit + 1) % 4) as Suit;
}

export class PlayEngine {
  // shortcuts
  szLHO = 'LHO';
  szRHO = 'RHO';

  player: PlayerRole | null = null;
  partner: PlayerRole | null = null;
  leftOpponent: PlayerRole | null = null;
  rightOpponent: PlayerRole | null = null;
  position: Position = Position.Unknown;
  partnerPosition: Position = Position.Unknown;
  hand: Hand | null = null;
  partnersHand: Hand | null = null;
  cardLocation: CardLocation | null = null;
  guessedHands: GuessedHandHoldings[] = [];
  status: PlayerStatus | null = null;

  protected inHintMode = false;

  // data initialized once per hand
  vulnerable = false;
  opponentsVulnerable = false;
  lhDefender = false;
  rhDefender = false;
  contract = 0;
  contractModifier = 0;
  trumpSuit: Suit | typeof NONE = NONE;

  prioritySuit: Suit | typeof NONE = NONE;
  partnersPrioritySuit: Suit | typeof NONE = NONE;
  suitPriorityList: (Suit | typeof NONE)[] = [NONE, NONE, NONE, NONE];

  // data initialized every round
  round = 0;
  numCardsPlayed = 0;
  roundLead: Position | typeof NONE = NONE;
  leadCard: Card | null = null;
  leadSuit: Suit | typeof NONE = NONE;
  leadFaceValue = -1;
  previousCard: Card | null = null;
  partnersCard: Card | null = null;
  partnersPrevCard: Card | null = null;

  //
  // Initialize()
  //
  // one-time initialization at program start
  //
  initialize(context: PlayEngineContext): void {
    this.player = context.player;
    this.partner = context.partner;
    this.leftOpponent = context.leftOpponent;
    this.rightOpponent = context.rightOpponent;
    this.position = context.player.position;
    this.partnerPosition = context.partner.position;
    this.partnersHand = context.partner.hand;

    this.szLHO = positionToString(context.leftOpponent.position);
    this.szRHO = positionToString(context.rightOpponent.position);

    this.hand = context.hand;
    this.cardLocation = context.cardLocation;
    this.guessedHands = context.guessedHands;
    this.status = context.status;
    this.prioritySuit = context.prioritySuit ?? NONE;
    this.trumpSuit = context.trumpSuit ?? NONE;
    this.contract = context.contract ?? 0;
    this.contractModifier = context.contractModifier ?? 0;
    this.vulnerable = context.vulnerable ?? false;
    this.opponentsVulnerable = context.opponentsVulnerable ?? false;
    this.lhDefender = Boolean(this.rightOpponent?.isDeclarer);
    this.rhDefender = Boolean(this.leftOpponent?.isDeclarer);
  }

  //
  // Clear()
  //
  clear(): void {
    for (let i = 0; i < this.guessedHands.length; i++) {
      this.guessedHands[i].clear(true);
    }
    this.prioritySuit = NONE;
    this.partnersPrioritySuit = NONE;
    this.suitPriorityList = [NONE, NONE, NONE, NONE];
  }

  //
  // InitNewHand()
  //
  // called when the hand is dealt (or play is restarted)
  //
  initNewHand(
    contract = this.contract,
    contractModifier = this.contractModifier,
    trumpSuit: Suit | typeof NONE = this.trumpSuit,
  ): void {
    this.contract = contract;
    this.contractModifier = contractModifier;
    this.trumpSuit = trumpSuit;
    this.lhDefender = Boolean(this.rightOpponent?.isDeclarer);
    this.rhDefender = Boolean(this.leftOpponent?.isDeclarer);
    this.clear();
  }

  //
  // InitSwappedHand()
  //
  initSwappedHand(
    contract = this.contract,
    contractModifier = this.contractModifier,
    trumpSuit: Suit | typeof NONE = this.trumpSuit,
  ): void {
    this.initNewHand(contract, contractModifier, trumpSuit);
  }

  //
  // RestartPlay()
  //
  restartPlay(): void {
    this.status?.stream('3PLAY! Play restarted.\n====================\n');
    this.clear();
    this.initNewHand();
  }

  setHintMode(mode: boolean): void {
    this.inHintMode = mode;
  }

  getHintMode(): boolean {
    return this.inHintMode;
  }

  getPrioritySuit(): Suit | typeof NONE {
    return this.prioritySuit;
  }

  getPartnersPrioritySuit(): Suit | typeof NONE {
    return this.partnersPrioritySuit;
  }

  getNthPrioritySuit(index: number): Suit | typeof NONE {
    return this.suitPriorityList[index] ?? NONE;
  }

  //
  // Observation routines
  //

  //
  // RecordCardPlay()
  //
  // record that a card has been played
  //
  recordCardPlay(
    position: Position,
    card: Card,
    roundContext?: PlayRoundContext,
  ): void {
    const isLead = (roundContext?.numCardsPlayedInRound ?? 0) === 1;
    if (this.status) {
      if (position === this.position) {
        this.status.stream(`4PLAY! We${isLead ? ' lead' : ' play'} the ${card.name}.\n`);
      } else {
        this.status.stream(
          `4PLAY! ${positionToString(position)}${isLead ? ' leads' : ' plays'} the ${card.name}.\n`,
        );
      }
    }

    if (this.cardLocation) {
      this.cardLocation.at(card.deckValue).markAsPlayed(position);
    }

    const guessedHand = this.guessedHands[position];
    if (guessedHand) {
      guessedHand.add(new GuessedCard(card, {
        outstanding: false,
        location: position,
        fixProbability: 1,
      }));
      guessedHand.sort();
    }

    this.adjustHoldingsCount(card);
    this.adjustCardCountFromPlay(position, card, roundContext);
  }

  //
  // RecordCardUndo()
  //
  recordCardUndo(position: Position, card: Card): void {
    this.status?.stream('4>> Card taken back.\n');
    if (this.cardLocation) {
      const guessed = this.cardLocation.at(card.deckValue);
      guessed.setPlayed(false);
      guessed.setProbableLocation(position);
      guessed.clearFixProbability();
    }
    this.guessedHands[position]?.removeByValue(card.deckValue);
    this.adjustHoldingsCount(card);
    this.adjustCardCountFromUndo(position, card);
  }

  //
  // RecordTrickUndo()
  //
  recordTrickUndo(): void {
    this.status?.stream('4- - - - - - - -\n');
    this.status?.stream('4>> Trick taken back.\n');
  }

  //
  // RecordRoundComplete()
  //
  recordRoundComplete(winnerPos: Position, _winningCard?: Card | null): void {
    this.status?.stream(`4PLAY! ${positionToString(winnerPos)} wins the round.\n--------\n`);
  }

  //
  // RecordHandComplete()
  //
  recordHandComplete(result: number, declaringTeam: Team = Team.NorthSouth): void {
    const teamStr = TEAM_NAMES[declaringTeam] ?? 'Neither';
    if (result > 0) {
      this.status?.stream(
        `3RESULT! ${teamStr} made ${result} overtrick${result > 1 ? 's' : ''}.\n`,
      );
    } else if (result === 0) {
      this.status?.stream(`3RESULT! ${teamStr} made the contract.\n`);
    } else {
      this.status?.stream(
        `3RESULT! ${teamStr} were set ${-result} trick${result < -1 ? 's' : ''}.\n`,
      );
    }
  }

  //
  // RecordSpecialEvent()
  //
  recordSpecialEvent(code: number, param1 = 0, param2 = 0): void {
    const playerPos = param1 as Position;
    const numTricks = param2;
    switch (code) {
      case 1: // EVENT_CLAIMED
        this.status?.stream(
          `3PLAYCL! ${positionToString(playerPos)} has claimed the remaining ${numTricks} tricks.\n`,
        );
        break;
      case 2: // EVENT_CONCEDED
        this.status?.stream(
          `3PLAYCN! ${positionToString(playerPos)} has conceded the remaining ${numTricks} tricks.\n`,
        );
        break;
    }
  }

  //
  // AdjustCardCountFromPlay()
  //
  adjustCardCountFromPlay(
    pos: Position,
    card: Card,
    roundContext?: PlayRoundContext,
  ): void {
    const playerHoldings = this.guessedHands[pos];
    if (!playerHoldings) return;

    const leadCard = roundContext?.leadCard ?? null;
    if (leadCard) {
      const suitLed = leadCard.suit;
      const suit = playerHoldings.getSuit(suitLed);
      if (card.suit !== suitLed && !suit.isSuitShownOut) {
        this.status?.stream(
          `4RCP10! ${positionToString(pos)} shows out of ${Card.suitToString(suitLed)}.\n`,
        );
        suit.markSuitShownOut();

        if (playerHoldings.numSuitsFullyIdentified > 1) {
          this.status?.stream(`4RCP1A! ${positionToString(pos)} is now known to have started with `);
          const identifiedSuits: number[] = [];
          let totalOriginalCards = 0;
          for (let i = 0; i < 4; i++) {
            const currSuit = playerHoldings.getSuit(i as Suit);
            if (currSuit.areAllCardsIdentified) {
              const prefix = identifiedSuits.length > 0 ? ' and ' : ' ';
              const suitWord = currSuit.numOriginalCards > 1
                ? Card.suitToString(i)
                : Card.suitToSingularString(i);
              this.status?.addStream(`${prefix}${currSuit.numOriginalCards} ${suitWord}`);
              identifiedSuits.push(i);
              totalOriginalCards += currSuit.numOriginalCards;
            }
          }
          this.status?.addStream('.\n');

          // if 3 suits are known, the 4th suit length is also known
          if (identifiedSuits.length === 3) {
            let fourthSuitIndex = NONE;
            for (let i = 0; i < 4; i++) {
              if (!identifiedSuits.includes(i)) {
                fourthSuitIndex = i;
                break;
              }
            }
            if (isSuit(fourthSuitIndex)) {
              const fourthSuit = playerHoldings.getSuit(fourthSuitIndex);
              const numOriginalCards = Math.max(0, 13 - totalOriginalCards);
              fourthSuit.setOriginalCards(numOriginalCards);
              const numRemainingCards = Math.max(0, numOriginalCards - fourthSuit.numPlayedCards);
              fourthSuit.setRemainingCards(numRemainingCards);
              this.status?.stream(
                `4RCP1B! Therefore, ${positionToString(pos)} started with ${numOriginalCards} ${Card.suitToString(fourthSuitIndex)} and has ${numRemainingCards} left.\n`,
              );
            }
          }
        } else {
          const orig = suit.numOriginalCards;
          const suitWord = orig === 1
            ? Card.suitToSingularString(suitLed)
            : Card.suitToString(suitLed);
          this.status?.addStream(
            `RCP5A! ${positionToString(pos)} is now known to have started with ${orig} ${suitWord}.\n`,
          );
        }
      }

      // if dummy plays last card in suit, mark shown out
      if (
        roundContext?.dummyExposed &&
        roundContext.dummyPosition === pos &&
        roundContext.dummyHand &&
        card.suit === suitLed &&
        roundContext.dummyHand.getSuitLength(suitLed) === 0 &&
        !playerHoldings.isSuitShownOut(suitLed)
      ) {
        this.status?.stream(`3RCP20! Dummy is now out of ${Card.suitToString(suitLed)}.\n`);
        playerHoldings.markSuitShownOut(suitLed);
      }
    }

    // on round 0, if dummy is exposed, mark void suits
    if (
      (roundContext?.playRound ?? -1) === 0 &&
      roundContext?.dummyExposed &&
      roundContext.dummyPosition === pos &&
      roundContext.dummyHand
    ) {
      for (let i = 0; i < 4; i++) {
        if (roundContext.dummyHand.getSuitLength(i as Suit) === 0) {
          this.status?.stream(`3RCP25! Dummy is shown to be void in ${Card.suitToString(i)}.\n`);
          playerHoldings.markSuitShownOut(i as Suit);
        }
      }
    }
  }

  adjustCardCountFromUndo(pos: Position, card: Card): void {
    this.guessedHands[pos]?.delete(card);
  }

  adjustHoldingsCount(card: Card): void {
    this.hand?.reevaluateHoldings(card);
  }

  //
  // Analysis & counting routines
  //

  getOutstandingCards(suit: Suit): readonly Card[] {
    const list = new CardList();
    this.getOutstandingCardsList(suit, list);
    return list.cardsInAscendingDeckOrder;
  }

  //
  // GetOutstandingCards()
  //
  // determine the list of outstanding cards in this suit
  //
  getOutstandingCardsList(
    suit: Suit,
    cardList: CardList,
    countDummy = false,
    dummyHand?: Hand | null,
    dummyExposed = false,
  ): number {
    cardList.clear();
    if (!isSuit(suit)) return 0;

    if (this.cardLocation && this.guessedHands.length === 0 && !this.hand) {
      for (const guessed of this.cardLocation.all) {
        if (guessed.isOutstanding && guessed.suit === suit) {
          cardList.add(guessed.card);
        }
      }
      cardList.sort();
      return cardList.length;
    }

    // first fill the list with all the cards in the suit
    for (let face = 2; face <= ACE; face++) {
      cardList.add(Card.fromDeckValue(makeDeckValue(suit, face)));
    }
    cardList.sort();

    // remove cards remaining in our own hand
    if (this.hand) {
      for (const c of this.hand.getCardsInSuit(suit)) {
        cardList.remove(c);
      }
    }

    // remove dummy's cards if visible
    if (!countDummy && dummyExposed && dummyHand) {
      for (const c of dummyHand.getCardsInSuit(suit)) {
        cardList.remove(c);
      }
    }

    // remove cards that have already been played
    for (const guessedHand of this.guessedHands) {
      const guessedSuit = guessedHand.getSuit(suit);
      for (const gc of guessedSuit.all) {
        if (gc.wasPlayed) {
          cardList.removeByValue(gc.deckValue);
        }
      }
    }
    if (this.cardLocation) {
      for (const gc of this.cardLocation.all) {
        if (gc.suit === suit && gc.wasPlayed) {
          cardList.removeByValue(gc.deckValue);
        }
      }
    }

    cardList.sort();
    return cardList.length;
  }

  getHighestOutstandingCard(suit: Suit): Card | null {
    const list = new CardList();
    const count = this.getOutstandingCardsList(suit, list);
    return count > 0 ? list.at(0) ?? null : null;
  }

  getNumOutstandingCards(suit: Suit): number {
    const list = new CardList();
    return this.getOutstandingCardsList(suit, list);
  }

  isCardOutstanding(card: Card): boolean {
    if (this.cardLocation) {
      return this.cardLocation.at(card.deckValue).isOutstanding;
    }
    const list = new CardList();
    this.getOutstandingCardsList(card.suit, list);
    return list.hasCard(card);
  }

  getNumCardsPlayedInSuit(playerPos: Position, suit: Suit): number {
    return this.guessedHands[playerPos]?.getSuit(suit).numPlayedCards ?? 0;
  }

  getMinCardsInSuit(playerPos: Position, suit: Suit): number {
    const guessedSuit = this.guessedHands[playerPos]?.getSuit(suit);
    if (!guessedSuit) return 0;
    if (guessedSuit.areAllCardsIdentified) return guessedSuit.numMinRemainingCards;

    // check if everyone except ourselves and playerPos has shown out
    let allShownOut = true;
    for (let pos = 0; pos < 4; pos++) {
      if (pos === this.position || pos === playerPos) continue;
      if (!this.guessedHands[pos]?.isSuitShownOut(suit)) {
        allShownOut = false;
        break;
      }
    }
    if (allShownOut) {
      let cardsAccountedFor = this.hand?.getSuitLength(suit) ?? 0;
      for (let i = 0; i < 4; i++) {
        cardsAccountedFor += this.guessedHands[i]?.getSuit(suit).numPlayedCards ?? 0;
      }
      if (cardsAccountedFor < 13) {
        const min = 13 - cardsAccountedFor;
        const missing = new CardList();
        this.getOutstandingCardsList(suit, missing);
        for (const c of missing.cardsInAscendingDeckOrder) {
          this.guessedHands[playerPos].add(new GuessedCard(c, {
            outstanding: true,
            location: playerPos,
            fixProbability: 1,
          }));
        }
        guessedSuit.markAllCardsIdentified(true);
        this.status?.stream(
          `4PLEMN5! ${positionToString(playerPos)} is now known to hold the remaining ${missing.length} ${Card.suitToString(suit)} (${missing.holdingsString}).\n`,
        );
        guessedSuit.setOriginalCards(min + guessedSuit.numPlayedCards);
        guessedSuit.setRemainingCards(min);
        guessedSuit.setNumLikelyCards(min);
        return min;
      }
    }
    return 0;
  }

  getMaxCardsInSuit(playerPos: Position, suit: Suit, dummyHand?: Hand | null, dummyPos?: Position): number {
    const guessedSuit = this.guessedHands[playerPos]?.getSuit(suit);
    if (guessedSuit?.areAllCardsIdentified) return guessedSuit.numMaxRemainingCards;

    let max = 13;
    if (this.hand) max -= this.hand.initialHand.getNumCardsOfSuit(suit);
    if (dummyHand) max -= dummyHand.initialHand.getNumCardsOfSuit(suit);
    for (let pos = 0; pos < 4; pos++) {
      if (pos === this.position || pos === dummyPos) continue;
      max -= this.getNumCardsPlayedInSuit(pos as Position, suit);
    }
    if (max <= 0) {
      max = 0;
      if (guessedSuit) {
        guessedSuit.markAllCardsIdentified(true);
        guessedSuit.setOriginalCards(guessedSuit.numPlayedCards);
        guessedSuit.setRemainingCards(0);
      }
    }
    return max;
  }

  //
  // Play routines
  //

  assessPosition(roundContext?: PlayRoundContext): void {
    this.round = roundContext?.playRound ?? 0;
    this.numCardsPlayed = roundContext?.numCardsPlayedInRound ?? 0;
    if (this.numCardsPlayed > 0 && roundContext?.leadCard) {
      this.roundLead = roundContext.roundLead ?? NONE;
      this.leadCard = roundContext.leadCard;
      this.leadSuit = roundContext.leadCard.suit;
      this.leadFaceValue = roundContext.leadCard.faceValue;
    } else {
      this.roundLead = NONE;
      this.leadCard = null;
      this.leadSuit = NONE;
      this.leadFaceValue = -1;
    }
  }

  //
  // PlayFirst() / PlaySecond() / PlayThird() / PlayFourth()
  //
  playFirst(roundContext?: PlayRoundContext): Card | null {
    this.status?.stream('5PLAY1! Leading card, using default player logic.\n');
    return this.getLeadCard(roundContext);
  }

  playSecond(roundContext?: PlayRoundContext): Card | null {
    this.status?.stream('5PLAY2! Playing second, using default player logic.\n');
    if (!this.hand) return null;

    const cardLed = roundContext?.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const currTopCard = roundContext?.currentHighCard ?? cardLed;
    const trumpSuit = roundContext?.trumpSuit ?? this.trumpSuit;

    if (!isSuit(suitLed)) return this.getLeadCard(roundContext);

    const suit = this.hand.getSuit(suitLed);
    const numCardsInSuit = suit.length;
    if (numCardsInSuit > 0) {
      // second hand low
      const card = suit.bottomCard!;
      if (numCardsInSuit > 1) {
        if (currTopCard && card.deckValue < currTopCard.deckValue) {
          this.status?.stream(`PLY2C1! Play second hand low with the ${card.faceName}.\n`);
        } else {
          this.status?.stream(
            `PLY2C2! As second hand, we play the lowest card we have in the suit, the ${card.faceName}.\n`,
          );
        }
      } else {
        this.status?.stream(
          `PLY2C4! Play our only ${Card.suitToSingularString(suitLed)}, the ${card.faceName}.\n`,
        );
      }
      return card;
    }

    // no cards in the suit led: trump if possible
    if (isSuit(trumpSuit) && this.hand.getSuitLength(trumpSuit) > 0) {
      const trumps = this.hand.getSuit(trumpSuit);
      const card = trumps.bottomCard!;
      this.status?.stream(`PLY2P1! Trump with the ${card.faceName}.\n`);
      return card;
    }

    // discard
    const card = this.getDiscard(roundContext);
    this.status?.stream(
      `PLY2Y! We have no ${Card.suitToString(suitLed)}, so discard the ${card?.name}.\n`,
    );
    return card;
  }

  playThird(roundContext?: PlayRoundContext): Card | null {
    this.status?.stream('5PLAY3! Playing third, using default player logic.\n');
    return this.playBestCard(3, roundContext);
  }

  playFourth(roundContext?: PlayRoundContext): Card | null {
    this.status?.stream('5PLAY4! Playing fourth, using default player logic.\n');
    return this.playBestCard(4, roundContext);
  }

  //
  // PlayBestCard()
  //
  // called on the third and fourth hand plays to try to win the trick
  //
  protected playBestCard(seat: number, roundContext?: PlayRoundContext): Card | null {
    if (!this.hand) return null;

    const cardLed = roundContext?.leadCard ?? null;
    const suitLed = cardLed ? cardLed.suit : NONE;
    const currTopCard = roundContext?.currentHighCard ?? cardLed;
    const topCardPos = roundContext?.currentHighPos ?? NONE;
    const strTopCardPos = isPosition(topCardPos) ? positionToString(topCardPos) : 'opponent';
    const partnersCard = roundContext?.partnersCard ?? null;
    const partnerHigh = Boolean(partnersCard && currTopCard && partnersCard.deckValue === currTopCard.deckValue);
    const trumpSuit = roundContext?.trumpSuit ?? this.trumpSuit;
    const wasTrumpPlayed = roundContext?.wasTrumpPlayed ??
      (isSuit(trumpSuit) && currTopCard !== null && currTopCard.suit === trumpSuit);
    const currentRound = roundContext?.playRound ?? 0;

    if (!isSuit(suitLed) || !currTopCard) {
      return this.getLeadCard(roundContext);
    }

    const numCardsInSuitLed = this.hand.getSuitLength(suitLed);

    // first see if somebody trumped in this hand
    if (wasTrumpPlayed && isSuit(trumpSuit) && trumpSuit !== suitLed) {
      if (partnerHigh) {
        const card = this.getDiscard(roundContext);
        this.status?.stream(
          `PLAYB10! We let partner's ${currTopCard.name} trump ride and discard the ${card?.name}.\n`,
        );
        return card;
      }
      const trumps = this.hand.getSuit(trumpSuit);
      const topTrump = trumps.topCard;
      if (numCardsInSuitLed === 0 && topTrump && topTrump.deckValue > currTopCard.deckValue) {
        const card = trumps.getLowestCardAbove(currTopCard)!;
        this.status?.stream(
          `PLAYB20! We can overtrump ${strTopCardPos}'s ${currTopCard.name} with the ${card.faceName}.\n`,
        );
        return card;
      }
      const card = this.getDiscard(roundContext);
      if (numCardsInSuitLed === 0 && trumps.length > 0) {
        this.status?.stream(
          `PLAYB22! We can't overtrump ${strTopCardPos}'s ${currTopCard.faceName}, so discard the ${card?.name}.\n`,
        );
      } else {
        this.status?.stream(
          `PLAYB23! We can't beat the opponent's ${currTopCard.faceName} of trumps, so discard the ${card?.name}.\n`,
        );
      }
      return card;
    }

    // nobody trumped, or a trump was led
    if (numCardsInSuitLed > 0) {
      const suit = this.hand.getSuit(suitLed);
      const topCard = suit.topCard!;
      if (topCard.deckValue > currTopCard.deckValue) {
        if (partnerHigh) {
          if (isSuit(trumpSuit) && currentRound === 0 && suit.numHonors === 1) {
            if (suit.length > 1) {
              this.status?.stream(
                `PLAYB30! Drop the ${topCard.faceName} here to unblock the suit for partner.\n`,
              );
            }
            return topCard;
          }
          if (seat === 4) {
            const card = this.getDiscard(roundContext);
            this.status?.stream(
              `PLAYB34! Partner's ${currTopCard.faceName} is high, so discard the ${card?.name}.\n`,
            );
            return card;
          }
          const topOutstanding = this.getHighestOutstandingCard(suitLed);
          if (!topOutstanding || currTopCard.deckValue > topOutstanding.deckValue) {
            const card = this.getDiscard(roundContext);
            this.status?.stream(
              `PLAYB36! Partner's ${currTopCard.faceName} is higher than any outstanding card, so discard the ${card?.name}.\n`,
            );
            return card;
          }
          const card = suit.topSequence?.bottomCard ?? topCard;
          this.status?.stream(
            `PLAYB37! Partner's ${currTopCard.faceName} might not win the round, so top it with the ${card.faceName}.\n`,
          );
          return card;
        } else {
          if (seat === 3) {
            const card = suit.topSequence?.bottomCard ?? topCard;
            this.status?.stream(`PLAYB40! Play high to win with the ${card.faceName}.\n`);
            return card;
          }
          const card = suit.getLowestCardAbove(currTopCard) ?? topCard;
          this.status?.stream(`PLAYB41! Play the ${card.faceName} to win the trick.\n`);
          return card;
        }
      } else {
        const card = this.getDiscard(roundContext);
        if (partnerHigh) {
          this.status?.stream(
            `PLAYB47! Partner's ${currTopCard.faceName} can win the trick, so discard the ${card?.name}.\n`,
          );
        } else {
          this.status?.stream(
            `PLAYB48! We can't beat ${strTopCardPos}'s ${currTopCard.faceName}, so discard the ${card?.name}.\n`,
          );
        }
        return card;
      }
    }

    if (isSuit(trumpSuit) && suitLed !== trumpSuit && this.hand.getSuitLength(trumpSuit) > 0) {
      if (partnerHigh) {
        const card = this.getDiscard(roundContext);
        this.status?.stream(
          `PLAYB52! Although we could trump this hand, partner's ${currTopCard.name} is high, so discard the ${card?.name}.\n`,
        );
        return card;
      }
      const card = this.hand.getSuit(trumpSuit).bottomCard!;
      this.status?.stream(
        `PLAYB55! With no cards in ${Card.suitToString(suitLed)}, trump with the ${card.name}.\n`,
      );
      return card;
    }

    const card = this.getDiscard(roundContext);
    this.status?.stream(
      `PLAYB52! With no cards in the suit led and no trumps, we discard the ${card?.name}.\n`,
    );
    return card;
  }

  //
  // GetLeadCard()
  //
  getLeadCard(roundContext?: PlayRoundContext): Card | null {
    if (!this.hand) return null;
    const trumpSuit = roundContext?.trumpSuit ?? this.trumpSuit;

    // look to see if we have any winners
    if (this.hand.numWinners > 0) {
      let suit: Suit = isSuit(trumpSuit) ? nextSuit(trumpSuit) : Suit.Clubs;
      for (let i = 0; i < 4; i++) {
        const suitObj = this.hand.getSuit(suit);
        if (suitObj.numTopCards > 0 && suit !== trumpSuit) {
          const leadCard = suitObj.topSequence?.bottomCard ?? suitObj.topCard;
          if (leadCard) {
            this.status?.stream(
              `PLYLDA! With no other obvious plays, cash a winner with the ${leadCard.name}.\n`,
            );
            return leadCard;
          }
        }
        suit = nextSuit(suit);
      }
    }

    // if we have a card in an unbid suit, lead from that suit
    for (const unbidSuit of roundContext?.unbidSuits ?? []) {
      const suitObj = this.hand.getSuit(unbidSuit);
      if (suitObj.length > 0) {
        const leadCard = suitObj.bottomCard!;
        this.status?.stream(
          `PLYLDB! With no other clear plays available, lead a card from the unbid ${Card.suitToSingularString(leadCard.suit)} suit.\n`,
        );
        return leadCard;
      }
    }

    // playing in a suit contract with a singleton
    if (isSuit(trumpSuit) && this.hand.getSuitLength(trumpSuit) > 0 && this.hand.numSingletons > 0) {
      for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
        if (suit !== trumpSuit && this.hand.getSuitLength(suit as Suit) === 1) {
          const leadCard = this.hand.getSuit(suit as Suit).at(0)!;
          this.status?.stream(
            `PLYLDC! Lead the singleton ${leadCard.name} in the hopes of setting up a ruff later.\n`,
          );
          return leadCard;
        }
      }
    }

    // else lead a card from the worst suit
    for (let i = 3; i >= 0; i--) {
      const suit = this.hand.getSuitsByPreference(i);
      if (isSuit(suit) && suit !== trumpSuit && this.hand.getSuitLength(suit) > 0) {
        return this.hand.getSuit(suit).bottomCard;
      }
    }
    if (isSuit(trumpSuit) && this.hand.getSuitLength(trumpSuit) > 0) {
      return this.hand.getSuit(trumpSuit).at(0) ?? null;
    }

    // fallback: highest card in any non-empty suit
    for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
      const cards = this.hand.getCardsInSuit(suit as Suit);
      if (cards.length > 0) return cards[0];
    }
    return null;
  }

  getDiscard(roundContext?: PlayRoundContext): Card | null {
    if (!this.hand) return null;
    return this.hand.getDiscard(
      roundContext?.leadCard ?? null,
      roundContext?.trumpSuit ?? this.trumpSuit,
      this.prioritySuit,
      this.partnersPrioritySuit,
    );
  }

  //
  // PickFinalDiscardSuit()
  //
  pickFinalDiscardSuit(hand: Hand): Suit | typeof NONE {
    // look through suits by preference for one that has losers
    for (let i = 3; i >= 0; i--) {
      const suit = hand.getSuitsByPreference(i);
      if (!isSuit(suit)) continue;
      const testSuit = hand.getSuit(suit);
      if (testSuit.length > 0 && testSuit.length > testSuit.numWinners) {
        return suit;
      }
    }
    // search for a suit that has winners but no outstanding cards
    for (let i = 3; i >= 0; i--) {
      const suit = hand.getSuitsByPreference(i);
      if (isSuit(suit) && hand.getSuitLength(suit) > 0 && this.getNumOutstandingCards(suit) === 0) {
        return suit;
      }
    }
    // finally, give up and get any suit that has cards
    for (let i = 3; i >= 0; i--) {
      const suit = hand.getSuitsByPreference(i);
      if (isSuit(suit) && hand.getSuitLength(suit) > 0) {
        return suit;
      }
    }
    return NONE;
  }

  //
  // Backward-compatible simple chooseCard/playCard
  //
  chooseCard(ledSuit: Suit | typeof NONE = NONE, roundContext?: PlayRoundContext): Card | null {
    if (!this.hand) return null;
    if (roundContext && roundContext.numCardsPlayedInRound !== undefined) {
      switch (roundContext.numCardsPlayedInRound) {
        case 0: return this.playFirst(roundContext);
        case 1: return this.playSecond(roundContext);
        case 2: return this.playThird(roundContext);
        case 3: return this.playFourth(roundContext);
      }
    }
    if (ledSuit !== NONE) {
      const following = this.hand.getCardsInSuit(ledSuit);
      if (following.length > 0) return following[0];
    }
    for (let suit = Suit.Spades; suit >= Suit.Clubs; suit--) {
      const cards = this.hand.getCardsInSuit(suit as Suit);
      if (cards.length > 0) return cards[0];
    }
    return null;
  }

  playCard(
    ledSuitOrContext: Suit | typeof NONE | PlayRoundContext = NONE,
    roundContext?: PlayRoundContext,
  ): Card | null {
    if (typeof ledSuitOrContext === 'object' && ledSuitOrContext !== null) {
      const ctx = ledSuitOrContext;
      this.assessPosition(ctx);
      switch (ctx.numCardsPlayedInRound ?? this.numCardsPlayed) {
        case 0: return this.playFirst(ctx);
        case 1: return this.playSecond(ctx);
        case 2: return this.playThird(ctx);
        case 3: return this.playFourth(ctx);
        default: return this.chooseCard(NONE, ctx);
      }
    }
    const card = this.chooseCard(ledSuitOrContext, roundContext);
    if (card && !roundContext) this.hand?.remove(card);
    return card;
  }

  getPlayHint(_roundContext?: PlayRoundContext): Card | null {
    return null;
  }

  getNumClaimableTricks(): number {
    return 0;
  }
}
