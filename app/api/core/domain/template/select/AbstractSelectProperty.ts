import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { FieldIsRequiredError, PropertyThesaurusMismatchError } from '../errors';
import { FilterableProperty, FilterablePropertyProps } from '../FilterableProperty';
import { SelectionEntry, SelectPropertyAssignment } from '../PropertyValue';
import { createSchema } from './Schema';

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
    super.ensurePropertyIsConsistent(property);

    if (this.content !== property.content) {
      throw new PropertyThesaurusMismatchError(this, property);
    }
  }

  createDefaultValue(): SelectPropertyAssignment {
    return {
      name: this.name,
      type: this.type,
      language: 'n/a' as LanguageISO6391,
      value: [],
    };
  }

  createPropertyAssignment(
    input: CreatePropertyAssignmentInput<SelectionEntry>,
    shouldValidateForRequired = false
  ): SelectPropertyAssignment {
    const deduplicated = ArrayUtils.deduplicate(input.value, v => v.value);

    const { language, value } = createSchema(
      shouldValidateForRequired ? this.required : false,
      this.type
    ).parse({
      ...input,
      value: deduplicated,
    });

    return {
      name: this.name,
      type: this.type,
      value,
      language: language as LanguageISO6391,
    };
  }

  validatePropertyAssignment(
    propertyAssignment: SelectPropertyAssignment,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false, this.type).parse(
      propertyAssignment
    );
  }
}

export { AbstractSelectProperty };
export type { Props as AbstractSelectPropertyProps };
