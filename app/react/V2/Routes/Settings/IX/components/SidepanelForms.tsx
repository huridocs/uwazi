/* eslint-disable max-lines */
/* eslint-disable react/no-multi-comp */
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { get, isEmpty, uniqBy } from 'lodash';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, ClientPropertySchema } from 'app/istore';
import {
  defaultSearch,
  InputField,
  MultiselectList,
  MultiselectListOption,
  Textarea,
} from 'V2/Components/Forms';
import { Button } from 'V2/Components/UI';
import { thesauriAtom } from 'V2/atoms';
import { ClientIXExtractorType } from 'V2/shared/types';
import { handleUnexpectedError } from 'app/V2/shared/errorUtils';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import { DateTime } from 'luxon';
import { selectionErrorAtom, textSelectionAtom } from './atoms';
import { SuggestionValue, TableSuggestion } from '../types';
import { MultiselectItemLabel } from './MultiselectItemLabel';
import { selectAndSearchAtom } from './atoms/selectAndSearchAtom';
import { escapeLucene, searchRelatedEntities } from '../helpers';

const dateStringToSeconds = (dateString: string) =>
  DateTime.fromISO(dateString).setZone('UTC').toSeconds();

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

const getEntityLabel = (entity: ClientEntitySchema, extractor?: ClientIXExtractorType): string => {
  if (!extractor?.inheritedProperty) {
    return entity.title as string;
  }

  const inheritedValue = entity.metadata?.[extractor.inheritedProperty.name]?.[0];
  const inheritedLabel = inheritedValue?.label || inheritedValue?.value;

  return inheritedLabel
    ? `${inheritedLabel} (${entity.title as string})`
    : (entity.title as string);
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
  extractor?: ClientIXExtractorType;
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
  extractor,
}: {
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
  extractor: SidepanelFormsProps['extractor'];
}) => {
  const initialOptionsRef = useRef<MultiselectListOption[]>([]);
  const { control } = useFormContext();
  const selectedtext = useAtomValue(textSelectionAtom);
  const selectAndSearch = useAtomValue(selectAndSearchAtom);
  const [options, setOptions] = useState<MultiselectListOption[]>([]);
  const searchTextRef = useRef('');

  useEffect(() => {
    if (suggestion && property?.type === 'relationship') {
      const currentValues = Array.isArray(suggestion.currentValue)
        ? suggestion.currentValue
        : [suggestion.currentValue];

      const suggestedValues = Array.isArray(suggestion.suggestedValue)
        ? suggestion.suggestedValue
        : [suggestion.suggestedValue];

      const allOptions: { sharedId: string; label: string; suggested: boolean }[] = uniqBy(
        currentValues
          .concat(suggestedValues)
          .filter(value => value !== undefined)
          .map((value: SuggestionValue) => ({
            sharedId: get(value, 'id') || (value as string),
            label: get(value, 'label') || (value as string),
            suggested: true,
          })),
        'sharedId'
      );
      let searchQuery = `(template:${property?.content}) AND language:(${suggestion?.language})`;
      if (searchTextRef.current) {
        const escapedText = escapeLucene(searchTextRef.current.trim());
        const fieldName = extractor?.inheritedProperty?.name;

        const searchField = ['select', 'multiselect'].includes(
          extractor?.inheritedProperty?.type || ''
        )
          ? '.label'
          : '.value';

        if (extractor?.inheritedProperty) {
          const exactMatchText = `metadata.${fieldName}${searchField}:("${escapedText}")`;
          const wildcardMatchText = `metadata.${fieldName}${searchField}:(${escapedText}*)`;
          searchQuery = `${searchQuery} AND  (${exactMatchText} OR ${wildcardMatchText})`;
        } else {
          searchQuery = `${searchQuery} AND title:(${escapedText}*)`;
        }
      }
      if (!isEmpty(allOptions)) {
        searchQuery = `sharedId:(${allOptions.map(option => option.sharedId).join(' OR ')}) OR (${searchQuery})`;
      }

      searchRelatedEntities(searchQuery, extractor?.inheritedProperty)
        .then((searchResult: ClientEntitySchema[]) => {
          searchResult.forEach(entity => {
            const existingOption = allOptions.find(option => entity.sharedId === option?.sharedId);
            if (!existingOption) {
              allOptions.push({
                sharedId: entity.sharedId as string,
                label: getEntityLabel(entity, extractor),
                suggested: false,
              });
            } else {
              existingOption.label = getEntityLabel(entity, extractor);
            }
          });

          const initialOptions: MultiselectListOption[] = allOptions.map(option => ({
            label: (
              <MultiselectItemLabel
                isSuggested={option.suggested}
                label={option.label}
                property={property}
              />
            ),
            value: option.sharedId,
            searchLabel: option.label!,
            suggested: option.suggested,
          }));

          initialOptionsRef.current = initialOptions;
          setOptions(initialOptions);
        })
        .catch(e => {
          initialOptionsRef.current = [];
          setOptions([]);
          handleUnexpectedError(e, 'Error looking up search');
        });
    }
  }, [property, suggestion, extractor]);

  const lookupSearch = async (searchTerm: string) => {
    if (!searchTerm) {
      setOptions(initialOptionsRef.current);
    } else {
      const escapedText = escapeLucene(searchTerm.trim());
      const fieldName = extractor?.inheritedProperty?.name;

      const searchField = ['select', 'multiselect'].includes(
        extractor?.inheritedProperty?.type || ''
      )
        ? '.label'
        : '.value';

      const searchQuery = `(template:${property?.content}) AND language:(${suggestion?.language}) AND ${
        extractor?.inheritedProperty && fieldName
          ? `(metadata.${fieldName}${searchField}:("${escapedText}") OR metadata.${fieldName}${searchField}:(${escapedText}*))`
          : `title:(${escapedText}*)`
      } `;

      const response = await searchRelatedEntities(searchQuery, extractor?.inheritedProperty);

      const suggestedValues = Array.isArray(suggestion?.suggestedValue)
        ? suggestion.suggestedValue
        : [suggestion?.suggestedValue];

      const suggestedSharedIds = suggestedValues.map(value => get(value, 'value') || value);

      setOptions(() =>
        response.map((entity: ClientEntitySchema) => {
          const label = getEntityLabel(entity, extractor);
          return {
            label: (
              <MultiselectItemLabel
                isSuggested={suggestedSharedIds.includes(entity.sharedId!)}
                label={label}
                property={property!}
              />
            ),
            value: entity.sharedId!,
            searchLabel: label,
            suggested: suggestedSharedIds.includes(entity.sharedId!),
          };
        })
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
    watch,
    formState: { errors, isSubmitting },
  } = useFormContext();

  // Register the field for non-date fields
  const fieldRegistration =
    property.type !== 'date'
      ? register('field', {
          required: property.required || property.name === 'title',
        })
      : {
          onChange: undefined,
          onBlur: undefined,
          name: 'field',
          ref: undefined,
        };

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

  const fieldValue = watch('field');

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (dateString) {
      const timestamp = dateStringToSeconds(dateString);
      setValue('field', timestamp, { shouldDirty: true });
    } else {
      setValue('field', '', { shouldDirty: true });
    }
  };

  const getDisplayValue = () => {
    if (property.type === 'date' && typeof fieldValue === 'number') {
      return secondsToISODate(fieldValue);
    }
    return fieldValue;
  };

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
          value={getDisplayValue()}
          onChange={property.type === 'date' ? handleDateChange : fieldRegistration.onChange}
          onBlur={fieldRegistration.onBlur}
          name={fieldRegistration.name || 'field'}
          ref={fieldRegistration.ref}
          hasErrors={errors.field?.type === 'required' || !!selectionError}
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
  extractor,
}: SidepanelFormsProps) => {
  switch (property?.type) {
    case 'select':
    case 'multiselect':
      return <Selects suggestion={suggestion} property={property} />;
    case 'relationship':
      return <Relationships suggestion={suggestion} property={property} extractor={extractor} />;
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
