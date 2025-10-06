import { Context, PropertyTypes } from 'api/templates.v2/model/Property';
import { FieldIsRequiredError, PropertyThesaurusMismatchError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';

type Props = {
  content: string;
} & FilterablePropertyProps;

class AbstractSelectProperty extends FilterableProperty {
  content: string; // Keeping name wrong for backwards compatibility. This is Thesaurus id

  constructor(props: Props, context?: Context) {
    super(props, context);
    this.content = props.content;

    this.validateAbstractSelectProperty();
  }

  private validateAbstractSelectProperty() {
    if (!this?.content?.toString()?.length) {
      throw new FieldIsRequiredError('content');
    }
  }

  protected isTypeEqual(type: PropertyTypes): boolean {
    const compatibleTypes: PropertyTypes[] = ['select', 'multiselect'];

    return compatibleTypes.includes(type);
  }

  ensurePropertyIsConsistent(property: AbstractSelectProperty): void {
    super.ensurePropertyIsConsistent(property);

    if (this.content !== property.content) {
      throw new PropertyThesaurusMismatchError(this, property);
    }
  }
}

export { AbstractSelectProperty };
export type { Props as AbstractSelectPropertyProps };
