#!/usr/bin/env node
//----------------------------------------------------------------------------------------
//
// CLI script to run full EasyBridge playthroughs from PBN header lines:
//   PBN <dealer> <vulnerability> <trump> <leader> "<COMPASS>:<hand1> <hand2> <hand3> <hand4>"
//
// Supports either a single PBN line or an input file containing multiple lines,
// outputting a standard PBN file (single or multi-deal) with all player logs included.
//
//----------------------------------------------------------------------------------------

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  Card,
  charToPosition,
  Deal,
  isBid,
  nextPosition,
  parsePbnHand,
  Position,
  positionToString,
  Suit,
  Vulnerability,
} from '../index.js';

export type SeatOrder = 'easybridge' | 'dds';

export interface PlayPbnOptions {
  seatOrder?: SeatOrder;
  date?: string;
  boardNumber?: number;
}

export interface ParsedPbnLine {
  rawLine: string;
  dealerRaw: number;
  dealer: Position;
  vulnerabilityRaw: number;
  vulnerability: Vulnerability;
  trumpRaw: number;
  leaderRaw: number;
  leader: Position;
  firstSeat: Position;
  remainCards: string;
  handsByPosition: [Card[], Card[], Card[], Card[]];
}

const DDS_TO_POSITION: readonly Position[] = [
  Position.North, // 0 = N
  Position.East,  // 1 = E
  Position.South, // 2 = S
  Position.West,  // 3 = W
];

const EASYBRIDGE_TO_POSITION: readonly Position[] = [
  Position.South, // 0 = S
  Position.West,  // 1 = W
  Position.North, // 2 = N
  Position.East,  // 3 = E
];

const VULNERABILITY_MAP: readonly Vulnerability[] = [
  Vulnerability.None,       // 0
  Vulnerability.NorthSouth, // 1
  Vulnerability.EastWest,   // 2
  Vulnerability.Both,       // 3
];

function decodeSeatIndex(index: number, seatOrder: SeatOrder, fieldName: string): Position {
  const table = seatOrder === 'dds' ? DDS_TO_POSITION : EASYBRIDGE_TO_POSITION;
  if (!Number.isInteger(index) || index < 0 || index > 3) {
    throw new Error(`Invalid ${fieldName} index "${index}": expected integer 0..3`);
  }
  return table[index];
}

function decodeVulnerability(index: number): Vulnerability {
  if (!Number.isInteger(index) || index < 0 || index > 3) {
    throw new Error(`Invalid vulnerability "${index}": expected integer 0..3`);
  }
  return VULNERABILITY_MAP[index];
}

function decodeTrumpName(index: number, seatOrder: SeatOrder): string {
  if (seatOrder === 'dds') {
    const names = ['Spades', 'Hearts', 'Diamonds', 'Clubs', 'NoTrump'];
    return names[index] ?? String(index);
  }
  const names: Record<number, string> = {
    [Suit.Clubs]: 'Clubs',
    [Suit.Diamonds]: 'Diamonds',
    [Suit.Hearts]: 'Hearts',
    [Suit.Spades]: 'Spades',
    [Suit.NoTrump]: 'NoTrump',
  };
  return names[index] ?? String(index);
}

/**
 * Parses a line of the form:
 *   PBN <dealer> <vulnerability> <trump> <leader> "<N|E|S|W>:<h0> <h1> <h2> <h3>"
 */
export function parsePbnLine(line: string, options: PlayPbnOptions = {}): ParsedPbnLine {
  const seatOrder = options.seatOrder ?? 'easybridge';
  const trimmed = line.trim();
  const match = /^PBN\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+"([^"]+)"\s*$/i.exec(trimmed);
  if (!match) {
    throw new Error(
      `Invalid PBN input line: "${trimmed}". Expected: PBN <dealer> <vulnerability> <trump> <leader> "<COMPASS>:<hand1> <hand2> <hand3> <hand4>"`,
    );
  }

  const dealerRaw = Number(match[1]);
  const vulnerabilityRaw = Number(match[2]);
  const trumpRaw = Number(match[3]);
  const leaderRaw = Number(match[4]);
  const remainCards = match[5].trim();

  const dealer = decodeSeatIndex(dealerRaw, seatOrder, 'dealer');
  const vulnerability = decodeVulnerability(vulnerabilityRaw);
  const leader = decodeSeatIndex(leaderRaw, seatOrder, 'leader');

  const colonIdx = remainCards.indexOf(':');
  if (colonIdx !== 1) {
    throw new Error(
      `Invalid remainCards "${remainCards}": must start with a single compass letter (N/E/S/W) followed by ":"`,
    );
  }

  const compassChar = remainCards[0].toUpperCase();
  if (!['N', 'E', 'S', 'W'].includes(compassChar)) {
    throw new Error(`Invalid starting compass letter "${compassChar}": expected N, E, S, or W`);
  }
  const firstSeat = charToPosition(compassChar);
  const handTokens = remainCards.slice(2).trim().split(/\s+/);
  if (handTokens.length !== 4) {
    throw new Error(`Expected 4 hands in remainCards "${remainCards}", found ${handTokens.length}`);
  }

  const handsByPosition: Card[][] = [[], [], [], []];
  let seat = firstSeat;
  for (let i = 0; i < 4; i++) {
    handsByPosition[seat] = parsePbnHand(handTokens[i]);
    seat = nextPosition(seat);
  }

  return {
    rawLine: trimmed,
    dealerRaw,
    dealer,
    vulnerabilityRaw,
    vulnerability,
    trumpRaw,
    leaderRaw,
    leader,
    firstSeat,
    remainCards,
    handsByPosition: handsByPosition as [Card[], Card[], Card[], Card[]],
  };
}

function sanitizePbnComment(text: string): string {
  // PBN brace comments cannot contain unescaped '}'
  return text.replace(/}/g, ')').trimEnd();
}

/**
 * Runs a full EasyBridge playthrough (bidding + play + scoring) for a single parsed PBN line
 * and returns a complete PBN record with all 4 players' logs included in PBN comment blocks.
 */
export function runPbnDeal(parsed: ParsedPbnLine, options: PlayPbnOptions = {}): string {
  const seatOrder = options.seatOrder ?? 'easybridge';
  const date = options.date ?? new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  const deal = new Deal({
    dealer: parsed.dealer,
    vulnerability: parsed.vulnerability,
    date,
  });

  deal.assignCards(parsed.handsByPosition);
  deal.bidAutomatically();

  const passedOut = !isBid(deal.contract);
  if (!passedOut) {
    deal.beginRound();
    deal.playAllTricks();
    deal.updateDuplicateScore();
  }

  let pbn = deal.writeFilePbn();
  if (options.boardNumber !== undefined) {
    pbn = pbn.replace('[BOARD ""]', `[BOARD "${options.boardNumber}"]`);
  }

  const headerMeta = [
    '{',
    `Input: ${sanitizePbnComment(parsed.rawLine)}`,
    `Header fields (${seatOrder}): dealer=${positionToString(parsed.dealer)} (${parsed.dealerRaw}), vulnerability=${parsed.vulnerabilityRaw}, trump=${decodeTrumpName(parsed.trumpRaw, seatOrder)} (${parsed.trumpRaw}), leader=${positionToString(parsed.leader)} (${parsed.leaderRaw})`,
    passedOut
      ? 'Outcome: Passed out'
      : `Outcome: NS Duplicate Score = ${deal.getTotalScoreNS()}`,
    '}',
  ].join('\n');

  const logSections: string[] = [];
  for (const pos of [Position.South, Position.West, Position.North, Position.East]) {
    const analysis = sanitizePbnComment(deal.players[pos].getAnalysis());
    logSections.push(
      [
        '{',
        `=== ${positionToString(pos)} Analysis Log ===`,
        analysis || '(no log output)',
        '}',
      ].join('\n'),
    );
  }

  return `${pbn.trimEnd()}\n${headerMeta}\n${logSections.join('\n')}\n`;
}

/**
 * Runs a batch of PBN lines and combines them into a single multi-deal PBN string.
 */
export function runPbnBatch(lines: readonly string[], options: PlayPbnOptions = {}): string {
  const deals: string[] = [];
  let boardNumber = 1;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('%')) {
      continue;
    }
    const parsed = parsePbnLine(trimmed, options);
    deals.push(runPbnDeal(parsed, { ...options, boardNumber }));
    boardNumber++;
  }

  if (deals.length === 0) {
    throw new Error('No PBN lines found in input.');
  }

  return deals.join('\n');
}

function printUsage(): void {
  console.error(
    [
      'Usage:',
      '  playPbn [options] <PBN-line | input-file>',
      '',
      'Options:',
      '  --line <string>            Single PBN input line',
      '  --file, -f <path>          Input file containing one PBN line per deal',
      '  --out, -o <path>           Output PBN file path (defaults to stdout)',
      '  --seat-order <mode>        Seat integer mapping: easybridge (0=S,1=W,2=N,3=E, default) or dds (0=N,1=E,2=S,3=W)',
      '  --date <YYYY.MM.DD>        Override PBN [DATE] tag',
      '  --help, -h                 Show this help message',
      '',
      'Example:',
      '  node dist/cli/playPbn.js \'PBN 0 3 3 0 "N:6.QT986.8754.J65 AQT983.2.A93.AK2 KJ74.K73.KQJ.987 52.AJ54.T62.QT43"\' -o deal.pbn',
      '  node dist/cli/playPbn.js --file deals.txt --out deals.pbn',
    ].join('\n'),
  );
}

export function main(argv: readonly string[] = process.argv.slice(2)): void {
  let lineArg: string | null = null;
  let fileArg: string | null = null;
  let outPath: string | null = null;
  let seatOrder: SeatOrder = 'easybridge';
  let date: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      return;
    } else if (arg === '--line') {
      lineArg = argv[++i] ?? null;
    } else if (arg === '--file' || arg === '-f') {
      fileArg = argv[++i] ?? null;
    } else if (arg === '--out' || arg === '-o') {
      outPath = argv[++i] ?? null;
    } else if (arg === '--seat-order') {
      const val = argv[++i];
      if (val !== 'easybridge' && val !== 'dds') {
        throw new Error(`Invalid --seat-order "${val}": expected "easybridge" or "dds"`);
      }
      seatOrder = val;
    } else if (arg === '--date') {
      date = argv[++i];
    } else if (!arg.startsWith('-')) {
      if (/^PBN\s+/i.test(arg.trim())) {
        lineArg = arg;
      } else {
        fileArg = arg;
      }
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!lineArg && !fileArg) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const options: PlayPbnOptions = { seatOrder, date };
  let output: string;

  if (fileArg) {
    if (!existsSync(fileArg)) {
      throw new Error(`Input file not found: ${fileArg}`);
    }
    const content = readFileSync(fileArg, 'utf8');
    output = runPbnBatch(content.split(/\r?\n/), options);
  } else {
    const parsed = parsePbnLine(lineArg!, options);
    output = runPbnDeal(parsed, { ...options, boardNumber: 1 });
  }

  if (outPath) {
    writeFileSync(outPath, output, 'utf8');
  } else {
    process.stdout.write(output);
  }
}

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
