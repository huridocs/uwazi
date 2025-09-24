// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { Template } from 'api/templates.v2/model/Template.js';
import { ValidationStep } from '../../Validator';
import { TemplateWithMissingCommonProperty } from '../errors';

class TemplateWithMissingCommonPropertyValidator implements ValidationStep<Template> {
  private readonly commonPropertiesDiscriminators = ['title', 'creationDate', 'editDate'];

  public validate(template: Template): void {
    // @ts-expect-error TS(7006): Parameter 'prop' implicitly has an 'any' type.
    const propertyDiscriminators = new Set<string>(template.allProperties.map(prop => prop.name));

    const missingDiscriminator = this.commonPropertiesDiscriminators.find(
      discriminator => !propertyDiscriminators.has(discriminator)
    );

    if (missingDiscriminator) {
      throw new TemplateWithMissingCommonProperty(missingDiscriminator);
    }
  }
}

export { TemplateWithMissingCommonPropertyValidator };
