import { PropertyTypeMismatchError } from 'api/core/domain/template/errors';
import { PropertyName } from 'api/core/domain/template/PropertyName';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PropertyType } from './PropertyType';
import { PropertyValue, PropertyAssignment } from './PropertyValue';

type PropertyUpdateInfo = {
  id: string;
  updatedAttributes: string[];
  oldProperty: Property;
  newProperty: Property;
};

type Props = {
  id: string;
  type: PropertyType;
  template: string;
  name?: string;
  label: string;
  required?: boolean;
  showInCard?: boolean;
  noLabel?: boolean;
};

type Context = {
  newNameGeneration?: boolean;
};

type CreatePropertyAssignmentInput<T = PropertyValue> = {
  value: T[];
  language?: LanguageISO6391;
};

class Property {
  readonly id: string;

  readonly type: PropertyType;

  private _name: PropertyName;

  readonly label: string;

  readonly template: string;

  required: boolean;

  noLabel: boolean;

  showInCard: boolean;

  protected compatibleTypes: PropertyType[] = [];

  constructor(props: Props, context?: Context) {
    this.id = props.id;
    this.type = props.type;
    this.label = props.label;
    this.template = props.template;
    this._name = props.name
      ? new PropertyName(props.name)
      : PropertyName.fromLabel(this.label, context);
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

  protected isTypeEqual(type: PropertyType): boolean {
    return this.type === type || this.compatibleTypes.includes(type);
  }

  protected isNameEqual(name: string): boolean {
    return this.name === name;
  }

  ensurePropertyIsConsistent(property: Property) {
    if (this.isNameEqual(property.name) && !this.isTypeEqual(property.type)) {
      throw new PropertyTypeMismatchError(this, property);
    }
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

  createDefaultValue(): PropertyAssignment {
    return { name: this.name, value: [], type: this.type };
  }

  createPropertyAssignment({ value }: CreatePropertyAssignmentInput): PropertyAssignment {
    return { name: this.name, value, type: this.type };
  }

  validatePropertyAssignment(_propertyAssignment: PropertyAssignment) {}
}

export { Property };
export type { PropertyUpdateInfo, Props as PropertyProps, Context, CreatePropertyAssignmentInput };
