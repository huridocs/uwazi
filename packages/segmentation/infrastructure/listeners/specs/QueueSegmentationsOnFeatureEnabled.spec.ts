import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { QueueSegmentationsOnFeatureEnabledFactory } from '../../factories/QueueSegmentationsOnFeatureEnabledFactory.js';
import {
  idle,
  withSegmentations,
  useBackend,
  requestedSegmentationIds,
} from '../../../application/specs/SegmentationIntakeFixtures.js';

describe('QueueSegmentationsOnFeatureEnabled', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({}, { postgres: false });
    useBackend(false);
    await testingEnvironment.setFixtures(withSegmentations(true, [idle('a')]));
    await testingEnvironment.jobs.clear();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const handle = async (changes: object) =>
    testingEnvironment.runWithContext(async () =>
      QueueSegmentationsOnFeatureEnabledFactory.default().handle(
        jest.fn().mockResolvedValue(undefined),
        { changes } as never
      )
    );

  it('should queue the idle segmentations when segmentation is switched on', async () => {
    await handle({ keys: ['features'], features: { enabled: ['segmentation'], disabled: [] } });

    expect(await requestedSegmentationIds(false)).toHaveLength(1);
  });

  it.each([
    [
      'another feature is switched on',
      { keys: ['features'], features: { enabled: ['ocr'], disabled: [] } },
    ],
    [
      'segmentation is switched off',
      { keys: ['features'], features: { enabled: [], disabled: ['segmentation'] } },
    ],
    ['only its configuration changed', { keys: ['features'] }],
    ['something else changed', { keys: ['site_name'] }],
  ])('should do nothing when %s', async (_case, changes) => {
    await handle(changes);

    expect(await requestedSegmentationIds(false)).toEqual([]);
  });
});
