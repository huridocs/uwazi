import { Context, Property } from '../../domain/template/Property.js';
import { PropertyFactory } from '../../domain/template/PropertyFactory.js';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService.js';

class PropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput, context: Context): Promise<Property> {
    return PropertyFactory.create(input, context);
  }
}

export { PropertyCreatorService };
