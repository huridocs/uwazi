// @ts-expect-error TS(2307): Cannot find module '../templates.v2/contracts/Temp... Remove this comment to see the full error message
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, Property } from 'api/templates.v2/model/Property.js';
import { PropertyFactoryCreateInput } from '../PropertyFactory';

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

    // @ts-expect-error TS(7006): Parameter 't' implicitly has an 'any' type.
    templates.forEach(t => t.ensurePropertyIsConsistent(property));
  }
}

export { AbstractPropertyCreatorService };
export type { Input as CreateInput, Deps as AbstractPropertyCreatorServiceDeps };
