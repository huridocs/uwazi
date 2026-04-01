/* eslint-disable max-statements */
import type { Client } from '@elastic/elasticsearch';
import type { IndexMigrationManager } from '../IndexMigrationManager.js';
import {
  MigrationAlreadyOnVersionError,
  MigrationValidationError,
  type IndexDefinition,
} from '../Types.js';

interface MigrateArgs {
  indexName: string;
  targetVersion: number;
  waitForCompletion: boolean;
  dryRun: boolean;
}

interface RollbackArgs {
  indexName: string;
  toVersion: number;
}

interface ScriptResult {
  exitCode: 0 | 1;
  output: string;
  error?: string;
}

type Deps = {
  manager: IndexMigrationManager;
  registry: Record<string, IndexDefinition>;
  client: Client;
};

class MigrationScriptRunner {
  constructor(private deps: Deps) {}

  async runMigration(args: MigrateArgs): Promise<ScriptResult> {
    const { indexName, targetVersion, waitForCompletion, dryRun } = args;

    if (!this.deps.registry[indexName]) {
      return this.unknownIndexError(indexName);
    }

    const definition = this.deps.registry[indexName];
    const targetPhysical = `${definition.physicalPrefix}_v${targetVersion}`;

    if (dryRun) {
      const currentPhysical = await this.deps.manager.getCurrentPhysicalIndex(indexName);
      const output = [
        '  Dry run — no changes made',
        `  Index:           ${indexName}`,
        `  Current:         ${currentPhysical}`,
        `  Would migrate →  ${targetPhysical}`,
      ].join('\n');
      return { exitCode: 0, output };
    }

    const previousPhysical = await this.deps.manager.getCurrentPhysicalIndex(indexName);
    const start = Date.now();

    try {
      await this.deps.manager.migrate({ indexName, targetVersion, waitForCompletion });
    } catch (err) {
      if (err instanceof MigrationAlreadyOnVersionError) {
        return {
          exitCode: 0,
          output: `  Index "${indexName}" is already on version ${targetVersion} — nothing to do.`,
        };
      }
      if (err instanceof MigrationValidationError) {
        return {
          exitCode: 1,
          output: '',
          error: `${err.message}\n  The alias is unchanged.`,
        };
      }
      return {
        exitCode: 1,
        output: '',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const duration = Date.now() - start;
    const output = [
      '✓ Migration complete',
      `  Index:           ${indexName}`,
      `  Previous:        ${previousPhysical}`,
      `  Current:         ${targetPhysical}`,
      `  Duration:        ${duration}ms`,
      `  Note: "${previousPhysical}" retained — delete manually when safe.`,
    ].join('\n');

    return { exitCode: 0, output };
  }

  async runRollback(args: RollbackArgs): Promise<ScriptResult> {
    const { indexName, toVersion } = args;

    if (!this.deps.registry[indexName]) {
      return this.unknownIndexError(indexName);
    }

    const definition = this.deps.registry[indexName];
    const rolledBackTo = `${definition.physicalPrefix}_v${toVersion}`;
    const start = Date.now();

    try {
      await this.deps.manager.rollback(indexName, toVersion);
    } catch (err) {
      return {
        exitCode: 1,
        output: '',
        error: err instanceof Error ? err.message : String(err),
      };
    }

    const duration = Date.now() - start;
    const output = [
      '✓ Rollback complete',
      `  Index:           ${indexName}`,
      `  Rolled back to:  ${rolledBackTo}`,
      `  Duration:        ${duration}ms`,
    ].join('\n');

    return { exitCode: 0, output };
  }

  async runList(options: { json?: boolean } = {}): Promise<ScriptResult> {
    const entries = Object.entries(this.deps.registry);

    const rows = await Promise.all(
      entries.map(async ([name, definition]) => {
        try {
          const { body } = await this.deps.client.indices.getAlias({ name: definition.alias });
          const physicalIndex = Object.keys(body)[0] ?? 'unknown';
          const match = physicalIndex.match(/_v(\d+)$/);
          const versionLabel = match ? `v${match[1]}` : 'unknown';
          const versionNum = match ? parseInt(match[1], 10) : null;
          return { name, alias: definition.alias, physicalIndex, versionLabel, versionNum };
        } catch {
          return {
            name,
            alias: definition.alias,
            physicalIndex: 'unknown',
            versionLabel: 'unknown',
            versionNum: null,
          };
        }
      })
    );

    if (options.json) {
      const jsonData = rows.map(r => ({
        indexName: r.name,
        alias: r.alias,
        physicalIndex: r.physicalIndex,
        version: r.versionNum,
      }));
      return { exitCode: 0, output: JSON.stringify(jsonData, null, 2) };
    }

    const COL = { name: 14, alias: 32, physical: 34, version: 7 };
    const line = (name: string, alias: string, physical: string, version: string): string =>
      `  ${name.padEnd(COL.name)}${alias.padEnd(COL.alias)}${physical.padEnd(COL.physical)}${version}`;

    const header = line('Index', 'Alias', 'Physical', 'Version');
    const divider = line('─'.repeat(10), '─'.repeat(30), '─'.repeat(30), '─'.repeat(7));
    const dataRows = rows.map(r => line(r.name, r.alias, r.physicalIndex, r.versionLabel));

    const output = [header, divider, ...dataRows].join('\n');
    return { exitCode: 0, output };
  }

  private unknownIndexError(indexName: string): ScriptResult {
    const valid = Object.keys(this.deps.registry).join(', ');
    return {
      exitCode: 1,
      output: '',
      error: `Unknown index "${indexName}". Valid indexes: ${valid || '(none)'}`,
    };
  }
}

export type { MigrateArgs, RollbackArgs, ScriptResult };
export { MigrationScriptRunner };
