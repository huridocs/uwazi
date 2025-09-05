import { Template } from 'api/templates.v2/model/Template';
import { ValidationStep } from '../../validator/Validator';
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
