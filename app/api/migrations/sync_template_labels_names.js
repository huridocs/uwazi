import P from 'bluebird';

import templates from '../templates';
import mongoose from 'mongoose';

templates.get()
.then((_templates) => {
  return P.resolve(_templates).map((template) => {
    return templates.save(template);
  }, {concurrency: 1});
})
.then(() => {
  mongoose.disconnect();
});
