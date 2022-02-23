import React, { useEffect, useState } from 'react';
import { fromJS } from 'immutable';
import { Icon } from 'UI';
import { SidePanel } from 'app/Layout';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import SourceDocument from 'app/Viewer/components/SourceDocument';
import Document from 'app/Viewer/components/Document';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { EntitySchema } from 'shared/types/entityType';

interface PDFSidePanelProps {
  open: boolean;
  data: EntitySuggestionType;
  closeSidePanel: () => void;
}

const PDFSidePanel = ({ open, data, closeSidePanel }: PDFSidePanelProps) => {
  const [entity, setEntity] = useState(fromJS({}));
  const [file, setFile] = useState<FileType>({});

  useEffect(() => {
    async function fetchEntity() {
      const entityRequest = new RequestParams({ sharedId: data.sharedId });
      const entityResponse = await EntitiesAPI.get(entityRequest);
      setEntity(fromJS(entityResponse[0]));
      setFile({
        creationDate: 1645636161507,
        entity: '8ao2x7szzol',
        filename: '1645636161492ygb2w0texen.pdf',
        language: 'spa',
        mimetype: 'application/pdf',
        originalname: 'Documentos Basicos - Reglamento de la Corte.pdf',
        size: 532916,
        status: 'ready',
        toc: [],
        totalPages: 19,
        type: 'document',
        _id: '62166a4180bd471f9d45e213',
      });
    }

    // Check how to do this without warnings?
    fetchEntity();
  }, [data]);

  return (
    <SidePanel className="wide" open={open}>
      <>
        <div className="sidepanel-header buttons-align-right">
          <button
            type="button"
            className="closeSidepanel close-modal"
            onClick={closeSidePanel}
            aria-label="Close side panel"
          >
            <Icon icon="times" />
          </button>
          <div className="button-list">
            <button type="button" className="btn btn-default">
              <Translate>Cancel</Translate>
            </button>
            <button type="submit" className="btn btn-success">
              <Translate>Save</Translate>
            </button>
          </div>
        </div>
        {entity.get('sharedId') && file.filename && (
          <div className="document-viewer">
            <Document file={file} doc={entity} unsetSelection={() => {}} />
          </div>
        )}
      </>
    </SidePanel>
  );
};

export { PDFSidePanel };
