import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Property } from 'api/templates.v2/model/Property';
import { PropertyFactoryCreateInput } from '../PropertyFactory';
import { PropertyNotUniqueOnTheSystemError } from '../errors';

type Deps<ExtendedDeps> = {
  templatesDS: TemplatesDataSource;
} & ExtendedDeps;

type Input = PropertyFactoryCreateInput;

abstract class AbstractPropertyCreatorService<ExtendedDeps = {}> {
  constructor(protected deps: Deps<ExtendedDeps>) {}

  async create(input: Input): Promise<Property> {
    const property = await this.createProperty(input);

    await this.validate(property);

    return property;
  }

  protected abstract createProperty(input: Input): Promise<Property>;

  private async validate(property: Property) {
    const isUnique = await this.deps.templatesDS.isPropertyUnique(property);

    if (!isUnique) {
      throw new PropertyNotUniqueOnTheSystemError(property);
    }
  }
}

export { AbstractPropertyCreatorService };
export type { Input as CreateInput, Deps as AbstractPropertyCreatorServiceDeps };
