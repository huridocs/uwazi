/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-default-export */
import { AnyBulkWriteOperation, Db, ObjectId } from 'mongodb';
import { ProcessedPdfDocument, ThumbnailDocument } from './types.js';

const BATCH_SIZE = 500;

export default {
  delta: 185,
  name: 'fix-missing-fields-on-thumbnails',
  description:
    'Fixes thumbnails with missing fields (entity, language, originalname, mimetype) by looking up the corresponding processed PDF. Thumbnails with no matching processed PDF are deleted.',
  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = db.collection<ThumbnailDocument>('files').find({
      type: 'thumbnail',
      $or: [
        { entity: { $exists: false } },
        { language: { $exists: false } },
        { originalname: { $exists: false } },
        { mimetype: { $exists: false } },
      ],
    });

    let fixed = 0;
    let deleted = 0;
    let batch: AnyBulkWriteOperation<ThumbnailDocument>[] = [];

    const flushBatch = async () => {
      if (!batch.length) return;
      await db.collection<ThumbnailDocument>('files').bulkWrite(batch, { ordered: false });
      batch = [];
    };

    while (await cursor.hasNext()) {
      const thumbnails: ThumbnailDocument[] = [];
      while ((await cursor.hasNext()) && thumbnails.length < BATCH_SIZE) {
        const doc = await cursor.next();
        if (doc) thumbnails.push(doc);
      }

      // Derive the processed PDF ObjectIds from the thumbnail filenames
      const pdfIdByThumbnailId = new Map<string, ObjectId>();
      const pdfIds: ObjectId[] = [];

      for (const thumbnail of thumbnails) {
        const pdfIdStr = thumbnail.filename.replace(/\.jpg$/, '');
        try {
          const pdfId = new ObjectId(pdfIdStr);
          pdfIdByThumbnailId.set(thumbnail._id.toHexString(), pdfId);
          pdfIds.push(pdfId);
        } catch {
          // filename does not encode a valid ObjectId — no matching PDF possible
        }
      }

      // Fetch all matching processed PDFs in one query
      const processedPdfs = await db
        .collection<ProcessedPdfDocument>('files')
        .find({ _id: { $in: pdfIds }, type: 'document', status: 'ready' })
        .toArray();

      const pdfMap = new Map<string, ProcessedPdfDocument>(
        processedPdfs.map(pdf => [pdf._id.toHexString(), pdf])
      );

      for (const thumbnail of thumbnails) {
        const pdfId = pdfIdByThumbnailId.get(thumbnail._id.toHexString());
        const matchingPdf = pdfId ? pdfMap.get(pdfId.toHexString()) : undefined;

        if (!matchingPdf) {
          batch.push({ deleteOne: { filter: { _id: thumbnail._id } } });
          deleted += 1;
        } else {
          const updateSet: Partial<ThumbnailDocument> = {};

          if (!thumbnail.entity) updateSet.entity = matchingPdf.entity;
          if (!thumbnail.language) updateSet.language = matchingPdf.language;
          if (!thumbnail.originalname) updateSet.originalname = thumbnail.filename;
          if (!thumbnail.mimetype) updateSet.mimetype = 'image/jpeg';

          batch.push({
            updateOne: { filter: { _id: thumbnail._id }, update: { $set: updateSet } },
          });
          fixed += 1;
        }
      }

      await flushBatch();
    }

    process.stdout.write(
      `fix-missing-fields-on-thumbnails done. Fixed: ${fixed}, Deleted (no matching PDF): ${deleted}.\r\n`
    );
  },
};
