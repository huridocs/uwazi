export const fixtures = {
  settings: [
    {
      sync: [
        {
          url: 'http://localhost:6667',
          name: 'target1',
          active: true,
          username: 'user',
          password: 'password',
          config: {
            templates: {
              template1: {
                properties: ['holi'],
              },
            },
          },
        },
        {
          url: 'http://localhost:6668',
          name: 'target2',
          active: true,
          username: 'user2',
          password: 'password2',
          config: {
            templates: {
              template1: { properties: [] },
              template2: { properties: [] },
            },
          },
        },
      ],
    },
  ],
};
