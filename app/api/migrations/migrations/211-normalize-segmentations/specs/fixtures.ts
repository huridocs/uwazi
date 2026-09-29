import { ObjectId } from 'mongodb';
import { Fixture, SegmentationDoc } from '../types.js';

const ids = {
  claim: new ObjectId(),
  keyed: new ObjectId(),
  dispatchFailure: new ObjectId(),
  serviceFailure: new ObjectId(),
  ready: new ObjectId(),
  noFile: new ObjectId(),
  noFilename: new ObjectId(),
};

const files = {
  claim: new ObjectId(),
  keyed: new ObjectId(),
  dispatchFailure: new ObjectId(),
  serviceFailure: new ObjectId(),
  ready: new ObjectId(),
  withReadyDuplicate: new ObjectId(),
  withoutReadyDuplicate: new ObjectId(),
};

/** Ids in creation order: a later ObjectId is a more recent document. */
const duplicates = {
  failedBeforeReady: new ObjectId(),
  ready: new ObjectId(),
  processingAfterReady: new ObjectId(),
  olderFailed: new ObjectId(),
  newerClaim: new ObjectId(),
};

const layout = { page_width: 1, page_height: 1, paragraphs: [] };
const anHourAgo = new Date(Date.now() - 60 * 60 * 1000);

const segmentations: SegmentationDoc[] = [
  {
    _id: ids.claim,
    fileID: files.claim,
    filename: 'claim.pdf',
    status: 'processing',
    autoexpire: anHourAgo,
  },
  {
    _id: ids.keyed,
    fileID: files.keyed,
    filename: 'keyed.pdf',
    status: 'processing',
    attempt: 2,
    requestedAt: 1000,
  },
  {
    _id: ids.dispatchFailure,
    fileID: files.dispatchFailure,
    filename: 'dispatch.pdf',
    status: 'failed',
    autoexpire: anHourAgo,
  },
  {
    _id: ids.serviceFailure,
    fileID: files.serviceFailure,
    filename: 'service.pdf',
    status: 'failed',
    autoexpire: null,
  },
  {
    _id: ids.ready,
    fileID: files.ready,
    filename: 'ready.pdf',
    status: 'ready',
    xmlname: 'ready.xml',
    autoexpire: null,
    segmentation: layout,
  },
  { _id: ids.noFile, filename: 'orphan.pdf', status: 'ready', autoexpire: null },
  { _id: ids.noFilename, fileID: new ObjectId(), status: 'processing', autoexpire: anHourAgo },
  {
    _id: duplicates.failedBeforeReady,
    fileID: files.withReadyDuplicate,
    filename: 'dup.pdf',
    status: 'failed',
    autoexpire: null,
  },
  {
    _id: duplicates.ready,
    fileID: files.withReadyDuplicate,
    filename: 'dup.pdf',
    status: 'ready',
    xmlname: 'dup.xml',
    autoexpire: null,
    segmentation: layout,
  },
  {
    _id: duplicates.processingAfterReady,
    fileID: files.withReadyDuplicate,
    filename: 'dup.pdf',
    status: 'processing',
    autoexpire: anHourAgo,
  },
  {
    _id: duplicates.olderFailed,
    fileID: files.withoutReadyDuplicate,
    filename: 'dup2.pdf',
    status: 'failed',
    autoexpire: null,
  },
  {
    _id: duplicates.newerClaim,
    fileID: files.withoutReadyDuplicate,
    filename: 'dup2.pdf',
    status: 'processing',
    autoexpire: anHourAgo,
  },
];

const fixtures: Fixture = { segmentations };

export { fixtures, ids, files, duplicates };
