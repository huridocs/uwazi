/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { captureException } from '@sentry/react';
import { Translate } from 'app/I18N';
import { ClientPropertySchema } from 'app/istore';
import { isClient } from 'app/utils';
import { lookup } from 'V2/api/search';
import { InputField, MultiselectList, MultiselectListOption, Textarea } from 'V2/Components/Forms';
import { Button } from 'V2/Components/UI';
import { thesauriAtom } from 'V2/atoms';
import { loadValuesAndSuggestions } from './sidepanelFunctions';
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
  const selectedtext = useAtomValue(textSelectionAtom);
  const selectAndSearch = useAtomValue(selectAndSearchAtom);
  const thesauri = useAtomValue(thesauriAtom);
  const thesaurus = thesauri.find(item => item._id === property.content);
  const suggestions = getSuggestionValues(suggestion?.suggestedValue);

  const options = thesaurus?.values.map((value: any) => ({
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
  }));

  return (
    <div className="px-4 pb-4 h-60">
      <Controller
        control={control}
        name="field"
        rules={{ required: property?.required }}
        render={({ field: { value, onChange } }) => {
          const items = updateOptionsWithSelection(options || [], value);

          return (
            <MultiselectList
              onChange={onChange}
              selectedValues={value}
              items={items}
              checkboxes
              singleSelect={property.type === 'select'}
              search={selectAndSearch ? selectedtext?.text : undefined}
              suggestions
            />
          );
        }}
      />
    </div>
  );
};

// eslint-disable-next-line max-statements
const Relationships = ({
  property,
  suggestion,
}: {
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
}) => {
  const intitialOptionsRef = useRef<MultiselectListOption[]>([]);
  const thesauri = useAtomValue(thesauriAtom);
  const { control, watch } = useFormContext();
  const selectedtext = useAtomValue(textSelectionAtom);
  const selectAndSearch = useAtomValue(selectAndSearchAtom);
  const thesaurus = thesauri.find(item => item._id === property.content);
  const currentValues = watch('field');

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
        })
        .catch(e => {
          if (isClient) {
            const error = new Error('Lookup search error', { cause: e });
            captureException(error);
          }
        });
    }
  }, [property, suggestion]);

  useEffect(() => {
    if (property?.type === 'select' || property?.type === 'multiselect') {
      const suggestions = getSuggestionValues(suggestion?.suggestedValue);

      const multiselectOptions: MultiselectListOption[] = [];
      thesaurus?.values.forEach((value: any) => {
        multiselectOptions.push({
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
        });
      });

      intitialOptionsRef.current = multiselectOptions;
    }
  }, [property, suggestion, thesaurus]);

  const lookupSearch = async (searchTerm: string): Promise<MultiselectListOption[]> => {
    if (!searchTerm) {
      return updateOptionsWithSelection(intitialOptionsRef.current, currentValues as string[]);
    }

    const response = await lookup({
      entityTitle: searchTerm || '',
      template: property?.content,
    });

    const suggestions = getSuggestionValues(suggestion?.suggestedValue);

    const newOptions = response.rows.map(option => ({
      label: (
        <MultiselectItemLabel
          isSelected={Array.isArray(currentValues) && currentValues.includes(option.sharedId)}
          isSuggested={suggestions.includes(option.sharedId)}
          label={option.title}
          property={property!}
        />
      ),
      value: option.sharedId,
      searchLabel: option.title,
      suggested: suggestions?.includes(option.sharedId),
    }));

    return updateOptionsWithSelection(newOptions, currentValues);
  };

  return (
    <div className="px-4 pb-4 h-60">
      <Controller
        control={control}
        name="field"
        rules={{ required: property?.required }}
        render={({ field: { value, onChange } }) => (
          <MultiselectList
            onChange={onChange}
            selectedValues={value}
            items={updateOptionsWithSelection(intitialOptionsRef.current, value as string[])}
            checkboxes
            singleSelect={property.type === 'select'}
            search={selectAndSearch ? selectedtext?.text : ''}
            suggestions
            onSearch={property.type === 'relationship' ? lookupSearch : undefined}
          />
        )}
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
