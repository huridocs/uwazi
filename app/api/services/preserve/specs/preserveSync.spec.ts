import backend from 'fetch-mock';
import entities from 'api/entities';
import { generateFileName, testingUploadPaths } from 'api/files/filesystem';
import { storage } from 'api/files/storage';
import { legacyLogger } from 'api/log';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { search } from 'api/search';
import { tenants } from 'api/tenants';
import thesauri from 'api/thesauri';
import db from 'api/utils/testing_db';
import path from 'path';
import qs from 'qs';
import { EntitySchema, EntityWithFilesSchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { URL } from 'url';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { Tenant } from 'api/tenants/tenantContext';
import { config } from 'api/config';
import { preserveSync } from '../preserveSync';
import { preserveSyncModel } from '../preserveSyncModel';
import { anotherTemplateId, fixtures, templateId, thesauri1Id, user } from './fixtures';

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
      await fs.writeFile(path.join('/tmp', tmpName), 'content');
      const file = createReadStream(path.join('/tmp', tmpName));

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
    await db.setupFixturesAndContext(fixtures);
    db.UserInContextMockFactory.restore();
    backend.restore();

    const tenant1: Tenant = {
      name: tenantName,
      dbName: db.dbName,
      indexName: db.dbName,
      ...(await testingUploadPaths()),
      featureFlags: config.defaultTenant.featureFlags,
    };

    tenants.add(tenant1);

    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
  });

  afterAll(async () => db.disconnect());

  const fakeEvidence = (number: number, title: string) => ({
    attributes: {
      date: new Date(parseInt(`${number}000`, 10)).toISOString(),
      title,
      status: 'PROCESSED',
      url: `http://www.url${number}test.org`,
      downloads: [
        { path: `/evidences/id${number}/content${number}.txt` },
        { path: `/evidences/id${number}/screenshot${number}.jpg` },
        { path: `/evidences/id${number}/stream${number}` },
      ],
    },
  });

  describe('sync', () => {
    beforeAll(async () => {
      legacyLogger.error = jest.fn();
      await tenants.run(async () => {
        const evidences = [
          fakeEvidence(1, 'title of url1'),
          fakeEvidence(2, 'title of url2'),
          fakeEvidence(2, ''),
        ];
        await mockVault(evidences, 'auth-token');

        const moreEvidences = [fakeEvidence(4, 'title of url4'), fakeEvidence(42, '')];

        await mockVault(moreEvidences, 'another-auth-token');
        await preserveSync.syncAllTenants();
        const { lastImport } = (await preserveSyncModel.get({ token: 'auth-token' }))[0];
        await mockVault([fakeEvidence(3, 'title of url3')], 'auth-token', lastImport);
        const { lastImport: anotherLastImport } = (
          await preserveSyncModel.get({ token: 'another-auth-token' })
        )[0];
        await mockVault(
          [fakeEvidence(5, 'title of url5')],
          'another-auth-token',
          anotherLastImport
        );
      }, tenantName);

      await preserveSync.syncAllTenants();
    });

    it('should create entities based on evidences PROCESSED status', async () => {
      await tenants.run(async () => {
        permissionsContext.setCommandContext();
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

    it('should save entities with the user configured for the integration', async () => {
      await tenants.run(async () => {
        permissionsContext.setCommandContext();
        const entitiesImported = await entities.get({}, '+permissions', { sort: { title: 'asc' } });

        expect(entitiesImported).toMatchObject([
          { user: user._id, permissions: [{ refId: user._id?.toString(), level: 'write' }] },
          { user: user._id, permissions: [{ refId: user._id?.toString(), level: 'write' }] },
          { user: user._id, permissions: [{ refId: user._id?.toString(), level: 'write' }] },
          expect.not.objectContaining({ user: expect.anything() }),
          expect.not.objectContaining({ user: expect.anything() }),
        ]);
      }, tenantName);
    });

    it('should create one lastImport per token', async () => {
      await tenants.run(async () => {
        const datesImported = await preserveSyncModel.get();
        expect(datesImported).toMatchObject([
          {
            lastImport: new Date(3000).toISOString(),
            token: 'auth-token',
          },
          {
            lastImport: new Date(5000).toISOString(),
            token: 'another-auth-token',
          },
        ]);
      }, tenantName);
    });

    it('should save evidences downloads as attachments', async () => {
      await tenants.run(async () => {
        permissionsContext.setCommandContext();
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
                {
                  filename: expect.any(String),
                  originalname: 'content1.txt',
                  mimetype: 'text/plain',
                },
                {
                  filename: expect.any(String),
                  originalname: 'screenshot1.jpg',
                  mimetype: 'image/jpeg',
                },
                {
                  filename: expect.any(String),
                  originalname: 'stream1',
                  mimetype: 'application/octet-stream',
                },
              ],
            },
            {
              attachments: [
                {
                  filename: expect.any(String),
                  originalname: 'content2.txt',
                  mimetype: 'text/plain',
                },
                {
                  filename: expect.any(String),
                  originalname: 'screenshot2.jpg',
                  mimetype: 'image/jpeg',
                },
                {
                  filename: expect.any(String),
                  originalname: 'stream2',
                  mimetype: 'application/octet-stream',
                },
              ],
            },
            {
              attachments: [
                {
                  filename: expect.any(String),
                  originalname: 'content3.txt',
                  mimetype: 'text/plain',
                },
                {
                  filename: expect.any(String),
                  originalname: 'screenshot3.jpg',
                  mimetype: 'image/jpeg',
                },
                {
                  filename: expect.any(String),
                  originalname: 'stream3',
                  mimetype: 'application/octet-stream',
                },
              ],
            },
            {
              attachments: [
                {
                  filename: expect.any(String),
                  originalname: 'content4.txt',
                  mimetype: 'text/plain',
                },
                {
                  filename: expect.any(String),
                  originalname: 'screenshot4.jpg',
                  mimetype: 'image/jpeg',
                },
                {
                  filename: expect.any(String),
                  originalname: 'stream4',
                  mimetype: 'application/octet-stream',
                },
              ],
            },
            {
              attachments: [
                {
                  filename: expect.any(String),
                  originalname: 'content5.txt',
                  mimetype: 'text/plain',
                },
                {
                  filename: expect.any(String),
                  originalname: 'screenshot5.jpg',
                  mimetype: 'image/jpeg',
                },
                {
                  filename: expect.any(String),
                  originalname: 'stream5',
                  mimetype: 'application/octet-stream',
                },
              ],
            },
          ].sort()
        );
      }, tenantName);
    });

    it('should save evidences downloads to disk', async () => {
      await tenants.run(async () => {
        permissionsContext.setCommandContext();
        const entitiesImported: EntityWithFilesSchema[] = await entities.get();
        const attachments: FileType[] = entitiesImported
          .map(entity => entity.attachments || [])
          .flat();
        await attachments.reduce(async (promise, attachment) => {
          await promise;
          expect(await storage.fileExists(attachment.filename!, 'attachment')).toBe(true);
        }, Promise.resolve());
      }, tenantName);
    });

    it('should save url and source properties based on the evidence url', async () => {
      await tenants.run(async () => {
        permissionsContext.setCommandContext();
        const importedThesauri = await thesauri.getById(thesauri1Id);
        expect(importedThesauri).toMatchObject({
          values: [
            { label: 'www.url1test.org' },
            { label: 'www.url2test.org' },
            { label: 'www.url3test.org' },
          ],
        });

        const entitiesImported = await entities.get({}, {}, { sort: { title: 'asc' } });
        expect(entitiesImported).toMatchObject([
          {
            metadata: {
              url: [{ value: { url: 'http://www.url1test.org', label: '' } }],
              source: [{ label: 'www.url1test.org' }],
              preservation_date: [{ value: 1 }],
            },
          },
          {
            metadata: {
              url: [{ value: { url: 'http://www.url2test.org', label: '' } }],
              source: [{ label: 'www.url2test.org' }],
              preservation_date: [{ value: 2 }],
            },
          },
          {
            metadata: {
              url: [{ value: { url: 'http://www.url3test.org', label: '' } }],
              source: [{ label: 'www.url3test.org' }],
              preservation_date: [{ value: 3 }],
            },
          },
          {
            metadata: { url: [], source: [], preservation_date: [] },
          },
          {
            metadata: { url: [], source: [], preservation_date: [] },
          },
        ]);
      }, tenantName);
    });

    it('should save date on "Preserve date" if property exists on the template', async () => {
      await tenants.run(async () => {
        permissionsContext.setCommandContext();
        const entitiesImported = await entities.get({}, {}, { sort: { title: 'asc' } });
        expect(entitiesImported).toMatchObject([
          {
            metadata: { preservation_date: [{ value: 1 }] },
          },
          {
            metadata: { preservation_date: [{ value: 2 }] },
          },
          {
            metadata: { preservation_date: [{ value: 3 }] },
          },
          { metadata: { preservation_date: [] } },
          { metadata: { preservation_date: [] } },
        ]);
      }, tenantName);
    });
  });
});
