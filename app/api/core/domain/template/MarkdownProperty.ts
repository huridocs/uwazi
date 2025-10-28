import { Context, CreatePropertyAssignmentInput } from 'api/core/domain/template/Property';
import { PropertyTypeInvalidTypeError } from './errors';
import { FilterableProperty, FilterablePropertyProps } from './FilterableProperty';
import { PropertyTypeEnum } from './PropertyType';
import { MarkdownEntry, PropertyAssignment } from './PropertyValue';

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

  createPropertyAssignment({
    value,
  }: CreatePropertyAssignmentInput<MarkdownEntry>): PropertyAssignment<MarkdownEntry> {
    if (value.length > 1) {
      throw new Error(
        `Markdown Property only accepts a single value. ${JSON.stringify(value)} given.`
      );
    }

    const isValid =
      value?.[0]?.value !== undefined &&
      value?.[0]?.value !== null &&
      value?.[0]?.value?.trim() !== '';

    if (this.required && !isValid) {
      throw new Error('Markdown Property is required');
    }

    return {
      name: this.name,
      value: isValid ? [{ value: value[0].value }] : [],
      type: this.type,
    };
  }
}

export { MarkdownProperty };
export type { Props as MarkdownPropertyProps };
