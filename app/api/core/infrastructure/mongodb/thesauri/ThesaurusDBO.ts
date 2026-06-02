import { ObjectId } from 'mongodb';

interface ThesaurusValueDBO {
  id: string;
  label: string;
  values?: {
    id: string;
    label: string;
  }[];
}

export interface ThesaurusDBO {
  _id: ObjectId;
  name: string;
  values: ThesaurusValueDBO[];
}
