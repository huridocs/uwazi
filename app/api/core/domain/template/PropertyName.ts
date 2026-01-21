import { Context } from '#api/core/domain/template/Property.js';
import { safeName } from '#api/core/domain/template/utils/propertyNameGeneration.js';

class PropertyName {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  static fromLabel(label: string, context?: Context) {
    return new PropertyName(safeName(label, context?.newNameGeneration));
  }
}

export { PropertyName };
