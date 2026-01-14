import { Context, PropertyTypes } from '#api/templates.v2/model/Property.js';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { MarkdownEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Markdown;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.string().trim(),
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

  get isTranslatable(): boolean {
    return true;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<MarkdownEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<MarkdownEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.trim()?.length)
    );

    return {
      name: this.name,
      value: parsed,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<MarkdownEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { MarkdownProperty };
export type { Props as MarkdownPropertyProps };
