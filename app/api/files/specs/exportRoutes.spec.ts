import { Writable } from 'stream';
import request from 'supertest';
import { setUpApp } from 'api/utils/testingRoutes';
import { search } from 'api/search';
import csvExporter, { SearchResults } from 'api/csv/csvExporter';
import * as filesystem from 'api/files/filesystem';
import { NextFunction, Request, Response } from 'express';
import authMiddleware from 'api/auth/authMiddleware';

import { User } from 'api/users/usersModel';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import routes from '../exportRoutes';

jest.mock('api/csv/csvExporter');
jest.mock('../../auth/authMiddleware.ts');

const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

function assertDownloaded(res: any) {
  expect(res.header['content-type'].match(/text\/csv/)).not.toBe(null);
  expect(res.header['content-disposition'].match(/^attachment; filename=(.*)/)).not.toBe(null);
}

function assertExport(mockCall: any, searchResults: any, types: any, options: any) {
  expect(mockCall[0]).toEqual(searchResults);
  expect(mockCall[1] instanceof Writable).toBe(true);
  expect(mockCall[2]).toEqual(types);
  expect(mockCall[3]).toEqual(options);
}

describe('export routes', () => {
  describe('/api/export', () => {
    let exportMock: any;

    beforeEach(async () => {
      const fixtures = {
        settings: [
          {
            dateFormat: 'yyyy-MM-dd',
            site_name: 'uwazi',
            languages: [
              { key: 'es', label: 'ES', default: true },
              { key: 'pt', label: 'PT' },
              { key: 'en', label: 'EN' },
            ],
          },
        ],
      };
      await testingEnvironment.setUp(fixtures);

      exportMock = jest.fn().mockImplementation(
        async (_searchResults: SearchResults, writeStream: Writable, _types: string[] = []) =>
          new Promise(resolve => {
            writeStream.write('content');
            writeStream.on('finish', resolve);
            writeStream.end();
          })
      );
      (csvExporter as any).mockImplementation(() => ({
        export: exportMock,
      }));
    });

    afterAll(async () => testingEnvironment.tearDown());

    const fakeRequestAugmenterMiddleware =
      (user: User, language: string) => (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = user;
        (req as any).language = language;

        next();
      };

    it('should fetch, process and download the search results', async () => {
      mockedAuthMiddleware.mockImplementation(
        () => (_req: Request, _res: Response, next: NextFunction) => {
          next();
        }
      );
      spyOn(search, 'search').and.returnValue({ rows: ['searchresults'] });
      spyOn(filesystem, 'temporalFilesPath').and.returnValue('exportRutesTest-A.csv');

      const app = setUpApp(
        routes,
        fakeRequestAugmenterMiddleware({ username: 'someuser' }, 'somelanguage')
      );

      const res = await request(app).get('/api/export').set('cookie', 'locale=es').query({
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
        dateFormat: 'yyyy-MM-dd',
        language: 'somelanguage',
      });
    });

    it('should not allow logged out users to export csv without a captcha', async () => {
      const app = setUpApp(routes);

      const res = await request(app).get('/api/export').set('cookie', 'locale=es').query({
        filters: '',
        types: '["types"]',
        fields: '',
        aggregations: '',
        select: '',
        unpublished: '',
        includeUnpublished: '',
      });

      expect(res.header['content-type'].match(/text\/csv/)).toBe(null);
      expect(res.status).toBe(403);
    });
  });
});
