import mongoose from 'mongoose';

process.env.EXTERNAL_SERVICES = true;

mongoose.Promise = Promise;

mongoose.set('autoIndex', false);
