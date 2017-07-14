import P from 'bluebird';
import PDF from '../upload/PDF.js';
import entities from '../entities/entitiesModel';
import fs from 'fs';
import mongoose from 'mongoose';

entities.get({type: 'document'}, {_id: 1})
.then(documents => {
  return P.resolve(documents).map(({_id}) => {
    return entities.get({_id})
    .then(([doc]) => {
      if (!doc.file) {
        return;
      }
      const file = __dirname + '/../../../uploaded_documents/' + doc.file.filename;
      if (!fs.existsSync(file)) {
        return;
      }
      return new PDF(file).convert()
      .then((conversion) => {
        doc.fullText = conversion.fullText;
        return entities.save(doc)
        .then(() => {
          console.log(doc.title + ' Migrated !');
        });
      });
    });
    //return migrateDoc(doc).catch(console.log);
  }, {concurrency: 1});
})
.then(() => {
  mongoose.disconnect();
})
.catch((e) => {
  console.log(e);
  mongoose.disconnect();
});
