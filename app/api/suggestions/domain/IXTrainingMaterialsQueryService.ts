import { ObjectId } from 'mongodb';
import { LanguageISO6391, ObjectIdSchema, PropertyValueSchema } from '#shared/types/commonTypes.js';

export type TrainingMaterialsQuery = {
  extractorId: ObjectIdSchema;
  /** The extractor's target property; decides which labels and entity values are relevant. */
  property: string;
  limit: number;
};

/**
 * One labeled document the model can be trained on: the suggestion's own labeled value, the
 * entity's value for the property, the human's selections on the file, and the file's
 * segmentation.
 */
export type TrainingFileRow = {
  fileId: ObjectId;
  entityId: string;
  language: LanguageISO6391;
  currentValue: PropertyValueSchema | PropertyValueSchema[];
  entityLanguage: { metadata?: { value: unknown; label?: unknown }[] };
  file: {
    propertySelections?: { name: string; selection?: { text?: string } }[];
    filename?: string;
  };
  segmentation: {
    filename?: string;
    xmlname?: string;
    segmentation?: unknown;
    propertySelections?: unknown;
  };
};

/**
 * Read side of the training-material walk.
 *
 * Streams: a training run can walk thousands of documents, and the caller consumes them one at a
 * time to build the payload it ships to the ML service. The three joins stay one operation the
 * store answers natively — a row is only trainable if its file *and* its segmentation are ready,
 * and asking that per row from the domain would be three round trips per document.
 */
export interface IXTrainingMaterialsQueryService {
  streamFilesForTraining(query: TrainingMaterialsQuery): AsyncIterable<TrainingFileRow>;
}
