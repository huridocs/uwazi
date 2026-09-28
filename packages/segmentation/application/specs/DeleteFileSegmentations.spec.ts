// eslint-disable-next-line no-restricted-imports
import { mkdir, readdir, writeFile } from 'fs/promises';
import path from 'path';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { DeleteFileSegmentationsFactory } from '../../infrastructure/factories/DeleteFileSegmentationsFactory.js';
import {
  f,
  idle,
  withSegmentations,
  useBackend,
  setUpBackends,
  storedSegmentations,
  testConfigs,
} from './SegmentationIntakeFixtures.js';

const ready = (name: string) => ({
  ...idle(name),
  status: 'ready',
  xmlname: `${name}.xml`,
  segmentation: { page_width: 1, page_height: 1, paragraphs: [] },
});

const xmlDirectory = () => path.join(testingTenants.current().uploadedDocuments, 'segmentation');

const storedXmls = async () => (await readdir(xmlDirectory())).sort();

describe('DeleteFileSegmentations', () => {
  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(async () => {
      // Resets the tenant's feature flags, so it has to come before useBackend.
      await testingEnvironment.setupTenantTmpPaths([]);
      useBackend(postgresCore);
      await testingEnvironment.setFixtures(
        withSegmentations(true, [ready('a'), ready('b'), ready('noXmlOnDisk'), idle('pending')])
      );
      await mkdir(xmlDirectory(), { recursive: true });
      await writeFile(path.join(xmlDirectory(), 'a.xml'), '<a/>');
      await writeFile(path.join(xmlDirectory(), 'b.xml'), '<b/>');
    });

    const execute = async (fileIds: string[]) =>
      testingEnvironment.runWithContext(async () =>
        DeleteFileSegmentationsFactory.default().execute({ fileIds })
      );

    it('should delete the segmentations of the files and their xml, and nothing else', async () => {
      await execute([f.idString('file-a'), f.idString('file-pending'), f.idString('unknown')]);

      expect((await storedSegmentations(postgresCore)).map(s => s.filename).sort()).toEqual([
        'b.pdf',
        'noXmlOnDisk.pdf',
      ]);
      expect(await storedXmls()).toEqual(['b.xml']);
    });

    it('should delete a segmentation whose xml is already gone', async () => {
      await execute([f.idString('file-noXmlOnDisk')]);

      expect((await storedSegmentations(postgresCore)).map(s => s.filename)).not.toContain(
        'noXmlOnDisk.pdf'
      );
      expect(await storedXmls()).toEqual(['a.xml', 'b.xml']);
    });
  });
});
