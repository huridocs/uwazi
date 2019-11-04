import { validateEntity } from './entitySchema';

const validator = {
  save(entity) {
    return validateEntity(entity);
  }
};

export default validator;
