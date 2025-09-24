// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, Property, PropertyProps, PropertyTypes } from 'api/templates.v2/model/Property.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/propertyTypes.js'... Remove this comment to see the full error message
import { propertyTypes } from 'shared/propertyTypes.js';
import { PropertyName } from './PropertyName';
import { PropertyTypeInvalidTypeError } from './errors';

type Props = {
  type?: PropertyTypes;
} & Omit<PropertyProps, 'type'>;

class GeolocationProperty extends Property {
  constructor(props: Props, context?: Context) {
    const name =
      props.name ||
      PropertyName.fromLabel(`${props.label}_${propertyTypes.geolocation}`, context).value;

    super({ ...props, type: props.type || 'geolocation', name }, context);

    this.validate();
  }

  protected validate() {
    // @ts-expect-error TS(2339): Property 'type' does not exist on type 'Geolocatio... Remove this comment to see the full error message
    if (this.type !== 'geolocation') {
      // @ts-expect-error TS(2339): Property 'type' does not exist on type 'Geolocatio... Remove this comment to see the full error message
      throw new PropertyTypeInvalidTypeError(this.type, 'GeolocationProperty');
    }
  }
}

export { GeolocationProperty };
export type { Props as GeolocationPropertyProps };
