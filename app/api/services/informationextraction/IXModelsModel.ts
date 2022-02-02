import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { IXModelType } from 'shared/types/IXModelType';

const props = {};

const mongoSchema = new mongoose.Schema(props, {
  emitIndexErrors: true,
  strict: false,
});

const IXModelsModel = instanceModel<IXModelType>('ixmodels', mongoSchema);

export { IXModelsModel };
