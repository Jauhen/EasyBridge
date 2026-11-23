import { Play, PlayType, PlayProspect } from './play.js';
import { NONE, Suit } from '../constants.js';

export class TrumpPull extends Play {
  constructor(trumpSuit: Suit | typeof NONE = NONE) {
    super(PlayType.TrumpPull, NONE, trumpSuit, PlayProspect.LikelyWinner);
  }

  override perform(): import('./play.js').PlayResult {
    this.status = 2;
    return this.status;
  }
}
