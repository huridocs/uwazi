import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';

const contextSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: String,
  values: [
    {
      key: String,
      value: String,
    },
  ],
});

const translationSchema = new mongoose.Schema({
  locale: String,
  contexts: [contextSchema],
});

export default instanceModel('translations', translationSchema);
