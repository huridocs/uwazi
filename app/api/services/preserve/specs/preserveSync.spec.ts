import entities from 'api/entities';
import { uwaziFS } from 'api/files/uwaziFS';
import { fileExists, generateFileName, testingUploadPaths } from 'api/files/filesystem';
import { search } from 'api/search';
import { tenants } from 'api/tenants';
import db from 'api/utils/testing_db';
import backend from 'fetch-mock';
import 'isomorphic-fetch';
import path from 'path';
import qs from 'qs';
import { EntitySchema, EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { URL } from 'url';
import { preserveSync } from '../preserveSync';
import { preserveSyncModel } from '../preserveSyncModel';
import { fixtures, templateId } from './fixtures';

const mockVault = async (evidences: any[], isoDate = '') => {
  const host = 'http://preserve-testing.org';
  const token = 'auth-token';
  const queryString = qs.stringify({
    filter: {
      status: 'PROCESSED',
      ...(isoDate ? { date: { gt: isoDate } } : {}),
    },
  });
  backend.reset();
  backend.get(
    (url, opts) =>
      // @ts-ignore
      url === `${host}/api/evidences?${queryString}` && opts?.headers.Authorization === token,
    JSON.stringify({ data: evidences })
  );

  const downloads = evidences.map(e => e.attributes.downloads).flat();
  // const paths = await testingUploadPaths();

  return Promise.all(
    downloads.map(async download => {
      const tmpName = generateFileName({ originalname: 'test' });
      await uwaziFS.writeFile(path.join('/tmp', tmpName), 'content');
      const file = uwaziFS.createReadStream(path.join('/tmp', tmpName));
      // @ts-ignore
      const fileResponse = new Response(file, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      const url = new URL(path.join(host, download.path)).toString();
      backend.get(url, fileResponse);
    })
  );
};

describe('preserveSync', () => {
  const tenantName = 'preserveTenant';

  beforeAll(async () => {
    await db.connect({ defaultTenant: false });
    await db.clearAllAndLoad(fixtures);
    backend.restore();

    const tenant1 = {
      name: tenantName,
      dbName: db.dbName,
      indexName: db.dbName,
      ...(await testingUploadPaths()),
    };

    tenants.add(tenant1);

    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
  });

  afterAll(async () => db.disconnect());

  const fakeEvidence = (id: string) => ({
    attributes: {
      date: `date${id}`,
      title: `title of url${id}`,
      status: 'PROCESSED',
      url: `url${id}`,
      downloads: [
        { path: `/evidences/id${id}/content${id}.txt` },
        { path: `/evidences/id${id}/screenshot${id}.jpg` },
      ],
    },
  });

  describe('sync', () => {
    beforeAll(async () => {
      const evidences = [fakeEvidence('1'), fakeEvidence('2')];

      await mockVault(evidences);
      await preserveSync.syncAllTenants();

      await tenants.run(async () => {
        const { lastImport } = (await preserveSyncModel.get())[0];
        await mockVault([], lastImport);
      }, tenantName);

      await tenants.run(async () => {
        const { lastImport } = (await preserveSyncModel.get())[0];
        await mockVault([fakeEvidence('3')], lastImport);
      }, tenantName);

      await preserveSync.syncAllTenants();
    });

    it('should create entities based on evidences PROCESSED status', async () => {
      await tenants.run(async () => {
        const entitiesImported: EntitySchema[] = await entities.get();
        expect(entitiesImported.map(e => e.title)).toEqual([
          'title of url1',
          'title of url2',
          'title of url3',
        ]);
        expect(entitiesImported.map(e => e.template)).toEqual([templateId, templateId, templateId]);
      }, tenantName);
    });

    it('should not create extra lastImport', async () => {
      await tenants.run(async () => {
        const datesImported = await preserveSyncModel.get();
        expect(datesImported).toMatchObject([
          {
            lastImport: 'date3',
          },
        ]);
      }, tenantName);
    });

    it('should save evidences downloads as attachments', async () => {
      await tenants.run(async () => {
        const entitiesImported: EntityWithFilesSchema[] = (await entities.get())
          .sort()
          .map((entity: EntityWithFilesSchema) => ({
            ...entity,
            attachments: entity.attachments
              ? entity.attachments.sort((a, b) => (a.originalname! > b.originalname! ? 1 : -1))
              : [],
          }));
        expect(entitiesImported).toMatchObject(
          [
            {
              attachments: [
                { filename: expect.any(String), originalname: 'content1.txt' },
                { filename: expect.any(String), originalname: 'screenshot1.jpg' },
              ],
            },
            {
              attachments: [
                { filename: expect.any(String), originalname: 'content2.txt' },
                { filename: expect.any(String), originalname: 'screenshot2.jpg' },
              ],
            },
            {
              attachments: [
                { filename: expect.any(String), originalname: 'content3.txt' },
                { filename: expect.any(String), originalname: 'screenshot3.jpg' },
              ],
            },
          ].sort()
        );
      }, tenantName);
    });

    it('should save evidences downloads to disk', async () => {
      await tenants.run(async () => {
        const entitiesImported: EntityWithFilesSchema[] = await entities.get();
        const attachments: FileType[] = entitiesImported
          .map(entity => entity.attachments || [])
          .flat();
        const testingPaths = await testingUploadPaths();
        // eslint-disable-next-line no-restricted-syntax
        for await (const attachment of attachments) {
          expect(
            await fileExists(path.join(testingPaths.attachments, attachment.filename || ''))
          ).toBe(true);
        }
      }, tenantName);
    });

    // it('should add all downloads to attachments', async () => {});
    // it('should not import already imported evidences', async () => {});
  });
});
