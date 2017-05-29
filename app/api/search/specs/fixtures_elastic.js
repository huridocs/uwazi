/* eslint-disable max-len */
import db from 'api/utils/testing_db';

const userId = db.id();
const batmanBegins = 'shared2';
const batmanFinishes = 'shared';

export default {
  entities: [
    {_id: db.id(), sharedId: batmanFinishes, template: 'template1', language: 'en', title: 'Batman finishes en', fullText: 'english document', published: true, user: userId},
    {_id: db.id(), sharedId: batmanFinishes, template: 'template1', language: 'es', title: 'Batman finishes es', fullText: 'spanish document', published: true, user: userId},
    {_id: db.id(), sharedId: batmanBegins, template: 'template2', language: 'en', title: 'Batman begins en', published: true, user: userId},
    {_id: db.id(), sharedId: batmanBegins, template: 'template2', language: 'es', title: 'Batman begins es', published: true, user: userId},
    {_id: db.id(), sharedId: 'unpublished', template: 'template', language: 'es', title: 'unpublished', published: false, user: userId},
    {_id: db.id(), sharedId: 'shared3', template: 'template1', language: 'en', title: 'template1 title en', published: true, user: userId},
    {_id: db.id(), sharedId: 'shared3', template: 'template1', language: 'es', title: 'template1 title es', published: true, user: userId},
    //metadata filters
    {_id: db.id(), sharedId: 'metadata1', template: 'templateMetadata1', language: 'en', title: 'metadata1', published: true, user: userId,
      metadata: {field1: 'joker', field2: 'bane'}
    },
    {_id: db.id(), sharedId: 'metadata2', template: 'templateMetadata1', language: 'en', title: 'metadata1', published: true, user: userId,
      metadata: {field1: 'joker', field2: 'penguin'}
    },
    {_id: db.id(), sharedId: 'metadata3', template: 'templateMetadata2', language: 'en', title: 'metadata1', published: true, user: userId,
      metadata: {field1: 'bane', field3: 'penguin'}
    },
    {_id: db.id(), sharedId: 'metadata4', template: 'templateMetadata2', language: 'en', title: 'metadata1', published: true, user: userId,
      metadata: {field1: 'penguin', field3: 'joker'}
    }
    //
  ]};

export {
  batmanBegins,
  batmanFinishes
};
