/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { Translate, t } from 'app/I18N';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { FileType } from 'shared/types/fileType';
import * as filesAPI from 'V2/api/files';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { PDF } from 'V2/Components/PDFViewer';
import { Highlights } from '../types';
import {
  getHighlightsFromFile,
  getHighlightsFromSelection,
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

const PDFSidepanel = ({ showSidepanel, setShowSidepanel, suggestion }: PDFSidepanelProps) => {
  const { templates } = useLoaderData() as {
    templates: ClientTemplateSchema[];
  };
  const [entityFile, setEntityFile] = useState<FileType>();
  const [entity, setEntity] = useState<ClientEntitySchema>();
  const [selectedText, setSelectedText] = useState<TextSelection>();
  const [highlights, setHighlights] = useState<Highlights>();

  const entityTemplate = templates.find(template => template._id === suggestion?.entityTemplateId);
  let propertyLabel = 'Title';
  let propertyType: 'text' | 'number' | 'date' = 'text';

  if (suggestion && suggestion?.propertyName !== 'title') {
    const property = entityTemplate?.properties.find(
      propery => propery.name === suggestion?.propertyName
    );

    if (!property) {
      throw new Error('Property not found');
    }

    propertyLabel = t(entityTemplate?._id, property.label, null, false);

    if (property.type === 'numeric') {
      propertyType = 'number';
    }

    if (property.type === 'date') {
      propertyType = 'date';
    }
  }

  useEffect(() => {
    if (suggestion) {
      filesAPI
        .getById(suggestion?.fileId)
        .then(response => {
          const [file] = response;
          setEntityFile(file);
        })
        .catch(e => {
          throw e;
        });
    }

    return () => {
      setEntityFile(undefined);
    };
  }, [suggestion]);

  useEffect(() => {
    if (entityFile?.extractedMetadata && suggestion && showSidepanel) {
      setSelectedText(undefined);
      setHighlights(
        getHighlightsFromFile(
          entityFile.extractedMetadata,
          suggestion.propertyName,
          HighlightColors.CURRENT
        )
      );
    }
  }, [entityFile, showSidepanel, suggestion]);

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      size="large"
      title={entityFile?.originalname}
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
            }}
          >
            <Translate>Clear Selection</Translate>
          </button>
        </div>

        {selectedText && !selectedText.selectionRectangles.length && <EmptySelectionError />}

        <div className="flex-grow">
          {entityFile && (
            <PDF
              fileUrl={`/api/files/${entityFile.filename}`}
              highlights={highlights}
              onSelect={selection => {
                setSelectedText(selection);
              }}
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
