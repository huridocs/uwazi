import { TemplatesDataSource } from '../contracts/TemplatesDataSource';
import { Context, Property } from '../../domain/template/Property';
import { PropertyFactoryCreateInput } from '../../domain/template/PropertyFactory';

type Deps<ExtendedDeps> = {
  templatesDS: TemplatesDataSource;
} & ExtendedDeps;

type Input = PropertyFactoryCreateInput;

abstract class AbstractPropertyCreatorService<ExtendedDeps = {}> {
  constructor(protected deps: Deps<ExtendedDeps>) {}

  async create(input: Input, context: Context): Promise<Property> {
    const property = await this.createProperty(input, context);

    await this.validate(property);

    return property;
  }

  protected abstract createProperty(input: Input, context: Context): Promise<Property>;

  private async validate(property: Property) {
    const templates = await this.deps.templatesDS.getTemplatesByPropertyName(property);

    templates.forEach(t => t.ensurePropertyIsConsistent(property));
  }
}

export { AbstractPropertyCreatorService };
export type { Input as CreateInput, Deps as AbstractPropertyCreatorServiceDeps };
