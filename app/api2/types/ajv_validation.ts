import Ajv, { Schema } from 'ajv';

const ajv = new Ajv({ allErrors: true });

const createValidator = (schema: Schema) => ajv.compile(schema);

const prepareClassValidator = (_class: any) => {
  _class.ajvValidation = createValidator(_class.ajvSchema);
};

export { createValidator, prepareClassValidator };
