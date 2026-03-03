import { instanceModel } from '#api/odm/index.js';
import mongoose from 'mongoose';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';

const mongoSchema = new mongoose.Schema({
  name: mongoose.Schema.Types.Mixed,
  values: mongoose.Schema.Types.Mixed,
});

export default instanceModel<ThesaurusSchema>('dictionaries', mongoSchema);
