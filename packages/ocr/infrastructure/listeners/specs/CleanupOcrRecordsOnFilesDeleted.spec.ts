import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import {
  f,
  record,
  withRecords,
  selectBackend,
  storedRecords,
} from '../../../application/specs/OcrIntakeFixtures.js';
import { CleanupOcrRecordsOnFilesDeletedFactory } from '../../factories/CleanupOcrRecordsOnFilesDeletedFactory.js';

describe('CleanupOcrRecordsOnFilesDeleted', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp({}, { postgres: false });
    selectBackend(false);
    await testingEnvironment.setFixtures(
      withRecords([
        record('a'),
        record('b', { status: 'ready', attempt: 1, resultFile: f.id('result-b') }),
      ])
    );
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const handle = async (fileId: string) =>
    testingEnvironment.runWithContext(async () =>
      CleanupOcrRecordsOnFilesDeletedFactory.default().handle(
        jest.fn().mockResolvedValue(undefined),
        { fileId }
      )
    );

  it('should detach the record of a deleted source file from it', async () => {
    await handle(f.idString('file-b'));

    expect(await storedRecords(false)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: f.idString('b'), sourceFileId: null })])
    );
  });

  it('should delete the record of a deleted result file', async () => {
    await handle(f.idString('result-b'));

    expect((await storedRecords(false)).map(r => r.id)).toEqual([f.idString('a')]);
  });
});
