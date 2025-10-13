import { DefaultPropertyTypes } from 'app/V2/domain/entities/types';
import { BasePropertyProcessor } from './BasePropertyProcessor';
import { PropertyValue } from './types';

export class DefaultPropertyProcessor extends BasePropertyProcessor {
  readonly name = 'DefaultPropertyProcessor';
  readonly propertyTypes: DefaultPropertyTypes[] = ['any'];

  protected formatProperty(property: PropertyValue, _context: any): any[] {
    return this.createRawValues(property);
  }

  protected createRawValues(property: PropertyValue): PropertyValue[] {
    const values = Array.isArray(property.value) ? property.value : [property.value];
    return values.map((value: any) => {
      if (!value) {
        return {
          value,
          displayValue: '',
        };
      }

      const stringValue = value.value || value;
      let label = value.label;

      if (!label) {
        if (typeof stringValue === 'string') {
          label = stringValue;
        } else if (stringValue && typeof stringValue === 'object') {
          // Handle link objects with label and url
          if (stringValue.label) {
            label = stringValue.label;
          } else if (stringValue.url) {
            label = stringValue.url;
          } else {
            // For empty objects or objects without useful properties, show empty string
            if (Object.keys(stringValue).length === 0) {
              label = '';
            } else {
              label = stringValue.toString();
            }
          }
        } else {
          label = stringValue.toString();
        }
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
