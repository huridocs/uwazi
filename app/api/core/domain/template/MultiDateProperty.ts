import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { DateEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.MultiDate;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.number({ required_error: 'Multi Date Property value is required' }),
});

const createSchema = (isRequired: boolean) =>
  z.array(EntrySchema).min(isRequired ? 1 : 0, 'Multi Date Property is required');

class MultiDateProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.MultiDate }, context);
    this.compatibleTypes = ['date'];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.MultiDate) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<DateEntry>): PropertyAssignment<DateEntry> {
    const parsed = createSchema(this.required).parse(value);

    return {
      name: this.name,
      value: parsed,
      type: this.type,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<DateEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { MultiDateProperty };
export type { Props as MultiDatePropertyProps };
