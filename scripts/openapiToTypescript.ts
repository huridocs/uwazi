/* eslint-disable no-console */
import { OpenAPISchemaValidator } from 'express-openapi-validator/dist/framework/openapi.schema.validator';
// eslint-disable-next-line node/no-restricted-import
import { writeFile } from 'fs/promises';
import { swaggerDocument } from '../app/swagger';

(async () => {
  const validation = new OpenAPISchemaValidator({
    version: swaggerDocument.openapi,
    validateApiSpec: true,
  }).validate(swaggerDocument);

  if (validation.errors?.length) {
    console.log(validation.errors);
    throw new Error('openapi schema is invalid !!');
  }

  import('openapi-typescript')
    .then(openapiTS => openapiTS.default(swaggerDocument))
    .then(output => writeFile(`${__dirname}/../app/api/swagger.d.ts`, output, 'utf-8'))
    .then(() => {
      console.log('');
      console.log('TS Types for openapi specification generated successfully !!');
      console.log('');
    })
    .catch(e => {
      throw e;
    });
})();
