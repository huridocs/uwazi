import { ConfirmationGate } from '../ConfirmationGate.js';

describe('ConfirmationGate', () => {
  it('should resolve a pending confirmation with the user decision', async () => {
    const gate = new ConfirmationGate();
    const pending = gate.wait('job-1', 'call-1');

    gate.resolve({ jobId: 'job-1', toolCallId: 'call-1', decision: 'yes' });

    await expect(pending).resolves.toBe('yes');
  });

  it('should remember skip-for-session after yes_dont_ask', async () => {
    const gate = new ConfirmationGate();
    const pending = gate.wait('job-1', 'call-1');
    gate.resolve({
      jobId: 'job-1',
      toolCallId: 'call-1',
      decision: 'yes_dont_ask',
      sessionId: 'session-9',
    });

    await expect(pending).resolves.toBe('yes_dont_ask');
    expect(gate.shouldSkipSession('session-9')).toBe(true);
    expect(gate.shouldSkipSession('other-session')).toBe(false);
  });

  it('should treat a missing confirmation as no after timeout', async () => {
    const gate = new ConfirmationGate({ timeoutMs: 10 });
    await expect(gate.wait('job-1', 'call-1')).resolves.toBe('no');
  });
});
