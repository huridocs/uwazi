import mongoose from 'mongoose';

import { instanceModel } from 'api/odm';

const schema = new mongoose.Schema({
  key: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
});

export default instanceModel('passwordrecoveries', schema);
