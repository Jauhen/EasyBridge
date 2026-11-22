import { Play } from './play.js';

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
    if (oldPosition < 0 || oldPosition >= this.plays.length ||
      newPosition < 0 || newPosition >= this.plays.length) return false;
    const [play] = this.plays.splice(oldPosition, 1);
    this.plays.splice(newPosition, 0, play);
    return true;
  }

  defer(index: number): boolean {
    if (index < 0 || index >= this.plays.length || index === this.plays.length - 1) return false;
    const [play] = this.plays.splice(index, 1);
    this.plays.splice(index + 1, 0, play);
    return true;
  }

  advance(index: number): boolean {
    if (index <= 0 || index >= this.plays.length) return false;
    const [play] = this.plays.splice(index, 1);
    this.plays.splice(index - 1, 0, play);
    return true;
  }

  find(play: Play): number {
    return this.plays.indexOf(play);
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
