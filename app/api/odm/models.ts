import { Document, DocumentQuery, Model, Query } from "mongoose";
import { DeleteWriteOpResultObject } from "mongodb";

export interface OdmModel<T extends Document> {
    db: Model<T>,
    // returns T.toObject().
    save: (data: T) => Promise<any>;
    get: (query: any, select?: string, pagination?: {}) => Promise<T[]>;
    count: (condition: any) => Promise<number>;
    getById: (id: any | string | number) => Promise<T | null>;
    delete: (condition: any) => Promise<DeleteWriteOpResultObject['result']>;
}

// models are accessed in api/sync, which cannot be type-safe since the document
// type is a request parameter. Thus, we store all OdmModels as type Document.
const models: {[index:string]: OdmModel<Document>} = {};

export default models;
