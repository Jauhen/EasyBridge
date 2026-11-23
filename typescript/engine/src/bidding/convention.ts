//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CConvention (Convention.H / Convention.cpp)
//
// virtual base class from which specific bidding conventions are derived
//

import { Bid, NONE, Position, Suit } from '../constants.js';
import { Hand } from '../hand.js';
import { CardLocation } from '../cardLocation.js';
import { PlayerStatus } from '../playerStatus.js';
import { ConventionStatus } from './biddingCodes.js';
import type { BidEngine } from './bidEngine.js';
import type { ConventionSet } from './conventionSet.js';

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
  bidEngine?: BidEngine;
  conventions?: ConventionSet;
}

export abstract class Convention {
  enabled = false;
  readonly statusLog: string[] = [];

  constructor(public id: number = -1) {}

  initialize(): void {}

  terminate(): void {}

  clearState(): void {}

  setId(newId: number): void {
    this.id = newId;
  }

  getId(): number {
    return this.id;
  }

  // Mirrors C++ status strings such as STY0 and STYRR0. These codes are
  // retained so ported bidding diagnostics stay searchable.
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

  //
  // CheckForOtherConventions()
  //
  checkForOtherConventions(context: ConventionBidContext, bidEngine?: BidEngine): boolean {
    const active = bidEngine?.getActiveConvention() ?? context.activeConvention;
    return active !== null && active !== this;
  }

  abstract tryConvention(context: ConventionContext): Bid | null;

  respondToConvention(context: ConventionContext): Bid | null {
    void context;
    return null;
  }

  //
  // HandleConventionResponse()
  //
  handleConventionResponse(context: ConventionContext): Bid | null {
    const partnerBid = context.bidEngine?.nPartnersBid ?? context.bidContext.partnerBid;
    if (partnerBid === Bid.Double || partnerBid === Bid.Redouble) {
      // the convention is cancelled!
      context.bidContext.status = ConventionStatus.Error;
      context.bidEngine?.setConventionStatus(this, ConventionStatus.Error);
      return null;
    }

    const currentStatus = context.bidEngine
      ? context.bidEngine.getConventionStatus(this)
      : context.bidContext.status;
    if (currentStatus > 0) {
      context.bidContext.status = ConventionStatus.Inactive;
      context.bidEngine?.setConventionStatus(this, ConventionStatus.Inactive);
    }
    return null;
  }

  //
  // ApplyTest()
  //
  applyTest(context: ConventionContext): Bid | null {
    if (!this.enabled) return null;
    // see if another convention is active
    if (this.checkForOtherConventions(context.bidContext, context.bidEngine)) {
      return null;
    }
    return (
      this.tryConvention(context) ??
      this.respondToConvention(context) ??
      this.handleConventionResponse(context)
    );
  }
}
