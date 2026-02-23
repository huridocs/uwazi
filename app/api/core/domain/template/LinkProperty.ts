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

const createSchema = () =>
  z
    .array(EntrySchema)
    .min(1, 'Link Property is required')
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
    let parsed;

    if (shouldValidateForRequired) {
      parsed = createSchema().parse(value.filter(v => v?.value?.url?.trim()?.length));
    } else {
      parsed = value.filter(v => v?.value?.url?.trim()?.length);
    }

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
    if (shouldValidateForRequired) {
      createSchema().parse(value);
    }
  }
}

export { LinkProperty };
export type { Props as LinkPropertyProps };
