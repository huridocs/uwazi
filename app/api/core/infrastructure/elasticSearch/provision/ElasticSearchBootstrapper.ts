/* eslint-disable max-statements */
import { Client, errors } from '@elastic/elasticsearch';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { IndexDefinition } from '../Types.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

type Deps = {
  client: Client;
  registry: Record<string, IndexDefinition>;
  logger: Logger;
};

class ElasticSearchBootstrapper {
  constructor(private deps: Deps) {}

  async execute(): Promise<void> {
    await this.bootstrapIndexes();
  }

  async reset() {
    await this.deletePhysicalIndexes();
    await this.bootstrapIndexes();
  }

  private async deletePhysicalIndexes(): Promise<void> {
    await ArrayUtils.parallelFor(Object.values(this.deps.registry), async definition => {
      let physicalIndexes: string[];

      try {
        const aliasInfo = await this.deps.client.indices.getAlias({ name: definition.alias });
        physicalIndexes = Object.keys(aliasInfo.body);
      } catch (_err) {
        // alias does not exist yet — nothing to delete on first run
        physicalIndexes = [];
      }

      await ArrayUtils.parallelFor(physicalIndexes, async physicalIndex =>
        this.deps.client.indices.delete({ index: physicalIndex })
      );
    });
  }

  private async bootstrapIndexes() {
    await ArrayUtils.sequentialFor(Object.entries(this.deps.registry), async ([name, definition]) =>
      this.bootstrapIndex(name, definition)
    );
  }

  private async bootstrapIndex(_name: string, definition: IndexDefinition): Promise<void> {
    const { alias, physicalPrefix, settings, mappings } = definition;
    const physicalIndex = `${physicalPrefix}_v1`;

    const exists = await this.deps.client.indices.existsAlias({ name: alias });

    if (exists.body) {
      this.deps.logger.info(
        `[ElasticSearchBootstrapper] Alias "${alias}" already exists — skipping creation.`
      );
      return;
    }

    try {
      await this.deps.client.indices.create({
        index: physicalIndex,
        body: {
          settings,
          mappings,
          aliases: { [alias]: {} },
        },
      });

      this.deps.logger.info(
        `[ElasticSearchBootstrapper] Created physical index "${physicalIndex}" with alias "${alias}".`
      );
    } catch (err) {
      if (
        err instanceof errors.ResponseError &&
        err.meta.body?.error?.type === 'resource_already_exists_exception'
      ) {
        this.deps.logger.info(
          `[ElasticSearchBootstrapper] Physical index "${physicalIndex}" already exists (race condition) — skipping.`
        );
        return;
      }
      throw err;
    }
  }
}

export { ElasticSearchBootstrapper };
export type { Deps as ElasticSearchBootstrapperDeps };
