/* eslint-disable max-statements */
import { Client, errors } from '@elastic/elasticsearch';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { IndexDefinition, IngestPipelineDefinition } from '../Types.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';

type Deps = {
  client: Client;
  registry: Record<string, IndexDefinition>;
  pipelineRegistry: Record<string, IngestPipelineDefinition>;
  logger: Logger;
};

class ElasticSearchBootstrapper {
  constructor(private deps: Deps) {}

  async execute(): Promise<void> {
    await this.bootstrapPipelines();
    await this.bootstrapIndexes();
  }

  private async bootstrapPipelines(): Promise<void> {
    await ArrayUtils.sequentialFor(
      Object.entries(this.deps.pipelineRegistry),
      async ([_name, definition]) => this.bootstrapPipeline(definition)
    );
  }

  private async bootstrapPipeline(definition: IngestPipelineDefinition): Promise<void> {
    try {
      await this.deps.client.ingest.getPipeline({ id: definition.id });
      this.deps.logger.info(
        `[ElasticSearchBootstrapper] Ingest pipeline "${definition.id}" already exists — skipping creation.`
      );
      return;
    } catch (err) {
      if (!(err instanceof errors.ResponseError && err.statusCode === 404)) {
        throw err;
      }
    }

    try {
      await this.deps.client.ingest.putPipeline({
        id: definition.id,
        body: { description: definition.description, processors: definition.processors },
      });
    } catch (err) {
      if (
        err instanceof errors.ResponseError &&
        err.meta.body?.error?.type === 'version_conflict_engine_exception'
      ) {
        this.deps.logger.info(
          `[ElasticSearchBootstrapper] Ingest pipeline "${definition.id}" already created by a concurrent instance — skipping.`
        );
        return;
      }
      throw err;
    }
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
