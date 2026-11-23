import { Play, PlayType, PlayProspect } from './play.js';
import { NONE, Suit } from '../constants.js';

export class ExitPlay extends Play {
  constructor(suit: Suit | typeof NONE = NONE) {
    super(PlayType.Exit, NONE, suit, PlayProspect.Speculative);
  }

  override perform(): import('./play.js').PlayResult {
    this.status = 2;
    return this.status;
  }
}
