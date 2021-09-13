export default {
  entities: [
    {
      title: 'entity1',
      metadata: { text: [{ value: 'test' }] },
      pdfInfo: {
        1: { chars: 10 },
        2: { chars: 20 },
      },
    },
    {
      title: 'entity2',
    },
    {
      title: 'entity3',
      published: true,
      pdfInfo: {
        1: { chars: 10 },
        2: { chars: 20 },
        3: { chars: 30 },
      },
    },
  ],
};
