import { ObjectId } from 'mongodb';

export function generateId(): string {
  return new ObjectId().toHexString();
}
