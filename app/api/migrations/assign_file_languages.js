import P from 'bluebird';
import entities from '../entities/entitiesModel';
import mongoose from 'mongoose';

import languages from '../../shared/languages';

entities.get({type: 'document'}, {_id: 1})
.then(documents => {
  return P.resolve(documents).map(({_id}) => {
    return entities.get({_id})
    .then(([doc]) => {
      if (!doc.file || !doc.fullText) {
        return;
      }

      doc.file.fullText = doc.file.fullText || doc.fullText;
      doc.file.language = languages.detect(doc.file.fullText, 'franc');
      delete doc.fullText;

      return entities.save(doc)
      .then(() => {
        console.log(doc.title + ' Migrated !');
      });
    });
  }, {concurrency: 1});
})
.then(() => {
  entities.db.collection.update({},
    {$unset: {fullText: true}},
    {multi: true, safe: true},
    (err) => {
      if (err) {
        throw err;
      }
      console.log('FullText deleted from collection\'s root!');
      mongoose.disconnect();
    }
  );
})
.catch((e) => {
  console.log(e);
  mongoose.disconnect();
});
