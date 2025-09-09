import { CommonPropertyInvalidError } from 'api/core/domain/template/errors';
import { Property, PropertyProps } from './Property';

type Props = {
  isCommonProperty?: boolean;
} & PropertyProps;

class CommonProperty extends Property {
  isCommonProperty: boolean;

  constructor(props: Props) {
    super(props);
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
