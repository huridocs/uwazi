/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Translate } from 'app/I18N';
import { Button, Sidepanel } from 'V2/Components/UI';
import { InputField } from 'app/V2/Components/Forms';
import { PDF } from 'app/V2/Components/PDFViewer';

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  fileID: string;
}

const PDFSidepanel = ({ showSidepanel, setShowSidepanel, fileID }: PDFSidepanelProps) => {
  const pdfUrl = `/api/files/${fileID}.pdf`;
  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={() => setShowSidepanel(false)}
    >
      <form className="flex flex-col h-full">
        <InputField id="1" label="Metadata property name" />
        <PDF fileUrl={pdfUrl} />
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
