import { Play, PlayType, PlayProspect } from './play.js';
import { NONE } from '../constants.js';

export class Discard extends Play {
  constructor() {
    super(PlayType.Discard, NONE, NONE, PlayProspect.Loser);
  }

  override perform(): import('./play.js').PlayResult {
    this.status = 2;
    return this.status;
  }
}
