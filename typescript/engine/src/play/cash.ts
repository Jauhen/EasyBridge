import { Play, PlayType, PlayProspect } from './play.js';
import { NONE, Suit } from '../constants.js';

export class Cash extends Play {
  constructor(suit: Suit | typeof NONE = NONE, prospect = PlayProspect.LikelyWinner) {
    super(PlayType.Cash, NONE, suit, prospect);
  }

  override perform(): import('./play.js').PlayResult {
    this.status = 2;
    return this.status;
  }
}
