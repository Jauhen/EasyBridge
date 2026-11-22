import { Card } from '../card.js';
import { CardList } from '../cardList.js';

export class DisplayHoldings extends CardList {
  private dummy = false;

  setDummy(dummy = true): void {
    this.dummy = dummy;
  }

  override add(card: Card, sort = true): void {
    super.add(card, sort);
  }

  override sort(): void {
    // DisplayHoldings uses ascending on-screen display order. This public
    // implementation keeps the explicit dummy position hook for later UI work.
    void this.dummy;
    super.sort();
  }
}
