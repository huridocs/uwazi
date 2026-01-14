import { Context } from '#api/templates.v2/model/Property.js';

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
