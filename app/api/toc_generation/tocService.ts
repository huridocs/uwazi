import { files, uploadsPath } from 'api/files';
import { prettifyError } from 'api/utils/handleError';
import errorLog from 'api/log/errorLog';
import request from 'shared/JSONRequest';
import entities from 'api/entities';
import { TocSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';

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
    false
  );
};

const generateToc = async (url: string, file: FileType): Promise<TocSchema[]> => {
  const response = await request.uploadFile(url, file.filename, uploadsPath(file.filename));

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

const tocService = (serviceUrl: string) => ({
  async processNext() {
    const [nextFile] = await files.get(
      {
        $or: [{ toc: { $size: 0 } }, { toc: { $exists: false } }],
        type: 'document',
        filename: { $exists: true },
      },
      '',
      { sort: { _id: 1 }, limit: 1 }
    );

    if (nextFile) {
      try {
        await saveToc(nextFile, await generateToc(serviceUrl, nextFile));
      } catch (e) {
        await handleError(e, nextFile);
        errorLog.error(prettifyError(e).prettyMessage);
      }
    }
  },
});

export { tocService };
