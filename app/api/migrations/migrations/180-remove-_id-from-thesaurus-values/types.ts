import { ObjectId } from 'mongodb';

interface ThesaurusSchema {
  _id: ObjectId;
  name: string;
  values: ThesaurusValueSchema[];
  [k: string]: unknown | undefined;
}

interface ThesaurusValueSchema {
  _id?: ObjectId;
  id: string;
  label: string;
  values?: {
    _id?: ObjectId;
    name?: string;
    id: string;
    label: string;
  }[];
}

interface Fixture {
  dictionaries: ThesaurusSchema[];
}

export type { Fixture };
