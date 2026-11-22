import { Bid, NONE, Position, Suit } from '../constants.js';
import { Hand } from '../hand.js';
import { CardLocation } from '../cardLocation.js';
import { PlayerStatus } from '../playerStatus.js';
import { ConventionStatus } from './biddingCodes.js';

export interface ConventionBidContext {
  position: Position;
  partnerPosition: Position;
  partnerBid: Bid;
  partnerOpenedForTeam: boolean;
  partnerBidCount: number;
  rightHandOpponentPassed: boolean;
  agreedSuit: Suit | typeof NONE;
  bid: Bid;
  status: ConventionStatus;
  parameters: number;
  activeConvention: Convention | null;
}

export interface ConventionContext {
  hand: Hand;
  cardLocation: CardLocation;
  status: PlayerStatus;
  bidContext: ConventionBidContext;
}

export abstract class Convention {
  enabled = false;
  readonly statusLog: string[] = [];

  constructor(readonly id: number) {}

  initialize(): void {}

  terminate(): void {}

  clearState(): void {}

  // Mirrors C++ status strings such as STY0 and STYRR0. These codes are
  // intentionally retained even when the human-readable analysis text is
  // abbreviated, so ported bidding diagnostics stay searchable.
  recordStatusLog(code: string, message: string): void {
    this.statusLog.push(`${code}: ${message}`);
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  checkForOtherConventions(context: ConventionBidContext): boolean {
    return context.activeConvention !== null && context.activeConvention !== this;
  }

  abstract tryConvention(context: ConventionContext): Bid | null;

  respondToConvention(context: ConventionContext): Bid | null {
    void context;
    return null;
  }

  handleConventionResponse(context: ConventionContext): Bid | null {
    const partnerBid = context.bidContext.partnerBid;
    if (partnerBid === 36 || partnerBid === 37) {
      context.bidContext.status = ConventionStatus.Error;
    } else if (context.bidContext.status > 0) {
      context.bidContext.status = ConventionStatus.Inactive;
    }
    return null;
  }

  applyTest(context: ConventionContext): Bid | null {
    if (!this.enabled) return null;
    if (this.checkForOtherConventions(context.bidContext)) return null;
    return this.tryConvention(context)
      ?? this.respondToConvention(context)
      ?? this.handleConventionResponse(context);
  }
}
