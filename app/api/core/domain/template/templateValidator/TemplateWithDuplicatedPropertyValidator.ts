import { Template } from 'api/core/domain/template/Template';
import { ValidationStep } from '../../Validator';
import { TemplateWithDuplicatedPropertyError } from '../errors';

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
