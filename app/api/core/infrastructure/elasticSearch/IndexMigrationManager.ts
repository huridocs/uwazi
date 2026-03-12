import { Client } from '@elastic/elasticsearch';
import { IndexDefinition, MigrationValidationError } from './Types';

interface MigrationOptions {
  indexName: string;
  targetVersion: number;
  waitForCompletion?: boolean;
  validate?: (client: Client, newPhysicalIndex: string) => Promise<boolean>;
}

type Deps = {
  client: Client;
  registry: Record<string, IndexDefinition>;
};

class IndexMigrationManager {
  constructor(private deps: Deps) {}

  async migrate(options: MigrationOptions): Promise<void> {
    const definition = this.deps.registry[options.indexName];

    if (!definition) {
      throw new Error(`Unknown index "${options.indexName}" — not found in registry.`);
    }

    const { alias, physicalPrefix, settings, mappings } = definition;
    const currentPhysical = await this.resolvePhysicalIndex(alias);
    const currentVersion = IndexMigrationManager.parseVersion(currentPhysical);

    if (currentVersion === options.targetVersion) {
      return;
    }

    await this.buildAndMigrate({
      options,
      physicalPrefix,
      settings,
      mappings,
      alias,
      currentPhysical,
    });
  }

  /**
   * Runs a two-pass reindex (bulk + delta) then atomically swaps the alias.
   *
   * **Residual gap:** documents written between the delta reindex completion and the alias swap
   * are not captured by either pass. This window is typically sub-second. Affected documents will
   * self-heal on their next write, which updates `updatedAt` and causes them to appear in any
   * subsequent migration. If zero residual gap is required, use split read/write aliases.
   */
  private async buildAndMigrate({
    options,
    physicalPrefix,
    settings,
    mappings,
    alias,
    currentPhysical,
  }: {
    options: MigrationOptions;
    physicalPrefix: string;
    settings: IndexDefinition['settings'];
    mappings: IndexDefinition['mappings'];
    alias: string;
    currentPhysical: string;
  }): Promise<void> {
    const newPhysical = `${physicalPrefix}_v${options.targetVersion}`;
    await this.deps.client.indices.create({ index: newPhysical, body: { settings, mappings } });

    const waitForCompletion = options.waitForCompletion ?? true;
    const startedAt = new Date().toISOString();

    await this.deps.client.reindex({
      wait_for_completion: waitForCompletion,
      body: { source: { index: currentPhysical }, dest: { index: newPhysical } },
    });

    await this.deltaReindex(currentPhysical, newPhysical, startedAt, waitForCompletion);
    await this.runValidation(options.validate, newPhysical);
    await this.swapAlias(alias, currentPhysical, newPhysical);

    // eslint-disable-next-line no-console
    console.log(
      `[IndexMigrationManager] Migration complete. Old index "${currentPhysical}" retained — delete manually when safe.`
    );
  }

  private async deltaReindex(
    currentPhysical: string,
    newPhysical: string,
    startedAt: string,
    waitForCompletion: boolean
  ): Promise<void> {
    await this.deps.client.reindex({
      wait_for_completion: waitForCompletion,
      body: {
        source: {
          index: currentPhysical,
          query: { range: { updatedAt: { gte: startedAt } } },
        },
        dest: { index: newPhysical },
      },
    });
  }

  async rollback(indexName: string, toVersion: number): Promise<void> {
    const definition = this.deps.registry[indexName];

    if (!definition) {
      throw new Error(`Unknown index "${indexName}" — not found in registry.`);
    }

    const { alias, physicalPrefix } = definition;
    const targetPhysical = `${physicalPrefix}_v${toVersion}`;

    const existsResponse = await this.deps.client.indices.exists({ index: targetPhysical });

    if (!existsResponse.body) {
      throw new Error(
        `Rollback target "${targetPhysical}" does not exist — was it deleted post-migration?`
      );
    }

    const currentPhysical = await this.resolvePhysicalIndex(alias);
    await this.swapAlias(alias, currentPhysical, targetPhysical);
  }

  private async resolvePhysicalIndex(alias: string): Promise<string> {
    let response;

    try {
      response = await this.deps.client.indices.getAlias({ name: alias });
    } catch {
      throw new Error(`Alias "${alias}" not found.`);
    }

    const indexes = Object.keys(response.body);

    if (indexes.length === 0) {
      throw new Error(`Alias "${alias}" not found.`);
    }

    if (indexes.length > 1) {
      throw new Error(
        `Alias "${alias}" points to multiple indexes: ${indexes.join(', ')}. Ambiguous write target.`
      );
    }

    return indexes[0];
  }

  private async runValidation(
    validate: MigrationOptions['validate'],
    newPhysical: string
  ): Promise<void> {
    if (!validate) {
      return;
    }

    const valid = await validate(this.deps.client, newPhysical);

    if (!valid) {
      await this.deps.client.indices.delete({ index: newPhysical });
      throw new MigrationValidationError(newPhysical);
    }
  }

  private async swapAlias(alias: string, fromIndex: string, toIndex: string): Promise<void> {
    await this.deps.client.indices.updateAliases({
      body: {
        actions: [{ remove: { index: fromIndex, alias } }, { add: { index: toIndex, alias } }],
      },
    });
  }

  private static parseVersion(physicalIndex: string): number {
    const match = physicalIndex.match(/_v(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

export type { MigrationOptions };
export { IndexMigrationManager };
