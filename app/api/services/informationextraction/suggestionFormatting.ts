/* eslint-disable max-statements */
import { stringToTypeOfProperty } from 'shared/stringToTypeOfProperty';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { InternalIXResultsMessage } from './InformationExtraction';

interface CommonSuggestion {
  tenant: string;
  id: string;
  xml_file_name: string;
}

type SuggestionTypes = 'text' | 'values';

interface TextSelectionSuggestion extends CommonSuggestion {
  text: string;
  segment_text: string;
  segments_boxes: {
    top: number;
    left: number;
    width: number;
    height: number;
    page_number: number;
  }[];
}

interface ValuesSelectionSuggestion extends CommonSuggestion {
  values: { id: string; label: string }[];
}

type RawSuggestion = TextSelectionSuggestion | ValuesSelectionSuggestion;

const SUGGESTIONTYPES: { [key: string]: SuggestionTypes } = {
  select: 'values',
  multiselect: 'values',
};

const readSuggestionType = (property: PropertySchema | undefined) => {
  if (!property) {
    throw new Error('Property does not exist');
  }

  return SUGGESTIONTYPES[property.type] ? SUGGESTIONTYPES[property.type] : 'text';
};

const VALIDATORS = {
  text: (suggestion: RawSuggestion): suggestion is TextSelectionSuggestion => 'text' in suggestion,
  values: (suggestion: RawSuggestion): suggestion is ValuesSelectionSuggestion =>
    'values' in suggestion,
};

const FORMATTERS = {
  text: (
    property: PropertySchema | undefined,
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
    entity: EntitySchema
  ) => {
    if (!VALIDATORS.text(rawSuggestion)) {
      throw new Error('Text suggestion is not valid.');
    }

    const suggestedValue = stringToTypeOfProperty(
      rawSuggestion.text,
      property?.type,
      currentSuggestion?.language || entity.language
    );

    const suggestion: Partial<IXSuggestionType> = {
      suggestedValue,
      ...(property?.type === 'date' ? { suggestedText: rawSuggestion.text } : {}),
      segment: rawSuggestion.segment_text,
      selectionRectangles: rawSuggestion.segments_boxes.map((box: any) => {
        const rect = { ...box, page: box.page_number.toString() };
        delete rect.page_number;
        return rect;
      }),
    };

    return suggestion;
  },
  values: (
    property: PropertySchema | undefined,
    rawSuggestion: RawSuggestion,
    currentSuggestion: IXSuggestionType,
  ) => {
    if (!VALIDATORS.values(rawSuggestion)) {
      throw new Error('Values suggestion is not valid.');
    }

    const suggestedValue = rawSuggestion.values.map(value => ({
      value: value.id,
      label: value.label,
    }));

    const suggestion: Partial<IXSuggestionType> = {
      suggestedValue,
    };

    return suggestion;
  },
};

const readMessageSuccess = (message: InternalIXResultsMessage) =>
  message.success
    ? {}
    : {
        status: 'failed',
        error: message.error_message ? message.error_message : 'Unknown error',
      };

const formatSuggestion = async (
  property: PropertySchema | undefined,
  rawSuggestion: RawSuggestion,
  currentSuggestion: IXSuggestionType,
  entity: EntitySchema,
  message: InternalIXResultsMessage
) => {
  const suggestionType = readSuggestionType(property);
  const suggestion: IXSuggestionType = {
    ...currentSuggestion,
    status: 'ready' as 'ready',
    error: '',
    ...FORMATTERS[suggestionType](property, rawSuggestion, currentSuggestion, entity),
    ...readMessageSuccess(message),
    date: new Date().getTime(),
  };

  return suggestion;
};

export { formatSuggestion };
export type { CommonSuggestion, TextSelectionSuggestion, ValuesSelectionSuggestion, RawSuggestion };
