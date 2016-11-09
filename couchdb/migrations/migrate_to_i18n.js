import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import P from 'bluebird';
import ID from '../../app/shared/uniqueID';

let limit = 50;
let language = {key: 'en', label: 'English', default: true};

let documentsDone = 0;

let documentsMigrated = {};

function migrateDoc(doc) {
  doc.language = language.key;
  doc.sharedId = ID();
  return request.post(dbURL + '/_design/entities/_update/partialUpdate/' + doc._id, doc)
  .then(() => documentsMigrated[doc._id] = doc.sharedId)
  .catch((error) => {
    console.log('migrateDoc', doc._id, error);
  });
}

function migrate(offset = 0) {
  return Promise.all([request.get(dbURL + '/_all_docs?limit=' + limit + '&skip=' + offset)])
  .then(([docsResponse]) => {
    if (offset >= docsResponse.json.total_rows) {
      return;
    }

    return P.resolve(docsResponse.json.rows).map((_doc) => {
      return request.get(dbURL + '/' + _doc.id)
      .then((response) => {
        let doc = response.json;
        documentsDone += 1;
        console.log (`${documentsDone} of ${docsResponse.json.total_rows}`);
        if ((doc.type === 'page' || doc.type === 'document' || doc.type === 'entity')) {
          return migrateDoc(doc);
        }

        if (doc.type === 'settings') {
          doc.languages = [language];
          return request.post(dbURL + '/_design/entities/_update/partialUpdate/' + _doc.id, doc)
          .catch((error) => {
            console.log('Saving settings', error);
          });
        }
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

function migrateDocMetadata(doc) {
  if (!doc.template) {
    return;
  }
  return request.get(dbURL + '/' + doc.template)
  .then((response) => {
    let template = response.json;
    template.properties.forEach((property) => {
      if (property.content) {
        let value = doc.metadata[property.name];
        if (documentsMigrated[value]) {
          doc.metadata[property.name] = documentsMigrated[value];
        }
      }
    });

    return request.post(dbURL + '/_design/entities/_update/partialUpdate/' + doc._id, doc)
    .catch((error) => {
      console.log('save migrateDocMetadata', doc._id, error);
    });
  })
  .catch((error) => {
    console.log('migrateDocMetadata', error);
  });
}

function migrateMetadata(offset = 0) {
  return Promise.all([request.get(dbURL + '/_all_docs?limit=' + limit + '&skip=' + offset), request.get(dbURL + '/_design/templates/_view/all')])
  .then(([docsResponse]) => {
    if (offset >= docsResponse.json.total_rows) {
      return;
    }

    return P.resolve(docsResponse.json.rows).map((_doc) => {
      return request.get(dbURL + '/' + _doc.id)
      .then((response) => {
        let doc = response.json;
        documentsDone += 1;
        console.log (`${documentsDone} of ${docsResponse.json.total_rows}`);
        if ((doc.type === 'document' || doc.type === 'entity')) {
          return migrateDocMetadata(doc);
        }

        if ((doc.type === 'reference')) {
            doc.sourceDocument = documentsMigrated[doc.sourceDocument];
            doc.targetDocument = documentsMigrated[doc.targetDocument];
            return request.post(dbURL + '/_design/entities/_update/partialUpdate/' + doc._id, doc)
            .catch((error) => {
              console.log(error);
            });
        }
      });
    }, {concurrency: 1})
    .then(() => {
      return migrateMetadata(docsResponse.json.offset + limit);
    });
  })
  .catch((error) => {
    console.log('migrateMetadata', error);
  });
}

migrate()
.then(() => {
  console.log('Migrating references and relations');
  documentsDone = 0;
  migrateMetadata();
});

let translation = {
  locale: language.key,
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

// request.post(dbURL, translation)
// .catch((error) => {
//   console.log(error);
// });
