import mongoose from 'mongoose';

const contextSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: String,
  values: mongoose.Schema.Types.Mixed
});

const translationSchema = new mongoose.Schema({
  locale: String,
  contexts: [contextSchema]
});

let Model = mongoose.model('translations', translationSchema);
export default Model;
