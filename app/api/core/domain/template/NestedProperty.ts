import { Context, Property, PropertyProps } from '#api/templates.v2/model/Property.js';

import { propertyTypes } from '#shared/propertyTypes.js';
import { PropertyName } from './PropertyName';

class NestedProperty extends Property {
  constructor(props: PropertyProps, context?: Context) {
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
      value: parsed as NestedEntry[], // Todo: fix type issue
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
