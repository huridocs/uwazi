import { Property } from 'api/templates.v2/model/Property';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService';
import { PropertyFactory } from '../PropertyFactory';

class PropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput): Promise<Property> {
    return PropertyFactory.create(input);
  }
}

export { PropertyCreatorService };
