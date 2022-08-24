import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

const mongoSchema = new mongoose.Schema({
  name: mongoose.Schema.Types.Mixed,
  enable_classification: mongoose.Schema.Types.Boolean,
  values: mongoose.Schema.Types.Mixed,
});

export default instanceModel<ThesaurusSchema>('dictionaries', mongoSchema);
