import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { QueueIdleSegmentationsOutputSchema } from '../../contracts.js';
import { QueueIdleSegmentationsController } from '../QueueIdleSegmentationsController.js';

const f = getFixturesFactory();

const idle = (name: string) => ({
  _id: f.id(name),
  fileID: f.id(`file ${name}`),
  filename: `${name}.pdf`,
  status: 'idle',
  attempt: 0,
});

const fixtures = (segmentationOn: boolean) => ({
  settings: [
    {
      languages: [{ key: 'en' as const, label: 'English', default: true }],
      features: segmentationOn ? { segmentation: { url: 'http://segmentation' } } : {},
    },
  ],
  segmentations: [idle('a'), idle('b'), { ...idle('ready'), status: 'ready' }],
});

describe.each(ControllerSpecs.backends)(
  'QueueIdleSegmentationsController ($name)',
  ({ postgresCore }) => {
    const statuses = async () =>
      (await ControllerSpecs.stored(postgresCore, 'segmentations'))
        .map(segmentation => segmentation.status)
        .sort();

    it('should request every idle segmentation and say how many', async () => {
      await testingEnvironment.setUp(fixtures(true), { postgres: true });
      ControllerSpecs.useBackend(postgresCore);

      const output = await ControllerSpecs.asCli(async () =>
        QueueIdleSegmentationsController.handle()
      );

      expect(QueueIdleSegmentationsOutputSchema.parse(output)).toEqual({
        segmentationEnabled: true,
        requested: 2,
      });
      expect(await statuses()).toEqual(['queued', 'queued', 'ready']);
    });

    it('should request nothing when the tenant has segmentation off', async () => {
      await testingEnvironment.setUp(fixtures(false), { postgres: true });
      ControllerSpecs.useBackend(postgresCore);

      const output = await ControllerSpecs.asCli(async () =>
        QueueIdleSegmentationsController.handle()
      );

      expect(output).toEqual({ segmentationEnabled: false, requested: 0 });
      expect(await statuses()).toEqual(['idle', 'idle', 'ready']);
    });
  }
);

afterAll(async () => {
  await testingEnvironment.tearDown();
});
