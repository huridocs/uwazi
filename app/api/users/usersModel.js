import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String
});

let Model = mongoose.model('users', userSchema);
export default instanceModel(Model);
