import { Translate } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { Icon } from 'app/UI';
import React, { Dispatch } from 'react';
import { bindActionCreators } from 'redux';
import {
  newEntity as newEntityAction,
  showImportPanel as showImportPanelAction,
} from 'app/Uploads/actions/uploadsActions';
import { connect } from 'react-redux';
import { NeedAuthorization } from 'app/Auth';
import Export from './ExportButton';
import { PDFUploadButton } from './PDFUploadButton';

interface LibrarySidePanelButtonsOwnProps {
  storeKey: string;
}

interface LibrarySidePanelButtonsActions {
  newEntity: (storeKey: string) => void;
  showImportPanel: () => void;
}

type LibrarySidePanelButtonsProps = LibrarySidePanelButtonsActions &
  LibrarySidePanelButtonsOwnProps;

const LibrarySidePanelButtonsComponent = ({
  storeKey,
  newEntity,
  showImportPanel,
}: LibrarySidePanelButtonsProps) => (
  <div className="sidepanel-footer">
    <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
      <button className="btn btn-success" type="button" onClick={() => newEntity(storeKey)}>
        <Icon icon="plus" />
        <span className="btn-label">
          <Translate>Create entity</Translate>
        </span>
      </button>
    </NeedAuthorization>
    <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
      <PDFUploadButton storeKey={storeKey} />
    </NeedAuthorization>
    <Export storeKey={storeKey} />
    <NeedAuthorization roles={['admin', 'editor']}>
      <button className="btn btn-success" type="button" onClick={showImportPanel}>
        <Icon icon="import-csv" transform="up-0.2" />
        <span className="btn-label">
          <Translate>Import CSV</Translate>
        </span>
      </button>
    </NeedAuthorization>
  </div>
);

function mapDispatchToProps(dispatch: Dispatch<any>, props: LibrarySidePanelButtonsOwnProps) {
  return bindActionCreators(
    { newEntity: newEntityAction, showImportPanel: showImportPanelAction },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export const LibrarySidePanelButtons = connect<
  {},
  LibrarySidePanelButtonsActions,
  LibrarySidePanelButtonsOwnProps
>(
  null,
  mapDispatchToProps
)(LibrarySidePanelButtonsComponent);
