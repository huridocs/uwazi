export default {
  settings: [
    {
      languages: [{ key: 'en', default: true }, { key: 'es' }, { key: 'pt' }],
    },
  ],
  connections: [
    { entity: 'entity1', language: 'es', sharedId: 'shared' },
    { entity: 'entity1', language: 'en', sharedId: 'shared' },
    { entity: 'entity1', language: 'pt', sharedId: 'shared' },

    { entity: 'entity2', language: 'es', sharedId: 'shared2' },
    { entity: 'entity2', language: 'en', sharedId: 'shared2' },
    { entity: 'entity2', language: 'pt', sharedId: 'shared2' },

    { entity: 'entity3', language: 'es', sharedId: 'shared3', range: {} },
    { entity: 'entity3', language: 'en', sharedId: 'shared4', range: {} },
    { entity: 'entity3', language: 'pt', sharedId: 'shared5', range: {} },

    { entity: 'entity4', sharedId: 'sameFileDiferentLanguages', language: 'es', range: {} },
    { entity: 'entity4', sharedId: 'sameFileDiferentLanguages', language: 'en', range: {} },
    { entity: 'entity4', sharedId: 'sameFileDiferentLanguages', language: 'pt', range: {} },

    { entity: 'entity5', sharedId: 'sameFileOn2Languages', language: 'es', range: {} },
    { entity: 'entity5', sharedId: 'sameFileOn2Languages', language: 'en', range: {} },
    { entity: 'entity5', sharedId: 'anotherFile', language: 'pt', range: { text: 'text_a' } },

    {
      entity: 'entity5',
      sharedId: 'anotherTextConnection',
      language: 'pt',
      range: { text: 'text_b' },
    },
  ],
  entities: [
    { sharedId: 'entity3', language: 'es', file: { filename: 'esFile' } },
    { sharedId: 'entity3', language: 'en', file: { filename: 'enFile' } },
    { sharedId: 'entity3', language: 'pt', file: { filename: 'ptFile' } },

    { sharedId: 'entity4', language: 'es', file: { filename: 'sameFile' } },
    { sharedId: 'entity4', language: 'en', file: { filename: 'sameFile' } },
    { sharedId: 'entity4', language: 'pt', file: { filename: 'sameFile' } },

    { sharedId: 'entity5', language: 'es', file: { filename: 'sameFileOn2' } },
    { sharedId: 'entity5', language: 'en', file: { filename: 'sameFileOn2' } },
    { sharedId: 'entity5', language: 'pt', file: { filename: 'anotherFile' } },
  ],
};
