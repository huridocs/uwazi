import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface ActivityLogEntryType {
  _id: ObjectIdSchema;
  method: 'UPDATE' | 'DELETE' | 'RAW' | 'MIGRATE' | 'WARNING';
  body?: string;
  semantic: ActivityLogSemanticType;
  query?: string;
  username?: string;
  user: ObjectIdSchema;
  time?: number;
  url?: string;
}

export interface ActivityLogSemanticType {
  description: string;
  action: 'UPDATE' | 'DELETE' | 'RAW' | 'MIGRATE' | 'WARNING';
  name: string;
  extra?: string;
}
