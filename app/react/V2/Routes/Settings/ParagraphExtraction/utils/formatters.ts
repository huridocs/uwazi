import { Template } from '#app/apiResponseTypes.js';
import { Extractor } from '#V2/shared/ParagraphExtractionTypes.js';
import { PXTemplate, PXTable } from '../types.js';
import { getTemplateProperties } from './getTemplateProperties.js';

const requiredTemplateProperties = ['_id', 'name', 'color'];

const formatExtractors = (extractors: Extractor[], templates: Template[]): PXTable[] =>
  extractors.map(extractor => {
    const targetTemplate = getTemplateProperties(
      templates,
      extractor.targetTemplateId,
      requiredTemplateProperties
    ) as PXTemplate;

    const sourceTemplate = getTemplateProperties(
      templates,
      extractor.sourceTemplateId,
      requiredTemplateProperties
    ) as PXTemplate;

    return {
      ...extractor,
      rowId: extractor._id,
      sourceTemplate,
      targetTemplate,
    };
  });

const formatTemplatesToOptions = (templates: Template[]) =>
  templates.map(template => {
    const option = {
      label: template.name,
      id: template._id,
      searchLabel: template.name,
      value: template._id,
      properties: template.properties,
    };
    return option;
  });

export { formatExtractors, formatTemplatesToOptions };
