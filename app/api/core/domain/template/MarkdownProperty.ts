import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { MarkdownEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Markdown;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.string().trim().min(1, 'Markdown Property must be a non-empty string.'),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Markdown Property is required')
    .max(1, 'Markdown Property only accepts a single value.');

class MarkdownProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Markdown }, context);
    this.compatibleTypes = ['text'];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Markdown) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MarkdownProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<MarkdownEntry>): PropertyAssignment<MarkdownEntry> {
    const parsed = createSchema(this.required).parse(value);

    return {
      name: this.name,
      value: parsed,
      type: this.type,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<MarkdownEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { MarkdownProperty };
export type { Props as MarkdownPropertyProps };
