import { uploadDocumentsPath } from 'api/config/paths';
import PDF from 'api/upload/PDF';
import fs from 'fs';
import path from 'path';

export default {
  delta: 3,

  name: 'fullText_to_per_page',

  description: 'change fullText, now text pages will be saved indexed in an object and pseudo formated with pdftotext',

  up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    const cursor = db.collection('entities').find({ type: 'document' }, { _id: 1, file: 1 });
    return db.collection('entities').count({ type: 'document' })
    .then(totalDocuments => new Promise((resolve, reject) => {
      if (totalDocuments === 0) {
        return resolve();
      }
      let index = 1;
      cursor.on('data', (entity) => {
        cursor.pause();

        if (!entity.file || (entity.file && !entity.file.filename)) {
          process.stdout.write(`processed -> ${index}\r`);
          index += 1;
          if (index - 1 === totalDocuments) {
            return resolve();
          }
          cursor.resume();
          return;
        }

        if (!fs.existsSync(path.join(uploadDocumentsPath, entity.file.filename))) {
          process.stdout.write(`processed -> ${index}\r`);
          index += 1;
          if (index - 1 === totalDocuments) {
            return resolve();
          }
          cursor.resume();
          return;
        }

        new PDF(path.join(uploadDocumentsPath, entity.file.filename)).convert()
        .then((conversion) => {
          db.collection('entities').findOneAndUpdate(entity, { $set: { ...conversion } }, () => {
            process.stdout.write(`processed -> ${index}\r`);
            index += 1;
            if (index - 1 === totalDocuments) {
              return resolve();
            }
            cursor.resume();
          });
        }).catch((e) => {
          console.log(e);
          db.collection('entities').findOneAndUpdate(entity, { $set: { fullText: { 1: '' } } }, () => {
            process.stdout.write(`processed -> ${index}\r`);
            index += 1;
            if (index - 1 === totalDocuments) {
              return resolve();
            }
            cursor.resume();
          });
        });
      });

      cursor.on('err', reject);
    }));
  }
};
