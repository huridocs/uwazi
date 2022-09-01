import { ObjectId } from 'mongodb';

export class Relationship {
  readonly _id: string;

  constructor(readonly from: string, readonly to: string, public type: string) {
    this._id = new ObjectId().toHexString();
  }
}
