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
  user: new mongoose.Schema({
    username: String
  })
});

let Model = mongoose.model('pages', pagesSchema);
export default instanceModel(Model);

