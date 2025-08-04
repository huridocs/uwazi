/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { captureException } from '@sentry/react';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import { ClientPropertySchema } from 'app/istore';
import { isClient } from 'app/utils';
import { lookup } from 'V2/api/search';
import { InputField, MultiselectList, MultiselectListOption, Textarea } from 'V2/Components/Forms';
import { Button } from 'V2/Components/UI';
import { selectionHandlers } from 'V2/Components/PDFViewer';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import { pdfScaleAtom, thesauriAtom } from 'V2/atoms';
import { coerceValue, loadValuesAndSuggestions } from './sidepanelFunctions';
import { highlightsAtom, selectionsAtom, selectionErrorAtom, textSelectionAtom } from './atoms';
import { TableSuggestion } from '../types';
import { MultiselectItemLabel } from './MultiselectItemLabel';

enum HighlightColors {
  CURRENT = '#B1F7A3',
  NEW = '#F27DA5',
}

type SidepanelFormsProps = {
  property?: ClientPropertySchema;
  suggestion?: TableSuggestion;
  file?: FileType;
};

const Select = ({
  property,
  suggestion,
}: {
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
}) => {
  const [options, setOptions] = useState<MultiselectListOption[]>([]);
  const intitialOptionsRef = useRef<MultiselectListOption[]>([]);
  const thesauris = useAtomValue(thesauriAtom);
  const { control, getValues } = useFormContext();
  const selectedtext = useAtomValue(textSelectionAtom);

  const thesaurus = thesauris.find(thes => thes._id === property.content);

  useEffect(() => {
    if (property?.type === 'relationship') {
      const currentValues = (getValues('field') as string[]) || [];
      const suggestions = (suggestion?.suggestedValue as string[]) || [];

      Promise.all([
        lookup({ entityTitle: '', template: property?.content }),
        ...(suggestion
          ? [
              loadValuesAndSuggestions(
                suggestion.currentValue as string[],
                suggestion.suggestedValue as string[],
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
                      isSelected={currentValues.includes(option.sharedId!)}
                      isSuggested={suggestions.includes(option.sharedId!)}
                      label={option.title!}
                      property={property}
                    />
                  ),
                  value: option.sharedId!,
                  searchLabel: option.title!,
                  suggested: (suggestion?.suggestedValue as string[])?.includes(option.sharedId!),
                });
              }

              return acc;
            },
            [] as MultiselectListOption[]
          );

          setOptions(intialOptions);
          intitialOptionsRef.current = intialOptions;
        })
        .catch(e => {
          if (isClient) {
            const error = new Error('Lookup search error', { cause: e });
            captureException(error);
          }
        });
    }
  }, [getValues, property, suggestion]);

  useEffect(() => {
    if (property?.type === 'select' || property?.type === 'multiselect') {
      const currentValues = (getValues('field') as string[]) || [];
      const suggestions = (suggestion?.suggestedValue as string[]) || [];

      const multiselectOptions: MultiselectListOption[] = [];
      thesaurus?.values.forEach((value: any) => {
        multiselectOptions.push({
          label: (
            <MultiselectItemLabel
              isSelected={currentValues.includes(value)}
              isSuggested={suggestions.includes(value)}
              label={value.label}
              property={property}
            />
          ),
          searchLabel: value.label.toLowerCase(),
          value: value.id,
          suggested: (suggestion?.suggestedValue as string[])?.includes(value.id),
          items: value.values?.map((subValue: any) => ({
            label: (
              <MultiselectItemLabel
                isSelected={currentValues.includes(value)}
                isSuggested={suggestions.includes(value)}
                label={subValue.label}
                property={property}
              />
            ),
            searchLabel: subValue.label.toLowerCase(),
            value: subValue.id,
            suggested: (suggestion?.suggestedValue as string[])?.includes(subValue.id),
          })),
        });
      });
      setOptions(multiselectOptions);
    }
  }, [getValues, property, suggestion?.suggestedValue, thesaurus?.values]);

  const lookupSearch = async (searchTerm: string): Promise<MultiselectListOption[]> => {
    if (!searchTerm) {
      return intitialOptionsRef.current;
    }

    const response = await lookup({
      entityTitle: searchTerm || '',
      template: property?.content,
    });

    const currentValues = (getValues('field') as string[]) || [];
    const suggestions = (suggestion?.suggestedValue as string[]) || [];

    return response.rows.map(option => ({
      label: (
        <MultiselectItemLabel
          isSelected={currentValues.includes(option.sharedId)}
          isSuggested={suggestions.includes(option.sharedId)}
          label={option.title}
          property={property!}
        />
      ),
      value: option.sharedId,
      searchLabel: option.title,
      suggested: (suggestion?.suggestedValue as string[])?.includes(option.sharedId),
    }));
  };

  return (
    <div className="px-4 pb-4 overflow-y-scroll max-h-60">
      <Controller
        control={control}
        name="field"
        rules={{ required: property?.required }}
        render={({ field: { onChange, value } }) => (
          <MultiselectList
            onChange={onChange}
            selectedValues={value as string[]}
            items={options}
            checkboxes
            singleSelect={property.type === 'select'}
            search={selectedtext?.text}
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
  file,
}: {
  handleClickToFill: () => Promise<void>;
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
  file: SidepanelFormsProps['file'];
}) => {
  const {
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const [highlights, setHighlights] = useAtom(highlightsAtom);
  const selectionError = useAtomValue(selectionErrorAtom);
  const setSelections = useSetAtom(selectionsAtom);

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
      {suggestion?.extractorSource.pdf && (
        <div className="sm:text-right" data-testid="ix-clear-button-container">
          <Button
            type="button"
            styling="outline"
            disabled={Boolean(!highlights) || isSubmitting}
            onClick={() => {
              setHighlights(undefined);
              setSelections(
                selectionHandlers.deleteFileSelection(
                  { name: suggestion?.propertyName || '' },
                  file?.extractedMetadata
                )
              );
            }}
          >
            <Translate>Clear</Translate>
          </Button>
        </div>
      )}
    </div>
  );
};

const Markdown = ({
  handleClickToFill,
  suggestion,
  file,
  property,
}: {
  handleClickToFill: () => Promise<void>;
  property: ClientPropertySchema;
  suggestion: SidepanelFormsProps['suggestion'];
  file: SidepanelFormsProps['file'];
}) => {
  const {
    control,
    setValue,
    formState: { isSubmitting, errors },
  } = useFormContext();

  const [highlights, setHighlights] = useAtom(highlightsAtom);
  const setSelections = useSetAtom(selectionsAtom);
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
      {suggestion?.extractorSource.pdf && (
        <div className="sm:text-right" data-testid="ix-clear-button-container">
          <Button
            type="button"
            styling="outline"
            disabled={Boolean(!highlights) || isSubmitting}
            onClick={() => {
              setHighlights(undefined);
              setSelections(
                selectionHandlers.deleteFileSelection(
                  { name: suggestion?.propertyName || '' },
                  file?.extractedMetadata
                )
              );
            }}
          >
            <Translate>Clear</Translate>
          </Button>
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line max-statements
const SidepanelForms = ({ property, suggestion, file }: SidepanelFormsProps) => {
  const selectedText = useAtomValue(textSelectionAtom);
  const pdfScalingValue = useAtomValue(pdfScaleAtom);
  const setHighlights = useSetAtom(highlightsAtom);
  const setSelections = useSetAtom(selectionsAtom);
  const setSelectionError = useSetAtom(selectionErrorAtom);

  const { setValue } = useFormContext();

  if (!property) {
    return '';
  }

  // eslint-disable-next-line max-statements
  const handleClickToFill = async () => {
    if (selectedText) {
      if (selectedText.selectionRectangles) {
        const normalizedSelections = selectionHandlers.adjustSelectionsToScale(
          selectedText,
          pdfScalingValue,
          true
        );

        setHighlights(
          selectionHandlers.getHighlightsFromSelection(normalizedSelections, HighlightColors.NEW)
        );
        setSelections(
          selectionHandlers.updateFileSelection(
            { name: suggestion?.propertyName || '', id: property._id as string },
            file?.extractedMetadata,
            normalizedSelections
          )
        );
      }

      if (property.type === 'date' || property.type === 'numeric') {
        const coercedValue = await coerceValue(property.type, selectedText.text, file?.language);

        if (!coercedValue?.success) {
          setSelectionError('Value cannot be transformed to the correct type');
        } else {
          const value =
            property.type === 'date' ? secondsToISODate(coercedValue.value) : coercedValue.value;
          setValue('field', value, { shouldDirty: true });
          setSelectionError(undefined);
        }
      } else {
        const sanitizedText = selectedText.text?.replace(/[\n\r]/g, ' ');
        setValue('field', sanitizedText, { shouldDirty: true });
      }
    }
  };

  switch (property?.type) {
    case 'select':
    case 'multiselect':
    case 'relationship':
      return <Select suggestion={suggestion} property={property} />;
    case 'text':
    case 'date':
    case 'numeric':
      return (
        <TextInput
          handleClickToFill={handleClickToFill}
          suggestion={suggestion}
          file={file}
          property={property}
        />
      );
    case 'markdown':
      return (
        <Markdown
          handleClickToFill={handleClickToFill}
          suggestion={suggestion}
          file={file}
          property={property}
        />
      );
    default:
      return '';
  }
};

export { SidepanelForms };
