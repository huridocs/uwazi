import _ from 'lodash';
import util from 'util';

import Ajv, { AnySchemaObject, ValidateFunction } from 'ajv';
import ValidationError from 'ajv/dist/runtime/validation_error';

import { defaultAjv } from './ajvInstances';

type PrintMap = Map<string[], DataBlueprint>;

type SchemaMap = {
  [index: string]: AnySchemaObject;
};

class DataBlueprint {
  readonly ajvInstance: Ajv = defaultAjv;

  readonly ajvSchema: AnySchemaObject;

  private validator: ValidateFunction;

  private subPrints: PrintMap = new Map();

  constructor(ajvSchema: AnySchemaObject) {
    this.ajvSchema = ajvSchema;
    this.validator = this.ajvInstance.compile(this.ajvSchema);
  }

  validate(obj: any) {
    const valid = this.validator(obj);
    if (!valid) {
      const err = new ValidationError(this.validator.errors || []);
      err.message = util.inspect(err, false, null);
      throw err;
    }
  }

  substitute(propToSchema: SchemaMap) {
    const resolvedSchema = _.cloneDeep(this.ajvSchema);
    Object.entries(propToSchema).forEach(([prop, schema]) => {
      resolvedSchema.properties[prop] = schema;
    });

    const resolvedBlueprint = new DataBlueprint(resolvedSchema);

    return resolvedBlueprint;
  }
}

export { DataBlueprint };
