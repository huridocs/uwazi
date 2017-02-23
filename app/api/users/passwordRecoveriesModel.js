import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const schema = new mongoose.Schema({
  key: String,
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'users'}
});

let Model = mongoose.model('passwordrecoveries', schema);
export default instanceModel(Model);
