// import db from 'api/utils/testing_db';

export default {
  entities: [
    {
      title: 'test_doc',
      metadata: {
        select: '',
        another_value: [{ value: 'value' }],
      },
    },
    {
      title: 'test_doc2',
      metadata: {
        select2: '',
        correct_value: [{ value: 'correct_value' }],
      },
    },
    {
      title: 'test_doc3',
    },
  ],
};
