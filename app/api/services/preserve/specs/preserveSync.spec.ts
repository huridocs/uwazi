import 'isomorphic-fetch';
import entities from 'api/entities';
import { testingUploadPaths } from 'api/files/filesystem';
import { search } from 'api/search';
import { tenants } from 'api/tenants';
import db from 'api/utils/testing_db';
import backend from 'fetch-mock';
import { EntitySchema } from 'shared/types/entityType';
import { preserveSync } from '../preserveSync';
import { fixtures, templateId } from './fixtures';

const mockVault = async (host, token, evidences) => {
  backend.get(
    // @ts-ignore
    (url, opts) => url === `${host}/api/evidences` && opts?.headers.Authorization === token,
    JSON.stringify(evidences)
  );

  // return Promise.all(
  //   evidences.map(async e => {
  //     if (e.listItem.filename) {
  //       await createPackage(JSON.stringify(e.jsonInfo), e.listItem.filename);
  //       const zipPackage = fs.createReadStream(path.join(__dirname, `zips/${e.listItem.filename}`));
  //       const zipResponse = new Response(zipPackage, {
  //         headers: { 'Content-Type': 'application/zip' },
  //       });
  //       backend.get(`https://preserve.org/download/${e.listItem.filename}`, file);
  //     }
  //   })
  // );
};

describe('preserveSync', () => {
  const tenantName = 'preserveTenant';

  beforeEach(async () => {
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

  describe('sync', () => {
    let imported: EntitySchema[];
    beforeEach(async () => {
      const evidences = [
        {
          attributes: {
            title: 'title of url1',
            status: 'PROCESSED',
            url: 'url1',
            downloads: [
              { path: '/evidences/id1/content.txt' },
              { path: '/evidences/id1/screenshot.jpg' },
            ],
          },
        },
        {
          attributes: {
            title: 'title of url2',
            status: 'PROCESSED',
            url: 'url2',
            downloads: [
              { path: '/evidences/id2/content.txt' },
              { path: '/evidences/id2/screenshot.jpg' },
            ],
          },
        },
      ];

      await mockVault('http://preserve-testing.org', 'auth-token', evidences);
      await preserveSync.syncAllTenants();

      await tenants.run(async () => {
        imported = await entities.get();
      }, tenantName);
    });

    it('should create entities based on evidences PROCESSED status', async () => {
      expect(imported.map(e => e.title)).toEqual(['title of url1', 'title of url2']);
      expect(imported.map(e => e.template)).toEqual([templateId, templateId]);
    });

    // it('should add all downloads to attachments', async () => {});
  });

  // it('should not import already imported evidences', async () => {});
});
