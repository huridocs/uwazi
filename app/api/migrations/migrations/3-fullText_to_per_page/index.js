/* eslint-disable */

import { config } from 'api/config';
import { PDF } from 'api/files/PDF';
import fs from 'fs';
import path from 'path';

export default {
  delta: 3,

  name: 'fullText_to_per_page',

  description:
    'change fullText, now text pages will be saved indexed in an object and pseudo formated with pdftotext',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const totalDocuments = await db.collection('entities').countDocuments({ type: 'document' });
    if (totalDocuments === 0) {
      return;
    }
    const cursor = db.collection('entities').find({ type: 'document' }, { _id: 1, file: 1 });
    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      if (!entity.file || (entity.file && !entity.file.filename)) {
        process.stdout.write(`processed (no filename) -> ${index}\r`);
      } else if (
        !fs.existsSync(path.join(config.defaultTenant.uploadedDocuments, entity.file.filename))
      ) {
        process.stdout.write(`processed (no file) -> ${index}\r`);
      } else {
        try {
          const conversion = await new PDF({
            filename: path.join(config.defaultTenant.uploadedDocuments, entity.file.filename),
          }).extractText();
          await db.collection('entities').findOneAndUpdate(entity, { $set: { ...conversion } });
          process.stdout.write(`processed -> ${index}\r`);
        } catch (err) {
          await db
            .collection('entities')
            .findOneAndUpdate(entity, { $set: { fullText: { 1: '' } } });
          process.stdout.write(`processed (${err}) -> ${index}\r`);
        }
      }
      index += 1;
      if (index - 1 === totalDocuments) {
        return;
      }
    }
  },
};
