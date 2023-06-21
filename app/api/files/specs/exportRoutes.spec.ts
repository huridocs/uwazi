import authMiddleware from 'api/auth/authMiddleware';
import csvExporter, { SearchResults } from 'api/csv/csvExporter';
import * as filesystem from 'api/files/filesystem';
import { search } from 'api/search';
import { setUpApp } from 'api/utils/testingRoutes';
import { NextFunction, Request, Response } from 'express';
import { Writable } from 'stream';
import request from 'supertest';

import { User } from 'api/users/usersModel';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import routes from '../exportRoutes';

jest.mock('api/csv/csvExporter');
jest.mock('../../auth/authMiddleware.ts');

const mockedAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

describe('export routes', () => {
  describe('/api/export', () => {
    let exportMock: jest.Mock;

    beforeEach(async () => {
      const fixtures: DBFixture = {
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
        req.user = user;
        req.language = language;
        next();
      };

    it('should fetch, process and download the search results', async () => {
      mockedAuthMiddleware.mockImplementation(
        () => (_req: Request, _res: Response, next: NextFunction) => {
          next();
        }
      );
      // @ts-ignore
      jest.spyOn(search, 'search').mockResolvedValueOnce({ rows: ['searchresults'] });
      jest.spyOn(filesystem, 'temporalFilesPath').mockReturnValueOnce('exportRutesTest-A.csv');

      const app = setUpApp(
        routes,
        fakeRequestAugmenterMiddleware({ username: 'someuser' }, 'somelanguage')
      );

      const res = await request(app)
        .get('/api/export')
        .set('cookie', 'locale=es')
        .set('host', 'cejil.uwazi.io')
        .query({
          filters: '',
          types: '["types"]',
          fields: '',
          aggregations: '',
          select: '',
          unpublished: '',
          includeUnpublished: '',
        });
      expect(res.header['content-type']).toEqual('text/csv; charset=UTF-8');
      expect(res.header['content-disposition'].match(/^attachment; filename=(.*)/)).not.toBe(null);
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
      expect(exportMock.mock.calls[0][0]).toEqual({ rows: ['searchresults'] });
      expect(exportMock.mock.calls[0][1] instanceof Writable).toBe(true);
      expect(exportMock.mock.calls[0][2]).toEqual('cejil.uwazi.io');
      expect(exportMock.mock.calls[0][3]).toEqual(['types']);
      expect(exportMock.mock.calls[0][4]).toEqual({
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
