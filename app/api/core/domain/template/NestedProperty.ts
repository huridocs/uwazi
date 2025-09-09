import { Context, Property, PropertyProps } from 'api/templates.v2/model/Property';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertyName } from './PropertyName';

class NestedProperty extends Property {
  constructor(props: PropertyProps, context?: Context) {
    const name =
      props.name || PropertyName.fromLabel(`${props.label}_${propertyTypes.nested}`, context).value;

    super({ ...props, name }, context);
  }
}

export { NestedProperty };
