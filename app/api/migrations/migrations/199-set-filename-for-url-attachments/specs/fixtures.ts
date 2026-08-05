import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';

const url1 = 'https://example.com/doc1.pdf';
const url2 = 'https://example.com/doc2.pdf';
const url3 = 'https://example.com/doc3.pdf';
const url4 = 'https://example.com/doc4.pdf';
const url5 = 'https://example.com/doc5.pdf';

export const fixtures: DBFixture = {
  files: [
    // 1. Missing filename — should get url as filename
    {
      _id: new ObjectId(),
      type: 'attachment',
      url: url1,
      originalname: 'existing-original.pdf',
    },
    // 2. Missing originalname — should get url as originalname
    {
      _id: new ObjectId(),
      type: 'attachment',
      url: url2,
      filename: 'existing-file.pdf',
    },
    // 3. Both missing — should get url for both
    {
      _id: new ObjectId(),
      type: 'attachment',
      url: url3,
    },
    // 4. Empty string filename and originalname — should get url for both
    {
      _id: new ObjectId(),
      type: 'attachment',
      url: url4,
      filename: '',
      originalname: '',
    },
    // 5. Complete URL attachment — should NOT be touched
    {
      _id: new ObjectId(),
      type: 'attachment',
      url: url5,
      filename: 'already-has-filename.pdf',
      originalname: 'already-has-original.pdf',
    },
    // 6. Non-URL attachment (document) — should NOT be touched
    {
      _id: new ObjectId(),
      type: 'document',
      url: 'https://example.com/should-not-matter.pdf',
      filename: 'doc.pdf',
      originalname: 'doc-original.pdf',
    },
    // 7. URL attachment without url field — should NOT be touched
    {
      _id: new ObjectId(),
      type: 'attachment',
      filename: 'no-url.pdf',
      originalname: 'no-url-original.pdf',
    },
  ],
};
