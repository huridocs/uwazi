/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-statements */
import { ChevronDownIcon, ChevronUpIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import loadable from '@loadable/component';
import { InputField, MultiselectList, MultiselectListOption, Textarea } from 'V2/Components/Forms';
import { PDF, selectionHandlers } from 'V2/Components/PDFViewer';
import { Button, Sidepanel } from 'V2/Components/UI';
import { lookup } from 'V2/api/search';
import { notificationAtom, pdfScaleAtom, thesauriAtom } from 'V2/atoms';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLoaderData } from 'react-router';
import { FetchResponseError } from 'shared/JSONRequest';
import { ExtractedMetadataSchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import { Highlights, SuggestionValue, TableSuggestion } from '../types';
import {
  coerceValue,
  getFormValue,
  handleEntitySave,
  loadSidepanelData,
  SELECT_TYPES,
  loadValuesAndSuggestions,
} from './sidepanelFunctions';
import { MultiselectItemLabel } from './MultiselectItemLabel';

//This is imported via loadable due to https://github.com/huridocs/uwazi/issues/7808
const TextProperty = loadable(async () => (await import('./TextProperty')).TextProperty);

const getSuggestionValues = (suggestedValue: SuggestionValue[] | undefined): string[] => {
  if (!suggestedValue) return [];
  return suggestedValue.map(s => {
    if (s && typeof s === 'object' && 'id' in s) {
      return s.id;
    }
    return String(s);
  });
};

interface SuggestionSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion?: TableSuggestion;
  onEntitySave: () => any;
  property?: ClientPropertySchema;
}

enum HighlightColors {
  CURRENT = '#B1F7A3',
  NEW = '#F27DA5',
}

const SuggestionSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  suggestion,
  onEntitySave,
  property,
}: SuggestionSidepanelProps) => {
  const [pdf, setPdf] = useState<FileType | undefined>();
  const [selectedText, setSelectedText] = useState<TextSelection>();
  const [selectionError, setSelectionError] = useState<string>();
  const [highlights, setHighlights] = useState<Highlights>();
  const [selections, setSelections] = useState<ExtractedMetadataSchema[] | undefined>(undefined);
  const [labelInputIsOpen, setLabelInputIsOpen] = useState(true);
  const [entity, setEntity] = useState<ClientEntitySchema>();
  const [thesaurus, setThesaurus] = useState<any>();
  const setNotifications = useSetAtom(notificationAtom);
  const thesauris = useAtomValue(thesauriAtom);
  const templateId = suggestion?.entityTemplateId;
  const [initialValue, setInitialValue] = useState<PropertyValueSchema | PropertyValueSchema[]>();
  const [selectAndSearch, setSelectAndSearch] = useState(false);
  const [selectAndSearchValue, setSelectAndSearchValue] = useState<string | undefined>();
  const [options, setOptions] = useState<MultiselectListOption[]>([]);
  const intitialOptionsRef = useRef<MultiselectListOption[]>([]);
  const pdfScalingValue = useAtomValue(pdfScaleAtom);
  const { templates } = useLoaderData() as { templates: ClientTemplateSchema[] };

  useEffect(() => {
    if (suggestion) {
      setInitialValue(getFormValue(suggestion, entity, property?.type));
    }
  }, [suggestion, entity, property]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    control,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    values: {
      field: initialValue,
    },
  });

  const watchField = watch('field');

  useEffect(() => {
    if (property?.type === 'select' || property?.type === 'multiselect') {
      const currentValues = (getValues('field') as string[]) || [];
      const suggestions = getSuggestionValues(suggestion?.suggestedValue as SuggestionValue[]);

      const _options: MultiselectListOption[] = [];
      thesaurus?.values.forEach((value: any) => {
        _options.push({
          label: (
            <MultiselectItemLabel
              isSelected={currentValues.includes(value.id)}
              isSuggested={suggestions.includes(value.id)}
              label={value.label}
              property={property}
            />
          ),
          searchLabel: value.label.toLowerCase(),
          value: value.id,
          suggested: suggestions.includes(value.id),
          items: value.values?.map((subValue: any) => ({
            label: (
              <MultiselectItemLabel
                isSelected={currentValues.includes(value.id)}
                isSuggested={suggestions.includes(value.id)}
                label={subValue.label}
                property={property}
              />
            ),
            searchLabel: subValue.label.toLowerCase(),
            value: subValue.id,
            suggested: suggestions.includes(subValue.id),
          })),
        });
      });
      setOptions(_options);
    }
  }, [getValues, property, suggestion, thesaurus, watchField]);

  useEffect(() => {
    if (property?.content) {
      const _thesaurus = thesauris.find(thes => thes._id === property.content);
      setThesaurus(_thesaurus);
    }
  }, [property, thesauris]);

  useEffect(() => {
    if (suggestion) {
      loadSidepanelData(suggestion)
        .then(({ file, entity: suggestionEntity }) => {
          setPdf(file || undefined);
          setEntity(suggestionEntity);
        })
        .catch(e => {
          throw e;
        });
    }
  }, [property, suggestion]);

  useEffect(() => {
    if (showSidepanel && pdf?.extractedMetadata && suggestion) {
      setHighlights(
        selectionHandlers.getHighlightsFromFile(
          pdf.extractedMetadata,
          suggestion.propertyName,
          HighlightColors.CURRENT
        )
      );
    }
  }, [pdf, setValue, showSidepanel, suggestion]);

  useEffect(() => {
    if (showSidepanel && property?.type === 'relationship') {
      const currentValues = (getValues('field') as string[]) || [];
      const suggestions = getSuggestionValues(suggestion?.suggestedValue as SuggestionValue[]);

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
                      isSelected={currentValues.includes(option.sharedId!)}
                      isSuggested={suggestions.includes(option.sharedId!)}
                      label={option.title!}
                      property={property}
                    />
                  ),
                  value: option.sharedId!,
                  searchLabel: option.title!,
                  suggested: suggestions.includes(option.sharedId!),
                });
              }

              return acc;
            },
            [] as MultiselectListOption[]
          );

          setOptions(intialOptions);
          intitialOptionsRef.current = intialOptions;
        })
        .catch(() => {});
    }
  }, [getValues, property, showSidepanel, suggestion]);

  const handleClose = () => {
    setSelectedText(undefined);
    setSelectionError(undefined);
    setHighlights(undefined);
    setSelections(undefined);
    setValue('field', undefined, { shouldDirty: false });
    setPdf(undefined);
    setEntity(undefined);
    setSelectAndSearchValue('');
    setSelectAndSearch(false);
    reset();
    setShowSidepanel(false);
  };

  const template = templates.find(tpl => tpl._id.toString() === templateId);

  const createOnSubmit =
    (sourceType: 'pdf' | 'entity_property') =>
    async (value: { field: PropertyValueSchema | PropertyValueSchema[] | undefined }) => {
      if (!property) {
        throw new Error('Property not found');
      }

      let metadata = value.field;

      if (property.type === 'date' && isDirty && metadata) {
        metadata = (await coerceValue('date', metadata as string, pdf?.language || 'en'))?.value;
      }

      const entityToSave = { ...entity };

      if (sourceType === 'pdf') {
        entityToSave.__extractedMetadata = { fileID: pdf?._id, selections };
      }

      const savedEntity = await handleEntitySave(
        entityToSave,
        property,
        metadata,
        template,
        isDirty
      );

      if (savedEntity instanceof FetchResponseError) {
        const details = (savedEntity as FetchResponseError)?.json.prettyMessage;

        setNotifications({ type: 'error', text: 'An error occurred', details });
      } else if (savedEntity) {
        if (savedEntity) {
          setEntity(savedEntity);
          onEntitySave();
        }

        setNotifications({ type: 'success', text: 'Saved successfully.' });
      }

      handleClose();
    };

  const handleClickToFill = async () => {
    if (!property) {
      throw new Error('Property not found');
    }

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
            pdf?.extractedMetadata,
            normalizedSelections
          )
        );
      }

      if (property.type === 'date' || property.type === 'numeric') {
        const coercedValue = await coerceValue(property.type, selectedText.text, pdf?.language);

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

  const renderInputText = (type: 'text' | 'date' | 'numeric') => {
    if (!property) {
      return null;
    }
    const inputType = type === 'numeric' ? 'number' : type;
    return (
      <div className={`relative flex gap-2 px-4 pb-4 grow  ${labelInputIsOpen ? '' : 'hidden'}`}>
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
              required: property.required,
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
                    pdf?.extractedMetadata
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

  const _lookup = async (searchTerm: string): Promise<MultiselectListOption[]> => {
    if (!searchTerm) {
      return intitialOptionsRef.current;
    }

    const response = await lookup({
      entityTitle: searchTerm || '',
      template: property?.content,
    });

    const currentValues = (getValues('field') as string[]) || [];
    const suggestions = getSuggestionValues(suggestion?.suggestedValue as SuggestionValue[]);

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
      suggested: suggestions.includes(option.sharedId),
    }));
  };

  const renderSelect = (type: 'select' | 'multiselect' | 'relationship') => (
    <div className={`px-4 pb-4 overflow-y-scroll ${labelInputIsOpen ? '' : 'hidden'}`}>
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
            singleSelect={type === 'select'}
            search={selectAndSearchValue}
            suggestions
            onSearch={type === 'relationship' ? _lookup : undefined}
          />
        )}
      />
    </div>
  );

  const renderMarkdown = () => {
    if (!property) {
      return null;
    }
    return (
      <div className={`relative flex gap-2 px-4 pb-4 ${labelInputIsOpen ? '' : 'hidden'}`}>
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
                    pdf?.extractedMetadata
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

  const renderForm = () => {
    switch (property?.type) {
      case 'text':
      case 'date':
      case 'numeric':
        return renderInputText(property?.type);
      case 'select':
      case 'multiselect':
      case 'relationship':
        return renderSelect(property?.type);
      case 'markdown':
        return renderMarkdown();
      default:
        return '';
    }
  };

  const sourceType = suggestion?.extractorSource.pdf ? 'pdf' : 'entity_property';

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      size="large"
      title={entity?.title}
      closeSidepanelFunction={handleClose}
    >
      <div className="flex-grow overflow-y-scroll">
        <form
          id="ixpdfform"
          className="flex flex-col h-full gap-4 p-0"
          onSubmit={handleSubmit(createOnSubmit(sourceType))}
        >
          <div className="grow">
            {suggestion?.extractorSource.pdf && pdf && (
              <PDF
                fileUrl={`/api/files/${pdf.filename}`}
                highlights={highlights}
                onSelect={selection => {
                  if (!selection.selectionRectangles.length) {
                    setSelectionError('Could not detect the area for the selected text');
                    setSelectedText(undefined);
                  } else {
                    setSelectionError(undefined);
                    setSelectedText(selection);
                  }
                }}
                onDeselect={() => {
                  setSelectionError(undefined);
                  setSelectedText(undefined);
                }}
                scrollToPage={!selectedText ? Object.keys(highlights || {})[0] : undefined}
              />
            )}
            {suggestion?.extractorSource.property && (
              <Sidepanel.Body>
                <TextProperty
                  propertyName={suggestion.extractorSource.property}
                  entity={entity}
                  template={template}
                  onSelect={selection => {
                    setSelectedText(selection);
                  }}
                  onDeselect={() => {
                    setSelectedText(undefined);
                  }}
                />
              </Sidepanel.Body>
            )}
          </div>
        </form>
      </div>
      <Sidepanel.Footer
        className={`max-h-[40%] ${labelInputIsOpen && ['select', 'multiselect', 'relationship'].includes(property?.type || '') ? 'h-[40%]' : ''}`}
      >
        <div className="relative flex flex-col h-full py-0 border border-b-0 border-l-0 border-r-0 border-gray-200 border-t-1">
          <div className="sticky top-0 flex px-4 py-2 bg-gray-50">
            <p className={selectionError ? 'text-pink-600 grow  flex gap-4' : 'grow flex gap-4'}>
              <Translate
                className="font-semibold leading-6 text-gray-500 uppercase "
                context={templateId}
              >
                {property?.label}
              </Translate>{' '}
              {SELECT_TYPES.includes(property?.type || '') && (
                <button
                  type="button"
                  onClick={() => setSelectAndSearchValue(selectedText?.text)}
                  className={`${selectAndSearch ? 'bg-primary-50 border-primary-800' : 'bg-white border-gray-200'} border flex items-center gap-1 px-2 py-0 text-xs font-medium text-gray-900 rounded-md hover:border-primary-800 hover:bg-primary-50`}
                >
                  <PlusCircleIcon className="w-3" />
                  <Translate>Select & Search</Translate>
                </button>
              )}
              {selectionError && <span>{selectionError}</span>}
            </p>
            <span onClick={() => setLabelInputIsOpen(old => !old)} className="cursor-pointer">
              {labelInputIsOpen ? <ChevronDownIcon width={20} /> : <ChevronUpIcon width={20} />}
            </span>
          </div>
          {renderForm()}
          <div className="sticky bottom-0 flex justify-end gap-2 px-4 py-2 bg-white border border-b-0 border-l-0 border-r-0 border-gray-200 border-t-1">
            <Button type="button" styling="outline" disabled={isSubmitting} onClick={handleClose}>
              <Translate>Cancel</Translate>
            </Button>
            <Button type="submit" form="ixpdfform" disabled={isSubmitting} color="success">
              <Translate>Accept</Translate>
            </Button>
          </div>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { SuggestionSidepanel };
