import Ajv from 'ajv';
import { validateTemplate } from './templateSchema';


const validator = {
  save(template) {
    return validateTemplate(template);
  }
};

export default validator;

