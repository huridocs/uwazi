import Ajv from 'ajv';

import { stringToTypeOfProperty } from 'shared/stringToTypeOfProperty';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import {
  CommonSuggestion,
  IXSuggestionType,
  TextSelectionSuggestion,
  ValuesSelectionSuggestion,
} from 'shared/types/suggestionType';
import {
  TextSelectionSuggestionSchema,
  ValuesSelectionSuggestionSchema,
} from 'shared/types/suggestionSchema';
import { syncWrapValidator } from 'shared/tsUtils';
import { InternalIXResultsMessage } from './InformationExtraction';

type RawSuggestion = TextSelectionSuggestion | ValuesSelectionSuggestion;

class RawSuggestionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RawSuggestionValidationError';
  }
}

const createAjvValidator = (schema: any) => {
  const ajv = new Ajv({ allErrors: true });
  ajv.addVocabulary(['tsType']);
  return syncWrapValidator(ajv.compile(schema));
};

const AJVS = {
  text: createAjvValidator(TextSelectionSuggestionSchema),
  select: createAjvValidator(ValuesSelectionSuggestionSchema),
  multiselect: createAjvValidator(ValuesSelectionSuggestionSchema),
};

const VALIDATORS = {
  text: (suggestion: RawSuggestion): suggestion is TextSelectionSuggestion => {
    AJVS.text(suggestion);
    return true;
  },
  select: (suggestion: RawSuggestion): suggestion is ValuesSelectionSuggestion => {
    AJVS.select(suggestion);

    if (!('values' in suggestion) || suggestion.values.length > 1) {
      throw new RawSuggestionValidationError('Select suggestions must have one or zero values.');
    }

    return true;
  },
  multiselect: (suggestion: RawSuggestion): suggestion is ValuesSelectionSuggestion => {
    AJVS.multiselect(suggestion);
    return true;
  },
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
      segment: rawSuggestion.segment_text,
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
      segment: rawSuggestion.segment_text,
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
