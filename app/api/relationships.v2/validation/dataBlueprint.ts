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

  private defaultValidator: ValidateFunction;

  private subPrints: PrintMap = new Map();

  private subSchemas: SchemaMap;

  constructor(ajvSchema: AnySchemaObject, subSchemas: SchemaMap = {}) {
    this.ajvSchema = ajvSchema;
    this.defaultValidator = this.ajvInstance.compile(this.ajvSchema);
    this.subSchemas = subSchemas;
  }

  validate(obj: any) {
    const valid = this.defaultValidator(obj);
    if (!valid) {
      const err = new ValidationError(this.defaultValidator.errors || []);
      err.message = util.inspect(err, false, null);
      throw err;
    }
  }

  resolve(_props: string[]) {
    const props = _props.sort();

    if (this.subPrints.has(props)) return this.subPrints.get(props) as DataBlueprint;

    console.log('calculating', props);

    const resolvedSchema = _.cloneDeep(this.ajvSchema);
    const resolvedSubSchemas = _.cloneDeep(this.subSchemas);
    props.forEach(name => {
      resolvedSchema.properties[name] = this.subSchemas[name];
      delete resolvedSubSchemas[name];
    });

    const resolvedBlueprint = new DataBlueprint(resolvedSchema);
    this.subPrints.set(props, resolvedBlueprint);

    return this.subPrints.get(props) as DataBlueprint;
  }
}

export { DataBlueprint };
