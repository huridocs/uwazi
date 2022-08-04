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

interface LibraryFooterOwnProps {
  storeKey: string;
}

interface LibraryFooterActions {
  newEntity: (storeKey: string) => void;
  showImportPanel: () => void;
}

type LibraryFooterProps = LibraryFooterActions & LibraryFooterOwnProps;

const LibraryFooterComponent = ({ storeKey, newEntity, showImportPanel }: LibraryFooterProps) => (
  <div className="library-footer with-sidepanel remove-nesting">
    <div className="btn-cluster">
      <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
        <button
          className="btn btn-default btn-footer-hover-success"
          type="button"
          onClick={() => newEntity(storeKey)}
        >
          <Icon icon="plus" />
          <span className="btn-label">
            <Translate>Create entity</Translate>
          </span>
        </button>
      </NeedAuthorization>
      <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
        <PDFUploadButton storeKey={storeKey} />
      </NeedAuthorization>
      <NeedAuthorization roles={['admin', 'editor']}>
        <button className="btn btn-default sm-order-1" type="button" onClick={showImportPanel}>
          <Icon icon="import-csv" transform="up-0.2" />
          <span className="btn-label">
            <Translate>Import CSV</Translate>
          </span>
        </button>
      </NeedAuthorization>
      <Export className="sm-order-1" storeKey={storeKey} />
    </div>
  </div>
);

function mapDispatchToProps(dispatch: Dispatch<any>, props: LibraryFooterOwnProps) {
  return bindActionCreators(
    { newEntity: newEntityAction, showImportPanel: showImportPanelAction },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export const LibraryFooter = connect<{}, LibraryFooterActions, LibraryFooterOwnProps>(
  null,
  mapDispatchToProps
)(LibraryFooterComponent);
