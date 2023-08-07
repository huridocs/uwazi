/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'app/V2/Components/Forms';
import { PDF } from 'app/V2/Components/PDFViewer';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import * as filesAPI from 'V2/api/files';

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion: EntitySuggestionType | undefined;
}

const PDFSidepanel = ({ showSidepanel, setShowSidepanel, suggestion }: PDFSidepanelProps) => {
  const [fileName, setFilename] = useState<string>();

  useEffect(() => {
    if (suggestion) {
      filesAPI
        .get(suggestion?.fileId)
        .then(file => {
          setFilename(file[0].filename);
        })
        .catch(e => {
          throw e;
        });
    }
  }, [suggestion]);

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      size="large"
      closeSidepanelFunction={() => setShowSidepanel(false)}
    >
      <form className="flex flex-col h-full">
        <InputField id="1" label="Metadata property name" />
        <div className="overflow-y-auto flex-grow">
          {fileName ? <PDF fileUrl={`/api/files/${fileName}`} /> : <Translate>Loading</Translate>}
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
