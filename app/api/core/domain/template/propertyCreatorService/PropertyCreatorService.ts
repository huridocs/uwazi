import { Context, Property } from 'api/templates.v2/model/Property';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService';
import { PropertyFactory } from '../PropertyFactory';

class PropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput, context: Context): Promise<Property> {
    return PropertyFactory.create(input, context);
  }
}

export { PropertyCreatorService };
