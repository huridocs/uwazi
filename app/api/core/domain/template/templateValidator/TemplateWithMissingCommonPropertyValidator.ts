import { Template } from '#api/core/domain/template/Template.js';
import { ValidationStep } from '#api/core/domain/Validator.js';
import { TemplateWithMissingCommonProperty } from '#api/core/domain/template/errors.js';

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
