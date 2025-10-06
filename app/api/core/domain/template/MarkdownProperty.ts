import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  type?: PropertyTypes;
} & Omit<FilterablePropertyProps, 'type'>;

class MarkdownProperty extends FilterableProperty {
  private static COMPATIBLE_TYPES: PropertyTypes[] = ['markdown', 'text'];

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || 'markdown' }, context);

    this.validate();
  }

  protected validate() {
    if (this.type !== 'markdown') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MarkdownProperty');
    }
  }

  protected isTypeEqual(type: PropertyTypes): boolean {
    return MarkdownProperty.COMPATIBLE_TYPES.includes(type);
  }
}

export { MarkdownProperty };
export type { Props as MarkdownPropertyProps };
