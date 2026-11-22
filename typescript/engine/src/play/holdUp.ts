import { Play, PlayType, PlayProspect } from './play.js';
import { NONE, Suit } from '../constants.js';

export class HoldUp extends Play {
  constructor(suit: Suit | typeof NONE = NONE) {
    super(PlayType.HoldUp, NONE, suit, PlayProspect.Speculative);
  }
}
