import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Position, Vulnerability } from '../src/index.js';
import { main, parsePbnLine, runPbnBatch, runPbnDeal } from '../src/cli/playPbn.js';

describe('playPbn CLI script', () => {
  const sampleLine =
    'PBN 0 3 3 0 "N:6.QT986.8754.J65 AQT983.2.A93.AK2 KJ74.K73.KQJ.987 52.AJ54.T62.QT43"';

  it('parses PBN header line with clockwise hands starting from compass letter', () => {
    const parsed = parsePbnLine(sampleLine);
    expect(parsed.dealer).toBe(Position.South);
    expect(parsed.vulnerability).toBe(Vulnerability.Both);
    expect(parsed.trumpRaw).toBe(3);
    expect(parsed.leader).toBe(Position.South);
    expect(parsed.firstSeat).toBe(Position.North);
    // N -> E -> S -> W clockwise
    expect(parsed.handsByPosition[Position.North]).toHaveLength(13);
    expect(parsed.handsByPosition[Position.East]).toHaveLength(13);
    expect(parsed.handsByPosition[Position.South]).toHaveLength(13);
    expect(parsed.handsByPosition[Position.West]).toHaveLength(13);
    // North has singleton 6 of spades
    expect(parsed.handsByPosition[Position.North].map(c => c.name)).toContain('S6');
    // East has AQT983 of spades
    expect(parsed.handsByPosition[Position.East].map(c => c.name)).toContain('SA');
    // South has KJ74 of spades
    expect(parsed.handsByPosition[Position.South].map(c => c.name)).toContain('SK');
    // West has 52 of spades
    expect(parsed.handsByPosition[Position.West].map(c => c.name)).toContain('S5');
  });

  it('runs a full playthrough and includes PBN record + all 4 seat analysis logs', () => {
    const parsed = parsePbnLine(sampleLine);
    const pbn = runPbnDeal(parsed, { date: '2026.11.22', boardNumber: 1 });

    expect(pbn).toContain('[BOARD "1"]');
    expect(pbn).toContain('[DATE "2026.11.22"]');
    expect(pbn).toContain('[VULNERABLE "Both"]');
    expect(pbn).toContain('[AUCTION "');
    expect(pbn).toContain('[PLAY "');
    expect(pbn).toContain('=== South Analysis Log ===');
    expect(pbn).toContain('=== West Analysis Log ===');
    expect(pbn).toContain('=== North Analysis Log ===');
    expect(pbn).toContain('=== East Analysis Log ===');
    expect(pbn).toContain('Input: PBN 0 3 3 0');

    // Verify East's S/H/D/C labels align at column 32 regardless of West's suit lengths
    const pbnLines = pbn.split('\n');
    const weLines = pbnLines.filter(l => /^[SHDC]: /.test(l));
    expect(weLines).toHaveLength(4);
    for (const line of weLines) {
      expect(line.indexOf(`${line[0]}:`, 3)).toBe(32);
    }
  });

  it('processes a multi-line file via CLI main() and writes a multi-deal PBN file', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'easybridge-playpbn-'));
    try {
      const inFile = join(tempDir, 'deals.txt');
      const outFile = join(tempDir, 'out.pbn');
      const deal1 =
        'PBN 0 1 4 1 "W:T7632.J86.T84.32 AJ4.T9.Q763.A874 KQ5.K543.J5.QJ65 98.AQ72.AK92.KT9"';
      writeFileSync(inFile, `# comment line\n\n${sampleLine}\n${deal1}\n`, 'utf8');

      main(['--file', inFile, '--out', outFile, '--date', '2026.11.22']);

      const output = readFileSync(outFile, 'utf8');
      expect(output).toContain('[BOARD "1"]');
      expect(output).toContain('[BOARD "2"]');
      expect(output).toContain('[CONTRACT "3NT"]');
      expect(output.match(/=== South Analysis Log ===/g)).toHaveLength(2);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('supports runPbnBatch directly with DDS seat-order option', () => {
    const out = runPbnBatch([sampleLine], { seatOrder: 'dds', date: '2026.11.22' });
    expect(out).toContain('[DEALER "N"]');
    expect(out).toContain('Header fields (dds): dealer=North (0)');
  });
});
