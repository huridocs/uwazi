import mongoose from 'mongoose';

import instanceModel from 'api/odm';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, select: false, required: true },
  email: { type: String, unique: true, required: true },
  role: { type: String, unique: false, required: true }
});

export default instanceModel('users', userSchema);
