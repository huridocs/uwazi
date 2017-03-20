import P from 'bluebird';

import entities from '../entities/entitiesModel';
import mongoose from 'mongoose';

entities.get({published: false})
.then((unpublished) => {
  return P.resolve(unpublished).map((doc) => {
    return entities.get({sharedId: doc.sharedId, published: true})
    .then((docs) => {
      let referenceDoc = docs[0];
      if (referenceDoc) {
        console.log('FOUND');
        console.log(doc.title);
        doc.published = true;
        doc.template = referenceDoc.template;
        return entities.save(doc);
      }
    });
    //return migrateDoc(doc).catch(console.log);
  }, {concurrency: 1})
})
.then(() => {
  const end = Date.now();
  mongoose.disconnect();
});
