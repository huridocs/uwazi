/** @format */

import { Document, DocumentQuery, Model } from 'mongoose';
import { DeleteWriteOpResultObject } from 'mongodb';

export interface OdmModel<T extends { _id?: any }> {
  db: Model<T & Document>;
  save: (data: T) => Promise<T>;
  saveMultiple: (data: T[]) => Promise<T[]>;

  getById: (id: any | string | number) => Promise<T | null>;
  get: (
    query: any,
    select?: string,
    pagination?: {}
  ) => DocumentQuery<(T & Document)[], T & Document>;

  count: (condition: any) => Promise<number>;
  delete: (condition: any) => Promise<DeleteWriteOpResultObject['result']>;
}

// models are accessed in api/sync, which cannot be type-safe since the document
// type is a request parameter. Thus, we store all OdmModels as type Document.
// eslint-disable-next-line
export let models: { [index: string]: OdmModel<any> } = {};
