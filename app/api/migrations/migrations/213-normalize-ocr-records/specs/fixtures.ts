import { ObjectId } from 'mongodb';
import { Fixture } from '../types.js';

const id = () => new ObjectId();

const files = {
  inQueue: id(),
  processing: id(),
  withOCR: id(),
  cannotProcess: id(),
  orphanedReady: id(),
  duplicate: id(),
  duplicateNoReady: id(),
  noLanguage: id(),
  keyed: id(),
  result: id(),
  detachedResult: id(),
};

const ids = {
  inQueue: id(),
  processing: id(),
  withOCR: id(),
  cannotProcess: id(),
  missingSource: id(),
  readyMissingSource: id(),
  detached: id(),
  unusable: id(),
  unknownStatus: id(),
  noLanguage: id(),
  keyed: id(),
  duplicateOld: id(),
  duplicateReady: id(),
  duplicateNewest: id(),
  unfinishedOld: id(),
  unfinishedNew: id(),
};

const ghostFile = id();

const fixtures: Fixture = {
  files: [
    { _id: files.inQueue, filename: 'in-queue.pdf', language: 'eng' },
    { _id: files.processing, filename: 'processing.pdf', language: 'eng' },
    { _id: files.withOCR, filename: 'with-ocr.pdf', language: 'eng' },
    { _id: files.cannotProcess, filename: 'cannot-process.pdf', language: 'eng' },
    { _id: files.duplicate, filename: 'duplicate.pdf', language: 'eng' },
    { _id: files.duplicateNoReady, filename: 'duplicate-no-ready.pdf', language: 'eng' },
    { _id: files.noLanguage, filename: 'no-language.pdf' },
    { _id: files.keyed, filename: 'keyed.pdf', language: 'eng' },
    { _id: files.result, filename: 'ocr_with-ocr.pdf', language: 'eng' },
    { _id: files.detachedResult, filename: 'ocr_detached.pdf', language: 'eng' },
  ],
  ocr_records: [
    {
      _id: ids.inQueue,
      sourceFile: files.inQueue,
      language: 'eng',
      status: 'inQueue',
      lastUpdated: 1000,
      sessionId: 'session1',
    },
    {
      _id: ids.processing,
      sourceFile: files.processing,
      language: 'eng',
      status: 'processing',
      lastUpdated: 2000,
    },
    {
      _id: ids.withOCR,
      sourceFile: files.withOCR,
      resultFile: files.result,
      language: 'eng',
      status: 'withOCR',
      lastUpdated: 3000,
      sessionId: 'session2',
    },
    {
      _id: ids.cannotProcess,
      sourceFile: files.cannotProcess,
      language: 'eng',
      status: 'cannotProcess',
      lastUpdated: 4000,
    },
    {
      _id: ids.missingSource,
      sourceFile: ghostFile,
      language: 'eng',
      status: 'inQueue',
      lastUpdated: 5000,
    },
    {
      _id: ids.readyMissingSource,
      sourceFile: ghostFile,
      resultFile: files.detachedResult,
      language: 'eng',
      status: 'withOCR',
      lastUpdated: 5000,
    },
    {
      _id: ids.detached,
      sourceFile: null,
      resultFile: files.detachedResult,
      language: 'eng',
      status: 'withOCR',
      lastUpdated: 6000,
    },
    { _id: ids.unusable, sourceFile: null, language: 'eng', status: 'inQueue', lastUpdated: 7000 },
    {
      _id: ids.unknownStatus,
      sourceFile: files.orphanedReady,
      language: 'eng',
      status: 'noOCR',
      lastUpdated: 7000,
    },
    {
      _id: ids.noLanguage,
      sourceFile: files.noLanguage,
      status: 'inQueue',
      lastUpdated: 8000,
    },
    {
      _id: ids.keyed,
      sourceFile: files.keyed,
      filename: 'keyed.pdf',
      language: 'eng',
      status: 'processing',
      attempt: 2,
      requestedAt: 9000,
      lastUpdated: 9500,
    },
    {
      _id: ids.duplicateOld,
      sourceFile: files.duplicate,
      language: 'eng',
      status: 'cannotProcess',
      lastUpdated: 1000,
    },
    {
      _id: ids.duplicateReady,
      sourceFile: files.duplicate,
      resultFile: files.result,
      language: 'eng',
      status: 'withOCR',
      lastUpdated: 2000,
    },
    {
      _id: ids.duplicateNewest,
      sourceFile: files.duplicate,
      language: 'eng',
      status: 'inQueue',
      lastUpdated: 3000,
    },
    {
      _id: ids.unfinishedOld,
      sourceFile: files.duplicateNoReady,
      language: 'eng',
      status: 'cannotProcess',
      lastUpdated: 1000,
    },
    {
      _id: ids.unfinishedNew,
      sourceFile: files.duplicateNoReady,
      language: 'eng',
      status: 'inQueue',
      lastUpdated: 2000,
    },
  ],
};

export { fixtures, files, ids };
