import { z } from 'zod';
import {
  Property,
  PropertyProps,
  Context,
  CreatePropertyAssignmentInput,
} from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from './errors.js';
import { PropertyTypeEnum } from './PropertyType.js';
import { LinkEntry, PropertyAssignment } from './PropertyValue.js';

type Props = {
  type?: PropertyTypeEnum.Link;
} & Omit<PropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.object({
    url: z.string().url('Link Property value must be a valid URL.'),
    label: z.string().optional(),
  }),
});

const createSchema = (shouldValidateForRequired = false) =>
  z
    .array(EntrySchema)
    .min(shouldValidateForRequired ? 1 : 0, 'Link Property is required')
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

  get isTranslatable(): boolean {
    return true;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<LinkEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<LinkEntry> {
    let parsed = value.filter(v => v?.value?.url?.trim()?.length);

    if (shouldValidateForRequired) {
      parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(parsed);
    }

    return {
      name: this.name,
      value: parsed,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<LinkEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { LinkProperty };
export type { Props as LinkPropertyProps };
