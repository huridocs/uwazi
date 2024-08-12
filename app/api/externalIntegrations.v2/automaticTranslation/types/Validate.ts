interface ErrorObject {
  keyword: string; // validation keyword.
  instancePath: string; // JSON Pointer to the location in the data instance (e.g., `"/prop/1/subProp"`).
  schemaPath: string; // JSON Pointer to the location of the failing keyword in the schema
  params: object; // type is defined by keyword value, see below
  // params property is the object with the additional information about error
  // it can be used to generate error messages
  // (e.g., using [ajv-i18n](https://github.com/ajv-validator/ajv-i18n) package).
  // See below for parameters set by all keywords.
  propertyName?: string; // set for errors in `propertyNames` keyword schema.
  // `instancePath` still points to the object in this case.
  message?: string; // the error message (can be excluded with option `messages: false`).
  // Options below are added with `verbose` option:
  schema?: any; // the value of the failing keyword in the schema.
  parentSchema?: object; // the schema containing the keyword.
  data?: any; // the data validated by the keyword.
}

export interface Validate {
  isValid: boolean;
  errors: ErrorObject[] | null | undefined;
}
