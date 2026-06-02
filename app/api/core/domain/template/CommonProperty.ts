import { CommonPropertyInvalidError } from './errors.js';
import { Context, Property, PropertyProps } from './Property.js';

type Props = {
  isCommonProperty?: boolean;
} & PropertyProps;

class CommonProperty extends Property {
  isCommonProperty: boolean;

  constructor(props: Props, context?: Context) {
    super(props, context);
    this.isCommonProperty = props.isCommonProperty ?? true;

    this.validate();
  }

  protected validate() {
    if (this.isCommonProperty === false) {
      throw new CommonPropertyInvalidError();
    }
  }
}

export { CommonProperty };
export type { Props as CommonPropertyProps };
