import mongoose from 'mongoose';
import { instanceModel } from 'api/odm';
import { PageType } from 'shared/types/pageType';

const propsWithDBSpecifics = {
  creationDate: { type: Number, select: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', select: false },
};

const mongoSchema = new mongoose.Schema(propsWithDBSpecifics, {
  strict: false,
});

const Model = instanceModel<PageType>('pages', mongoSchema);

export default Model;
