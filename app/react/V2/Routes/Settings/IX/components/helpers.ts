/* eslint-disable max-lines */
import { uniqBy } from 'lodash';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';
import { PropertySchema } from 'shared/types/commonTypes';
import { t } from 'app/I18N';
import { RadioProps } from 'app/V2/Components/Forms';
import {
  SuggestionValue,
  TableSuggestion,
  SingleValueSuggestion,
  MultiValueSuggestion,
} from '../types';

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
    const valuePresent = currentValues.find(v => v === suggestedValue);
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
      rowId: `${suggestion.rowId}-${suggestedValue}`,
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

const _replaceSuggestion = (suggestion: TableSuggestion, currentSuggestions: TableSuggestion[]) =>
  currentSuggestions.map(currentSuggestion => {
    if (currentSuggestion._id === suggestion._id) {
      return suggestion;
    }
    return currentSuggestion;
  });

const _updateTitleInSuggestion = (
  currentSuggestions: TableSuggestion[],
  _suggestionToUpdate: TableSuggestion,
  updatedEntity: ClientEntitySchema
) => {
  const suggestionToUpdate = { ..._suggestionToUpdate };
  const newTitle = updatedEntity.title;
  suggestionToUpdate.currentValue = newTitle;
  suggestionToUpdate.entityTitle = newTitle!;
  suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === newTitle;

  return _replaceSuggestion(suggestionToUpdate, currentSuggestions);
};

// eslint-disable-next-line max-statements
const updateSuggestionsByEntity = (
  currentSuggestions: TableSuggestion[],
  updatedEntity?: ClientEntitySchema,
  property?: PropertySchema
): TableSuggestion[] => {
  if (!updatedEntity) {
    return currentSuggestions;
  }

  let suggestionToUpdate = currentSuggestions.find(
    currentSuggestion => currentSuggestion.entityId === updatedEntity._id
  );

  const propertyToUpdate = suggestionToUpdate?.propertyName;

  if (!suggestionToUpdate || !propertyToUpdate) {
    return currentSuggestions;
  }

  if (propertyToUpdate === 'title' && updatedEntity.title) {
    return _updateTitleInSuggestion(currentSuggestions, suggestionToUpdate, updatedEntity);
  }

  if (!updatedEntity.metadata) {
    return currentSuggestions;
  }

  if (updatedEntity.metadata[propertyToUpdate]?.length) {
    const newValue = (
      property?.type === 'multiselect' || property?.type === 'relationship'
        ? updatedEntity.metadata[propertyToUpdate]?.map(v => v.value)
        : updatedEntity.metadata[propertyToUpdate]![0].value
    ) as SuggestionValue;

    suggestionToUpdate.currentValue = newValue;
    suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === newValue;
  }

  if (!updatedEntity.metadata[propertyToUpdate]?.length) {
    suggestionToUpdate.currentValue = '';
    suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === '';
  }

  if (property?.type === 'multiselect' || property?.type === 'relationship') {
    suggestionToUpdate = generateChildrenRows(suggestionToUpdate as MultiValueSuggestion);
  }

  return _replaceSuggestion(suggestionToUpdate, currentSuggestions);
};

const updateMultiValueSuggestions = (
  _parentSuggestion: MultiValueSuggestion,
  acceptedSuggestion: SingleValueSuggestion
): MultiValueSuggestion => {
  let parentSuggestion = { ..._parentSuggestion };

  const shouldAddValue = acceptedSuggestion.suggestedValue !== '';
  const value = shouldAddValue
    ? acceptedSuggestion.suggestedValue || ''
    : acceptedSuggestion.currentValue || '';

  parentSuggestion.currentValue = (_parentSuggestion.currentValue as SuggestionValue[]) || [];

  parentSuggestion.currentValue = shouldAddValue
    ? parentSuggestion.currentValue.concat(value)
    : parentSuggestion.currentValue.filter(v => v !== value);

  parentSuggestion.state.match = parentSuggestion.currentValue.every(v =>
    parentSuggestion.suggestedValue.includes(v)
  );

  parentSuggestion = generateChildrenRows(parentSuggestion);
  return parentSuggestion;
};

const updateSuggestions = (
  currentSuggestions: TableSuggestion[],
  suggestionsToAccept: TableSuggestion[]
): TableSuggestion[] => {
  if (!suggestionsToAccept.length) {
    return currentSuggestions;
  }

  const acceptedSuggestions = suggestionsToAccept.map(acceptedSuggestion => {
    let suggestion = (
      acceptedSuggestion.isChild
        ? { ...currentSuggestions.find(s => s._id === acceptedSuggestion._id) }
        : { ...acceptedSuggestion }
    ) as TableSuggestion;

    if (acceptedSuggestion.isChild) {
      suggestion = updateMultiValueSuggestions(
        suggestion as MultiValueSuggestion,
        acceptedSuggestion as SingleValueSuggestion
      );
    } else {
      suggestion.state.match = true;
      suggestion.currentValue = acceptedSuggestion.suggestedValue;
    }

    if ('subRows' in suggestion && suggestion.subRows?.length) {
      suggestion = generateChildrenRows(suggestion as MultiValueSuggestion);
    }

    if (
      acceptedSuggestion.propertyName === 'title' &&
      typeof acceptedSuggestion.suggestedValue === 'string'
    ) {
      suggestion.entityTitle = acceptedSuggestion.suggestedValue;
    }
    return suggestion;
  });

  const merged = [
    ...currentSuggestions
      .concat(acceptedSuggestions)
      .reduce(
        (map, suggestion) =>
          map.set(suggestion._id, Object.assign(map.get(suggestion._id) || {}, suggestion)),
        new Map()
      )
      .values(),
  ];

  return merged;
};

const propertyIsInAllTemplates = (
  templates: ClientTemplateSchema[],
  property: { templateId: string; propertyName: string; propertyLabel: string }
) =>
  templates.every(template =>
    template.properties
      .filter(templateProperty => templateProperty.type === 'markdown')
      .some(templateProperty => {
        if (templateProperty.name === property.propertyName) {
          return true;
        }
        return false;
      })
  );

const getAvailableSources = (
  templates: ClientTemplateSchema[],
  selectedTemplates: string[]
): RadioProps['options'] => {
  const baseOptions: RadioProps['options'] = [
    {
      label: t('System', 'PDF', 'PDF', false),
      value: 'pdf',
      defaultChecked: true,
    },
  ];
  const templateIds = selectedTemplates.map(selected => selected.split('-', 2)[0]);
  const templatesIncluded = templates.filter(template =>
    templateIds.includes(template._id.toString())
  );
  let markdownProperties: { templateId: string; propertyName: string; propertyLabel: string }[] =
    [];

  templatesIncluded.every(template => {
    const templateMarkdownProperties = template.properties?.filter(
      property => property.type === 'markdown'
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

  return [
    ...baseOptions,
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
      })),
  ];
};

export { updateSuggestions, updateSuggestionsByEntity, generateChildrenRows, getAvailableSources };
