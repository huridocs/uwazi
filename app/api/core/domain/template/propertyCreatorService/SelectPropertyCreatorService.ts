import { Property } from 'api/templates.v2/model/Property';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService';
import { PropertyFactory } from '../PropertyFactory';

class SelectPropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput): Promise<Property> {
    // Select and MultiSelect Properties should have a valid Thesauri as target

    return PropertyFactory.create(input);
  }
}

export { SelectPropertyCreatorService };
