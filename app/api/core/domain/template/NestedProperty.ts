import { Context, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { z } from 'zod';
import { PropertyName } from '#api/core/domain/template/PropertyName.js';
import {
  FilterableProperty,
  FilterablePropertyProps,
} from '#api/core/domain/template/FilterableProperty.js';
import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { NestedEntry, PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';

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
  label: z.string().optional(),
});

const createSchema = (required: boolean) => z.array(EntrySchema).min(required ? 1 : 0);

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

  get isTranslatable(): boolean {
    return false;
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<NestedEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<NestedEntry> {
    const parsed = createSchema(shouldValidateForRequired ? this.required : false).parse(value);

    return {
      name: this.name,
      value: parsed as NestedEntry[],
      type: this.type,
      isTranslatable: this.isTranslatable,
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
