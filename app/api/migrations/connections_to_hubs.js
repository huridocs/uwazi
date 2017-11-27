/* eslint-disable no-console */

import P from 'bluebird';
import entities from '../entities/entitiesModel';
import references from '../references/references';
import referencesModel from '../references/connectionsModel';
import mongoose from 'mongoose';

referencesModel.delete({sourceType: 'metadata'})
.then(() => {
  return entities.get({}, {_id: 1})
  .then(documents => {
    return P.resolve(documents).map(({_id}) => {
      return entities.get({_id})
      .then(([doc]) => {
        return references.saveEntityBasedReferences(doc, doc.language)
        .then(() => {
          console.log(doc.title);
        });
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
