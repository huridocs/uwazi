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
  relationship: fixtureFactory.property('relationship_property', 'relationship'),
};

const entities: Record<string, EntitySchema> = {
  title: fixtureFactory.entity('entity_id', 'entity_template', {}),
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
  relationship: fixtureFactory.entity('entity_id', 'entity_template', {
    relationship_property: [
      { value: 'related_1_id', label: 'related_1_title' },
      { value: 'related_2_id', label: 'related_2_title' },
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
  title: {
    ...currentSuggestionBase,
    propertyName: 'title',
    suggestedValue: 'previous_value',
  },
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
  relationship: {
    ...currentSuggestionBase,
    propertyName: 'relationship_property',
    suggestedValue: ['related_1_id', 'related_2_id'],
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
  title: {
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
  relationship: {
    ...rawSuggestionBase,
    values: [
      { id: 'related_1_id', label: 'related_1_title' },
      { id: 'related_3_id', label: 'related_3_title' },
    ],
  },
};

describe('formatSuggestion', () => {
  it.each([
    {
      case: 'missing properties',
      property: properties.text,
      rawSuggestion: {
        ...validRawSuggestions.text,
        tenant: undefined,
      },
      currentSuggestion: currentSuggestions.text,
      entity: entities.text,
      expectedErrorMessage: ": must have required property 'tenant'",
    },
    {
      case: 'invalid tenant type',
      property: properties.text,
      rawSuggestion: {
        ...validRawSuggestions.text,
        tenant: 1,
      },
      currentSuggestion: currentSuggestions.text,
      entity: entities.text,
      expectedErrorMessage: '/tenant: must be string',
    },
    {
      case: 'invalid id type',
      property: properties.text,
      rawSuggestion: {
        ...validRawSuggestions.text,
        id: 1,
      },
      currentSuggestion: currentSuggestions.text,
      entity: entities.text,
      expectedErrorMessage: '/id: must be string',
    },
    {
      case: 'invalid xml_file_name type',
      property: properties.text,
      rawSuggestion: {
        ...validRawSuggestions.text,
        xml_file_name: 1,
      },
      currentSuggestion: currentSuggestions.text,
      entity: entities.text,
      expectedErrorMessage: '/xml_file_name: must be string',
    },
    {
      case: 'invalid text type',
      property: properties.text,
      rawSuggestion: {
        ...validRawSuggestions.text,
        text: 1,
      },
      currentSuggestion: currentSuggestions.text,
      entity: entities.text,
      expectedErrorMessage: '/text: must be string',
    },
    {
      case: 'invalid segment_text type',
      property: properties.text,
      rawSuggestion: {
        ...validRawSuggestions.text,
        segment_text: 1,
      },
      currentSuggestion: currentSuggestions.text,
      entity: entities.text,
      expectedErrorMessage: '/segment_text: must be string',
    },
    {
      case: 'invalid segments_boxes subtype',
      property: properties.text,
      rawSuggestion: {
        ...validRawSuggestions.text,
        segments_boxes: [
          {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            page_number: '1',
          },
        ],
      },
      currentSuggestion: currentSuggestions.text,
      entity: entities.text,
      expectedErrorMessage: '/segments_boxes/0/page_number: must be number',
    },
    {
      case: 'invalid select values type',
      property: properties.select,
      rawSuggestion: {
        ...validRawSuggestions.select,
        values: 1,
      },
      currentSuggestion: currentSuggestions.select,
      entity: entities.select,
      expectedErrorMessage: '/values: must be array',
    },
    {
      case: 'invalid select values subtype',
      property: properties.select,
      rawSuggestion: {
        ...validRawSuggestions.select,
        values: [{ id: 1, label: 'value_label' }],
      },
      currentSuggestion: currentSuggestions.select,
      entity: entities.select,
      expectedErrorMessage: '/values/0/id: must be string',
    },
    {
      case: 'invalid select values length',
      property: properties.select,
      rawSuggestion: {
        ...validRawSuggestions.select,
        values: [
          { id: 'B_id', label: 'B' },
          { id: 'C_id', label: 'C' },
        ],
      },
      currentSuggestion: currentSuggestions.select,
      entity: entities.select,
      expectedErrorMessage: 'Select suggestions must have one or zero values.',
    },
    {
      case: 'invalid multiselect values type',
      property: properties.multiselect,
      rawSuggestion: {
        ...validRawSuggestions.multiselect,
        values: 1,
      },
      currentSuggestion: currentSuggestions.multiselect,
      entity: entities.multiselect,
      expectedErrorMessage: '/values: must be array',
    },
    {
      case: 'invalid multiselect values subtype',
      property: properties.multiselect,
      rawSuggestion: {
        ...validRawSuggestions.multiselect,
        values: [{ id: 1, label: 'value_label' }],
      },
      currentSuggestion: currentSuggestions.multiselect,
      entity: entities.multiselect,
      expectedErrorMessage: '/values/0/id: must be string',
    },
    {
      case: 'invalid relationship values type',
      property: properties.relationship,
      rawSuggestion: {
        ...validRawSuggestions.relationship,
        values: 1,
      },
      currentSuggestion: currentSuggestions.relationship,
      entity: entities.relationship,
      expectedErrorMessage: '/values: must be array',
    },
    {
      case: 'invalid relationship values subtype',
      property: properties.relationship,
      rawSuggestion: {
        ...validRawSuggestions.relationship,
        values: [{ id: 1, label: 'value_label' }],
      },
      currentSuggestion: currentSuggestions.relationship,
      entity: entities.relationship,
      expectedErrorMessage: '/values/0/id: must be string',
    },
  ])(
    'should throw error if $case',
    async ({ property, rawSuggestion, currentSuggestion, entity, expectedErrorMessage }) => {
      const cb = async () =>
        formatSuggestion(
          property,
          // @ts-expect-error
          rawSuggestion,
          currentSuggestion,
          entity,
          successMessage
        );
      await expect(cb).rejects.toThrow(expectedErrorMessage);
    }
  );

  it('should allow extra properties', async () => {
    const property = properties.text;
    const rawSuggestion = {
      ...validRawSuggestions.text,
      extra: 'extra',
    };
    const result = await formatSuggestion(
      property,
      rawSuggestion,
      currentSuggestions.text,
      entities.text,
      successMessage
    );
    expect(result).toEqual({
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
    });
  });

  it.each([
    {
      case: 'valid title suggestions',
      property: { name: 'title' as 'title', type: 'title' as 'title' },
      rawSuggestion: validRawSuggestions.title,
      currentSuggestion: currentSuggestions.title,
      entity: entities.title,
      expectedResult: {
        ...currentSuggestions.title,
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
    {
      case: 'valid relationship suggestions',
      property: properties.relationship,
      rawSuggestion: validRawSuggestions.relationship,
      currentSuggestion: currentSuggestions.relationship,
      entity: entities.relationship,
      expectedResult: {
        ...currentSuggestions.relationship,
        date: expect.any(Number),
        suggestedValue: ['related_1_id', 'related_3_id'],
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
