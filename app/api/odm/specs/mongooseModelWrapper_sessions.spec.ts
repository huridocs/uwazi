/*eslint-disable max-statements*/

import { appContext } from 'api/utils/AppContext';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ClientSession } from 'mongodb';
import { Schema } from 'mongoose';
import { MongooseModelWrapper } from '../MongooseModelWrapper';

interface TestDoc {
  title: string;
  value?: number;
}

describe('MultiTenantMongooseModel Session operations', () => {
  let model: MongooseModelWrapper<TestDoc>;
  let session: ClientSession;

  beforeAll(async () => {
    const schema = new Schema({
      title: String,
      value: Number,
    });
    model = new MongooseModelWrapper<TestDoc>('sessiontest', schema);
  });

  beforeEach(async () => {
    await testingEnvironment.setUp({});
    testingEnvironment.unsetFakeContext();
    session = await model.startSession();
  });

  afterEach(async () => {
    await session.endSession();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
    await session.endSession();
  });

  describe('create()', () => {
    it('should use session when creating documents', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);

        const doc = await model.create([{ title: 'test1' }]);

        await session.abortTransaction();
        const notFound = await model.findById(doc[0]._id);
        expect(notFound).toBeNull();

        session.startTransaction();
        const saved = await model.create([{ title: 'test1' }]);
        await session.commitTransaction();
        const found = await model.findById(saved[0]._id);
        expect(found?.title).toBe('test1');
      });
    });
  });

  describe('findOneAndUpdate()', () => {
    it('should use session when updating documents', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        const doc = await model.create([{ title: 'test2' }]);
        await session.commitTransaction();

        session.startTransaction();
        await model.findOneAndUpdate(
          { _id: doc[0]._id },
          { $set: { title: 'test2-updated' } },
          { new: true }
        );

        await session.abortTransaction();
        const notUpdated = await model.findById(doc[0]._id);
        expect(notUpdated?.title).toBe('test2');

        session.startTransaction();
        await model.findOneAndUpdate(
          { _id: doc[0]._id },
          { $set: { title: 'test2-updated' } },
          { new: true }
        );
        await session.commitTransaction();
        const afterCommit = await model.findById(doc[0]._id);
        expect(afterCommit?.title).toBe('test2-updated');
      });
    });
  });

  describe('find() and countDocuments()', () => {
    it('should use session for queries', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        await model.create([
          { title: 'test3', value: 1 },
          { title: 'test4', value: 2 },
        ]);
        await session.commitTransaction();

        session.startTransaction();

        await model.create([{ title: 'test5', value: 3 }]);

        const docsInTransaction = await model.find({ value: { $gt: 0 } });
        expect(docsInTransaction).toHaveLength(3);
        const countInTransaction = await model.countDocuments({ value: { $gt: 0 } });
        expect(countInTransaction).toBe(3);

        await session.abortTransaction();

        const docsAfterAbort = await model.find({ value: { $gt: 0 } });
        expect(docsAfterAbort).toHaveLength(2);
        const countAfterAbort = await model.countDocuments({ value: { $gt: 0 } });
        expect(countAfterAbort).toBe(2);
      });
    });
  });

  describe('deleteMany()', () => {
    it('should use session for deletions', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        const doc = await model.create([{ title: 'to-delete' }]);
        await session.commitTransaction();

        session.startTransaction();
        await model.deleteMany({ _id: doc[0]._id });

        await session.abortTransaction();
        const stillExists = await model.findById(doc[0]._id);
        expect(stillExists).not.toBeNull();

        session.startTransaction();
        await model.deleteMany({ _id: doc[0]._id });
        await session.commitTransaction();
        const deleted = await model.findById(doc[0]._id);
        expect(deleted).toBeNull();
      });
    });
  });

  describe('_updateMany()', () => {
    it('should use session for bulk updates', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        await model.create([
          { title: 'bulk1', value: 1 },
          { title: 'bulk2', value: 1 },
        ]);
        await session.commitTransaction();

        session.startTransaction();
        await model._updateMany({ value: 1 }, { $set: { value: 2 } });

        await session.abortTransaction();
        const unchanged = await model.countDocuments({ value: 1 });
        expect(unchanged).toBe(2);

        session.startTransaction();
        await model._updateMany({ value: 1 }, { $set: { value: 2 } });
        await session.commitTransaction();
        const updated = await model.countDocuments({ value: 2 });
        expect(updated).toBe(2);
      });
    });
  });

  describe('findOne()', () => {
    it('should use session for single document queries', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        const doc = await model.create([{ title: 'findOne', value: 1 }]);
        await session.commitTransaction();

        session.startTransaction();
        await model._updateMany({ _id: doc[0]._id }, { $set: { value: 2 } });

        const foundInTransaction = await model.findOne({ _id: doc[0]._id }, {});
        expect(foundInTransaction?.value).toBe(2);

        await session.abortTransaction();

        const foundAfterAbort = await model.findOne({ _id: doc[0]._id }, {});
        expect(foundAfterAbort?.value).toBe(1);
      });
    });
  });

  describe('replaceOne()', () => {
    it('should use session for document replacement', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        const doc = await model.create([{ title: 'original', value: 1 }]);
        await session.commitTransaction();

        session.startTransaction();
        await model.replaceOne({ _id: doc[0]._id }, { title: 'replaced', value: 2 });

        await session.abortTransaction();
        const notReplaced = await model.findOne({ _id: doc[0]._id }, {});
        expect(notReplaced?.title).toBe('original');
        expect(notReplaced?.value).toBe(1);

        session.startTransaction();
        await model.replaceOne({ _id: doc[0]._id }, { title: 'replaced', value: 2 });
        await session.commitTransaction();
        const replaced = await model.findOne({ _id: doc[0]._id }, {});
        expect(replaced?.title).toBe('replaced');
        expect(replaced?.value).toBe(2);
      });
    });
  });

  describe('distinct()', () => {
    it('should use session for distinct queries', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        await model.create([
          { title: 'distinct1', value: 1 },
          { title: 'distinct2', value: 1 },
          { title: 'distinct3', value: 2 },
        ]);
        await session.commitTransaction();

        session.startTransaction();
        await model.create([{ title: 'distinct4', value: 3 }]);

        const valuesInTransaction = await model.distinct('value', {});
        expect(valuesInTransaction.sort()).toEqual([1, 2, 3]);

        await session.abortTransaction();

        const valuesAfterAbort = await model.distinct('value', {});
        expect(valuesAfterAbort.sort()).toEqual([1, 2]);
      });
    });
  });

  describe('aggregate() and aggregateCursor()', () => {
    it('should use session for aggregation queries', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        await model.create([
          { title: 'agg1', value: 1 },
          { title: 'agg2', value: 1 },
          { title: 'agg3', value: 2 },
        ]);
        await session.commitTransaction();

        session.startTransaction();
        await model.create([{ title: 'agg4', value: 2 }]);

        const pipeline = [{ $group: { _id: '$value', count: { $sum: 1 } } }, { $sort: { _id: 1 } }];

        const aggInTransaction = await model.aggregate(pipeline);
        expect(aggInTransaction).toEqual([
          { _id: 1, count: 2 },
          { _id: 2, count: 2 },
        ]);

        const cursorInTransaction = await model
          .aggregateCursor<{ _id: number; count: number }>(pipeline)
          .exec();
        expect(cursorInTransaction).toEqual([
          { _id: 1, count: 2 },
          { _id: 2, count: 2 },
        ]);

        await session.abortTransaction();

        const aggAfterAbort = await model.aggregate(pipeline);
        expect(aggAfterAbort).toEqual([
          { _id: 1, count: 2 },
          { _id: 2, count: 1 },
        ]);

        const cursorAfterAbort = await model
          .aggregateCursor<{ _id: number; count: number }>(pipeline)
          .exec();
        expect(cursorAfterAbort).toEqual([
          { _id: 1, count: 2 },
          { _id: 2, count: 1 },
        ]);
      });
    });
  });

  describe('facet()', () => {
    it('should use session for faceted aggregation', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        await model.create([
          { title: 'facet1', value: 1 },
          { title: 'facet2', value: 1 },
          { title: 'facet3', value: 2 },
        ]);
        await session.commitTransaction();

        session.startTransaction();
        await model.create([{ title: 'facet4', value: 2 }]);

        const resultsInTransaction = await model.facet(
          [{ $match: {} }],
          {
            byValue: [{ $group: { _id: '$value', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
          },
          { byValue: 1 }
        );

        expect(resultsInTransaction[0].byValue).toEqual([
          { _id: 1, count: 2 },
          { _id: 2, count: 2 },
        ]);

        await session.abortTransaction();

        const resultsAfterAbort = await model.facet(
          [{ $match: {} }],
          {
            byValue: [{ $group: { _id: '$value', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
          },
          { byValue: 1 }
        );

        expect(resultsAfterAbort[0].byValue).toEqual([
          { _id: 1, count: 2 },
          { _id: 2, count: 1 },
        ]);
      });
    });
  });

  describe('updateOne()', () => {
    it('should use session for single document updates', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        const doc = await model.create([{ title: 'updateOne', value: 1 }]);
        await session.commitTransaction();

        session.startTransaction();
        await model.updateOne({ _id: doc[0]._id }, { $set: { value: 2 } });

        await session.abortTransaction();
        const notUpdated = await model.findOne({ _id: doc[0]._id }, {});
        expect(notUpdated?.value).toBe(1);

        session.startTransaction();
        await model.updateOne({ _id: doc[0]._id }, { $set: { value: 2 } });
        await session.commitTransaction();
        const updated = await model.findOne({ _id: doc[0]._id }, {});
        expect(updated?.value).toBe(2);
      });
    });
  });

  describe('bulkWrite()', () => {
    it('should use session for bulk operations', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);
        const docs = await model.create([
          { title: 'bulk1', value: 1 },
          { title: 'bulk2', value: 1 },
        ]);
        await session.commitTransaction();

        session.startTransaction();
        await model.bulkWrite([
          {
            updateOne: {
              filter: { _id: docs[0]._id },
              update: { $set: { value: 2 } },
            },
          },
          {
            updateOne: {
              filter: { _id: docs[1]._id },
              update: { $set: { value: 3 } },
            },
          },
        ]);

        await session.abortTransaction();
        const unchanged = await model.find({ _id: { $in: docs.map(d => d._id) } });
        expect(unchanged.map(d => d.value)).toEqual([1, 1]);

        session.startTransaction();
        await model.bulkWrite([
          {
            updateOne: {
              filter: { _id: docs[0]._id },
              update: { $set: { value: 2 } },
            },
          },
          {
            updateOne: {
              filter: { _id: docs[1]._id },
              update: { $set: { value: 3 } },
            },
          },
        ]);
        await session.commitTransaction();
        const updated = await model.find({ _id: { $in: docs.map(d => d._id) } });
        expect(updated.map(d => d.value).sort()).toEqual([2, 3]);
      });
    });
  });

  describe('createMany()', () => {
    it('should use session when creating multiple documents', async () => {
      await appContext.run(async () => {
        session.startTransaction();
        appContext.set('mongoSession', session);

        const docs = await model.createMany([
          { title: 'many1', value: 1 },
          { title: 'many2', value: 2 },
        ]);

        await session.abortTransaction();
        const notFound = await model.find({ _id: { $in: docs.map(d => d._id) } });
        expect(notFound).toHaveLength(0);

        session.startTransaction();
        await model.createMany([
          { title: 'many1', value: 1 },
          { title: 'many2', value: 2 },
        ]);
        await session.commitTransaction();

        const found = await model.find({ title: /^many/ }).sort({ value: 1 });
        expect(found).toHaveLength(2);
        expect(found[0].value).toBe(1);
        expect(found[1].value).toBe(2);
      });
    });
  });
});
