import { CommonPropertyInvalidError } from 'api/core/domain/template/errors';
import { Context, Property, PropertyProps } from './Property';

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
