import fetch from 'isomorphic-fetch';
import {db_url as dbURL} from '../config/database.js';
import fs from 'fs';

function insert(docs) {
  return fetch(`${dbURL}/_bulk_docs`, {
    method: 'POST',
    headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
    credentials: 'same-origin',
    body: docs
  });
}

let database = {
  reset_testing_database () {
    return fetch(`${dbURL}/_all_docs`, {method: 'GET'})
    .then((res) => {
      return res.json();
    })
    .then((docs) => {
      return Promise.all(docs.rows.map((doc) => {
        const isDesignDocument = doc.id.indexOf('_design') > -1;
        if (isDesignDocument) {
          return Promise.resolve();
        }

        return fetch(`${dbURL}/${doc.id}?rev=${doc.value.rev}`, {method: 'DELETE'})
        .then((res) => res.json());
      }));
    });
  },

  setViews() {
    return new Promise((resolve, reject) => {
      fs.readFile(__dirname + '/../../../couchdb/views.js', 'utf-8', (err, content) => {
        if (err) {
          reject(err);
        }
        resolve(insert(content));
      });
    });
  },

  import(fixture) {
    return insert(JSON.stringify(fixture))
    .then((response) => response.json())
    .then((response) => {
      if (response[0] && response[0].error) {
        throw JSON.stringify(response);
      }
    });
  }
};

export default database;
