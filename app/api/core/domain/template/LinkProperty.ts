import {
  Property,
  PropertyProps,
  Context,
  CreatePropertyAssignmentInput,
} from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';
import { LinkEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Link;
} & Omit<PropertyProps, 'type'>;

class LinkProperty extends Property {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Link }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Link) {
      throw new PropertyTypeInvalidTypeError(this.type, 'LinkProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<LinkEntry>): PropertyAssignment<LinkEntry> {
    if (value.length > 1) {
      throw new Error(`Link Property only accepts a single value. ${JSON.stringify(value)} given.`);
    }

    const isValid = value?.[0]?.value?.url !== undefined && value?.[0]?.value?.url !== null;

    if (this.required && !isValid) {
      throw new Error('Link Property is required');
    }

    return {
      name: this.name,
      value: isValid ? [{ value: value[0].value }] : [],
      type: this.type,
    };
  }
}

export { LinkProperty };
export type { Props as LinkPropertyProps };
