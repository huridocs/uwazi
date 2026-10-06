import type { Db } from 'mongodb';
import type { FootprintReader } from '../../application/contracts/FootprintReader.js';

/** One database per tenant, so its storage size is the tenant's footprint. */
class MongoFootprintReader implements FootprintReader {
  constructor(private readonly db: Db) {}

  async databaseBytes(): Promise<number> {
    const stats = await this.db.stats();
    return stats.storageSize ?? 0;
  }
}

export { MongoFootprintReader };
