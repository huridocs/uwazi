/**
 * Tells the process that the tenant registry changed. Transport only: debouncing and reloading the
 * registry belong to the caller, so every backend shares them.
 */
interface TenantsChangeFeed {
  start(onChange: () => void, onError: (error: Error) => void): Promise<void>;
  stop(): Promise<void>;
}

export type { TenantsChangeFeed };
