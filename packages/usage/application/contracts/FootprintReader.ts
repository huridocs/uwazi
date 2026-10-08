interface FootprintReader {
  /** Bytes the current tenant's data takes in one database engine. */
  databaseBytes(): Promise<number>;
}

export type { FootprintReader };
