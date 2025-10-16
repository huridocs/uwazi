import { CommonProperty, CommonPropertyProps } from 'api/core/domain/template/CommonProperty';
import { Context } from 'api/core/domain/template/Property';
import { TitlePropertyInvalidNameError, PropertyTypeInvalidTypeError } from './errors';
import { PropertyType } from './PropertyType';

type Props = { prioritySorting?: boolean; generatedId?: boolean; type?: PropertyType } & Omit<
  CommonPropertyProps,
  'type'
>;

class TitleProperty extends CommonProperty {
  prioritySorting: boolean;

  generatedId: boolean;

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'text', name: props.name || 'title' }, context);
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
