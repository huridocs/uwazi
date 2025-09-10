import { FieldIsRequiredError, PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  content: string;
  type?: 'select';
} & Omit<FilterablePropertyProps, 'type'>;

class SelectProperty extends FilterableProperty {
  content: string; // Keeping name wrong for backwards compatibility. This is Thesaurus id

  constructor(props: Props) {
    super({ ...props, type: props.type || 'select' });
    this.content = props.content;

    this.validate();
  }

  protected validate() {
    if (this.type !== 'select') {
      throw new PropertyTypeInvalidTypeError(this.type, 'SelectProperty');
    }

    if (!this?.content?.length) {
      throw new FieldIsRequiredError('content');
    }
  }
}

export { SelectProperty };
export type { Props as SelectPropertyProps };
