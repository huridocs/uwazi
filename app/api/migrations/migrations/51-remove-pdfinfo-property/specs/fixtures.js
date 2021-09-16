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
  files: [
    {
      filename: 'file.doc',
      entity: 'entity1',
      type: 'attachment',
      originalname: 'file1.doc',
      pdfInfo: {
        1: { chars: 5 },
        2: { chars: 10 },
        3: { chars: 15 },
      },
    },
    {
      filename: 'attachment.txt',
      originalname: 'attachment1.txt',
      entity: 'entity2',
      type: 'attachment',
    },
    {
      entity: 'entity3',
      originalname: 'o1',
      filename: 'other.doc',
      pdfInfo: {
        1: { chars: 20 },
        2: { chars: 40 },
      },
    },
  ],
};
