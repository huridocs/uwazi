import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { DateRangeEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.MultiDateRange;
} & Omit<FilterablePropertyProps, 'type'>;

const RangeSchema = z
  .object({
    from: z.number({ required_error: 'Multi Date Range Property "from" value must be provided.' }),
    to: z.number({ required_error: 'Multi Date Range Property "to" value must be provided.' }),
  })
  .superRefine((range, ctx) => {
    if (range.to < range.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Multi Date Range Property "to" cannot be before "from".',
        path: ['to'],
      });
    }
  });

const EntrySchema = z.object({
  value: RangeSchema,
});

const createSchema = (isRequired: boolean) =>
  z.array(EntrySchema).min(isRequired ? 1 : 0, 'Multi Date Range Property is required');

class MultiDateRangeProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.MultiDateRange }, context);
    this.compatibleTypes = [PropertyTypeEnum.DateRange];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.MultiDateRange) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiDateRangeProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<DateRangeEntry>): PropertyAssignment<DateRangeEntry> {
    const parsed = createSchema(this.required).parse(value);

    return {
      name: this.name,
      value: parsed,
      type: this.type,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<DateRangeEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { MultiDateRangeProperty };
export type { Props as MultiDateRangePropertyProps };
