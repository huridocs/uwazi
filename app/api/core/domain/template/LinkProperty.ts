import {
  Property,
  PropertyProps,
  Context,
  CreatePropertyAssignmentInput,
} from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';
import { LinkEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Link;
} & Omit<PropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.object({
    url: z.string().url('Link Property value must be a valid URL.'),
    label: z.string().optional(),
  }),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Link Property is required')
    .max(1, 'Link Property only accepts a single value.');

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
    const parsed = createSchema(this.required).parse(value);

    return {
      name: this.name,
      value: parsed,
      type: this.type,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<LinkEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { LinkProperty };
export type { Props as LinkPropertyProps };
