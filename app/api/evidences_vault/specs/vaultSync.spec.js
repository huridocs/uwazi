import path from 'path';
import backend from 'fetch-mock'; // eslint-disable-line
import moment from 'moment';
import db from 'api/utils/testing_db';
import entities from 'api/entities';
import { search } from 'api/search';
import { deleteFiles, getFileContent, testingUploadPaths } from 'api/files/filesystem';
import { tenants } from 'api/tenants';

import fixtures, { templateId } from './fixtures';
import { mockVault } from './helpers.js';
import vaultSync from '../vaultSync';
import vaultEvidencesModel from '../vaultEvidencesModel';

describe('vaultSync', () => {
  const token = 'auth_token';
  const tenantName = 'evidenceVaultTenant';

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

  afterEach(async () => {
    await deleteFiles([
      path.join(__dirname, '/zips/package1.zip'),
      path.join(__dirname, '/zips/package2.zip'),
      path.join(__dirname, '/zips/package3.zip'),
      path.join(__dirname, '/zips/package5.zip'),
    ]);
  });

  afterAll(async () => db.disconnect());

  describe('sync', () => {
    let imported;
    beforeEach(async () => {
      const evidences = [
        {
          listItem: {
            request: '1',
            filename: 'package1.zip',
            url: 'url 1',
            status: '201',
            time_of_request: '2019-05-30 09:31:25',
          },
          jsonInfo: { title: 'title1' },
        },
        {
          listItem: {
            request: '2',
            filename: 'package2.zip',
            url: 'url 2',
            status: '418',
            time_of_request: '2018-05-25 09:31:25',
          },
          jsonInfo: { title: 'title2' },
        },
        {
          listItem: { status: '203', request: '3', filename: 'package3.zip' },
          jsonInfo: { title: 'title2' },
        },
        {
          listItem: { status: '501', request: '4', filename: null },
          jsonInfo: { title: 'title4' },
        },
      ];

      await mockVault(token, evidences);
      await vaultSync.syncAllTenants();

      await tenants.run(async () => {
        imported = await entities.get();
      }, tenantName);
    });

    it('should create entities based on evidences with 201 or 418 status', async () => {
      expect(imported.map(e => e.title)).toEqual(['title1', 'title2']);
      expect(imported.map(e => e.template)).toEqual([templateId, templateId]);
    });

    it('should assign url to link field', async () => {
      expect(imported.map(e => e.metadata.original_url[0].value)).toEqual([
        { label: 'url 1', url: 'url 1' },
        { label: 'url 2', url: 'url 2' },
      ]);
    });

    it('should assign time of request', async () => {
      const dates = imported.map(e =>
        moment.utc(e.metadata.time_of_request[0].value, 'X').format('DD-MM-YYYY')
      );
      expect(dates).toEqual(['30-05-2019', '25-05-2018']);
    });

    it('should add zip package as attachment', async () => {
      await tenants.run(async () => {
        expect(await getFileContent('1.png')).toBe('this is a fake image');
        expect(await getFileContent('2.png')).toBe('this is a fake image');
      }, tenantName);

      expect(imported[0].attachments.find(a => a.filename.match(/zip/))).toMatchObject({
        filename: '1.zip',
      });

      expect(imported[1].attachments.find(a => a.filename.match(/zip/))).toMatchObject({
        filename: '2.zip',
      });
    });

    it('should set png file as an attachment, and add the link into image field', async () => {
      const firstPngAttachment = imported[0].attachments.find(a => a.filename.match(/png/));
      expect(firstPngAttachment).toMatchObject({ filename: '1.png' });

      expect(imported[0].metadata.screenshot[0]).toEqual({
        value: '/api/files/1.png',
      });

      const secondPngAttachment = imported[1].attachments.find(a => a.filename.match(/png/));
      expect(secondPngAttachment).toMatchObject({ filename: '2.png' });

      expect(imported[1].metadata.screenshot[0]).toEqual({
        value: '/api/files/2.png',
      });
    });

    it('should set mp4 file as an attachment, and add the link into media field', async () => {
      await tenants.run(async () => {
        expect(await getFileContent('1.mp4')).toBe('this is a fake video');
        expect(await getFileContent('2.mp4')).toBe('this is a fake video');
      }, tenantName);

      const firstMp4Attachment = imported[0].attachments.find(a => a.filename.match(/mp4/));
      expect(firstMp4Attachment).toMatchObject({ filename: '1.mp4' });

      expect(imported[0].metadata.video[0]).toEqual({
        value: '/api/files/1.mp4',
      });

      const secondPngAttachment = imported[1].attachments.find(a => a.filename.match(/mp4/));
      expect(secondPngAttachment).toMatchObject({ filename: '2.mp4' });

      expect(imported[1].metadata.video[0]).toEqual({
        value: '/api/files/2.mp4',
      });
    });

    it('should work with multiple token/template configs', async () => {
      const anotherToken = 'anotherToken';
      const evidences = [
        {
          listItem: { status: '201', request: '5', filename: 'package5.zip' },
          jsonInfo: { title: 'title5' },
        },
        {
          listItem: { status: '501', request: '8', filename: null },
          jsonInfo: { title: 'title8' },
        },
      ];

      await mockVault(anotherToken, evidences);

      await tenants.run(async () => {
        await vaultSync.sync([
          { token, template: templateId },
          { token: anotherToken, template: templateId },
        ]);
        imported = await entities.get();
      }, tenantName);

      expect(imported.map(e => e.title)).toEqual(['title1', 'title2', 'title5']);
      expect(imported.map(e => e.template)).toEqual([templateId, templateId, templateId]);
    });
  });

  it('should not fill media/image field if file does not exist', async () => {
    const evidences = [
      {
        listItem: { request: '1', filename: 'package1.zip', status: '201' },
        jsonInfo: { title: 'title1' },
      },
      {
        listItem: { request: '2', filename: 'package2.zip', status: '201' },
      },
    ];

    await mockVault(token, evidences);

    let imported;
    await tenants.run(async () => {
      await vaultSync.sync({ token, template: templateId });
      imported = await entities.get();
      expect(await getFileContent('1.mp4')).toBe('this is a fake video');
    }, tenantName);

    expect(imported.map(e => e.metadata.video[0].value)).toEqual(['/api/files/1.mp4', '']);

    expect(imported.map(e => e.metadata.screenshot[0].value)).toEqual(['/api/files/1.png', '']);

    expect(imported[0].attachments).toMatchObject([
      { filename: '1.mp4' },
      { filename: '1.png' },
      { filename: '1.zip' },
    ]);

    expect(imported[1].attachments).toMatchObject([{ filename: '2.zip' }]);
  });

  it('should not import already imported evidences', async () => {
    await tenants.run(async () => {
      await vaultEvidencesModel.saveMultiple([{ request: '1' }, { request: '3' }]);
    }, tenantName);

    const evidences = [
      { listItem: { request: '1', filename: 'package1.zip' }, jsonInfo: { title: 'title1' } },
      { listItem: { request: '3', filename: 'package3.zip' }, jsonInfo: { title: 'title3' } },
      {
        listItem: { request: '2', filename: 'package2.zip', url: 'url 2', status: '201' },
        jsonInfo: { title: 'title2' },
      },
    ];

    await mockVault(token, evidences);

    let imported;
    await tenants.run(async () => {
      await vaultSync.sync({ token, template: templateId });
      await vaultSync.sync({ token, template: templateId });
      imported = await entities.get();
    }, tenantName);

    expect(imported.map(e => e.title)).toEqual(['title2']);
  });
});
