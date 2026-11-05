import { safeName } from './utils/propertyNameGeneration.js';

class PropertyName {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  static fromLabel(label: string) {
    return new PropertyName(safeName(label));
  }
}

export { PropertyName };
