import { FieldIsRequiredError, PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  content: string;
  type?: 'multiselect';
} & Omit<FilterablePropertyProps, 'type'>;

class MultiSelectProperty extends FilterableProperty {
  content: string; // Keeping name wrong for backwards compatibility. This is Thesaurus id

  constructor(props: Props) {
    super({ ...props, type: props.type || 'multiselect' });
    this.content = props.content;

    this.validate();
  }

  protected validate() {
    if (this.type !== 'multiselect') {
      throw new PropertyTypeInvalidTypeError(this.type, 'MultiSelectProperty');
    }

    if (!this?.content?.length) {
      throw new FieldIsRequiredError('content');
    }
  }
}

export { MultiSelectProperty };
export type { Props as MultiSelectPropertyProps };
