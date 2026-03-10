import { instanceModel } from 'api/odm';
import mongoose from 'mongoose';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

const mongoSchema = new mongoose.Schema({
  name: mongoose.Schema.Types.Mixed,
  values: mongoose.Schema.Types.Mixed,
});

export default instanceModel<ThesaurusSchema>('dictionaries', mongoSchema);
