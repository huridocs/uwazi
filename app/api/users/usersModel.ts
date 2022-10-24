import mongoose from 'mongoose';

import { instanceModel } from 'api/odm';

export interface User {
  _id?: any;
  username?: string;
  password?: string;
  email?: string;
  role?: string;
  failedLogins?: number;
  accountLocked?: boolean;
  accountUnlockCode?: string;
  using2fa?: boolean;
  secret?: string | null;
}

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, select: false, required: true },
  email: { type: String, unique: true, required: true },
  role: { type: String, unique: false, required: true },
  failedLogins: { type: Number, required: false, select: false },
  accountLocked: { type: Boolean, select: false },
  accountUnlockCode: { type: String, select: false },
  using2fa: { type: Boolean, default: false },
  secret: { type: String, select: false },
});

export default instanceModel<User>('users', userSchema);
