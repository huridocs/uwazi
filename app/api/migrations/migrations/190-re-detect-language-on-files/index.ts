/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-default-export */
import { AnyBulkWriteOperation, Db } from 'mongodb';
import { detectLanguage } from './detectLanguage.js';

const BATCH_SIZE = 500;
const SAMPLE_CHARS = 2048;
const SAMPLE_PAGES = 5;

const pageAnnotationRegex = /\[\[\d+\]\]/g;

type FileDocument = {
  _id: any;
  fullText?: { [k: string]: string };
};

const extractSampleText = (fullText: { [k: string]: string }): string => {
  let combined = '';
  for (let page = 1; page <= SAMPLE_PAGES; page += 1) {
    const pageText = fullText[String(page)];
    if (pageText) {
      combined += pageText.replace(pageAnnotationRegex, ' ');
    }
    if (combined.length >= SAMPLE_CHARS) break;
  }
  return combined.slice(0, SAMPLE_CHARS);
};

const detectNewLanguage = (file: FileDocument): string | undefined => {
  if (!file.fullText) return undefined;
  const detected = detectLanguage(extractSampleText(file.fullText), 'ISO639_3');
  return detected && detected !== 'other' ? detected : undefined;
};

// eslint-disable-next-line max-statements
const processFiles = async (db: Db): Promise<number> => {
  const cursor = db.collection<FileDocument>('files').find(
    { type: 'document', language: 'other', fullText: { $exists: true, $ne: {} } },
    {
      projection: {
        fullText: 1,
      },
    }
  );

  let updatedFiles = 0;
  let batch: AnyBulkWriteOperation<FileDocument>[] = [];

  const flushBatch = async () => {
    if (!batch.length) return;
    await db.collection<FileDocument>('files').bulkWrite(batch, { ordered: false });
    updatedFiles += batch.length;
    batch = [];
  };

  while (await cursor.hasNext()) {
    const file = await cursor.next();
    // eslint-disable-next-line no-continue
    if (!file?._id) continue;
    const detected = detectNewLanguage(file);

    if (detected) {
      batch.push({
        updateOne: { filter: { _id: file._id }, update: { $set: { language: detected } } },
      });
    }
    if (batch.length >= BATCH_SIZE) await flushBatch();
  }

  await flushBatch();
  return updatedFiles;
};

export default {
  delta: 190,

  name: 're-detect-language-on-files',

  description:
    'Re-runs franc language detection on files where language is "other", sampling the first 3000 characters of fullText',

  reindex: false as boolean,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    const updatedFiles = await processFiles(db);
    if (updatedFiles > 0) this.reindex = true;
    process.stdout.write(
      `${this.name}: updated ${updatedFiles} file(s). Reindex: ${this.reindex}.\r\n`
    );
  },
};
