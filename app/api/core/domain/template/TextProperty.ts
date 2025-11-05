import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { PropertyAssignment, TextPropertyValue } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Text;
  generatedId?: boolean;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.string().trim().min(1, 'Text Property must be a non-empty string.'),
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

  createPropertyAssignment({ value }: CreatePropertyAssignmentInput<TextPropertyValue>) {
    const parsedValue = createSchema(this.required).parse(value);

    return {
      name: this.name,
      type: this.type,
      value: parsedValue,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<TextPropertyValue>): void {
    createSchema(this.required).parse(value);
  }
}

export { TextProperty };
export type { Props as TextPropertyProps };
