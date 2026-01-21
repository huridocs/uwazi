import { Context, Property } from '#api/core/domain/template/Property.js';
import { AbstractPropertyCreatorService, CreateInput } from '#api/core/application/propertyCreatorService/AbstractPropertyCreatorService.js';
import { PropertyFactory } from '#api/core/domain/template/PropertyFactory.js';

class PropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput, context: Context): Promise<Property> {
    return PropertyFactory.create(input, context);
  }
}

export { PropertyCreatorService };
