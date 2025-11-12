import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { DateRangeEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.DateRange;
} & Omit<FilterablePropertyProps, 'type'>;

const RangeSchema = z
  .object({
    from: z.number({ required_error: 'Date Range Property "from" value must be provided.' }),
    to: z.number({ required_error: 'Date Range Property "to" value must be provided.' }),
  })
  .superRefine((range, ctx) => {
    if (range.to < range.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date Range Property "to" cannot be before "from".',
        path: ['to'],
      });
    }
  });

const EntrySchema = z.object({
  value: RangeSchema,
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Date Range Property is required')
    .max(1, 'Date Range Property only accepts a single value.');

class DateRangeProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.DateRange }, context);
    this.compatibleTypes = [PropertyTypeEnum.MultiDateRange];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.DateRange) {
      throw new PropertyTypeInvalidTypeError(this.type, 'DateRangeProperty');
    }
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<DateRangeEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<DateRangeEntry> {
    const parsedValue = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value
    );

    return {
      name: this.name,
      value: parsedValue,
      type: this.type,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<DateRangeEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { DateRangeProperty };
export type { Props as DateRangePropertyProps };
