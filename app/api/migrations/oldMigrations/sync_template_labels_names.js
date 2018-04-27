import P from 'bluebird';

import templates from '../templates';
import mongoose from 'mongoose';

templates.get()
.then(_templates => P.resolve(_templates).map(template => templates.save(template), { concurrency: 1 }))
.then(() => {
  mongoose.disconnect();
});
