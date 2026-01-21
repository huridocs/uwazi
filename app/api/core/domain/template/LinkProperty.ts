import { z } from 'zod';
import {
  Property,
  PropertyProps,
  Context,
  CreatePropertyAssignmentInput,
} from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { LinkEntry, PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';

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

  get isTranslatable(): boolean {
    return true;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<LinkEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<LinkEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.url?.trim()?.length)
    );

    return {
      name: this.name,
      value: parsed,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<LinkEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { LinkProperty };
export type { Props as LinkPropertyProps };
