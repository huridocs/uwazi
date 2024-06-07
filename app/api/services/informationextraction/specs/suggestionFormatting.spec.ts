import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { formatSuggestion } from '../suggestionFormatting';
import { InternalIXResultsMessage } from '../InformationExtraction';

const fixtureFactory = getFixturesFactory();

const successMessage: InternalIXResultsMessage = {
  tenant: 'tenant',
  task: 'suggestions',
  params: {
    id: fixtureFactory.id('extractor_id'),
  },
  data_url: 'data_url',
  file_url: 'file_url',
  success: true,
};

const properties: Record<string, PropertySchema> = {
  text: fixtureFactory.property('text_property', 'text'),
  numeric: fixtureFactory.property('numeric_property', 'numeric'),
  date: fixtureFactory.property('date_property', 'date'),
  select: fixtureFactory.property('select_property', 'select'),
  multiselect: fixtureFactory.property('multiselect_property', 'multiselect'),
};

const entities: Record<string, EntitySchema> = {
  text: fixtureFactory.entity('entity_id', 'entity_template', {
    text_property: [{ value: 'previous_value' }],
  }),
  numeric: fixtureFactory.entity('entity_id', 'entity_template', {
    numeric_property: [{ value: 0 }],
  }),
  date: fixtureFactory.entity('entity_id', 'entity_template', {
    date_property: [{ value: 0 }],
  }),
  select: fixtureFactory.entity('entity_id', 'entity_template', {
    select_property: [{ value: 'A_id', label: 'A' }],
  }),
  multiselect: fixtureFactory.entity('entity_id', 'entity_template', {
    multiselect_property: [
      { value: 'A_id', label: 'A' },
      { value: 'B_id', label: 'B' },
    ],
  }),
};

const currentSuggestionBase = {
  _id: fixtureFactory.id('suggestion_id'),
  entityId: 'entity_id',
  extractorId: fixtureFactory.id('extractor_id'),
  entityTemplate: 'entity_template',
  fileId: fixtureFactory.id('file_id'),
  segment: 'previous_context',
  language: 'en',
  page: 100,
  date: 1,
  status: 'ready' as 'ready',
  error: '',
  selectionRectangles: [
    {
      top: 13,
      left: 13,
      width: 13,
      height: 13,
      page: '100',
    },
  ],
};

const currentSuggestions: Record<string, IXSuggestionType> = {
  text: {
    ...currentSuggestionBase,
    propertyName: 'text_property',
    suggestedValue: 'previous_value',
  },
  numeric: {
    ...currentSuggestionBase,
    propertyName: 'numeric_property',
    suggestedValue: 0,
  },
  date: {
    ...currentSuggestionBase,
    propertyName: 'date_property',
    suggestedValue: 0,
  },
  select: {
    ...currentSuggestionBase,
    propertyName: 'select_property',
    suggestedValue: 'A_id',
  },
  multiselect: {
    ...currentSuggestionBase,
    propertyName: 'multiselect_property',
    suggestedValue: ['A_id', 'B_id'],
  },
};

const rawSuggestionBase = {
  tenant: 'tenant',
  id: 'extractor_id',
  xml_file_name: 'file.xml',
  segment_text: 'new context',
};

const suggestedDateTimeStamp = 1717743209000;
const suggestedDateText = new Date(suggestedDateTimeStamp).toISOString();

const validRawSuggestions = {
  text: {
    ...rawSuggestionBase,
    text: 'recommended_value',
    segments_boxes: [
      {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        page_number: 1,
      },
    ],
  },
  numeric: {
    ...rawSuggestionBase,
    text: '42',
    segments_boxes: [
      {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        page_number: 1,
      },
    ],
  },
  date: {
    ...rawSuggestionBase,
    text: suggestedDateText,
    segments_boxes: [
      {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        page_number: 1,
      },
    ],
  },
  select: {
    ...rawSuggestionBase,
    values: [{ id: 'B_id', label: 'B' }],
  },
  multiselect: {
    ...rawSuggestionBase,
    values: [
      { id: 'C_id', label: 'C' },
      { id: 'D_id', label: 'D' },
    ],
  },
};

describe('formatSuggestion', () => {
  // it.each([{

  // }])('should throw error if $case', async () => {

  // });

  it.each([
    {
      case: 'valid text suggestions',
      property: properties.text,
      rawSuggestion: validRawSuggestions.text,
      currentSuggestion: currentSuggestions.text,
      entity: entities.text,
      expectedResult: {
        ...currentSuggestions.text,
        date: expect.any(Number),
        suggestedValue: 'recommended_value',
        segment: 'new context',
        selectionRectangles: [
          {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            page: '1',
          },
        ],
      },
    },
    {
      case: 'valid numeric suggestions',
      property: properties.numeric,
      rawSuggestion: validRawSuggestions.numeric,
      currentSuggestion: currentSuggestions.numeric,
      entity: entities.numeric,
      expectedResult: {
        ...currentSuggestions.numeric,
        date: expect.any(Number),
        suggestedValue: 42,
        segment: 'new context',
        selectionRectangles: [
          {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            page: '1',
          },
        ],
      },
    },
    {
      case: 'valid date suggestions',
      property: properties.date,
      rawSuggestion: validRawSuggestions.date,
      currentSuggestion: currentSuggestions.date,
      entity: entities.date,
      expectedResult: {
        ...currentSuggestions.date,
        date: expect.any(Number),
        suggestedValue: suggestedDateTimeStamp / 1000,
        suggestedText: suggestedDateText,
        segment: 'new context',
        selectionRectangles: [
          {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            page: '1',
          },
        ],
      },
    },
    {
      case: 'valid select suggestions',
      property: properties.select,
      rawSuggestion: validRawSuggestions.select,
      currentSuggestion: currentSuggestions.select,
      entity: entities.select,
      expectedResult: {
        ...currentSuggestions.select,
        date: expect.any(Number),
        suggestedValue: 'B_id',
        segment: 'new context',
      },
    },
    {
      case: 'valid multiselect suggestions',
      property: properties.multiselect,
      rawSuggestion: validRawSuggestions.multiselect,
      currentSuggestion: currentSuggestions.multiselect,
      entity: entities.multiselect,
      expectedResult: {
        ...currentSuggestions.multiselect,
        date: expect.any(Number),
        suggestedValue: ['C_id', 'D_id'],
        segment: 'new context',
      },
    },
  ])(
    'should return formatted suggestion for $case',
    async ({ property, rawSuggestion, currentSuggestion, entity, expectedResult }) => {
      const result = await formatSuggestion(
        property,
        rawSuggestion,
        currentSuggestion,
        entity,
        successMessage
      );
      expect(result).toEqual(expectedResult);
    }
  );
});
