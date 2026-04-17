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
