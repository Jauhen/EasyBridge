import { Play, PlayType, PlayProspect } from './play.js';
import { NONE, Suit } from '../constants.js';

export class Force extends Play {
  constructor(suit: Suit | typeof NONE = NONE) {
    super(PlayType.Force, NONE, suit, PlayProspect.Speculative);
  }
}
