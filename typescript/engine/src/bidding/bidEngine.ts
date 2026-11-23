//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CBidEngine (BidEngine.H / BidEngine.cpp / BiddingGeneral.cpp)
//
// - encapsulates status variables and bidding logic for a player
//
//===========================================================

import { Card } from '../card.js';
import { CardLocation } from '../cardLocation.js';
import {
  ACE,
  Bid,
  bidLevel,
  bidSuit,
  bidToFullString,
  bidToShortString,
  contractToFullString,
  isBid,
  isMajor,
  isMinor,
  isSuit,
  JACK,
  KING,
  makeBid,
  nextPosition,
  NONE,
  partnerPosition,
  Position,
  positionToString,
  QUEEN,
  Suit,
} from '../constants.js';
import { Hand, REVALUE_DECLARER } from '../hand.js';
import { GuessedHandHoldings } from '../play/guessedHandHoldings.js';
import { PlayerStatus } from '../playerStatus.js';
import { BiddingOption, ConventionId, ConventionStatus } from './biddingCodes.js';
import { makeOpeningBidEngine } from './biddingOpen.js';
import { makeRebidAsOpenerEngine } from './biddingRebid.js';
import { makeRebidAsResponderEngine } from './biddingRebid2.js';
import { makeRebidExtendedEngine } from './biddingRebidExtended.js';
import { makeRespondingBidEngine } from './biddingResponse.js';
import {
  NIB_NONE,
  openPts as computeOpenPts,
  OT_ABSOLUTE,
  OT_ANY,
  OT_OPENER,
  OT_STRONG,
  PTS_GAME,
  PTS_GRAND_SLAM,
  PTS_MAJOR_GAME,
  PTS_MINOR_GAME,
  PTS_NT_GAME,
  PTS_SLAM,
  PTS_SMALL_SLAM,
  RaiseTarget as EngineRaiseTarget,
  RebidTarget,
  ShiftTarget,
  SP_FIRST,
  SP_NONE,
  SP_SECOND,
  StoppedCode,
  SuitLength,
  SuitStrength,
  SuitType,
  SUIT_DIRECT,
  SUITS_ANY,
  SUITS_MAJORS,
  SUITS_MINORS,
  SupportLength,
} from './bidParameters.js';
import { Convention, ConventionBidContext, ConventionContext } from './convention.js';
import { ConventionPool } from './conventionPool.js';
import { ConventionSet } from './conventionSet.js';

export interface AuctionState {
  dealer: Position;
  currentPosition: Position;
  history: Array<{ position: Position; bid: Bid }>;
  passes: number;
  lastValidBid: Bid;
  lastValidPosition: Position | typeof NONE;
}

/**
 * Legacy RaiseTarget enum retained for backward compatibility with existing callers/tests.
 */
export enum RaiseTarget {
  RelativeByOne = 1,
  RelativeByTwo = 2,
  RelativeByThree = 3,
  ToThree = -3,
  ToFour = -4,
  ToFive = -5,
  ToGame = -10,
  ToSlam = -11,
  ToNoMoreThanGame = -9,
}

export interface PartnerRaiseResult {
  bid: Bid | null;
  statusCode: 'RDR' | 'S' | 'Q' | 'raise';
  message: string;
}

/**
 * Minimal player view needed by BidEngine (mirrors CPlayer bidding queries).
 */
export interface BiddingPlayerInfo {
  readonly position: Position;
  getNumBidsMade(): number;
  getNumBidTurns(): number;
  inquireLastBid(): Bid;
  getPriorBid(index: number): Bid;
  getPriorSuit(index: number): Suit | typeof NONE;
  getMinimumOpeningValue?(): number;
  getOpeningPosition?(): number;
  trace?(text: string): void;
}

/**
 * Decoupled auction/deal context (mirrors app_->GetDeal() queries in CBidEngine).
 */
export interface BiddingRoundContext {
  readonly biddingRound: number;
  readonly lastValidBid: Bid;
  readonly lastValidBidTeam: number;
  readonly numBidsMade: number;
  readonly dealer: Position;
  readonly contractModifier: number; // 0 = undoubled, 1 = doubled, 2 = redoubled
  readonly contract?: Bid;
  readonly declarerPosition?: Position;
  readonly roundLead?: Position;
  readonly aggressiveBiddingOffset?: number;
  readonly numValidBidsMade?: number;
  readonly openingBid?: Bid;
  readonly openingBidder?: Position;
  isBidValid(bid: Bid): boolean;
  getBidByPlayer(position: Position, round: number): Bid;
  getBidByIndex(index: number): Bid;
  getValidBidRecord?(index: number): Bid;
}

function getTeamForPosition(pos: Position): number {
  return pos === Position.North || pos === Position.South ? 0 : 1;
}

export class BidEngine {
  readonly pool: ConventionPool;
  private conventionSet: ConventionSet;
  readonly statusLog: string[] = [];

  // References to player / hand / deal state (set via initialize())
  player: BiddingPlayerInfo | null = null;
  partner: BiddingPlayerInfo | null = null;
  lhOpponent: BiddingPlayerInfo | null = null;
  rhOpponent: BiddingPlayerInfo | null = null;
  hand: Hand | null = null;
  cardLocation: CardLocation | null = null;
  guessedHands: GuessedHandHoldings[] | null = null;
  status: PlayerStatus | null = null;
  dealContext: BiddingRoundContext | null = null;

  // Core CBidEngine persistent bidding state
  m_nBid: Bid = NONE as unknown as Bid;
  m_numBidsMade = 0;
  m_numBidTurns = 0;
  m_nNextIntendedBid = NIB_NONE;
  m_numPartnersAces = 0;
  m_numPartnersKings = 0;

  m_fMinTPPoints = 0;
  m_fMaxTPPoints = 0;
  m_fMinTPCPoints = 0;
  m_fMaxTPCPoints = 0;
  m_fPartnersMin = 0;
  m_fPartnersMax = 0;

  nPartnersOpeningBid: Bid | typeof NONE = NONE;
  nPartnersOpeningBidLevel = 0;
  nPartnersOpeningSuit: Suit | typeof NONE = NONE;

  m_nOpeningPosition = -1;
  m_bOpenedBiddingForTeam = false;
  m_bPartnerOpenedForTeam = false;
  m_bPartnerOvercalled = false;
  m_nAgreedSuit: Suit | typeof NONE = NONE;
  m_nIntendedSuit: Suit | typeof NONE = NONE;
  m_nIntendedContract: Bid | typeof NONE = NONE;

  m_bRoundForceActive = false;
  m_bGameForceActive = false;
  m_bInvitedToGame = false;
  m_bInvitedToSlam = false;
  m_bHintMode = false;
  m_bInTestBiddingMode = false;

  // Convention status & parameter maps
  m_pActiveConvention: Convention | null = null;
  private conventionStatusMap = new Map<Convention, number>();
  private conventionParamMap = new Map<Convention, number>();

  // Per-turn shortcut variables populated by assessPosition()
  nSuit: Suit | typeof NONE = NONE;
  nRound = 0;
  nLastBid: Bid = Bid.Pass;
  nPosition: Position = Position.Unknown;
  nBiddingOrder = 0;
  nLastValidRecordedBid: Bid = Bid.Pass;

  nPreviousBid: Bid = Bid.Pass;
  nPreviousBidLevel: number = NONE;
  nPreviousSuit: Suit | typeof NONE = NONE;
  nPreviousSuitStrength = 0;
  numPreviousSuitCards = 0;
  numPreviousSuitPoints = 0;
  numHonorsInPreviousSuit = 0;
  bPreviousSuitIsSolid = false;
  bPreviousSuitIsRebiddable = false;
  bPreviousSuitIsSelfSupporting = false;

  nNextPrevBid: Bid | typeof NONE = NONE;
  nNextPrevSuit: Suit | typeof NONE = NONE;

  nFirstRoundBid: Bid | typeof NONE = NONE;
  nFirstRoundBidLevel: number = NONE;
  nFirstRoundSuit: Suit | typeof NONE = NONE;
  nFirstRoundSuitStrength = 0;
  numFirstRoundSuitCards = 0;
  bFirstRoundSuitIsSolid = false;
  bFirstRoundSuitIsSelfSupporting = false;

  nPrefSuit: Suit | typeof NONE = NONE;
  nPrefSuitStrength = 0;
  numPrefSuitCards = 0;
  numPrefSuitPoints = 0;
  numHonorsInPrefSuit = 0;
  bPrefSuitIsSolid = false;
  bPrefSuitIsSelfSupporting = false;
  numPreferredSuits = 0;

  nPartnerPos: Position = Position.Unknown;
  m_numPartnerBidsMade = 0;
  m_numPartnerBidTurns = 0;
  nPartnersBid: Bid = Bid.Pass;
  nPartnersBidLevel = 0;
  nPartnersSuit: Suit | typeof NONE = NONE;
  nPartnersSuitSupport = 0;
  numSupportCards = 0;
  numHonorsInPartnersSuit = 0;
  bJumpResponseByPartner = false;

  nPartnersPrevBid: Bid = Bid.Pass;
  nPartnersPrevBidLevel = 0;
  nPartnersPrevSuit: Suit | typeof NONE = NONE;
  nPPrevSuitSupport = 0;
  numPPrevSuitSupportCards = 0;

  numSuitsStopped = 0;
  numSuitsProbStopped = 0;
  numVoids = 0;
  numSingletons = 0;
  numDoubletons = 0;
  numLikelyWinners = 0;
  numLikelyLosers = 0;
  numWinners = 0;
  numLosers = 0;
  numQuickTricks = 0;

  numOpenableSuits = 0;
  numRebiddableSuits = 0;
  numSolidSuits = 0;
  numAbsoluteSuits = 0;
  nSuitStrength: number[] = [0, 0, 0, 0];
  numCardsInSuit: number[] = [0, 0, 0, 0];
  numHonorsInSuit: number[] = [0, 0, 0, 0];
  numSuitPoints: number[] = [0, 0, 0, 0];
  nPrefSuitList: number[] = [NONE, NONE, NONE, NONE, NONE];

  numAces = 0;
  numKings = 0;
  numQueens = 0;
  numJacks = 0;
  numTens = 0;

  // Text shortcuts
  szLHO = '';
  szRHO = '';
  szPB = '';
  szPS = '';
  szPSS = '';
  szHP = '';
  szPPB = '';
  szPPS = '';
  szPPSS = '';
  szHPP = '';
  szPrefS = '';
  szPrefSS = '';
  szHPref = '';
  szPVB = '';
  szPVS = '';
  szPVSS = '';
  szHPV = '';
  szNPB = '';
  szNPS = '';
  szNPSS = '';
  szHNPS = '';

  // Hand point & distribution shortcuts
  fPts = 0;
  fAdjPts = 0;
  fCardPts = 0;
  fDistPts = 0;
  fPenPts = 0;
  bBalanced = false;
  bSemiBalanced = false;
  bAllSuitsStopped = false;

  // Opponents' shortcuts
  nLHOBid: Bid = Bid.Pass;
  nLHOBidLevel = 0;
  nLHOSuit: Suit | typeof NONE = NONE;
  bLHOPassed = true;
  bLHOInterfered = false;
  nLHONumBidsMade = 0;
  nLHONumBidTurns = 0;

  nRHOBid: Bid = Bid.Pass;
  nRHOBidLevel = 0;
  nRHOSuit: Suit | typeof NONE = NONE;
  bRHOPassed = true;
  bRHOInterfered = false;
  nRHONumBidsMade = 0;
  nRHONumBidTurns = 0;

  nOpponentsBid: Bid = Bid.Pass;
  nOpponentsBidLevel = 0;
  nOpponentsBidSuit: Suit | typeof NONE = NONE;

  constructor(conventionSet = new ConventionSet()) {
    this.pool = new ConventionPool();
    this.conventionSet = conventionSet;
    this.conventionSet.initialize(this.pool);
  }

  get conventions(): ConventionSet {
    return this.conventionSet;
  }

  get conventionPool(): ConventionPool {
    return this.pool;
  }

  get partnerOpeningPosition(): number {
    return this.partner?.getOpeningPosition?.() ?? -1;
  }

  getLastValidBid(): Bid {
    return this.dealContext?.lastValidBid ?? this.nLastBid;
  }

  getPartnerPriorBid(index: number): Bid {
    return this.partner?.getPriorBid(index) ?? Bid.Pass;
  }

  getOwnPriorSuit(index: number): Suit | typeof NONE {
    return this.player?.getPriorSuit(index) ?? NONE;
  }

  getPartnerMinimumOpeningValue(): number {
    return this.partner?.getMinimumOpeningValue?.() ?? 12;
  }

  openPts(points: number): number {
    const offset = this.dealContext?.aggressiveBiddingOffset ?? 0;
    return computeOpenPts(points, offset);
  }

  //
  // Initialize()
  //
  initialize(
    player: BiddingPlayerInfo,
    partner: BiddingPlayerInfo,
    lhOpponent: BiddingPlayerInfo,
    rhOpponent: BiddingPlayerInfo,
    hand: Hand,
    cardLocation: CardLocation,
    guessedHands: GuessedHandHoldings[] | null,
    status: PlayerStatus,
    dealContext?: BiddingRoundContext,
  ): void {
    this.player = player;
    this.partner = partner;
    this.lhOpponent = lhOpponent;
    this.rhOpponent = rhOpponent;
    this.hand = hand;
    this.cardLocation = cardLocation;
    this.guessedHands = guessedHands;
    this.status = status;
    if (dealContext) this.dealContext = dealContext;
  }

  //
  // Clear()
  //
  clear(): void {
    this.m_nBid = NONE as unknown as Bid;
    this.m_numBidsMade = 0;
    this.m_numBidTurns = 0;
    this.m_nNextIntendedBid = NIB_NONE;
    this.m_numPartnersAces = 0;
    this.m_numPartnersKings = 0;

    this.m_fMinTPPoints = 0;
    this.m_fMaxTPPoints = 0;
    this.m_fMinTPCPoints = 0;
    this.m_fMaxTPCPoints = 0;
    this.m_fPartnersMin = 0;
    this.m_fPartnersMax = 0;

    this.nPartnersOpeningBid = NONE;
    this.nPartnersOpeningBidLevel = 0;
    this.nPartnersOpeningSuit = NONE;

    this.m_nOpeningPosition = -1;
    this.m_bOpenedBiddingForTeam = false;
    this.m_bPartnerOpenedForTeam = false;
    this.m_bPartnerOvercalled = false;
    this.m_nAgreedSuit = NONE;
    this.m_nIntendedSuit = NONE;
    this.m_nIntendedContract = NONE;

    this.m_bRoundForceActive = false;
    this.m_bGameForceActive = false;
    this.m_bInvitedToGame = false;
    this.m_bInvitedToSlam = false;
    this.m_bHintMode = false;
    this.m_bInTestBiddingMode = false;

    this.m_pActiveConvention = null;
    this.conventionStatusMap.clear();
    this.conventionParamMap.clear();
    for (const conv of this.conventionSet.conventionsList) {
      this.conventionStatusMap.set(conv, ConventionStatus.Inactive);
      this.conventionParamMap.set(conv, 0);
    }
  }

  //
  // String helpers (SHTS, SuitStrengthToString, SLTS)
  //
  suitHoldingsToString(suit: Suit | typeof NONE): string {
    if (isSuit(suit) && this.hand) {
      return this.hand.getSuit(suit).compressedHoldings;
    }
    return '';
  }

  suitStrengthToString(suit: Suit | typeof NONE): string {
    if (!isSuit(suit)) return 'N/A';
    const strength = this.nSuitStrength[suit];
    switch (strength) {
      case SuitStrength.Void:
        return 'void';
      case SuitStrength.Poor:
        return 'very poor';
      case SuitStrength.WeakSupport:
      case SuitStrength.ModerateSupport:
        return 'weak';
      case SuitStrength.MarginalOpener:
        return 'decent';
      case SuitStrength.Openable:
        return 'openable';
      case SuitStrength.Strong:
        return 'strong';
      case SuitStrength.Absolute:
        return 'powerful';
      default:
        return 'unknown';
    }
  }

  supportLevelToString(suit: Suit | typeof NONE): string {
    if (!isSuit(suit)) return 'N/A';
    const supportLevel = this.nSuitStrength[suit];
    if (supportLevel < SuitStrength.WeakSupport) {
      return 'poor';
    } else if (supportLevel > SuitStrength.StrongSupport) {
      return 'excellent';
    } else {
      switch (supportLevel) {
        case SuitStrength.WeakSupport:
          return 'weak';
        case SuitStrength.ModerateSupport:
          return 'moderate';
        case SuitStrength.GoodSupport:
          return 'good';
        case SuitStrength.StrongSupport:
          return 'strong';
        default:
          return 'unknown';
      }
    }
  }

  trace(text: string): void {
    this.statusLog.push(text);
    if (this.player?.trace) {
      this.player.trace(text);
    } else {
      this.status?.stream(`${text}\n`);
    }
  }

  traceNH(text: string): void {
    this.trace(text);
  }

  //
  //==========================================================================
  //
  // Main Stateful Bidding Routines (CBidEngine::Bid / AssessPosition)
  //
  //==========================================================================
  //

  bid(dealContext?: BiddingRoundContext): Bid {
    if (dealContext) this.dealContext = dealContext;
    this.assessPosition();

    let nBid: Bid = Bid.Pass;

    if (this.nRound === 0) {
      if ((this.partner?.getNumBidsMade() ?? 0) === 0) {
        nBid = makeOpeningBidEngine(this);
      } else {
        nBid = makeRespondingBidEngine(this);
      }
    } else {
      if (this.m_nBid === Bid.Pass) {
        if ((this.partner?.inquireLastBid() ?? Bid.Pass) !== Bid.Pass) {
          if ((this.partner?.getNumBidsMade() ?? 0) === 2) {
            nBid = makeRebidAsResponderEngine(this);
          } else if (this.m_numBidsMade === 0) {
            nBid = makeRespondingBidEngine(this);
          } else if (this.m_numBidsMade === 1) {
            nBid = makeRebidAsResponderEngine(this);
          } else {
            nBid = makeRebidExtendedEngine(this);
          }
        } else {
          this.status?.stream('We passed and partner passed, so pass again.\n');
          nBid = Bid.Pass;
        }
      } else {
        const partnerBids = this.partner?.getNumBidsMade() ?? 0;
        if (partnerBids === 0) {
          nBid = makeRebidAsOpenerEngine(this);
        } else if (partnerBids === 1) {
          nBid = makeRebidAsOpenerEngine(this);
        } else if (partnerBids === 2) {
          if (this.m_numBidsMade <= 1) nBid = makeRebidAsResponderEngine(this);
          else nBid = makeRebidExtendedEngine(this);
        } else {
          nBid = makeRebidExtendedEngine(this);
        }
      }
    }

    // if the bid is PASS, see if we should double for penalties
    if (nBid === Bid.Pass) {
      if (this.testForPenaltyDouble()) {
        nBid = Bid.Double;
      }
    }

    return nBid;
  }

  getRuleBasedBid(): Bid {
    return this.bid();
  }

  getBiddingHint(dealContext?: BiddingRoundContext): Bid {
    this.m_bHintMode = true;
    const oldBid = this.m_nBid;
    const result = this.bid(dealContext);
    this.m_nBid = oldBid;
    this.m_bHintMode = false;
    return result;
  }

  //
  // AssessPosition()
  //
  assessPosition(): void {
    const hand = this.hand;
    if (!hand) return;

    this.nRound = this.dealContext?.biddingRound ?? 0;
    this.nLastBid = this.dealContext?.lastValidBid ?? Bid.Pass;
    this.nPosition = this.player?.position ?? Position.Unknown;
    this.nBiddingOrder = this.dealContext?.numBidsMade ?? 0;
    this.nLastValidRecordedBid = this.nLastBid;

    // retrieve bidding history info
    this.nPreviousBid = this.m_nBid;
    if (isBid(this.nPreviousBid)) {
      this.nPreviousBidLevel = bidLevel(this.nPreviousBid);
      this.nPreviousSuit = bidSuit(this.nPreviousBid);
    } else {
      this.nPreviousBidLevel = NONE;
      this.nPreviousSuit = NONE;
    }
    if (isSuit(this.nPreviousSuit)) {
      this.nPreviousSuitStrength = hand.getSuitStrength(this.nPreviousSuit);
      this.numPreviousSuitCards = hand.getSuitLength(this.nPreviousSuit);
      this.numPreviousSuitPoints = hand.getSuitHCPoints(this.nPreviousSuit);
      this.numHonorsInPreviousSuit = hand.getNumHonorsInSuit(this.nPreviousSuit);
      this.bPreviousSuitIsSolid = hand.isSuitSolid(this.nPreviousSuit);
      this.bPreviousSuitIsRebiddable = hand.isSuitRebiddable(this.nPreviousSuit);
      this.bPreviousSuitIsSelfSupporting = hand.isSuitSelfSupporting(this.nPreviousSuit);
    } else {
      this.nPreviousSuitStrength = 0;
      this.numPreviousSuitCards = 0;
      this.numPreviousSuitPoints = 0;
      this.numHonorsInPreviousSuit = 0;
      this.bPreviousSuitIsSolid = false;
      this.bPreviousSuitIsRebiddable = false;
      this.bPreviousSuitIsSelfSupporting = false;
    }

    if (this.nRound >= 2 && this.dealContext) {
      this.nNextPrevBid = this.dealContext.getBidByPlayer(this.nPosition, this.nRound - 2);
      this.nNextPrevSuit = isBid(this.nNextPrevBid) ? bidSuit(this.nNextPrevBid) : NONE;
    } else {
      this.nNextPrevBid = NONE;
      this.nNextPrevSuit = NONE;
    }

    // first round bid info
    this.nFirstRoundBid = this.dealContext
      ? this.dealContext.getBidByPlayer(this.nPosition, 0)
      : NONE;
    if (isBid(this.nFirstRoundBid)) {
      this.nFirstRoundBidLevel = bidLevel(this.nFirstRoundBid);
      this.nFirstRoundSuit = bidSuit(this.nFirstRoundBid);
    } else {
      this.nFirstRoundBidLevel = NONE;
      this.nFirstRoundSuit = NONE;
    }
    if (isSuit(this.nFirstRoundSuit)) {
      this.nFirstRoundSuitStrength = hand.getSuitStrength(this.nFirstRoundSuit);
      this.numFirstRoundSuitCards = hand.getSuitLength(this.nFirstRoundSuit);
      this.bFirstRoundSuitIsSolid = hand.isSuitSolid(this.nFirstRoundSuit);
      this.bFirstRoundSuitIsSelfSupporting = hand.isSuitSelfSupporting(this.nFirstRoundSuit);
    } else {
      this.nFirstRoundSuitStrength = 0;
      this.numFirstRoundSuitCards = 0;
      this.bFirstRoundSuitIsSolid = false;
      this.bFirstRoundSuitIsSelfSupporting = false;
    }

    // preferred suit
    this.nPrefSuit = hand.preferredSuit;
    if (isSuit(this.nPrefSuit)) {
      this.nPrefSuitStrength = hand.getSuitStrength(this.nPrefSuit);
      this.numPrefSuitCards = hand.getSuitLength(this.nPrefSuit);
      this.numPrefSuitPoints = hand.getSuitHCPoints(this.nPrefSuit);
      this.numHonorsInPrefSuit = hand.getNumHonorsInSuit(this.nPrefSuit);
      this.bPrefSuitIsSolid = hand.isSuitSolid(this.nPrefSuit);
      this.bPrefSuitIsSelfSupporting = hand.isSuitSelfSupporting(this.nPrefSuit);
    } else {
      this.nPrefSuitStrength = 0;
      this.numPrefSuitCards = 0;
      this.numPrefSuitPoints = 0;
      this.numHonorsInPrefSuit = 0;
      this.bPrefSuitIsSolid = false;
      this.bPrefSuitIsSelfSupporting = false;
    }
    this.numPreferredSuits = hand.numPreferredSuits;

    // partner's suit
    this.nPartnerPos = this.partner?.position ?? partnerPosition(this.nPosition);
    this.m_numPartnerBidsMade = this.partner?.getNumBidsMade() ?? 0;
    this.m_numPartnerBidTurns = this.partner?.getNumBidTurns() ?? 0;

    this.nPartnersBid = this.partner?.inquireLastBid() ?? Bid.Pass;
    this.nPartnersBidLevel = isBid(this.nPartnersBid) ? bidLevel(this.nPartnersBid) : 0;
    this.nPartnersSuit = isBid(this.nPartnersBid) ? bidSuit(this.nPartnersBid) : NONE;
    if (isSuit(this.nPartnersSuit)) {
      this.nPartnersSuitSupport = hand.getSuitStrength(this.nPartnersSuit);
      this.numSupportCards = hand.getSuitLength(this.nPartnersSuit);
      this.numHonorsInPartnersSuit = hand.getNumHonorsInSuit(this.nPartnersSuit);
      this.bJumpResponseByPartner = this.nPartnersBid - this.nPreviousBid > 5;
    } else {
      this.nPartnersSuitSupport = 0;
      this.numSupportCards = 0;
      this.numHonorsInPartnersSuit = 0;
      this.bJumpResponseByPartner = false;
    }

    if (this.nPartnersOpeningBid === NONE) {
      this.nPartnersOpeningBid = this.nPartnersBid;
      this.nPartnersOpeningBidLevel = this.nPartnersBidLevel;
      this.nPartnersOpeningSuit = this.nPartnersSuit;
    }

    this.nPartnersPrevBid = this.partner?.getPriorBid(1) ?? Bid.Pass;
    this.nPartnersPrevBidLevel = isBid(this.nPartnersPrevBid) ? bidLevel(this.nPartnersPrevBid) : 0;
    this.nPartnersPrevSuit = isBid(this.nPartnersPrevBid) ? bidSuit(this.nPartnersPrevBid) : NONE;
    if (isSuit(this.nPartnersPrevSuit)) {
      this.nPPrevSuitSupport = hand.getSuitStrength(this.nPartnersPrevSuit);
      this.numPPrevSuitSupportCards = hand.getSuitLength(this.nPartnersPrevSuit);
    } else {
      this.nPPrevSuitSupport = 0;
      this.numPPrevSuitSupportCards = 0;
    }

    // special handling: partner opened strong 2C
    if (
      this.nPartnersPrevBid === Bid.C2 &&
      this.conventionSet.isConventionEnabled(ConventionId.Artificial2Club) &&
      this.getConventionStatus(ConventionId.Artificial2Club) !== ConventionStatus.Inactive
    ) {
      this.nPartnersPrevSuit = NONE;
      this.nPPrevSuitSupport = SuitStrength.None;
      this.numPPrevSuitSupportCards = 0;
    }

    // hand counts
    this.numSuitsStopped = hand.numSuitsStopped;
    this.numSuitsProbStopped = hand.numSuitsProbStopped;
    this.numVoids = hand.numVoids;
    this.numSingletons = hand.numSingletons;
    this.numDoubletons = hand.numDoubletons;
    this.numLikelyWinners = hand.numLikelyWinners;
    this.numLikelyLosers = hand.numLikelyWinners; // C++ BidEngine.cpp line 637 verbatim
    this.numWinners = hand.numWinners;
    this.numLosers = hand.numWinners; // C++ BidEngine.cpp line 639 verbatim
    this.numQuickTricks = hand.numQuickTricks;

    this.numOpenableSuits = hand.numOpenableSuits;
    this.numRebiddableSuits = hand.numRebiddableSuits;
    this.numSolidSuits = hand.numSolidSuits;
    this.numAbsoluteSuits = hand.numAbsoluteSuits;
    for (let i = 0; i < 4; i++) {
      this.nSuitStrength[i] = hand.getSuitStrength(i as Suit);
      this.numCardsInSuit[i] = hand.getSuitLength(i as Suit);
      this.numHonorsInSuit[i] = hand.getNumHonorsInSuit(i as Suit);
      this.numSuitPoints[i] = hand.getSuitHCPoints(i as Suit);
    }
    for (let i = 0; i < 5; i++) {
      this.nPrefSuitList[i] = hand.getSuitsByPreference(i);
    }

    this.numAces = hand.numAces;
    this.numKings = hand.numKings;
    this.numQueens = hand.numQueens;
    this.numJacks = hand.numJacks;
    this.numTens = hand.numTens;

    // text shortcuts
    this.szLHO = positionToString(this.lhOpponent?.position ?? Position.Unknown);
    this.szRHO = positionToString(this.rhOpponent?.position ?? Position.Unknown);

    this.szPB = bidToFullString(this.nPartnersBid);
    this.szPS = isSuit(this.nPartnersSuit) ? Card.suitToString(this.nPartnersSuit) : '';
    this.szPSS = isSuit(this.nPartnersSuit) ? Card.suitToSingularString(this.nPartnersSuit) : '';
    this.szHP = this.suitHoldingsToString(this.nPartnersSuit);

    this.szPPB = bidToFullString(this.nPartnersPrevBid);
    this.szPPS = isSuit(this.nPartnersPrevSuit) ? Card.suitToString(this.nPartnersPrevSuit) : '';
    this.szPPSS = isSuit(this.nPartnersPrevSuit)
      ? Card.suitToSingularString(this.nPartnersPrevSuit)
      : '';
    this.szHPP = this.suitHoldingsToString(this.nPartnersPrevSuit);

    this.szPrefS = isSuit(this.nPrefSuit) ? Card.suitToString(this.nPrefSuit) : '';
    this.szPrefSS = isSuit(this.nPrefSuit) ? Card.suitToSingularString(this.nPrefSuit) : '';
    this.szHPref = this.suitHoldingsToString(this.nPrefSuit);

    this.szPVB = bidToFullString(this.nPreviousBid);
    this.szPVS = isSuit(this.nPreviousSuit) ? Card.suitToString(this.nPreviousSuit) : '';
    this.szPVSS = isSuit(this.nPreviousSuit) ? Card.suitToSingularString(this.nPreviousSuit) : '';
    this.szHPV =
      this.nPreviousSuit !== Suit.NoTrump ? this.suitHoldingsToString(this.nPreviousSuit) : '';

    this.szNPB = this.nNextPrevBid !== NONE ? bidToFullString(this.nNextPrevBid) : '';
    this.szNPS = isSuit(this.nNextPrevSuit) ? Card.suitToString(this.nNextPrevSuit) : '';
    this.szNPSS = isSuit(this.nNextPrevSuit) ? Card.suitToSingularString(this.nNextPrevSuit) : '';
    this.szHNPS =
      this.nNextPrevSuit !== Suit.NoTrump ? this.suitHoldingsToString(this.nNextPrevSuit) : '';

    // hand points
    this.fPts = hand.totalPoints;
    this.fAdjPts = this.fPts;
    this.fCardPts = hand.highCardPoints;
    this.fDistPts = hand.longPoints + hand.shortPoints;
    this.fPenPts = hand.penaltyPoints;
    this.bBalanced = hand.isBalanced;
    this.bSemiBalanced = hand.isBalanced || hand.isSemiBalanced;
    this.bAllSuitsStopped = hand.allSuitsStopped();

    // opponents' info
    this.nLHOBid = this.lhOpponent?.inquireLastBid() ?? Bid.Pass;
    if (this.nLHOBid !== Bid.Pass && isBid(this.nLHOBid)) {
      this.nLHOBidLevel = bidLevel(this.nLHOBid);
      this.nLHOSuit = bidSuit(this.nLHOBid);
    } else {
      this.nLHOBidLevel = 0;
      this.nLHOSuit = NONE;
    }
    this.bLHOPassed = this.nLHOBid === Bid.Pass;
    this.bLHOInterfered = !this.bLHOPassed;
    this.nLHONumBidsMade = this.lhOpponent?.getNumBidsMade() ?? 0;
    this.nLHONumBidTurns = this.lhOpponent?.getNumBidTurns() ?? 0;

    this.nRHOBid = this.rhOpponent?.inquireLastBid() ?? Bid.Pass;
    if (this.nRHOBid !== Bid.Pass && isBid(this.nRHOBid)) {
      this.nRHOBidLevel = bidLevel(this.nRHOBid);
      this.nRHOSuit = bidSuit(this.nRHOBid);
    } else {
      this.nRHOBidLevel = 0;
      this.nRHOSuit = NONE;
    }
    this.bRHOPassed = this.nRHOBid === Bid.Pass;
    this.bRHOInterfered = !this.bRHOPassed;
    this.nRHONumBidsMade = this.rhOpponent?.getNumBidsMade() ?? 0;
    this.nRHONumBidTurns = this.rhOpponent?.getNumBidTurns() ?? 0;

    if (this.nRHOBid > this.nLHOBid) {
      this.nOpponentsBid = this.nRHOBid;
      this.nOpponentsBidLevel = this.nRHOBidLevel;
      this.nOpponentsBidSuit = this.nRHOSuit;
    } else {
      this.nOpponentsBid = this.nLHOBid;
      this.nOpponentsBidLevel = this.nLHOBidLevel;
      this.nOpponentsBidSuit = this.nLHOSuit;
    }
  }

  //
  // AdjustPartnershipPoints()
  //
  adjustPartnershipPoints(fPartnersMin = -1, fPartnersMax = -1, bAdjustPoints = true): void {
    if (fPartnersMin > 0 && fPartnersMax > 0) {
      if (bAdjustPoints) {
        this.m_fPartnersMin = this.openPts(fPartnersMin);
        this.m_fPartnersMax = this.openPts(fPartnersMax);
      } else {
        this.m_fPartnersMin = fPartnersMin;
        this.m_fPartnersMax = fPartnersMax;
      }
    }

    const pMin = fPartnersMin < 0 ? this.m_fPartnersMin : fPartnersMin;
    const pMax = fPartnersMax < 0 ? this.m_fPartnersMax : fPartnersMax;

    this.m_fMinTPPoints = this.fAdjPts + pMin;
    this.m_fMaxTPPoints = this.fAdjPts + pMax;
    this.m_fMinTPCPoints = this.fCardPts + pMin;
    this.m_fMaxTPCPoints = this.fCardPts + pMax;
  }

  //
  // Internal convention runner used by stateful bidding stages
  //
  applyConventionTestsInternal(): boolean {
    if (!this.hand || !this.cardLocation || !this.status) return false;
    const bidContext: ConventionBidContext = {
      position: this.nPosition,
      partnerPosition: this.nPartnerPos,
      partnerBid: this.nPartnersBid,
      partnerOpenedForTeam: this.m_bPartnerOpenedForTeam,
      partnerBidCount: this.m_numPartnerBidsMade,
      rightHandOpponentPassed: this.bRHOPassed,
      agreedSuit: this.m_nAgreedSuit,
      bid: this.m_nBid,
      status: this.m_pActiveConvention
        ? this.getConventionStatus(this.m_pActiveConvention)
        : ConventionStatus.Inactive,
      parameters: this.m_pActiveConvention
        ? this.getConventionParameter(this.m_pActiveConvention)
        : 0,
      activeConvention: this.m_pActiveConvention,
    };
    const context: ConventionContext = {
      hand: this.hand,
      cardLocation: this.cardLocation,
      status: this.status,
      bidContext,
      bidEngine: this,
      conventions: this.conventionSet,
    };
    const result = this.conventionSet.applyConventionTests(context);
    if (result !== null) {
      this.m_nBid = result;
      if (bidContext.agreedSuit !== NONE) this.m_nAgreedSuit = bidContext.agreedSuit;
      if (bidContext.activeConvention) this.m_pActiveConvention = bidContext.activeConvention;
      return true;
    }
    return false;
  }

  //
  // ValidateBid()
  //
  validateBid(nBid: Bid, nOvercallBid: Bid = Bid.Pass): Bid {
    const nLVBid = this.dealContext?.lastValidBid ?? this.nLastBid;
    const isValid = (b: Bid): boolean => {
      if (this.dealContext) return this.dealContext.isBidValid(b);
      if (b === Bid.Pass) return true;
      if (b === Bid.Double || b === Bid.Redouble) return true;
      return b > nLVBid;
    };

    if (this.m_bHintMode) {
      if (isValid(nBid)) {
        return nBid;
      } else {
        this.trace(
          `But the bid is too low vs. the last bid of of ${bidToFullString(nLVBid)}, so we have to pass.`,
        );
        return Bid.Pass;
      }
    }

    let finalBid = nBid;
    if (isValid(finalBid)) {
      if (finalBid > Bid.Pass && finalBid < Bid.Double) {
        this.m_numBidsMade++;
      }
    } else if (nOvercallBid > nLVBid && nOvercallBid < Bid.Double) {
      this.trace(`But opponent bid ${finalBid}, so overcall at ${nOvercallBid}.`);
      finalBid = nOvercallBid;
      this.m_numBidsMade++;
    } else {
      if (finalBid === nLVBid) {
        this.trace(`But ${bidToFullString(finalBid)} has already been bid, so we have to pass.`);
      } else if (finalBid !== Bid.Pass) {
        this.trace(
          `But our bid is too low vs. the last bid of of ${bidToFullString(nLVBid)}, so we have to pass.`,
        );
      }
      finalBid = Bid.Pass;
    }

    this.m_nBid = finalBid;
    this.m_numBidTurns++;

    if (
      finalBid > Bid.Pass &&
      finalBid < Bid.Double &&
      this.m_numBidsMade === 1 &&
      (this.partner?.getNumBidsMade() ?? 0) === 0
    ) {
      this.m_nOpeningPosition = this.dealContext?.numBidsMade ?? 0;
      this.m_bOpenedBiddingForTeam = true;
    }

    return finalBid;
  }

  //
  // Hand evaluation / suit selection helpers
  //
  isSuitOpenable(suit: Suit | typeof NONE, minStrength = SuitStrength.Openable): boolean {
    if (!isSuit(suit)) return false;
    const numCardsRequired = this.conventionSet.isConventionEnabled(ConventionId.FiveCardMajors)
      ? 5
      : 4;
    return this.numCardsInSuit[suit] >= numCardsRequired && this.nSuitStrength[suit] >= minStrength;
  }

  isSuitShiftable(suit: Suit | typeof NONE, minCards = 4, minStrength = SuitStrength.Openable): boolean {
    if (!isSuit(suit)) return false;
    return this.numCardsInSuit[suit] >= minCards && this.nSuitStrength[suit] >= minStrength;
  }

  isGameBid(nBid: Bid): boolean {
    if (!isBid(nBid)) return false;
    const suit = bidSuit(nBid);
    const level = bidLevel(nBid);
    return (
      (isMajor(suit) && level >= 4) ||
      (isMinor(suit) && level >= 5) ||
      (suit === Suit.NoTrump && level >= 3)
    );
  }

  getGameBid(suit: Suit | typeof NONE): Bid {
    if (isMajor(suit)) return makeBid(suit as Suit, 4);
    if (isMinor(suit)) return makeBid(suit as Suit, 5);
    return Bid.NT3;
  }

  getGamePoints(suit: Suit | typeof NONE): number {
    if (isMajor(suit)) return PTS_MAJOR_GAME;
    if (isMinor(suit)) return PTS_MINOR_GAME;
    return PTS_NT_GAME;
  }

  playerOpenedSuit(suit: Suit | typeof NONE): boolean {
    if (!isSuit(suit) || !this.dealContext) return false;
    const playerPos = this.nPosition;
    const partnerPos = this.nPartnerPos;
    const numBids = this.dealContext.numBidsMade;
    let pos = this.dealContext.dealer;
    for (let i = 0; i < numBids; i++) {
      const b = this.dealContext.getBidByIndex(i);
      if (isBid(b) && bidSuit(b) === suit) {
        if (pos === playerPos) return true;
        if (pos === partnerPos) return false;
      }
      pos = nextPosition(pos);
    }
    return false;
  }

  cancelBidding(): void {
    this.traceNH('***Bidding Cancelled***');
    this.clear();
  }

  restartBidding(): void {
    this.traceNH('***Bidding restarted***');
    this.clear();
  }

  recordBid(pos: Position, nBid: Bid): void {
    if (pos !== this.nPosition) {
      let strTemp: string;
      if (nBid !== Bid.Pass) {
        if (nBid === Bid.Double || nBid === Bid.Redouble) {
          strTemp = `${positionToString(pos)} ${nBid === Bid.Double ? 'doubles' : 'redoubles'}.`;
        } else {
          strTemp = `${positionToString(pos)} bids ${bidToShortString(nBid)}.`;
        }
        if (pos === this.nPartnerPos && !this.m_bOpenedBiddingForTeam) {
          this.m_bPartnerOpenedForTeam = true;
        }
      } else {
        strTemp = `${positionToString(pos)} passes.`;
      }
      this.traceNH(strTemp);
    } else if (nBid === Bid.Pass) {
      this.traceNH('We pass.');
    }
    this.traceNH('--------------------');
  }

  biddingFinished(): void {
    const contract = this.dealContext?.contract ?? Bid.Pass;
    const mod = this.dealContext?.contractModifier ?? 0;
    const declarer = this.dealContext?.declarerPosition ?? Position.Unknown;
    const lead = this.dealContext?.roundLead ?? Position.Unknown;
    const strLine = `Bidding finished; contract is ${contractToFullString(contract, mod)}.  Declarer is ${positionToString(declarer)}; ${positionToString(lead)} leads.\n=======================`;
    this.traceNH(strLine);
  }

  pickSuperiorSuit(suit1: Suit | typeof NONE, suit2: Suit | typeof NONE, _arbitrate = SP_NONE): Suit {
    if (isSuit(suit1) && !isSuit(suit2)) return suit1;
    if (isSuit(suit2) && !isSuit(suit1)) return suit2;
    if (!isSuit(suit1) || !isSuit(suit2)) return Suit.Clubs;
    if (!this.hand) return suit1;
    return this.hand.getSuitRank(suit1) < this.hand.getSuitRank(suit2) ? suit1 : suit2;
  }

  getLongerSuit(suit1: Suit | typeof NONE, suit2: Suit | typeof NONE, _arbitrate = SP_NONE): Suit {
    if (isSuit(suit1) && !isSuit(suit2)) return suit1;
    if (isSuit(suit2) && !isSuit(suit1)) return suit2;
    if (!isSuit(suit1) || !isSuit(suit2)) return Suit.Clubs;
    if (!this.hand) return suit1;
    return this.hand.getNumCardsInSuit(suit1) >= this.hand.getNumCardsInSuit(suit2) ? suit1 : suit2;
  }

  getBestSuitOfAtLeast(suit1: Suit, suit2: Suit, len: number, arbitrate = SP_NONE): Suit {
    if (this.numCardsInSuit[suit1] >= len && this.numCardsInSuit[suit2] < len) return suit1;
    if (this.numCardsInSuit[suit2] >= len && this.numCardsInSuit[suit1] < len) return suit2;
    return this.pickSuperiorSuit(suit1, suit2, arbitrate);
  }

  getLowestOpenableBid(suitType: number, openType: number, level: number): Bid {
    const hand = this.hand;
    if (!hand) return Bid.Pass;

    if (suitType === SUITS_ANY || suitType === SUITS_MINORS) {
      let s: Suit | typeof NONE = NONE;
      if (openType === OT_ANY) s = hand.getLowestMarginalSuit();
      else if (openType === OT_OPENER) s = hand.getLowestOpenableSuit();
      else if (openType === OT_STRONG) s = hand.getLowestSolidSuit();
      else if (openType === OT_ABSOLUTE) s = hand.getLowestAbsoluteSuit();
      return isSuit(s) ? makeBid(s, level) : Bid.Pass;
    }

    if (suitType === SUITS_MAJORS) {
      let minStr = SuitStrength.MarginalOpener;
      if (openType === OT_ANY) minStr = SuitStrength.MarginalOpener;
      else if (openType === OT_OPENER) minStr = SuitStrength.Openable;
      else if (openType === OT_STRONG) minStr = SuitStrength.Strong;
      else if (openType === OT_ABSOLUTE) minStr = SuitStrength.Absolute;
      else return Bid.Pass;

      for (const s of [Suit.Hearts, Suit.Spades, Suit.Clubs, Suit.Diamonds]) {
        if (this.nSuitStrength[s] >= minStr) return makeBid(s, level);
      }
    }
    return Bid.Pass;
  }

  getBestOpeningSuit(): Suit {
    const hand = this.hand;
    let nSuit: Suit = isSuit(this.nPrefSuit) ? this.nPrefSuit : Suit.Clubs;

    if (this.conventionSet.isConventionEnabled(ConventionId.FiveCardMajors)) {
      if (isMajor(nSuit) && this.numCardsInSuit[nSuit] >= 5) {
        if (this.numCardsInSuit[Suit.Hearts] >= 5 && this.numCardsInSuit[Suit.Spades] >= 5) {
          return this.getBestSuitOfAtLeast(Suit.Spades, Suit.Hearts, 5, SP_FIRST);
        }
        return nSuit;
      }
      if (isMinor(nSuit) && this.numCardsInSuit[nSuit] >= 6) {
        return nSuit;
      }
      if (this.numCardsInSuit[Suit.Hearts] >= 5 && this.numCardsInSuit[Suit.Spades] >= 5) {
        return this.pickSuperiorSuit(Suit.Hearts, Suit.Spades, SP_SECOND);
      } else if (this.numCardsInSuit[Suit.Spades] >= 5) {
        return Suit.Spades;
      } else if (this.numCardsInSuit[Suit.Hearts] >= 5) {
        return Suit.Hearts;
      } else {
        return this.pickSuperiorSuit(Suit.Clubs, Suit.Diamonds, SP_SECOND);
      }
    } else if (hand) {
      if (hand.numPreferredSuits >= 3) {
        this.trace(
          `BPK1! With ${hand.numPreferredSuits} good suits (${Card.suitToString(hand.getSuitsByPreference(2))}, ${Card.suitToString(hand.getSuitsByPreference(1))}, and ${Card.suitToString(hand.getSuitsByPreference(0))}), bid the middle suit.`,
        );
        return hand.getSuitsByPreference(1) as Suit;
      } else if (hand.numPreferredSuits === 2) {
        this.trace(
          `BPK2! With 2 good suits (${Card.suitToString(hand.getSuitsByPreference(1))} and ${Card.suitToString(hand.getSuitsByPreference(0))}), bid the higher suit.`,
        );
        return hand.getSuitsByPreference(0) as Suit;
      }
      return nSuit;
    }

    return nSuit;
  }

  getRebidSuit(prevSuit: Suit): Suit | typeof NONE {
    if (!this.hand) return NONE;
    if (this.nSuitStrength[prevSuit] >= SuitStrength.Absolute) return prevSuit;

    if (this.hand.numPreferredSuits > 1) {
      if (prevSuit === this.hand.getSuitsByPreference(0)) {
        return this.hand.getSuitsByPreference(1) as Suit;
      }
      return this.hand.getSuitsByPreference(0) as Suit;
    }

    for (let i = 0; i < 4; i++) {
      const s = this.hand.getSuitsByPreference(i) as Suit;
      if (s === prevSuit) continue;
      if (this.hand.getSuitLength(s) >= 4 && this.hand.getSuitHCPoints(s) >= 3) {
        return s;
      }
    }

    if (this.bPreviousSuitIsRebiddable) return prevSuit;
    return NONE;
  }

  getNextBestSuit(prevSuit: Suit | typeof NONE, partnersSuit: Suit | typeof NONE = NONE): Suit {
    if (!this.hand) return Suit.Clubs;
    for (let i = 0; i < 4; i++) {
      const s = this.hand.getSuitsByPreference(i) as Suit;
      if (s !== prevSuit && s !== partnersSuit) return s;
    }
    return Suit.Clubs;
  }

  getFourthSuit(suit1: Suit | typeof NONE, suit2: Suit | typeof NONE, suit3: Suit | typeof NONE): Suit {
    for (let i = 0; i < 4; i++) {
      if (i !== suit1 && i !== suit2 && i !== suit3) return i as Suit;
    }
    return Suit.Clubs;
  }

  testReverseRules(suit: Suit): { ok: boolean; suit: Suit } {
    if (this.conventionSet.isOptionEnabled(BiddingOption.StructuredReverses)) {
      if (isSuit(this.nPreviousSuit) && suit > this.nPreviousSuit && this.fPts < 17) {
        this.status?.stream(
          `2RevV0! We'd like to bid the ${Card.suitToSingularString(suit)} suit, but we can't reverse with less than 17 points.\n`,
        );
        let newSuit = this.getNextBestSuit(suit, this.nPreviousSuit);
        if (newSuit > this.nPreviousSuit) {
          newSuit = this.getFourthSuit(newSuit, suit, this.nPreviousSuit);
        }
        if (this.nSuitStrength[newSuit] < SuitStrength.Openable) {
          this.status?.stream(
            `2RevV2! And since the 3rd best suit (${Card.suitToString(newSuit)}) is not strong enough to bid, we have to rebid the original ${Card.suitToSingularString(this.nPreviousSuit)} suit.\n`,
          );
          newSuit = this.nPreviousSuit;
        }
        return { ok: false, suit: newSuit };
      }
      return { ok: true, suit };
    }
    return { ok: true, suit };
  }

  countModifiedPlayingTricks(trumpSuit: Suit | typeof NONE): number {
    if (!this.hand) return 0;
    let fWinners = 0;
    for (let i = 0; i < 4; i++) {
      const s = i as Suit;
      const nCount = this.numCardsInSuit[i];
      const nCard0 = nCount >= 1 ? (this.hand.getCardInSuit(s, 0)?.faceValue ?? 0) : 0;
      const nCard1 = nCount >= 2 ? (this.hand.getCardInSuit(s, 1)?.faceValue ?? 0) : 0;
      const nCard2 = nCount >= 3 ? (this.hand.getCardInSuit(s, 2)?.faceValue ?? 0) : 0;

      if (nCount === 1) {
        if (nCard0 === ACE) fWinners++;
      } else if (nCount === 2) {
        if (nCard0 === ACE && nCard1 === KING) fWinners += 2.0;
        else if (nCard0 === ACE && nCard1 === QUEEN) fWinners += 1.5;
        else if (nCard0 === KING && nCard1 === QUEEN) fWinners += 1.0;
        else if (nCard0 === KING && nCard1 < QUEEN) fWinners += 0.5;
      } else if (nCount >= 3) {
        if (nCard0 === ACE && nCard1 === KING && nCard2 === QUEEN) fWinners += 3.0;
        else if (
          (nCard0 === ACE && nCard1 === KING && nCard2 === JACK) ||
          (nCard0 === ACE && nCard1 === QUEEN && nCard2 === JACK)
        )
          fWinners += 2.5;
        else if (
          (nCard0 === ACE && nCard1 === KING) ||
          (nCard0 === ACE && nCard1 === QUEEN && nCard2 === 10) ||
          (nCard0 === ACE && nCard1 === JACK && nCard2 === 10) ||
          (nCard0 === KING && nCard1 === QUEEN && nCard2 === JACK)
        )
          fWinners += 2.0;
        else if (
          (nCard0 === ACE && nCard1 === QUEEN) ||
          (nCard0 === KING && nCard1 === QUEEN && nCard2 === 10) ||
          (nCard0 === KING && nCard1 === JACK && nCard2 === 10)
        )
          fWinners += 1.5;
        else if (
          nCard0 === ACE ||
          (nCard0 === KING && nCard1 === QUEEN) ||
          (nCard0 === KING && nCard1 === JACK) ||
          (nCard0 === QUEEN && nCard1 === JACK && nCard2 === 10)
        )
          fWinners += 1.0;
        else if (nCard0 === KING || (nCard0 === QUEEN && nCard1 === JACK && nCard2 < JACK))
          fWinners += 0.5;
      }

      if (nCount >= 4) {
        if (i === trumpSuit) {
          fWinners += nCount - 3;
        } else if (nCount === 4) {
          fWinners += 0.5;
        } else {
          fWinners += nCount - 4 + 0.5;
        }
      }
    }
    return Math.trunc(fWinners);
  }

  testForPenaltyDouble(): boolean {
    if (!this.hand || !this.dealContext) return false;
    if (this.dealContext.contractModifier !== 0) return false;
    if (this.dealContext.lastValidBidTeam === getTeamForPosition(this.nPosition)) return false;

    const nBid = this.dealContext.lastValidBid;
    if (!isBid(nBid)) return false;

    const numTricksRequired = 8 - bidLevel(nBid);
    let numLikelyTricks = 0;
    const nTrumpSuit = bidSuit(nBid);

    if (isSuit(nTrumpSuit)) {
      const trumpSuit = this.hand.getSuit(nTrumpSuit);
      const numTrumps = trumpSuit.length;
      if (trumpSuit.hasCardOfFaceValue(ACE)) numLikelyTricks++;
      if (numTrumps >= 2 && trumpSuit.hasCardOfFaceValue(KING)) numLikelyTricks++;
      if (numTrumps >= 3 && trumpSuit.hasCardOfFaceValue(QUEEN)) numLikelyTricks++;
      if (numTrumps >= 4 && trumpSuit.hasCardOfFaceValue(JACK)) numLikelyTricks++;
      numLikelyTricks += Math.max(0, numTrumps - 5);
    }

    for (let i = 0; i < 4; i++) {
      if (i === nTrumpSuit) continue;
      numLikelyTricks += Math.trunc(this.hand.getSuit(i as Suit).quickTricks);
    }

    if (numLikelyTricks >= numTricksRequired + 1) {
      this.status?.stream(
        `2TSTDBL4! But upon reconsideration, we have at least ${numLikelyTricks} likely tricks in the hand, so we can double for penalties.\n`,
      );
      return true;
    }
    return false;
  }

  testForRedouble(): boolean {
    if (!this.dealContext || this.dealContext.contractModifier !== 1) return false;
    return false;
  }

  calcNoTrumpPoints(): void {
    const status = this.status;
    if (!this.hand) return;

    const nPreviousBid = this.m_nBid;
    const nPreviousBidLevel = isBid(nPreviousBid) ? bidLevel(nPreviousBid) : 0;
    const nPreviousSuit = isBid(nPreviousBid) ? bidSuit(nPreviousBid) : NONE;
    const nPartnersBid = this.partner?.inquireLastBid() ?? this.nPartnersBid;
    const szPB = bidToFullString(nPartnersBid);
    const szPVB = bidToFullString(nPreviousBid);
    const fPts = this.hand.totalPoints;
    const fCardPts = this.hand.highCardPoints;

    const bInitialResponse = (this.partner?.getNumBidsMade() ?? 0) === 1;

    let fMin = fCardPts;
    if (nPreviousSuit === Suit.NoTrump && this.m_bOpenedBiddingForTeam) {
      switch (nPreviousBid) {
        case Bid.NT1:
          fMin = this.conventionSet.getNTRangeMin(1);
          break;
        case Bid.NT2:
          fMin = this.conventionSet.getNTRangeMin(2);
          break;
        case Bid.NT3:
          fMin = this.conventionSet.getNTRangeMin(3);
          break;
        default:
          fMin = fCardPts;
          break;
      }
    }

    if (nPreviousSuit === Suit.NoTrump) {
      switch (nPartnersBid) {
        case Bid.NT2:
          this.m_fPartnersMin = PTS_NT_GAME - 2 - fMin;
          this.m_fPartnersMax = PTS_NT_GAME - 1 - fMin;
          break;
        case Bid.NT3:
          this.m_fPartnersMin = PTS_NT_GAME - fMin;
          this.m_fPartnersMax = 30 - fMin;
          break;
        case Bid.NT4:
          this.m_bInvitedToSlam = true;
          this.m_fPartnersMin = PTS_SMALL_SLAM - 2 - fMin;
          this.m_fPartnersMax = PTS_SMALL_SLAM - 1 - fMin;
          break;
        case Bid.NT5:
          this.m_bInvitedToSlam = true;
          this.m_fPartnersMin = PTS_GRAND_SLAM - 2 - fMin;
          this.m_fPartnersMax = PTS_GRAND_SLAM - 1 - fMin;
          break;
        case Bid.NT6:
          this.m_fPartnersMin = PTS_SMALL_SLAM - fMin;
          this.m_fPartnersMax = PTS_SMALL_SLAM + 1 - fMin;
          break;
        case Bid.NT7:
          this.m_fPartnersMin = PTS_GRAND_SLAM - fMin;
          this.m_fPartnersMax = 40 - fMin;
          break;
      }
      this.m_fMinTPPoints = this.m_fMinTPCPoints = fCardPts + this.m_fPartnersMin;
      this.m_fMaxTPPoints = this.m_fMaxTPCPoints = fCardPts + this.m_fPartnersMax;
      status?.stream(
        `2NT10! Partner's raise from our ${szPVB} to ${szPB} indicates a balanced hand and ${this.m_fPartnersMin}-${this.m_fPartnersMax} HCPs, for a total of ${this.m_fMinTPCPoints}+ HCPs in the partnership${this.m_bInvitedToSlam ? ' and is invitational to slam.' : '.'}\n`,
      );
    } else if (nPartnersBid === Bid.NT2 && nPreviousBidLevel === 1) {
      if (bInitialResponse) {
        this.m_fPartnersMin = 13;
        this.m_fPartnersMax = 14;
      } else {
        this.m_fPartnersMin = 17;
        this.m_fPartnersMax = 19;
      }
      this.m_fMinTPPoints = fPts + this.m_fPartnersMin;
      this.m_fMaxTPPoints = fPts + this.m_fPartnersMax;
      this.m_fMinTPCPoints = fCardPts + this.m_fPartnersMin;
      this.m_fMaxTPCPoints = fCardPts + this.m_fPartnersMax;
      this.m_bGameForceActive = true;
      status?.stream(
        `2NT42! Partner's jump shift from our ${szPVB} bid to ${szPB} indicates a balanced hand and ${this.m_fPartnersMin}+ points, for a total of ${this.m_fMinTPPoints}+ points in the partnership, and is forcing to game.\n`,
      );
    } else if (nPartnersBid === Bid.NT2 && nPreviousBidLevel === 2) {
      if (bInitialResponse) {
        this.m_fPartnersMin = 6;
        this.m_fPartnersMax = 18;
      } else {
        this.m_fPartnersMin = 15;
        this.m_fPartnersMax = 18;
      }
      this.m_fMinTPPoints = fPts + this.m_fPartnersMin;
      this.m_fMaxTPPoints = fPts + this.m_fPartnersMax;
      this.m_fMinTPCPoints = fCardPts + this.m_fPartnersMin;
      this.m_fMaxTPCPoints = fCardPts + this.m_fPartnersMax;
      this.m_bGameForceActive = true;
      status?.stream(
        `2NT43! Partner's shift from our ${szPVB} bid to ${szPB} indicates a balanced hand and ${this.m_fPartnersMin}+ points, for a total of ${this.m_fMinTPPoints}+ points in the partnership.\n`,
      );
    } else if (nPartnersBid === Bid.NT3 && nPreviousBidLevel === 1) {
      if (bInitialResponse) {
        this.m_fPartnersMin = 15;
        this.m_fPartnersMax = 18;
      } else {
        this.m_fPartnersMin = 19;
        this.m_fPartnersMax = 22;
      }
      this.m_fMinTPPoints = fPts + this.m_fPartnersMin;
      this.m_fMaxTPPoints = fPts + this.m_fPartnersMax;
      this.m_fMinTPCPoints = fCardPts + this.m_fPartnersMin;
      this.m_fMaxTPCPoints = fCardPts + this.m_fPartnersMax;
      this.m_bGameForceActive = true;
      status?.stream(
        `2NT44! Partner's jump shift from our ${szPVB} bid to ${szPB} indicates a balanced hand and ${this.m_fPartnersMin}+ points, for a total of ${this.m_fMinTPPoints}+ points in the partnership.\n`,
      );
    } else if (nPartnersBid === Bid.NT3 && nPreviousBidLevel === 2) {
      this.m_fPartnersMin = 15;
      this.m_fPartnersMax = 22;
      this.m_fMinTPPoints = fPts + this.m_fPartnersMin;
      this.m_fMaxTPPoints = fPts + this.m_fPartnersMax;
      this.m_fMinTPCPoints = fCardPts + this.m_fPartnersMin;
      this.m_fMaxTPCPoints = fCardPts + this.m_fPartnersMax;
      this.m_bGameForceActive = true;
      status?.stream(
        `2NT45! Partner's jump shift from our ${szPVB} bid to ${szPB} indicates a balanced hand and ${this.m_fPartnersMin}+ points, for a total of ${this.m_fMinTPCPoints}/${this.m_fMinTPCPoints}+ points in the partnership.\n`,
      );
    } else if (nPartnersBid === Bid.NT3 && nPreviousBidLevel === 3) {
      this.m_fPartnersMin = 12;
      this.m_fPartnersMax = 22;
      this.m_fMinTPPoints = fPts + this.m_fPartnersMin;
      this.m_fMaxTPPoints = fPts + this.m_fPartnersMax;
      this.m_fMinTPCPoints = fCardPts + this.m_fPartnersMin;
      this.m_fMaxTPCPoints = fCardPts + this.m_fPartnersMax;
      status?.stream(
        `2NT50! Partner's shift from our ${szPVB} bid to ${szPB} indicates a balanced hand and ${this.m_fPartnersMin}+ points, for a total of ${this.m_fMinTPPoints}+ points in the partnership.\n`,
      );
    } else {
      status?.stream(
        `1NT99! We don't understand the point of partner's raise from our ${szPVB} bid to ${szPB}, so pass.\n`,
      );
    }
  }

  isBidSafe(nBid: Bid, fAdjustment = 0): boolean {
    if (!isBid(nBid)) return true;
    const nLevel = bidLevel(nBid);
    if (bidSuit(nBid) === Suit.NoTrump) {
      const fPoints = this.m_fMinTPCPoints + fAdjustment;
      if (
        (nLevel === 1 && fPoints < 16) ||
        (nLevel === 2 && fPoints < 20) ||
        (nLevel === 3 && fPoints < PTS_GAME - 2 + 1) ||
        (nLevel === 4 && fPoints < PTS_MAJOR_GAME + 1) ||
        (nLevel === 5 && fPoints < PTS_MINOR_GAME + 1) ||
        (nLevel === 6 && fPoints < PTS_SMALL_SLAM + 1) ||
        (nLevel === 7 && fPoints < PTS_GRAND_SLAM + 1)
      )
        return false;
      return true;
    } else {
      const fPoints = this.m_fMinTPPoints + fAdjustment;
      if (
        (nLevel === 1 && fPoints < 16) ||
        (nLevel === 2 && fPoints < 20) ||
        (nLevel === 3 && fPoints < PTS_GAME - 2) ||
        (nLevel === 4 && fPoints < PTS_MAJOR_GAME) ||
        (nLevel === 5 && fPoints < PTS_MINOR_GAME) ||
        (nLevel === 6 && fPoints < PTS_SMALL_SLAM) ||
        (nLevel === 7 && fPoints < PTS_GRAND_SLAM)
      )
        return false;
      return true;
    }
  }

  //
  // Convention status & parameter map methods
  //
  setConventionStatus(convention: Convention, code: number): void {
    if (this.m_bInTestBiddingMode) return;
    this.conventionStatusMap.set(convention, code);
    if (code > 0) {
      this.m_pActiveConvention = convention;
    } else if (convention === this.m_pActiveConvention) {
      this.m_pActiveConvention = null;
    }
  }

  getConventionStatus(conventionOrId: Convention | ConventionId | number): number {
    if (typeof conventionOrId === 'number') {
      for (const [conv, status] of this.conventionStatusMap.entries()) {
        if (conv.id === conventionOrId) return status;
      }
      return ConventionStatus.Inactive;
    }
    return this.conventionStatusMap.get(conventionOrId) ?? 0;
  }

  clearConventionStatus(convention: Convention | null = null): void {
    if (convention) {
      this.conventionStatusMap.set(convention, ConventionStatus.Inactive);
      this.conventionParamMap.set(convention, 0);
      if (this.m_pActiveConvention === convention) this.m_pActiveConvention = null;
    } else {
      for (const conv of this.conventionStatusMap.keys()) {
        this.conventionStatusMap.set(conv, ConventionStatus.Inactive);
      }
      this.m_pActiveConvention = null;
    }
  }

  setConventionParameter(convention: Convention, parameter: number): void {
    this.conventionParamMap.set(convention, parameter);
  }

  getConventionParameter(convention: Convention): number {
    return this.conventionParamMap.get(convention) ?? 0;
  }

  clearConventionParameter(convention: Convention): void {
    this.conventionParamMap.set(convention, 0);
  }

  setActiveConvention(convention: Convention | null): void {
    this.m_pActiveConvention = convention;
  }

  getActiveConvention(): Convention | null {
    return this.m_pActiveConvention;
  }

  setBid(nBid: Bid): void {
    this.m_nBid = nBid;
  }

  setAgreedSuit(nSuit: Suit | typeof NONE): void {
    this.m_nAgreedSuit = nSuit;
  }

  get nLastValidBid(): Bid {
    return this.getLastValidBid();
  }

  pointCount(pts: number): number {
    return pts;
  }

  SLTS(suit: Suit | typeof NONE): string {
    return this.supportLevelToString(suit);
  }

  getValidBidRecord(index: number): Bid {
    if (this.dealContext?.getValidBidRecord) {
      return this.dealContext.getValidBidRecord(index);
    }
    if (!this.dealContext) return Bid.Pass;
    let validCount = 0;
    for (let i = 0; i < this.dealContext.numBidsMade; i++) {
      const b = this.dealContext.getBidByIndex(i);
      if (isBid(b)) {
        if (validCount === index) return b;
        validCount++;
      }
    }
    return Bid.Pass;
  }

  getNumValidBidsMade(): number {
    if (this.dealContext?.numValidBidsMade !== undefined) {
      return this.dealContext.numValidBidsMade;
    }
    if (!this.dealContext) return 0;
    let validCount = 0;
    for (let i = 0; i < this.dealContext.numBidsMade; i++) {
      if (isBid(this.dealContext.getBidByIndex(i))) validCount++;
    }
    return validCount;
  }

  getOpeningBid(): Bid {
    if (this.dealContext?.openingBid !== undefined) {
      return this.dealContext.openingBid;
    }
    return this.getValidBidRecord(0);
  }

  getOpeningBidder(): Position {
    if (this.dealContext?.openingBidder !== undefined) {
      return this.dealContext.openingBidder;
    }
    if (!this.dealContext) return Position.Unknown;
    let pos = this.dealContext.dealer;
    for (let i = 0; i < this.dealContext.numBidsMade; i++) {
      const b = this.dealContext.getBidByIndex(i);
      if (isBid(b)) return pos;
      pos = nextPosition(pos);
    }
    return Position.Unknown;
  }

  playingConvention(conventionId: ConventionId): boolean {
    return this.conventionSet.isConventionEnabled(conventionId);
  }

  invokeBlackwood(eventualSuit: Suit): boolean {
    if (this.hand && this.status) {
      return this.pool.blackwood.invokeBlackwood(this.hand, this, this.status, eventualSuit);
    }
    this.m_nAgreedSuit = eventualSuit;
    this.m_nIntendedSuit = eventualSuit;
    if (this.playingConvention(ConventionId.Blackwood) && this.getLastValidBid() < Bid.NT4) {
      this.m_nBid = Bid.NT4;
      this.status?.stream(
        `BK10! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership, invoke Blackwood (4NT) for ${Card.suitToString(eventualSuit)}.\n`,
      );
      return true;
    }
    const level = this.m_fMinTPPoints >= PTS_GRAND_SLAM ? 7 : 6;
    this.m_nBid = makeBid(eventualSuit, level);
    return true;
  }

  tryCueBid(): boolean {
    if (!this.playingConvention(ConventionId.CueBids)) return false;
    if (this.hand && this.status) {
      return this.pool.cueBids.tryCueBid(this.hand, this, this.status);
    }
    return false;
  }

  //
  //==========================================================================
  //
  // BiddingGeneral.cpp Stateful Methods
  //
  //==========================================================================
  //

  respondToTripleRaiseEngine(): Bid {
    const status = this.status;
    if (this.m_nAgreedSuit === NONE && isSuit(this.nPreviousSuit)) {
      this.m_nAgreedSuit = this.nPreviousSuit;
    }

    this.m_fPartnersMin = Math.max(this.m_fPartnersMin, 6);
    this.m_fPartnersMax = Math.max(this.m_fPartnersMax, 9);
    status?.stream(
      `2Q00! With a triple raise, partner is showing 5 trumps and ${this.m_fPartnersMin}-${this.m_fPartnersMax} HCPs, and expects us to sign off at game.\n`,
    );

    const adjPts = isSuit(this.m_nAgreedSuit)
      ? this.hand!.revalueHand(REVALUE_DECLARER, this.m_nAgreedSuit, true)
      : this.fPts;
    this.fAdjPts = adjPts;
    this.m_fMinTPPoints = adjPts + this.m_fPartnersMin;
    this.m_fMaxTPPoints = adjPts + this.m_fPartnersMax;
    this.m_fMinTPCPoints = this.fCardPts + this.m_fPartnersMin;
    this.m_fMaxTPCPoints = this.fCardPts + this.m_fPartnersMax;

    if (this.m_fMinTPPoints < PTS_SLAM) {
      this.m_nBid = Bid.Pass;
      status?.stream(
        `Q10! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total partnership points, we have to agree and pass.\n`,
      );
      return this.validateBid(this.m_nBid);
    }

    if (this.nPartnersBid < Bid.NT4 && isSuit(this.m_nAgreedSuit)) {
      this.invokeBlackwood(this.m_nAgreedSuit);
    } else if (isSuit(this.m_nAgreedSuit)) {
      if (this.m_fMinTPPoints >= PTS_GRAND_SLAM && this.nPartnersBidLevel <= 6) {
        this.m_nBid = makeBid(this.m_nAgreedSuit, 7);
        status?.stream(
          `Q20! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total partnership points, we can bid a grand slam at ${bidToFullString(this.m_nBid)}.\n`,
        );
      } else if (this.nPartnersBidLevel < 6) {
        this.m_nBid = makeBid(this.m_nAgreedSuit, 6);
        status?.stream(
          `Q21! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total partnership points, we can bid a small slam at ${bidToFullString(this.m_nBid)}.\n`,
        );
      } else {
        this.m_nBid = Bid.Pass;
        status?.stream(
          `Q22! And with ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total partnership points, we sign off on partner's ${this.szPB} slam attempt.\n`,
        );
      }
    }
    return this.validateBid(this.m_nBid);
  }

  respondToSingleRaiseEngine(nPartnersBid: Bid): Bid {
    const status = this.status;
    if (this.m_nAgreedSuit === NONE && isSuit(this.nPreviousSuit)) {
      this.m_nAgreedSuit = this.nPreviousSuit;
    }

    this.m_fPartnersMin = Math.max(this.m_fPartnersMin, 6);
    this.m_fPartnersMax = Math.max(this.m_fPartnersMax, 10);
    status?.stream(
      `RDR0! With a single raise, partner is showing ${this.m_fPartnersMin}-${this.m_fPartnersMax} points and decent (3-4 card) support for our ${isSuit(this.m_nAgreedSuit) ? Card.suitToSingularString(this.m_nAgreedSuit) : ''} suit.\n`,
    );
    const nTricks = this.countModifiedPlayingTricks(this.m_nAgreedSuit);

    const adjPts = isSuit(this.m_nAgreedSuit)
      ? this.hand!.revalueHand(REVALUE_DECLARER, this.m_nAgreedSuit, true)
      : this.fPts;
    this.fAdjPts = adjPts;
    this.m_fMinTPPoints = adjPts + this.m_fPartnersMin;
    this.m_fMaxTPPoints = adjPts + this.m_fPartnersMax;
    this.m_fMinTPCPoints = this.fCardPts + this.m_fPartnersMin;
    this.m_fMaxTPCPoints = this.fCardPts + this.m_fPartnersMax;

    // 18-22 pts: pass
    if (this.m_fMinTPPoints <= PTS_GAME - 4) {
      this.m_nBid = Bid.Pass;
      if (nPartnersBid > this.nOpponentsBid)
        status?.stream(
          `RDR2! We have a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership, which is not enough for game, so settle for a part score and pass.\n`,
        );
      else
        status?.stream(
          `RDR2a! We have a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership, which is not enough for a further raise, so pass.\n`,
        );
      return this.validateBid(this.m_nBid);
    }

    // 23-25 pts
    if (this.m_fMinTPPoints >= PTS_GAME - 4 && this.m_fMinTPPoints < PTS_GAME) {
      if (this.isGameBid(nPartnersBid)) {
        this.m_nBid = Bid.Pass;
        if (nPartnersBid > this.nOpponentsBid)
          status?.stream(`RDR4! With a game contract reached at ${this.szPB}, we pass.\n`);
        else
          status?.stream(
            'RDR4! With insufficient strength to raise partner any further, we have to pass.\n',
          );
        return this.validateBid(this.m_nBid);
      }

      if (this.nPartnersBidLevel >= 3) {
        this.m_nBid = Bid.Pass;
        status?.stream(
          `RDR5! With a total of only ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership, we have to pass partners's  ${bidToFullString(nPartnersBid)} bid.\n`,
        );
        return this.validateBid(this.m_nBid);
      }

      if (nTricks < 6) {
        this.m_nBid = Bid.Pass;
        status?.stream(
          `R08! Using the modified trick count, we have only ${nTricks} playing tricks in hand and a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership, so pass.\n`,
        );
        return this.validateBid(this.m_nBid);
      } else if (nTricks < 7) {
        const suit = this.getNextBestSuit(this.m_nAgreedSuit);
        this.m_nBid = this.getCheapestShiftBid(suit);
        status?.stream(
          `R14! Using the modified trick count, we have ${nTricks} playing tricks in hand and a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership, so show the ${Card.suitToSingularString(suit)} support suit in a bid of ${bidToFullString(this.m_nBid)}.\n`,
        );
        return this.validateBid(this.m_nBid);
      } else if (isSuit(this.m_nAgreedSuit) && isMajor(this.m_nAgreedSuit)) {
        this.m_nBid = makeBid(this.m_nAgreedSuit, 3);
        status?.stream(
          `R18! Using the modified trick count, we have ${nTricks} playing tricks in hand and a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints}points in the partnership, so invite game with a bid of ${bidToFullString(this.m_nBid)}.\n`,
        );
        return this.validateBid(this.m_nBid);
      }
    }

    // 26-32 pts
    if (this.m_fMinTPPoints >= PTS_GAME && this.m_fMinTPPoints < PTS_SLAM) {
      if (this.isGameBid(nPartnersBid)) {
        this.m_nBid = Bid.Pass;
        status?.stream(`R21! With a game contract reached at ${this.szPB}, we pass.\n`);
        return this.validateBid(this.m_nBid);
      }
      if (isSuit(this.m_nAgreedSuit) && isMajor(this.m_nAgreedSuit)) {
        this.m_nBid = makeBid(this.m_nAgreedSuit, 4);
        status?.stream(
          `R22! We have a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership, which should be enough for game, so ${this.nPartnersBidLevel === 2 ? 'jump to ' : 'bid '}${bidToFullString(this.m_nBid)}.\n`,
        );
        return this.validateBid(this.m_nBid);
      }

      if (
        this.m_fMinTPCPoints >= PTS_NT_GAME &&
        this.nPartnersBidLevel <= 3 &&
        isSuit(this.m_nAgreedSuit) &&
        this.hand!.allOtherSuitsStopped(this.m_nAgreedSuit)
      ) {
        this.m_nBid = Bid.NT3;
        status?.stream(
          `R24! We have a total of approx. ${this.m_fMinTPCPoints}-${this.m_fMaxTPCPoints} HCPs in the partnership and all unbid suits stopped, we can bid game at ${bidToFullString(this.m_nBid)}.\n`,
        );
        return this.validateBid(this.m_nBid);
      }

      if (this.m_fMinTPPoints < PTS_MINOR_GAME) {
        if (this.nPartnersBidLevel < 3) {
          const suit = this.getNextBestSuit(this.m_nAgreedSuit);
          this.m_nBid = this.getCheapestShiftBid(suit);
          status?.stream(
            `R26! We have a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership for a minor suit, so show the ${Card.suitToSingularString(suit)} support suit in a bid of ${bidToFullString(this.m_nBid)}.\n`,
          );
        } else {
          this.m_nBid = Bid.Pass;
          status?.stream(
            `R27! We have a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership, which is not quite enough for game in a minor suit, so pass.\n`,
          );
        }
        return this.validateBid(this.m_nBid);
      }

      if (isSuit(this.m_nAgreedSuit)) {
        this.m_nBid = makeBid(this.m_nAgreedSuit, 5);
        status?.stream(
          `R30! We have a total of ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership for a minor suit, so ${this.nPartnersBidLevel <= 3 ? 'jump to a game bid of ' : 'bid game at '}${bidToFullString(this.m_nBid)}.\n`,
        );
        return this.validateBid(this.m_nBid);
      }
    }

    // 33+ TPs: try for slam
    status?.stream(
      `R40! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership, we want to explore slam possibilities.\n`,
    );

    if (this.numAces === 4 && isSuit(this.m_nAgreedSuit)) {
      this.invokeBlackwood(this.m_nAgreedSuit);
      return this.validateBid(this.m_nBid);
    } else if (this.tryCueBid()) {
      return this.validateBid(this.m_nBid);
    } else if (isSuit(this.m_nAgreedSuit)) {
      this.m_nBid = makeBid(this.m_nAgreedSuit, 5);
      status?.stream(
        `R60! But since we cannot make a cue bid, make a slam invitation at ${bidToFullString(this.m_nBid)}.\n`,
      );
      return this.validateBid(this.m_nBid);
    }
    return this.validateBid(Bid.Pass);
  }

  respondToDoubleRaiseEngine(nPartnersBid: Bid): Bid {
    const status = this.status;
    if (this.m_nAgreedSuit === NONE && isSuit(this.nPreviousSuit)) {
      this.m_nAgreedSuit = this.nPreviousSuit;
    }

    if (this.playingConvention(ConventionId.LimitRaises)) {
      this.m_fPartnersMin = Math.max(this.m_fPartnersMin, 11);
      this.m_fPartnersMax = Math.max(this.m_fPartnersMax, 12);
      status?.stream(
        `2S00! With a double raise and playing limit raises, partner is showing ${this.m_fPartnersMin}-${this.m_fPartnersMax} points and 4+ card support for our ${isSuit(this.m_nAgreedSuit) ? Card.suitToSingularString(this.m_nAgreedSuit) : ''} suit.\n`,
      );
    } else {
      this.m_fPartnersMin = Math.max(this.m_fPartnersMin, 13);
      this.m_fPartnersMax = Math.max(this.m_fPartnersMax, 18);
      if (this.nPartnersPrevBid === Bid.Pass) {
        this.m_fPartnersMax = 13;
        status?.stream(
          `2S01a! With a double raise after passing previously, partner is showing approx. ${this.m_fPartnersMin} points and good 4-card support for our ${isSuit(this.m_nAgreedSuit) ? Card.suitToSingularString(this.m_nAgreedSuit) : ''} suit.\n`,
        );
      } else {
        status?.stream(
          `2S01b! With a double raise, partner is showing ${this.m_fPartnersMin}-${this.m_fPartnersMax} points and good 4-card support for our ${isSuit(this.m_nAgreedSuit) ? Card.suitToSingularString(this.m_nAgreedSuit) : ''} suit${nPartnersBid < this.getGameBid(this.m_nAgreedSuit) ? '.  The bid is forcing to game.' : '.'}\n`,
        );
      }
    }

    const adjPts = isSuit(this.m_nAgreedSuit)
      ? this.hand!.revalueHand(REVALUE_DECLARER, this.m_nAgreedSuit, true)
      : this.fPts;
    this.fAdjPts = adjPts;
    this.m_fMinTPPoints = adjPts + this.m_fPartnersMin;
    this.m_fMaxTPPoints = adjPts + this.m_fPartnersMax;
    this.m_fMinTPCPoints = this.fCardPts + this.m_fPartnersMin;
    this.m_fMaxTPCPoints = this.fCardPts + this.m_fPartnersMax;

    if (this.m_fMinTPPoints <= PTS_MINOR_GAME + 1) {
      if (this.isGameBid(nPartnersBid)) {
        if (this.nPartnersBidLevel < 6) {
          this.m_nBid = Bid.Pass;
          if (nPartnersBid > this.nOpponentsBid)
            status?.stream(`S01! With a game contract reached at ${this.szPB}, we pass.\n`);
          else
            status?.stream("S01a! We can't raise partner's bid beyond game, so pass.\n");
        } else {
          this.m_nBid = Bid.Pass;
          if (nPartnersBid > this.nOpponentsBid)
            status?.stream(`S02! With a slam contract reached at ${this.szPB}, we pass.\n`);
          else
            status?.stream("S02a! We can't raise partner's bid beyond game, so pass.\n");
        }
        return this.validateBid(this.m_nBid);
      } else {
        if (isSuit(this.m_nAgreedSuit) && isMajor(this.m_nAgreedSuit)) {
          if (this.m_fMinTPPoints >= PTS_GAME && this.nPartnersBidLevel < 4) {
            this.m_nBid = makeBid(this.m_nAgreedSuit, 4);
            status?.stream(
              `S10! We have ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership, so bid${this.m_fMinTPPoints >= PTS_GAME ? ' game at ' : ' '}${bidToFullString(this.m_nBid)}.\n`,
            );
          } else {
            this.m_nBid = Bid.Pass;
            status?.stream(
              `S11! We have ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership, which is insufficient for a higher contract than the ${this.szPB} bid by partner, so pass.\n`,
            );
          }
          return this.validateBid(this.m_nBid);
        }

        if (
          this.numVoids === 0 &&
          this.numSingletons === 0 &&
          this.m_fMinTPCPoints >= PTS_NT_GAME &&
          this.nPartnersBidLevel <= 3 &&
          isSuit(this.m_nAgreedSuit) &&
          this.hand!.allOtherSuitsStopped(this.m_nAgreedSuit)
        ) {
          this.m_nBid = Bid.NT3;
          status?.stream(
            `S14! With approx. ${this.m_fMinTPCPoints}-${this.m_fMaxTPCPoints} HCPs in the partnership and all unbid suits stopped, bid ${bidToFullString(this.m_nBid)} over the raised minor ${Card.suitToSingularString(this.m_nAgreedSuit)} suit.\n`,
          );
          return this.validateBid(this.m_nBid);
        }

        if (this.m_fMinTPPoints < PTS_MINOR_GAME - 3) {
          this.m_nBid = Bid.Pass;
          status?.stream(
            `S16! We have only ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership for a minor suit, so pass.\n`,
          );
          return this.validateBid(this.m_nBid);
        }

        if (this.m_fMinTPPoints < PTS_MINOR_GAME) {
          if (this.nPartnersBidLevel < 4) {
            const nSuit = this.getNextBestSuit(this.m_nAgreedSuit);
            this.m_nBid = this.getCheapestShiftBid(nSuit);
            status?.stream(
              `S18! We have ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership for a minor suit, so show the ${Card.suitToSingularString(nSuit)} support suit in a bid of ${bidToFullString(this.m_nBid)}.\n`,
            );
          } else {
            status?.stream(
              `S18a! We have ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership for a minor suit, so we'd like to show a support suit and push towards game, but we're already at too high a level, so we have to pass.\n`,
            );
            this.m_nBid = Bid.Pass;
          }
          return this.validateBid(this.m_nBid);
        }

        if (this.m_fMinTPPoints >= PTS_MINOR_GAME && isSuit(this.m_nAgreedSuit)) {
          if (this.nPartnersBidLevel <= 4) {
            this.m_nBid = makeBid(this.m_nAgreedSuit, 5);
            status?.stream(
              `S22! We have ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership for a minor suit, so ${this.nPartnersBidLevel <= 3 ? 'jump to a game bid of ' : 'bid game at '}${bidToFullString(this.m_nBid)}.\n`,
            );
          } else {
            this.m_nBid = Bid.Pass;
            status?.stream(
              `S23! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership, accept partner's ${this.szPB} bid and pass.\n`,
            );
          }
          return this.validateBid(this.m_nBid);
        }
      }
    }

    status?.stream(
      `S40! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points in the partnership, we want to explore slam possibilities.\n`,
    );

    let numOutsideAces = 0;
    for (let i = 0; i < 4; i++) {
      if (i !== this.m_nAgreedSuit && this.hand!.suitHasAce(i as Suit)) numOutsideAces++;
    }

    if ((this.numAces === 4 || numOutsideAces === 0) && isSuit(this.m_nAgreedSuit)) {
      this.invokeBlackwood(this.m_nAgreedSuit);
      return this.validateBid(this.m_nBid);
    } else if (this.tryCueBid()) {
      return this.validateBid(this.m_nBid);
    } else if (isSuit(this.m_nAgreedSuit)) {
      this.m_nBid = makeBid(this.m_nAgreedSuit, 5);
      status?.stream(
        `S60! But since we cannot make a cue bid, make a slam invitation at ${bidToFullString(this.m_nBid)}.\n`,
      );
      return this.validateBid(this.m_nBid);
    }
    return this.validateBid(Bid.Pass);
  }

  rebidSuitEngine(
    nSuitType: number,
    enShiftLevel: RebidTarget | ShiftTarget | number = RebidTarget.Cheapest,
    fMinPts = 0,
    fMaxPts = 99,
    enLength: SuitLength | number = SuitLength.Four,
    nStrength: number = SuitStrength.Openable,
    numHonors = 0,
    numHonorPts = 0,
  ): boolean {
    if (!this.hand) return false;
    const nShiftLevel = enShiftLevel as number;
    const nLength = enLength as number;
    let maxPts = fMaxPts === 0 ? 99 : fMaxPts;

    const nPartnersBid = this.partner?.inquireLastBid() ?? this.nPartnersBid;
    const nPartnersSuit = isBid(nPartnersBid) ? bidSuit(nPartnersBid) : NONE;

    let nSuit: Suit | typeof NONE;
    if (nSuitType === SuitType.Preferred) {
      nSuit = this.nPrefSuit;
    } else if (nSuitType <= SUIT_DIRECT) {
      nSuit = -(nSuitType + 10) as Suit;
    } else {
      nSuit = this.nPreviousSuit;
      if (nSuit === Suit.NoTrump) nSuit = this.nFirstRoundSuit;
      if (nSuitType === SuitType.Major && !isMajor(nSuit)) return false;
      if (nSuitType === SuitType.Minor && !isMinor(nSuit)) return false;
    }
    if (!isSuit(nSuit)) return false;

    if (fMinPts >= 0) {
      if (this.m_fMinTPPoints < fMinPts || this.m_fMinTPPoints > maxPts) return false;
    } else {
      if (fMaxPts === 0) maxPts = -99;
      if (this.hand.totalPoints < -fMinPts || this.hand.totalPoints > -maxPts) return false;
    }

    const bSolidRqmt = (nStrength & SuitStrength.Solid) !== 0;
    const bSelfSupportRqmt = (nStrength & SuitStrength.SelfSupporting) !== 0;
    const baseStrength = nStrength & ~(SuitStrength.Solid | SuitStrength.SelfSupporting);

    if (
      this.numCardsInSuit[nSuit] < nLength ||
      this.nSuitStrength[nSuit] < baseStrength ||
      this.numHonorsInSuit[nSuit] < numHonors ||
      this.numSuitPoints[nSuit] < numHonorPts
    )
      return false;

    if (bSelfSupportRqmt && !this.hand.isSuitSelfSupporting(nSuit)) return false;
    if (bSolidRqmt && !this.hand.isSuitSolid(nSuit)) return false;

    let nBid: Bid;
    if (nShiftLevel === 0) nBid = this.getCheapestShiftBid(nSuit);
    else if (nShiftLevel > 0) nBid = this.getJumpShiftBid(nSuit, nPartnersBid, nShiftLevel);
    else nBid = makeBid(nSuit, -nShiftLevel);

    if (nBid <= this.getLastValidBid()) return false;
    this.m_nBid = nBid;

    if (nPartnersSuit === nSuit) {
      this.status?.stream(
        `YR1! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points and a ${this.suitStrengthToString(nSuit)} ${this.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit (holding ${this.suitHoldingsToString(nSuit)}), re-raise it to ${bidToFullString(this.m_nBid)}.\n`,
      );
    } else {
      this.status?.stream(
        `YR2! With With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} total points and a ${this.suitStrengthToString(nSuit)} ${this.numCardsInSuit[nSuit]}-card ${Card.suitToSingularString(nSuit)} suit (holding ${this.suitHoldingsToString(nSuit)}), ${nShiftLevel > 0 ? 'jump rebid' : 'rebid'} it at ${bidToFullString(this.m_nBid)}.\n`,
      );
    }

    this.m_nAgreedSuit = NONE;
    return true;
  }

  bidNextBestSuitEngine(
    _nSuitType: number,
    enShiftLevel: ShiftTarget | RebidTarget | number = ShiftTarget.Cheapest,
    fMinPts = 0,
    fMaxPts = 99,
    enLength: SuitLength | number = SuitLength.Four,
    nStrength: number = SuitStrength.Openable,
    numHonors = 0,
    numHonorPts = 0,
    nSuit1: Suit | typeof NONE = NONE,
    nSuit2: Suit | typeof NONE = NONE,
    nSuit3: Suit | typeof NONE = NONE,
  ): boolean {
    if (!this.hand) return false;
    const nShiftLevel = enShiftLevel as number;
    const nLength = enLength as number;
    let maxPts = fMaxPts === 0 ? 99 : fMaxPts;

    const nPreviousBid = this.m_nBid;
    const nPreviousSuit = isBid(nPreviousBid) ? bidSuit(nPreviousBid) : NONE;
    let nSuit: Suit;
    if (nSuit3 > NONE) {
      nSuit = this.getFourthSuit(nSuit1, nSuit2, nSuit3);
    } else if (nSuit2 > NONE) {
      nSuit = this.getNextBestSuit(nSuit1, nSuit2);
    } else {
      const s1 = nPreviousSuit;
      const s2 = this.nPartnersSuit === Suit.NoTrump ? this.nPartnersPrevSuit : this.nPartnersSuit;
      nSuit = this.getNextBestSuit(s1, s2);
    }

    const nPartnersBid = this.partner?.inquireLastBid() ?? this.nPartnersBid;
    if (fMinPts >= 0) {
      if (this.m_fMinTPPoints < fMinPts || this.m_fMinTPPoints > maxPts) return false;
    } else {
      if (fMaxPts === 0) maxPts = -99;
      if (this.hand.totalPoints < -fMinPts || this.hand.totalPoints > -maxPts) return false;
    }

    if (
      this.numCardsInSuit[nSuit] >= nLength &&
      this.nSuitStrength[nSuit] >= nStrength &&
      this.numHonorsInSuit[nSuit] >= numHonors &&
      this.numSuitPoints[nSuit] >= numHonorPts
    ) {
      let candidate: Bid;
      if (nShiftLevel === 0) candidate = this.getCheapestShiftBid(nSuit);
      else if (nShiftLevel > 0) candidate = this.getJumpShiftBid(nSuit, nPartnersBid, nShiftLevel);
      else candidate = makeBid(nSuit, -nShiftLevel);

      if (!this.isBidSafe(candidate)) return false;

      this.m_nBid = candidate;
      this.status?.stream(
        `YR4! Rebid the${nPreviousSuit === Suit.NoTrump ? ' ' : ' next '}best suit of ${Card.suitToString(nSuit)} in a ${nShiftLevel > 0 ? 'jump bid' : 'bid'} of ${bidToFullString(this.m_nBid)}.\n`,
      );
      this.m_nAgreedSuit = NONE;
      return true;
    }
    return false;
  }

  raisePartnersSuitEngine(
    nSuitType: number,
    enLevel: EngineRaiseTarget | number,
    fMinPts = 0,
    fMaxPts = 99,
    enLength: SupportLength | number = SupportLength.Len3,
    nStrength: number = SuitStrength.Any,
    numHonors = 0,
    numHonorPts = 0,
  ): boolean {
    if (!this.hand) return false;
    const nLevel = enLevel as number;
    const nLength = enLength as number;
    let maxPts = fMaxPts === 0 ? 99 : fMaxPts;

    let nTargetSuit: Suit | typeof NONE;
    let nPartBidLevel: number;

    if (nSuitType === SuitType.Prev) {
      nTargetSuit = this.nPartnersPrevSuit;
      nPartBidLevel = this.nPartnersPrevBidLevel;
    } else if (nSuitType === SuitType.PrevMajor) {
      nTargetSuit = this.nPartnersPrevSuit;
      if (!isMajor(nTargetSuit)) return false;
      nPartBidLevel = this.nPartnersPrevBidLevel;
    } else if (nSuitType === SuitType.PrevMinor) {
      nTargetSuit = this.nPartnersPrevSuit;
      if (!isMinor(nTargetSuit)) return false;
      nPartBidLevel = this.nPartnersPrevBidLevel;
    } else {
      if (this.nPartnersSuit !== Suit.NoTrump) {
        nTargetSuit = this.nPartnersSuit;
        nPartBidLevel = this.nPartnersBidLevel;
      } else {
        nTargetSuit = this.nPartnersPrevSuit;
        nPartBidLevel = this.nPartnersPrevBidLevel;
      }
    }

    if (nSuitType === SuitType.Major && !isMajor(nTargetSuit)) return false;
    if (nSuitType === SuitType.Minor && !isMinor(nTargetSuit)) return false;
    if (!isSuit(nTargetSuit)) return false;

    if (fMinPts >= 0) {
      if (this.m_fMinTPPoints < fMinPts || this.m_fMinTPPoints > maxPts) return false;
    } else {
      if (fMaxPts === 0) maxPts = -99;
      if (this.hand.totalPoints < -fMinPts || this.hand.totalPoints > -maxPts) return false;
    }

    if (
      this.numCardsInSuit[nTargetSuit] < nLength ||
      this.nSuitStrength[nTargetSuit] < nStrength ||
      this.numHonorsInSuit[nTargetSuit] < numHonors ||
      this.numSuitPoints[nTargetSuit] < numHonorPts
    )
      return false;

    let candidate: Bid;
    if (nLevel >= 1 && nLevel <= 6) {
      const newLevel = nPartBidLevel + nLevel;
      if (newLevel <= 7) candidate = makeBid(nTargetSuit, newLevel);
      else return false;
    } else if (nLevel === EngineRaiseTarget.ToGame) {
      if (isMinor(nTargetSuit)) {
        if (nPartBidLevel < 5) candidate = makeBid(nTargetSuit, 5);
        else return false;
      } else if (isMajor(nTargetSuit)) {
        if (nPartBidLevel < 4) candidate = makeBid(nTargetSuit, 4);
        else return false;
      } else {
        return false;
      }
    } else if (nLevel === EngineRaiseTarget.ToNoMoreThanGame) {
      const newLevel = nPartBidLevel + 1;
      if (isMinor(nTargetSuit) && newLevel <= 5) candidate = makeBid(nTargetSuit, newLevel);
      else if (isMajor(nTargetSuit) && newLevel <= 4) candidate = makeBid(nTargetSuit, newLevel);
      else return false;
    } else if (nLevel <= -2 && nLevel >= -7) {
      const newLevel = -nLevel;
      if (newLevel > nPartBidLevel) candidate = makeBid(nTargetSuit, newLevel);
      else return false;
    } else {
      return false;
    }

    if (bidLevel(candidate) <= this.nPartnersBidLevel) return false;

    this.m_nBid = candidate;
    if (fMinPts < 0) {
      this.status?.stream(
        `YN0! With ${this.fCardPts}/${this.fPts}/${this.fAdjPts} points and ${this.numCardsInSuit[nTargetSuit]}-card support for partner's${nSuitType === SuitType.Prev ? ' earlier ' : ' '}${isMajor(nTargetSuit) ? 'major ' : ' '}${Card.suitToSingularString(nTargetSuit)} suit (holding ${this.suitHoldingsToString(nTargetSuit)}), ${nLevel <= 1 ? 'raise' : 'jump raise'} to ${bidToFullString(this.m_nBid)}.\n`,
      );
    } else {
      this.status?.stream(
        `YN1! With ${this.m_fMinTPPoints}-${this.m_fMaxTPPoints} points in the partnership and ${this.numCardsInSuit[nTargetSuit]}-card support for partner's${nSuitType === SuitType.Prev ? ' earlier ' : ' '}${isMajor(nTargetSuit) ? 'major ' : ' '}${Card.suitToSingularString(nTargetSuit)} suit (holding ${this.suitHoldingsToString(nTargetSuit)}), ${nLevel <= 1 ? 'raise' : 'jump raise'} to ${bidToFullString(this.m_nBid)}.\n`,
      );
    }
    this.m_nAgreedSuit = nTargetSuit;
    return true;
  }

  bidNoTrumpEngine(
    nLevel: number,
    fMinPts: number,
    fMaxPts = 99,
    bMustBeBalanced = true,
    enCode: StoppedCode = StoppedCode.All,
    nSuit: Suit | typeof NONE = NONE,
    bMustHaveNoVoids = true,
  ): boolean {
    if (!this.hand) return false;
    let maxPts = fMaxPts === 0 ? 99 : fMaxPts;

    const candidate = makeBid(Suit.NoTrump, nLevel);
    if (candidate < this.nPartnersBid) return false;

    if (bMustBeBalanced && !this.hand.isSemiBalanced) return false;

    if (enCode === StoppedCode.All) {
      if (this.numSuitsStopped < 4) return false;
    } else if (enCode === StoppedCode.AllOther) {
      let excluded = nSuit;
      if (excluded === NONE) {
        const pb = this.partner?.inquireLastBid() ?? this.nPartnersBid;
        excluded = isBid(pb) ? bidSuit(pb) : NONE;
      }
      if (!this.hand.allOtherSuitsStopped(excluded)) return false;
    } else if (enCode === StoppedCode.One) {
      if (!isSuit(nSuit) || !this.hand.isSuitStopped(nSuit)) return false;
    } else if (enCode === StoppedCode.Unbid) {
      const mustBeStopped = [true, true, true, true];
      if (isSuit(this.nPreviousSuit)) mustBeStopped[this.nPreviousSuit] = false;
      if (isSuit(this.nFirstRoundSuit)) mustBeStopped[this.nFirstRoundSuit] = false;
      if (isSuit(this.nPartnersSuit)) mustBeStopped[this.nPartnersSuit] = false;
      if (isSuit(this.nPartnersPrevSuit)) mustBeStopped[this.nPartnersPrevSuit] = false;
      for (let i = 0; i < 4; i++) {
        if (mustBeStopped[i] && !this.hand.isSuitStopped(i as Suit)) return false;
      }
    }

    if (bMustHaveNoVoids && this.numVoids > 0) return false;
    if (candidate <= this.nPartnersBid) return false;

    if (fMinPts >= 0) {
      if (this.m_fMinTPCPoints < fMinPts || this.m_fMinTPCPoints > maxPts) return false;
    } else {
      if (fMaxPts === 0) maxPts = -99;
      if (this.hand.highCardPoints < -fMinPts || this.hand.highCardPoints > -maxPts) return false;
    }

    this.m_nBid = candidate;
    const stopText =
      this.numSuitsStopped === 4
        ? 'and all suits stopped,'
        : enCode === StoppedCode.Unbid
          ? 'and all unbid suits stopped,'
          : 'though without stoppers in all suits,';

    if (fMinPts < 0) {
      this.status?.stream(
        `BN0! With ${this.fCardPts} HCPs${this.numVoids === 0 ? ' and a reasonably balanced hand, ' : ', '}${stopText} bid ${bidToFullString(this.m_nBid)}.\n`,
      );
    } else {
      this.status?.stream(
        `BN1! With ${this.m_fMinTPCPoints}+ HCPs in the partnership${this.numVoids === 0 ? ' and a reasonably balanced hand, ' : ', '}${stopText} bid ${bidToFullString(this.m_nBid)}.\n`,
      );
    }
    return true;
  }

  bidNoTrumpAsAppropriateEngine(
    bMustBeBalanced = true,
    enCode: StoppedCode = StoppedCode.All,
    nSuit: Suit | typeof NONE = NONE,
  ): boolean {
    if (this.bidNoTrumpEngine(2, PTS_NT_GAME - 3, PTS_NT_GAME - 1, bMustBeBalanced, enCode, nSuit))
      return true;
    if (this.bidNoTrumpEngine(3, PTS_NT_GAME, PTS_SLAM - 1, bMustBeBalanced, enCode, nSuit))
      return true;
    if (this.bidNoTrumpEngine(4, PTS_SLAM - 2, PTS_SLAM - 1, bMustBeBalanced, enCode, nSuit))
      return true;
    if (this.bidNoTrumpEngine(6, PTS_SLAM, PTS_SLAM + 1, bMustBeBalanced, enCode, nSuit))
      return true;
    if (
      this.bidNoTrumpEngine(
        5,
        PTS_GRAND_SLAM - 2,
        PTS_GRAND_SLAM - 1,
        bMustBeBalanced,
        enCode,
        nSuit,
      )
    )
      return true;
    if (this.bidNoTrumpEngine(7, PTS_GRAND_SLAM, 0, bMustBeBalanced, enCode, nSuit)) return true;
    return false;
  }

  pickBestFinalSuit(status: PlayerStatus | null = this.status): Suit {
    const suitAvailable = [true, true, true, true];
    let numSuitsBid = 0;
    if (isSuit(this.nPreviousSuit)) {
      suitAvailable[this.nPreviousSuit] = false;
      numSuitsBid++;
    }
    if (isSuit(this.nPartnersSuit)) {
      suitAvailable[this.nPartnersSuit] = false;
      numSuitsBid++;
    }
    if (isSuit(this.nPartnersPrevSuit)) {
      suitAvailable[this.nPartnersPrevSuit] = false;
      numSuitsBid++;
    }

    const suitsAvailable: Suit[] = [];
    for (let i = 0; i < 4; i++) {
      if (suitAvailable[i]) suitsAvailable.push(i as Suit);
    }
    const newSuit =
      suitsAvailable.length === 1
        ? suitsAvailable[0]
        : suitsAvailable.length >= 2
          ? this.pickSuperiorSuit(suitsAvailable[0], suitsAvailable[1])
          : Suit.Clubs;

    let nSuit: Suit;
    if (
      this.nPPrevSuitSupport >= SuitStrength.ModerateSupport &&
      this.nPPrevSuitSupport > this.nPartnersSuitSupport &&
      isSuit(this.nPartnersPrevSuit)
    ) {
      nSuit = this.nPartnersPrevSuit;
      status?.stream(
        `2PKF1! With ${this.numPPrevSuitSupportCards} trumps in partner's first suit (${Card.suitToString(nSuit)}), we prefer to support that suit.\n`,
      );
    } else if (
      this.nPartnersSuitSupport >= SuitStrength.ModerateSupport &&
      isSuit(this.nPartnersSuit)
    ) {
      nSuit = this.nPartnersSuit;
      status?.stream(
        `2PKF2! With ${this.numSupportCards} trumps in partner's second suit (${Card.suitToString(nSuit)}), we prefer to support that suit.\n`,
      );
    } else if (
      this.nPrefSuitStrength >= SuitStrength.Strong &&
      this.numPrefSuitCards >= 6 &&
      isSuit(this.nPrefSuit)
    ) {
      nSuit = this.nPrefSuit;
      status?.stream(
        `2PKF3! With ${numSuitsBid === 3 ? 'three' : 'two'} suits bid so far, we prefer to ${this.nPreviousSuit === this.nPrefSuit ? 'rebid' : 'bid'} our own ${this.numPrefSuitCards}-card ${Card.suitToSingularString(nSuit)} suit.\n`,
      );
    } else if (
      this.nPPrevSuitSupport >= SuitStrength.WeakSupport &&
      this.nPPrevSuitSupport > this.nPartnersSuitSupport &&
      isSuit(this.nPartnersPrevSuit)
    ) {
      nSuit = this.nPartnersPrevSuit;
      status?.stream(
        `2PKF4! Without a compelling suit of our own, we prefer to support partner's first suit of ${Card.suitToString(nSuit)}.\n`,
      );
    } else if (this.nPartnersSuitSupport >= SuitStrength.WeakSupport && isSuit(this.nPartnersSuit)) {
      nSuit = this.nPartnersSuit;
      status?.stream(
        `2PKF5! Without a compelling suit of our own, we prefer to support partner's second suit of ${Card.suitToString(nSuit)}.\n`,
      );
    } else if (this.numSingletons === 0 && this.numVoids === 0) {
      nSuit = Suit.NoTrump;
      status?.stream(
        "2PKF6! Without a compelling suit of our own, and with lackluster support for partner's two suits, we prefer to play in No Trumps.\n",
      );
    } else if (this.nSuitStrength[newSuit] >= SuitStrength.Openable) {
      nSuit = newSuit;
      status?.stream(
        `2PKF7! Since our first suit is not rebiddable, and we lack good support for either of partner's suits, we prefer to bid ${suitsAvailable.length === 1 ? 'the 4th suit of' : 'a new suit in'}${Card.suitToString(nSuit)}.\n`,
      );
    } else if (this.numSingletons <= 1 && this.numVoids === 0) {
      nSuit = Suit.NoTrump;
      status?.stream(
        "2PKF8! Without any rebiddable suit of our own, and with lackluster support for partner's two suits, prefer to fall back to No Trumps.\n",
      );
    } else if (this.numPrefSuitCards >= 6 && isSuit(this.nPrefSuit)) {
      nSuit = this.nPrefSuit;
      status?.stream(
        `2PKF11! With lackluster support for partner's two suits, we choose to rebid our own ${this.numPrefSuitCards}-card ${Card.suitToSingularString(nSuit)} suit.\n`,
      );
    } else if (
      this.nPPrevSuitSupport >= this.nPartnersSuitSupport &&
      this.numPPrevSuitSupportCards >= 2 &&
      isSuit(this.nPartnersPrevSuit)
    ) {
      nSuit = this.nPartnersPrevSuit;
      status?.stream(
        `2PKF12! Without a good suit of our own, we pick partner's first suit of ${Card.suitToString(nSuit)}.\n`,
      );
    } else if (this.numSupportCards >= 2 && isSuit(this.nPartnersSuit)) {
      nSuit = this.nPartnersSuit;
      status?.stream(
        `2PKF13! Without a good suit of our own, we pick partner's second suit of ${Card.suitToString(nSuit)}.\n`,
      );
    } else if (this.numVoids === 0) {
      nSuit = Suit.NoTrump;
      status?.stream(
        "2PKF14! Without a good suit of our own, and with very poor support for partner's two suits, we are stuck with No Trumps.\n",
      );
    } else {
      nSuit = newSuit;
      status?.stream(
        `2PKF15! Without a rebiddable suit or any decent support for partner's suits, and with a hand unsuitable for Notrump, we have little choice but to bid ${suitsAvailable.length === 1 ? 'the 4th suit of' : 'a new suit in'}${Card.suitToString(nSuit)}.\n`,
      );
    }

    return nSuit;
  }

  //
  //==========================================================================
  //
  // Stateless Compatibility Helpers (preserving existing TS API & tests)
  //
  //==========================================================================
  //

  makeOpeningBid(hand: Hand, position: Position): Bid {
    this.statusLog.push(`OPEN: Assessing opening for ${position}.`);
    const conventionBid = this.applyConventionTests(hand, position, Bid.Pass, false, 0, true);
    if (conventionBid !== null) {
      this.statusLog.push(`OPEN-CONVENTION: ${conventionBid}.`);
      return conventionBid;
    }
    const hcp = hand.highCardPoints;
    if (hcp < 12) {
      this.statusLog.push(
        `OPEN-PASS: ${hcp} HCP is below the 12-HCP 1-level opening requirement.`,
      );
      return Bid.Pass;
    }
    if (hcp >= 15 && hcp <= 17 && hand.isBalanced) {
      this.statusLog.push(`OPEN-NT: ${hcp} HCP and balanced; open 1NT.`);
      return Bid.NT1;
    }

    const longest = this.getLongestSuit(hand);
    if (hand.getSuitLength(longest) >= 5) {
      const bid = makeBid(longest, 1);
      this.statusLog.push(`OPEN-SUIT: 5+ ${Suit[longest]} cards; open ${bid}.`);
      return bid;
    }
    this.statusLog.push('OPEN-CLUB: No clear major; open 1C.');
    return makeBid(Suit.Clubs, 1);
  }

  makeResponse(hand: Hand, partnerBid: Bid): Bid {
    this.statusLog.push(`RESPONSE: Partner opened ${partnerBid}; assess responder hand.`);
    if (partnerBid === Bid.NT1) {
      if (hand.highCardPoints >= 10) {
        this.statusLog.push('NT-GAME: 10+ responder HCP; bid 3NT.');
        return Bid.NT3;
      }
      if (hand.highCardPoints >= 8) {
        this.statusLog.push('NT-INVITE: 8-9 responder HCP; invite 2NT.');
        return Bid.NT2;
      }
      if (hand.getSuitLength(Suit.Hearts) >= 4) {
        this.statusLog.push('STAYMAN: 4+ hearts; bid Stayman 2C.');
        return Bid.C2;
      }
      if (hand.getSuitLength(Suit.Spades) >= 4) {
        this.statusLog.push('STAYMAN: 4+ spades; bid Stayman 2C.');
        return Bid.C2;
      }
    }
    if (hand.highCardPoints >= 6) {
      const longest = this.getLongestSuit(hand);
      if (hand.getSuitLength(longest) >= 4) {
        const bid = makeBid(longest, 2);
        this.statusLog.push(`SUIT-RESPONSE: 6+ HCP and 4+ cards; respond ${bid}.`);
        return bid;
      }
    }
    this.statusLog.push(
      'RESPONDER-PASS: Insufficient strength for a game or constructive suit response.',
    );
    return Bid.Pass;
  }

  makeRebidAsOpener(
    hand: Hand,
    ownOpeningBid: Bid,
    partnerBid: Bid,
    agreedSuit: Suit = Suit.NoTrump,
  ): Bid {
    this.statusLog.push(`REBID-OPENER: Opening ${ownOpeningBid}, partner replied ${partnerBid}.`);
    if (partnerBid === Bid.Pass) {
      const hcp = hand.highCardPoints;
      if (hcp >= 22) {
        const suit = this.getLongestSuit(hand);
        const rebid = makeBid(suit, 3);
        this.statusLog.push(
          `REBID-STRONG: Partner passed but ${hcp} HCP justifies one last game try at ${rebid}.`,
        );
        return rebid;
      }
      this.statusLog.push(
        'REBID-PASS: Partner passed and opener has no enough strength to reopen.',
      );
      return Bid.Pass;
    }

    if (partnerBid === Bid.NT1) {
      if (hand.isBalanced && hand.highCardPoints >= 18) {
        this.statusLog.push('REBID-NT: Balanced opener rebids 2NT/3NT after 1NT negative.');
        return hand.highCardPoints >= 20 ? Bid.NT3 : Bid.NT2;
      }
      const longest = this.getLongestSuit(hand);
      if (hand.getSuitLength(longest) >= 6) {
        const rebid = makeBid(longest, 2);
        this.statusLog.push(
          `REBID-SIX-CARD-SUIT: Rebids the 6-card ${Suit[longest]} suit at ${rebid}.`,
        );
        return rebid;
      }
      return Bid.Pass;
    }

    if (partnerBid === Bid.NT2 || partnerBid === Bid.NT3) {
      const hcp = hand.highCardPoints;
      if (hcp >= 18) {
        this.statusLog.push(
          'REBID-GAME: Partner showed 2NT/3NT interest; accept the game/rebid 3NT.',
        );
        return Bid.NT3;
      }
    }

    const suit = agreedSuit === Suit.NoTrump ? this.getLongestSuit(hand) : agreedSuit;
    if (hand.highCardPoints >= 16) {
      const bid = makeBid(suit, 3);
      this.statusLog.push(
        `REBID-AGREED-SUIT: 16+ opener HCP; raise/contract ${Suit[suit]} at level 3.`,
      );
      return bid;
    }
    this.statusLog.push('REBID-CHEAPEST: Sign off in the agreed suit/cheapest available contract.');
    return makeBid(suit, 2);
  }

  makeRebidAsResponder(hand: Hand, openerRebid: Bid, ownPreviousBid: Bid): Bid {
    this.statusLog.push(
      `REBID-RESPONDER: Opener rebid ${openerRebid}, after our ${ownPreviousBid}.`,
    );
    if (openerRebid === Bid.Pass) return Bid.Pass;

    const hcp = hand.highCardPoints;
    const openerSuit = hcp >= 0 ? (openerRebid - 1) % 5 : -1;
    if (openerRebid === Bid.NT2) {
      if (hcp >= 10) return Bid.NT3;
      return Bid.Pass;
    }
    if (openerRebid === Bid.NT3) {
      if (hcp >= 8) return Bid.NT3;
      return Bid.Pass;
    }
    if (openerSuit >= Suit.Clubs && openerSuit <= Suit.Spades) {
      const suit = openerSuit as Suit;
      const support = hand.getSuitLength(suit);
      if (support >= 3 && hcp >= 10) {
        const game = makeBid(suit, 4);
        this.statusLog.push(
          `RESPONDER-GAME: ${support}-card support and ${hcp} HCP; bid ${game}.`,
        );
        return game;
      }
      if (support >= 3) {
        const invitational = makeBid(suit, 3);
        this.statusLog.push(`RESPONDER-INVITE: ${support}-card support; bid ${invitational}.`);
        return invitational;
      }
    }
    this.statusLog.push('RESPONDER-PASS: No constructive raise or reshaping bid remains.');
    return Bid.Pass;
  }

  makeRebidExtended(hand: Hand, partnerBid: Bid, agreedSuit: Suit = Suit.NoTrump): Bid {
    this.statusLog.push(`REBID-EXTENDED: Round 3+, partner bid ${partnerBid}.`);
    if (partnerBid === Bid.Pass) {
      this.statusLog.push('EXTENDED-PASS: Partner passed in the later round.');
      return Bid.Pass;
    }
    if (partnerBid >= Bid.C6 && partnerBid <= Bid.NT7) {
      this.statusLog.push(
        'EXTENDED-SLAM: Partner reached a slam-level bid; sign off unless convention logic applies.',
      );
      return Bid.Pass;
    }
    if (agreedSuit !== Suit.NoTrump) {
      if (hand.highCardPoints >= 10) {
        const bid = makeBid(agreedSuit, 4);
        this.statusLog.push(`EXTENDED-GAME: Repeat agreed ${Suit[agreedSuit]} fit and bid game.`);
        return bid;
      }
      const bid = makeBid(agreedSuit, 3);
      this.statusLog.push(
        `EXTENDED-CONSERVATIVE: Bid agreed ${Suit[agreedSuit]} at level 3.`,
      );
      return bid;
    }
    const longest = this.getLongestSuit(hand);
    if (hand.getSuitLength(longest) >= 5) {
      const bid = makeBid(longest, 3);
      this.statusLog.push(
        `EXTENDED-SUIT: No established fit; show a 5+ card ${Suit[longest]} suit.`,
      );
      return bid;
    }
    this.statusLog.push(
      'EXTENDED-PASS: No fit or new suit can be supported in the extended rebid round.',
    );
    return Bid.Pass;
  }

  respondToSingleRaise(hand: Hand, agreedSuit: Suit): PartnerRaiseResult {
    if (agreedSuit === Suit.NoTrump) {
      return {
        bid: Bid.Pass,
        statusCode: 'RDR',
        message: 'RDR0: No trump suit agreement is available.',
      };
    }

    const support = hand.getSuitLength(agreedSuit);
    const minTotal = hand.highCardPoints + 6;
    const maxTotal = hand.highCardPoints + 10;
    const statusCode = 'RDR' as const;

    if (minTotal <= 22) {
      const message = `RDR2: Partnership minimum ${minTotal}-${maxTotal} points is below game; pass.`;
      this.statusLog.push(message);
      return { bid: Bid.Pass, statusCode, message };
    }

    if (minTotal >= 26) {
      if (agreedSuit === Suit.Hearts || agreedSuit === Suit.Spades) {
        const bid = makeBid(agreedSuit, 4);
        const message = `R22: ${minTotal}-${maxTotal} partnership points; bid game at ${bid}.`;
        this.statusLog.push(message);
        return { bid, statusCode, message };
      }
      const bid = makeBid(agreedSuit, 5);
      const message = `R30: ${minTotal}-${maxTotal} partnership points for a minor; bid game at ${bid}.`;
      this.statusLog.push(message);
      return { bid, statusCode, message };
    }

    if (minTotal >= 23 && support >= 3) {
      const bid = makeBid(agreedSuit, 3);
      const message =
        agreedSuit === Suit.Hearts || agreedSuit === Suit.Spades
          ? `R18: ${support}-card support and ${minTotal}-${maxTotal} partnership points; invite game.`
          : `R14: ${support}-card support and ${minTotal}-${maxTotal} partnership points; show an invitational minor raise.`;
      this.statusLog.push(message);
      return { bid, statusCode, message };
    }

    const message = `R08: Insufficient playing support in ${Suit[agreedSuit]}; pass.`;
    this.statusLog.push(message);
    return { bid: Bid.Pass, statusCode, message };
  }

  respondToDoubleRaise(hand: Hand, agreedSuit: Suit, limitRaises = false): PartnerRaiseResult {
    if (agreedSuit === Suit.NoTrump) {
      return {
        bid: Bid.Pass,
        statusCode: 'S',
        message: 'S00: No trump suit agreement is available.',
      };
    }
    const partnerMin = limitRaises ? 11 : 13;
    const partnerMax = limitRaises ? 12 : 18;
    const minTotal = hand.highCardPoints + partnerMin;
    const maxTotal = hand.highCardPoints + partnerMax;
    const support = hand.getSuitLength(agreedSuit);

    if (agreedSuit === Suit.Hearts || agreedSuit === Suit.Spades) {
      if (minTotal >= 25 && support >= 3) {
        const bid = makeBid(agreedSuit, 4);
        const message = `S10: Limit/double raise with ${support} trumps and ${minTotal}-${maxTotal} partnership points; bid game at ${bid}.`;
        this.statusLog.push(message);
        return { bid, statusCode: 'S', message };
      }
      const message = `S11: ${minTotal}-${maxTotal} partnership points is insufficient to raise beyond partner's double raise; pass.`;
      this.statusLog.push(message);
      return { bid: Bid.Pass, statusCode: 'S', message };
    }

    if (minTotal >= 29 && support >= 4) {
      const bid = makeBid(agreedSuit, 5);
      const message = `S22: ${minTotal}-${maxTotal} partnership points and ${support} trumps; bid minor game at ${bid}.`;
      this.statusLog.push(message);
      return { bid, statusCode: 'S', message };
    }
    if (minTotal >= 26) {
      const bid = makeBid(agreedSuit, 3);
      const message = `S18: ${minTotal}-${maxTotal} partnership points; invite/steer toward minor game.`;
      this.statusLog.push(message);
      return { bid, statusCode: 'S', message };
    }
    const message = `S16: ${minTotal}-${maxTotal} partnership points is insufficient for minor game; pass.`;
    this.statusLog.push(message);
    return { bid: Bid.Pass, statusCode: 'S', message };
  }

  respondToTripleRaise(hand: Hand, agreedSuit: Suit): PartnerRaiseResult {
    if (agreedSuit === Suit.NoTrump) {
      return {
        bid: Bid.Pass,
        statusCode: 'Q',
        message: 'Q00: No trump suit agreement is available.',
      };
    }
    const minTotal = hand.highCardPoints + 6;
    const maxTotal = hand.highCardPoints + 9;

    if (minTotal < 33) {
      const message = `Q10: Triple raise with ${minTotal}-${maxTotal} partnership points signs off; pass.`;
      this.statusLog.push(message);
      return { bid: Bid.Pass, statusCode: 'Q', message };
    }
    if (minTotal <= 34) {
      const bid = makeBid(agreedSuit, 6);
      const message = `Q21: ${minTotal}-${maxTotal} partnership points; bid small slam at ${bid}.`;
      this.statusLog.push(message);
      return { bid, statusCode: 'Q', message };
    }
    const bid = makeBid(agreedSuit, 7);
    const message = `Q20: ${minTotal}-${maxTotal} partnership points; bid grand slam at ${bid}.`;
    this.statusLog.push(message);
    return { bid, statusCode: 'Q', message };
  }

  raisePartnersSuit(
    hand: Hand,
    partnerSuit: Suit,
    partnerBidLevel: number,
    target: RaiseTarget,
    supportLength: number,
    minimumPartnershipPoints = 0,
    maximumPartnershipPoints = 99,
  ): Bid | null {
    if (hand.getSuitLength(partnerSuit) < supportLength) return null;
    if (!Number.isFinite(minimumPartnershipPoints) || !Number.isFinite(maximumPartnershipPoints))
      return null;
    const partnershipPoints = hand.highCardPoints;
    if (
      partnershipPoints < minimumPartnershipPoints ||
      partnershipPoints > maximumPartnershipPoints
    )
      return null;

    let level: number;
    if (target >= 1) {
      level = partnerBidLevel + target;
    } else if (target === RaiseTarget.ToThree) {
      level = 3;
    } else if (target === RaiseTarget.ToFour) {
      level = 4;
    } else if (target === RaiseTarget.ToFive) {
      level = 5;
    } else if (target === RaiseTarget.ToGame || target === RaiseTarget.ToNoMoreThanGame) {
      level = partnerSuit === Suit.Clubs || partnerSuit === Suit.Diamonds ? 5 : 4;
    } else if (target === RaiseTarget.ToSlam) {
      level = 6;
    } else {
      return null;
    }

    if (level < 1 || level > 7) return null;
    const bid = makeBid(partnerSuit, level);
    this.statusLog.push(
      `raise: ${hand.getSuitLength(partnerSuit)}-card ${Suit[partnerSuit]} support, raise to ${bid}.`,
    );
    return bid;
  }

  getCheapestShiftBid(targetSuit: Suit, oldBid: Bid | typeof NONE = NONE): Bid {
    const refBid = oldBid === NONE ? this.nPartnersBid : oldBid;
    if (refBid === Bid.Double || refBid === Bid.Redouble) return Bid.Pass;
    if (refBid === Bid.Pass) return makeBid(targetSuit, 1);
    if (!refBid || refBid < Bid.C1 || refBid > Bid.NT7) return Bid.Pass;
    const oldLevel = bidLevel(refBid);
    const oldSuit = bidSuit(refBid);
    if (oldSuit === -1) return makeBid(targetSuit, oldLevel);
    if (targetSuit > oldSuit) return makeBid(targetSuit, oldLevel);
    if (oldLevel >= 7) return Bid.Pass;
    return makeBid(targetSuit, oldLevel + 1);
  }

  getJumpShiftBid(targetSuit: Suit, oldBid: Bid, jumpLevel = 1): Bid {
    if (oldBid < Bid.C1 || oldBid > Bid.NT7) return Bid.Pass;
    const oldLevel = bidLevel(oldBid);
    const oldSuit = bidSuit(oldBid);
    if (isBid(this.m_nBid) && targetSuit !== bidSuit(this.m_nBid)) {
      this.m_bGameForceActive = true;
    }
    if (oldSuit === -1) return makeBid(targetSuit, Math.min(7, oldLevel + jumpLevel));
    const level = targetSuit > oldSuit ? oldLevel + jumpLevel : oldLevel + jumpLevel + 1;
    if (level > 7) return Bid.Pass;
    return makeBid(targetSuit, level);
  }

  rebidSuit(
    hand: Hand,
    suit: Suit,
    minimumHcp = 0,
    maximumHcp = 99,
    minimumLength = 0,
    oldBid: Bid = Bid.Pass,
    absoluteLevel: number | null = null,
  ): Bid | null {
    if (hand.getSuitLength(suit) < minimumLength) return null;
    const hcp = hand.highCardPoints;
    if (hcp < minimumHcp || hcp > maximumHcp) return null;
    if (absoluteLevel !== null) {
      if (absoluteLevel < 1 || absoluteLevel > 7) return null;
      return makeBid(suit, absoluteLevel);
    }
    const bid = this.getCheapestShiftBid(suit, oldBid);
    return bid === Bid.Pass ? null : bid;
  }

  bidNextBestSuit(
    hand: Hand,
    minimumLength = 4,
    excludedSuit1: Suit = Suit.NoTrump,
    excludedSuit2: Suit = Suit.NoTrump,
    excludedSuit3: Suit = Suit.NoTrump,
  ): Bid | null {
    const excluded = [excludedSuit1, excludedSuit2, excludedSuit3];
    const candidates = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
      .filter(suit => !excluded.includes(suit))
      .filter(suit => hand.getSuitLength(suit) >= minimumLength)
      .sort((a, b) => hand.getSuitLength(b) - hand.getSuitLength(a) || b - a);
    if (candidates.length === 0) return null;
    return makeBid(candidates[0], 1);
  }

  bidNoTrump(
    hand: Hand,
    level: number,
    minimumHcp = 0,
    maximumHcp = 99,
    mustBeBalanced = true,
    stoppedSuitCount = 0,
    mustHaveNoVoids = true,
    partnerBid: Bid = Bid.Pass,
  ): Bid | null {
    if (level < 1 || level > 7) return null;
    if (mustBeBalanced && !hand.isBalanced) return null;
    if (stoppedSuitCount > 0) {
      let stopped = 0;
      for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
        if (hand.getSuitLength(suit as Suit) >= 2) stopped++;
      }
      if (stopped < stoppedSuitCount) return null;
    }
    if (mustHaveNoVoids) {
      for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
        if (hand.getSuitLength(suit as Suit) === 0) return null;
      }
    }
    const hcp = hand.highCardPoints;
    if (hcp < minimumHcp || hcp > maximumHcp) return null;
    const bid = makeBid(Suit.NoTrump, level);
    if (partnerBid !== Bid.Pass && bid <= partnerBid) return null;
    this.statusLog.push(
      `BNT: ${hcp} HCP, balanced=${hand.isBalanced}, stopped=${stoppedSuitCount}; bid ${bid}.`,
    );
    return bid;
  }

  bidNoTrumpAsAppropriate(hand: Hand, partnerBid: Bid = Bid.Pass): Bid | null {
    const hcp = hand.highCardPoints;
    return this.bidNoTrump(
      hand,
      hcp >= 26 ? 3 : 2,
      hcp >= 26 ? 26 : 23,
      hcp >= 26 ? 31 : 25,
      true,
      4,
      true,
      partnerBid,
    );
  }

  applyConventionTests(
    hand: Hand,
    position: Position,
    partnerBid: Bid,
    partnerOpenedForTeam: boolean,
    partnerBidCount: number,
    rightHandOpponentPassed: boolean,
  ): Bid | null {
    const bidContext: ConventionBidContext = {
      position,
      partnerPosition: partnerPosition(position),
      partnerBid,
      partnerOpenedForTeam,
      partnerBidCount,
      rightHandOpponentPassed,
      agreedSuit: NONE,
      bid: Bid.Pass,
      status: ConventionStatus.Inactive,
      parameters: 0,
      activeConvention: null,
    };
    const context: ConventionContext = {
      hand,
      cardLocation: new CardLocation(),
      status: new PlayerStatus(),
      bidContext,
      bidEngine: this,
      conventions: this.conventionSet,
    };
    return this.conventionSet.applyConventionTests(context);
  }

  getLongestSuit(hand: Hand): Suit {
    let longest = Suit.Clubs;
    for (let suit = Suit.Clubs + 1; suit <= Suit.Spades; suit++) {
      if (hand.getSuitLength(suit as Suit) > hand.getSuitLength(longest)) {
        longest = suit as Suit;
      }
    }
    return longest;
  }
}
