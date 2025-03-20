import { ObjectId } from 'mongodb';

interface IXExtractorType {
  _id: ObjectId;
  name: string;
  property: string;
  templates: string[];
}

interface Fixture {
  ixextractors: IXExtractorType[];
}

export type { Fixture };
