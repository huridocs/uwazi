import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';

interface IXSelectionSource {
  type: 'file' | 'entity_property';
  id: string;
  property?: string;
}

interface IXSelectionType {
  source: IXSelectionSource;
  selections: {
    name: string;
    selection: { text: string };
    propertyID?: string;
    deleteSelection?: boolean;
  }[];
}

const sourceSchema = new mongoose.Schema({
  type: { type: String, enum: ['file', 'entity_property'], required: true },
  property: { type: String },
});

const props = {
  source: { type: sourceSchema, required: true },
  selections: [
    {
      name: { type: String, required: true },
      selection: {
        text: { type: String, required: true },
      },
      propertyID: { type: String },
      deleteSelection: { type: Boolean },
    },
  ],
};

const mongoSchema = new mongoose.Schema(props, {
  strict: false,
  timestamps: true,
});

// Index by source type and id for quick lookups
mongoSchema.index({ 'source.type': 1, 'source.id': 1 });
// Index by source type and property for entity property lookups
mongoSchema.index({ 'source.type': 1, 'source.property': 1 });
// Compound index for all source fields
mongoSchema.index({ 'source.type': 1, 'source.id': 1, 'source.property': 1 });

const IXSelectionsModel = instanceModel<IXSelectionType>('ixselections', mongoSchema);

export { IXSelectionsModel };
export type { IXSelectionType, IXSelectionSource };
