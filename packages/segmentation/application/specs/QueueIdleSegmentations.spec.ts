import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { QueueIdleSegmentationsFactory } from '../../infrastructure/factories/QueueIdleSegmentationsFactory.js';
import {
  f,
  idle,
  withSegmentations,
  selectBackend,
  setUpBackends,
  storedSegmentations,
  requestedSegmentationIds,
  testConfigs,
} from './SegmentationIntakeFixtures.js';

const ready = {
  ...idle('ready'),
  status: 'ready',
  xmlname: 'ready.xml',
  segmentation: { page_width: 1, page_height: 1, paragraphs: [] },
};

const fixtures = (segmentationOn: boolean) =>
  withSegmentations(segmentationOn, [idle('a'), idle('b'), idle('c'), ready]);

describe('QueueIdleSegmentations', () => {
  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    const setUp = async (segmentationOn: boolean) => {
      selectBackend(postgresCore);
      await testingEnvironment.setFixtures(fixtures(segmentationOn));
      await testingEnvironment.jobs.clear();
    };

    const sut = () =>
      testingEnvironment.runWithContext(() => QueueIdleSegmentationsFactory.default());

    const statusByFilename = async () =>
      Object.fromEntries(
        (await storedSegmentations(postgresCore)).map(s => [s.filename, s.status])
      );

    it('should queue every idle segmentation, batch by batch, and request each once', async () => {
      await setUp(true);
      const heartbeat = jest.fn().mockResolvedValue(undefined);

      const result = await sut().execute({ batchSize: 2, heartbeat });

      expect(result).toEqual({ segmentationEnabled: true, requested: 3 });

      expect(await statusByFilename()).toEqual({
        'a.pdf': 'queued',
        'b.pdf': 'queued',
        'c.pdf': 'queued',
        'ready.pdf': 'ready',
      });
      expect(await requestedSegmentationIds(postgresCore)).toEqual(
        [f.idString('a'), f.idString('b'), f.idString('c')].sort()
      );
      expect(heartbeat).toHaveBeenCalledTimes(2);
    });

    it('should leave everything idle when segmentation is off', async () => {
      await setUp(false);

      const result = await sut().execute({ batchSize: 2, heartbeat: jest.fn() });

      expect(result).toEqual({ segmentationEnabled: false, requested: 0 });

      expect(await statusByFilename()).toEqual({
        'a.pdf': 'idle',
        'b.pdf': 'idle',
        'c.pdf': 'idle',
        'ready.pdf': 'ready',
      });
      expect(await requestedSegmentationIds(postgresCore)).toEqual([]);
    });
  });
});
