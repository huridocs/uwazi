import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { z } from 'zod';
import { PropertyName } from './PropertyName';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeInvalidTypeError } from './errors';
import { PropertyTypeEnum } from './PropertyType';
import { NestedEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.Nested;
  nestedProperties?: string[];
} & Omit<FilterablePropertyProps, 'type'>;

const BaseMetadataValueSchema = z.object({
  value: z.any(),
  label: z.string().optional(),
});

const EntrySchema = z.object({
  value: z.union([z.record(z.string(), z.array(BaseMetadataValueSchema)), z.null()]),
});

const createSchema = (isRequired: boolean) =>
  z.array(EntrySchema).min(isRequired ? 1 : 0, 'Nested Property is required');

class NestedProperty extends FilterableProperty {
  nestedProperties: string[];

  constructor(props: Props, context?: Context) {
    const name =
      props.name ||
      PropertyName.fromLabel(`${props.label}_${PropertyTypeEnum.Nested}`, context).value;

    super({ ...props, name, type: props.type || PropertyTypeEnum.Nested }, context);

    this.nestedProperties = props.nestedProperties || [];
  }

  protected validateNestedProperty() {
    if (this.type !== PropertyTypeEnum.Nested) {
      throw new PropertyTypeInvalidTypeError(this.type, 'NestedProperty');
    }
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<NestedEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<NestedEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(value);

    return {
      name: this.name,
      value: parsed as NestedEntry[], // Todo: fix type issue
      type: this.type,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<NestedEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false).parse(value);
  }
}

export { NestedProperty };
export type { Props as NestedPropertyProps };
