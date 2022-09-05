import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { TranslationType } from 'shared/translationType';

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

export default instanceModel<TranslationType>('translations', translationSchema);
