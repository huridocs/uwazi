import { Template } from '#api/core/domain/template/Template.js';
import { Property } from '#api/core/domain/template/Property.js';
import { ValidationStep } from '../../Validator.js';
import { TemplateWithDuplicatedPropertyError } from '../errors.js';

class TemplateWithDuplicatedPropertyValidator implements ValidationStep<Template> {
  // eslint-disable-next-line class-methods-use-this
  validate(template: Template): void {
    const seenByName = new Map<string, Property>();

    template.allProperties.forEach(property => {
      const existing = seenByName.get(property.name);
      if (existing) {
        throw new TemplateWithDuplicatedPropertyError(property, existing);
      }
      seenByName.set(property.name, property);
    });
  }
}

export { TemplateWithDuplicatedPropertyValidator };
