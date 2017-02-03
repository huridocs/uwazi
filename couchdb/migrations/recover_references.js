import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import P from 'bluebird';

let limit = 50;

let documentsDone = 0;

function migrate(offset = 0) {
  return request.get(dbURL + '/_design/references/_view/all?limit=' + limit + '&skip=' + offset)
  .then((docsResponse) => {
    if (offset >= docsResponse.json.total_rows) {
      return;
    }
    return P.resolve(docsResponse.json.rows).map((result) => {
      let reference = result.value;
      return request.get(dbURL + '/' + reference._id + '?revs_info=true')
      .then((response) => {
        return request.get(dbURL + '/' + reference._id + '?rev=' + response.json._revs_info[response.json._revs_info.length -1].rev);
      })
      .then((response) => {
        let firstVersion = response.json;
        let getTargetDocument = Promise.resolve({json: {}});
        let getSourceDocument = Promise.resolve({json: {}});

        if (firstVersion.targetDocument) {
          getTargetDocument =request.get(dbURL + '/' + firstVersion.targetDocument);
        }

        if (firstVersion.sourceDocument) {
          getSourceDocument =request.get(dbURL + '/' + firstVersion.sourceDocument);
        }
        return Promise.all([getTargetDocument, getSourceDocument])
        .then(([targetDocument, sourceDocument]) => {
          reference.targetDocument = targetDocument.json.sharedId;
          reference.sourceDocument = sourceDocument.json.sharedId;
          return request.post(dbURL + '/_design/entities/_update/partialUpdate/' + reference._id, reference)
          .then(() => {
            documentsDone += 1;
            console.log (`${documentsDone} of ${docsResponse.json.total_rows}`);
          });
        });
      });
    }, {concurrency: 1})
    .then(() => {
      return migrate(docsResponse.json.offset + limit);
    });
  })
  .catch((error) => {
    console.log('migrate', error);
  });
}

migrate();
