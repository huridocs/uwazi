import db from 'api/utils/testing_db';

export default {
  entities: [
    {
      _id: db.id(),
      sharedId: 'sharedId',
      title: 'test_doc1',
      fullText: { 1: 'page1 spanish' },
      toc: [{ label: 'toc item spanish' }],
      language: 'es',
      processed: false,
      totalPages: 55,
      file: { language: 'spa', filename: 'filename_spanish' },
      pdfInfo: { 1: 15 },
    },
    {
      _id: db.id(),
      sharedId: 'sharedId',
      title: 'test_doc2',
      fullText: { 1: 'page1 english' },
      toc: [{ label: 'toc item english' }],
      processed: true,
      totalPages: 45,
      language: 'en',
      file: { language: 'en', filename: 'filename_english' },
      pdfInfo: { 1: 10 },
    },
    {
      _id: db.id(),
      sharedId: 'sharedId2',
      language: 'es',
      file: { language: 'en', filename: 'sharedId2.pdf' },
    },
    {
      _id: db.id(),
      sharedId: 'sharedId2',
      language: 'en',
      file: { language: 'en', filename: 'sharedId2.pdf' },
    },
    {
      _id: db.id(),
      sharedId: 'withoutFile',
      language: 'en',
    },
  ],
};
