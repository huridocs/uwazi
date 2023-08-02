import { Application, Request, Response, NextFunction } from 'express';
import { errorLog } from 'api/log';
import { search } from 'api/search';
import { CSVExporter } from 'api/csv';
import settings from 'api/settings';
import captchaMiddleware from 'api/auth/captchaMiddleware';
import { temporalFilesPath, generateFileName } from './filesystem';
import { validation } from '../utils';
// eslint-disable-next-line node/no-restricted-import
import { createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';

export default (app: Application) => {
  const parseQueryProperty = (query: any, property: string): string[] =>
    query[property] ? JSON.parse(query[property]) : query[property];

  const generateExportFileName = (databaseName: string = '') =>
    `${databaseName}-${new Date().toISOString()}.csv`;

  const removeTempFile = (filePath: string) => async () => {
    try {
      await fs.unlink(filePath);
    } catch (err) {
      errorLog.error(`Error unlinking exported file: ${filePath}`);
    }
  };

  app.post(
    '/api/export',
    async (req: Request, res: Response, next: NextFunction) =>
      req.user ? next() : captchaMiddleware()(req, res, next),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'object',
          properties: {
            filters: { type: 'string' },
            types: { type: 'string' },
            allAggregations: { type: 'string' },
            userSelectedSorting: { type: 'string' },
            order: { type: 'string' },
            sort: { type: 'string' },
            limit: { type: 'string' },
            searchTerm: { type: 'string' },
            includeUnpublished: { type: 'string' },
            unpublished: { type: 'string' },
            ids: { type: 'string' },
          },
        },
      },
    }),
    // eslint-disable-next-line max-statements
    async (req: Request, res: Response, next: NextFunction) => {
      const temporalFilePath = temporalFilesPath(generateFileName({ originalname: 'export.csv' }));
      try {
        const query: any = { ...req.body };
        query.filters = parseQueryProperty(req.body, 'filters');
        query.types = parseQueryProperty(req.body, 'types');
        query.unpublished = parseQueryProperty(req.body, 'unpublished');
        query.includeUnpublished = parseQueryProperty(req.body, 'includeUnpublished');
        query.allAggregations = parseQueryProperty(req.body, 'allAggregations');

        query.ids = parseQueryProperty(req.body, 'ids');
        if (!Array.isArray(query.ids)) delete query.ids;

        const results = await search.search(query, req.language, req.user);
        // eslint-disable-next-line camelcase
        const { dateFormat = '', site_name } = await settings.get();

        const exporter = new CSVExporter();

        const fileStream = createWriteStream(temporalFilePath);
        const exporterOptions = { dateFormat, language: req.language };

        await exporter.export(results, fileStream, req.hostname, query.types, exporterOptions);

        res.download(temporalFilePath, generateExportFileName(site_name), err => {
          if (err) next(err);
          //eslint-disable-next-line @typescript-eslint/no-floating-promises
          removeTempFile(temporalFilePath)();
        });
      } catch (e) {
        await removeTempFile(temporalFilePath)();
        next(e);
      }
    }
  );
};
