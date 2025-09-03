import { Property, PropertyProps } from 'api/templates.v2/model/Property';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertyName } from './PropertyName';

class NestedProperty extends Property {
  constructor(props: PropertyProps) {
    super(props);

    const name = props.name
      ? new PropertyName(props.name)
      : PropertyName.fromLabel(`${props.label}_${propertyTypes.nested}`);

    this.name = name;
  }
}

export { NestedProperty };
