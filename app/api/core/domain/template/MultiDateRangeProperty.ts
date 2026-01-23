import { z } from 'zod';
import { Context, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import {
  FilterableProperty,
  FilterablePropertyProps,
} from '#api/core/domain/template/FilterableProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { DateRangeEntry, PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';

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

  get isTranslatable(): boolean {
    return false;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<DateRangeEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<DateRangeEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(
      value.filter(v => v?.value?.from?.toString()?.length && v?.value?.to?.toString()?.length)
    );

    return {
      name: this.name,
      value: parsed,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<DateRangeEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { MultiDateRangeProperty };
export type { Props as MultiDateRangePropertyProps };
