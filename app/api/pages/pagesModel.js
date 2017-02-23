import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const pagesSchema = new mongoose.Schema({
  title: String,
  language: String,
  sharedId: String,
  creationDate: {type: Number},
  metadata: new mongoose.Schema({
    content: String
  }),
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
});

let Model = mongoose.model('pages', pagesSchema);
export default instanceModel(Model);

