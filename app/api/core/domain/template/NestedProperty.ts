// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, Property, PropertyProps } from 'api/templates.v2/model/Property.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/propertyTypes.js'... Remove this comment to see the full error message
import { propertyTypes } from 'shared/propertyTypes.js';
import { PropertyName } from './PropertyName';

class NestedProperty extends Property {
  constructor(props: PropertyProps, context?: Context) {
    const name =
      props.name || PropertyName.fromLabel(`${props.label}_${propertyTypes.nested}`, context).value;

    super({ ...props, name }, context);
  }
}

export { NestedProperty };
