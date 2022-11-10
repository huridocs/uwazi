import { SelfReferenceError } from '../errors/relationshipErrors';

export class Relationship {
  readonly _id: string;

  readonly from: string;

  readonly to: string;

  readonly type: string;

  protected constructor(_id: string, from: string, to: string, type: string) {
    this._id = _id;
    this.from = from;
    this.to = to;
    this.type = type;
  }

  static create(_id: string, from: string, to: string, type: string) {
    if (from === to) {
      throw new SelfReferenceError('Cannot create relationship to itself');
    }
    return new Relationship(_id, from, to, type);
  }
}
