/** The command line itself is wrong: unknown command or option, missing subcommand. */
class UsageError extends Error {
  readonly code = 'usage.invalid';

  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

export { UsageError };
