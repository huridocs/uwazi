import mongoose from 'mongoose';
import { model as updateLogModel } from 'api/updatelog';
import odmModel from '../model.js';
import testingDB from '../../utils/testing_db';

const testSchema = new mongoose.Schema({
  name: String,
});

describe('ODM Model', () => {
  beforeEach(async () => {
    await testingDB.clearAllAndLoad({});
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('Logging functionality', () => {
    let extendedModel;
    let newDocument1;
    let newDocument1Timestamp;
    let newDocument2;
    let newDocument2Timestamp;

    beforeEach(async () => {
      extendedModel = odmModel('tempSchema', testSchema);
      newDocument1 = await extendedModel.save({ name: 'document 1' });
      newDocument1Timestamp = Date.now();
      newDocument2 = await extendedModel.save({ name: 'document 2' });
      newDocument2Timestamp = Date.now();
    });

    it('should extend create a log entry when saving', async () => {
      const [logEntry1] = await updateLogModel.find({ mongoId: newDocument1._id });
      const [logEntry2] = await updateLogModel.find({ mongoId: newDocument2._id });
      expect(logEntry1.timestamp / 100).toBeCloseTo(newDocument1Timestamp / 100, 0);
      expect(logEntry1.namespace).toBe('tempSchema');
      expect(logEntry2.timestamp / 100).toBeCloseTo(newDocument2Timestamp / 100, 0);
    });

    it('should update the log when updating (not creating a new entry)', async () => {
      await extendedModel.save({ ...newDocument1, name: 'edited name' });
      const logEntries = await updateLogModel.find({});
      expect(logEntries.length).toBe(2);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString()).timestamp / 20).toBeCloseTo(Date.now() / 20, 0);
    });

    it('should intercept other non-save actions', async () => {
      expect(false).toBe(true);
    });
  });
});
