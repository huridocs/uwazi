import { Context, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors.js';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty.js';
import { PropertyTypeEnum } from './PropertyType.js';
import { DateRangeEntry, PropertyAssignment } from './PropertyValue.js';

type Props = {
  type?: PropertyTypeEnum.DateRange;
} & Omit<FilterablePropertyProps, 'type'>;

const RangeSchema = z
  .object({
    from: z
      .number({ required_error: 'Date Range Property "from" value must be provided.' })
      .nullable(),
    to: z.number({ required_error: 'Date Range Property "to" value must be provided.' }).nullable(),
  })
  .superRefine((range, ctx) => {
    if (range.from === null && range.to === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date Range Property requires at least one of "from" or "to".',
      });
    }
    if (range.from !== null && range.to !== null && range.to < range.from) {
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

  get isTranslatable(): boolean {
    return false;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<DateRangeEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<DateRangeEntry> {
    const parsedValue = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.from != null || v?.value?.to != null)
    );

    return {
      name: this.name,
      value: parsedValue,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<DateRangeEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { DateRangeProperty };
export type { Props as DateRangePropertyProps };
