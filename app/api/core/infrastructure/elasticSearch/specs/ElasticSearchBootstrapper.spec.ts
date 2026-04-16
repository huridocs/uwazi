import { Client } from '@elastic/elasticsearch';
import type { IndexDefinition } from '../Types.js';
import {
  ElasticSearchBootstrapper,
  ElasticSearchBootstrapperDeps,
} from '../provision/ElasticSearchBootstrapper.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { Logger } from '#api/core/libs/logger/contracts/Logger.js';
import { config } from '#api/config.js';

const client = new Client({ node: config.elasticsearch.nodes });

const runId = Date.now();
let counter = 0;
// eslint-disable-next-line no-plusplus
const uniqueAlias = () => `test_bootstrapper_${runId}_${counter++}`;

const makeDefinition = (alias: string): IndexDefinition =>
  ({
    alias,
    physicalPrefix: alias,
    settings: { number_of_shards: 1 },
    mappings: { properties: { id: { type: 'keyword' } } },
  }) as unknown as IndexDefinition;

const deletePhysicalIndex = async (physicalIndex: string) => {
  await client.indices.delete({ index: physicalIndex }).catch(() => {
    /* already gone – ignore */
  });
};

const deletePipeline = async (pipelineId: string) => {
  await client.ingest.deletePipeline({ id: pipelineId }).catch(() => {
    /* already gone – ignore */
  });
};

const createSut = (deps: Omit<ElasticSearchBootstrapperDeps, 'client' | 'logger'>) => {
  const logger = TestUtils.mockClass<Logger>({ info: jest.fn() });

  const sut = new ElasticSearchBootstrapper({
    ...deps,
    client,
    logger,
  });
  return { sut, logger };
};

describe('ElasticSearchBootstrapper', () => {
  const createdIndexes: string[] = [];
  const createdPipelines: string[] = [];
  afterEach(async () => {
    while (createdIndexes.length) {
      // eslint-disable-next-line no-await-in-loop
      await deletePhysicalIndex(`${createdIndexes.pop()}_v1`);
    }
    while (createdPipelines.length) {
      // eslint-disable-next-line no-await-in-loop
      await deletePipeline(createdPipelines.pop()!);
    }
  });

  describe('Index bootstrapping', () => {
    it('skips creation when alias already exists', async () => {
      const alias = uniqueAlias();
      createdIndexes.push(alias);
      const { sut } = createSut({
        registry: { [alias]: makeDefinition(alias) },
      });

      await sut.execute();
      await sut.execute();

      const { body } = await client.indices.getAlias({ name: alias });
      const physicalIndices = Object.keys(body);
      expect(physicalIndices).toHaveLength(1);
      expect(physicalIndices[0]).toBe(`${alias}_v1`);
    });

    it('creates physical index with _v1 suffix when alias does not exist', async () => {
      const alias = uniqueAlias();
      createdIndexes.push(alias);
      const { sut } = createSut({
        registry: { [alias]: makeDefinition(alias) },
      });

      await sut.execute();

      const { body } = await client.indices.exists({ index: `${alias}_v1` });
      expect(body).toBe(true);
    });

    it('alias is created pointing to the physical index in the same call', async () => {
      const alias = uniqueAlias();
      createdIndexes.push(alias);
      const { sut } = createSut({
        registry: { [alias]: makeDefinition(alias) },
      });

      await sut.execute();

      const { body } = await client.indices.getAlias({ name: alias });
      const physicalIndex = Object.keys(body)[0];
      expect(physicalIndex).toBe(`${alias}_v1`);
      expect(body[physicalIndex].aliases).toHaveProperty(alias);
    });
    it('logs a skip message when alias already exists', async () => {
      const alias = uniqueAlias();
      createdIndexes.push(alias);
      const { sut, logger } = createSut({
        registry: { [alias]: makeDefinition(alias) },
      });

      await sut.execute();
      await sut.execute();

      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(alias));
    });

    describe('race condition: resource_already_exists_exception', () => {
      it('does not throw when a concurrent instance already created the physical index', async () => {
        const alias = uniqueAlias();
        createdIndexes.push(alias);

        // Simulate another backend instance having created the physical index
        // just before us, but WITHOUT the alias (so existsAlias returns false).
        await client.indices.create({
          index: `${alias}_v1`,
          body: { settings: { number_of_shards: 1 } },
        });

        const { sut } = createSut({
          registry: { [alias]: makeDefinition(alias) },
        });
        await expect(sut.execute()).resolves.not.toThrow();
      });

      it('still throws for unrelated ES errors', async () => {
        const alias = uniqueAlias();
        const { sut } = createSut({
          registry: {
            [alias]: {
              alias,
              physicalPrefix: alias,
              settings: { number_of_shards: 1 },
              mappings: { properties: { id: { type: 'not_a_real_type' } } },
            } as unknown as IndexDefinition,
          },
        });

        await expect(sut.execute()).rejects.toThrow();
      });
    });
  });
});
