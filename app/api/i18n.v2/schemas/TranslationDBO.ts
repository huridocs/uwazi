import { ObjectId } from 'mongodb';

export interface TranslationDBO {
  _id: ObjectId;
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: { type: string; label: string; id: string };
}
