export default {
  entities: [
    {
      title: 'doc1',
      type: 'document',
      fullText: 'this is the old fullText',
      file: { filename: 'test.pdf' },
    },
    {
      title: 'doc2',
      type: 'document',
      fullText: 'this is the old fullText',
      file: { filename: 'test.pdf' },
    },
    { title: 'doc3', type: 'document', file: {} },
    { title: 'doc4', type: 'document' },
    { title: 'doc5', type: 'entity' },
    { title: 'doc6', type: 'document', file: { filename: 'non_existent.pdf' } },
    {
      title: 'doc7',
      type: 'document',
      fullText: 'this is the old fullText',
      file: { filename: 'test.pdf' },
    },
  ],
};
