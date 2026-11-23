//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//=====================================================================
//
// CDefenderPlayEngine (DefenderPlayEngine.H / DefenderPlayEngine.cpp)
//
// - encapsulates the defender's play engine and its status variables
//
//=====================================================================

import { Card } from '../card.js';
import { CardList } from '../cardList.js';
import {
  ACE,
  bidLevel,
  bidSuit,
  contractToFullString,
  isBid,
  isHonor,
  isPosition,
  isSuit,
  JACK,
  KING,
  NONE,
  Position,
  positionToString,
  Suit,
} from '../constants.js';
import { SuitStrength } from '../bidding/bidParameters.js';
import { Hand } from '../hand.js';
import { PlayEngine, PlayEngineContext, PlayRoundContext } from './playEngine.js';
import { SuitHoldings } from './suitHoldings.js';

function getNextSuit(suit: Suit): Suit {
  return ((suit + 1) % 4) as Suit;
}

function getNextPlayer(pos: Position): Position {
  return ((pos + 1) % 4) as Position;
}

function getPrevPlayer(pos: Position): Position {
  return ((pos + 3) % 4) as Position;
}

export class DefenderPlayEngine extends PlayEngine {
  partnerSuitPreference: number[] = [0, 0, 0, 0];
  signalledSuit: Suit | typeof NONE = NONE;
  echoedSuit: Suit | typeof NONE = NONE;
  suitEchoed: boolean[] = [false, false, false, false];
  suitLed: boolean[] = [false, false, false, false];
  suitSignalStatus: number[] = [0, 0, 0, 0];

  numRequiredTricks = 0;

  // Backward-compatible alias map for callers using recordSuitPreference/getPreferredSuit
  suitPreference: Record<Suit, number> = {
    [Suit.Clubs]: 0,
    [Suit.Diamonds]: 0,
    [Suit.Hearts]: 0,
    [Suit.Spades]: 0,
  } as Record<Suit, number>;

  //
  // Initialize()
  //
  // one-time initialization
  //
  override initialize(context: PlayEngineContext): void {
    super.initialize(context);
  }

  //
  // Clear()
  //
  override clear(): void {
    super.clear();

    for (let i = 0; i < 4; i++) {
      this.partnerSuitPreference[i] = 0;
      this.suitPreference[i as Suit] = 0;
    }
    this.signalledSuit = NONE;
    this.echoedSuit = NONE;
    for (let i = 0; i < 4; i++) {
      this.suitEchoed[i] = false;
      this.suitLed[i] = false;
      this.suitSignalStatus[i] = 0;
    }
  }

  //
  // InitNewHand()
  //
  // called when the hand is dealt (or play is restarted)
  //
  override initNewHand(
    contract = this.contract,
    contractModifier = this.contractModifier,
    trumpSuit: Suit | typeof NONE = this.trumpSuit,
  ): void {
    super.initNewHand(contract, contractModifier, trumpSuit);

    // m_numRequiredTricks = # required to defeat the contract
    this.numRequiredTricks = 13 - (bidLevel(this.contract) + 6) + 1;
  }

  //
  // RecordCardPlay()
  //
  // note that a card has been played
  //
  override recordCardPlay(pos: Position, card: Card, context: PlayRoundContext = {}): void {
    // first call the base class
    super.recordCardPlay(pos, card, context);

    // skip the rest if reviewing a game
    if (context.isReviewingGame) return;

    // then re-evaluate holdings
    this.hand?.reevaluateHoldings(card);

    // if this suit is being led for the first time, mark it
    const numCardsPlayedInRound = context.numCardsPlayedInRound ?? this.numCardsPlayed;
    if (numCardsPlayedInRound === 1) {
      const suitLed = card.suit;
      if (isSuit(suitLed) && !this.suitLed[suitLed]) {
        this.suitLed[suitLed] = true;
      }
    }

    // see if partner is trying to signal with his discard
    const roundLead = context.roundLead ?? this.roundLead;
    const cardLed = context.leadCard ?? this.leadCard;
    if (!cardLed) return;

    const topCard = context.currentHighCard ?? cardLed;
    const suitLed = cardLed.suit;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const currPlayer = card.owner >= 0 ? (card.owner as Position) : pos;
    const playerPos = this.position;
    const partnerPos = this.partnerPosition;
    const round = context.numTricksPlayed ?? context.playRound ?? this.round;

    // we only check for hi/lo signals on rounds 1 & 2
    // if we led this round and partner just discarded, check for a signal
    if (
      roundLead === playerPos &&
      currPlayer === partnerPos &&
      card !== topCard &&
      card.suit === cardLed.suit
    ) {
      // is this a signal?
      if (this.partnerSuitPreference[suitLed] === 0) {
        // check if partner played high (above a six)
        // this is the first indication of a suit preference
        if (card.faceValue > 6) {
          this.status?.stream(
            `2PLYSIG0! Partner discarded high with the ${card.faceName}, so consider it a suit preference signal.\n`,
          );
          this.partnerSuitPreference[suitLed] = 1;
          this.suitPreference[suitLed] = 1;
        } else {
          this.status?.stream(
            `2PLYSIG1! Partner discarded low with the ${card.faceName}, so consider it a signal that he dislikes the suit.\n`,
          );
          this.partnerSuitPreference[suitLed] = -1;
          this.suitPreference[suitLed] = -1;
        }
      } else if (
        round >= 1 &&
        (this.partnerSuitPreference[suitLed] === 1 || this.partnerSuitPreference[suitLed] === -1)
      ) {
        // see if we led the previous trick in the same suit, and
        // partner discarded high or low
        const prevTrick = context.gameTrickHistory?.[round - 1];
        const prevCardLed = prevTrick?.cards[playerPos];
        if (
          prevTrick &&
          prevCardLed &&
          prevTrick.lead === playerPos &&
          prevTrick.winner !== partnerPos &&
          prevCardLed.suit === suitLed
        ) {
          // then check partner's discards from last round
          const prevCard = prevTrick.cards[partnerPos];
          if (prevCard) {
            const prevCardVal = prevCard.faceValue;
            if (this.partnerSuitPreference[suitLed] === 1 && card.faceValue < prevCardVal) {
              // high-lo
              this.status?.stream(
                `2PLYSIG6! Partner discarded low with the ${card.faceName} after discarding the ${prevCard.faceName} last round, thus marking a high-low suit preference signal.\n`,
              );
              this.partnerSuitPreference[suitLed] = 2;
              this.suitPreference[suitLed] = 2;
            } else if (this.partnerSuitPreference[suitLed] === -1 && card.faceValue > prevCardVal) {
              // lo-high
              this.status?.stream(
                `2PLYSIG8! Partner discarded high with the ${card.faceName} after discarding the ${prevCard.faceName} last round, thus marking a low-high signal for a poor suit.\n`,
              );
              this.partnerSuitPreference[suitLed] = -2;
              this.suitPreference[suitLed] = -2;
            }
          }
        }
      }
    }

    //
    // if this is notrump, record partner's opening lead suit
    //
    if (round === 0 && !isSuit(trumpSuit) && roundLead === partnerPos && currPlayer === partnerPos) {
      this.partnersPrioritySuit = cardLed.suit;
    }

    //
    // check for an unusual discard / suit preference signal
    // rules:
    // ------
    // 1. partner must not have led
    // 2. partner must have discarded in a side suit (not trumps)
    // 3. this must be his first play of a card in this suit,
    // 3. the discarded card face value must be greater than a six
    // 4. this must be no later than the 4th round
    //
    const partnerSuit = card.suit;
    const guessedPartner = isPosition(partnerPos) ? this.guessedHands[partnerPos] : undefined;
    if (
      roundLead !== partnerPos &&
      currPlayer === partnerPos &&
      partnerSuit !== cardLed.suit &&
      guessedPartner &&
      guessedPartner.getSuit(partnerSuit).numPlayedCards === 0 &&
      partnerSuit !== trumpSuit &&
      card.faceValue > 6 &&
      round <= 6
    ) {
      // this is a suit preference signal
      this.status?.stream(
        `2PLYSIG20! Partner discarded high in the ${Card.suitToSingularString(card.suit)} suit, indicating a preference for that suit.\n`,
      );
      this.partnerSuitPreference[card.suit] = 1;
      this.suitPreference[card.suit] = 1;
    }
  }

  //
  // RecordCardUndo()
  //
  override recordCardUndo(pos: Position, card: Card): void {
    super.recordCardUndo(pos, card);
  }

  //
  // RecordTrickUndo()
  //
  override recordTrickUndo(): void {
    super.recordTrickUndo();
  }

  //
  // RecordRoundComplete()
  //
  override recordRoundComplete(pos: Position, card: Card): void {
    super.recordRoundComplete(pos, card);
  }

  //
  // RestartPlay()
  //
  override restartPlay(): void {
    super.restartPlay();
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // Utilities
  //
  /////////////////////////////////////////////////////////////////////////////

  //
  // IsPartnerVoidInSuit()
  //
  isPartnerVoidInSuit(suit: Suit): boolean {
    if (!isPosition(this.partnerPosition)) return false;
    const partnersHand = this.guessedHands[this.partnerPosition];
    if (!partnersHand) return false;
    return partnersHand.isSuitShownOut(suit);
  }

  //
  // GetNumClaimableTricks()
  //
  override getNumClaimableTricks(context: PlayRoundContext = {}): number {
    if (!this.hand) return 0;
    let numWinners = 0;

    // special handling for suit contracts
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    if (isSuit(trumpSuit)) {
      // first check trumps
      const trumpHoldings = this.hand.getSuit(trumpSuit);
      numWinners = trumpHoldings.numWinners;
      // add the winners in the other suits only if we hold all winners in trumps
      // and at least as many as the outstanding trumps
      const numOutstandingTrumps = this.getNumOutstandingCards(trumpSuit);
      if (numWinners >= trumpHoldings.length && numWinners >= numOutstandingTrumps) {
        for (let i = 0; i < 4; i++) {
          if (i !== trumpSuit) {
            numWinners += this.hand.getSuit(i as Suit).numWinners;
          }
        }
      }
    } else {
      // NT contract is straightforward
      numWinners = this.hand.numWinners;
    }

    return numWinners;
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // Analysis routines
  //
  /////////////////////////////////////////////////////////////////////////////

  //
  // AssessPosition()
  //
  override assessPosition(context: PlayRoundContext = {}): void {
    super.assessPosition(context);
  }

  //
  // GetLeadCard()
  //
  // - returns a card to lead
  //
  override getLeadCard(context: PlayRoundContext = {}): Card | null {
    if (!this.hand) return null;

    const round = context.playRound ?? this.round;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const contract = context.contract ?? this.contract;
    const contractLevel = context.contractLevel ?? bidLevel(contract);
    let leadCard: Card | null = null;
    const playerPos = this.position;
    const partnerPos = this.partnerPosition;
    let partnersSuit: Suit | typeof NONE = NONE;
    const declarerPos = context.declarerPosition ?? (this.lhDefender ? this.rightOpponent?.position : this.leftOpponent?.position) ?? Position.Unknown;
    const dummyHand = context.dummyHand ?? null;

    // see if this is the first round
    if (round === 0) {
      // this is the opening lead
      this.status?.stream(
        `2PLYLEAD! Making opening lead as ${positionToString(playerPos)} against a contract of ${contractToFullString(contract, 0)}.\n`,
      );
      // review partner's bidding history
      partnersSuit = this.reviewBiddingHistory(context.partnerBids);

      // special code -- see if we can beat a slam contract in our hand
      if (contractLevel === 7) {
        // do we have an Ace?
        if (this.hand.numAces >= 1) {
          let suit: Suit = Suit.Clubs;
          for (let s = Suit.Clubs; s <= Suit.Spades; s++) {
            if (this.hand.getSuit(s as Suit).hasAce()) {
              suit = s as Suit;
              break;
            }
          }
          leadCard = this.hand.getSuit(suit).topCard;
          if (leadCard) {
            this.status?.stream(
              `PLYLDS1! We can ${isSuit(trumpSuit) ? 'most likely' : ''}defeat the contract by playing the ${leadCard.name} here, so lead it now.\n`,
            );
            return leadCard;
          }
        }
      } else if (contractLevel === 6) {
        // do we have two Aces?
        if (this.hand.numAces >= 2) {
          // lead Aces from the shortest suit first
          let suit: Suit = Suit.Clubs;
          let index = 3;
          while (index >= 0) {
            suit = this.hand.getSuitsByLength(index);
            if (this.hand.getSuit(suit).hasAce()) break;
            index--;
          }
          leadCard = this.hand.getSuit(suit).topCard;
          if (leadCard) {
            this.status?.stream(
              `PLYLDS2! We can ${isSuit(trumpSuit) ? 'most likely' : ''}defeat the contract by playing two Aces, so lead them starting with the shortest suit -- lead the ${leadCard.name} first.\n`,
            );
            return leadCard;
          }
        }
        // else see if we have an Ace-King combo
        let suit: Suit = Suit.Clubs;
        let index = 3;
        while (index >= 0) {
          suit = this.hand.getSuitsByLength(index);
          if (this.hand.getSuit(suit).hasAce() && this.hand.getSuit(suit).hasKing()) break;
          index--;
        }
        if (index >= 0) {
          leadCard = this.hand.getSuit(suit).topCard;
          if (leadCard) {
            this.status?.stream(
              `PLYLDS3! We ${isSuit(trumpSuit) ? 'can' : 'may be able to'} defeat the contract by playing two Aces, so lead them starting with the shortest suit -- lead the ${leadCard.name} first.\n`,
            );
            return leadCard;
          }
        }
      }

      // see if we're playing in a suit contract
      if (isSuit(trumpSuit)) {
        // leading in the first round against a suit contract
        // either lead from a singleton, from partner's suit, from a sequence,
        // an Ace, a trump, or simply 4th best

        // see if we have a singleton and some trumps
        if (this.hand.numSingletons >= 1 && this.hand.getNumCardsInSuit(trumpSuit) > 0) {
          // but don't lead the trump suit, or a singleton honor
          for (let i = 0; i < 4; i++) {
            const suit = this.hand.getSuit(i as Suit);
            if (suit.length === 1 && (suit.at(0)?.faceValue ?? 0) < JACK && i !== trumpSuit) {
              leadCard = suit.at(0) ?? null;
              if (leadCard) {
                this.status?.stream(`PLYLD4! Lead the singleton ${leadCard.name}.\n`);
                return leadCard;
              }
            }
          }
        }

        // see if we can lead partner's suit
        if (isSuit(partnersSuit)) {
          const suitObj = this.hand.getSuit(partnersSuit);
          if (suitObj.length >= 3) {
            // lead LOW with 3+ cards
            leadCard = suitObj.bottomCard;
            if (leadCard) {
              this.status?.stream(
                `PLYLD4! Lead the bottom card of partner's ${Card.suitToSingularString(partnersSuit)} suit (the ${leadCard.faceName}.\n`,
              );
              return leadCard;
            }
          } else if (suitObj.length > 0) {
            leadCard = suitObj.at(0) ?? null;
            if (leadCard) {
              this.status?.stream(
                `PLYLD4! Lead the top card of partner's ${Card.suitToSingularString(partnersSuit)} suit (the ${leadCard.faceName}.\n`,
              );
              return leadCard;
            }
          }
        }

        // else can't lead partner's suit, so check each of our suits
        for (let i = 0; i < 4; i++) {
          const s = this.hand.getSuitsByPreference(i);
          if (s === trumpSuit) continue; // but don't lead a trump
          const suit = this.hand.getSuit(s);
          if (suit.length === 0) continue;
          const seq = suit.topSequence;
          if (seq && seq.length > 1) {
            // we have a sequence in our favorite suit, so lead from the top
            leadCard = seq.at(0) ?? null;
            if (leadCard) {
              this.status?.stream(
                `PLYLD15! Lead the ${leadCard.name} from the top of the { ${seq.holdingsString}} sequence.\n`,
              );
              return leadCard;
            }
          }
        }

        // lead out an ace if available
        if (this.hand.numAces > 0) {
          // but not the trump ace
          for (let i = 0; i < 4; i++) {
            const suit = this.hand.getSuit(i as Suit);
            if (suit.hasAce() && i !== trumpSuit) {
              leadCard = suit.at(0) ?? null;
              if (leadCard) {
                this.status?.stream(`PLYLD18! Lead the ${leadCard.name} to grab a quick trick.\n`);
                return leadCard;
              }
            }
          }
        }

        // here, no other lead was found, so simply lead 4th best
        return this.get4thBestLeadCard(context);
      } else {
        // else here we're playing in a notrump contract
        // lead the top card from a 3-card honor sequence, or
        // otherwise 4th card of the best suit
        const s = this.hand.getSuitsByPreference(0);
        const suit = this.hand.getSuit(s);
        const seq = suit.topSequence;
        if (seq && seq.length >= 3 && isHonor(seq.at(0)?.faceValue ?? 0)) {
          // we have a 3-card honor sequence in our favorite suit, so lead from the top
          leadCard = seq.at(0) ?? null;
          this.prioritySuit = s;
          if (leadCard) {
            this.status?.stream(
              `PLYLD22! Lead the ${leadCard.name} from the top of the ${seq.length}-card sequence {${seq.holdingsString}}.\n`,
            );
          }
        } else {
          // lead fourth-best from this suit OR our longest suit
          const fourthCard = this.get4thBestLeadCard(context);
          if (fourthCard) {
            this.prioritySuit = fourthCard.suit;
            return fourthCard;
          }
        }
      }
    } else {
      //
      // playing in the second or later round
      //
      const tricksWonByTeam = context.numTricksWonByTeam ?? context.numTricksWonByDefenders ?? 0;
      if (round === 1 && contractLevel === 6 && this.hand.numWinners > 0 && tricksWonByTeam === 1) {
        // lead an Ace if we have one
        if (this.hand.numAces >= 1) {
          let suit: Suit = Suit.Clubs;
          let index = 3;
          while (index >= 0) {
            suit = this.hand.getSuitsByLength(index);
            if (this.hand.getSuit(suit).hasAce()) break;
            index--;
          }
          leadCard = this.hand.getSuit(suit).topCard;
          if (leadCard) {
            if (isSuit(trumpSuit)) {
              this.status?.stream(`PLYLDS6a! Try to defeat the contract now by playing the ${leadCard.name}.\n`);
            } else {
              this.status?.stream(`PLYLDS6b! Try to defeat the contract now by playing the ${leadCard.name}.\n`);
            }
            return leadCard;
          }
        }
        // else play a king
        if (this.hand.numKings >= 1) {
          let suit: Suit = Suit.Clubs;
          let index = 3;
          while (index >= 0) {
            suit = this.hand.getSuitsByLength(index);
            if (this.hand.getSuit(suit).hasKing()) break;
            index--;
          }
          leadCard = this.hand.getSuit(suit).topCard;
          if (leadCard) {
            if (isSuit(trumpSuit)) {
              this.status?.stream(`PLYLDS6a! Try to defeat the contract now by playing the ${leadCard.name}.\n`);
            } else {
              this.status?.stream(`PLYLDS6b! Defeat the contract now by playing the ${leadCard.name}.\n`);
            }
            return leadCard;
          }
        }
      }

      // if we're leading in the second or later round after winning
      // the prior round which partner led, return partner's suit
      const prevTrick = context.gameTrickHistory?.[round - 1];
      const partnersLastCard = prevTrick?.cards[partnerPos];
      if (
        prevTrick &&
        partnersLastCard &&
        prevTrick.winner === playerPos &&
        prevTrick.lead === partnerPos &&
        this.hand.getNumCardsInSuit(partnersLastCard.suit) > 0
      ) {
        const s = partnersLastCard.suit;
        let dummyCanTrump = false;
        if (
          isSuit(trumpSuit) &&
          dummyHand &&
          dummyHand.getNumCardsInSuit(s) === 0 &&
          dummyHand.getNumCardsInSuit(trumpSuit) > 0
        ) {
          this.status?.stream(
            `3PLYLDRT1! We'd like to return partner's ${Card.suitToString(s)} suit, but dummy might ruff.\n`,
          );
          dummyCanTrump = true;
        }

        // also don't bother returning the suit if this is a suit contract
        // and dummy has the top cards outstanding
        const outstandingCards = new CardList();
        const numOutstandingCards = this.getOutstandingCardsList(s, outstandingCards);
        if (
          isSuit(trumpSuit) &&
          dummyHand &&
          dummyHand.getNumCardsInSuit(s) > 0 &&
          numOutstandingCards > 0 &&
          dummyHand.getSuit(s).topCardVal > (outstandingCards.at(0)?.faceValue ?? 0)
        ) {
          this.status?.stream(
            `3PLYLDRT2! We'd like to return partner's ${Card.suitToString(s)} suit, but dummy will most likely win.\n`,
          );
          dummyCanTrump = true;
        }

        // also see if declarer might trump
        let declarerCanTrump = false;
        if (
          isSuit(trumpSuit) &&
          this.getNumOutstandingCards(trumpSuit) > 0 &&
          this.isPartnerVoidInSuit(trumpSuit) &&
          dummyHand &&
          dummyHand.getNumCardsInSuit(trumpSuit) === 0
        ) {
          this.status?.stream(
            `3PLYLDRT4! We'd like to return partner's ${Card.suitToString(s)} suit, but declarer might ruff.\n`,
          );
          declarerCanTrump = true;
        }

        // return a winner in this suit if we have one; else return a low card
        const suit = this.hand.getSuit(s);
        if (suit.length > 0 && !dummyCanTrump && !declarerCanTrump) {
          this.prioritySuit = s;
          leadCard = suit.numWinners > 0 ? (suit.topSequence?.bottomCard ?? suit.topCard) : suit.bottomCard;
          if (leadCard) {
            this.status?.stream(
              `PLYLDRT8! Return partner's ${Card.suitToSingularString(s)} suit with the ${leadCard.faceName}.\n`,
            );
            return leadCard;
          }
        }
      }

      // see if we're playing in a suit contract
      if (isSuit(trumpSuit)) {
        // check if partner has shown out of a suit
        const partnerVoidSuits: Suit[] = [];
        for (let i = 0; i < 4; i++) {
          if (this.isPartnerVoidInSuit(i as Suit) && i !== trumpSuit) {
            partnerVoidSuits.push(i as Suit);
          }
        }

        // see if there are trumps outstanding, partner has not shown out
        // of trumps, and _has_ shown out of a suit, _and_ we have no
        // winners in that suit (whew!)
        const numOutstandingTrumps = this.getNumOutstandingCards(trumpSuit);
        if (
          numOutstandingTrumps > 0 &&
          !this.isPartnerVoidInSuit(trumpSuit) &&
          partnerVoidSuits.length > 0
        ) {
          for (const voidSuit of partnerVoidSuits) {
            const suit = this.hand.getSuit(voidSuit);
            if (suit.length > 0 && suit.numWinners === 0) {
              leadCard = suit.bottomCard;
              if (leadCard) {
                this.status?.stream(
                  `PLYLD32! Partner is void in ${Card.suitToString(voidSuit)} and may still have some trumps, so lead the ${leadCard.name}.\n`,
                );
                return leadCard;
              }
            }
          }
        }

        // here, we had no luck in finding a suit for partner to ruff, so
        // see if he expressed a suit preference
        leadCard = this.findLeadCardFromPartnerPreference(context);
        if (leadCard) return leadCard;

        // no luck in finding suit for partner, so pick our own suit to lead
        // if all trumps have been accounted for, cash winners
        // but not if it's a trump winner -- save it for later
        leadCard = this.cashWinners(context);
        if (leadCard && leadCard.suit !== trumpSuit) return leadCard;

        // else we've got nothing to lead, so try to lead something safe
        // check each suit
        for (let j = 0; j < 4; j++) {
          if (j === trumpSuit) continue;
          const suit = this.hand.getSuit(j as Suit);
          if (suit.length === 0) continue;
          const declarerGuessed = isPosition(declarerPos) ? this.guessedHands[declarerPos] : undefined;
          const declarerShownOut = declarerGuessed ? declarerGuessed.getSuit(j as Suit).isSuitShownOut : false;
          const dummySuitCount = dummyHand ? dummyHand.getSuit(j as Suit).length : 0;
          const numOutstandingCards = this.getNumOutstandingCards(j as Suit);
          if (!declarerShownOut && dummySuitCount > 0 && numOutstandingCards >= 1) {
            leadCard = suit.bottomCard;
            if (leadCard) {
              this.status?.stream(
                `PLYLD42! With no good card to lead, lead the ${leadCard.name} since the opponents have not shown out of the ${Card.suitToSingularString(leadCard.suit)} suit.\n`,
              );
              return leadCard;
            }
          }
        }

        // else lead a suit that dummy won't ruff
        for (let j = 0; j < 4; j++) {
          const suit = this.hand.getSuit(j as Suit);
          if (suit.length === 0) continue;
          const dummySuitCount = dummyHand ? dummyHand.getSuit(j as Suit).length : 0;
          const numOutstandingCards = this.getNumOutstandingCards(j as Suit);
          if (dummySuitCount > 0 && numOutstandingCards >= 1) {
            leadCard = suit.bottomCard;
            if (leadCard) {
              this.status?.stream(
                `PLYLD43! With no good card to lead, lead the ${leadCard.name} since dummy is not void in the ${Card.suitToSingularString(leadCard.suit)} suit (we don't know about declarer, though).\n`,
              );
              return leadCard;
            }
          }
        }
      } else {
        // playing in notrump
        // see if partner has expressed a suit preference and has not shown out
        // of that suit
        leadCard = this.findLeadCardFromPartnerPreference(context);
        if (!isSuit(this.prioritySuit) && leadCard && !this.isPartnerVoidInSuit(leadCard.suit)) {
          const partnerSuit = leadCard.suit;
          if (this.hand.getSuitStrength(partnerSuit) >= SuitStrength.GoodSupport) {
            this.prioritySuit = partnerSuit;
          }
          return leadCard;
        }

        // see if we're currently trying to develop a suit
        if (isSuit(this.prioritySuit)) {
          if (this.hand.getSuit(this.prioritySuit).length <= 1) {
            this.status?.stream(
              `4PLYLD50! With ${this.hand.getSuit(this.prioritySuit).length === 1 ? 'only one card' : 'no cards'} left in ${Card.suitToString(this.prioritySuit)}, there's no point in continuing to try and develop the suit.\n`,
            );
            this.prioritySuit = NONE;
          }

          if (isSuit(this.prioritySuit) && isPosition(this.partnerPosition) && isPosition(this.position)) {
            const partnerShownOut = this.guessedHands[this.partnerPosition]?.isSuitShownOut(this.prioritySuit) ?? false;
            const lhoShownOut = this.guessedHands[getNextPlayer(this.position)]?.isSuitShownOut(this.prioritySuit) ?? false;
            const rhoShownOut = this.guessedHands[getPrevPlayer(this.position)]?.isSuitShownOut(this.prioritySuit) ?? false;
            if (
              (partnerShownOut && lhoShownOut && !rhoShownOut) ||
              (partnerShownOut && !lhoShownOut && rhoShownOut)
            ) {
              this.status?.stream(
                `4PLYLD50! Since both partner and ${lhoShownOut ? 'LHO' : 'RHO'} have shown out, there is no point in trying to keep developing the ${Card.suitToSingularString(this.prioritySuit)} suit, as we'll only provide entries for the oponents.\n`,
              );
              this.prioritySuit = NONE;
            }
          }
        }

        // if we're still trying to develop or work a suit, keep playing the suit
        let s: Suit | typeof NONE = NONE;
        if (isSuit(this.prioritySuit)) {
          s = this.prioritySuit;
        } else if (isSuit(this.partnersPrioritySuit) && this.hand.getSuit(this.partnersPrioritySuit).length >= 1) {
          s = this.partnersPrioritySuit;
        }
        if (isSuit(s)) {
          const suit = this.hand.getSuit(s);
          leadCard = suit.at(0) ?? null;
          if (leadCard) {
            this.status?.stream(
              `PLYLD76! Continue developing ${s === this.prioritySuit ? 'our ' : "partner's "}${Card.suitToSingularString(s)} suit by playing the ${leadCard.name}.\n`,
            );
            if (suit.length === 1) {
              if (s === this.prioritySuit) this.prioritySuit = NONE;
              else if (s === this.partnersPrioritySuit) this.partnersPrioritySuit = NONE;
            }
            return leadCard;
          }
        }

        // if we have no suit we're trying to develop yet, but have a good suit
        // with an honor sequence, lead the top card of the sequence
        const prefSuit = this.hand.preferredSuit;
        if (isSuit(prefSuit)) {
          const suit = this.hand.getSuit(prefSuit);
          if (!isSuit(this.prioritySuit) && suit.strength >= SuitStrength.Openable && suit.numHonors >= 2 && round <= 6) {
            this.prioritySuit = prefSuit;
            leadCard = suit.getLowestCardAbove(9);
            if (leadCard) {
              this.status?.stream(
                `PLYLD80! Try to develop our ${Card.suitToSingularString(prefSuit)} suit by playing the ${leadCard.name}.\n`,
              );
              return leadCard;
            }
          }
        }

        // try cashing winners
        leadCard = this.cashWinners(context);
        if (leadCard) {
          this.status?.stream(`PLYLD84! With no other obvious plays, cash a winner with the ${leadCard.name}.\n`);
          return leadCard;
        }
      }
    }

    // if all else fails, give up and call the base class
    if (leadCard === null) {
      leadCard = super.getLeadCard(context);
    }

    return leadCard;
  }

  //
  // ReviewBiddingHistory()
  //
  // - returns a suit partner bid, if any
  //
  reviewBiddingHistory(partnerBids?: readonly number[]): Suit | typeof NONE {
    if (!partnerBids || partnerBids.length === 0) return NONE;

    let topSuit: Suit | typeof NONE = NONE;
    let topSuitVal = 0;
    const maxRounds = Math.min(4, partnerBids.length);
    for (let i = 0; i < maxRounds; i++) {
      const bid = partnerBids[i];
      if (isBid(bid)) {
        const suit = bidSuit(bid);
        if (isSuit(suit)) {
          this.partnerSuitPreference[suit]++;
          this.suitPreference[suit] = this.partnerSuitPreference[suit];
          if (this.partnerSuitPreference[suit] > topSuitVal) {
            topSuit = suit;
            topSuitVal = this.partnerSuitPreference[suit];
          }
        }
      }
    }

    return topSuit;
  }

  //
  // FindLeadCardFromPartnerPreference()
  //
  // - see if partner expressed a suit preference, and if so, see whether
  //   we can lead a card in the suit
  //
  findLeadCardFromPartnerPreference(context: PlayRoundContext = {}): Card | null {
    if (!this.hand) return null;

    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const dummyPos = context.dummyPosition ?? Position.Unknown;
    const declarerPos = context.declarerPosition ?? (this.lhDefender ? this.rightOpponent?.position : this.leftOpponent?.position) ?? Position.Unknown;
    const dummyHand = context.dummyHand ?? null;
    let leadCard: Card | null = null;

    for (let i = 0; i < 4; i++) {
      const s = i as Suit;
      const suit = this.hand.getSuit(s);
      if (this.partnerSuitPreference[i] > 0 && suit.length > 0 && !this.isPartnerVoidInSuit(s)) {
        if (isSuit(trumpSuit)) {
          // don't bother if dummy is void in the suit and has trumps
          const guessedDummy = isPosition(dummyPos) ? this.guessedHands[dummyPos] : undefined;
          if (
            guessedDummy &&
            guessedDummy.isSuitShownOut(s) &&
            guessedDummy.getSuit(trumpSuit).numRemainingCards > 0
          ) {
            this.status?.stream(
              `3PLYLDPRF1! Partner likes the ${Card.suitToSingularString(s)} suit, but dummy can ruff, so skip this suit for now.\n`,
            );
            continue;
          }

          // see if we think declarer has trumps in the suit
          const guessedDeclarer = isPosition(declarerPos) ? this.guessedHands[declarerPos] : undefined;
          if (
            guessedDeclarer &&
            guessedDeclarer.isSuitShownOut(s) &&
            (guessedDeclarer.getSuit(trumpSuit).numRemainingCards > 0 ||
              this.getNumOutstandingCards(trumpSuit) > 0)
          ) {
            this.status?.stream(
              `3PLYLDPRF2! Partner likes the ${Card.suitToSingularString(s)} suit, but declarer has shown out of the suit and _may_ be able to ruff, so avoid leading the suit if possible.\n`,
            );
            continue;
          }

          // else we can lead the suit
          // play a winner if we have one, else lead low
          leadCard = suit.numWinners > 0 ? (suit.at(0) ?? null) : suit.bottomCard;
          if (leadCard) {
            this.status?.stream(
              `PLYLDPRF4! Partner has indicated a preference for the ${Card.suitToString(s)} suit, so lead the ${leadCard.name}.\n`,
            );
            return leadCard;
          }
        } else {
          // notrump contract
          // see if dummy holds the top two cards in the suit
          const outstandingCards = new CardList();
          let numOutstandingCards = this.getOutstandingCardsList(s, outstandingCards);
          if (numOutstandingCards === 0 && this.guessedHands.length > 0) continue;

          // add our own cards to the list of cards to consider
          const ownCards = this.hand.getSuit(s);
          for (let j = 0; j < ownCards.length; j++) {
            const c = ownCards.at(j);
            if (c) {
              outstandingCards.add(c);
              numOutstandingCards++;
            }
          }

          const dummySuit = dummyHand?.getSuit(s);
          if (
            dummySuit &&
            dummySuit.length >= 2 &&
            outstandingCards.length >= 2 &&
            (dummySuit.at(0)?.faceValue ?? 0) > (outstandingCards.at(0)?.faceValue ?? 0) &&
            (dummySuit.at(1)?.faceValue ?? 0) > (outstandingCards.at(1)?.faceValue ?? 0)
          ) {
            this.status?.stream(
              `3PLYLDPRF12! Partner likes the ${Card.suitToSingularString(s)} suit, but dummy holds the top two cards in the suit, so prefer to skip it.\n`,
            );
            continue;
          }

          // play a winner if we have one in the suit, else lead low
          leadCard = suit.numWinners > 0 ? (suit.at(0) ?? null) : suit.bottomCard;
          if (leadCard) {
            this.status?.stream(
              `PLYLDPRF8! Partner has indicated a preference for the ${Card.suitToString(s)} suit, so lead the ${leadCard.name}.\n`,
            );
            return leadCard;
          }
        }
      }
    }

    return null;
  }

  //
  // Get4thBestLeadCard()
  //
  get4thBestLeadCard(context: PlayRoundContext = {}): Card | null {
    if (!this.hand) return null;

    const suit = this.hand.getSuit(this.hand.getSuitsByPreference(0));
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    let leadCard: Card | null = null;

    // see if we have 4+ cards in our best suit
    if (suit.length >= 4) {
      // make sure this is not the trump suit
      if (suit.suit !== trumpSuit) {
        leadCard = suit.at(3) ?? null;
        if (leadCard) {
          this.status?.stream(
            `PLYLD4A! Lead the fourth card from our best suit (${Card.suitToString(suit.suit)}) -- play the ${leadCard.name}.\n`,
          );
        }
      } else {
        // hmm, our best suit is the trump suit -- see if we have another 4-card suit
        const otherSuit = this.hand.getSuitsByPreference(1);
        if (this.hand.getNumCardsInSuit(otherSuit) >= 4) {
          leadCard = this.hand.getSuit(otherSuit).at(3) ?? null;
          if (leadCard) {
            this.status?.stream(
              `PLYLD4E! We don't want to lead from the trump suit, so lead the 4th best from the ${Card.suitToSingularString(otherSuit)} suit -- the ${leadCard.name}.\n`,
            );
          }
        } else {
          // no choice but to lead from the trump suit
          leadCard = suit.at(3) ?? null;
          if (leadCard) {
            this.status?.stream(
              `PLYLD4G! We have no 4-card suits other than the trump suit, so lead the 4th best trump -- the ${leadCard.name}.\n`,
            );
          }
        }
      }
    } else {
      // lead 4th best of our longest suit
      const longSuitId = this.hand.getLongestSuit();
      const longSuit = this.hand.getSuit(longSuitId);
      leadCard = longSuit.at(3) ?? longSuit.bottomCard;
      if (leadCard) {
        this.status?.stream(
          `PLYLD4N! Lead the fourth card from our longest suit (${Card.suitToString(longSuitId)}) -- play the ${leadCard.name}.\n`,
        );
      }
    }

    return leadCard;
  }

  // Backward-compatible alias
  getFourthBestLeadCard(context: PlayRoundContext = {}): Card | null {
    return this.get4thBestLeadCard(context);
  }

  //
  // CashWinners()
  //
  // - lead a winner card if we have one
  // - called _after_ the first round
  //
  cashWinners(context: PlayRoundContext = {}): Card | null {
    if (!this.hand) return null;

    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const dummyHand = context.dummyHand ?? null;
    const declarerPos = context.declarerPosition ?? (this.lhDefender ? this.rightOpponent?.position : this.leftOpponent?.position) ?? Position.Unknown;

    // check to see if we even have any winners
    if (this.hand.numWinners === 0) return null;

    // OK, we do have some winners -- check if we can cash winners
    const suitIsSafe: boolean[] = [true, true, true, true];
    if (isSuit(trumpSuit)) {
      for (let i = 0; i < 4; i++) {
        if (this.hand.getSuit(i as Suit).numTopCards === 0 || i === trumpSuit) continue;

        if (dummyHand && dummyHand.isSuitVoid(i as Suit) && dummyHand.getNumCardsInSuit(trumpSuit) > 0) {
          this.status?.stream(
            `3PLYLDWN2! We'd like to lead the ${Card.suitToString(i)} suit, but dummy might ruff.\n`,
          );
          suitIsSafe[i] = false;
          continue;
        }

        if (
          this.getNumOutstandingCards(trumpSuit) > 0 &&
          this.isPartnerVoidInSuit(trumpSuit) &&
          isPosition(declarerPos) &&
          this.guessedHands[declarerPos]?.isSuitShownOut(i as Suit)
        ) {
          this.status?.stream(
            `3PLYLDWN4! We'd like to lead the ${Card.suitToString(i)} suit, but declarer might ruff.\n`,
          );
          suitIsSafe[i] = false;
        }
      }
    }

    // here, we've determined which suits are safe to cash, so play the winners
    let s: Suit = isSuit(trumpSuit) ? getNextSuit(trumpSuit) : Suit.Clubs;
    let found = false;
    for (let i = 0; i < 4; i++) {
      // Note: C++ checks bSuitIsSafe[i] in original loop; we match suit safety accurately
      if (suitIsSafe[s] && this.hand.getSuit(s).numTopCards > 0) {
        found = true;
        break;
      }
      s = getNextSuit(s);
    }

    if (!found) return null;

    // new code -- don't cash trump winners
    if (s === trumpSuit) return null;

    const suit = this.hand.getSuit(s);
    const leadCard = suit.topSequence?.bottomCard ?? suit.topCard;
    if (leadCard) {
      this.status?.stream(
        `PLCSW9! With no other good options, cash a winner in the ${Card.suitToSingularString(s)} suit, the ${leadCard.faceName}\n`,
      );
    }
    return leadCard;
  }

  //
  // GetDiscard()
  //
  override getDiscard(context: PlayRoundContext = {}): Card | null {
    if (!this.hand) return null;

    let discard: Card | null = null;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const cardLed = context.leadCard ?? this.leadCard;
    const suitLed = cardLed?.suit ?? this.leadSuit;
    const hand = this.hand;
    const suit = isSuit(suitLed) ? hand.getSuit(suitLed) : null;
    const roundLead = context.roundLead ?? this.roundLead;
    const round = context.playRound ?? this.round;

    // try to use hi-lo signalling if playing third
    // i.e., indicate whether we like partner's lead
    if (
      isSuit(suitLed) &&
      suit &&
      roundLead === this.partnerPosition &&
      suitLed !== trumpSuit &&
      suit.length > 0 &&
      this.suitSignalStatus[suitLed] <= 1
    ) {
      if (this.suitSignalStatus[suitLed] === 0) {
        let suitPreferred = false;
        // a suit is good if it has a high honor (K+) with 3+ cards
        if (suit.length >= 3 && (suit.at(0)?.faceValue ?? 0) >= KING) {
          this.status?.stream(
            `PLDIS2! Since we can win the next round of ${Card.suitToString(suitLed)}, we want to signal by discarding high in the suit.\n`,
          );
          suitPreferred = true;
        }

        if (suitPreferred) {
          discard = this.getHighDiscard(suit);
          if (discard && suit.length >= 2) {
            this.status?.stream(`PLDIS8! Begin the high-low signal with the ${discard.faceName}.\n`);
          }
          this.signalledSuit = suitLed;
        } else {
          discard = suit.bottomCard;
          if (discard) {
            this.status?.stream(
              `3PLDIS12! We do not have a winner in the ${Card.suitToSingularString(suitLed)} suit, so discard low with the ${discard.faceName}.\n`,
            );
          }
        }
        this.suitSignalStatus[suitLed] = 1;
      } else {
        if (suitLed === this.signalledSuit && this.suitSignalStatus[suitLed] === 1 && suit.length >= 1) {
          discard = suit.bottomCard;
          if (discard) {
            this.status?.stream(
              `PLDIS16! Complete the hi-lo signal by discarding the ${discard.faceName}.\n`,
            );
          }
          this.suitSignalStatus[suitLed] = 2;
        }
      }

      if (discard) return discard;
    }

    // if the opponents lead a suit for the first time & we're following suit,
    // use distribution echo to signal odd/even number of cards in the suit
    if (isSuit(suitLed) && suit) {
      const origCards = hand.initialHand;
      const numOrigSuitCards = origCards.getCardsOfSuit(suitLed);
      const numCards = suit.length;
      const ledByOpponent =
        roundLead === this.leftOpponent?.position || roundLead === this.rightOpponent?.position;
      if (
        ledByOpponent &&
        numOrigSuitCards >= 2 &&
        numCards > numOrigSuitCards - 2 &&
        !this.suitLed[suitLed]
      ) {
        const evenCount = numOrigSuitCards % 2 === 0;
        const highCard = this.getHighDiscard(suit);
        const lowCard = suit.at(numCards - 1) ?? null;

        if (this.echoedSuit === NONE && !this.suitEchoed[suitLed]) {
          // start the echo
          if (evenCount) {
            if (suitLed !== trumpSuit) {
              discard = highCard;
              if (discard) {
                this.status?.stream(
                  `PLDIS20! The opponents are attacking the ${Card.suitToString(suitLed)}; start the hi/lo echo with the ${discard.faceName} to tell partner we have an even number of cards in the suit.\n`,
                );
              }
            } else {
              discard = lowCard;
              if (discard) {
                this.status?.stream(
                  `PLDIS21! The opponents are pulling trumps, so start a lo/hi echo with the ${discard.faceName} to tell partner we have an even number of trumps.\n`,
                );
              }
            }
          } else {
            if (suitLed !== trumpSuit) {
              discard = lowCard;
              if (discard) {
                this.status?.stream(
                  `PLDIS22! The opponents are attacking the ${Card.suitToString(suitLed)}; start the lo/hi echo with the ${discard.faceName} to tell partner we have an odd number of cards in the suit.\n`,
                );
              }
            } else {
              discard = highCard;
              if (discard) {
                this.status?.stream(
                  `PLDIS23! The opponents are pulling trumps, so start a hi/lo echo with the ${discard.faceName} to tell partner we have an odd number of trumps.\n`,
                );
              }
            }
          }
          this.echoedSuit = suitLed;
          this.suitEchoed[suitLed] = true;
        } else if (suitLed === this.echoedSuit) {
          if (evenCount) {
            if (suitLed !== trumpSuit) {
              discard = lowCard;
              if (discard) {
                this.status?.stream(
                  `PLDIS25! Complete the hi/lo distributional echo with the ${discard.faceName}.\n`,
                );
              }
            } else {
              discard = highCard;
              if (discard) {
                this.status?.stream(
                  `PLDIS26! Complete the lo/hi distributional echo with the ${discard.faceName}.\n`,
                );
              }
            }
          } else {
            if (suitLed !== trumpSuit) {
              discard = highCard;
              if (discard) {
                this.status?.stream(
                  `PLDIS27! Complete the lo/hi distributional echo with the ${discard.faceName}.\n`,
                );
              }
            } else {
              discard = lowCard;
              if (discard) {
                this.status?.stream(
                  `PLDIS28! Complete the hi/lo distributional echo with the ${discard.faceName}.\n`,
                );
              }
            }
          }
          this.echoedSuit = NONE;
        } else {
          this.echoedSuit = NONE;
        }

        if (discard) return discard;
      }
    }

    // if we can't follow suit and are not trumping, indicate suit preference
    // with an "unusual discard" (but only in the first 7 tricks)
    if (
      isSuit(suitLed) &&
      hand.getNumCardsInSuit(suitLed) === 0 &&
      (!isSuit(trumpSuit) || hand.getNumCardsInSuit(trumpSuit) === 0) &&
      round <= 6
    ) {
      const prefSuitId = hand.preferredSuit;
      if (isSuit(prefSuitId)) {
        const prefSuit = hand.getSuit(prefSuitId);
        if (prefSuit.numWinners > 0) {
          if (prefSuit.numSequences > 1) {
            const secondSeq = prefSuit.secondSequence;
            if (secondSeq && (secondSeq.topCard?.faceValue ?? 0) > 6) {
              discard = secondSeq.topCard;
            } else {
              discard = prefSuit.topSequence?.bottomCard ?? prefSuit.bottomCard;
            }
          } else {
            discard = prefSuit.bottomCard;
          }
          if (discard) {
            this.status?.stream(
              `PLDIS40! Indicate a preference for the ${Card.suitToSingularString(prefSuitId)} by discarding high with the ${discard.name}.\n`,
            );
            return discard;
          }
        }
      }
    }

    // else we have no priority discards, so see what we should discard
    let discardSuit: SuitHoldings | null = null;

    // see if we have cards in the suit led
    if (suit && suit.length > 0) {
      return suit.bottomCard;
    }

    // here we have no more cards in the suit, so discard from another suit
    // but first see whether we're playing with a trump suit (and have trumps left)
    if (isSuit(trumpSuit) && hand.getNumCardsInSuit(trumpSuit) > 0) {
      // first find the shortest suit with no winners, if there is one
      for (let i = 3; i >= 0; i--) {
        const s = hand.getSuitsByLength(i);
        const testSuit = hand.getSuit(s);
        if (testSuit.hasKing() || (testSuit.hasQueen() && testSuit.length >= 2)) continue;
        if (s !== trumpSuit && testSuit.length > 0 && testSuit.numWinners === 0) {
          discardSuit = testSuit;
          break;
        }
      }

      if (discardSuit === null) {
        for (let i = 3; i >= 0; i--) {
          const s = hand.getSuitsByLength(i);
          if (hand.getNumCardsInSuit(s) > 0 && hand.getSuit(s).numLosers > 0 && s !== trumpSuit) {
            discardSuit = hand.getSuit(s);
            break;
          }
        }
      }

      if (discardSuit === null) {
        if (hand.length === hand.getNumCardsInSuit(trumpSuit)) {
          discardSuit = hand.getSuit(trumpSuit);
        } else {
          for (let i = 3; i >= 0; i--) {
            const s = hand.getSuitsByLength(i);
            if (hand.getNumCardsInSuit(s) > 0 && s !== trumpSuit) {
              discardSuit = hand.getSuit(s);
              break;
            }
          }
        }
      }

      discard = discardSuit?.bottomCard ?? hand.bottomCard;
    } else {
      // playing in a NT contract, OR we're out of trumps
      const suitsByLosers: Suit[] = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          const suit1 = hand.getSuit(suitsByLosers[j]);
          const suit2 = hand.getSuit(suitsByLosers[j + 1]);
          const numWinners1 = suit1.numWinners;
          const numWinners2 = suit2.numWinners;
          const numLosers1 = suit1.numLosers;
          const numLosers2 = suit2.numLosers;

          if (
            (numLosers2 > numLosers1 && numWinners2 <= numWinners1) ||
            (numLosers1 === numLosers2 && numWinners1 > numWinners2) ||
            (numWinners1 > 0 && numWinners2 === 0)
          ) {
            const temp = suitsByLosers[j];
            suitsByLosers[j] = suitsByLosers[j + 1];
            suitsByLosers[j + 1] = temp;
          }
        }
      }

      for (let i = 0; i < 4; i++) {
        const s = suitsByLosers[i];
        if (hand.getNumCardsInSuit(s) === 0) continue;

        const testSuit = hand.getSuit(s);
        const numLosers = testSuit.numLosers;
        if (s === this.prioritySuit || numLosers === 0) continue;

        if (numLosers > 0) {
          discardSuit = testSuit;
          break;
        }
      }

      if (discardSuit === null) {
        discardSuit = hand.getSuit(this.pickFinalDiscardSuit(hand));
      }

      discard = discardSuit.bottomCard ?? hand.bottomCard;
    }

    return discard;
  }

  //
  // GetHighDiscard()
  //
  // select a discard that's high but not too high
  //
  getHighDiscard(suit: SuitHoldings): Card | null {
    let highCard: Card | null = null;
    if (suit.getNumCardsAbove(6) > 1) {
      const numHighCards = suit.getNumCardsAbove(6);
      const numLikelyWinners = suit.numLikelyWinners;
      if (numHighCards > numLikelyWinners) {
        highCard = suit.getLowestCardAbove(6);
      } else {
        highCard = suit.getHighestCardBelow(10) ?? suit.bottomCard;
      }
    } else {
      highCard = suit.getHighestCardBelow(7) ?? suit.bottomCard;
    }
    return highCard;
  }

  //
  // PlayCard()
  //
  // select a card to play
  //
  override playCard(
    ledSuitOrContext: Suit | typeof NONE | PlayRoundContext = {},
    roundContext?: PlayRoundContext,
  ): Card | null {
    const context: PlayRoundContext =
      typeof ledSuitOrContext === 'object' && ledSuitOrContext !== null
        ? ledSuitOrContext
        : (roundContext ?? {});
    this.assessPosition(context);

    if (this.round === 0) {
      if (this.lhDefender) {
        this.status?.stream('2PL02! Starting play as left-hand defender.\n');
        return super.playCard(ledSuitOrContext, roundContext);
      } else {
        this.status?.stream('2PL03! Starting play as right-hand defender.\n');
        return super.playCard(ledSuitOrContext, roundContext);
      }
    }

    return super.playCard(ledSuitOrContext, roundContext);
  }

  //
  // PlayFirst()
  //
  override playFirst(context: PlayRoundContext = {}): Card | null {
    return super.playFirst(context);
  }

  //
  // PlaySecond()
  //
  // - play second hand as defender
  //
  override playSecond(context: PlayRoundContext = {}): Card | null {
    if (!this.hand) return null;

    this.status?.stream('3PLAYDF2! Playing second as defender, using default player logic.\n');

    const declarerPos = context.declarerPosition ?? (this.lhDefender ? this.rightOpponent?.position : this.leftOpponent?.position) ?? Position.Unknown;
    const dummyPos = context.dummyPosition ?? (this.lhDefender ? this.leftOpponent?.position : this.rightOpponent?.position) ?? Position.Unknown;
    const lhoIsDummy = this.leftOpponent?.position === dummyPos || Boolean(this.leftOpponent?.isDummy);
    const cardLed = context.leadCard ?? this.leadCard;
    if (!cardLed) return super.playSecond(context);

    const suitLed = cardLed.suit;
    const currTopCard = context.currentHighCard ?? cardLed;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const suit = this.hand.getSuit(suitLed);
    let card: Card | null = null;

    // determine the top card -- it's either the one led by declarer
    // or dummy's top holding in the suit, if dummy is to our left
    const dummyHand = context.dummyHand ?? null;
    const dummySuit = dummyHand?.getSuit(suitLed) ?? null;
    const numDummySuitCards = dummySuit?.length ?? 0;
    const topCard =
      lhoIsDummy && dummySuit && numDummySuitCards > 0 && (dummySuit.at(0)?.faceValue ?? 0) > cardLed.faceValue
        ? dummySuit.at(0)!
        : cardLed;

    const numCardsInSuitLed = suit.length;
    if (numCardsInSuitLed === 1) {
      card = suit.at(0) ?? null;
      if (card) {
        this.status?.stream(`PLDF2A! Play our only card in the suit, the ${card.faceName}.\n`);
      }
      return card;
    } else if (numCardsInSuitLed >= 2) {
      // playing ahead of dummy, where dummy has no trumps, and partner
      // has no more cards in the suit and we have a winner in our hand
      const partnerSuit = isPosition(this.partnerPosition)
        ? this.guessedHands[this.partnerPosition]?.getSuit(suitLed)
        : undefined;
      if (
        partnerSuit?.isSuitShownOut &&
        lhoIsDummy &&
        (!isSuit(trumpSuit) || (dummyHand && dummyHand.getNumCardsInSuit(trumpSuit) === 0))
      ) {
        if (suit.getNumCardsAbove(topCard) > 0) {
          card = suit.getLowestCardAbove(topCard);
          if (card) {
            if (trumpSuit !== Suit.NoTrump && isSuit(trumpSuit) && dummyHand && dummyHand.getNumCardsInSuit(trumpSuit) === 0) {
              this.status?.stream(
                `PLDF2B! Partner is out of ${Card.suitToString(suitLed)}, and dummy on our left is out of trumps, so we can play high in second position with the ${card.faceName}.\n`,
              );
            } else {
              this.status?.stream(
                `PLDF2B1! Partner is out of ${Card.suitToString(suitLed)}, so play high in second position to win with the ${card.faceName}.\n`,
              );
            }
            return card;
          }
        }
      }

      // if the opponents lead an honor, cover it if possible
      if (cardLed.faceValue >= 10 && (suit.at(0)?.faceValue ?? 0) > cardLed.faceValue) {
        card = suit.topSequence?.bottomCard ?? suit.topCard;
        if (card) {
          this.status?.stream(
            `PLDF2E! ${this.szRHO} led an honor (the ${cardLed.faceName}), so cover it with our ${card.faceName}.\n`,
          );
          return card;
        }
      }

      // play the bottom card of an honor sequence to promote the other honors
      const topSeq = suit.topSequence;
      if (lhoIsDummy && topSeq) {
        if (
          topSeq.length > 1 &&
          isHonor(topSeq.at(0)?.faceValue ?? 0) &&
          (topSeq.at(0)?.faceValue ?? 0) > cardLed.faceValue &&
          (topSeq.at(0)?.faceValue ?? 0) < topCard.faceValue
        ) {
          card = topSeq.bottomCard;
          if (card) {
            this.status?.stream(
              `PLDF2F! Play the ${card.faceName} to force a higher card from dummy and promote the other top cards in our hand.\n`,
            );
            return card;
          }
        }
      }

      // if playing ahead of dummy, and dummy has only a single card in the
      // suit led and we have an Ace (plus other cards), play the Ace now
      if (
        isSuit(trumpSuit) &&
        numCardsInSuitLed > 1 &&
        suit.at(0)?.faceValue === ACE &&
        lhoIsDummy &&
        numDummySuitCards === 1
      ) {
        const declarerHand = isPosition(declarerPos) ? this.guessedHands[declarerPos] : undefined;
        if (
          this.getNumOutstandingCards(trumpSuit) > 0 &&
          ((dummyHand && dummyHand.getNumCardsInSuit(trumpSuit) > 0) ||
            !declarerHand?.isSuitShownOut(trumpSuit))
        ) {
          card = suit.at(0) ?? null;
          if (card) {
            this.status?.stream(
              `PLDF2G1! Since dummy has only a single ${Card.suitToSingularString(suitLed)} left, play our Ace now lest it be trumped later.\n`,
            );
            return card;
          }
        }
      }

      // if there are no more outstanding cards in the suit and we can play high
      const outstandingCards = new CardList();
      const numOutstandingCards = this.getOutstandingCardsList(suitLed, outstandingCards, true);
      if (this.guessedHands.length > 0 && numOutstandingCards === 0 && (suit.at(0)?.faceValue ?? 0) > cardLed.faceValue) {
        card = suit.getLowestCardAbove(cardLed);
        if (card) {
          this.status?.stream(
            `PLDF2G1! Since there are no more outstanding cards in the suit, win with the ${card.faceName}.\n`,
          );
          return card;
        }
      }

      // also if there's one other card outstanding in the suit, and we beat it also
      if (
        numOutstandingCards === 1 &&
        (suit.at(0)?.faceValue ?? 0) > cardLed.faceValue &&
        (suit.at(0)?.faceValue ?? 0) > (outstandingCards.at(0)?.faceValue ?? 0)
      ) {
        card = suit.getLowestCardAbove(outstandingCards.at(0)!);
        if (card) {
          this.status?.stream(
            `PLDF2G1! There's only one more card outstanding card in the suit, so win here with the ${card.faceName}.\n`,
          );
          return card;
        }
      }

      // else no special conditions apply -- just play low
      card = this.getDiscard(context);
      if (card) {
        if (numCardsInSuitLed > 1) {
          if (card.faceValue < currTopCard.faceValue) {
            this.status?.stream(`PLDF2H1! Play second hand low with the ${card.faceName}.\n`);
          } else if (card === suit.bottomCard) {
            this.status?.stream(
              `PLDF2H2! As second hand, play the lowest card we have in the suit, the ${card.faceName}.\n`,
            );
          }
        } else {
          this.status?.stream(
            `PLDF2C4! Play our only ${Card.suitToSingularString(suitLed)}, the ${card.faceName}.\n`,
          );
        }
      }
    } else {
      // else we have no cards in the suit led
      // trump here if possible
      if (isSuit(trumpSuit) && this.hand.getNumCardsInSuit(trumpSuit) > 0) {
        const trumpHoldings = this.hand.getSuit(trumpSuit);
        const partnerSuit = isPosition(this.partnerPosition)
          ? this.guessedHands[this.partnerPosition]?.getSuit(suitLed)
          : undefined;
        const outstandingCards = new CardList();
        this.getOutstandingCardsList(suitLed, outstandingCards);

        let partnerCanWin = false;
        let winningCard: Card | null = null;
        if (partnerSuit?.areAllCardsIdentified) {
          const numTopOutstanding = outstandingCards.getNumCardsAbove(topCard);
          for (let i = 0; i < numTopOutstanding; i++) {
            const c = outstandingCards.at(i);
            if (c && partnerSuit.hasCard(c.deckValue)) {
              partnerCanWin = true;
              winningCard = c;
              break;
            }
          }
        }

        let partnerMayWin = false;
        if (
          partnerSuit &&
          !partnerSuit.areAllCardsIdentified &&
          !partnerSuit.isSuitShownOut &&
          outstandingCards.getNumCardsAbove(topCard) > 0
        ) {
          partnerMayWin = true;
          this.status?.stream(
            `3PLDF2J2! Since there is at least one higher card outstanding in the ${Card.suitToSingularString(suitLed)} suit than the one led (the ${cardLed.faceName}), partner could still have it and win the round.\n`,
          );
        }

        if (partnerCanWin && winningCard) {
          card = this.getDiscard(context);
          if (card) {
            this.status?.stream(
              `PLDF2K1! We could trump here, but we know partner holds the ${winningCard.name} and can win the trick, so discard the ${card.name}.\n`,
            );
          }
        } else {
          if (
            lhoIsDummy &&
            dummyHand &&
            dummyHand.isSuitVoid(suitLed) &&
            dummyHand.getNumCardsInSuit(trumpSuit) > 0
          ) {
            const dummyTopTrump = dummyHand.getSuit(trumpSuit).topCard;
            if (dummyTopTrump && trumpHoldings.getNumCardsAbove(dummyTopTrump.faceValue) > 0) {
              card = trumpHoldings.getLowestCardAbove(dummyTopTrump.faceValue);
              if (card) {
                this.status?.stream(
                  `PL2DFM1! Trump here, making sure to thwart dummy's ${dummyTopTrump.faceName} of trumps by playing the ${card.faceName}.\n`,
                );
              }
            } else {
              card = this.getDiscard(context);
              if (card) {
                this.status?.stream(
                  `PL2DFM2! We'd like to trump here, but Dummy can overruff, so discard the ${card.name}.\n`,
                );
              }
            }
          } else {
            if (trumpHoldings.numTopCards === trumpHoldings.length && partnerMayWin) {
              card = this.getDiscard(context);
              if (card) {
                this.status?.stream(
                  `PL2DFN2! We could ruff here, but there's no point in dropping a top trump now when partner might still win the round, so hold on to the trump and discard the ${card.name}.\n`,
                );
              }
            } else {
              card = trumpHoldings.bottomCard;
              if (card) {
                if (partnerSuit?.isSuitShownOut) {
                  this.status?.stream(
                    `PLDF2N4! Partner is show out, and we won't be overtrumped, so trump here with the ${card.faceName}.\n`,
                  );
                } else {
                  this.status?.stream(
                    `PLDF2N4! We don't think partner will win the round, so trump with the ${card.faceName}.\n`,
                  );
                }
              }
            }
          }
        }
      } else {
        card = this.getDiscard(context);
        if (card) {
          if (isSuit(trumpSuit)) {
            this.status?.stream(
              `PLDF2Y! We have no ${Card.suitToString(suitLed)} and no trumps, so discard the ${card.name}.\n`,
            );
          } else {
            this.status?.stream(
              `PLDF2Ya! We have no ${Card.suitToString(suitLed)}, so discard the ${card.name}.\n`,
            );
          }
        }
      }
    }

    return card;
  }

  //
  // PlayThird()
  //
  override playThird(context: PlayRoundContext = {}): Card | null {
    if (!this.hand) return null;

    const currentCard = context.leadCard ?? this.leadCard;
    if (!currentCard) return super.playThird(context);

    const suitLed = currentCard.suit;
    const dummyPos = context.dummyPosition ?? (this.lhDefender ? this.leftOpponent?.position : this.rightOpponent?.position) ?? Position.Unknown;
    const lhoIsDummy = this.leftOpponent?.position === dummyPos || Boolean(this.leftOpponent?.isDummy);
    let topPos = context.currentHighPos ?? Position.Unknown;
    const currTopCard = context.currentHighCard ?? currentCard;
    const topCardPosStr = positionToString(topPos);
    let partnerHigh = false;
    const currentRound = context.playRound ?? this.round;
    const currentSeat = (context.numCardsPlayedInRound ?? this.numCardsPlayed) + 1;
    const trumpSuit = context.trumpSuit ?? this.trumpSuit;
    const numCardsInSuitLed = this.hand.getNumCardsInSuit(suitLed);
    let card: Card | null = null;

    const partnersCard = context.partnersCard ?? this.partnersCard;
    if (partnersCard && partnersCard === currTopCard) {
      partnerHigh = true;
    }

    let actualTopCard = currTopCard;
    const dummyHand = context.dummyHand ?? null;
    const dummySuit = dummyHand?.getSuit(suitLed) ?? null;
    const numDummySuitCards = dummySuit?.length ?? 0;
    if (
      lhoIsDummy &&
      dummySuit &&
      numDummySuitCards > 0 &&
      currTopCard.suit === suitLed &&
      (dummySuit.at(0)?.faceValue ?? 0) > currTopCard.faceValue
    ) {
      actualTopCard = dummySuit.at(0)!;
      topPos = dummyPos;
      partnerHigh = false;
    }

    // first see if somebody trumped in this hand
    const wasTrumpPlayed = context.wasTrumpPlayed ?? (isSuit(trumpSuit) && currTopCard.suit === trumpSuit);
    if (wasTrumpPlayed && trumpSuit !== suitLed && isSuit(trumpSuit)) {
      const trumpHoldings = this.hand.getSuit(trumpSuit);
      const topTrump = trumpHoldings.length > 0 ? trumpHoldings.topCard : null;
      if (numCardsInSuitLed === 0 && topTrump && topTrump.faceValue > currTopCard.faceValue) {
        if (
          lhoIsDummy &&
          numDummySuitCards === 0 &&
          dummyHand &&
          dummyHand.getNumCardsInSuit(trumpSuit) > 0 &&
          (dummyHand.getSuit(trumpSuit).topCard?.faceValue ?? 0) > topTrump.faceValue
        ) {
          card = this.getDiscard(context);
          if (card) {
            this.status?.stream(
              `PLDF10! We'd like to trump here, but dummy can overtrump, so discard the ${card.name}.\n`,
            );
          }
        } else {
          const numTopCards = trumpHoldings.getNumCardsAbove(currTopCard);
          card = trumpHoldings.at(numTopCards - 1) ?? null;
          if (card) {
            this.status?.stream(
              `PLDF20! We can overtrump ${topCardPosStr}'s ${currTopCard.name} with the ${card.faceName}.\n`,
            );
          }
        }
      } else {
        card = this.getDiscard(context);
        if (card) {
          if (numCardsInSuitLed === 0 && trumpHoldings.length > 0) {
            this.status?.stream(
              `PLDF22! We can't overtrump ${topCardPosStr}'s ${currTopCard.faceName}, so discard the ${card.name}.\n`,
            );
          } else {
            this.status?.stream(
              `PLDF23! We can't beat the opponent's ${currTopCard.faceName} of trumps, so discard the ${card.name}.\n`,
            );
          }
        }
      }
    } else {
      // nobody has played a trump this round, or a trump was led (or NT)
      if (numCardsInSuitLed === 1) {
        card = this.hand.getSuit(suitLed).topCard;
        if (card) {
          this.status?.stream(`PLDF25! Play our only card in the suit, the ${card.faceName}.\n`);
        }
      } else if (numCardsInSuitLed >= 2) {
        const suit = this.hand.getSuit(suitLed);
        if ((suit.topCard?.faceValue ?? 0) > currTopCard.faceValue) {
          if (partnerHigh) {
            if (isSuit(trumpSuit) && currentRound === 0 && suit.numHonors === 1 && suit.length === 2) {
              card = suit.topCard;
              if (card && suit.length > 1) {
                this.status?.stream(`PLDF30! Drop the ${card.faceName} here to unblock the suit for partner.\n`);
              }
            } else if (!isSuit(trumpSuit) && suit.numWinners === suit.length) {
              card = suit.topCard;
              if (card && suit.length > 1) {
                this.status?.stream(
                  `PLDF31! We're holding all the remaining winning ${Card.suitToString(suitLed)} in our hand, so win with the ${card.faceName} in order to cash our winners.\n`,
                );
              }
            } else {
              if (currentSeat === 4) {
                card = this.getDiscard(context);
                if (card) {
                  this.status?.stream(
                    `PLDF34! Partner's ${currTopCard.faceName} is high, so discard the ${card.name}.\n`,
                  );
                }
              } else {
                const topOutstanding = this.getHighestOutstandingCard(suitLed);
                const ourCard = suit.topSequence?.bottomCard ?? suit.topCard!;
                if (
                  topOutstanding === null ||
                  currTopCard.faceValue > topOutstanding.faceValue ||
                  ourCard.faceValue <= currTopCard.faceValue + 1
                ) {
                  card = this.getDiscard(context);
                  if (card) {
                    this.status?.stream(
                      `PLDF36! Partner's ${currTopCard.faceName} is higher than any outstanding card, so discard the ${card.name}.\n`,
                    );
                  }
                } else {
                  card = ourCard;
                  this.status?.stream(
                    `PLDF37! Partner's ${currTopCard.faceName} might not win the round, so top it with the ${card.faceName}.\n`,
                  );
                }
              }
            }
          } else {
            // high card is opponent's
            if (lhoIsDummy) {
              if (actualTopCard.faceValue > currTopCard.faceValue) {
                if ((suit.topCard?.faceValue ?? 0) > actualTopCard.faceValue) {
                  card = suit.getLowestCardAbove(actualTopCard);
                  if (card) {
                    this.status?.stream(
                      `PLDF38A! Playing third ahead of dummy, we need to beat dummy's ${actualTopCard.faceName}, so play the ${card.faceName}.\n`,
                    );
                  }
                } else {
                  card = suit.getLowestCardAbove(currTopCard);
                  if (card) {
                    if (suit.getNumCardsBelow(card) > 0) {
                      this.status?.stream(
                        `PLDF38C! We top declarer's ${currTopCard.faceName} with the ${card.faceName}  to force dummy to play a winner.\n`,
                      );
                    } else {
                      this.status?.stream(
                        `PLDF38D! We can't beat dummy in this hand, so discard the ${card.faceName} .\n`,
                      );
                    }
                  }
                }
              } else {
                card = suit.getLowestCardAbove(currTopCard);
                if (card) {
                  this.status?.stream(`PLDF38B! Play high to win with the ${card.faceName}.\n`);
                }
              }
            } else if (currentSeat === 3) {
              card = suit.topSequence?.bottomCard ?? suit.topCard;
              if (card) {
                this.status?.stream(`PLDF40! Play high with the ${card.faceName}.\n`);
              }
            } else {
              card = suit.getLowestCardAbove(currTopCard) ?? suit.topCard;
            }
          }
        } else {
          if (partnerHigh) {
            card = this.getDiscard(context);
            if (card) {
              this.status?.stream(
                `PLDF47! Partner's ${currTopCard.faceName} can win the trick, so discard the ${card.name}.\n`,
              );
            }
          } else {
            card = this.getDiscard(context);
            if (card) {
              this.status?.stream(
                `PLDF48! We can't beat ${topCardPosStr}'s ${currTopCard.faceName}, so discard the ${card.name}.\n`,
              );
            }
          }
        }
      } else {
        // zero cards in the suit led
        if (isSuit(trumpSuit) && this.hand.getNumCardsInSuit(trumpSuit) > 0) {
          if (partnerHigh) {
            card = this.getDiscard(context);
            if (card) {
              this.status?.stream(
                `PLDF54! Although we could trump this hand, partner's ${currTopCard.name} is high, so discard the ${card.name}.\n`,
              );
            }
          } else {
            card = this.hand.getSuit(trumpSuit).bottomCard;
            if (card) {
              this.status?.stream(
                `PLDF55! With no cards in ${Card.suitToString(suitLed)}, trump with the ${card.name}.\n`,
              );
            }
          }
        } else {
          card = this.getDiscard(context);
          if (card) {
            this.status?.stream(
              `PLDF52! With no cards in the suit led ${isSuit(trumpSuit) ? 'and no trumps' : ''}, we discard the ${card.name}.\n`,
            );
          }
        }
      }
    }

    return card;
  }

  //
  // PlayFourth()
  //
  override playFourth(context: PlayRoundContext = {}): Card | null {
    return super.playFourth(context);
  }

  //
  // GetPlayHint()
  //
  override getPlayHint(context: PlayRoundContext = {}): Card | null {
    return this.playCard(context);
  }

  // Backward-compatible helpers
  recordSuitPreference(suit: Suit, preference: number): void {
    this.partnerSuitPreference[suit] = preference;
    this.suitPreference[suit] = preference;
  }

  getPreferredSuit(): Suit | typeof NONE {
    let preferred: Suit | typeof NONE = NONE;
    let best = -1;
    for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
      if (this.suitPreference[suit as Suit] > best) {
        best = this.suitPreference[suit as Suit];
        preferred = suit as Suit;
      }
    }
    return preferred;
  }

  override chooseCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    if (ledSuit !== NONE) {
      const following = this.hand?.getCardsInSuit(ledSuit) ?? [];
      if (following.length > 0) return following[0];
    }
    return super.chooseCard(ledSuit);
  }
}
