import mongoose from 'mongoose';

import { instanceModel } from '../odm/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/IXModelType... Remove this comment to see the full error message
import { IXModelType } from 'shared/types/IXModelType.js';

const props = {};

const mongoSchema = new mongoose.Schema(props, {
  strict: false,
});

const IXModelsModel = instanceModel<IXModelType>('ixmodels', mongoSchema);

export { IXModelsModel };
