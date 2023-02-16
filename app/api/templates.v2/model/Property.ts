import { PropertySchema } from 'shared/types/commonTypes';

type PropertyTypes = PropertySchema['type'];

class Property {
  readonly type: PropertyTypes;

  readonly name: string;

  readonly label: string;

  readonly template: string;

  constructor(type: PropertyTypes, name: string, label: string, template: string) {
    this.type = type;
    this.name = name;
    this.label = label;
    this.template = template;
  }
}

export { Property };
export type { PropertyTypes };
