import Ajv from 'ajv';
import { validateTemplate } from './templateSchema';


const validator = {
  save(template) {
    const valid = validateTemplate(template);
    if (!valid) {
      throw new Ajv.ValidationError(validateTemplate.errors);
    }
  }
};

export default validator;

