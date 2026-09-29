import { EventEmitter } from 'events';
import { ExitCode } from '../errors/ExitCode.js';

/** On Ctrl-C, runs the cleanup (closing connections) and exits with the conventional 130. */
class InterruptGuard {
  private readonly handler = () => {
    this.cleanup()
      .catch(() => {})
      .finally(() => this.exit(ExitCode.Interrupted));
  };

  constructor(
    private readonly cleanup: () => Promise<void>,
    private readonly exit: (code: number) => void = process.exit,
    private readonly signals: EventEmitter = process
  ) {}

  listen(): void {
    this.signals.once('SIGINT', this.handler);
  }

  stop(): void {
    this.signals.off('SIGINT', this.handler);
  }
}

export { InterruptGuard };
