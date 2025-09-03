import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Property } from 'api/templates.v2/model/Property';
import { PropertyFactoryCreateInput } from '../PropertyFactory';

type Deps = {
  templatesDS: TemplatesDataSource;
};

type Input = PropertyFactoryCreateInput;

abstract class AbstractPropertyCreatorService {
  constructor(private deps: Deps) {}

  async create(input: Input): Promise<Property> {
    const property = await this.createProperty(input);

    await this.validate(property);

    return property;
  }

  abstract createProperty(input: Input): Promise<Property>;

  private async validate(property: Property) {
    const isUnique = await this.deps.templatesDS.isPropertyUnique(property);

    if (!isUnique) {
      throw new Error(`The following Property is duplicated. label = ${property.label}`);
    }
  }
}

export { AbstractPropertyCreatorService };
export type { Input as CreateInput };
