/* eslint-disable no-console */

import P from 'bluebird';
import entities from '../entities/entitiesModel';
import relationships from '../relationships/relationships';
import relationshipsModel from '../relationships/relationshipsModel';
import mongoose from 'mongoose';

relationshipsModel.delete({sourceType: 'metadata'})
.then(() => {
  return entities.get({}, {_id: 1})
  .then(documents => {
    return P.resolve(documents).map(({_id}) => {
      return entities.get({_id})
      .then(([doc]) => {
        return relationships.saveEntityBasedReferences(doc, doc.language);
      });
    }, {concurrency: 1});
  });
})
.then(() => {
  mongoose.disconnect();
})
.catch((e) => {
  console.log(e);
  mongoose.disconnect();
});
