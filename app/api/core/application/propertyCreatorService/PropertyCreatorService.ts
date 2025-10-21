import { Context, Property } from '../../domain/template/Property';
import { PropertyFactory } from '../../domain/template/PropertyFactory';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService';

class PropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput, context: Context): Promise<Property> {
    return PropertyFactory.create(input, context);
  }
}

export { PropertyCreatorService };
