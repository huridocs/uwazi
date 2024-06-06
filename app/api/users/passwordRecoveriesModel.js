import mongoose from 'mongoose';

import { instanceModel } from 'api/odm';

const ONE_DAY = 60 * 60 * 24;

const schema = new mongoose.Schema({
  key: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  expiresAt: { type: Date, expires: ONE_DAY, default: Date.now },
});

export default instanceModel('passwordrecoveries', schema);
