import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import P from 'bluebird';
import ID from '../../app/shared/uniqueID';

let limit = 50;
let language = {key: 'en', label: 'English', default: true};

let documentsDone = 0;

function migrate(offset = 0) {
  Promise.all([request.get(dbURL + '/_all_docs?limit=' + limit + '&skip=' + offset)])
  .then(([docsResponse]) => {
    if (offset >= docsResponse.json.total_rows) {
      return;
    }
    P.resolve(docsResponse.json.rows).map((_doc) => {
      return request.get(dbURL + '/' + _doc.id)
      .then((response) => {
        let doc = response.json;
        documentsDone += 1;
        console.log (`${documentsDone} of ${docsResponse.json.total_rows}`);
        if (doc.type === 'page' || doc.type === 'document' || doc.type === 'entity') {
          doc.language = language.key;
          doc.sharedId = ID();
          // return request.post(dbURL + '/' + _doc.id, doc);
        }

        if (doc.type === 'settings') {
          doc.languages = [language];
          // return request.post(dbURL + '/' + _doc.id, doc);
        }
      });
    }, {concurrency: 1})
    .then(() => {
      migrate(docsResponse.json.offset + limit);
    });
  })
  .catch((error) => {
    console.log(error);
  });
}

migrate();

let translation = {
  locale: 'es',
  type: 'translation',
  contexts: [
    {
      id: 'System',
      label: 'System',
      values: {
        Search: 'Search',
        of: 'of',
        Library: 'Library',
        Uploads: 'Uploads',
        Settings: 'Settings',
        documents: 'documents',
        Account: 'Account',
        Documents: 'Documents',
        Connections: 'Connections',
        Dictionaries: 'Dictionaries',
        Entities: 'Entities',
        Collection: 'Collection',
        Menu: 'Menu',
        Pages: 'Pages',
        Translations: 'Translations',
        Metadata: 'Metadata',
        Translate: 'Translate',
        Edit: 'Edit',
        Delete: 'Delete',
        'Add document': 'Add document',
        Update: 'Update',
        'Collection settings': 'Collection settings',
        'Sort by': 'Sort by',
        Email: 'Email',
        'Confirm new password': 'Confirm new password',
        Logout: 'Logout',
        Recent: 'Recent',
        'Change password': 'Change password',
        Password: 'Password',
        'Login failed': 'Login failed',
        'Login button': 'Login',
        User: 'User',
        'Add connection': 'Add connection',
        'Add dictionary': 'Add dictionary',
        'Add entity': 'Add entity'
      }
    },
    {
      id: 'Menu',
      label: 'Menu',
      values: {}
    }
  ]
};

request.post(dbURL, translation);
