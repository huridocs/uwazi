import { Template } from '#api/core/domain/template/Template.js';
import { ValidationStep } from '../../Validator.js';
import { TemplateWithDuplicatedPropertyError } from '../errors.js';

class TemplateWithDuplicatedPropertyValidator implements ValidationStep<Template> {
  // eslint-disable-next-line class-methods-use-this
  validate(template: Template): void {
    const seen = new Set<string>();

    template.allProperties.forEach(property => {
      if (seen.has(property.discriminator)) {
        throw new TemplateWithDuplicatedPropertyError(property);
      }
      seen.add(property.discriminator);
    });
  }
}

export { TemplateWithDuplicatedPropertyValidator };
