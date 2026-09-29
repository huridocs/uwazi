import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { SegmentType } from '../../domain/SegmentType.js';
import { SegmentationDirectoryFactory } from '../../infrastructure/factories/SegmentationDirectoryFactory.js';
import {
  f,
  UNKNOWN_ID,
  MALFORMED_ID,
  fixtures,
  byFileId,
  testConfigs,
  selectBackend,
} from './SegmentationContractFixtures.js';

const box = { left: 10, top: 20, width: 100, height: 12 };

const view = {
  readyA: {
    fileId: f.idString('fileA'),
    filename: 'a.pdf',
    xmlFilename: 'a.xml',
    layout: {
      pages: [
        { number: 1, width: 612, height: 792 },
        { number: 2, width: 842, height: 595 },
      ],
      segments: [
        { ...box, pageNumber: 1, text: 'Title A', type: SegmentType.TITLE },
        { ...box, pageNumber: 2, text: 'Item', type: SegmentType.LIST_ITEM },
      ],
    },
  },
  legacyReady: {
    fileId: f.idString('fileB'),
    filename: 'b.pdf',
    xmlFilename: 'b.xml',
    layout: {
      pages: [{ number: 1, width: 600, height: 800 }],
      segments: [{ ...box, pageNumber: 1, text: 'Legacy', type: SegmentType.TEXT }],
    },
  },
};

describe('SegmentationDirectory', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true, postgresMirror: ['segmentations'] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      selectBackend(usePostgres);
      await testingEnvironment.setFixtures(fixtures);
    });

    const sut = () =>
      testingEnvironment.runWithContext(() => SegmentationDirectoryFactory.default());

    describe('readyByFileIds()', () => {
      it('should return the ready segmentations of the files, and nothing else', async () => {
        const found = await sut().readyByFileIds([
          f.idString('fileA'),
          f.idString('fileB'),
          f.idString('fileC'),
          f.idString('fileD'),
          UNKNOWN_ID,
          MALFORMED_ID,
        ]);

        expect(byFileId(found)).toEqual(byFileId([view.readyA, view.legacyReady]));
      });

      it('should return nothing for no ids', async () => {
        expect(await sut().readyByFileIds([])).toEqual([]);
      });
    });

    describe('readyByFilenames()', () => {
      it('should return the ready segmentations of the filenames', async () => {
        expect(await sut().readyByFilenames(['a.pdf', 'c.pdf', 'nope.pdf'])).toEqual([view.readyA]);
      });

      it('should return nothing for no filenames', async () => {
        expect(await sut().readyByFilenames([])).toEqual([]);
      });
    });

    describe('fileIdForXml()', () => {
      it('should resolve the file an xml was produced for', async () => {
        expect(await sut().fileIdForXml('b.xml')).toBe(f.idString('fileB'));
      });

      it('should return undefined for an unknown xml', async () => {
        expect(await sut().fileIdForXml('nope.xml')).toBeUndefined();
      });
    });

    describe('readyFileIds()', () => {
      it('should return the files with a ready segmentation', async () => {
        expect((await sut().readyFileIds()).sort()).toEqual(
          [f.idString('fileA'), f.idString('fileB')].sort()
        );
      });
    });

    describe('statusesByFileIds()', () => {
      it('should return the status of each file that has a segmentation', async () => {
        const statuses = await sut().statusesByFileIds([
          f.idString('fileA'),
          f.idString('fileC'),
          f.idString('fileD'),
          f.idString('fileF'),
          UNKNOWN_ID,
          MALFORMED_ID,
        ]);

        expect(byFileId(statuses)).toEqual(
          byFileId([
            { fileId: f.idString('fileA'), status: SegmentationStatus.READY },
            { fileId: f.idString('fileC'), status: SegmentationStatus.FAILED },
            { fileId: f.idString('fileD'), status: SegmentationStatus.PROCESSING },
            { fileId: f.idString('fileF'), status: SegmentationStatus.IDLE },
          ])
        );
      });

      it('should return nothing for no ids', async () => {
        expect(await sut().statusesByFileIds([])).toEqual([]);
      });
    });
  });
});
