import { BasePropertyProcessor } from './BasePropertyProcessor';
import { AdapterMetadataProperty } from './types';

export class DefaultPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'DefaultPropertyProcessor';

  readonly propertyTypes: string[] = ['any'];

  protected formatProperty(property: AdapterMetadataProperty, _context: any): any[] {
    return this.createRawValues(property);
  }

  protected createRawValues(property: AdapterMetadataProperty): any[] {
    const values = Array.isArray(property.value) ? property.value : [property.value];
    return values.map((value: any) => {
      if (!value) {
        return {
          value,
          displayValue: '',
        };
      }

      const stringValue = value.value || value;
      let { label } = value;

      if (!label) {
        label =
          typeof stringValue === 'string'
            ? stringValue
            : stringValue?.label || stringValue?.toString() || '';
      }

      return {
        value: stringValue,
        label,
        displayValue: label,
        ...value, // Preserve any additional properties
      };
    });
  }
}
