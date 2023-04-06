import { PropertySchema } from 'shared/types/commonTypes';

type PropertyTypes = PropertySchema['type'];

class Property {
  readonly id: string;

  readonly type: PropertyTypes;

  readonly name: string;

  readonly label: string;

  readonly template: string;

  constructor(id: string, type: PropertyTypes, name: string, label: string, template: string) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.label = label;
    this.template = template;
  }

  isSame(other: Property) {
    return this.id === other.id;
  }
}

export { Property };
export type { PropertyTypes };
