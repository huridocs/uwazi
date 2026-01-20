import { z } from 'zod';
import {
  Context,
  Property,
  PropertyProps,
  PropertyTypes,
  CreatePropertyAssignmentInput,
} from '#api/core/domain/template/Property.js';

import { propertyTypes } from '#shared/propertyTypes.js';
import { PropertyName } from '#api/core/domain/template/PropertyName.js';
import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { GeolocationEntry, PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';

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

  get isTranslatable(): boolean {
    return false;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<GeolocationEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<GeolocationEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.lat?.toString()?.length && v?.value?.lon?.toString()?.length)
    );

    return {
      name: this.name,
      value: parsed,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<GeolocationEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { GeolocationProperty };
export type { Props as GeolocationPropertyProps };
