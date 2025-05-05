import { IXErrorCode, IXValidationError } from './IXValidationError';

export interface IXExtractorProps {
  id: string;
  name: string;
  property: string;
  templates: string[];
  source: {
    pdf?: boolean;
    property?: string;
  };
}

export class IXExtractor {
  id: string;

  name: string;

  property: string;

  templates: string[];

  source: {
    pdf?: boolean;
    property?: string;
  };

  constructor(props: IXExtractorProps) {
    this.id = props.id;
    this.name = props.name;
    this.property = props.property;
    this.templates = props.templates;
    this.source = props.source;

    this.validate();
  }

  private validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new IXValidationError(IXErrorCode.INVALID_NAME, 'Extractor name is required');
    }

    if (!this.property || this.property.trim().length === 0) {
      throw new IXValidationError(
        IXErrorCode.PROPERTY_NOT_CONFIGURED,
        'Property must be configured'
      );
    }

    if (!this.templates || this.templates.length === 0) {
      throw new IXValidationError(
        IXErrorCode.NO_TEMPLATES_CONFIGURED,
        'At least one template must be configured'
      );
    }

    if (!this.source || (!this.source.pdf && !this.source.property)) {
      throw new IXValidationError(
        IXErrorCode.INVALID_SOURCE,
        'Source must be configured with either pdf or property'
      );
    }
  }

  toJSON(): IXExtractorProps {
    return {
      id: this.id,
      name: this.name,
      property: this.property,
      templates: this.templates,
      source: this.source,
    };
  }
}
