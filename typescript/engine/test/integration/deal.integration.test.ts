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

  const cppFixtures = [
    {
      name: 'deal 1: 3NT contract',
      hands: [
        ['T7632', 'J86', 'T84', '32'],
        ['AJ4', 'T9', 'Q763', 'A874'],
        ['KQ5', 'K543', 'J5', 'QJ65'],
        ['98', 'AQ72', 'AK92', 'KT9'],
      ] as readonly (readonly string[])[],
      auction: [
        [Position.South, Bid.NT1],
        [Position.West, Bid.Pass],
        [Position.North, Bid.NT3],
        [Position.East, Bid.Pass],
        [Position.South, Bid.Pass],
        [Position.West, Bid.Pass],
      ] as readonly (readonly [Position, Bid])[],
      declarer: 'S',
      contract: '3NT',
      dealTag: 'W:T7632.J86.T84.32 AJ4.T9.Q763.A874 KQ5.K543.J5.QJ65 98.AQ72.AK92.KT9',
      auctionTag: 'S',
    },
    {
      name: 'deal 4: 5D contract',
      hands: [
        ['52', 'AT98', '5', 'AKT975'],
        ['K8743', 'J4', '982', 'J64'],
        ['A', 'KQ6', 'KQJ7643', 'Q3'],
        ['QJT96', '7532', 'AT', '82'],
      ] as readonly (readonly string[])[],
      auction: [
        [Position.South, Bid.Pass],
        [Position.West, Bid.Pass],
        [Position.North, Bid.Pass],
        [Position.East, Bid.D1],
        [Position.South, Bid.Pass],
        [Position.West, Bid.C2],
        [Position.North, Bid.Pass],
        [Position.East, Bid.D5],
        [Position.South, Bid.Pass],
        [Position.West, Bid.Pass],
        [Position.North, Bid.Pass],
      ] as readonly (readonly [Position, Bid])[],
      declarer: 'E',
      contract: '5D',
      dealTag: 'W:52.AT98.5.AKT975 K8743.J4.982.J64 A.KQ6.KQJ7643.Q3 QJT96.7532.AT.82',
      auctionTag: 'S',
    },
    {
      name: 'deal 26: 6H contract',
      hands: [
        ['6', 'KJT2', 'QJ6532', '93'],
        ['', 'AQ9876', 'KT8', 'A654'],
        ['JT987', '43', 'A94', 'JT7'],
        ['AKQ5432', '5', '7', 'KQ82'],
      ] as readonly (readonly string[])[],
      auction: [
        [Position.South, Bid.C2],
        [Position.West, Bid.Pass],
        [Position.North, Bid.H2],
        [Position.East, Bid.Pass],
        [Position.South, Bid.S2],
        [Position.West, Bid.Pass],
        [Position.North, Bid.NT4],
        [Position.East, Bid.Pass],
        [Position.South, Bid.D5],
        [Position.West, Bid.Pass],
        [Position.North, Bid.H6],
        [Position.East, Bid.Pass],
        [Position.South, Bid.Pass],
        [Position.West, Bid.Pass],
      ] as readonly (readonly [Position, Bid])[],
      declarer: 'N',
      contract: '6H',
      dealTag: 'W:6.KJT2.QJ6532.93 .AQ9876.KT8.A654 JT987.43.A94.JT7 AKQ5432.5.7.KQ82',
      auctionTag: 'S',
    },
    {
      name: 'deal 36: 4S contract',
      hands: [
        ['AJ73', 'KQ9', 'T983', 'AK'],
        ['Q94', 'AJT732', '42', 'T6'],
        ['KT52', '8654', 'AJ6', '72'],
        ['86', '', 'KQ75', 'QJ98543'],
      ] as readonly (readonly string[])[],
      auction: [
        [Position.South, Bid.Pass],
        [Position.West, Bid.NT1],
        [Position.North, Bid.Pass],
        [Position.East, Bid.C2],
        [Position.South, Bid.Pass],
        [Position.West, Bid.S2],
        [Position.North, Bid.Pass],
        [Position.East, Bid.S4],
        [Position.South, Bid.Pass],
        [Position.West, Bid.Pass],
        [Position.North, Bid.Pass],
      ] as readonly (readonly [Position, Bid])[],
      declarer: 'W',
      contract: '4S',
      dealTag: 'W:AJ73.KQ9.T983.AK Q94.AJT732.42.T6 KT52.8654.AJ6.72 86..KQ75.QJ98543',
      auctionTag: 'S',
    },
    {
      name: 'deal 76: 3D contract',
      hands: [
        ['53', 'AKQ65', '', 'KT8652'],
        ['Q2', '72', 'AQT987', 'A93'],
        ['K84', 'T983', 'KJ', 'QJ74'],
        ['AJT976', 'J4', '65432', ''],
      ] as readonly (readonly string[])[],
      auction: [
        [Position.South, Bid.Pass],
        [Position.West, Bid.H1],
        [Position.North, Bid.D2],
        [Position.East, Bid.Pass],
        [Position.South, Bid.D3],
        [Position.West, Bid.Pass],
        [Position.North, Bid.Pass],
        [Position.East, Bid.Pass],
      ] as readonly (readonly [Position, Bid])[],
      declarer: 'N',
      contract: '3D',
      dealTag: 'W:53.AKQ65..KT8652 Q2.72.AQT987.A93 K84.T983.KJ.QJ74 AJT976.J4.65432.',
      auctionTag: 'S',
    },
  ] as const;

  for (const fixture of cppFixtures) {
    it(`plays ${fixture.name} from auction through PBN`, () => {
      const deal = new Deal({
        dealer: Position.South,
        vulnerability: Vulnerability.NorthSouth,
        date: '2016.07.12',
      });
      deal.assignPbnHands(fixture.hands);

      for (const [position, bid] of fixture.auction) {
        deal.enterBid(position, bid);
      }

      expect(deal.contractTeam).toBeDefined();
      expect(deal.biddingHistoryPublic.length).toBe(fixture.auction.length);

      deal.beginRound();
      deal.playAllTricks();
      deal.updateDuplicateScore();

      const pbn = deal.writeFilePbn();
      expect(pbn).toContain(`[DEAL "${fixture.dealTag}"]`);
      expect(pbn).toContain(`[AUCTION "${fixture.auctionTag}"]`);
      expect(pbn).toContain(`[DECLARER "${fixture.declarer}"]`);
      expect(pbn).toContain(`[CONTRACT "${fixture.contract}"]`);
      expect(pbn).toContain('[PLAY "');
      expect(pbn).toContain('[GENERATOR "Easy Bridge version Version 4.0.2"]');
      expect(pbn).toContain('[DESCRIPTION ""]');
      expect(deal.playedTricks).toHaveLength(13);
      expect(deal.players.every(player => player.hand.length === 0)).toBe(true);
      expect(deal.tricksWonByTeam[0] + deal.tricksWonByTeam[1]).toBe(13);
    });
  }
});
