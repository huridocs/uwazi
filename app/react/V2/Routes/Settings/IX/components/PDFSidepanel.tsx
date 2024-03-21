/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-statements */
import React, { useEffect, useRef, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { Translate, t } from 'app/I18N';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { FetchResponseError } from 'shared/JSONRequest';
import { ExtractedMetadataSchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import * as filesAPI from 'V2/api/files';
import * as entitiesAPI from 'V2/api/entities';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { PDF, selectionHandlers } from 'V2/Components/PDFViewer';
import { notificationAtom } from 'V2/atoms';
import { Highlights } from '../types';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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

const getFormValue = (
  suggestion?: EntitySuggestionType,
  entity?: ClientEntitySchema,
  type?: 'text' | 'number' | 'date'
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
  }

  return value;
};

const getPropertyData = (suggestion?: EntitySuggestionType, template?: ClientTemplateSchema) => {
  let propertyLabel = template?._id ? t(template._id, 'Title', 'Title', false) : 'Title';
  let propertyType: 'text' | 'number' | 'date' = 'text';
  let propertyId;
  let isRequired = true;

  if (suggestion && suggestion?.propertyName !== 'title') {
    const property = template?.properties.find(prop => prop.name === suggestion?.propertyName);

    propertyLabel = t(template?._id, property?.label, property?.label, false);
    propertyId = property?._id?.toString();
    isRequired = property?.required || false;

    if (property?.type === 'numeric') {
      propertyType = 'number';
    }

    if (property?.type === 'date') {
      propertyType = 'date';
    }
  }

  return { propertyLabel, propertyType, isRequired, propertyId };
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
  metadata?: PropertyValueSchema,
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
  const setNotifications = useSetRecoilState(notificationAtom);

  const entityTemplate = templates.find(template => template._id === suggestion?.entityTemplateId);
  const { propertyLabel, propertyType, isRequired, propertyId } = getPropertyData(
    suggestion,
    entityTemplate
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    values: {
      field: getFormValue(suggestion, entity, propertyType),
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

  const onSubmit = async (value: { field: PropertyValueSchema | undefined }) => {
    let metadata = value.field;

    if (propertyType === 'date' && isDirty && metadata) {
      metadata = (await coerceValue('date', metadata as string, pdf?.language || 'en'))?.value;
    }

    const [savedFile, savedEntity] = await Promise.all([
      handleFileSave(pdf, selections),
      handleEntitySave(entity, suggestion?.propertyName, metadata, isDirty),
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
          { name: suggestion?.propertyName || '', id: propertyId },
          pdf?.extractedMetadata,
          selectedText
        )
      );

      if (propertyType === 'date' || propertyType === 'number') {
        const coercedValue = await coerceValue(propertyType, selectedText.text, pdf?.language);

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
      <Sidepanel.Footer className="px-0 border border-b-0 border-l-0 border-r-0 border-gray-200 border-t-1">
        <div className="flex px-4 py-2">
          <p className={selectionError ? 'grow text-pink-600' : 'grow'}>
            <span className="uppercase">{propertyLabel}</span>{' '}
            {selectionError && <span>{selectionError}</span>}
          </p>
          <span onClick={() => setLabelInputIsOpen(old => !old)} className="cursor-pointer">
            {labelInputIsOpen ? <ChevronUpIcon width={20} /> : <ChevronDownIcon width={20} />}
          </span>
        </div>
        {labelInputIsOpen && (
          <div className="flex gap-2 pb-2">
            <div className="grow">
              <InputField
                inputClassName="px-4 py-2 leading-tight text-sm font-normal"
                clearFieldClassName="p-1"
                clearFieldAction={() => {}}
                id={propertyLabel}
                label={propertyLabel}
                hideLabel
                type={propertyType}
                hasErrors={errors.field?.type === 'required' || !!selectionError}
                {...register('field', {
                  required: isRequired,
                  valueAsDate: propertyType === 'date' || undefined,
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
            <div className="sm:text-right">
              <Button
                type="button"
                styling="outline"
                disabled={Boolean(!highlights) || isSubmitting}
                // className="pt-2 text-sm sm:pt-0 enabled:hover:underline disabled:text-gray-500 w-fit"
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
        )}
        <div className="flex justify-end gap-2 pt-4 border border-b-0 border-l-0 border-r-0 border-gray-200 border-t-1">
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
          <Button type="submit" form="ixpdfform" disabled={isSubmitting}>
            <Translate>Accept</Translate>
          </Button>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { PDFSidepanel };
