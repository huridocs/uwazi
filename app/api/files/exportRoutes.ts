import { createWriteStream, unlink } from 'fs';
import errorLog from 'api/log/errorLog';
import { search } from 'api/search';
import { validation } from '../utils';
import { isArray } from 'util';
import { temporalFilesPath, generateFileName } from './filesystem';
import { CSVExporter } from 'api/csv';
import { User } from 'api/users/usersModel';
import settings from 'api/settings';

type Middleware = (
  req: { user: User; language: any; query: any },
  res: { download: any },
  next: any
) => Promise<void> | void;
type Get = { (arg0: string, arg1: Middleware, arg2: Middleware): void };
type App = { get: Get };

export default (app: App) => {
  const parseQueryProperty = (query: any, property: string) =>
    query[property] ? JSON.parse(query[property]) : query[property];

  const generateExportFileName = (databaseName: string) =>
    `${databaseName}-${new Date().toISOString()}.csv`;

  const removeTempFile = (filePath: string) => () => {
    unlink(filePath, err => {
      if (err) errorLog.error(`Error unlinking exported file: ${filePath}`);
    });
  };

  app.get(
    '/api/export',
    validation.validateRequest({
      properties: {
        query: {
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
    async (req, res, next) => {
      req.query.filters = parseQueryProperty(req.query, 'filters');
      req.query.types = parseQueryProperty(req.query, 'types');
      req.query.unpublished = parseQueryProperty(req.query, 'unpublished');
      req.query.includeUnpublished = parseQueryProperty(req.query, 'includeUnpublished');
      req.query.allAggregations = parseQueryProperty(req.query, 'allAggregations');

      req.query.ids = parseQueryProperty(req.query, 'ids');
      if (!isArray(req.query.ids)) delete req.query.ids;

      const results = await search.search(req.query, req.language, req.user);
      // eslint-disable-next-line camelcase
      const { dateFormat, site_name } = await settings.get();

      const exporter = new CSVExporter();
      const temporalFilePath = temporalFilesPath(generateFileName({ originalname: 'export.csv' }));
      const fileStream = createWriteStream(temporalFilePath);
      const exporterOptions = { dateFormat, language: req.language };

      try {
        await exporter.export(results, req.query.types, fileStream, exporterOptions);

        res.download(
          temporalFilePath,
          generateExportFileName(site_name),
          removeTempFile(temporalFilePath)
        );
      } catch (e) {
        removeTempFile(temporalFilePath)();
        next(e);
      }
    }
  );
};
