import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CleanupOcrRecordsOfFilesFactory } from '../../infrastructure/factories/CleanupOcrRecordsOfFilesFactory.js';
import {
  f,
  record,
  withRecords,
  selectBackend,
  setUpBackends,
  storedRecords,
  testConfigs,
} from './OcrIntakeFixtures.js';

const records = [
  record('queued'),
  record('ready', { status: 'ready', attempt: 1, resultFile: f.id('result-ready') }),
  record('detached', {
    sourceFile: null,
    status: 'ready',
    attempt: 1,
    resultFile: f.id('result-detached'),
  }),
  record('unrelated'),
];

describe('CleanupOcrRecordsOfFiles', () => {
  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(async () => {
      selectBackend(postgresCore);
      await testingEnvironment.setFixtures(withRecords(records));
    });

    const execute = async (...fileIds: string[]) =>
      testingEnvironment.runWithContext(async () =>
        CleanupOcrRecordsOfFilesFactory.default().execute({ fileIds })
      );

    const byName = async () =>
      Object.fromEntries((await storedRecords(postgresCore)).map(r => [r.id, r]));

    it('should detach a record from its deleted source file, keeping the record', async () => {
      await execute(f.idString('file-queued'));

      const stored = await byName();
      expect(stored[f.idString('queued')]).toMatchObject({ sourceFileId: null, status: 'queued' });
      expect(Object.keys(stored)).toHaveLength(4);
    });

    it('should keep the result of a record whose source was deleted', async () => {
      await execute(f.idString('file-ready'));

      expect((await byName())[f.idString('ready')]).toMatchObject({
        sourceFileId: null,
        status: 'ready',
      });
    });

    it.each(['result-ready', 'result-detached'])(
      'should delete the record whose result file %s was deleted',
      async result => {
        await execute(f.idString(result));

        expect(Object.keys(await byName())).not.toContain(
          f.idString(result.replace('result-', ''))
        );
        expect(Object.keys(await byName())).toHaveLength(3);
      }
    );

    it('should delete a record whose source and result were both deleted', async () => {
      await execute(f.idString('file-ready'), f.idString('result-ready'));

      expect(Object.keys(await byName())).not.toContain(f.idString('ready'));
    });

    it('should leave the records of other files alone', async () => {
      const before = await storedRecords(postgresCore);

      await execute(f.idString('unknown'));
      await execute();

      expect(await storedRecords(postgresCore)).toEqual(before);
    });
  });
});
