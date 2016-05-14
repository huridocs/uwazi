import fetch from 'isomorphic-fetch';
import {db_url as dbURL} from '../config/database.js';

let database = {
  reset_testing_database () {
    return fetch(dbURL, {method: 'DELETE'})
    .then(() => fetch(dbURL, {method: 'PUT'}));
  },

  import(fixture) {
    return fetch(`${dbURL}/_bulk_docs`, {
      method: 'POST',
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      credentials: 'same-origin',
      body: JSON.stringify(fixture)
    })
    .then((response) => response.json())
    .then((response) => {
      if (response[0] && response[0].error) {
        throw JSON.stringify(response);
      }
    });
  }
};

export default database;
