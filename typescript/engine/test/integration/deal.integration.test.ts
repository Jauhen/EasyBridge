import { describe, expect, it } from 'vitest';
import { Bid, Deal, Position, Vulnerability } from '../../src/index.js';

describe('Deal integration', () => {
  it('exports a complete PBN record after all four players play a deal', () => {
    const deal = new Deal({
      dealer: Position.South,
      vulnerability: Vulnerability.NorthSouth,
      date: '2016.07.12',
    });

    deal.assignPbnHands([
      ['T7632', 'J86', 'T84', '32'],
      ['AJ4', 'T9', 'Q763', 'A874'],
      ['KQ5', 'K543', 'J5', 'QJ65'],
      ['98', 'AQ72', 'AK92', 'KT9'],
    ]);

    deal.bidAutomatically();
    deal.beginRound();
    deal.playAllTricks();
    deal.updateDuplicateScore();

    const pbn = deal.writeFilePbn();
    expect(pbn).toContain('[DEAL "W:T7632.J86.T84.32 AJ4.T9.Q763.A874 KQ5.K543.J5.QJ65 98.AQ72.AK92.KT9"]');
    expect(pbn).toMatch(/^\[AUCTION "[SWNE]"\]/m);
    expect(pbn).toMatch(/^\[PLAY "[SWNE]"\]/m);
    expect(pbn).toContain('[GENERATOR "Easy Bridge version Version 4.0.2"]');
    expect(deal.players.every(player => player.hand.length === 0)).toBe(true);
  });
});
