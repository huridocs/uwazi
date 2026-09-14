import { ObjectId } from 'mongodb';
import { Fixture } from '../types.js';

const extractorOne = new ObjectId();
const extractorTwo = new ObjectId();

// Ascending _id order matters: the migration keeps the newest of each duplicated group.
const supersededModel = new ObjectId('000000000000000000000001');
const survivingModel = new ObjectId('000000000000000000000002');
const singleModel = new ObjectId('000000000000000000000003');
const orphanModelA = new ObjectId('000000000000000000000004');
const orphanModelB = new ObjectId('000000000000000000000005');

const fixtures: Fixture = {
  ixmodels: [
    // Two rows for one extractor — what a raced `markTraining` upsert leaves behind.
    { _id: supersededModel, extractorId: extractorOne, status: 'ready', findingSuggestions: false },
    {
      _id: survivingModel,
      extractorId: extractorOne,
      status: 'processing',
      findingSuggestions: true,
    },
    { _id: singleModel, extractorId: extractorTwo, status: 'ready', findingSuggestions: false },
    // Rows with no extractorId at all would also collide on a unique index.
    { _id: orphanModelA },
    { _id: orphanModelB },
  ],
};

export { fixtures, extractorOne, extractorTwo, supersededModel, survivingModel, singleModel };
