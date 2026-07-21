import { Context, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { FieldIsRequiredError, PropertyThesaurusMismatchError } from '../errors.js';
import { FilterableProperty, FilterablePropertyProps } from '../FilterableProperty.js';
import { SelectionEntry, SelectPropertyAssignment } from '../PropertyValue.js';
import { createSchema } from './Schema.js';

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

  get isTranslatable(): boolean {
    return false;
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
      isTranslatable: this.isTranslatable,
    };
  }

  createPropertyAssignment(
    input: CreatePropertyAssignmentInput<SelectionEntry>,
    shouldValidateForRequired = false
  ): SelectPropertyAssignment {
    const filtered = input.value.filter(v => v?.value?.trim()?.length);

    const deduplicated = ArrayUtils.deduplicate(filtered, v => v.value);

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
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment(propertyAssignment: SelectPropertyAssignment): void {
    createSchema(this.required, this.type).parse(propertyAssignment);
  }
}

export { AbstractSelectProperty };
export type { Props as AbstractSelectPropertyProps };
