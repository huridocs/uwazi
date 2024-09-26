import { Ajv } from 'ajv';
import { entityInputDataSchema } from 'api/entities.v2/EntityInputDataSchema';
import { EntityInputData } from 'api/entities.v2/EntityInputDataType';
import { EntityInputValidator } from '../contracts/EntityInputValidator';

export class AJVEntityInputValidator implements EntityInputValidator {
  private errors: string[] = [];

  getErrors() {
    return this.errors;
  }

  validate(data: unknown) {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile<EntityInputData>(entityInputDataSchema);
    const result = validate(data);
    this.errors = validate.errors ? validate.errors?.map(e => JSON.stringify(e.params)) : [];
    return result;
  }
}
