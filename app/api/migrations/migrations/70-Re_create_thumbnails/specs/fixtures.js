import { getIdMapper } from 'api/utils/fixturesFactory';

const id = getIdMapper();

export const fixtures = {
  files: [
    { _id: id('custom1.jpg'), type: 'custom', filename: 'custom1.jpg' },
    {
      _id: id('attachment1.pdf'),
      type: 'attachment',
      entity: 'test_doc1',
      filename: 'attachment1.pdf',
      language: 'es',
    },
    {
      _id: id('document1.pdf'),
      type: 'document',
      entity: 'test_doc1',
      filename: 'document1.pdf',
      language: 'es',
    },
    {
      _id: id('attachment2.pdf'),
      type: 'attachment',
      entity: 'test_doc2',
      filename: 'attachment2.pdf',
      language: 'es',
    },
    {
      _id: id('document2.pdf'),
      type: 'document',
      entity: 'test_doc2',
      filename: 'document2.pdf',
      language: 'es',
    },
    {
      _id: id('document3.pdf'),
      type: 'document',
      entity: 'test_doc3',
      filename: 'document3.pdf',
      language: 'es',
    },
    {
      _id: id('thumbnail3.jpg'),
      type: 'thumbnail',
      entity: 'test_doc3',
      filename: `${id('document3.pdf').toString()}.jpg`,
      language: 'es',
    },
    {
      _id: id('document_does_not_exists.pdf'),
      type: 'document',
      entity: 'test_doc3',
      filename: 'document_does_not_exists.pdf',
      language: 'es',
    },
  ],
};
