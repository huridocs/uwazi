import db from 'api/utils/testing_db';

export default {
  entities: [
    { title: 'test_doc', language: 'es', fullText: 'some full text', file: {} },
    { title: 'test_doc', language: 'pt', file: {} },
  ],
  settings: [{ _id: db.id(), languages: [{ key: 'es', default: true }, { key: 'pt' }] }],
};
