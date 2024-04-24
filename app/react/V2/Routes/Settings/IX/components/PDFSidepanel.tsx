/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-statements */
import React, { useEffect, useRef, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSetAtom, useAtomValue } from 'jotai';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { FetchResponseError } from 'shared/JSONRequest';
import {
  ExtractedMetadataSchema,
  PropertyValueSchema,
  MetadataObjectSchema,
} from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import * as filesAPI from 'V2/api/files';
import * as entitiesAPI from 'V2/api/entities';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { PDF, selectionHandlers } from 'V2/Components/PDFViewer';
import { notificationAtom, thesaurisAtom } from 'V2/atoms';
import { MultiselectList } from 'V2/Components/Forms';
import { Highlights } from '../types';

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion: EntitySuggestionType | undefined;
  onEntitySave: (entity: ClientEntitySchema) => any;
}

enum HighlightColors {
  CURRENT = '#B1F7A3',
  NEW = '#F27DA5',
}

enum PropertyTypes {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
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

    if (type === 'select' || type === 'multiselect') {
      value = entityMetadata?.map((metadata: MetadataObjectSchema) => metadata.value);
    }
  }

  return value;
};

const getPropertyData = (suggestion?: EntitySuggestionType, template?: ClientTemplateSchema) => {
  if (!suggestion) {
    return { label: '', type: PropertyTypes.TEXT, isRequired: true };
  }

  if (suggestion.propertyName === 'title') {
    return { label: 'Title', type: PropertyTypes.TEXT, isRequired: true };
  }

  const property = template?.properties.find(prop => prop.name === suggestion?.propertyName);

  if (!property) {
    throw new Error('Property not found');
  }

  return property;
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
  propertyType: 'date' | 'number',
  text: string | Date | undefined,
  documentLanguage: string = 'en'
) => {
  if (propertyType === 'date' && !Number.isNaN(text?.valueOf())) {
    return entitiesAPI.coerceValue(text!, 'date', documentLanguage);
  }

  if (propertyType === 'number' && typeof text === 'string') {
    return entitiesAPI.coerceValue(text.trim(), 'numeric', documentLanguage);
  }

  return undefined;
};

const PDFSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  suggestion,
  onEntitySave,
}: PDFSidepanelProps) => {
  const { templates } = useLoaderData() as {
    templates: ClientTemplateSchema[];
  };

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<FileType>();
  const [pdfContainerHeight, setPdfContainerHeight] = useState(0);
  const [selectedText, setSelectedText] = useState<TextSelection>();
  const [selectionError, setSelectionError] = useState<string>();
  const [highlights, setHighlights] = useState<Highlights>();
  const [selections, setSelections] = useState<ExtractedMetadataSchema[] | undefined>(undefined);
  const [labelInputIsOpen, setLabelInputIsOpen] = useState(true);
  const [entity, setEntity] = useState<ClientEntitySchema>();
  const setNotifications = useSetAtom(notificationAtom);
  const thesauris = useAtomValue(thesaurisAtom);

  const entityTemplate = templates.find(template => template._id === suggestion?.entityTemplateId);
  const property = getPropertyData(suggestion, entityTemplate);

  const thesaurus = thesauris.find(thes => thes._id === property.content);
  const templateId = suggestion?.entityTemplateId;
  const propertyValue = getFormValue(suggestion, entity, property.type);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    values: {
      field: propertyValue,
    },
  });

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

    if (pdfContainerRef.current) {
      const { height } = pdfContainerRef.current.getBoundingClientRect();
      setPdfContainerHeight(height);
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
    if (selectedText) {
      setHighlights(
        selectionHandlers.getHighlightsFromSelection(selectedText, HighlightColors.NEW)
      );
      setSelections(
        selectionHandlers.updateFileSelection(
          { name: suggestion?.propertyName || '', id: property._id },
          pdf?.extractedMetadata,
          selectedText
        )
      );

      if (property.type === 'date' || property.type === 'number') {
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

  const renderInputText = (type: 'text' | 'date' | 'number') => (
    <div className="flex gap-2 p-4">
      <div className="grow">
        <InputField
          clearFieldAction={() => {
            setValue('field', '');
          }}
          id={property.label}
          label={<Translate context={templateId}>{property.label}</Translate>}
          hideLabel
          type={type}
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

  interface Option {
    label: string | React.ReactNode;
    searchLabel: string;
    value: string;
    items?: Option[];
  }

  const renderSelect = (type: 'select' | 'multiselect') => {
    const options: Option[] = [];
    thesaurus?.values.forEach((value: any) => {
      options.push({
        label: <Translate context={property.content}>{value.label}</Translate>,
        searchLabel: value.label.toLowerCase(),
        value: value.id,
      });
    });
    if (!propertyValue) {
      return null;
    }
    return (
      <MultiselectList
        onChange={values => {
          setValue('field', values, { shouldDirty: true });
        }}
        value={propertyValue as string[]}
        items={options}
        checkboxes
        singleSelect={type === 'select'}
      />
    );
  };

  const renderLabel = () => {
    switch (property.type) {
      case 'text':
      case 'date':
      case 'number':
        return renderInputText(property.type);
      case 'select':
      case 'multiselect':
        return renderSelect(property.type);
      default:
        return '';
    }
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      size="large"
      title={pdf?.originalname}
      closeSidepanelFunction={() => setShowSidepanel(false)}
    >
      <Sidepanel.Body>
        <form
          id="ixpdfform"
          className="flex flex-col h-full gap-4 pb-0"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div ref={pdfContainerRef} className="md:m-auto md:w-[95%] grow">
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
                size={{
                  height: `${pdfContainerHeight}px`,
                }}
                scrollToPage={!selectedText ? Object.keys(highlights || {})[0] : undefined}
              />
            )}
          </div>
        </form>{' '}
      </Sidepanel.Body>
      <Sidepanel.Footer className="py-0 border border-b-0 border-l-0 border-r-0 border-gray-200 border-t-1">
        <div className="flex px-4 py-2">
          <p className={selectionError ? 'text-pink-600 grow' : 'grow'}>
            <Translate className="uppercase" context={templateId}>
              {property.label}
            </Translate>{' '}
            {selectionError && <span>{selectionError}</span>}
          </p>
          <span onClick={() => setLabelInputIsOpen(old => !old)} className="cursor-pointer">
            {labelInputIsOpen ? <ChevronDownIcon width={20} /> : <ChevronUpIcon width={20} />}
          </span>
        </div>
        {labelInputIsOpen && renderLabel()}
        <div className="flex justify-end gap-2 px-4 py-2 border border-b-0 border-l-0 border-r-0 border-gray-200 border-t-1">
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
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { PDFSidepanel };
