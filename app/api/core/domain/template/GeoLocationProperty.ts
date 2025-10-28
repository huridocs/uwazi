import {
  Context,
  CreatePropertyAssignmentInput,
  Property,
  PropertyProps,
} from 'api/core/domain/template/Property';
import { PropertyName } from './PropertyName';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';
import { GeolocationEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Geolocation;
} & Omit<PropertyProps, 'type'>;

class GeolocationProperty extends Property {
  constructor(props: Props, context?: Context) {
    const name =
      props.name ||
      PropertyName.fromLabel(`${props.label}_${PropertyTypeEnum.Geolocation}`, context).value;

    super({ ...props, type: props.type || PropertyTypeEnum.Geolocation, name }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Geolocation) {
      throw new PropertyTypeInvalidTypeError(this.type, 'GeolocationProperty');
    }
  }

  // Todo: help about business rules for geolocation property
  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<GeolocationEntry>): PropertyAssignment<GeolocationEntry> {
    const cleaned = value.filter(v => v?.value);

    if (this.required && cleaned.length === 0) {
      throw new Error('Geolocation Property is required');
    }

    return {
      name: this.name,
      value: cleaned,
      type: this.type,
    };
  }
}

export { GeolocationProperty };
export type { Props as GeolocationPropertyProps };
