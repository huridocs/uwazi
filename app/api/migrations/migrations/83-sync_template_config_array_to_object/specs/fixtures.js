export const fixtures = {
  settings: [
    {
      languages: [{ key: 'es', default: true, label: 'es' }],
      sync: [
        {
          url: 'url',
          name: 'target',
          active: true,
          username: 'user',
          password: 'password',
          config: {
            templates: {
              templateId1: { properties: ['prop'] },
            },
          },
        },
        {
          url: 'url',
          name: 'target',
          active: true,
          username: 'user',
          password: 'password',
          config: {
            templates: {
              templateId2: ['prop1', 'prop2'],
              templateId3: ['prop3', 'prop4'],
            },
          },
        },
        {
          url: 'url',
          name: 'target',
          active: true,
          username: 'user',
          password: 'password',
          config: {
            templates: {
              templateId4: ['prop5', 'prop6'],
              templateId5: ['prop7', 'prop8'],
              templateId6: { properties: ['prop42'] },
            },
          },
        },
      ],
    },
  ],
};
