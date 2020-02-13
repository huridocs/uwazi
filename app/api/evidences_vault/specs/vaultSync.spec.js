/** @format */

import path from 'path';
import moment from 'moment';
import db from 'api/utils/testing_db';
import entities from 'api/entities';
import { search } from 'api/search';
import { deleteFiles, deleteFile, getFileContent } from 'api/files/filesystem';
import asyncFS from 'api/utils/async-fs';

import fixtures, { templateId } from './fixtures';
import { mockVault } from './helpers.js';
import vaultSync from '../vaultSync';
import vaultEvidencesModel from '../vaultEvidencesModel';
import configPaths from '../../config/paths';

describe('vaultSync', () => {
  const token = 'auth_token';

  beforeEach(async () => {
    await db.clearAllAndLoad(fixtures);
    configPaths.uploadedDocuments = path.join(__dirname, 'uploads');
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
  });

  afterEach(async () => {
    await deleteFile(path.join(__dirname, '/zips/package1.zip'));
    await deleteFile(path.join(__dirname, '/zips/package2.zip'));
    await deleteFile(path.join(__dirname, '/zips/package3.zip'));
    const files = (await asyncFS.readdir(configPaths.uploadedDocuments))
      .filter(f => f !== 'index.html')
      .map(f => path.join(configPaths.uploadedDocuments, f));

    await deleteFiles(files);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('sync', () => {
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
            status: '201',
            time_of_request: '2018-05-25 09:31:25',
          },
          jsonInfo: { title: 'title2' },
        },
      ];

      await mockVault(evidences);
      await vaultSync.sync(token, templateId);
    });

    it('should create entities based on evidences returned', async () => {
      const imported = await entities.get();

      expect(imported.map(e => e.title)).toEqual(['title1', 'title2']);
      expect(imported.map(e => e.template)).toEqual([templateId, templateId]);
    });

    it('should assign url to link field', async () => {
      const imported = await entities.get();

      expect(imported.map(e => e.metadata.original_url[0].value)).toEqual([
        { label: 'url 1', url: 'url 1' },
        { label: 'url 2', url: 'url 2' },
      ]);
    });

    it('should assign time of request', async () => {
      const imported = await entities.get();

      const dates = imported.map(e =>
        moment.utc(e.metadata.time_of_request[0].value, 'X').format('DD-MM-YYYY')
      );
      expect(dates).toEqual(['30-05-2019', '25-05-2018']);
    });

    it('should add zip package as attachment', async () => {
      const imported = await entities.get();

      expect(await getFileContent('1.png')).toBe('this is a fake image');
      expect(await getFileContent('2.png')).toBe('this is a fake image');

      expect(imported[0].attachments.find(a => a.filename.match(/zip/))).toEqual(
        expect.objectContaining({
          filename: '1.zip',
        })
      );

      expect(imported[1].attachments.find(a => a.filename.match(/zip/))).toEqual(
        expect.objectContaining({
          filename: '2.zip',
        })
      );
    });

    it('should set png file as an attachment, and add the link into image field', async () => {
      const imported = await entities.get();

      expect(await getFileContent('1.png')).toBe('this is a fake image');
      expect(await getFileContent('2.png')).toBe('this is a fake image');

      expect(imported.map(e => e.metadata.screenshot[0].value)).toEqual([
        `/api/attachments/download?_id=${imported[0]._id}&file=1.png`,
        `/api/attachments/download?_id=${imported[1]._id}&file=2.png`,
      ]);

      expect(imported[0].attachments.find(a => a.filename.match(/png/))).toEqual(
        expect.objectContaining({
          filename: '1.png',
        })
      );

      expect(imported[1].attachments.find(a => a.filename.match(/png/))).toEqual(
        expect.objectContaining({
          filename: '2.png',
        })
      );
    });

    it('should set mp4 file as an attachment, and add the link into media field', async () => {
      const imported = await entities.get();

      expect(await getFileContent('1.mp4')).toBe('this is a fake video');
      expect(await getFileContent('2.mp4')).toBe('this is a fake video');

      expect(imported.map(e => e.metadata.video[0].value)).toEqual([
        `/api/attachments/download?_id=${imported[0]._id}&file=1.mp4`,
        `/api/attachments/download?_id=${imported[1]._id}&file=2.mp4`,
      ]);

      expect(imported[0].attachments.find(a => a.filename.match(/mp4/))).toEqual(
        expect.objectContaining({
          filename: '1.mp4',
        })
      );

      expect(imported[1].attachments.find(a => a.filename.match(/mp4/))).toEqual(
        expect.objectContaining({
          filename: '2.mp4',
        })
      );
    });
  });

  it('should not fill media/image field if file does not exist', async () => {
    const evidences = [
      {
        listItem: {
          request: '1',
          filename: 'package1.zip',
          status: '201',
        },
        jsonInfo: { title: 'title1' },
      },
      {
        listItem: { request: '2', filename: 'package2.zip', status: '201' },
      },
    ];

    await mockVault(evidences);
    await vaultSync.sync(token, templateId);
    const imported = await entities.get();

    expect(await getFileContent('1.mp4')).toBe('this is a fake video');

    expect(imported.map(e => e.metadata.video[0].value)).toEqual([
      `/api/attachments/download?_id=${imported[0]._id}&file=1.mp4`,
      '',
    ]);

    expect(imported.map(e => e.metadata.screenshot[0].value)).toEqual([
      `/api/attachments/download?_id=${imported[0]._id}&file=1.png`,
      '',
    ]);

    expect(imported[0].attachments).toEqual([
      expect.objectContaining({
        filename: '1.mp4',
      }),
      expect.objectContaining({
        filename: '1.png',
      }),
      expect.objectContaining({
        filename: '1.zip',
      }),
    ]);

    expect(imported[1].attachments).toEqual([
      expect.objectContaining({
        filename: '2.zip',
      }),
    ]);
  });

  it('should not import already imported evidences', async () => {
    await vaultEvidencesModel.saveMultiple([{ request: '1' }, { request: '3' }]);
    const evidences = [
      { listItem: { request: '1', filename: 'package1.zip' }, jsonInfo: { title: 'title1' } },
      { listItem: { request: '3', filename: 'package3.zip' }, jsonInfo: { title: 'title3' } },
      {
        listItem: {
          request: '2',
          filename: 'package2.zip',
          url: 'url 2',
          status: '201',
          time_of_request: '2019-05-30 09:31:25',
        },
        jsonInfo: {
          title: 'title2',
        },
      },
    ];

    await mockVault(evidences);
    await vaultSync.sync(token, templateId);
    await vaultSync.sync(token, templateId);

    const imported = await entities.get();
    expect(imported.map(e => e.title)).toEqual(['title2']);
  });

  it('should not import evidences with 202, 203 or 501 status', async () => {
    const evidences = [
      {
        listItem: { status: '201', request: '1', filename: 'package1.zip' },
        jsonInfo: { title: 'title1' },
      },
      {
        listItem: { status: '203', request: '2', filename: 'package2.zip' },
        jsonInfo: { title: 'title2' },
      },
      {
        listItem: { status: '202', request: '3', filename: 'package3.zip' },
        jsonInfo: { title: 'title3' },
      },
      { listItem: { status: '501', request: '4', filename: null }, jsonInfo: { title: 'title4' } },
    ];

    await mockVault(evidences);
    await vaultSync.sync(token, templateId);

    const imported = await entities.get();
    expect(imported.map(e => e.title)).toEqual(['title1']);
  });
});
