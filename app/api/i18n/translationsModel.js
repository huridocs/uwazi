import mongoose from 'mongoose';

const contextSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: String,
  values: [{
    key: String,
    value: String
  }]
});

const translationSchema = new mongoose.Schema({
  locale: String,
  contexts: [contextSchema]
});

let Model = mongoose.model('translations', translationSchema);
export default Model;
