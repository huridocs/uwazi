import {
  Context,
  CreatePropertyAssignmentInput,
  Property,
  PropertyProps,
} from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyName } from './PropertyName';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';
import { GeolocationEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Geolocation;
} & Omit<PropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.object({
    lat: z.number({ required_error: 'Geolocation Property latitude must be provided.' }),
    lon: z.number({ required_error: 'Geolocation Property longitude must be provided.' }),
    label: z.string().optional(),
  }),
});

const createSchema = (isRequired: boolean) =>
  z.array(EntrySchema).min(isRequired ? 1 : 0, 'Geolocation Property is required');

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

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<GeolocationEntry>): PropertyAssignment<GeolocationEntry> {
    const parsed = createSchema(this.required).parse(value);

    return {
      name: this.name,
      value: parsed,
      type: this.type,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<GeolocationEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { GeolocationProperty };
export type { Props as GeolocationPropertyProps };
