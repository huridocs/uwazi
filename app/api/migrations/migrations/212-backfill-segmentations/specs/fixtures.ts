import { ObjectId } from 'mongodb';
import { FileDoc, Fixture } from '../types.js';

const files: Record<string, FileDoc> = {
  unsegmented: {
    _id: new ObjectId(),
    filename: 'new.pdf',
    type: 'document',
    mimetype: 'application/pdf',
  },
  segmented: {
    _id: new ObjectId(),
    filename: 'done.pdf',
    type: 'document',
    mimetype: 'application/pdf',
  },
  attachment: {
    _id: new ObjectId(),
    filename: 'a.pdf',
    type: 'attachment',
    mimetype: 'application/pdf',
  },
  notPdf: { _id: new ObjectId(), filename: 'doc.html', type: 'document', mimetype: 'text/html' },
  noFilename: { _id: new ObjectId(), type: 'document', mimetype: 'application/pdf' },
};

const existing = {
  _id: new ObjectId(),
  fileID: files.segmented._id,
  filename: 'done.pdf',
  status: 'ready',
  attempt: 0,
};

const fixtures: Fixture = {
  files: Object.values(files),
  segmentations: [existing],
};

export { fixtures, files, existing };
