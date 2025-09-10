import { PropertyName } from 'api/core/domain/template/PropertyName';
import { PropertySchema } from 'shared/types/commonTypes';

type PropertyTypes = PropertySchema['type'];

type PropertyUpdateInfo = {
  id: string;
  updatedAttributes: string[];
  oldProperty: Property;
  newProperty: Property;
};

type Props = {
  id: string;
  type: PropertyTypes;
  template: string;
  name?: string;
  label: string;
  required?: boolean;
  showInCard?: boolean;
  noLabel?: boolean;
};

class Property {
  readonly id: string;

  readonly type: PropertyTypes;

  private _name: PropertyName;

  readonly label: string;

  readonly template: string;

  required: boolean;

  noLabel: boolean;

  showInCard: boolean;

  constructor(props: Props) {
    this.id = props.id;
    this.type = props.type;
    this.label = props.label;
    this.template = props.template;
    this._name = props.name ? new PropertyName(props.name) : PropertyName.fromLabel(this.label);
    this.required = props.required || false;
    this.noLabel = props.noLabel || false;
    this.showInCard = props.showInCard || false;
  }

  get discriminator() {
    return `${this.name}:${this.type}`;
  }

  get name() {
    return this._name.value;
  }

  isSame(other: Property) {
    return this.id === other.id;
  }

  equals(other: Property) {
    return this.discriminator === other.discriminator;
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
export type { PropertyTypes, PropertyUpdateInfo, Props as PropertyProps };
