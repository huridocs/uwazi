import mongoose from 'mongoose';
import { model as updateLogModel } from 'api/updatelog';
import odmModel from '../model.js';
import testingDB from '../../utils/testing_db';

const testSchema = new mongoose.Schema({
  name: String,
});

describe('ODM Model', () => {
  const originalDatenow = Date.now;

  beforeEach(async () => {
    await testingDB.clearAllAndLoad({});
  });

  afterAll(async () => {
    Date.now = originalDatenow;
    await testingDB.disconnect();
  });

  describe('Logging functionality', () => {
    let extendedModel;
    let newDocument1;
    let newDocument2;

    beforeEach(async () => {
      Date.now = () => 1;
      extendedModel = odmModel('tempSchema', testSchema);
      newDocument1 = await extendedModel.save({ name: 'document 1' });
      newDocument2 = await extendedModel.save({ name: 'document 2' });
    });

    it('should extend create a log entry when saving', async () => {
      const [logEntry1] = await updateLogModel.find({ mongoId: newDocument1._id });
      const [logEntry2] = await updateLogModel.find({ mongoId: newDocument2._id });
      expect(logEntry1.timestamp).toBe(1);
      expect(logEntry1.namespace).toBe('tempSchema');
      expect(logEntry2.timestamp).toBe(1);
    });

    it('should update the log when updating (not creating a new entry)', async () => {
      Date.now = () => 2;
      await extendedModel.save({ ...newDocument1, name: 'edited name' });
      const logEntries = await updateLogModel.find({});
      expect(logEntries.length).toBe(2);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString()).timestamp).toBe(2);
    });

    it('should intercept updateMany', async () => {
      const newDocument3 = await extendedModel.save({ name: 'document 3' });
      Date.now = () => 3;
      await extendedModel.db.updateMany({ _id: { $in: [newDocument1._id, newDocument2._id] } }, { $set: { name: 'same name' } });
      const logEntries = await updateLogModel.find({});
      expect(logEntries.length).toBe(3);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString()).timestamp).toBe(3);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument2._id.toString()).timestamp).toBe(3);
      expect(logEntries.find(e => e.mongoId.toString() === newDocument3._id.toString()).timestamp).toBe(1);
    });

    it('should intercept model delete', async () => {
      Date.now = () => 4;
      await extendedModel.delete({ _id: newDocument2._id });
      const logEntries = await updateLogModel.find({});

      expect(logEntries.length).toBe(2);

      expect(logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString()).timestamp).toBe(1);

      const document2Log = logEntries.find(e => e.mongoId.toString() === newDocument2._id.toString());
      expect(document2Log.timestamp).toBe(4);
      expect(document2Log.deleted).toBe(true);
    });
  });
});
