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

const VALIDATORS = {
  text: (suggestion: RawSuggestion): suggestion is TextSelectionSuggestion => 'text' in suggestion,
  select: (suggestion: RawSuggestion): suggestion is ValuesSelectionSuggestion =>
    'values' in suggestion && (suggestion.values.length === 1 || suggestion.values.length === 0),
  multiselect: (suggestion: RawSuggestion): suggestion is ValuesSelectionSuggestion =>
    'values' in suggestion,
};

const FORMATTERS = {
  text: (
    rawSuggestion: RawSuggestion,
    property: PropertySchema | undefined,
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
  select: (rawSuggestion: RawSuggestion) => {
    if (!VALIDATORS.select(rawSuggestion)) {
      throw new Error('Select suggestion is not valid.');
    }

    const suggestedValue = rawSuggestion.values[0]?.id;

    const suggestion: Partial<IXSuggestionType> = {
      suggestedValue: suggestedValue || '',
    };

    return suggestion;
  },
  multiselect: (rawSuggestion: RawSuggestion) => {
    if (!VALIDATORS.multiselect(rawSuggestion)) {
      throw new Error('Multiselect suggestion is not valid.');
    }

    const suggestedValue = rawSuggestion.values.map(value => value.id);

    const suggestion: Partial<IXSuggestionType> = {
      suggestedValue,
    };

    return suggestion;
  },
};

const DEFAULTFORMATTER = FORMATTERS.text;

const formatRawSuggestion = (
  rawSuggestion: RawSuggestion,
  property: PropertySchema | undefined,
  currentSuggestion: IXSuggestionType,
  entity: EntitySchema
) => {
  const formatter =
    // @ts-ignore
    (property?.type || '') in FORMATTERS ? FORMATTERS[property.type] : DEFAULTFORMATTER;
  return formatter(rawSuggestion, property, currentSuggestion, entity);
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
  const suggestion: IXSuggestionType = {
    ...currentSuggestion,
    status: 'ready' as 'ready',
    error: '',
    ...formatRawSuggestion(rawSuggestion, property, currentSuggestion, entity),
    ...readMessageSuccess(message),
    date: new Date().getTime(),
  };

  return suggestion;
};

export { formatSuggestion };
export type { CommonSuggestion, TextSelectionSuggestion, ValuesSelectionSuggestion, RawSuggestion };
