import { ObjectId } from 'mongodb';

const generateId = () => new ObjectId().toHexString();
export class Relationship {
  readonly _id: string;

  constructor(readonly from: string, readonly to: string, public type: string) {
    this._id = generateId();
  }
}
