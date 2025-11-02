import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { generateID } from 'shared/IDGenerator';
import { z } from 'zod';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { GeneratedIdEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.GeneratedId;
} & Omit<FilterablePropertyProps, 'type'>;

const EntrySchema = z.object({
  value: z.string({ required_error: 'Generated ID Property value must be provided.' }),
});

const createSchema = (isRequired: boolean) =>
  z
    .array(EntrySchema)
    .min(isRequired ? 1 : 0, 'Generated ID Property is required')
    .max(1, 'Generated ID Property only accepts a single value.');

class GenerateIdProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.GeneratedId }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.GeneratedId) {
      throw new PropertyTypeInvalidTypeError(this.type, 'GenerateIdProperty');
    }
  }

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<GeneratedIdEntry>): PropertyAssignment<GeneratedIdEntry> {
    const parsedValue = createSchema(this.required).parse(
      value?.length ? value : [{ value: generateID(3, 4, 4) }] // Todo: Internalize ID generation
    );

    return {
      name: this.name,
      type: this.type,
      value: parsedValue,
    };
  }

  validatePropertyAssignment({ value }: PropertyAssignment<GeneratedIdEntry>): void {
    createSchema(this.required).parse(value);
  }
}

export { GenerateIdProperty };
export type { Props as GenerateIdPropertyProps };
