// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Context } from 'api/templates.v2/model/Property.js';
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

  ensurePropertyIsConsistent(property: AbstractSelectProperty): void {
    // @ts-expect-error TS(2339): Property 'ensurePropertyIsConsistent' does not exi... Remove this comment to see the full error message
    super.ensurePropertyIsConsistent(property);
    if (this.content !== property.content) {
      throw new PropertyThesaurusMismatchError(this, property);
    }
  }
}

export { AbstractSelectProperty };
export type { Props as AbstractSelectPropertyProps };
