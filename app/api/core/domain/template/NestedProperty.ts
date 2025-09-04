import { Property, PropertyProps } from 'api/templates.v2/model/Property';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertyName } from './PropertyName';

class NestedProperty extends Property {
  constructor(props: PropertyProps) {
    const name =
      props.name || PropertyName.fromLabel(`${props.label}_${propertyTypes.nested}`).value;

    super({ ...props, name });
  }
}

export { NestedProperty };
