import { files, storage } from '#api/files/index.js';
import { tenants } from '#api/tenants/index.js';
import { testingDB } from '#api/utils/testing_db.js';
import request from '#shared/JSONRequest.js';
import type { DBTenant } from '#api/tenants/tenantsModel.js';
import { tocService } from '../tocService.js';
import { fixtures, userId } from './fixtures.js';

describe('tocService', () => {
  let requestMock: jest.SpyInstance;

  beforeAll(async () => {
    requestMock = jest.spyOn(request, 'uploadFile');
    await testingDB.connect({ defaultTenant: false });
    tenants.add({ name: 'tenant1', dbName: 'tenant1', indexName: 'tenant1' });
    tenants.add({ name: 'tenant2', dbName: 'tenant2', indexName: 'tenant2' });
  });

  beforeEach(async () => {
    await testingDB.setupFixturesAndContext(
      { ...fixtures, settings: [{ features: { tocGeneration: { url: 'url' } } }] },
      undefined,
      'tenant1'
    );
    jest.spyOn(storage, 'fileContents').mockReturnValue(Promise.resolve(Buffer.from('content')));
    await testingDB.setupFixturesAndContext(fixtures, undefined, 'tenant2');
    testingDB.UserInContextMockFactory.restore();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('running on all tenants', () => {
    beforeAll(() => {
      requestMock.mockImplementation(async (_url, filename) => {
        if (filename === 'pdf1.pdf') {
          return Promise.resolve({ text: JSON.stringify([{ label: 'section1 pdf1' }]) });
        }
        if (filename === 'pdf3.pdf') {
          return Promise.resolve({ text: JSON.stringify([{ label: 'section1 pdf3' }]) });
        }
        if (filename === 'pdf5.pdf') {
          return Promise.resolve({ text: JSON.stringify([{ label: 'section1 pdf5' }]) });
        }
        throw new Error(`this file is not supposed to be sent for toc generation ${filename}`);
      });
    });

    it('should use the service url configured', async () => {
      await tocService.processAllTenants();
      await tenants.run(async () => {
        expect(requestMock).toHaveBeenCalledWith('url', 'pdf1.pdf', Buffer.from('content'));
      }, 'tenant1');
    });

    it('should not fail when there is no more to process', async () => {
      await tocService.processAllTenants();
      await tocService.processAllTenants();
      await tocService.processAllTenants();
      await expect(tocService.processAllTenants()).resolves.not.toThrow();
    });

    it('should send the next pdfFile and save toc generated', async () => {
      await tocService.processAllTenants();
      await tocService.processAllTenants();
      await tocService.processAllTenants();

      await tenants.run(async () => {
        let [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).toEqual([{ label: 'section1 pdf1' }]);
        expect(fileProcessed.generatedToc).toEqual(true);

        [fileProcessed] = await files.get({ filename: 'pdf3.pdf' });
        expect(fileProcessed.toc).toEqual([{ label: 'section1 pdf3' }]);
        expect(fileProcessed.generatedToc).toEqual(true);
      }, 'tenant1');

      await tenants.run(async () => {
        let [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).not.toBeDefined();
        expect(fileProcessed.generatedToc).not.toBeDefined();

        [fileProcessed] = await files.get({ filename: 'pdf3.pdf' });
        expect(fileProcessed.toc).toEqual([]);
        expect(fileProcessed.generatedToc).not.toBeDefined();
      }, 'tenant2');
    });
  });

  /**
   * tocService has no actor of its own, so it resolves the entity's author and runs the
   * update on their behalf. That lookup goes through UsersDirectory.getActor when
   * `usersDirectory` is on and through the legacy users.getById otherwise (plan 05 step 3).
   *
   * `getActor` is the only read that resolves a soft-deleted user (D3/D9), which is exactly
   * what this path needs: an author who has since left must still be attributable, or a
   * background job that was working yesterday starts throwing "Entity actor not found".
   */
  describe('actor attribution', () => {
    const tenantWithFlag = (usersDirectory: boolean) => {
      tenants.add(<DBTenant>{
        name: 'tenant1',
        dbName: 'tenant1',
        indexName: 'tenant1',
        featureFlags: { usersDirectory },
      });
    };

    // testingDB.mongodb is the default connection, not tenant1's — this suite runs with
    // `defaultTenant: false` and seeds each tenant's own database.
    const softDeleteAuthor = async () => {
      const result = await testingDB
        .db('tenant1')
        .collection('users')
        .updateOne({ _id: userId }, { $set: { deletedAt: new Date() } });

      expect(result.modifiedCount).toBe(1);
    };

    beforeEach(() => {
      requestMock.mockImplementation(async () =>
        Promise.resolve({ text: JSON.stringify([{ label: 'section1 pdf1' }]) })
      );
    });

    afterAll(() => {
      tenantWithFlag(false);
    });

    it.each([
      { path: 'legacy users.getById', usersDirectory: false },
      { path: 'UsersDirectory.getActor', usersDirectory: true },
    ])('should still resolve a soft-deleted author ($path)', async ({ usersDirectory }) => {
      tenantWithFlag(usersDirectory);
      await softDeleteAuthor();

      await expect(tocService.processAllTenants()).resolves.not.toThrow();

      await tenants.run(async () => {
        const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).toEqual([{ label: 'section1 pdf1' }]);
        expect(fileProcessed.generatedToc).toEqual(true);
      }, 'tenant1');
    });

    it('should generate the toc for a live author through UsersDirectory', async () => {
      tenantWithFlag(true);

      await expect(tocService.processAllTenants()).resolves.not.toThrow();

      await tenants.run(async () => {
        const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).toEqual([{ label: 'section1 pdf1' }]);
      }, 'tenant1');
    });
  });

  describe('error handling', () => {
    it('should save a fake TOC when generated one is empty', async () => {
      requestMock.mockImplementation(async () => Promise.resolve({ text: JSON.stringify([]) }));
      await tocService.processAllTenants();
      await tenants.run(async () => {
        const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).toEqual([
          {
            selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
            label: 'ERROR: Toc was generated empty',
            indentation: 0,
          },
        ]);
        expect(fileProcessed.generatedToc).toEqual(true);
      }, 'tenant1');
    });

    it('should save a fake toc when there is an error', async () => {
      requestMock.mockImplementation(async () => {
        throw new Error('request error');
      });
      await tocService.processAllTenants();

      await tenants.run(async () => {
        const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).toEqual([
          {
            selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
            label: 'ERROR: Toc generation throwed an error',
            indentation: 0,
          },
          {
            selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
            label: 'request error',
            indentation: 0,
          },
        ]);
        expect(fileProcessed.generatedToc).toEqual(true);
      }, 'tenant1');
    });

    it('should not save anything when the error is ECONNREFUSED', async () => {
      requestMock.mockImplementation(async () => {
        // eslint-disable-next-line no-throw-literal
        throw { code: 'ECONNREFUSED' };
      });
      await tocService.processAllTenants();

      await tenants.run(async () => {
        const [fileProcessed] = await files.get({ filename: 'pdf1.pdf' });
        expect(fileProcessed.toc).not.toBeDefined();
        expect(fileProcessed.generatedToc).not.toBeDefined();
      }, 'tenant1');
    });
  });

  describe('orphan files (document with no entity)', () => {
    beforeEach(() => {
      requestMock.mockImplementation(async (_url, filename) =>
        Promise.resolve({ text: JSON.stringify([{ label: `section1 ${filename}` }]) })
      );
    });

    it('should skip the orphan and process the next valid file without crashing', async () => {
      const orphanId = testingDB.id();
      const pdf1Id = testingDB.id();
      await testingDB.setupFixturesAndContext(
        {
          ...fixtures,
          settings: [{ features: { tocGeneration: { url: 'url' } } }],
          files: [
            {
              _id: orphanId,
              filename: 'orphan.pdf',
              originalname: 'orphan.pdf',
              language: 'spa',
              type: 'document',
              mimetype: 'application/pdf',
              status: 'ready',
              totalPages: 1,
              // no `entity` field - this is the orphan case
            },
            {
              _id: pdf1Id,
              entity: 'shared1',
              filename: 'pdf1.pdf',
              originalname: 'originalPdf1.pdf',
              language: 'spa',
              type: 'document',
              mimetype: 'application/pdf',
              status: 'ready',
              totalPages: 1,
            },
          ],
        },
        undefined,
        'tenant1'
      );

      await expect(tocService.processAllTenants()).resolves.not.toThrow();

      await tenants.run(async () => {
        const [orphan] = await files.get({ filename: 'orphan.pdf' });
        const [valid] = await files.get({ filename: 'pdf1.pdf' });

        // The orphan is left alone (no entity to attribute a toc to)...
        expect(orphan.generatedToc).not.toBe(true);
        // ...and the valid file behind it gets processed instead of being starved out.
        expect(valid.generatedToc).toBe(true);
        expect(valid.toc).toEqual([{ label: 'section1 pdf1.pdf' }]);
      }, 'tenant1');
    });
  });
});
