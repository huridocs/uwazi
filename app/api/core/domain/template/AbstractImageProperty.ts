// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context, Property, PropertyProps } from 'api/templates.v2/model/Property.js';
import { InvalidStyleTypeError } from './errors';

enum ImageStyle {
  Cover = 'cover',
  Contain = 'contain',
}

type Props = {
  style?: ImageStyle;
  fullWidth?: boolean;
} & PropertyProps;

abstract class AbstractImageProperty extends Property {
  style: ImageStyle;

  fullWidth?: boolean;

  constructor(props: Props, context?: Context) {
    super(props, context);
    this.style = props.style || ImageStyle.Cover;
    this.fullWidth = props.fullWidth || false;

    this.validate();
  }

  protected validate() {
    if (![ImageStyle.Cover, ImageStyle.Contain].includes(this.style)) {
      throw new InvalidStyleTypeError(this.style);
    }
  }
}

export { AbstractImageProperty, ImageStyle };
export type { Props as AbstractImagePropertyProps };
