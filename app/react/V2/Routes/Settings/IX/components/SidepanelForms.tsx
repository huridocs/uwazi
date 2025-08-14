/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { captureException } from '@sentry/react';
import { Translate } from 'app/I18N';
import { ClientPropertySchema } from 'app/istore';
import { isClient } from 'app/utils';
import { lookup } from 'V2/api/search';
import {
  defaultSearch,
  InputField,
  MultiselectList,
  MultiselectListOption,
  Textarea,
} from 'V2/Components/Forms';
import { Button } from 'V2/Components/UI';
import { thesauriAtom } from 'V2/atoms';
import { loadValuesAndSuggestions } from '../helpers';
import { selectionErrorAtom, textSelectionAtom } from './atoms';
import { SuggestionValue, TableSuggestion } from '../types';
import { MultiselectItemLabel } from './MultiselectItemLabel';
import { selectAndSearchAtom } from './atoms/selectAndSearchAtom';

const updateOptionsWithSelection = (
  options: MultiselectListOption[],
  selectedValues?: string[]
): MultiselectListOption[] =>
  options.map(option => ({
    ...option,
    label: React.cloneElement(option.label as React.ReactElement, {
      isSelected: selectedValues?.includes(option.value),
    }),
    items: option.items?.map(subItem => ({
      ...subItem,
      label: React.cloneElement(subItem.label as React.ReactElement, {
        isSelected: selectedValues?.includes(subItem.value),
      }),
    })),
  }));

const getSuggestionValues = (suggestedValue?: SuggestionValue[] | SuggestionValue): string[] => {
  if (!Array.isArray(suggestedValue)) return [String(suggestedValue)];
  return suggestedValue.map(value => {
    if (value && typeof value === 'object' && 'id' in value) {
      return value.id;
    }
    return String(value);
  });
};

const calculateSearchText = (toggle: boolean, previousText?: string, nextText?: string) => {
  if (toggle) {
    return nextText || '';
  }
  return previousText || '';
};

type SidepanelFormsProps = {
  handleClickToFill: () => Promise<void>;
  property?: ClientPropertySchema;
  suggestion?: TableSuggestion;
  clearSelectionButton?: ReactNode;
};

const Selects = ({
  property,
  suggestion,
}: {
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
}) => {
  const { control } = useFormContext();
  const thesauri = useAtomValue(thesauriAtom);
  const thesaurus = thesauri.find(item => item._id === property.content);
  const selectedtext = useAtomValue(textSelectionAtom);
  const selectAndSearch = useAtomValue(selectAndSearchAtom);
  const searchTextRef = useRef('');
  const suggestions = getSuggestionValues(suggestion?.suggestedValue);
  const intialOptions = useMemo(
    () =>
      thesaurus?.values.map((value: any) => ({
        label: (
          <MultiselectItemLabel
            isSuggested={suggestions.includes(value.id)}
            label={value.label}
            property={property}
          />
        ),
        searchLabel: value.label.toLowerCase(),
        value: value.id,
        suggested: suggestions?.includes(value.id),
        items: value.values?.map((subValue: any) => ({
          label: (
            <MultiselectItemLabel
              isSuggested={suggestions.includes(subValue.id)}
              label={subValue.label}
              property={property}
            />
          ),
          searchLabel: subValue.label.toLowerCase(),
          value: subValue.id,
          suggested: suggestions?.includes(subValue.id),
        })),
      })),
    [property, suggestions, thesaurus]
  );
  const [items, setItems] = useState<MultiselectListOption[]>(intialOptions || []);

  return (
    <div className="h-60">
      <Controller
        control={control}
        name="field"
        rules={{ required: property?.required }}
        render={({ field: { value, onChange } }) => {
          const itemsWithSuggestions = updateOptionsWithSelection(items || [], value);
          searchTextRef.current = calculateSearchText(
            !!selectAndSearch,
            searchTextRef.current,
            selectedtext?.text
          );

          return (
            <MultiselectList
              onChange={onChange}
              onSearch={s => {
                setItems(() => defaultSearch(s, intialOptions));
              }}
              selectedValues={value}
              items={itemsWithSuggestions}
              checkboxes
              singleSelect={property.type === 'select'}
              search={searchTextRef.current}
              suggestions
            />
          );
        }}
      />
    </div>
  );
};

const Relationships = ({
  property,
  suggestion,
}: {
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
}) => {
  const intitialOptionsRef = useRef<MultiselectListOption[]>([]);
  const { control } = useFormContext();
  const selectedtext = useAtomValue(textSelectionAtom);
  const selectAndSearch = useAtomValue(selectAndSearchAtom);
  const [options, setOptions] = useState<MultiselectListOption[]>([]);
  const searchTextRef = useRef('');

  useEffect(() => {
    if (suggestion && property?.type === 'relationship') {
      const suggestions = getSuggestionValues(suggestion?.suggestedValue);

      Promise.all([
        lookup({ entityTitle: '', template: property?.content }),
        ...(suggestion
          ? [
              loadValuesAndSuggestions(
                suggestion.currentValue as string[],
                suggestions,
                suggestion.language
              ),
            ]
          : []),
      ])
        .then(([emptySearchResult, suggestedEntities]) => {
          const intialOptions = [...suggestedEntities, ...emptySearchResult.rows].reduce(
            (acc, option) => {
              if (!acc.find(_option => _option.value === option.sharedId)) {
                acc.push({
                  label: (
                    <MultiselectItemLabel
                      isSuggested={suggestions.includes(option.sharedId!)}
                      label={option.title!}
                      property={property}
                    />
                  ),
                  value: option.sharedId!,
                  searchLabel: option.title!,
                  suggested: suggestions?.includes(option.sharedId!),
                });
              }

              return acc;
            },
            [] as MultiselectListOption[]
          );

          intitialOptionsRef.current = intialOptions;
          setOptions(intialOptions);
        })
        .catch(e => {
          if (isClient) {
            const error = new Error('Lookup search error', { cause: e });
            captureException(error);
          }
        });
    }
  }, [property, suggestion]);

  const lookupSearch = async (searchTerm: string) => {
    if (!searchTerm) {
      setOptions(intitialOptionsRef.current);
    } else {
      const response = await lookup({
        entityTitle: searchTerm || '',
        template: property?.content,
      });

      const suggestions = getSuggestionValues(suggestion?.suggestedValue);

      setOptions(() =>
        response.rows.map(option => ({
          label: (
            <MultiselectItemLabel
              isSuggested={suggestions.includes(option.sharedId)}
              label={option.title}
              property={property!}
            />
          ),
          value: option.sharedId,
          searchLabel: option.title,
          suggested: suggestions?.includes(option.sharedId),
        }))
      );
    }
  };

  return (
    <div className="h-60">
      <Controller
        control={control}
        name="field"
        rules={{ required: property?.required }}
        render={({ field: { value, onChange } }) => {
          const itemsWithSuggestions = updateOptionsWithSelection(options || [], value);
          searchTextRef.current = calculateSearchText(
            !!selectAndSearch,
            searchTextRef.current,
            selectedtext?.text
          );

          return (
            <MultiselectList
              onChange={onChange}
              selectedValues={value}
              items={itemsWithSuggestions}
              checkboxes
              singleSelect={property.type === 'select'}
              search={searchTextRef.current}
              suggestions
              onSearch={lookupSearch}
            />
          );
        }}
      />
    </div>
  );
};

const TextInput = ({
  handleClickToFill,
  property,
  suggestion,
  clearSelectionButton,
}: {
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
  handleClickToFill: SidepanelFormsProps['handleClickToFill'];
  clearSelectionButton: SidepanelFormsProps['clearSelectionButton'];
}) => {
  const {
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const selectionError = useAtomValue(selectionErrorAtom);

  const templateId = suggestion?.entityTemplateId;

  let inputType: 'number' | 'date' | 'text' = 'text';

  switch (property.type) {
    case 'numeric':
      inputType = 'number';
      break;
    case 'date':
      inputType = 'date';
      break;
    default:
      break;
  }

  return (
    <div className="flex gap-2 grow items-center">
      <div className="grow">
        <InputField
          clearFieldAction={() => {
            setValue('field', '');
          }}
          id={property.label}
          label={<Translate context={templateId}>{property.label}</Translate>}
          hideLabel
          type={inputType}
          hasErrors={errors.field?.type === 'required' || !!selectionError}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...register('field', {
            required: property.required || property.name === 'title',
            valueAsDate: property.type === 'date' || undefined,
          })}
          errorMessage={
            errors.field?.type === 'required' && (
              <Translate className="sr-only">This field is required</Translate>
            )
          }
        />
      </div>
      <div>
        <Button
          type="button"
          styling="outline"
          onClick={async () => handleClickToFill()}
          disabled={isSubmitting}
        >
          <Translate className="">Click to fill</Translate>
        </Button>
      </div>
      {clearSelectionButton}
    </div>
  );
};

const Markdown = ({
  handleClickToFill,
  suggestion,
  property,
  clearSelectionButton,
}: {
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
  handleClickToFill: SidepanelFormsProps['handleClickToFill'];
  clearSelectionButton: SidepanelFormsProps['clearSelectionButton'];
}) => {
  const {
    control,
    setValue,
    formState: { isSubmitting, errors },
  } = useFormContext();
  const selectionError = useAtomValue(selectionErrorAtom);
  const templateId = suggestion?.entityTemplateId;

  return (
    <div className="relative flex gap-2 items-center">
      <Controller
        control={control}
        name="field"
        rules={{ required: property?.required }}
        render={({ field: { onChange, value } }) => (
          <Textarea
            id={property.name}
            label={<Translate context={templateId}>{property.label}</Translate>}
            hideLabel
            value={value as string}
            onChange={onChange}
            className="grow"
            disabled={isSubmitting}
            hasErrors={errors.field?.type === 'required' || !!selectionError}
            clearFieldAction={() => setValue('field', '')}
            errorMessage={
              errors.field?.type === 'required' && (
                <Translate className="sr-only">This field is required</Translate>
              )
            }
          />
        )}
      />
      <div>
        <Button
          type="button"
          styling="outline"
          onClick={async () => handleClickToFill()}
          disabled={isSubmitting}
        >
          <Translate className="">Click to fill</Translate>
        </Button>
      </div>
      {clearSelectionButton}
    </div>
  );
};

const SidepanelForms = ({
  property,
  suggestion,
  handleClickToFill,
  clearSelectionButton,
}: SidepanelFormsProps) => {
  switch (property?.type) {
    case 'select':
    case 'multiselect':
      return <Selects suggestion={suggestion} property={property} />;
    case 'relationship':
      return <Relationships suggestion={suggestion} property={property} />;
    case 'text':
    case 'date':
    case 'numeric':
      return (
        <TextInput
          handleClickToFill={handleClickToFill}
          suggestion={suggestion}
          property={property}
          clearSelectionButton={clearSelectionButton}
        />
      );
    case 'markdown':
      return (
        <Markdown
          handleClickToFill={handleClickToFill}
          suggestion={suggestion}
          property={property}
          clearSelectionButton={clearSelectionButton}
        />
      );
    default:
      return '';
  }
};

export { SidepanelForms };
