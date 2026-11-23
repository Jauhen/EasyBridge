import { describe, expect, it } from 'vitest';
import { Bid, Deal, Position, Vulnerability, parsePbnDocument } from '../src/index.js';

describe('Deal', () => {
  it('deals a seeded numbered hand to 13 cards per player', () => {
    const first = new Deal();
    const seed = first.dealNumberedHand(Position.South, Vulnerability.NorthSouth, 0, 12345);
    expect(seed).toBe(12345);
    expect(first.players.every(player => player.hand.length === 13)).toBe(true);
    const totalCards = first.players.reduce((sum, player) => sum + player.hand.length, 0);
    expect(totalCards).toBe(52);
  });
  it('loads a PBN document auction and deal', () => {
    const document = parsePbnDocument([
      '% PBN',
      '[DEALER "S"]',
      '[VULNERABLE "NS"]',
      '[DEAL "W:T7632.J86.T84.32 AJ4.T9.Q763.A874 KQ5.K543.J5.QJ65 98.AQ72.AK92.KT9"]',
      '[AUCTION "S"]',
      '1NT Pass 3NT Pass',
      'Pass Pass',
    ].join('\n'));
    const deal = new Deal();
    deal.loadPbnDocument(document);
    expect(deal.dealer).toBe(Position.South);
    expect(deal.biddingHistoryPublic).toEqual([
      Bid.NT1,
      Bid.Pass,
      Bid.NT3,
      Bid.Pass,
      Bid.Pass,
      Bid.Pass,
    ]);
    expect(deal.contract).toBe(Bid.NT3);
  });
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
