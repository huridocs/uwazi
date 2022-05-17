import entities from 'api/entities';
import { uwaziFS } from 'api/files/uwaziFS';
import { fileExists, generateFileName, testingUploadPaths } from 'api/files/filesystem';
import { search } from 'api/search';
import { tenants } from 'api/tenants';
import db from 'api/utils/testing_db';
import backend from 'fetch-mock';
import path from 'path';
import qs from 'qs';
import { EntitySchema, EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { URL } from 'url';
import { errorLog } from 'api/log';
import { preserveSync } from '../preserveSync';
import { preserveSyncModel } from '../preserveSyncModel';
import { anotherTemplateId, fixtures, templateId } from './fixtures';

const mockVault = async (evidences: any[], token: string = '', isoDate = '') => {
  const host = 'http://preserve-testing.org';
  const queryString = qs.stringify({
    filter: {
      status: 'PROCESSED',
      ...(isoDate ? { date: { gt: isoDate } } : {}),
    },
  });

  backend.get(
    (url, opts) =>
      // @ts-ignore
      url === `${host}/api/evidences?${queryString}` && opts?.headers.Authorization === token,
    JSON.stringify({ data: evidences })
  );

  const downloads = evidences.map(e => e.attributes.downloads).flat();

  return Promise.all(
    downloads.map(async download => {
      const tmpName = generateFileName({ originalname: 'test' });
      await uwaziFS.writeFile(path.join('/tmp', tmpName), 'content');
      const file = uwaziFS.createReadStream(path.join('/tmp', tmpName));

      // @ts-ignore
      const fileResponse = new Response(file, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });

      backend.get(
        (url, opts) =>
          url === new URL(path.join(host, download.path)).toString() &&
          // @ts-ignore
          opts?.headers.Authorization === token,
        fileResponse
      );
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

  const fakeEvidence = (id: string, title: string) => ({
    attributes: {
      date: `date${id}`,
      title,
      status: 'PROCESSED',
      url: `http://www.url${id}test.org`,
      downloads: [
        { path: `/evidences/id${id}/content${id}.txt` },
        { path: `/evidences/id${id}/screenshot${id}.jpg` },
      ],
    },
  });

  describe('sync', () => {
    beforeAll(async () => {
      errorLog.error = jest.fn();
      const evidences = [fakeEvidence('1', 'title of url1'), fakeEvidence('2', 'title of url2')];
      await mockVault(evidences, 'auth-token');

      const moreEvidences = [fakeEvidence('4', 'title of url4'), fakeEvidence('42', '')];

      await mockVault(moreEvidences, 'another-auth-token');
      await preserveSync.syncAllTenants();

      await tenants.run(async () => {
        const { lastImport } = (await preserveSyncModel.get({ token: 'auth-token' }))[0];
        await mockVault([fakeEvidence('3', 'title of url3')], 'auth-token', lastImport);
        const { lastImport: anotherLastImport } = (
          await preserveSyncModel.get({ token: 'another-auth-token' })
        )[0];
        await mockVault(
          [fakeEvidence('5', 'title of url5')],
          'another-auth-token',
          anotherLastImport
        );
      }, tenantName);

      await preserveSync.syncAllTenants();
    });

    it('should create entities based on evidences PROCESSED status', async () => {
      await tenants.run(async () => {
        const entitiesImported: EntitySchema[] = await entities.get(
          {},
          {},
          { sort: { title: 'asc' } }
        );
        expect(
          entitiesImported.map(entity => ({
            title: entity.title,
            template: entity.template?.toString(),
          }))
        ).toMatchObject([
          { title: 'title of url1', template: templateId.toString() },
          { title: 'title of url2', template: templateId.toString() },
          { title: 'title of url3', template: templateId.toString() },
          { title: 'title of url4', template: anotherTemplateId.toString() },
          { title: 'title of url5', template: anotherTemplateId.toString() },
        ]);
      }, tenantName);
    });

    it('should create one lastImport per token', async () => {
      await tenants.run(async () => {
        const datesImported = await preserveSyncModel.get();
        expect(datesImported).toMatchObject([
          {
            lastImport: 'date3',
            token: 'auth-token',
          },
          {
            lastImport: 'date5',
            token: 'another-auth-token',
          },
        ]);
      }, tenantName);
    });

    it('should save evidences downloads as attachments', async () => {
      await tenants.run(async () => {
        const entitiesImported: EntityWithFilesSchema[] = (
          await entities.get({}, {}, { sort: { title: 'asc' } })
        ).map((entity: EntityWithFilesSchema) => ({
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
            {
              attachments: [
                { filename: expect.any(String), originalname: 'content4.txt' },
                { filename: expect.any(String), originalname: 'screenshot4.jpg' },
              ],
            },
            {
              attachments: [
                { filename: expect.any(String), originalname: 'content5.txt' },
                { filename: expect.any(String), originalname: 'screenshot5.jpg' },
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

    it('should save url and source properties based on the evidence url', async () => {
      await tenants.run(async () => {
        const entitiesImported = await entities.get({}, {}, { sort: { title: 'asc' } });
        expect(entitiesImported).toMatchObject([
          {
            metadata: {
              url: [{ value: { url: 'http://www.url1test.org', label: '' } }],
              source: [{ value: 'www.url1test.org' }],
            },
          },
          {
            metadata: {
              url: [{ value: { url: 'http://www.url2test.org', label: '' } }],
              source: [{ value: 'www.url2test.org' }],
            },
          },
          {
            metadata: {
              url: [{ value: { url: 'http://www.url3test.org', label: '' } }],
              source: [{ value: 'www.url3test.org' }],
            },
          },
          { metadata: {} },
          { metadata: {} },
        ]);
      }, tenantName);
    });
  });
});
