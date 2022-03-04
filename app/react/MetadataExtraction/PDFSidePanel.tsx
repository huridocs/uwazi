import React, { useEffect, useState } from 'react';
import { Icon } from 'UI';
import { store } from 'app/store';
import { SidePanel } from 'app/Layout';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { ClientEntitySchema } from 'app/istore';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';
import scroller from 'app/Viewer/utils/Scroller';
import SourceDocument from 'app/Viewer/components/SourceDocument';
import { MetadataForm } from 'app/Metadata';
import { loadFetchedInReduxForm } from 'app/Metadata/actions/actions';

interface PDFSidePanelProps {
  open: boolean;
  entitySuggestion: EntitySuggestionType;
  closeSidePanel: () => void;
}

const fetchEntity = async (entitySharedId: string) => {
  const entityRequest = new RequestParams({ sharedId: entitySharedId });
  return EntitiesAPI.get(entityRequest);
};

const fetchFile = async (fileId: string) => {
  const fileRequest = new RequestParams({ _id: fileId });
  return api.get('files', fileRequest);
};

const scrollToPage = async (pageNumber: number) =>
  scroller.to(`.document-viewer div#page-${pageNumber}`, '.document-viewer', {
    duration: 0,
    dividerOffset: 1,
    offset: 50,
  });

const PDFSidePanel = ({ open, entitySuggestion, closeSidePanel }: PDFSidePanelProps) => {
  const [entity, setEntity] = useState<ClientEntitySchema>({});
  const [file, setFile] = useState<FileType>({});
  const templates = store?.getState().templates;

  useEffect(() => {
    fetchEntity(entitySuggestion.sharedId)
      .then(response => {
        setEntity(response[0]);
        loadFetchedInReduxForm(
          'documentViewer.sidepanel.metadata',
          response[0],
          templates?.toJS()
        ).forEach(action => store?.dispatch(action));
      })
      .catch(() => {});
  }, [entitySuggestion]);

  useEffect(() => {
    if (entitySuggestion.fileId) {
      fetchFile(entitySuggestion.fileId)
        .then(response => {
          setFile(response.json[0]);
        })
        .catch(() => {});
    }
  }, [entitySuggestion]);

  return open ? (
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
            <button type="button" className="btn btn-default" onClick={closeSidePanel}>
              <Translate>Cancel</Translate>
            </button>
            <button type="submit" className="btn btn-success" form="metadataForm">
              <Translate>Save</Translate>
            </button>
          </div>
        </div>
        {entity.sharedId && file.filename && (
          <>
            <MetadataForm
              model="documentViewer.sidepanel.metadata"
              sharedId={entity.sharedId}
              templateId={entity.template?.toString()}
              showSubset={[entitySuggestion.propertyName]}
              storeKey="documentViewer"
            />
            <div className="document-viewer">
              <SourceDocument
                file={file}
                onPDFLoaded={async () => scrollToPage(entitySuggestion.page || 1)}
              />
            </div>
          </>
        )}
      </>
    </SidePanel>
  ) : (
    <></>
  );
};

export { PDFSidePanel };
