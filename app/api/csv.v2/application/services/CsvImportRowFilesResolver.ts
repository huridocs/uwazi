import { Readable } from 'stream';
import { FileStorage } from 'api/core/application/contracts/FileStorage';
import { InputFile } from 'api/core/infrastructure/files/InputFile';
import { CsvHeaderAnalyzer } from './CsvHeaderAnalyzer';

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

const resolveInputFile = async (params: {
  fileStorage: FileStorage;
  destination: string;
  filename: string;
  type: 'attachment' | 'document';
  importId: string;
}) => {
  const { fileStorage, destination, filename, type, importId } = params;
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
    throw new Error(`CSV import missing file "${filename}" for import ${importId}`);
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
    const fileValue = getFileHeaderValue({ headerAnalysis, sanitizedHeaders, rowValues });
    const attachmentsValue = getValueFromHeader(sanitizedHeaders, rowValues, 'attachments');

    const documents = await Promise.all(
      splitFileValues(fileValue).map(async filename =>
        resolveInputFile({
          fileStorage,
          destination,
          filename,
          type: 'document',
          importId,
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
