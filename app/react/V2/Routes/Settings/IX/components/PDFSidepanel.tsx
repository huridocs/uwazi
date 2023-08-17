/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router-dom';
import { TextSelection } from 'react-text-selection-handler/dist/TextSelection';
import { Translate, t } from 'app/I18N';
import { ClientTemplateSchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { FileType } from 'shared/types/fileType';
import * as filesAPI from 'V2/api/files';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { PDF } from 'V2/Components/PDFViewer';
import { Highlights } from '../types';
import { highlightsForProperty } from '../functions/handleTextSelection';

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion: EntitySuggestionType | undefined;
}

const PDFSidepanel = ({ showSidepanel, setShowSidepanel, suggestion }: PDFSidepanelProps) => {
  const { templates } = useLoaderData() as {
    templates: ClientTemplateSchema[];
  };
  const [entityFile, setEntityFile] = useState<FileType>();
  const [selectedText, setSelectedText] = useState<TextSelection>();
  const [highlights, setHighlights] = useState<Highlights>();

  const entityTemplate = templates.find(template => template._id === suggestion?.entityTemplateId);
  const propertyName =
    suggestion?.propertyName === 'title'
      ? 'Title'
      : entityTemplate?.properties.find(propery => propery.name === suggestion?.propertyName)
          ?.label;
  const propertyLabel = t(entityTemplate?._id, propertyName, null, false);

  useEffect(() => {
    if (suggestion) {
      filesAPI
        .getById(suggestion?.fileId)
        .then(response => {
          const [file] = response;
          if (file.extractedMetadata) {
            setHighlights(highlightsForProperty(file.extractedMetadata, suggestion.propertyName));
          }
          setEntityFile(file);
        })
        .catch(e => {
          throw e;
        });
    }

    return () => {
      setEntityFile(undefined);
      setHighlights(undefined);
      setSelectedText(undefined);
    };
  }, [suggestion]);

  return (
    <Sidepanel
      isOpen={entityFile !== undefined && showSidepanel}
      withOverlay
      size="large"
      title={entityFile?.originalname}
      closeSidepanelFunction={() => setShowSidepanel(false)}
    >
      <form className="flex flex-col h-full">
        <Translate className="mb-1 font-bold">{propertyLabel}</Translate>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            styling="light"
            size="small"
            color="primary"
            onClick={() => {
              console.log(selectedText);
            }}
            disabled={!selectedText?.selectionRectangles}
          >
            <Translate className="leading-3 whitespace-nowrap">Click to fill</Translate>
          </Button>
          <InputField id={propertyLabel} className="grow" label={propertyLabel} hideLabel />
        </div>

        {selectedText && !selectedText.selectionRectangles && (
          <Translate className="mb-1 italic text-error-700">
            Could not detect the area for the selected text
          </Translate>
        )}

        <div className="flex-grow">
          <PDF
            fileUrl={`/api/files/${entityFile?.filename}`}
            highlights={highlights}
            onSelect={selection => {
              setSelectedText(selection);
            }}
          />
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
