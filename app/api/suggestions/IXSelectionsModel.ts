import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { IXSelections } from 'shared/types/ixSelectionType';

const mongoSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    timestamps: true,
  }
);

// Index by source type and id for quick lookups
mongoSchema.index({ 'source.type': 1, 'source.id': 1 });
// Index by source type and property for entity property lookups
mongoSchema.index({ 'source.type': 1, 'source.property': 1 });
// Compound index for all source fields
mongoSchema.index({ 'source.type': 1, 'source.id': 1, 'source.property': 1 });

const IXSelectionsModel = instanceModel<IXSelections>('ixselections', mongoSchema);

export { IXSelectionsModel };
