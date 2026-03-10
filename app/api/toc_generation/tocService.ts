import { files, storage } from 'api/files';
import { prettifyError } from 'api/utils/handleError';
import { legacyLogger } from 'api/log';
import request from 'shared/JSONRequest';
import entities from 'api/entities';
import { TocSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import { tenants } from 'api/tenants';
import settings from 'api/settings';
import { permissionsContext } from 'api/permissions/permissionsContext';

const fakeTocEntry = (label: string): TocSchema => ({
  selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
  indentation: 0,
  label,
});

const saveToc = async (file: FileType, toc: TocSchema[]) => {
  await files.save({ ...file, toc, generatedToc: true });
  const [entity] = await entities.get({ sharedId: file.entity }, {});
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
      return tenants.run(async () => {
        permissionsContext.setCommandContext();
        const { features } = await settings.get({}, 'features.tocGeneration');
        if (features?.tocGeneration) {
          await this.processNext(features.tocGeneration.url);
        }
      }, tenantName);
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
