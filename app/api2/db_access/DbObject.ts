/* eslint-disable max-classes-per-file */
import { Schema } from 'ajv';

import { createValidator } from 'api2/types/ajv_validation';

abstract class DbObject<I> {
  private _class: typeof DbObject;

  static ajvSchema: Schema;

  static ajvValidation = createValidator({});

  constructor(parameters: I, _class: typeof DbObject) {
    this._class = _class;
    this._class.ajvValidation(parameters);
    Object.entries(parameters).forEach(([key, value]) => {
      console.log(key, value);
      this[key] = value;
    });
  }
}

export { DbObject };
