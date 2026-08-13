import { AnyBulkWriteOperation, Db, ObjectId } from 'mongodb';
import mimetypes from 'mime-types';

const BATCH_SIZE = 500;
const IMPORT_CSV = 'import.csv';
const MULTI_VALUE_SEPARATOR = '|';

type CsvImportRowDoc = {
  importId?: string;
  headers?: string[];
  values?: string[];
};

type CsvImportDoc = {
  _id: ObjectId;
  extraction?: {
    files?: Array<{ filename?: string }>;
  };
};

type FileDoc = {
  _id: ObjectId;
  originalname?: string;
};

const AFFECTED_FILES_FILTER = {
  mimetype: 'text/html',
  type: { $in: ['document', 'attachment'] },
  $or: [{ url: { $exists: false } }, { url: null }, { url: '' }],
};

const normalizeHeader = (header: string) => header.trim().toLowerCase();

const isSingleFileHeader = (header: string) => {
  const normalized = normalizeHeader(header);
  return normalized === 'file' || normalized.startsWith('file__');
};

const isMultiFileHeader = (header: string) => {
  const normalized = normalizeHeader(header);
  return normalized === 'files' || normalized === 'attachments';
};

const addSplitFilenames = (rawValue: string, names: Set<string>) => {
  rawValue
    .split(MULTI_VALUE_SEPARATOR)
    .map(value => value.trim())
    .filter(Boolean)
    .forEach(filename => names.add(filename));
};

const collectFilenamesFromRow = (row: CsvImportRowDoc, names: Set<string>) => {
  const headers = row.headers || [];
  const values = row.values || [];

  headers.forEach((header, index) => {
    const rawValue = values[index] ?? '';
    if (isSingleFileHeader(header)) {
      const filename = rawValue.trim();
      if (filename) names.add(filename);
      return;
    }
    if (isMultiFileHeader(header)) {
      addSplitFilenames(rawValue, names);
    }
  });
};

const addExtractionFilenames = (
  csvImport: CsvImportDoc,
  importIdsWithRows: Set<string>,
  names: Set<string>
) => {
  if (importIdsWithRows.has(csvImport._id.toString())) return;

  (csvImport.extraction?.files || []).forEach(file => {
    const filename = file.filename?.trim();
    if (filename && filename.toLowerCase() !== IMPORT_CSV) {
      names.add(filename);
    }
  });
};

const collectImportedOriginalNames = async (db: Db) => {
  const names = new Set<string>();
  const importIdsWithRows = new Set<string>();
  const rows = await db
    .collection<CsvImportRowDoc>('csv_import_rows')
    .find({}, { projection: { importId: 1, headers: 1, values: 1 } })
    .toArray();

  rows.forEach(row => {
    if (row.importId) importIdsWithRows.add(row.importId);
    collectFilenamesFromRow(row, names);
  });

  const imports = await db
    .collection<CsvImportDoc>('csv_imports')
    .find({}, { projection: { extraction: 1 } })
    .toArray();

  imports.forEach(csvImport => addExtractionFilenames(csvImport, importIdsWithRows, names));

  return names;
};

const expectedMimetype = (originalname: string) => {
  const lookup = mimetypes.lookup(originalname);
  if (!lookup || lookup === 'text/html') return undefined;
  return lookup;
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const buildMimetypeOperations = (files: FileDoc[]): AnyBulkWriteOperation<FileDoc>[] =>
  files.flatMap(file => {
    if (!file.originalname) return [];
    const mimetype = expectedMimetype(file.originalname);
    if (!mimetype) return [];
    return [
      {
        updateOne: {
          filter: { _id: file._id },
          update: { $set: { mimetype } },
        },
      },
    ];
  });

const updateFilesForNames = async (db: Db, names: string[]) => {
  const files = await db
    .collection<FileDoc>('files')
    .find(
      { ...AFFECTED_FILES_FILTER, originalname: { $in: names } },
      { projection: { _id: 1, originalname: 1 } }
    )
    .toArray();

  const operations = buildMimetypeOperations(files);
  if (!operations.length) return 0;

  const result = await db.collection<FileDoc>('files').bulkWrite(operations, { ordered: false });
  return result.modifiedCount;
};

const updateAffectedFiles = async (db: Db, originalNames: string[]) => {
  const counts = await chunk(originalNames, BATCH_SIZE).reduce<Promise<number>>(
    async (pending, names) => (await pending) + (await updateFilesForNames(db, names)),
    Promise.resolve(0)
  );
  return counts;
};

export default {
  delta: 202,

  name: 'fix-csv-import-file-mimetypes',

  description:
    'Corrects mimetype on files imported through CSV v2 that were stored as text/html. Candidates are taken from csv_import_rows (file/files/attachments columns) or, when an import has no rows left, from csv_imports.extraction.files.',

  reindex: false,

  requiresSchema: 12,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const originalNames = [...(await collectImportedOriginalNames(db))];
    const updated = originalNames.length ? await updateAffectedFiles(db, originalNames) : 0;
    const summary = originalNames.length
      ? `${this.name}: updated ${updated} file(s).\r\n`
      : `${this.name}: no CSV-imported filenames found.\r\n`;

    process.stdout.write(summary);
  },
};
