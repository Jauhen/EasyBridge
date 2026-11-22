import { Card } from '../card.js';
import { CardLocation } from '../cardLocation.js';
import { GuessedHandHoldings } from './guessedHandHoldings.js';
import { Hand } from '../hand.js';
import { PlayerStatus } from '../playerStatus.js';
import { NONE, Position, Suit } from '../constants.js';

export interface PlayEngineContext {
  player: PlayerRole;
  partner: PlayerRole;
  leftOpponent: PlayerRole;
  rightOpponent: PlayerRole;
  hand: Hand;
  cardLocation: CardLocation;
  guessedHands: GuessedHandHoldings[];
  status: PlayerStatus;
  prioritySuit?: Suit;
  trumpSuit?: Suit | typeof NONE;
}

export interface PlayerRole {
  position: Position;
  hand: Hand;
  status: PlayerStatus;
}

export class PlayEngine {
  // Mirrors CPlayEngine::RecordCardPlay/RecordCardUndo and base card
  // outstanding analysis. Subclasses retain declarer/dummy/defender roles.
  player: PlayerRole | null = null;
  partner: PlayerRole | null = null;
  leftOpponent: PlayerRole | null = null;
  rightOpponent: PlayerRole | null = null;
  hand: Hand | null = null;
  cardLocation: CardLocation | null = null;
  guessedHands: GuessedHandHoldings[] = [];
  status: PlayerStatus | null = null;
  prioritySuit: Suit | typeof NONE = NONE;
  trumpSuit: Suit | typeof NONE = NONE;

  initialize(context: PlayEngineContext): void {
    this.player = context.player;
    this.partner = context.partner;
    this.leftOpponent = context.leftOpponent;
    this.rightOpponent = context.rightOpponent;
    this.hand = context.hand;
    this.cardLocation = context.cardLocation;
    this.guessedHands = context.guessedHands;
    this.status = context.status;
    this.prioritySuit = context.prioritySuit ?? NONE;
    this.trumpSuit = context.trumpSuit ?? NONE;
  }

  clear(): void {
    this.prioritySuit = NONE;
  }

  getOutstandingCards(suit: Suit): readonly Card[] {
    if (!this.cardLocation) return [];
    return this.cardLocation.all
      .filter(guessed => guessed.isOutstanding && guessed.suit === suit)
      .map(guessed => guessed.card);
  }

  isCardOutstanding(card: Card): boolean {
    if (!this.cardLocation) return false;
    return this.cardLocation.at(card.deckValue).isOutstanding;
  }

  recordCardPlay(position: Position, card: Card): void {
    if (this.cardLocation) this.cardLocation.at(card.deckValue).markAsPlayed(position);
  }

  recordCardUndo(position: Position, card: Card): void {
    if (this.cardLocation) {
      const guessed = this.cardLocation.at(card.deckValue);
      guessed.setPlayed(false);
      guessed.setProbableLocation(position);
      guessed.clearFixProbability();
    }
  }

  chooseCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    if (!this.hand) return null;
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

  playCard(ledSuit: Suit | typeof NONE = NONE): Card | null {
    const card = this.chooseCard(ledSuit);
    if (card) this.hand?.remove(card);
    return card;
  }

  getNumClaimableTricks(): number {
    return 0;
  }
}
