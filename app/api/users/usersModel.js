import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const userSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  password: {type: String, select: false},
  email: {type: String, unique: true}
});

let Model = mongoose.model('users', userSchema);
export default instanceModel(Model);
