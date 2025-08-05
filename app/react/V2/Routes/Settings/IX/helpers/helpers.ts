/* eslint-disable max-lines */
import { get, uniqBy } from 'lodash';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';
import { MetadataObjectSchema } from 'shared/types/commonTypes';
import { t } from 'app/I18N';
import { RadioProps } from 'V2/Components/Forms';
import { ClientIXExtractorType } from 'V2/shared/types';
import { TableSuggestion, MultiValueSuggestion } from '../types';
import {
  getPropertyNameFromExtractPair,
  getTemplateFromExtractPair,
} from '../components/sidepanelFunctions';

const generateChildrenRows = (_suggestion: MultiValueSuggestion) => {
  const suggestion: MultiValueSuggestion = { ..._suggestion, isChild: false };

  const currentValues = [
    ...(Array.isArray(suggestion.currentValue) ? suggestion.currentValue : []),
  ];

  const suggestedValues = [
    ...(Array.isArray(suggestion.suggestedValue) ? suggestion.suggestedValue : []),
  ];

  suggestion.subRows = [];

  const { subRows, ...suggestionWithoutChildren } = suggestion;
  suggestedValues.forEach(suggestedValue => {
    const suggestedValueId = get(suggestedValue, 'id') || suggestedValue;
    const valuePresent = currentValues.find(
      v => v === suggestedValue || v === get(suggestedValue, 'id')
    );
    if (valuePresent) {
      currentValues.splice(currentValues.indexOf(valuePresent), 1);
    }

    suggestion.subRows?.push({
      ...suggestionWithoutChildren,
      suggestedValue,
      currentValue: valuePresent || '',
      propertyName: suggestion.propertyName,
      disableRowSelection: true,
      isChild: true,
      entityTitle: '',
      rowId: `${suggestion.rowId}-${suggestedValueId}`,
    });
  });

  currentValues.forEach(currentValue => {
    suggestion.subRows?.push({
      ...suggestionWithoutChildren,
      suggestedValue: '',
      currentValue,
      disableRowSelection: true,
      isChild: true,
      entityTitle: '',
      rowId: `${suggestion.rowId}-${currentValue}`,
    });
  });

  return suggestion;
};

const propertyIsInAllTemplates = (
  templates: ClientTemplateSchema[],
  property: { templateId: string; propertyName: string; propertyLabel: string }
) =>
  templates.every(template =>
    template.properties
      .filter(
        templateProperty => templateProperty.type === 'markdown' || templateProperty.type === 'text'
      )
      .some(templateProperty => {
        if (templateProperty.name === property.propertyName) {
          return true;
        }
        return false;
      })
  );

// eslint-disable-next-line max-statements
const getAvailableSources = (
  templates: ClientTemplateSchema[],
  selectedTemplatesIdsAndProperties: string[],
  extractor?: ClientIXExtractorType
): RadioProps['options'] => {
  const baseOptions: RadioProps['options'] = [
    {
      label: t('System', 'PDF', 'PDF', false),
      value: '0',
    },
  ];

  if (!extractor || extractor?.source.pdf) {
    baseOptions[0].defaultChecked = true;
  }

  const commonProperty = selectedTemplatesIdsAndProperties[0]
    ? getPropertyNameFromExtractPair(selectedTemplatesIdsAndProperties[0])
    : '';
  const templateIds = selectedTemplatesIdsAndProperties.map(selected =>
    getTemplateFromExtractPair(selected)
  );

  const templatesIncluded = templates.filter(template =>
    templateIds.includes(template._id.toString())
  );
  let markdownProperties: { templateId: string; propertyName: string; propertyLabel: string }[] =
    [];

  templatesIncluded.every(template => {
    const templateMarkdownProperties = template.properties?.filter(
      property => property.type === 'markdown' || property.type === 'text'
    );

    if (!templateMarkdownProperties.length) {
      markdownProperties = [];
      return false;
    }

    markdownProperties.push(
      ...templateMarkdownProperties.map(templateMarkdownProperty => ({
        templateId: template._id.toString(),
        propertyName: templateMarkdownProperty.name,
        propertyLabel: templateMarkdownProperty.label,
      }))
    );

    return true;
  });

  const options = [
    ...baseOptions,
    {
      label: t('System', 'Title', 'Title', false),
      value: 'title',
      defaultChecked: false,
    },
    ...uniqBy(markdownProperties, 'propertyName')
      .filter(markdownProperty => propertyIsInAllTemplates(templatesIncluded, markdownProperty))
      .map(markdownProperty => ({
        label: t(
          markdownProperty.templateId,
          markdownProperty.propertyLabel,
          markdownProperty.propertyLabel,
          false
        ),
        value: markdownProperty.propertyName,
        defaultChecked: false,
      })),
  ];

  options.some(option => {
    if (!extractor || extractor.source.pdf) {
      // intentional pass by reference
      // eslint-disable-next-line no-param-reassign
      option.defaultChecked = true;
      return true;
    }
    if (option.value === extractor.source.property) {
      // eslint-disable-next-line no-param-reassign
      option.defaultChecked = true;
      return true;
    }
    return false;
  });

  return options.filter(option => option.value !== commonProperty);
};

const getMetadataFromProperty = (
  entity?: ClientEntitySchema,
  propertyName?: string
): MetadataObjectSchema | undefined => {
  if (!propertyName) {
    return { value: '' };
  }

  if (entity?.metadata && entity.metadata[propertyName]) {
    const metadataEntry = entity.metadata[propertyName];
    if (metadataEntry.length) {
      const [entry] = metadataEntry;
      return entry;
    }
  }

  return { value: '' };
};

const formatAccepted = (acceptedSuggestions: TableSuggestion[]) =>
  // eslint-disable-next-line max-statements
  acceptedSuggestions.map(acceptedSuggestion => {
    let addedValues: string[] | undefined;
    let removedValues: string[] | undefined;

    if (acceptedSuggestion.isChild) {
      if (acceptedSuggestion.suggestedValue) {
        const { suggestedValue } = acceptedSuggestion;
        if (
          typeof suggestedValue === 'object' &&
          suggestedValue !== null &&
          'id' in suggestedValue
        ) {
          addedValues = [suggestedValue.id];
        } else if (typeof suggestedValue === 'string' || typeof suggestedValue === 'number') {
          addedValues = [String(suggestedValue)];
        }
      }

      if (acceptedSuggestion.currentValue) {
        const { currentValue } = acceptedSuggestion;
        if (typeof currentValue === 'object' && currentValue !== null && 'id' in currentValue) {
          removedValues = [currentValue.id];
        } else if (typeof currentValue === 'string' || typeof currentValue === 'number') {
          removedValues = [String(currentValue)];
        }
      }
    }

    return {
      _id: acceptedSuggestion._id,
      sharedId: acceptedSuggestion.sharedId,
      entityId: acceptedSuggestion.entityId,
      addedValues,
      removedValues,
    };
  });

export { generateChildrenRows, getAvailableSources, getMetadataFromProperty, formatAccepted };
