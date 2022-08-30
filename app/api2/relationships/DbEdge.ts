import { Schema } from 'ajv';
import { ObjectId } from 'mongodb';

import { DbObject } from 'api2/db_access/DbObject';
import { prepareClass } from 'api2/types/classPreparation';
import { objectIdSchema } from 'shared/types/commonSchemas';

interface DbEdgeInterface {
  from: ObjectId;
  to: ObjectId;
}

class DbEdge extends DbObject<DbEdgeInterface> implements DbEdgeInterface {
  from: ObjectId;

  to: ObjectId;

  static ajvSchema: Schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      from: objectIdSchema,
      to: objectIdSchema,
    },
    required: ['from', 'to'],
  };

  constructor(parameters: DbEdgeInterface) {
    super(parameters, DbEdge);
  }
}

prepareClass(DbEdge);

export { DbEdge };
