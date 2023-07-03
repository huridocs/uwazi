import db from 'api/utils/testing_db';
import { BulkWriteStream } from '../BulkWriteStream';

const fixtures = {
  values: [{ value: -1 }, { value: 0 }],
};

type NumberValueType = { value: number };

const newValues: NumberValueType[] = Array(11)
  .fill(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .map((value: any, index: number) => ({
    value: index + 1,
  }));

const checkValues = async (expectedValues: number[]) => {
  const inDbUserNames = (
    await db.mongodb?.collection<NumberValueType>('values').find({}).toArray()
  )?.map(v => v.value);
  expect(inDbUserNames).toMatchObject(expectedValues);
};

const stackLimit = 5;

// eslint-disable-next-line max-statements
describe('BulkWriteStream', () => {
  let stream: BulkWriteStream<NumberValueType>;

  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
    stream = new BulkWriteStream(db.mongodb!.collection<NumberValueType>('values'), stackLimit);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it('should be able to insert', async () => {
    await stream.insert(newValues[0]);
    await stream.flush();
    await checkValues([-1, 0, 1]);
  });

  it('should be able to delete', async () => {
    await stream.delete({ value: -1 });
    await stream.flush();
    await checkValues([0]);
  });

  it('should be able to delete many', async () => {
    await stream.deleteMany({ value: { $lt: 2 } });
    await stream.flush();
    await checkValues([]);
  });

  it('should be able to update one', async () => {
    await stream.updateOne({ value: 0 }, { $set: { value: 99 } });
    await stream.flush();
    await checkValues([-1, 99]);
  });

  it('should be able to update many', async () => {
    await stream.updateMany({ value: { $lt: 2 } }, { $set: { value: 99 } });
    await stream.flush();
    await checkValues([99, 99]);
  });

  it('should be able to mix cases', async () => {
    await stream.insert(newValues[0]);
    await stream.delete({ value: -1 });
    await stream.updateOne({ value: 0 }, { $set: { value: 99 } });
    await stream.flush();
    await checkValues([99, 1]);
  });

  it('should empty actions when flushing', async () => {
    expect(stream.actionCount).toBe(0);
    await stream.insert(newValues[0]);
    expect(stream.actionCount).toBe(1);
    await stream.delete({ value: -1 });
    expect(stream.actionCount).toBe(2);
    await stream.insert(newValues[2]);
    await stream.updateOne({ value: 0 }, { $set: { value: 99 } });
    await stream.flush();
    expect(stream.actionCount).toBe(0);
  });

  it('should not fail if flushing with an empty buffer', async () => {
    await expect(stream.flush()).resolves.toBe(undefined);
  });

  it('should automatically flush when reaching the set limit', async () => {
    expect(stream.actionCount).toBe(0);
    await Promise.all(newValues.slice(0, 4).map(async u => stream.insert(u)));
    expect(stream.actionCount).toBe(4);
    await stream.insert(newValues[4]);
    expect(stream.actionCount).toBe(0);
    await Promise.all(newValues.slice(5).map(async u => stream.insert(u)));
    expect(stream.actionCount).toBe(1);
    await stream.flush();
    expect(stream.actionCount).toBe(0);
    expect((await db.mongodb?.collection('values').find({}).toArray())?.length).toBe(13);
  });
});
