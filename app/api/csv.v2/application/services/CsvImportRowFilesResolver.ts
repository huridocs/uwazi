import { Readable } from 'stream';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { CsvHeaderAnalyzer } from './CsvHeaderAnalyzer.js';
import { CsvImportFileNotFoundError } from './CsvImportRowProcessingError.js';

type RowFiles = {
  attachments: InputFile[];
  documents: InputFile[];
  attachmentFilenameByOriginalName: Map<string, string>;
};

const MULTI_VALUE_SEPARATOR = '|';

const splitFileValues = (rawValue: string) =>
  rawValue
    .split(MULTI_VALUE_SEPARATOR)
    .map(value => value.trim())
    .filter(Boolean);

const getHeaderIndex = (headers: string[], header: string) =>
  headers.findIndex(entry => entry === header);

const getValueFromHeader = (headers: string[], values: string[], header: string) => {
  const index = getHeaderIndex(headers, header);
  return index >= 0 ? values[index] : '';
};

const getFileHeaderValue = (params: {
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
  sanitizedHeaders: string[];
  rowValues: string[];
}) => {
  const { headerAnalysis, sanitizedHeaders, rowValues } = params;
  const fileLanguages = headerAnalysis.languagesPerHeader.file;
  if (fileLanguages?.has(headerAnalysis.defaultLanguage)) {
    return getValueFromHeader(
      sanitizedHeaders,
      rowValues,
      `file__${headerAnalysis.defaultLanguage}`
    );
  }
  return getValueFromHeader(sanitizedHeaders, rowValues, 'file');
};

const getSingleFileValue = (rawValue: string) => rawValue.trim();

const resolveInputFile = async (params: {
  fileStorage: FileStorage;
  destination: string;
  filename: string;
  type: 'attachment' | 'document';
  importId: string;
  column: 'file' | 'files' | 'attachments';
}) => {
  const { fileStorage, destination, filename, type, importId, column } = params;
  try {
    const fileContents = fileStorage.getFile({
      type: 'customPath',
      destination,
      filename,
    });
    const stream = Readable.from(fileContents.read());
    return await InputFile.fromStream({
      stream,
      originalname: filename,
      type,
    });
  } catch (error) {
    throw new CsvImportFileNotFoundError({
      importId,
      filename,
      column,
      cause: error,
    });
  }
};

class CsvImportRowFilesResolver {
  static async resolve(params: {
    importId: string;
    rowValues: string[];
    sanitizedHeaders: string[];
    headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
    fileStorage: FileStorage;
  }): Promise<RowFiles> {
    const { importId, rowValues, sanitizedHeaders, headerAnalysis, fileStorage } = params;
    const destination = `csv-imports/${importId}/extracted`;
    const fileValue = getSingleFileValue(
      getFileHeaderValue({ headerAnalysis, sanitizedHeaders, rowValues })
    );
    const filesValue = getValueFromHeader(sanitizedHeaders, rowValues, 'files');
    const attachmentsValue = getValueFromHeader(sanitizedHeaders, rowValues, 'attachments');

    const documentFilenames = [...(fileValue ? [fileValue] : []), ...splitFileValues(filesValue)];

    const documents = await Promise.all(
      documentFilenames.map(async filename =>
        resolveInputFile({
          fileStorage,
          destination,
          filename,
          type: 'document',
          importId,
          column: fileValue === filename ? 'file' : 'files',
        })
      )
    );

    const attachments = await Promise.all(
      splitFileValues(attachmentsValue).map(async filename =>
        resolveInputFile({
          fileStorage,
          destination,
          filename,
          type: 'attachment',
          importId,
          column: 'attachments',
        })
      )
    );

    const attachmentFilenameByOriginalName = new Map<string, string>();
    attachments.forEach(attachment => {
      if (!attachmentFilenameByOriginalName.has(attachment.metadata.originalname)) {
        attachmentFilenameByOriginalName.set(attachment.metadata.originalname, attachment.filename);
      }
    });

    return { attachments, documents, attachmentFilenameByOriginalName };
  }
}

export { CsvImportRowFilesResolver };
export type { RowFiles };
