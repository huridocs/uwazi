/** @format */

import mongoose from 'mongoose';
import { ensure } from 'shared/tsUtils';
import { model as updatelogsModel } from 'api/updatelogs';
import { UpdateLog } from 'api/updatelogs/updatelogsModel';
import testingDB from 'api/utils/testing_db';
import { instanceModel } from '../model';
import { OdmModel, models } from '../models';

const testSchema = new mongoose.Schema({
  name: String,
  value: String,
});
interface TestDoc {
  _id: any;
  name: String;
  value?: String;
}

describe('ODM Model', () => {
  const originalDatenow = Date.now;

  beforeEach(async () => {
    await testingDB.clearAllAndLoad({});
  });

  afterAll(async () => {
    Date.now = originalDatenow;
    await testingDB.disconnect();
  });

  it('should register all the models to the requirable models hashmap', () => {
    expect(models).toEqual({});
    const model1 = instanceModel<TestDoc>('tempSchema', testSchema);
    const model2 = instanceModel('anotherSchema', new mongoose.Schema({ name: String }));

    expect(models.tempSchema.db).toBe(model1.db);
    expect(models.anotherSchema.db).toBe(model2.db);
  });

  describe('Save', () => {
    it('should be able to create when passing an _id and it does not exists', async () => {
      const extendedModel = instanceModel<TestDoc>('tempSchema', testSchema);
      const id = testingDB.id();
      const savedDoc = await extendedModel.save({
        _id: id,
        name: 'document 1',
      });
      expect(savedDoc._id).toEqual(id);
      const [createdDocument] = await extendedModel.get({ _id: savedDoc._id });
      expect(createdDocument).toBeDefined();
      expect(createdDocument.name).toEqual('document 1');

      await extendedModel.save({ _id: id, value: 'abc' });
      const [updatedDoc] = await extendedModel.get({ _id: savedDoc._id });
      expect(updatedDoc).toBeDefined();
      expect(updatedDoc.name).toEqual('document 1');
      expect(updatedDoc.value).toEqual('abc');
    });
  });

  describe('Logging functionality', () => {
    let extendedModel: OdmModel<TestDoc>;
    let newDocument1: TestDoc;
    let newDocument2: TestDoc;

    beforeEach(async () => {
      Date.now = () => 1;
      extendedModel = instanceModel<TestDoc>('tempSchema', testSchema);
      newDocument1 = await extendedModel.save({ name: 'document 1' });
      newDocument2 = await extendedModel.save({ name: 'document 2' });
    });

    it('should extend create a log entry when saving', async () => {
      const [logEntry1] = await updatelogsModel.find({
        mongoId: newDocument1._id,
      });
      const [logEntry2] = await updatelogsModel.find({
        mongoId: newDocument2._id,
      });
      expect(logEntry1.timestamp).toBe(1);
      expect(logEntry1.namespace).toBe('tempSchema');
      expect(logEntry2.timestamp).toBe(1);
    });

    it('should update the log when updating (not creating a new entry)', async () => {
      Date.now = () => 2;
      const savedDocument = await extendedModel.save(({
        ...newDocument1,
        name: 'edited name',
      } as unknown) as TestDoc);
      const logEntries = await updatelogsModel.find({});
      expect(logEntries.length).toBe(2);
      expect(
        ensure<UpdateLog>(
          logEntries.find(e => e.mongoId.toString() === savedDocument._id.toString())
        ).timestamp
      ).toBe(2);
    });

    it('should intercept updateMany', async () => {
      const newDocument3 = await extendedModel.save({ name: 'document 3' });
      Date.now = () => 3;
      await extendedModel.db.updateMany(
        { _id: { $in: [newDocument1._id, newDocument2._id] } },
        { $set: { name: 'same name' } }
      );
      const logEntries = await updatelogsModel.find({});
      expect(logEntries.length).toBe(3);
      expect(
        ensure<UpdateLog>(
          logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString())
        ).timestamp
      ).toBe(3);
      expect(
        ensure<UpdateLog>(
          logEntries.find(e => e.mongoId.toString() === newDocument2._id.toString())
        ).timestamp
      ).toBe(3);
      expect(
        ensure<UpdateLog>(
          logEntries.find(e => e.mongoId.toString() === newDocument3._id.toString())
        ).timestamp
      ).toBe(1);
    });

    describe('delete', () => {
      beforeEach(() => {
        Date.now = () => 4;
      });

      it('should intercept model delete', async () => {
        await extendedModel.delete({ _id: newDocument2._id });
        const logEntries = await updatelogsModel.find({});

        expect(logEntries.length).toBe(2);

        expect(
          ensure<UpdateLog>(
            logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString())
          ).timestamp
        ).toBe(1);

        const document2Log = ensure<UpdateLog>(
          logEntries.find(e => e.mongoId.toString() === newDocument2._id.toString())
        );
        expect(document2Log.timestamp).toBe(4);
        expect(document2Log.deleted).toBe(true);
      });

      it('should not add undefined affected ids, it would cause deletion of entire collections', async () => {
        await extendedModel.delete({ hub: 'non existent' });

        const logEntries = await updatelogsModel.find({});
        const undefinedIdLog = logEntries.find(e => !e.mongoId);
        expect(undefinedIdLog).not.toBeDefined();
      });

      it('should intercept model delete with id as string', async () => {
        await extendedModel.delete(newDocument2._id.toString());
        const logEntries = await updatelogsModel.find({});

        expect(logEntries.length).toBe(2);

        expect(
          ensure<UpdateLog>(
            logEntries.find(e => e.mongoId.toString() === newDocument1._id.toString())
          ).timestamp
        ).toBe(1);

        const document2Log = ensure<UpdateLog>(
          logEntries.find(e => e.mongoId.toString() === newDocument2._id.toString())
        );
        expect(document2Log.timestamp).toBe(4);
        expect(document2Log.deleted).toBe(true);
      });
    });
  });
});
