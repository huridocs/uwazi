import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { generateID } from 'shared/IDGenerator';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { GeneratedIdEntry, PropertyAssignment } from './PropertyValue';

type Props = {
  type?: PropertyTypeEnum.GeneratedId;
} & Omit<FilterablePropertyProps, 'type'>;

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
  }: CreatePropertyAssignmentInput<GeneratedIdEntry>): PropertyAssignment {
    return {
      name: this.name,
      type: this.type,
      value: value?.length ? value : [{ value: generateID(3, 4, 4) }], // Todo: Internalize ID generation
    };
  }
}

export { GenerateIdProperty };
export type { Props as GenerateIdPropertyProps };
