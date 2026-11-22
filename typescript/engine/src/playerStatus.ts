import { Position } from './constants.js';

export class PlayerStatus {
  private static requiredHintTraceLevel = 3;
  private static suspendHints = 0;
  private static hintBlock = '';
  private static autoHintMode = false;

  position: Position = Position.South;
  private analysis = '';
  private overrideOutputLevel = 0;
  private suppressCode = 1;
  private suppressOutput = false;
  private suppressStream = false;
  private traceEnabled = true;

  clear(): void {
    this.analysis = '';
    this.overrideOutputLevel = 0;
    this.suppressStream = false;
  }

  clearHint(): void {
    PlayerStatus.hintBlock = '';
  }

  show(enabled = true): void {
    this.traceEnabled = enabled;
  }

  enableTrace(enabled = true): void {
    this.suppressCode += enabled ? 1 : -1;
    this.suppressOutput = this.suppressCode === 0;
  }

  setPosition(position: Position): void {
    this.position = position;
  }

  get text(): string {
    return this.analysis;
  }

  setStreamOutputLevel(level: number): void {
    this.overrideOutputLevel = level;
  }

  clearStreamOutputLevel(): void {
    this.overrideOutputLevel = 0;
  }

  setRequiredHintTraceLevel(level: number): void {
    PlayerStatus.requiredHintTraceLevel = level;
  }

  resetRequiredHintTraceLevel(): void {
    PlayerStatus.requiredHintTraceLevel = 3;
  }

  static suspendHintOutput(): void {
    PlayerStatus.suspendHints++;
  }

  static resumeHintOutput(): void {
    PlayerStatus.suspendHints = Math.max(0, PlayerStatus.suspendHints - 1);
  }

  static get hintTraceLevel(): number {
    return PlayerStatus.requiredHintTraceLevel;
  }

  static setHintTraceLevel(level: number): void {
    PlayerStatus.requiredHintTraceLevel = level;
  }

  static get hintsSuspended(): boolean {
    return PlayerStatus.suspendHints > 0;
  }

  setAutoHintMode(enabled: boolean): void {
    PlayerStatus.autoHintMode = enabled;
  }

  static get autoHintEnabled(): boolean {
    return PlayerStatus.autoHintMode;
  }

  beginHintBlock(): void {
    PlayerStatus.hintBlock = '';
  }

  endHintBlock(): void {
    // The block is retained so callers can query clear hints later.
  }

  clearHints(): void {
    PlayerStatus.hintBlock = '';
  }

  trace(text: string): void {
    if (!this.traceEnabled || this.suppressOutput || !text || this.suppressStream) return;
    this.analysis += text;
  }

  append(text: string): PlayerStatus {
    this.trace(text);
    return this;
  }

  appendLine(text: string): PlayerStatus {
    this.trace(`${text}\n`);
    return this;
  }

  appendNumber(value: number, precision?: number): PlayerStatus {
    this.trace(precision === undefined ? String(value) : value.toFixed(precision));
    return this;
  }
}
