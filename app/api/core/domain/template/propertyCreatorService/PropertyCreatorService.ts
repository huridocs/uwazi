// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, Property } from 'api/templates.v2/model/Property.js';
import { AbstractPropertyCreatorService, CreateInput } from './AbstractPropertyCreatorService';
import { PropertyFactory } from '../PropertyFactory';

class PropertyCreatorService extends AbstractPropertyCreatorService {
  // eslint-disable-next-line class-methods-use-this
  async createProperty(input: CreateInput, context: Context): Promise<Property> {
    return PropertyFactory.create(input, context);
  }
}

export { PropertyCreatorService };
