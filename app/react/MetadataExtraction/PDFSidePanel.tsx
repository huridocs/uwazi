import React, { useEffect, useState } from 'react';
import { Icon } from 'UI';
import { store } from 'app/store';
import { SidePanel } from 'app/Layout';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { ClientEntitySchema } from 'app/istore';
import SourceDocument from 'app/Viewer/components/SourceDocument';
import { DocumentForm } from 'app/Viewer/containers/DocumentForm';
import { loadFetchedInReduxForm } from 'app/Metadata/actions/actions';
import { fetchEntity, fetchFile, scrollToPage } from './actions/actions';

interface PDFSidePanelProps {
  open: boolean;
  entitySuggestion: EntitySuggestionType;
  closeSidePanel: () => void;
  handleSave: (entity: ClientEntitySchema) => void;
}

const PDFSidePanel = ({
  open,
  entitySuggestion,
  closeSidePanel,
  handleSave,
}: PDFSidePanelProps) => {
  const [entity, setEntity] = useState<ClientEntitySchema>({});
  const [file, setFile] = useState<FileType>({});
  const templates = store?.getState().templates;

  useEffect(() => {
    fetchEntity(entitySuggestion.entityId, entitySuggestion.language)
      .then(response => {
        setEntity(response[0]);
        loadFetchedInReduxForm(
          'documentViewer.sidepanel.metadata',
          response[0],
          templates?.toJS()
        ).forEach(action => store?.dispatch(action));
      })
      .catch(e => e);
  }, [entitySuggestion]);

  useEffect(() => {
    if (entitySuggestion.fileId) {
      fetchFile(entitySuggestion.fileId)
        .then(response => {
          setFile(response.json[0]);
        })
        .catch(e => e);
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
            <DocumentForm
              sharedId={entity.sharedId}
              showSubset={[entitySuggestion.propertyName]}
              storeKey="documentViewer"
              fileID={entitySuggestion.fileId}
              onEntitySave={handleSave}
            />
            <div className="document-viewer">
              <SourceDocument
                file={file}
                onPageLoaded={async () => {
                  await scrollToPage(entitySuggestion.page || 1);
                }}
              />
            </div>
          </>
        )}
      </>
    </SidePanel>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );
};

export { PDFSidePanel };
