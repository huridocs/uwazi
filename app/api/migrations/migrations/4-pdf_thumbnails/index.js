import PDF from 'api/upload/PDF';
import path from 'path';
import { uploadDocumentsPath } from 'api/config/paths';

export default {
  delta: 4,

  name: 'pdf_thumbnails',

  description: 'Creating PDF thubmnails for all documents',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const cursor = db.collection('entities').find({ type: 'document' });
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      await new PDF(path.join(uploadDocumentsPath, doc.file.filename)).createThumbnail(doc._id.toString());
      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }
    process.stdout.write('\r\n');
  }
};
