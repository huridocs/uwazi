import { BasePropertyProcessor } from './BasePropertyProcessor';

export class DefaultPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'DefaultPropertyProcessor';
  readonly propertyTypes = ['any'];

  protected formatProperty(property: any, _context: any): any[] {
    return this.createRawValues(property);
  }
}
