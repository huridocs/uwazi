import { ObjectId } from 'mongodb';

export const csvMigrationIdOf = (value: unknown): string =>
  value instanceof ObjectId ? value.toHexString() : String(value);
