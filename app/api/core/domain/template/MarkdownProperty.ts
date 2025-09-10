import { PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class MarkdownProperty extends FilterableProperty {
  constructor(props: Props) {
    super({ ...props, type: props.type || 'markdown' });

    this.validate();
  }

  protected validate() {
    if (this.type !== 'markdown') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MarkdownProperty');
    }
  }
}

export { MarkdownProperty };
export type { Props as MarkdownPropertyProps };
