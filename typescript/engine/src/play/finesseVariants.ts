import { Finesse } from './finesse.js';
import { NONE, Suit } from '../constants.js';

export class Type1Finesse extends Finesse {
  constructor(suit: Suit | typeof NONE = NONE) { super(suit); }
}

export class Type2Finesse extends Finesse {
  constructor(suit: Suit | typeof NONE = NONE) { super(suit); }
}

export class Type3Finesse extends Finesse {
  constructor(suit: Suit | typeof NONE = NONE) { super(suit); }
}

export class TypeAFinesse extends Finesse {
  constructor(suit: Suit | typeof NONE = NONE) { super(suit); }
}

export class TypeBFinesse extends Finesse {
  constructor(suit: Suit | typeof NONE = NONE) { super(suit); }
}
