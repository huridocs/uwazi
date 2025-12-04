import { Context } from 'api/core/domain/template/Property';
import { safeName } from './utils/propertyNameGeneration';

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
