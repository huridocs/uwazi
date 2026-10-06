interface ActivityReader {
  /** Epoch ms of the tenant's latest session activity; null when it has none. */
  lastSession(tenantName: string): Promise<number | null>;
}

export type { ActivityReader };
