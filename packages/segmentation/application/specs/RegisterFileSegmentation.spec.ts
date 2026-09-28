import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RegisterFileSegmentationFactory } from '../../infrastructure/factories/RegisterFileSegmentationFactory.js';
import {
  f,
  withSegmentations,
  selectBackend,
  setUpBackends,
  storedSegmentations,
  requestedSegmentationIds,
  testConfigs,
} from './SegmentationIntakeFixtures.js';

const pdf = {
  fileId: f.idString('file1'),
  filename: 'file1.pdf',
  type: 'document',
  mimetype: 'application/pdf',
};

describe('RegisterFileSegmentation', () => {
  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    const setUp = async (segmentationOn: boolean) => {
      selectBackend(postgresCore);
      await testingEnvironment.setFixtures(withSegmentations(segmentationOn, []));
      await testingEnvironment.jobs.clear();
    };

    const sut = () =>
      testingEnvironment.runWithContext(() => RegisterFileSegmentationFactory.default());

    describe('when segmentation is off', () => {
      beforeEach(async () => setUp(false));

      it('should register the PDF as idle and request nothing', async () => {
        await sut().execute(pdf);

        expect(await storedSegmentations(postgresCore)).toEqual([
          { id: expect.any(String), fileId: pdf.fileId, filename: 'file1.pdf', status: 'idle' },
        ]);
        expect(await requestedSegmentationIds(postgresCore)).toEqual([]);
      });
    });

    describe('when segmentation is on', () => {
      beforeEach(async () => setUp(true));

      it('should register the PDF as queued and request its segmentation', async () => {
        await sut().execute(pdf);

        const [stored] = await storedSegmentations(postgresCore);
        expect(stored).toMatchObject({ fileId: pdf.fileId, status: 'queued' });
        expect(await requestedSegmentationIds(postgresCore)).toEqual([stored.id]);
      });

      it('should register a file only once, however often it is announced', async () => {
        await sut().execute(pdf);
        await sut().execute(pdf);

        expect(await storedSegmentations(postgresCore)).toHaveLength(1);
        expect(await requestedSegmentationIds(postgresCore)).toHaveLength(1);
      });

      it.each([
        ['an attachment', { type: 'attachment' }],
        ['a document that is not a PDF', { mimetype: 'image/png' }],
        ['a custom upload', { type: 'custom' }],
      ])('should ignore %s', async (_case, overrides) => {
        await sut().execute({ ...pdf, ...overrides });

        expect(await storedSegmentations(postgresCore)).toEqual([]);
        expect(await requestedSegmentationIds(postgresCore)).toEqual([]);
      });
    });
  });
});
