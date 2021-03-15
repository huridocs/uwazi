import testingDB from 'api/utils/testing_db';

const connectionWithRangeId = testingDB.id();
const connectionWithoutRangeId = testingDB.id();
const documentId = testingDB.id();
const entityId = testingDB.id();

export default {
  settings: [
    {
      _id: 'id',
      languages: [
        {
          key: 'en',
        },
        {
          key: 'fr',
          default: true,
        },
      ],
    },
  ],
  files: [
    {
      _id: documentId,
      entity: entityId.toString(),
      language: 'fra',
    },
    {
      _id: 'otherDocumentId',
      entity: entityId.toString(),
      language: 'eng',
    },
    {
      _id: 'otherDocumentIdJapanese',
      entity: entityId.toString(),
      language: 'other',
    },
  ],
  connections: [
    {
      _id: connectionWithRangeId,
      range: {
        start: 104,
        end: 182,
        text: 'Uwazi is an open-source solution for building and sharing document collections',
      },
      entity: entityId.toString(),
    },
    {
      _id: connectionWithoutRangeId,
    },
  ],
};

export { documentId, connectionWithRangeId, connectionWithoutRangeId };
