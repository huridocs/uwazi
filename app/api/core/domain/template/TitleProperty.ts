import { CommonProperty, CommonPropertyProps } from 'api/templates.v2/model/CommonProperty';
import { PropertyTypes } from 'api/templates.v2/model/Property';
import { TitlePropertyInvalidNameError, PropertyTypeInvalidTypeError } from './errors';

type Props = { prioritySorting?: boolean; generatedId?: boolean; type?: PropertyTypes } & Omit<
  CommonPropertyProps,
  'type'
>;

class TitleProperty extends CommonProperty {
  prioritySorting: boolean;

  generatedId: boolean;

  constructor(props: Props) {
    super({ ...props, type: props.type || 'text', name: props.name || 'title' });
    this.prioritySorting = props.prioritySorting || false;
    this.generatedId = props.generatedId || false;

    this.validate();
  }

  protected validate() {
    if (this.type !== 'text') {
      throw new PropertyTypeInvalidTypeError(this.type, 'TitleProperty');
    }

    if (this.name !== 'title') {
      throw new TitlePropertyInvalidNameError(this.name);
    }
  }
}

export { TitleProperty };
export type { Props as TitlePropertyProps };
