import { PropertySchema } from 'shared/types/commonTypes';

type PropertyTypes = PropertySchema['type'];

type PropertyUpdateInfo = {
  id: string;
  updatedAttributes: string[];
  oldProperty: Property;
  newProperty: Property;
};

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

  updatedAttributes(other: Property): PropertyUpdateInfo {
    if (!this.isSame(other)) throw new Error('Trying to compare different properties.');
    if (this.type !== other.type) throw new Error("Can't change property types.");

    const updateInfo: PropertyUpdateInfo = {
      id: this.id,
      oldProperty: this,
      newProperty: other,
      updatedAttributes: [],
    };

    if (this.name !== other.name) updateInfo.updatedAttributes.push('name');
    if (this.label !== other.label) updateInfo.updatedAttributes.push('label');
    if (this.template !== other.template) updateInfo.updatedAttributes.push('template');

    return updateInfo;
  }
}

export { Property };
export type { PropertyTypes, PropertyUpdateInfo };
