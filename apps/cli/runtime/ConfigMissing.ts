class ConfigMissing extends Error {
  readonly code = 'config.missing';

  constructor(readonly missing: string[]) {
    super(`Missing required configuration: ${missing.join(', ')}`);
    this.name = 'ConfigMissing';
  }
}

export { ConfigMissing };
