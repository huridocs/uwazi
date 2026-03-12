import { Client } from '@elastic/elasticsearch';
import type { IndexDefinition, IngestPipelineDefinition } from '../Types.js';
import {
  ElasticSearchBootstrapper,
  ElasticSearchBootstrapperDeps,
} from '../provision/ElasticSearchBootstrapper.js';

const client = new Client({ node: 'http://localhost:9200' });

const runId = Date.now();
let counter = 0;
// eslint-disable-next-line no-plusplus
const uniqueAlias = () => `test_bootstrapper_${runId}_${counter++}`;
// eslint-disable-next-line no-plusplus
const uniquePipelineId = () => `test_pipeline_${runId}_${counter++}`;

const makeDefinition = (alias: string): IndexDefinition =>
  ({
    alias,
    physicalPrefix: alias,
    settings: { number_of_shards: 1 },
    mappings: { properties: { id: { type: 'keyword' } } },
  }) as unknown as IndexDefinition;

const makePipelineDefinition = (id: string): IngestPipelineDefinition => ({
  id,
  description: 'test pipeline',
  processors: [{ set: { field: 'test_field', value: 'bootstrapped' } }],
});

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

const createSut = (deps: Omit<ElasticSearchBootstrapperDeps, 'client'>) => {
  const sut = new ElasticSearchBootstrapper({ ...deps, client });
  return { sut };
};

describe('ElasticSearchBootstrapper', () => {
  let logSpy: jest.SpyInstance;
  const createdIndexes: string[] = [];
  const createdPipelines: string[] = [];

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    logSpy.mockRestore();
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
        pipelineRegistry: {},
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
        pipelineRegistry: {},
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
        pipelineRegistry: {},
      });

      await sut.execute();

      const { body } = await client.indices.getAlias({ name: alias });
      const physicalIndex = Object.keys(body)[0];
      expect(physicalIndex).toBe(`${alias}_v1`);
      expect(body[physicalIndex].aliases).toHaveProperty(alias);
    });

    it('does not throw on a registry with zero entries', async () => {
      const { sut } = createSut({ registry: {}, pipelineRegistry: {} });
      await expect(sut.execute()).resolves.not.toThrow();
    });

    it('logs a skip message when alias already exists', async () => {
      const alias = uniqueAlias();
      createdIndexes.push(alias);
      const { sut } = createSut({
        registry: { [alias]: makeDefinition(alias) },
        pipelineRegistry: {},
      });

      await sut.execute();
      await sut.execute();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(alias));
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
          pipelineRegistry: {},
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
          pipelineRegistry: {},
        });

        await expect(sut.execute()).rejects.toThrow();
      });
    });
  });

  describe('Pipeline bootstrapping', () => {
    it('creates an ingest pipeline when it does not exist', async () => {
      const id = uniquePipelineId();
      createdPipelines.push(id);
      const { sut } = createSut({
        registry: {},
        pipelineRegistry: { [id]: makePipelineDefinition(id) },
      });

      await sut.execute();

      const { body } = await client.ingest.getPipeline({ id });
      expect(body).toHaveProperty(id);
    });

    it('skips creation when pipeline already exists', async () => {
      const id = uniquePipelineId();
      createdPipelines.push(id);
      const { sut } = createSut({
        registry: {},
        pipelineRegistry: { [id]: makePipelineDefinition(id) },
      });

      await sut.execute();
      await sut.execute();

      const { body } = await client.ingest.getPipeline({ id });
      expect(body).toHaveProperty(id);
    });

    it('does not throw on a pipeline registry with zero entries', async () => {
      const { sut } = createSut({ registry: {}, pipelineRegistry: {} });
      await expect(sut.execute()).resolves.not.toThrow();
    });

    it('still throws for unrelated pipeline errors', async () => {
      const id = uniquePipelineId();
      const { sut } = createSut({
        registry: {},
        pipelineRegistry: {
          [id]: {
            id,
            description: 'bad',
            processors: [{ not_a_real_processor: {} } as never],
          },
        },
      });

      await expect(sut.execute()).rejects.toThrow();
    });

    describe('race condition: concurrent pipeline creation', () => {
      it('does not throw when two instances bootstrap the same pipeline concurrently', async () => {
        const id = uniquePipelineId();
        createdPipelines.push(id);
        const { sut } = createSut({
          registry: {},
          pipelineRegistry: { [id]: makePipelineDefinition(id) },
        });

        // Both instances see 404 and call putPipeline simultaneously.
        // putPipeline is an upsert so both succeed; the try-catch guards
        // against any version_conflict_engine_exception from ES cluster state.
        await expect(Promise.all([sut.execute(), sut.execute()])).resolves.not.toThrow();
      });

      it('pipeline exists with correct definition after concurrent creation', async () => {
        const id = uniquePipelineId();
        createdPipelines.push(id);
        const definition = makePipelineDefinition(id);
        const { sut } = createSut({
          registry: {},
          pipelineRegistry: { [id]: definition },
        });

        await Promise.all([sut.execute(), sut.execute()]);

        const { body } = await client.ingest.getPipeline({ id });
        expect(body).toHaveProperty(id);
        expect(body[id].description).toBe(definition.description);
      });
    });
  });
});
