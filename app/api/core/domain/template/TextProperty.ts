import { Context, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors.js';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty.js';
import { PropertyTypeEnum } from './PropertyType.js';
import { PropertyAssignment, TextPropertyValue } from './PropertyValue.js';

type Props = {
  type?: PropertyTypeEnum.Text;
  generatedId?: boolean;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.string().trim(),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Text Property is required')
    .max(1, 'Text Property only accepts a single value.');

class TextProperty extends FilterableProperty {
  generatedId: boolean;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Text }, context);
    this.generatedId = props.generatedId || false;
    this.compatibleTypes = ['markdown'];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Text) {
      throw new PropertyTypeInvalidTypeError(this.type, 'TextProperty');
    }
  }

  get isTranslatable(): boolean {
    return true;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<TextPropertyValue>,
    shouldValidateForRequired = false
  ) {
    const isRequired = shouldValidateForRequired ? this.required : false;
    // For required validation, filter out empty/whitespace-only values so the array-level
    // .min(1) check correctly rejects them. For non-required, only strip null/undefined
    // to preserve { value: '' } (V1-compatible behavior).
    const filtered = isRequired
      ? value.filter(v => v?.value?.trim()?.length)
      : value.filter(v => v?.value != null);
    const parsedValue = createSchema(isRequired).parse(filtered);

    return {
      name: this.name,
      type: this.type,
      value: parsedValue,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<TextPropertyValue>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { TextProperty };
export type { Props as TextPropertyProps };
