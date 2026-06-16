import { files, storage } from '#api/files/index.js';
import { prettifyError } from '#api/utils/handleError.js';
import { legacyLogger } from '#api/log/index.js';
import request from '#shared/JSONRequest.js';
import entities from '#api/entities/index.js';
import { TocSchema } from '#shared/types/commonTypes.js';
import { FileType } from '#shared/types/fileType.js';
import { tenants } from '#api/tenants/index.js';
import settings from '#api/settings/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { runInJobContext } from '#api/services/tasksmanager/runInJobContext.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

const fakeTocEntry = (label: string): TocSchema => ({
  selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
  indentation: 0,
  label,
});

const saveToc = async (_file: FileType, toc: TocSchema[]) => {
  const existingFile = (
    await FilesDataSourceFactory.default().getById(_file._id!.toString())
  ).getDataOrThrow();

  await ExecutionContext.transactionManager.run(async () =>
    FilesServiceFactory.default().bulkUpsert([existingFile.update({ toc, generatedToc: true })])
  );

  const [entity] = await entities.get({ sharedId: _file.entity }, {});

  await entities.save(
    {
      ...entity,
      generatedToc: true,
    },
    { user: {}, language: entity.language },
    { updateRelationships: false }
  );
};

const generateToc = async (
  url: string,
  filename: string,
  fileContents: Buffer
): Promise<TocSchema[]> => {
  const response = await request.uploadFile(url, filename, fileContents);

  let toc = JSON.parse(response.text);
  if (!toc.length) {
    toc = [fakeTocEntry('ERROR: Toc was generated empty')];
  }
  return toc;
};

const handleError = async (e: { code?: string; message: string }, file: FileType) => {
  if (e?.code !== 'ECONNREFUSED' && e?.code !== 'ECONNRESET') {
    const toc = [fakeTocEntry('ERROR: Toc generation throwed an error'), fakeTocEntry(e.message)];
    await saveToc(file, toc);
  }
};

const tocService = {
  async processAllTenants() {
    return Object.keys(tenants.tenants).reduce(async (previous, tenantName) => {
      await previous;
      return runInJobContext(tenantName, async () => {
        permissionsContext.setCommandContext();
        const { features } = await settings.get({}, 'features.tocGeneration');
        if (features?.tocGeneration) {
          await this.processNext(features.tocGeneration.url);
        }
      });
    }, Promise.resolve());
  },

  async processNext(url: string) {
    const [nextFile] = await files.get(
      {
        type: 'document',
        filename: { $exists: true },
        'toc.0': { $exists: false },
      },
      '',
      { sort: { _id: 1 }, limit: 1 }
    );

    if (nextFile && nextFile.filename) {
      try {
        await saveToc(
          nextFile,
          await generateToc(
            url,
            nextFile.filename,
            await storage.fileContents(nextFile.filename, 'document')
          )
        );
      } catch (e) {
        await handleError(e, nextFile);
        legacyLogger.error(prettifyError(e).prettyMessage);
      }
    }
  },
};

export { tocService };
