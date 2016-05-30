import fetch from 'isomorphic-fetch';
import {db_url as dbURL} from '../config/database.js';
import fs from 'fs';

function getViews() {
  return new Promise((resolve, reject) => {
    fs.readFile(__dirname + '/../../../couchdb/views.js', 'utf-8', (err, content) => {
      if (err) {
        reject(err);
      }
      resolve(content);
    });
  });
}

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
    return fetch(dbURL, {method: 'DELETE'})
    .then(() => fetch(dbURL, {method: 'PUT'}));
  },

  import(fixture) {
    return getViews()
    .then((views) => insert(views))
    .then(() => insert(JSON.stringify(fixture)))
    .then((response) => response.json())
    .then((response) => {
      if (response[0] && response[0].error) {
        throw JSON.stringify(response);
      }
    });
  }
};

export default database;
