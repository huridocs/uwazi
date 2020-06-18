import { Writable } from 'stream';
import request from 'supertest';
import { setUpApp } from 'api/utils/testingRoutes';
import search from 'api/search/search';
import db from 'api/utils/testing_db';
import csvExporter from 'api/csv/csvExporter';
import * as filesystem from 'api/files/filesystem';

import routes from '../exportRoutes';
import { NextFunction, Request, Response } from 'express';
import { User } from '../../users/usersModel';

jest.mock('api/csv/csvExporter');

function assertDownloaded(res: any) {
  expect(res.header['content-type'].match(/text\/csv/)).not.toBe(null);
  expect(res.header['content-disposition'].match(/^attachment; filename=(.*)/)).not.toBe(null);
}

function assertExport(mockCall: any, searchResults: any, types: any, options: any) {
  expect(mockCall[0]).toEqual(searchResults);
  expect(mockCall[1]).toEqual(types);
  expect(mockCall[2] instanceof Writable).toBe(true);
  expect(mockCall[3]).toEqual(options);
}

describe('export routes', () => {
  describe('/api/export', () => {
    let exportMock: any;

    beforeEach(async () => {
      const fixtures = {
        settings: [
          {
            dateFormat: 'YYYY-MM-DD',
            site_name: 'uwazi',
            languages: [{ key: 'es', default: true }, { key: 'pt' }, { key: 'en' }],
          },
        ],
      };
      await db.clearAllAndLoad(fixtures);

      exportMock = jest.fn().mockImplementation(async () => Promise.resolve());
      (csvExporter as any).mockImplementation(() => ({
        export: exportMock,
      }));
    });

    afterAll(async () => db.disconnect());

    const fakeRequestAugmenterMiddleware = (user: User, language: string) => (
      req: Request,
      _res: Response,
      next: NextFunction
    ) => {
      (req as any).user = user;
      (req as any).language = language;

      next();
    };

    it('should fetch, process and download the search results', async () => {
      const app = setUpApp(
        routes,
        fakeRequestAugmenterMiddleware({ username: 'someuser' }, 'somelanguage')
      );
      spyOn(search, 'search').and.returnValue({ rows: ['searchresults'] });
      spyOn(filesystem, 'temporalFilesPath').and.returnValue('exportRutesTest-A.csv');

      const res = await request(app)
        .get('/api/export')
        .set('cookie', 'locale=es')
        .query({
          filters: '',
          types: '["types"]',
          fields: '',
          aggregations: '',
          select: '',
          unpublished: '',
          includeUnpublished: '',
        });

      assertDownloaded(res);
      expect(search.search).toHaveBeenCalledWith(
        {
          filters: '',
          types: ['types'],
          fields: '',
          aggregations: '',
          select: '',
          unpublished: '',
          includeUnpublished: '',
        },
        'somelanguage',
        { username: 'someuser' }
      );
      assertExport(exportMock.mock.calls[0], { rows: ['searchresults'] }, ['types'], {
        dateFormat: 'YYYY-MM-DD',
        language: 'somelanguage',
      });
    });
  });
});
