import React from 'react';
import { useParams } from 'react-router';
import { useAtomValue } from 'jotai';
import get from 'lodash/get.js';
import isArray from 'lodash/isArray.js';
import { ClientTemplateSchema } from '#app/istore.js';
import { Translate } from '#app/I18N/index.js';
import { secondsToDate } from '#V2/shared/dateHelpers.js';
import { Truncate } from '#V2/Components/UI/index.js';
import { thesauriAtom } from '#V2/atoms/index.js';
import { ClientThesaurus, ClientThesaurusValue } from '#app/apiResponseTypes.js';
import { EntitySuggestion } from '../types.js';

const getLabelFromThesaurus = (id: string, thesaurus?: ClientThesaurus) => {
  const flattenedValues = (thesaurus?.values ?? []).flatMap(entry =>
    entry.values ? entry.values : [entry]
  );
  return flattenedValues.find((entry: ClientThesaurusValue) => entry.id === id)?.label || '';
};

const selectValueLabel = (
  value: EntitySuggestion['suggestedValue'],
  thesaurus?: ClientThesaurus
) => {
  if (isArray(value)) {
    return value
      .map(item =>
        thesaurus ? getLabelFromThesaurus(item as string, thesaurus) : get(value, 'label')
      )
      .join(', ');
  }
  return thesaurus ? getLabelFromThesaurus(value as string, thesaurus) : get(value, 'label');
};

type DisplayContext = {
  type: string | undefined;
  locale: string | undefined;
  content: string | undefined;
  thesaurus?: ClientThesaurus;
};

const currentValueDisplay = ({
  value,
  type,
  locale,
  content,
  thesaurus,
}: DisplayContext & { value?: EntitySuggestion['suggestedValue'] }) => {
  if (value === '' || value === undefined) {
    return '-';
  }
  if (type === 'date') {
    return secondsToDate(value as string | number, locale);
  }
  if (type === 'select' || type === 'multiselect' || type === 'relationship') {
    return <Translate context={content}>{selectValueLabel(value, thesaurus)}</Translate>;
  }
  return value?.toString();
};

const suggestedValueDisplay = ({
  suggestion,
  type,
  locale,
  content,
  thesaurus,
}: DisplayContext & { suggestion: EntitySuggestion }) => {
  if (suggestion.suggestedValue === '') {
    return '-';
  }
  if (type === 'date') {
    return secondsToDate((suggestion.suggestedValue as string | number) || '', locale);
  }
  if (type === 'select' || type === 'multiselect' || type === 'relationship') {
    const suggestedValueId =
      get(suggestion.suggestedValue, 'id') || (suggestion.suggestedValue as string);
    const label =
      get(suggestion.suggestedValue, 'label') || getLabelFromThesaurus(suggestedValueId, thesaurus);
    return <Translate context={content}>{label}</Translate>;
  }
  return suggestion.suggestedValue!.toString();
};

const SuggestedValue = ({
  value,
  suggestion,
  templateProperties,
}: {
  value?: EntitySuggestion['suggestedValue'];
  suggestion: EntitySuggestion;
  templateProperties: ClientTemplateSchema['properties'];
}) => {
  const locale = useParams().lang;
  const thesauris = useAtomValue(thesauriAtom);
  const property = templateProperties.find(prop => prop.name === suggestion.propertyName);
  const { content, type } = property || {};
  const thesaurus = thesauris.find(item => item._id === content);
  const valuesMatch =
    value === suggestion.suggestedValue ||
    (get(value, 'id') !== undefined && get(value, 'id') === get(suggestion.suggestedValue, 'id'));
  const colorClass = valuesMatch ? 'text-success-600' : 'text-alert-800';

  return (
    <div className="flex flex-col gap-1">
      <Truncate maxLength={100} ellipsisPosition="center" tooltipClassname="text-xs text-ink-muted">
        <span className="text-ink-muted">
          {currentValueDisplay({ value, type, locale, content, thesaurus })}
        </span>
      </Truncate>
      <Truncate maxLength={100} ellipsisPosition="center" tooltipClassname="text-xs">
        {suggestion.state.obsolete && (
          <span className="text-ink-muted italic">
            (<Translate>obsolete</Translate>){' '}
            {suggestedValueDisplay({ suggestion, type, locale, content, thesaurus })}
          </span>
        )}

        {!suggestion.state.obsolete && !suggestion.state.error && (
          <span className={`text-left ${colorClass}`}>
            {suggestedValueDisplay({ suggestion, type, locale, content, thesaurus })}
          </span>
        )}
      </Truncate>
    </div>
  );
};

export { SuggestedValue };
