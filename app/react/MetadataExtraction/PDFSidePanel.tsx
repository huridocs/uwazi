import React, { useEffect, useState } from 'react';
import { fromJS } from 'immutable';
import { Icon } from 'UI';
import { store } from 'app/store';
import { SidePanel } from 'app/Layout';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import scroller from 'app/Viewer/utils/Scroller';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import { RequestParams } from 'app/utils/RequestParams';
import SourceDocument from 'app/Viewer/components/SourceDocument';
import { MetadataForm } from 'app/Metadata';
import { loadFetchedInReduxForm } from 'app/Metadata/actions/actions';

const dummyFile = {
  _id: '6218d3f90e33f52f5e0b889c',
  mimetype: 'application/pdf',
  filename: '1645794297976o11ri1199ed.pdf',
  size: 1656567,
  entity: '0cf0og75jodt',
  type: 'document',
  status: 'ready',
  creationDate: 1645794297987.0,
  language: 'spa',
  toc: [],
  totalPages: 111,
};

interface PDFSidePanelProps {
  open: boolean;
  entitySuggestion: EntitySuggestionType;
  closeSidePanel: () => void;
}

const fetchEntity = async (entitySharedId: string) => {
  const entityRequest = new RequestParams({ sharedId: entitySharedId });
  return EntitiesAPI.get(entityRequest);
};

const PDFSidePanel = ({ open, entitySuggestion, closeSidePanel }: PDFSidePanelProps) => {
  const [entity, setEntity] = useState(fromJS({}));
  const [file, setFile] = useState<FileType>({});
  const templates = store?.getState().templates;

  useEffect(() => {
    fetchEntity(entitySuggestion.sharedId)
      .then(response => {
        setEntity(fromJS(response[0]));
        setFile(dummyFile);
        loadFetchedInReduxForm(
          'documentViewer.sidepanel.metadata',
          response[0],
          templates?.toJS()
        ).forEach(action => store?.dispatch(action));
      })
      .catch(e => console.log(e));
  }, [entitySuggestion]);

  useEffect(() => {
    scroller
      .to(`.document-viewer div#page-${entitySuggestion.page}`, '.document-viewer', {
        duration: 50,
        dividerOffset: 1,
        offset: 50,
      })
      .then(() => {})
      .catch(e => {
        console.log(e);
      });
  }, [entitySuggestion]);

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
            <button type="button" className="btn btn-default" onClick={closeSidePanel}>
              <Translate>Cancel</Translate>
            </button>
            <button type="submit" className="btn btn-success">
              <Translate>Save</Translate>
            </button>
          </div>
        </div>
        {entity.get('sharedId') && file.filename && (
          <>
            <MetadataForm
              model="documentViewer.sidepanel.metadata"
              sharedId={entity.get('sharedId')}
              templateId={entity.get('template')}
              showSubset={[entitySuggestion.propertyName]}
              storeKey="documentViewer"
            />
            <div className="document-viewer">
              <SourceDocument file={file} doc={entity} />
            </div>
          </>
        )}
      </>
    </SidePanel>
  );
};

export { PDFSidePanel };
