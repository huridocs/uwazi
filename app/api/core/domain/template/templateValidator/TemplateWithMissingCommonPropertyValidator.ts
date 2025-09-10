import { Template } from 'api/templates.v2/model/Template';
import { ValidationStep } from '../../Validator';
import { TemplateWithMissingCommonProperty } from '../errors';

class TemplateWithMissingCommonPropertyValidator implements ValidationStep<Template> {
  private readonly commonPropertiesDiscriminators = ['title', 'creationDate', 'editDate'];

  public validate(template: Template): void {
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
