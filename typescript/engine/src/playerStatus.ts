//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//===========================================================
//
// CPlayerStatusDialog (PlayerStatusDialog.H / PlayerStatusDialog.CPP)
//
// wrapper around the CAnalysisDialog class
//

import { Position } from './constants.js';

// const tnDefaultTraceLevel = 3;
export const DEFAULT_TRACE_LEVEL = 1;
// const tnDefaultRequiredHintTraceLevel = 1;
export const DEFAULT_REQUIRED_HINT_TRACE_LEVEL = 3;

export interface PlayerStatusOptions {
  enableAnalysisTracing?: boolean;
  analysisTraceLevel?: number;
  showCommentIdentifiers?: boolean;
  inExpressAutoPlay?: boolean;
  convertCrlf?: boolean;
  onAnalysisText?: (position: Position, text: string) => void;
  onHintText?: (text: string) => void;
}

export class PlayerStatus {
  // hint info is per-class
  private static autoHintMode = false;
  private static copyHintBlock = false;
  private static requiredHintTraceLevel = DEFAULT_REQUIRED_HINT_TRACE_LEVEL;
  private static suspendHints = 0;
  private static hintBlock = '';

  position: Position = Position.South;
  private analysis = '';
  private currentOutputLevel = 0;
  private overrideOutputLevel = 0;
  private suppressCode = 1;
  private suppressOutput = false;
  private suppressStream = false;
  private ignoreStreamLevel = false;
  private traceEnabled = true;

  // configurable equivalents of AppInterface/Settings flags
  enableAnalysisTracing: boolean;
  analysisTraceLevel: number;
  showCommentIdentifiers: boolean;
  inExpressAutoPlay: boolean;
  convertCrlf: boolean;
  private readonly onAnalysisText?: (position: Position, text: string) => void;
  private readonly onHintText?: (text: string) => void;

  constructor(options: PlayerStatusOptions = {}) {
    this.enableAnalysisTracing = options.enableAnalysisTracing ?? true;
    this.analysisTraceLevel = options.analysisTraceLevel ?? 4;
    this.showCommentIdentifiers = options.showCommentIdentifiers ?? true;
    this.inExpressAutoPlay = options.inExpressAutoPlay ?? false;
    this.convertCrlf = options.convertCrlf ?? false;
    this.onAnalysisText = options.onAnalysisText;
    this.onHintText = options.onHintText;
  }

  //
  // EnableTrace()
  //
  // now semaphore based
  //
  enableTrace(enabled = true): void {
    if (enabled) this.suppressCode++;
    else this.suppressCode--;

    if (this.suppressCode === 0) {
      this.suppressOutput = true;
    } else {
      this.suppressOutput = false;
    }
  }

  get isTraceEnabled(): boolean {
    return !this.suppressOutput;
  }

  //
  // OutputText()
  //
  private outputText(): void {
    // show all text in the mainframe status window
    this.onAnalysisText?.(this.position, this.analysis);
  }

  //
  // Clear()
  //
  clear(): void {
    this.analysis = '';
    PlayerStatus.autoHintMode = false;
    this.currentOutputLevel = 0;
    this.overrideOutputLevel = 0;
    this.suppressStream = false;
    //
    PlayerStatus.copyHintBlock = false;
    PlayerStatus.hintBlock = '';
    //
    this.outputText();
  }

  //
  // ClearHint()
  //
  clearHint(): void {
    PlayerStatus.copyHintBlock = false;
    PlayerStatus.hintBlock = '';
    this.onHintText?.(PlayerStatus.hintBlock);
  }

  resetRequiredHintTraceLevel(): void {
    PlayerStatus.requiredHintTraceLevel = DEFAULT_REQUIRED_HINT_TRACE_LEVEL;
  }

  show(enabled = true): void {
    this.traceEnabled = enabled;
  }

  setPosition(position: Position): void {
    this.position = position;
  }

  get text(): string {
    return this.analysis;
  }

  // routines to temporarily assign a verbosity level to a stream
  setStreamOutputLevel(level: number): void {
    this.overrideOutputLevel = level;
  }

  clearStreamOutputLevel(): void {
    this.overrideOutputLevel = 0;
  }

  setRequiredHintTraceLevel(level: number): void {
    PlayerStatus.requiredHintTraceLevel = level;
  }

  static suspendHintOutput(): void {
    PlayerStatus.suspendHints++;
  }

  static resumeHintOutput(): void {
    if (--PlayerStatus.suspendHints < 0) {
      PlayerStatus.suspendHints = 0;
    }
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

  // Auto Hint routines
  setAutoHintMode(enabled: boolean): void {
    PlayerStatus.autoHintMode = enabled;
  }

  static get autoHintEnabled(): boolean {
    return PlayerStatus.autoHintMode;
  }

  static get hintBlockText(): string {
    return PlayerStatus.hintBlock;
  }

  beginHintBlock(): void {
    // /*m_strHintBlock = _T("");*/ m_bCopyHintBlock = TRUE;
    PlayerStatus.copyHintBlock = true;
  }

  endHintBlock(): void {
    PlayerStatus.copyHintBlock = false;
  }

  //
  // ClearHints()
  //
  clearHints(_refresh = false): void {
    PlayerStatus.hintBlock = '';
    this.onHintText?.(PlayerStatus.hintBlock);
  }

  //
  // operator<< is the same as Trace()
  //
  // outputs a complete line to the player status dialog
  //
  stream(value: string | number): PlayerStatus {
    if (typeof value === 'number') {
      this.trace(Number.isInteger(value) ? String(value) : value.toFixed(1));
    } else {
      this.trace(value);
    }
    return this;
  }

  //
  // the operators < and & are the same as <<, but without
  // the check for the debug mode / header stripping
  //
  addStream(value: string | number): PlayerStatus {
    if (typeof value === 'number') {
      this.addTrace(Number.isInteger(value) ? String(value) : value.toFixed(1));
    } else {
      this.addTrace(value);
    }
    return this;
  }

  //
  // Trace()
  //
  trace(strText: string): void {
    // sanity check
    let strOutput = strText;
    if (!this.traceEnabled || !strOutput || this.suppressStream) {
      return;
    }

    // no analysis if in express autoplay or output is suppressed
    if (this.inExpressAutoPlay || this.suppressOutput) {
      return;
    }

    // need to be either printing analysis or providing a hint
    if (!this.enableAnalysisTracing && !PlayerStatus.copyHintBlock) {
      return;
    }

    // get and test the trace level
    const traceLevelLimit = this.analysisTraceLevel;
    this.currentOutputLevel = 0;

    // see if a verbosity escape code is present
    if (strOutput[0] === '!') {
      this.ignoreStreamLevel = true;
      strOutput = strOutput.slice(1);
    } else {
      this.ignoreStreamLevel = false;
    }

    // see if a verbosity level code is present
    if (strOutput.length > 0 && strOutput[0] >= '0' && strOutput[0] <= '9') {
      this.currentOutputLevel = strOutput.charCodeAt(0) - '0'.charCodeAt(0);
    } else {
      this.currentOutputLevel = DEFAULT_TRACE_LEVEL;
    }

    // look for an autohint bypass (not so informative information)
    let skipAutoHint = false;
    if (strOutput[0] === '$') {
      skipAutoHint = true;
      strOutput = strOutput.slice(1);
    }

    // check for temporary stream level override
    if (this.overrideOutputLevel > 0 && !this.ignoreStreamLevel) {
      this.currentOutputLevel = this.overrideOutputLevel;
    }

    // skip if the verbosity in the stream is too high
    if (this.currentOutputLevel > traceLevelLimit) {
      // if this string doesn't contain a CR, suppress remainder of output stream
      if (!strOutput.includes('\n')) {
        this.suppressStream = true;
      }
      return;
    }

    // strip the verbosity level digit
    if (strOutput.length > 0 && strOutput[0] >= '0' && strOutput[0] <= '9') {
      strOutput = strOutput.slice(1);
    }

    // convert newlines
    const { output: strNewText, hasNewline } = this.convertNewlines(strOutput);

    // show analysis notes
    if (this.enableAnalysisTracing) {
      this.analysis += strNewText;
      if (hasNewline) {
        this.outputText();
      }
    }

    // and show hints
    if (
      PlayerStatus.copyHintBlock &&
      !skipAutoHint &&
      PlayerStatus.suspendHints === 0 &&
      this.currentOutputLevel <= PlayerStatus.requiredHintTraceLevel
    ) {
      // route to the autohint window
      PlayerStatus.hintBlock += strNewText;
      this.onHintText?.(PlayerStatus.hintBlock);
    }
  }

  //
  // AddTrace()
  //
  // - adds text to the status dialog text buffer. The window is
  // updated with the new text only if there's a newline character
  // in the text.
  //
  addTrace(strText: string): void {
    // no analysis if in express autoplay or output is suppressed
    if (!this.traceEnabled || this.inExpressAutoPlay || this.suppressOutput) {
      return;
    }

    // need to be either printing analysis or providing a hint
    if (!this.enableAnalysisTracing && !PlayerStatus.copyHintBlock) {
      return;
    }

    const { output: strNewText, hasNewline } = this.convertNewlines(strText);
    if (this.suppressStream) {
      if (hasNewline) {
        this.suppressStream = false; // reset
      }
    } else {
      // show analysis notes if enabled
      if (this.enableAnalysisTracing) {
        this.analysis += strNewText;
        if (hasNewline) {
          this.outputText();
        }
      }

      // and update hint window
      if (
        PlayerStatus.copyHintBlock &&
        PlayerStatus.suspendHints === 0 &&
        this.currentOutputLevel <= PlayerStatus.requiredHintTraceLevel
      ) {
        // route to the autohint window
        PlayerStatus.hintBlock += strNewText;
        this.onHintText?.(PlayerStatus.hintBlock);
      }
    }
  }

  //
  // ConvertNewlines()
  //
  // - replaces all instances of the '\n' character in the source string
  //   with the "\r\n" pair when convertCrlf is enabled, and strips
  //   comment identifier headers ("CODE! ") when showCommentIdentifiers is false.
  //
  private convertNewlines(input: string): { output: string; hasNewline: boolean } {
    let text = input;

    // if in debug, strip header if desired
    if (!this.showCommentIdentifiers) {
      const bangIndex = text.indexOf('!');
      if (bangIndex !== -1) {
        // chop off the header
        const offset = bangIndex + 2;
        if (text.length >= offset) {
          text = text.slice(offset);
        }
      }
    }

    let output = '';
    let hasNewline = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\n') {
        output += this.convertCrlf ? '\r\n' : '\n';
        hasNewline = true;
      } else if (ch === '!') {
        // replace any exclamation points
        output += ':';
      } else {
        output += ch;
      }
    }
    return { output, hasNewline };
  }

  // Convenience wrappers retained for existing TS callers
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
