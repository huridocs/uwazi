import mongoose from 'mongoose';

import { instanceModel } from 'api/odm';

const pagesSchema = new mongoose.Schema({
  title: String,
  language: String,
  sharedId: String,
  creationDate: { type: Number, select: false },
  metadata: new mongoose.Schema({
    content: String,
    script: String,
  }),
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', select: false },
});

export default instanceModel('pages', pagesSchema);
