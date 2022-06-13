import { EntitySuggestionType } from 'shared/types/suggestionType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { PropertySchema } from 'shared/types/commonTypes';

const defaultHeaders = [
  'Suggestion',
  '',
  'Property',
  'Title',
  'Context',
  'Language',
  'StateAllMatch / LabelMismatch / LabelMatch / ValueMismatch / ValueEmpty / EmptyObsolete',
];

const suggestionsData: { suggestions: EntitySuggestionType[]; totalPages: number } = {
  suggestions: [
    {
      entityId: 'shared1',
      sharedId: 'shared1',
      propertyName: 'property1',
      entityTitle: 'Entity title1',
      currentValue: 'Entity title1',
      suggestedValue: 'Olowo Kamali',
      segment: 'Olowo Kamali Case',
      language: 'English',
      state: SuggestionState.labelMismatch,
      date: 1,
      page: 5,
      fileId: 'fileId1',
    },
    {
      entityId: 'shared2',
      sharedId: 'shared2',
      propertyName: 'property1',
      entityTitle: 'Título entidad',
      currentValue: '',
      suggestedValue: 'Violación caso 1',
      segment: 'Detalle Violación caso 1',
      language: 'Spanish',
      state: SuggestionState.valueEmpty,
      date: 2,
      page: 2,
      fileId: 'fileId1',
    },
    {
      entityId: 'shared1',
      sharedId: 'shared1',
      propertyName: 'property1',
      entityTitle: 'Entity title1',
      currentValue: 'Entity title1',
      suggestedValue: '',
      segment: '',
      language: 'en',
      state: SuggestionState.labelMismatch,
      date: 1,
      page: 5,
      fileId: 'fileId1',
    },
  ],
  totalPages: 4,
};

const dateSuggestion = {
  entityId: 'shared2',
  sharedId: 'shared2',
  propertyName: 'fecha',
  entityTitle: 'Título entidad',
  currentValue: 1585851003,
  suggestedValue: 1585851003,
  segment: 'Fecha Apr 2, 2020',
  language: 'Spanish',
  state: SuggestionState.labelMismatch,
  date: 2,
  page: 2,
  fileId: 'fileId1',
};

const reviewedProperty: PropertySchema = {
  name: 'other_title',
  type: 'text',
  label: 'Other title',
};

export { defaultHeaders, suggestionsData, reviewedProperty, dateSuggestion };
