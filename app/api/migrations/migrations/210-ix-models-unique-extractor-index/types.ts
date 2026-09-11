import { ObjectId } from 'mongodb';

type IXModel = {
  _id: ObjectId;
  extractorId?: ObjectId;
  status?: string;
  findingSuggestions?: boolean;
};

type Fixture = {
  ixmodels: IXModel[];
};

export type { Fixture, IXModel };
