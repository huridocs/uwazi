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
import { EntitySuggestion } from '#V2/Routes/Settings/IX/types.js';

// eslint-disable-next-line max-statements
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

  const mismatchColor = 'text-alert-800';
  const matchColor = 'text-success-600';

  let colorClass = mismatchColor;
  if (
    value === suggestion.suggestedValue ||
    (get(value, 'id') !== undefined && get(value, 'id') === get(suggestion.suggestedValue, 'id'))
  ) {
    colorClass = matchColor;
  }

  const property = templateProperties.find(prop => prop.name === suggestion.propertyName);
  const { content, type } = property || {};
  const thesaurus = thesauris.find(t => t._id === content);

  const getLabelFromThesaurus = (id: string, _thesaurus: ClientThesaurus | undefined) => {
    if (!_thesaurus) {
      return '';
    }

    const flattenedValues = _thesaurus.values.reduce((acc: any, v) => {
      if (v.values) {
        return [...acc, ...v.values];
      }
      return [...acc, v];
    }, []);

    const thesaurusValue = flattenedValues.find((v: ClientThesaurusValue) => v.id === id);

    return thesaurusValue?.label || '';
  };

  const getCurrentValue = () => {
    if (value === '' || value === undefined) {
      return '-';
    }
    if (type === 'date') {
      return secondsToDate(value as string | number, locale);
    }

    if (type === 'select' || type === 'multiselect' || type === 'relationship') {
      if (isArray(value)) {
        const labelCurrentValue = value.map(v =>
          thesaurus ? getLabelFromThesaurus(v as string, thesaurus) : get(value, 'label')
        );
        return <Translate context={content}>{labelCurrentValue.join(', ')}</Translate>;
      }
      const label = thesaurus
        ? getLabelFromThesaurus(value as string, thesaurus)
        : get(value, 'label');
      return <Translate context={content}>{label}</Translate>;
    }

    return value?.toString();
  };

  const getSuggestedValue = () => {
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
        get(suggestion.suggestedValue, 'label') ||
        getLabelFromThesaurus(suggestedValueId, thesaurus);
      return <Translate context={content}>{label}</Translate>;
    }
    return suggestion.suggestedValue!.toString();
  };

  return (
    <div className="flex flex-col gap-1">
      <Truncate maxLength={100} ellipsisPosition="center" tooltipClassname="text-xs text-gray-500">
        <span className="text-gray-500">{getCurrentValue()}</span>
      </Truncate>
      <Truncate maxLength={100} ellipsisPosition="center" tooltipClassname="text-xs">
        {suggestion.state.obsolete && (
          <span className="text-gray-400 italic">
            (<Translate>obsolete</Translate>) {getSuggestedValue()}
          </span>
        )}

        {!suggestion.state.obsolete && !suggestion.state.error && (
          <span className={`text-left ${colorClass}`}>{getSuggestedValue()}</span>
        )}
      </Truncate>
    </div>
  );
};

export { SuggestedValue };
