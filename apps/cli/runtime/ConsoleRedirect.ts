import { format } from 'util';

const REDIRECTED_METHODS = ['log', 'info', 'debug'] as const;

type RedirectedMethod = (typeof REDIRECTED_METHODS)[number];

/**
 * stdout carries command output only. Legacy code logs through console.*, so those calls are
 * sent to stderr for the lifetime of the command.
 */
class ConsoleRedirect {
  private originals: Partial<Record<RedirectedMethod, Console[RedirectedMethod]>> = {};

  redirectToStderr(): void {
    REDIRECTED_METHODS.forEach(method => {
      this.originals[method] = console[method];
      console[method] = (...args: unknown[]) => {
        process.stderr.write(`${format(...args)}\n`);
      };
    });
  }

  restore(): void {
    REDIRECTED_METHODS.forEach(method => {
      const original = this.originals[method];
      if (original) {
        console[method] = original;
      }
    });
    this.originals = {};
  }
}

export { ConsoleRedirect };
