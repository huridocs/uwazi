/** @format */
import { instanceModel } from 'api/odm';
import createMongooseSchema from 'json-schema-to-mongoose';
import mongoose from 'mongoose';

import schema from './dictionariesSchema';
import { Thesaurus } from './dictionariesType';

// const dictionarySchema = new mongoose.Schema({
//   name: String,
//   values: [
//     {
//       id: String,
//       label: { type: String },
//       values: mongoose.Schema.Types.Mixed,
//     },
//   ],
// });

export interface ThesaurusDocument extends mongoose.Document, Thesaurus {}
export default instanceModel<ThesaurusDocument>('dictionaries', createMongooseSchema({}, schema));
