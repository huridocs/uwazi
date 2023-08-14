/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { FileType } from 'shared/types/fileType';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import * as filesAPI from 'V2/api/files';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { PDF } from 'V2/Components/PDFViewer';
import { TextHighlight } from 'V2/Components/PDFViewer/types';

type Highlights = { [page: string]: TextHighlight[] };

const formatHighlights = (selections: ExtractedMetadataSchema[], property: string): Highlights => {
  const selectionsForProperty = selections.filter(selection => selection.name === property)[0]
    .selection;

  const highlights = selectionsForProperty?.selectionRectangles?.reduce(
    (selectionsByPage, selection) => {
      const { page } = selection;
      if (!page) return {};

      if (selectionsByPage[page]) {
        return selectionsByPage[page].push({
          color: 'red',
          key: '1',
          textSelection: {
            text: selectionsForProperty?.text,
            selectionRectangles: selectionsForProperty?.selectionRectangles?.map(rectangle => ({
              ...rectangle,
              regionId: rectangle.page,
            })),
          },
        });
      }

      return {
        ...selectionsByPage,
        [page]: [
          {
            color: 'red',
            key: page,
            textSelection: {
              text: selectionsForProperty?.text,
              selectionRectangles: selectionsForProperty?.selectionRectangles?.map(rectangle => ({
                ...rectangle,
                regionId: rectangle.page,
              })),
            },
          },
        ],
      };
    },
    {}
  );

  return highlights;
};

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion: EntitySuggestionType | undefined;
}

/*****/
//- use property ID instead of name to filter file extracted metadata ??
/*****/

const PDFSidepanel = ({ showSidepanel, setShowSidepanel, suggestion }: PDFSidepanelProps) => {
  const [entityFile, setEntityFile] = useState<FileType>();
  const [highlights, setHighlights] = useState<Highlights>();

  useEffect(() => {
    if (suggestion) {
      filesAPI
        .getById(suggestion?.fileId)
        .then(response => {
          const [file] = response;
          if (file.extractedMetadata) {
            setHighlights(formatHighlights(file.extractedMetadata, suggestion.propertyName));
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
        <InputField id="1" label="Metadata property name" />

        <div className="flex-grow">
          <PDF fileUrl={`/api/files/${entityFile?.filename}`} highlights={highlights} />
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
