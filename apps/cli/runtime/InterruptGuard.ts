import { EventEmitter } from 'events';

const INTERRUPTED_EXIT_CODE = 130;

/** On Ctrl-C, runs the cleanup (closing connections) and exits with the conventional 130. */
class InterruptGuard {
  private readonly handler = () => {
    this.cleanup()
      .catch(() => {})
      .finally(() => this.exit(INTERRUPTED_EXIT_CODE));
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
