import db from 'api/utils/testing_db';

const systemContext = {
  label: 'System',
  type: 'Uwazi UI',
  id: 'System',
  values: [
    { key: 'Password', value: 'Password' },
    { key: 'Account', value: 'Account' },
    { key: 'Email', value: 'E-Mail' },
    { key: 'Age', value: 'Age' },
  ],
};

const dictContext = {
  label: 'a thesaurus',
  type: 'Thesaurus',
  id: db.id(),
  values: [
    { key: 'unique_key', value: 'unique_key' },
    { key: 'duplicate_key', value: 'duplicate_key' },
    { key: 'duplicate_key', value: 'duplicate_key' },
    { key: 'multiple_key_with_tr', value: 'multiple_key_with_tr' },
    { key: 'multiple_key_with_tr', value: 'pick this one' },
    { key: 'multiple_key_with_tr', value: 'this one will not be picked' },
    { key: 'multiple_key_with_tr', value: 'multiple_key_with_tr' },
  ],
};

export default {
  translations: [
    {
      locale: 'en',
      contexts: [systemContext, dictContext],
    },
    {
      locale: 'es',
      contexts: [systemContext, dictContext],
    },
    {
      locale: 'fr',
      contexts: [systemContext, dictContext],
    },
  ],
};
