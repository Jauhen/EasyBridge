import { Card } from '../card.js';
import { NONE, Position, Suit } from '../constants.js';
import { Play, PlayType, PlayProspect } from './play.js';

export class Finesse extends Play {
  targetPosition: Position | typeof NONE = NONE;

  constructor(suit: Suit | typeof NONE = NONE, targetCard: Card | null = null) {
    super(PlayType.Finesse, NONE, suit, PlayProspect.Speculative);
    this.targetCard = targetCard;
  }
}
