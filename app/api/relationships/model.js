import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';

const relationshipsSchema = new mongoose.Schema({
  __v: { type: Number, select: false },
  entity: { type: String, index: true },
  hub: { type: mongoose.Schema.Types.ObjectId, index: true },
  sharedId: { type: mongoose.Schema.Types.ObjectId, index: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'relationTypes', index: true },
  metadata: mongoose.Schema.Types.Mixed,
  file: String,
  reference: {
    selectionRectangles: {
      type: [{ top: Number, left: Number, width: Number, height: Number, page: String }],
      default: undefined,
    },
    text: String,
  },
});

export default instanceModel('connections', relationshipsSchema);
