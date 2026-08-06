import { ObjectId } from 'mongodb';

export interface CaptchaDBO {
  _id: ObjectId;
  text: string;
  createdAt: Date;
}
