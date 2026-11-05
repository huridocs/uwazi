import { Property } from '../../domain/template/Property.js';
import { PropertyFactory } from '../../domain/template/PropertyFactory.js';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService.js';

class PropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput): Promise<Property> {
    return PropertyFactory.create(input);
  }
}

export { PropertyCreatorService };
