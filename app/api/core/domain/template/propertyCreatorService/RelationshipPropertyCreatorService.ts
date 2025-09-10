import { Property } from 'api/templates.v2/model/Property';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService';
import { PropertyFactory } from '../PropertyFactory';

class RelationshipPropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput): Promise<Property> {
    // Relationship Properties should have a valid Relationship Type and Template as target

    return PropertyFactory.create(input);
  }
}

export { RelationshipPropertyCreatorService };
