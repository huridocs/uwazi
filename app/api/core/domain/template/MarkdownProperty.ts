import { Context } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';

type Props = {
  type?: PropertyTypeEnum.Markdown;
} & Omit<FilterablePropertyProps, 'type'>;

class MarkdownProperty extends FilterableProperty {
  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Markdown }, context);
    this.compatibleTypes = ['text'];

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Markdown) {
      throw new PropertyTypeInvalidTypeError(this.type, 'MarkdownProperty');
    }
  }
}

export { MarkdownProperty };
export type { Props as MarkdownPropertyProps };
