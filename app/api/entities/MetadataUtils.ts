import { MetadataSchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';

type SanitizeInput = {
  metadata: Required<MetadataSchema>;
  template: Required<TemplateSchema>;
};

export class MetadataUtils {
  static sanitize({ metadata, template }: SanitizeInput) {
    const sanitized = Object.entries(metadata).filter(([key]) =>
      template.properties.some(p => p.name === key)
    );

    return Object.fromEntries(sanitized);
  }
}
