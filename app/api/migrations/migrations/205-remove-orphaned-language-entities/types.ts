import { ObjectId } from 'mongodb';

type Language = {
  key: string;
  label?: string;
  default?: boolean;
};

interface Settings {
  _id?: ObjectId;
  languages?: Language[];
}

export type { Settings, Language };
