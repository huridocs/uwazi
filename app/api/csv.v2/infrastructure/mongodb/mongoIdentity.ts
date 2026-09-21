import { ObjectId } from 'mongodb';

const toMongoIdentity = <T extends { id: string }>(obj: T): Omit<T, 'id'> & { _id: ObjectId } => {
  const { id, ...rest } = obj;
  return { ...rest, _id: new ObjectId(id) };
};

const fromMongoIdentity = <T extends object>(
  doc: T & { _id?: ObjectId | string }
): Omit<T, '_id'> & { id: string } => {
  const { _id, ...rest } = doc;
  return { ...(rest as Omit<T, '_id'>), id: (_id || '').toString() };
};

export { toMongoIdentity, fromMongoIdentity };
