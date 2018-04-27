import P from 'bluebird';

import model from '../users/usersModel';
import mongoose from 'mongoose';

model.get()
.then((users) => {
  return P.resolve(users).map((user) => {
    user.role = 'admin';
    return model.save(user);
  }, {concurrency: 1});
})
.then(() => {
  mongoose.disconnect();
});
