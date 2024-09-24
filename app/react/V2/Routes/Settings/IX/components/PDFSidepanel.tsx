/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useSetAtom, useAtomValue } from 'jotai';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, ClientPropertySchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { FetchResponseError } from 'shared/JSONRequest';
import {
  ExtractedMetadataSchema,
  PropertyValueSchema,
  MetadataObjectSchema,
} from 'shared/types/commonTypes';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { FileType } from 'shared/types/fileType';
import * as filesAPI from 'V2/api/files';
import * as entitiesAPI from 'V2/api/entities';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField, MultiselectList, MultiselectListOption } from 'V2/Components/Forms';
import { PDF, selectionHandlers } from 'V2/Components/PDFViewer';
import { notificationAtom, thesauriAtom } from 'V2/atoms';
import { Highlights } from '../types';

const SELECT_TYPES = ['select', 'multiselect', 'relationship'];

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion?: EntitySuggestionType;
  onEntitySave: (entity: ClientEntitySchema) => any;
  property?: ClientPropertySchema;
}

enum HighlightColors {
  CURRENT = '#B1F7A3',
  NEW = '#F27DA5',
}

const getFormValue = (
  suggestion?: EntitySuggestionType,
  entity?: ClientEntitySchema,
  type?: string
) => {
  let value;

  if (!suggestion || !entity) {
    return value;
  }

  if (suggestion.propertyName === 'title' && entity.title) {
    value = entity.title;
  }

  if (suggestion.propertyName !== 'title' && entity.metadata) {
    const entityMetadata = entity.metadata[suggestion.propertyName];
    value = entityMetadata?.length ? entityMetadata[0].value : '';

    if (type === 'date' && value) {
      const dateString = secondsToISODate(value as number);
      value = dateString;
    }

    if (type === 'select' || type === 'multiselect' || type === 'relationship') {
      value = entityMetadata?.map((metadata: MetadataObjectSchema) => metadata.value);
    }
  }

  return value;
};

const loadSidepanelData = async ({ fileId, entityId, language }: EntitySuggestionType) => {
  const [file, entity] = await Promise.all([
    filesAPI.getById(fileId),
    entitiesAPI.getById({ _id: entityId, language }),
  ]);

  return { file: file[0], entity: entity[0] };
};

const handleFileSave = async (file?: FileType, newSelections?: ExtractedMetadataSchema[]) => {
  if (file && newSelections) {
    const fileToSave = { ...file };
    fileToSave.extractedMetadata = newSelections;
    return filesAPI.update(fileToSave);
  }

  return undefined;
};

const handleEntitySave = async (
  entity?: ClientEntitySchema,
  propertyName?: string,
  metadata?: PropertyValueSchema | PropertyValueSchema[] | undefined,
  fieldHasChanged?: boolean
) => {
  if (!fieldHasChanged || !entity || !propertyName) {
    return undefined;
  }

  let data;

  if (propertyName === 'title' && typeof metadata === 'string') {
    data = { title: metadata };
  } else {
    data = { properties: [{ [propertyName]: metadata }] };
  }

  const entityToSave = entitiesAPI.formatter.update(entity, data);

  return entitiesAPI.save(entityToSave);
};

const coerceValue = async (
  propertyType: 'date' | 'numeric',
  text: string | Date | undefined,
  documentLanguage: string = 'en'
) => {
  if (propertyType === 'date' && !Number.isNaN(text?.valueOf())) {
    return entitiesAPI.coerceValue(text!, 'date', documentLanguage);
  }

  if (propertyType === 'numeric' && typeof text === 'string') {
    return entitiesAPI.coerceValue(text.trim(), 'numeric', documentLanguage);
  }

  return undefined;
};

const PDFSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  suggestion,
  onEntitySave,
  property,
}: PDFSidepanelProps) => {
  const [pdf, setPdf] = useState<FileType>();
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

  useEffect(() => {
    if (suggestion) {
      setInitialValue(getFormValue(suggestion, entity, property?.type));
    }
  }, [suggestion, entity, property]);

  useEffect(() => {
    if (selectAndSearch) {
      setSelectAndSearchValue(selectedText?.text);
    } else {
      setSelectAndSearchValue(undefined);
    }
  }, [selectAndSearch, setSelectAndSearchValue, selectedText]);

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
    const renderLabel = (value: any) => {
      const matchingStyles = 'bg-success-50 text-success-800';
      const nonMatchingStyles = 'bg-orange-50 text-orange-800';
      const currentValues = (getValues('field') as string[]) || [];
      const suggestions = (suggestion?.suggestedValue as string[]) || [];
      const isSelected = currentValues.includes(value.id);
      const isSuggested = suggestions.includes(value.id);
      let styles = '';

      if (isSelected && isSuggested) {
        styles = matchingStyles;
      }

      if (!isSelected && isSuggested) {
        styles = nonMatchingStyles;
      }
      return (
        <Translate className={styles} context={property?.content}>
          {value.label}
        </Translate>
      );
    };

    const _options: MultiselectListOption[] = [];

    thesaurus?.values.forEach((value: any) => {
      _options.push({
        label: renderLabel(value),
        searchLabel: value.label.toLowerCase(),
        value: value.id,
        suggested: (suggestion?.suggestedValue as string[])?.includes(value.id),
        items: value.values?.map((subValue: any) => ({
          label: renderLabel(subValue),
          searchLabel: subValue.label.toLowerCase(),
          value: subValue.id,
          suggested: (suggestion?.suggestedValue as string[])?.includes(subValue.id),
        })),
      });
    });
    setOptions(_options);
  }, [getValues, property, suggestion, thesaurus, watchField]);

  useEffect(() => {
    if (property?.content) {
      const _thesaurus = thesauris.find(thes => thes._id === property.content);
      setThesaurus(_thesaurus);
    }

    return () => {
      setThesaurus(undefined);
    };
  }, [property, thesauris]);

  useEffect(() => {
    if (suggestion) {
      loadSidepanelData(suggestion)
        .then(({ file, entity: suggestionEntity }) => {
          setPdf(file);
          setEntity(suggestionEntity);
        })
        .catch(e => {
          throw e;
        });
    }

    return () => {
      setPdf(undefined);
      setEntity(undefined);
    };
  }, [suggestion]);

  useEffect(() => {
    if (pdf?.extractedMetadata && suggestion && showSidepanel) {
      setSelectedText(undefined);
      setHighlights(
        selectionHandlers.getHighlightsFromFile(
          pdf.extractedMetadata,
          suggestion.propertyName,
          HighlightColors.CURRENT
        )
      );
    }

    return () => {
      setSelectedText(undefined);
      setSelectionError(undefined);
      setHighlights(undefined);
      setSelections(undefined);
      setValue('field', undefined, { shouldDirty: false });
    };
  }, [pdf, setValue, showSidepanel, suggestion]);

  const onSubmit = async (value: {
    field: PropertyValueSchema | PropertyValueSchema[] | undefined;
  }) => {
    if (!property) {
      throw new Error('Property not found');
    }

    let metadata = value.field;

    if (property.type === 'date' && isDirty && metadata) {
      metadata = (await coerceValue('date', metadata as string, pdf?.language || 'en'))?.value;
    }

    const [savedFile, savedEntity] = await Promise.all([
      handleFileSave(pdf, selections),
      handleEntitySave(entity, property.name, metadata, isDirty),
    ]);

    if (savedFile instanceof FetchResponseError || savedEntity instanceof FetchResponseError) {
      const details =
        (savedFile as FetchResponseError)?.json.prettyMessage ||
        (savedEntity as FetchResponseError)?.json.prettyMessage;

      setNotifications({ type: 'error', text: 'An error occurred', details });
    } else if (savedFile || savedEntity) {
      if (savedFile) {
        setPdf(savedFile);
      }

      if (savedEntity) {
        setEntity(savedEntity);
        onEntitySave(savedEntity);
      }

      setNotifications({ type: 'success', text: 'Saved successfully.' });
    }

    setShowSidepanel(false);
  };

  const handleClickToFill = async () => {
    if (!property) {
      throw new Error('Property not found');
    }

    if (selectedText) {
      setHighlights(
        selectionHandlers.getHighlightsFromSelection(selectedText, HighlightColors.NEW)
      );
      setSelections(
        selectionHandlers.updateFileSelection(
          { name: suggestion?.propertyName || '', id: property._id as string },
          pdf?.extractedMetadata,
          selectedText
        )
      );

      if (property.type === 'date' || property.type === 'numeric') {
        const coercedValue = await coerceValue(property.type, selectedText.text, pdf?.language);

        if (!coercedValue?.success) {
          setSelectionError('Value cannot be transformed to the correct type');
        }

        if (coercedValue?.success) {
          setValue('field', secondsToISODate(coercedValue.value), { shouldDirty: true });
          setSelectionError(undefined);
        }
      } else {
        setValue('field', selectedText.text, { shouldDirty: true });
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
            disabled={!selectedText?.selectionRectangles.length || isSubmitting}
          >
            <Translate className="">Click to fill</Translate>
          </Button>
        </div>
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
      </div>
    );
  };

  const renderSelect = (type: 'select' | 'multiselect' | 'relationship') => (
    <div className={`px-4 pb-4 overflow-y-scroll grow ${labelInputIsOpen ? '' : 'hidden'}`}>
      <Controller
        control={control}
        name="field"
        rules={{ required: property?.required }}
        render={({ field: { onChange, value } }) => (
          <MultiselectList
            onChange={onChange}
            value={value as string[]}
            items={options}
            checkboxes
            singleSelect={type === 'select'}
            search={selectAndSearchValue}
            suggestions
          />
        )}
      />
    </div>
  );

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
      default:
        return '';
    }
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      size="large"
      title={entity?.title}
      closeSidepanelFunction={() => setShowSidepanel(false)}
    >
      <div className="flex-grow overflow-y-scroll">
        <form
          id="ixpdfform"
          className="flex flex-col h-full gap-4 p-0"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="w-full md:m-auto grow">
            {pdf && (
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
                size={{
                  width: '100%',
                }}
                scrollToPage={!selectedText ? Object.keys(highlights || {})[0] : undefined}
              />
            )}
          </div>
        </form>{' '}
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
                  onClick={() => setSelectAndSearch(old => !old)}
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
            <Button
              type="button"
              styling="outline"
              disabled={isSubmitting}
              onClick={() => {
                setShowSidepanel(false);
                reset();
              }}
            >
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

export { PDFSidepanel };
