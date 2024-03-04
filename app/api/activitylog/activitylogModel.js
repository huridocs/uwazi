import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';

const pagesSchema = new mongoose.Schema({
  method: String,
  time: Number,
  url: String,
  query: String,
  params: String,
  body: String,
  username: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  expireAt: Date,
});

pagesSchema.index({ method: 1 });
pagesSchema.index({ time: 1 });
pagesSchema.index({ username: 1 }, { collation: { locale: 'en', strength: 2 } });

export default instanceModel('activitylog', pagesSchema);
