import { Convention, ConventionContext } from './convention.js';
import { ConventionStatus } from './biddingCodes.js';

/**
 * Base convention for Blackwood/RKCB and cue-bid slam inquiry.
 * CSlamConvention originally returned FALSE until invoked by CBidEngine.
 * This TypeScript implementation deliberately leaves automatic slam inquiry
 * to subclass checks and records only the active status.
 */
export class SlamConvention extends Convention {
  constructor(id: number) {
    super(id);
  }

  override tryConvention(context: ConventionContext): never | null {
    void context;
    context.bidContext.status = ConventionStatus.Inactive;
    return null;
  }
}
