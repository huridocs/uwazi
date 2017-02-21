import request from '../app/shared/JSONRequest';
import P from 'bluebird';

const COUCHDBURL = process.env.COUCHDB_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;
const dbUrl = COUCHDBURL ? `${COUCHDBURL}/${DATABASE_NAME}` : 'http://127.0.0.1:5984/uwazi_development/';

export default function (view, callback) {
  const limit = 50;
  const start = Date.now();
  let end;

  let pos = 0;
  let docsIndexed = 0;
  let spinner = ['|', '/', '-', '\\'];

  return new Promise((resolve, reject) => {
    function migrate(offset) {
      return request.get(dbUrl + view + '?limit=' + limit + '&skip=' + offset)
        .then(function (docsResponse) {
          if (offset >= docsResponse.json.total_rows) {
            end = Date.now();
            return;
          }

          return P.resolve(docsResponse.json.rows).map(function (doc) {
            process.stdout.write(`Indexing... ${spinner[pos]} - ${docsIndexed} indexed\r`);
            return callback(doc.value).then(() => {
              docsIndexed += 1;
            });
          }, {concurrency: 1})
            .then(function () {
              pos += 1;
              if (pos > 3) {
                pos = 0;
              }
              return migrate(docsResponse.json.offset + limit);
            });
        });
    }

    migrate(0)
      .catch(function (error) {
        reject(error);
        console.log('Migration error: ', error);
      })
      .then(() => {
        process.stdout.write(`Indexing... - ${docsIndexed} indexed\r\n`);
        process.stdout.write(`Done, took ${(end - start) / 1000} seconds\n`);
        resolve();
      });
  });
}
