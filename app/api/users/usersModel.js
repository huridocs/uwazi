import mongoose from 'mongoose';

import instanceModel from 'api/odm';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, select: false, required: true },
  email: { type: String, unique: true, required: true },
  role: { type: String, unique: false, required: true },
  failedLogins: { type: Number, required: false, select: false },
  accountLocked: { type: Boolean, select: false },
  accountUnlockCode: { type: String, select: false }
});

const Model = mongoose.model('users', userSchema);
export default instanceModel(Model);
