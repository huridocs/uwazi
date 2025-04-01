import { Template } from 'app/apiResponseTypes';
import { Settings } from 'shared/types/settingsType';
import { Extractor } from 'V2/shared/ParagraphExtractionTypes';
import {
  PXEntityApiResponse,
  PXEntityTable,
  PXTemplate,
  PXTable,
  PXParagraphApiResponse,
  PXParagraphTable,
} from '../types';
import { getTemplateProperties } from './getTemplateProperties';

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

const formatEntityData = (
  entities: PXEntityApiResponse[],
  templates: Template[]
): PXEntityTable[] =>
  entities.map(entity => {
    const template = getTemplateProperties(
      templates,
      entity.templateId,
      requiredTemplateProperties
    ) as PXTemplate;

    return {
      ...entity,
      rowId: entity._id || '',
      template,
    };
  });

const formatParagraphData = (
  paragraphs: PXParagraphApiResponse[],
  templates: Template[],
  settings: Settings
): PXParagraphTable[] => {
  const defaultLanguage = settings?.languages?.find(language => language.default === true);
  const defaultLanguageKey = defaultLanguage?.key;

  return paragraphs.map(paragraph => {
    const template = getTemplateProperties(
      templates,
      paragraph.templateId,
      requiredTemplateProperties
    ) as PXTemplate;

    const updatedParagraph = { ...paragraph } as PXParagraphTable;

    const paragraphLanguage = defaultLanguageKey || updatedParagraph.languages[0];
    const subRows: any[] = [];
    Object.keys(updatedParagraph.versions).forEach(lang => {
      if (lang !== paragraphLanguage) {
        subRows.push({
          text: paragraph.versions[lang],
          ...paragraph,
          languages: [lang],
        });
      } else {
        updatedParagraph.text = paragraph.versions[lang];
        updatedParagraph.languages = [paragraphLanguage];
      }
    });

    if (subRows.length > 0) {
      updatedParagraph.subRows = subRows;
    }

    return {
      ...updatedParagraph,
      rowId: updatedParagraph._id || '',
      template,
    };
  });
};

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

export { formatEntityData, formatExtractors, formatParagraphData, formatTemplatesToOptions };
