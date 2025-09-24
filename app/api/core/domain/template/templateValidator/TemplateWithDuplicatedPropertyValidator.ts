// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { Template } from 'api/templates.v2/model/Template.js';
import { ValidationStep } from '../../Validator';
import { TemplateWithDuplicatedPropertyError } from '../errors';

class TemplateWithDuplicatedPropertyValidator implements ValidationStep<Template> {
  // eslint-disable-next-line class-methods-use-this
  validate(template: Template): void {
    const seen = new Set<string>();

    // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
    template.allProperties.forEach(property => {
      if (seen.has(property.discriminator)) {
        throw new TemplateWithDuplicatedPropertyError(property);
      }
      seen.add(property.discriminator);
    });
  }
}

export { TemplateWithDuplicatedPropertyValidator };
