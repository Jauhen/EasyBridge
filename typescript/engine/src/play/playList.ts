//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// CPlayList (PlayList.h / PlayList.cpp)
//

import { IN_EITHER, Play, PlayType } from './play.js';

export class PlayList {
  private plays: Play[] = [];
  active = false;

  clear(): void {
    this.plays = [];
  }

  add(index: number, play: Play): void {
    this.plays.splice(index, 0, play);
  }

  append(play: Play): void {
    this.plays.push(play);
  }

  appendList(srcList: PlayList): void {
    if (srcList.size > 0) {
      this.plays.push(...srcList.all);
    }
  }

  setPlay(index: number, play: Play): void {
    if (index < 0) return;
    this.plays[index] = play;
  }

  remove(index: number): Play | null {
    if (index < 0 || index >= this.plays.length) return null;
    return this.plays.splice(index, 1)[0] ?? null;
  }

  removeTail(): Play | null {
    return this.plays.pop() ?? null;
  }

  push(play: Play): void {
    this.plays.unshift(play);
  }

  pop(): Play | null {
    return this.plays.shift() ?? null;
  }

  popTail(): Play | null {
    return this.removeTail();
  }

  move(oldPosition: number, newPosition: number): boolean {
    if (oldPosition === newPosition) return true;
    if (
      oldPosition < 0 ||
      oldPosition >= this.plays.length ||
      newPosition < 0 ||
      newPosition >= this.plays.length
    ) {
      return false;
    }
    const [play] = this.plays.splice(oldPosition, 1);
    this.plays.splice(newPosition, 0, play);
    return true;
  }

  defer(indexOrPlay: number | Play): boolean {
    const index = typeof indexOrPlay === 'number' ? indexOrPlay : this.find(indexOrPlay);
    if (index < 0 || index >= this.plays.length || index === this.plays.length - 1) return false;
    const [play] = this.plays.splice(index, 1);
    this.plays.splice(index + 1, 0, play);
    return true;
  }

  advance(indexOrPlay: number | Play): boolean {
    const index = typeof indexOrPlay === 'number' ? indexOrPlay : this.find(indexOrPlay);
    if (index <= 0 || index >= this.plays.length) return false;
    const [play] = this.plays.splice(index, 1);
    this.plays.splice(index - 1, 0, play);
    return true;
  }

  moveToFront(indexOrPlay: number | Play): boolean {
    const index = typeof indexOrPlay === 'number' ? indexOrPlay : this.find(indexOrPlay);
    if (index <= 0 || index >= this.plays.length) return false;
    const [play] = this.plays.splice(index, 1);
    this.plays.unshift(play);
    return true;
  }

  moveToEnd(indexOrPlay: number | Play): boolean {
    const index = typeof indexOrPlay === 'number' ? indexOrPlay : this.find(indexOrPlay);
    if (index < 0 || index >= this.plays.length) return false;
    const [play] = this.plays.splice(index, 1);
    this.plays.push(play);
    return true;
  }

  find(play: Play): number {
    return this.plays.findIndex(item => item.id === play.id);
  }

  //
  // RemoveSameCardPlays()
  //
  // - removes plays that use cards that are also used in the second play list
  // - returns the # of plays removed
  //
  removeSameCardPlays(other: PlayList | null): number {
    if (!other) return 0;
    let numPlaysRemoved = 0;
    for (let i = 0; i < this.plays.length; i++) {
      const consumed = this.plays[i].consumedCard;
      for (let j = 0; j < other.size; j++) {
        const otherConsumed = other.at(j)?.consumedCard;
        if (consumed && otherConsumed && consumed.deckValue === otherConsumed.deckValue) {
          this.remove(i);
          i--;
          numPlaysRemoved++;
          break;
        }
      }
    }
    return numPlaysRemoved;
  }

  getPlayType(index: number): PlayType | undefined {
    return this.plays[index]?.type;
  }

  getNumPlaysOfType(type: PlayType, side: number = IN_EITHER): number {
    let count = 0;
    for (const play of this.plays) {
      if (play.type === type) {
        if (side !== IN_EITHER && play.targetHand !== side) continue;
        count++;
      }
    }
    return count;
  }

  getPlaysOfType(type: PlayType, side: number = IN_EITHER): PlayList | null {
    const list = new PlayList();
    for (const play of this.plays) {
      if (play.type === type) {
        if (side !== IN_EITHER && play.targetHand !== side) continue;
        list.append(play);
      }
    }
    return list.size === 0 ? null : list;
  }

  get size(): number {
    return this.plays.length;
  }

  get isEmpty(): boolean {
    return this.plays.length === 0;
  }

  at(index: number): Play | undefined {
    return this.plays[index];
  }

  get head(): Play | null {
    return this.plays[0] ?? null;
  }

  get tail(): Play | null {
    return this.plays[this.plays.length - 1] ?? null;
  }

  activate(active = true): void {
    this.active = active;
  }

  get isActive(): boolean {
    return this.active;
  }

  get all(): readonly Play[] {
    return this.plays;
  }
}
