import mongoose from 'mongoose';

import { instanceModel } from 'api/odm';

const schema = new mongoose.Schema({
  key: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  expiresAt: { type: Date, expires: 60 * 10, default: Date.now() },
});

export default instanceModel('passwordrecoveries', schema);
