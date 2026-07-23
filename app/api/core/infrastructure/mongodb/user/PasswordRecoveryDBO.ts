import { ObjectId } from 'mongodb';

export interface PasswordRecoveryDBO {
  _id: ObjectId;
  key: string;
  user: ObjectId;
  expiresAt: Date;
}
