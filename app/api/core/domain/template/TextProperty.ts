import { Context, PropertyTypes } from '#api/templates.v2/model/Property.js';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { PropertyAssignment, TextPropertyValue } from './PropertyValue';

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
    const parsedValue = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.trim()?.length)
    );

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
