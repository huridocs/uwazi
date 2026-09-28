import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DocumentLayout } from '../../domain/DocumentLayout.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { LayoutSegment } from '../../domain/LayoutSegment.js';
import { Segmentation } from '../../domain/Segmentation.js';
import { SegmentationFailureReason } from '../../domain/SegmentationFailureReason.js';
import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { SegmentType } from '../../domain/SegmentType.js';
import { SegmentationDataSourceFactory } from '../../infrastructure/factories/SegmentationDataSourceFactory.js';
import {
  f,
  UNKNOWN_ID,
  MALFORMED_ID,
  fixtures,
  storedSegmentations,
  testConfigs,
  useBackend,
} from './SegmentationContractFixtures.js';

const snapshot = (segmentation: Segmentation | undefined) =>
  segmentation && {
    id: segmentation.id,
    fileId: segmentation.fileId,
    filename: segmentation.filename,
    status: segmentation.status,
    attempt: segmentation.attempt,
    requestedAt: segmentation.requestedAt,
    xmlFilename: segmentation.xmlFilename,
    failureReason: segmentation.failureReason,
    layout: segmentation.layout && {
      pages: [...segmentation.layout.pages],
      segments: segmentation.layout.segments.map(s => ({ ...s })),
    },
  };

const segmentA = {
  left: 10,
  top: 20,
  width: 100,
  height: 12,
  pageNumber: 1,
  text: 'Title A',
  type: SegmentType.TITLE,
};

describe('SegmentationDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true, postgresMirror: ['segmentations'] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      useBackend(usePostgres);
      await testingEnvironment.setFixtures(fixtures);
    });

    const sut = () =>
      testingEnvironment.runWithContext(() => SegmentationDataSourceFactory.default());

    describe('getById()', () => {
      it('should load a ready segmentation with its layout, keeping page sizes per page', async () => {
        expect(snapshot(await sut().getById(f.idString('readyA')))).toEqual({
          id: f.idString('readyA'),
          fileId: f.idString('fileA'),
          filename: 'a.pdf',
          status: SegmentationStatus.READY,
          attempt: 1,
          requestedAt: 1000,
          xmlFilename: 'a.xml',
          failureReason: undefined,
          layout: {
            pages: [
              { number: 1, width: 612, height: 792 },
              { number: 2, width: 842, height: 595 },
            ],
            segments: [
              segmentA,
              {
                ...segmentA,
                pageNumber: 2,
                text: 'Item',
                type: SegmentType.LIST_ITEM,
              },
            ],
          },
        });
      });

      it('should load a legacy record: no attempt, untyped segments, one document-wide page size', async () => {
        expect(snapshot(await sut().getById(f.idString('legacyReady')))).toMatchObject({
          attempt: 0,
          requestedAt: undefined,
          layout: {
            pages: [{ number: 1, width: 600, height: 800 }],
            segments: [{ ...segmentA, text: 'Legacy', type: SegmentType.TEXT }],
          },
        });
      });

      it('should load the reason of a failure', async () => {
        expect((await sut().getById(f.idString('failed')))?.failureReason).toBe(
          SegmentationFailureReason.NOT_A_PDF
        );
      });

      it.each([
        ['an unknown id', UNKNOWN_ID],
        ['a malformed id', MALFORMED_ID],
      ])('should return undefined for %s', async (_case, id) => {
        expect(await sut().getById(id)).toBeUndefined();
      });
    });

    describe('getByFileId()', () => {
      it('should find the segmentation of a file', async () => {
        expect((await sut().getByFileId(f.idString('fileC')))?.id).toBe(f.idString('failed'));
      });

      it.each([
        ['an unknown id', UNKNOWN_ID],
        ['a malformed id', MALFORMED_ID],
      ])('should return undefined for %s', async (_case, id) => {
        expect(await sut().getByFileId(id)).toBeUndefined();
      });
    });

    describe('getByFilename()', () => {
      it('should find the segmentation by the filename sent to the service', async () => {
        expect((await sut().getByFilename('d.pdf'))?.id).toBe(f.idString('staleProcessing'));
      });

      it('should return undefined for an unknown filename', async () => {
        expect(await sut().getByFilename('nope.pdf')).toBeUndefined();
      });
    });

    describe('create()', () => {
      it('should store a new idle segmentation', async () => {
        const created = await sut().create(
          Segmentation.create({
            id: f.idString('new'),
            fileId: f.idString('fileNew'),
            filename: 'new.pdf',
          })
        );

        expect(created).toBe(true);
        expect(await storedSegmentations(usePostgres)).toContainEqual({
          id: f.idString('new'),
          fileId: f.idString('fileNew'),
          status: 'idle',
          attempt: 0,
        });
      });

      it('should not create a second segmentation for a file that has one', async () => {
        const before = await storedSegmentations(usePostgres);

        const created = await sut().create(
          Segmentation.create({
            id: f.idString('duplicate'),
            fileId: f.idString('fileA'),
            filename: 'a.pdf',
          })
        );

        expect(created).toBe(false);
        expect(await storedSegmentations(usePostgres)).toEqual(before);
      });
    });

    describe('save()', () => {
      it('should persist every transition, including the layout', async () => {
        const segmentation = (await sut().getById(f.idString('recentProcessing')))!;
        const layout = new DocumentLayout({
          pages: [{ number: 1, width: 500, height: 700 }],
          segments: [new LayoutSegment({ ...segmentA, type: SegmentType.TABLE })],
        });
        segmentation.complete(
          IdempotencyKey.of(segmentation.id, segmentation.attempt),
          layout,
          'e.xml'
        );

        await sut().save(segmentation);

        expect(snapshot(await sut().getById(f.idString('recentProcessing')))).toEqual({
          id: f.idString('recentProcessing'),
          fileId: f.idString('fileE'),
          filename: 'e.pdf',
          status: SegmentationStatus.READY,
          attempt: 1,
          requestedAt: 5000,
          xmlFilename: 'e.xml',
          failureReason: undefined,
          layout: {
            pages: [{ number: 1, width: 500, height: 700 }],
            segments: [{ ...segmentA, type: SegmentType.TABLE }],
          },
        });
      });

      it('should persist a new attempt', async () => {
        const segmentation = (await sut().getById(f.idString('queued')))!;
        segmentation.request(9000);

        await sut().save(segmentation);

        expect(snapshot(await sut().getById(f.idString('queued')))).toMatchObject({
          status: SegmentationStatus.PROCESSING,
          attempt: 1,
          requestedAt: 9000,
        });
      });

      it('should not bring back a segmentation deleted in the meantime', async () => {
        const segmentation = (await sut().getById(f.idString('queued')))!;
        await sut().deleteByFileIds([f.idString('fileH')]);
        segmentation.request(9000);

        await sut().save(segmentation);

        expect((await storedSegmentations(usePostgres)).map(s => s.id)).not.toContain(
          f.idString('queued')
        );
      });
    });

    describe('nextIdleBatch()', () => {
      it('should page through idle segmentations only, in id order', async () => {
        const first = await sut().nextIdleBatch(1);
        const second = await sut().nextIdleBatch(1, first[0].id);
        const third = await sut().nextIdleBatch(1, second[0].id);

        expect([...first, ...second].map(s => s.id).sort()).toEqual(
          [f.idString('idle1'), f.idString('idle2')].sort()
        );
        expect(first[0].id < second[0].id).toBe(true);
        expect(third).toEqual([]);
        expect([...first, ...second].every(s => s.status === SegmentationStatus.IDLE)).toBe(true);
      });
    });

    describe('staleProcessing()', () => {
      it('should return processing segmentations requested before the cutoff', async () => {
        const stale = await sut().staleProcessing(3000, 10);

        expect(stale.map(s => s.id)).toEqual([f.idString('staleProcessing')]);
      });
    });

    describe('deleteByFileIds()', () => {
      it('should delete the segmentations of the files and return them', async () => {
        const deleted = await sut().deleteByFileIds([
          f.idString('fileA'),
          f.idString('fileC'),
          UNKNOWN_ID,
        ]);

        expect(deleted.map(s => s.id).sort()).toEqual(
          [f.idString('readyA'), f.idString('failed')].sort()
        );
        expect(deleted.find(s => s.id === f.idString('readyA'))?.xmlFilename).toBe('a.xml');
        expect((await storedSegmentations(usePostgres)).map(s => s.id)).toEqual(
          expect.not.arrayContaining([f.idString('readyA'), f.idString('failed')])
        );
        expect(await storedSegmentations(usePostgres)).toHaveLength(7);
      });

      it('should ignore malformed ids and an empty list', async () => {
        expect(await sut().deleteByFileIds([])).toEqual([]);
        expect(await sut().deleteByFileIds([MALFORMED_ID])).toEqual([]);
        expect(await storedSegmentations(usePostgres)).toHaveLength(9);
      });
    });
  });
});
