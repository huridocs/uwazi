import db from 'api/utils/testing_db';

export default {
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          type: 'Dictionary',
          label: 'Testing Dictionary',
          id: 'someid',
          values: [
            {
              _id: db.id(),
              key: 'Test',
              value: 'test',
            },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          type: 'Dictionary',
          label: 'Testing Dictionary 2',
          id: 'someid 2',
          values: [
            {
              _id: db.id(),
              key: 'Test 2',
              value: 'test 2',
            },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          type: 'System',
          label: 'System',
          id: 'someid',
          values: [
            {
              _id: db.id(),
              key: 'Test system',
              value: 'test system',
            },
          ],
        },
      ],
    },
    {
      _id: db.id(),
      locale: 'en',
      contexts: [
        {
          _id: db.id(),
          type: 'Uwazi',
          label: 'Uwazi UI',
          id: 'Uwazi',
          values: [
            {
              _id: db.id(),
              key: 'Test uwazi',
              value: 'test uwazi',
            },
          ],
        },
      ],
    },
  ],
};
