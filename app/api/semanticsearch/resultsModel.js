import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';

const resultSchema = new mongoose.Schema({
  sharedId: String,
  searchId: mongoose.Schema.Types.ObjectId,
  status: String,
  averageScore: Number,
  results: [
    {
      text: String,
      score: Number,
      page: String,
    },
  ],
});

export default instanceModel('semanticsearchresults', resultSchema);
