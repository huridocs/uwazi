/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-statements */
import React, { useEffect, useRef, useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router-dom';
import moment from 'moment';
import { useForm } from 'react-hook-form';
import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { Translate, t } from 'app/I18N';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { ExtractedMetadataSchema, PropertyValueSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import * as filesAPI from 'V2/api/files';
import * as entitiesAPI from 'V2/api/entities';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { PDF } from 'V2/Components/PDFViewer';
import { SelectionError } from './SelectionError';
import { Highlights } from '../types';
import {
  deleteFileSelection,
  getHighlightsFromFile,
  getHighlightsFromSelection,
  updateFileSelection,
} from '../functions/handleTextSelection';

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion: EntitySuggestionType | undefined;
}

enum HighlightColors {
  CURRENT = '#B1F7A3',
  NEW = '#F27DA5',
}

const formatDate = (value: number) => moment.utc(value as number, 'X').format('YYYY-MM-DD');

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
    value = entityMetadata ? entityMetadata[0].value : '';

    if (type === 'date' && value) {
      const dateString = formatDate(value as number);
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
};

const handleEntitySave = async (
  entity?: ClientEntitySchema,
  metadata?: PropertyValueSchema,
  fieldHasChanged?: boolean
) => {
  if (fieldHasChanged && entity) {
    console.log('saving!!', metadata);
  }
};

const PDFSidepanel = ({ showSidepanel, setShowSidepanel, suggestion }: PDFSidepanelProps) => {
  const { templates } = useLoaderData() as {
    templates: ClientTemplateSchema[];
  };

  const revalidator = useRevalidator();

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<FileType>();
  const [pdfContainerHeight, setPdfContainerHeight] = useState(0);
  const [selectedText, setSelectedText] = useState<TextSelection>();
  const [selectionError, setSelectionError] = useState<string>();
  const [highlights, setHighlights] = useState<Highlights>();
  const [selections, setSelections] = useState<ExtractedMetadataSchema[] | undefined>(undefined);
  const [entity, setEntity] = useState<ClientEntitySchema>();

  const entityTemplate = templates.find(template => template._id === suggestion?.entityTemplateId);
  const { propertyLabel, propertyType, isRequired, propertyId } = getPropertyData(
    suggestion,
    entityTemplate
  );

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
        getHighlightsFromFile(
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
    };
  }, [pdf, showSidepanel, suggestion]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    values: {
      field: getFormValue(suggestion, entity, propertyType),
    },
  });

  const onSubmit = async (value: { field: PropertyValueSchema | undefined }) => {
    let metadata = value.field;

    if (propertyType === 'date' && isDirty && metadata) {
      metadata = (await entitiesAPI.coerceValue(metadata as string, 'date', pdf?.language || 'en'))
        .value;
    }

    const response = await Promise.all([
      handleFileSave(pdf, selections),
      handleEntitySave(entity, metadata, isDirty),
    ]);

    revalidator.revalidate();
    setShowSidepanel(false);
  };

  const handleClickToFill = async () => {
    if (selectedText) {
      let value = selectedText.text;

      setHighlights(getHighlightsFromSelection(selectedText, HighlightColors.NEW));
      setSelections(
        updateFileSelection(
          { name: suggestion?.propertyName || '', id: propertyId },
          pdf?.extractedMetadata,
          selectedText
        )
      );

      if (propertyType === 'date' && selectedText.text) {
        const response = await entitiesAPI.coerceValue(
          selectedText.text,
          'date',
          pdf?.language || 'en'
        );

        if (!response.success) {
          setSelectionError('Value cannot be transformed to the correct type');
        } else {
          setSelectionError(undefined);
          value = formatDate(response.value);
        }
      }

      setValue('field', value, { shouldDirty: true });
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
      <form className="flex flex-col gap-4 h-full" onSubmit={handleSubmit(onSubmit)}>
        <p className="mb-1 font-bold">{propertyLabel}</p>
        <div className="sm:text-right">
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              styling="light"
              size="small"
              color="primary"
              onClick={async () => handleClickToFill()}
              disabled={!selectedText?.selectionRectangles.length}
            >
              <Translate className="leading-3 whitespace-nowrap">Click to fill</Translate>
            </Button>

            <InputField
              className="grow"
              id={propertyLabel}
              label={propertyLabel}
              hideLabel
              type={propertyType}
              hasErrors={errors.field?.type === 'required'}
              {...register('field', {
                required: isRequired,
                valueAsDate: propertyType === 'date' || undefined,
              })}
            />
          </div>

          <button
            type="button"
            disabled={Boolean(!highlights)}
            className="pt-2 text-sm sm:pt-0 enabled:hover:underline disabled:text-gray-500 w-fit"
            onClick={() => {
              setHighlights(undefined);
              setSelections(
                deleteFileSelection(
                  { name: suggestion?.propertyName || '' },
                  pdf?.extractedMetadata
                )
              );
            }}
          >
            <Translate>Clear PDF selection</Translate>
          </button>
        </div>

        {selectionError && <SelectionError error={selectionError} />}

        <div ref={pdfContainerRef} className="grow">
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
              scrollToPage={Object.keys(highlights || {})[0]}
            />
          )}
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-grow"
            type="button"
            styling="outline"
            onClick={() => {
              setShowSidepanel(false);
              reset();
            }}
          >
            <Translate>Cancel</Translate>
          </Button>
          <Button className="flex-grow" type="submit">
            <Translate>Accept</Translate>
          </Button>
        </div>
      </form>
    </Sidepanel>
  );
};

export { PDFSidepanel };
