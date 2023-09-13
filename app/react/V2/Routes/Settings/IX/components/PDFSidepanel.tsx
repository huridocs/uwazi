import React, { useEffect, useRef, useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router-dom';
import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { Translate, t } from 'app/I18N';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { FileType } from 'shared/types/fileType';
import * as filesAPI from 'V2/api/files';
import * as entitiesAPI from 'V2/api/entities';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { PDF } from 'V2/Components/PDFViewer';
import { Highlights } from '../types';
import {
  deleteFileSelection,
  getHighlightsFromFile,
  getHighlightsFromSelection,
  updateFileSelection,
} from '../functions/handleTextSelection';
import { EmptySelectionError } from './EmptySelectionError';

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion: EntitySuggestionType | undefined;
}

enum HighlightColors {
  CURRENT = '#B1F7A3',
  NEW = '#F27DA5',
}

const getPropertyParams = (suggestion?: EntitySuggestionType, template?: ClientTemplateSchema) => {
  let propertyLabel = 'Title';
  let propertyType: 'text' | 'number' | 'date' = 'text';

  if (suggestion && suggestion?.propertyName !== 'title') {
    const property = template?.properties.find(prop => prop.name === suggestion?.propertyName);

    propertyLabel = t(template?._id, property?.label, null, false);

    if (property?.type === 'numeric') {
      propertyType = 'number';
    }

    if (property?.type === 'date') {
      propertyType = 'date';
    }
  }

  return { propertyLabel, propertyType };
};

// eslint-disable-next-line max-statements
const PDFSidepanel = ({ showSidepanel, setShowSidepanel, suggestion }: PDFSidepanelProps) => {
  const { templates } = useLoaderData() as {
    templates: ClientTemplateSchema[];
  };

  const revalidator = useRevalidator();

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfContainerHeight, setPdfContainerHeight] = useState(0);
  const [pdf, setPdf] = useState<FileType>();
  const [updatedFileSelections, setUpdatedFileSelections] = useState<ExtractedMetadataSchema[]>();
  const [entity, setEntity] = useState<ClientEntitySchema>();
  const [selectedText, setSelectedText] = useState<TextSelection>();
  const [highlights, setHighlights] = useState<Highlights>();

  const entityTemplate = templates.find(template => template._id === suggestion?.entityTemplateId);
  const { propertyLabel, propertyType } = getPropertyParams(suggestion, entityTemplate);

  useEffect(() => {
    if (suggestion) {
      filesAPI
        .getById(suggestion.fileId)
        .then(response => {
          const [file] = response;
          setPdf(file);
        })
        .catch(e => {
          throw e;
        });

      // entitiesAPI
      //   .getById(suggestion.entityId)
      //   .then(response => {
      //     const [suggestionEntity] = response;
      //     setEntity(suggestionEntity);
      //   })
      //   .catch(e => {
      //     throw e;
      //   });
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
      setHighlights(undefined);
    };
  }, [pdf, showSidepanel, suggestion]);

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      size="large"
      title={pdf?.originalname}
      closeSidepanelFunction={() => setShowSidepanel(false)}
    >
      <form className="flex flex-col gap-4 h-full">
        <p className="mb-1 font-bold">{t(entityTemplate?._id, propertyLabel, null, false)}</p>
        <div className="sm:text-right">
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              styling="light"
              size="small"
              color="primary"
              onClick={() => {
                if (selectedText) {
                  setHighlights(getHighlightsFromSelection(selectedText, HighlightColors.NEW));
                  setUpdatedFileSelections(
                    updateFileSelection(
                      suggestion?.propertyName,
                      pdf?.extractedMetadata,
                      selectedText
                    )
                  );
                }
              }}
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
            />
          </div>

          <button
            type="button"
            disabled={Boolean(!highlights)}
            className="pt-2 text-sm sm:pt-0 enabled:hover:underline disabled:text-gray-500 w-fit"
            onClick={() => {
              setHighlights(undefined);
              setUpdatedFileSelections(
                deleteFileSelection(suggestion?.propertyName, pdf?.extractedMetadata)
              );
            }}
          >
            <Translate>Clear Selection</Translate>
          </button>
        </div>

        {selectedText && !selectedText.selectionRectangles.length && <EmptySelectionError />}

        <div ref={pdfContainerRef} className="grow">
          {pdf && (
            <PDF
              fileUrl={`/api/files/${pdf.filename}`}
              highlights={highlights}
              onSelect={selection => {
                setSelectedText(selection);
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
            onClick={() => setShowSidepanel(false)}
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
