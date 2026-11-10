import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '#api/config.js';
import { ScratchDatabase } from '#api/infrastructure/tenant_backup/upgrade/ScratchDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROVISIONING_DIR = path.join(__dirname, '../postgresql/provisioning');

type ScratchDatabaseOptions = {
  /** Default `uwazi_upgrade`, so a database left behind by a killed process is easy to spot. */
  prefix?: string;
  /** Default: the provisioning scripts the real database was set up with. */
  provisioningSql?: string[];
};

class ScratchDatabaseFactory {
  static async create(options: ScratchDatabaseOptions = {}): Promise<ScratchDatabase> {
    return ScratchDatabase.create({
      host: config.postgres.host,
      port: config.postgres.port,
      maintenanceDatabase: 'postgres',
      admin: config.postgres.admin,
      migrator: config.postgres.migrator,
      app: config.postgres.app,
      prefix: options.prefix ?? 'uwazi_upgrade',
      provisioningSql: options.provisioningSql ?? ScratchDatabaseFactory.provisioningSql(),
    });
  }

  /** Every provisioning script, in file name order — the order provision_postgres.sh uses. */
  private static provisioningSql(): string[] {
    return readdirSync(PROVISIONING_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .map(file => readFileSync(path.join(PROVISIONING_DIR, file), 'utf8'));
  }
}

export { ScratchDatabaseFactory };
