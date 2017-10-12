import P from 'bluebird';

import model from '../users/usersModel';
import mongoose from 'mongoose';
model.db.collection.dropIndex({role: 1})
.then((response) => {
  console.log(response);
  mongoose.disconnect();
});
