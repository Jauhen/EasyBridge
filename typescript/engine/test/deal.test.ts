import { describe, expect, it } from 'vitest';
import { Bid, Deal, Position, Vulnerability } from '../src/index.js';

describe('Deal', () => {
  it('enters a complete auction and sets the contract and declarer', () => {
    const deal = new Deal({ dealer: Position.South, vulnerability: Vulnerability.NorthSouth });
    deal.assignPbnHands([
      ['T7632', 'J86', 'T84', '32'],
      ['AJ4', 'T9', 'Q763', 'A874'],
      ['KQ5', 'K543', 'J5', 'QJ65'],
      ['98', 'AQ72', 'AK92', 'KT9'],
    ]);

    expect(deal.enterBid(Position.South, Bid.NT1)).toBe(0);
    expect(deal.enterBid(Position.West, Bid.Pass)).toBe(0);
    expect(deal.enterBid(Position.North, Bid.NT3)).toBe(0);
    expect(deal.enterBid(Position.East, Bid.Pass)).toBe(0);
    expect(deal.enterBid(Position.South, Bid.Pass)).toBe(0);
    expect(deal.enterBid(Position.West, Bid.Pass)).toBe(1);

    expect(deal.contract).toBe(Bid.NT3);
    expect(deal.players[Position.South].hand.length).toBe(13);
  });

  it('plays all four hands and exports PBN', () => {
    const deal = new Deal({ dealer: Position.South, vulnerability: Vulnerability.NorthSouth, date: '2016.07.12' });
    deal.assignPbnHands([
      ['T7632', 'J86', 'T84', '32'],
      ['AJ4', 'T9', 'Q763', 'A874'],
      ['KQ5', 'K543', 'J5', 'QJ65'],
      ['98', 'AQ72', 'AK92', 'KT9'],
    ]);

    deal.enterBid(Position.South, Bid.NT1);
    deal.enterBid(Position.West, Bid.Pass);
    deal.enterBid(Position.North, Bid.NT3);
    deal.enterBid(Position.East, Bid.Pass);
    deal.enterBid(Position.South, Bid.Pass);
    deal.enterBid(Position.West, Bid.Pass);

    deal.beginRound();
    deal.playAllTricks();
    deal.updateDuplicateScore();

    const pbn = deal.writeFilePbn();
    expect(pbn).toContain('[DEAL "W:');
    expect(pbn).toContain('[AUCTION "S"]');
    expect(pbn).toContain('[PLAY "');
    expect(pbn).toContain('[GENERATOR "Easy Bridge version Version 4.0.2"]');
  });
});
