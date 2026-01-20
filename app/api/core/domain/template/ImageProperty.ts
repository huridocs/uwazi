import { z } from 'zod';
import { Context, PropertyTypes, CreatePropertyAssignmentInput } from '#api/core/domain/template/Property.js';
import { PropertyTypeInvalidTypeError } from '#api/core/domain/template/errors.js';
import { AbstractImageProperty, AbstractImagePropertyProps } from '#api/core/domain/template/AbstractImageProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { PropertyAssignment, ImageEntry } from '#api/core/domain/template/PropertyValue.js';

type Props = {
  type?: PropertyTypeEnum.Image;
} & Omit<AbstractImagePropertyProps, 'type'>;

const FilePathEntrySchema = z.object({
  value: z.string().trim().min(1, 'Image Property must be a non-empty string.'),
});

const URLEntrySchema = z.object({
  value: z.string().trim().url('Image Property must be a valid URL.'),
});

const createSchema = (isRequired: boolean, isFromURL: boolean) =>
  z
    .array(isFromURL ? URLEntrySchema : FilePathEntrySchema)
    .min(isRequired ? 1 : 0, 'Image Property is required')
    .max(1, 'Image Property only accepts a single value.');

class ImageProperty extends AbstractImageProperty {
  private FILE_PATH = '/api/files/';

  constructor(props: Props, context?: Context) {
    super({ ...props, type: props.type || PropertyTypeEnum.Image }, context);
    this.fullWidth = props.fullWidth || false;

    this.validate();
  }

  protected validate() {
    if (this.type !== PropertyTypeEnum.Image) {
      throw new PropertyTypeInvalidTypeError(this.type, 'ImageProperty');
    }
  }

  get isTranslatable(): boolean {
    return true;
  }

  private isFromURL(value: ImageEntry[]) {
    return !!value?.[0]?.value && value[0].value.startsWith('http');
  }

  private isFromFilePath(value: ImageEntry[]) {
    return !!value?.[0]?.value && value[0].value.startsWith(this.FILE_PATH);
  }

  createPropertyAssignment(
    { value }: CreatePropertyAssignmentInput<ImageEntry>,
    shouldValidateForRequired = false
  ): PropertyAssignment<ImageEntry> {
    const isFromURL = this.isFromURL(value);
    const isFromFilePath = this.isFromFilePath(value);
    const parsed = createSchema(shouldValidateForRequired ? this.required : false, isFromURL).parse(
      value.filter(v => v?.value?.length)
    );
    let postProcessed = parsed;

    if (!isFromURL && !isFromFilePath) {
      postProcessed = parsed.map(v => ({ value: `${this.FILE_PATH}${v.value}` }));
    }

    return {
      name: this.name,
      value: postProcessed,
      type: this.type,
      isTranslatable: this.isTranslatable,
    };
  }

  validatePropertyAssignment(
    { value }: PropertyAssignment<ImageEntry>,
    shouldValidateForRequired = false
  ): void {
    createSchema(shouldValidateForRequired ? this.required : false, this.isFromURL(value)).parse(
      value
    );
  }
}

export { ImageProperty };
export type { Props as ImagePropertyProps };
