import { Play, PlayType, PlayProspect } from './play.js';
import { NONE, Suit } from '../constants.js';

export class Drop extends Play {
  constructor(suit: Suit | typeof NONE = NONE) {
    super(PlayType.Drop, NONE, suit, PlayProspect.Speculative);
  }
}
