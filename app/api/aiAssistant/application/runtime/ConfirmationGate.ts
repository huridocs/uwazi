type ConfirmationDecision = 'yes' | 'yes_dont_ask' | 'no';

type PendingConfirmation = {
  resolve: (decision: ConfirmationDecision) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type ConfirmationGateOptions = {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

class ConfirmationGate {
  private readonly timeoutMs: number;

  private readonly pending = new Map<string, PendingConfirmation>();

  private readonly early = new Map<string, ConfirmationDecision>();

  private readonly skippedSessions = new Set<string>();

  constructor(options: ConfirmationGateOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async wait(jobId: string, toolCallId: string): Promise<ConfirmationDecision> {
    const key = ConfirmationGate.key(jobId, toolCallId);
    const early = this.early.get(key);
    if (early) {
      this.early.delete(key);
      return early;
    }

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        this.pending.delete(key);
        resolve('no');
      }, this.timeoutMs);
      this.pending.set(key, { resolve, timeout });
    });
  }

  resolve(input: {
    jobId: string;
    toolCallId: string;
    decision: ConfirmationDecision;
    sessionId?: string;
  }): void {
    if (input.decision === 'yes_dont_ask' && input.sessionId) {
      this.skippedSessions.add(input.sessionId);
    }
    this.settle(ConfirmationGate.key(input.jobId, input.toolCallId), input.decision);
  }

  private settle(key: string, decision: ConfirmationDecision): void {
    const pending = this.pending.get(key);
    if (!pending) {
      this.early.set(key, decision);
      return;
    }
    clearTimeout(pending.timeout);
    this.pending.delete(key);
    pending.resolve(decision);
  }

  shouldSkipSession(sessionId?: string): boolean {
    return Boolean(sessionId && this.skippedSessions.has(sessionId));
  }

  skipForSession(sessionId: string): void {
    this.skippedSessions.add(sessionId);
  }

  clearSession(sessionId: string): void {
    this.skippedSessions.delete(sessionId);
  }

  private static key(jobId: string, toolCallId: string) {
    return `${jobId}:${toolCallId}`;
  }
}

const defaultConfirmationGate = new ConfirmationGate();

export { ConfirmationGate, defaultConfirmationGate };
export type { ConfirmationDecision };
