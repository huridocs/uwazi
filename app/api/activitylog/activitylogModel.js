import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const pagesSchema = new mongoose.Schema({
  method: String,
  time: Date,
  url: String,
  query: String,
  params: String,
  body: String,
  username: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
});

export default instanceModel('activitylog', pagesSchema);
