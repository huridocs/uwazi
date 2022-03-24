export const fixtures = {
  entities: [{ sharedId: 'test_doc', title: 'test_doc' }],
  files: [
    { type: 'custom', filename: 'custom1.jpg' },
    { type: 'attachment', entity: 'test_doc', filename: 'attachment1.pdf' },
    { type: 'document', entity: 'test_doc', filename: 'document1.pdf' },
    { type: 'thumbnail', entity: 'test_doc', filename: 'thumbnail1.jpg' },
    { type: 'attachment', entity: 'nonexistent1', filename: 'attachment2.pdf' },
    { type: 'document', entity: 'nonexistent2', filename: 'document2.pdf' },
    { type: 'thumbnail', entity: 'nonexistent2', filename: 'thumbnail2.jpg' },
  ],
};
