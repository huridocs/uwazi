import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../Multireducer.js' or its ... Remove this comment to see the full error message
import { wrapDispatch } from '../../Multireducer.js';
// @ts-expect-error TS(2307): Cannot find module '../../UI.js' or its correspond... Remove this comment to see the full error message
import { Icon } from '../../UI.js';
import React, { Dispatch, useEffect, useState } from 'react';
import { bindActionCreators } from 'redux';
import {
  newEntity as newEntityAction,
  showImportPanel as showImportPanelAction,
} from '../../Uploads/actions/uploadsActions.js';
import { connect } from 'react-redux';
// @ts-expect-error TS(2307): Cannot find module '../../Auth.js' or its correspo... Remove this comment to see the full error message
import { NeedAuthorization } from '../../Auth.js';
import Export from './ExportButton';
import { PDFUploadButton } from './PDFUploadButton';

interface LibraryFooterOwnProps {
  storeKey: string;
  scrollCount: number;
}

interface LibraryFooterActions {
  newEntity: (storeKey: string) => void;
  showImportPanel: () => void;
}

type LibraryFooterProps = LibraryFooterActions & LibraryFooterOwnProps;

const LibraryFooterComponent = ({
  storeKey,
  newEntity,
  showImportPanel,
  scrollCount,
}: LibraryFooterProps) => {
  const [footerVisible, setFooterVisible] = useState(false);
  const toggleFooterVisible = () => {
    setFooterVisible(!footerVisible);
  };
  useEffect(() => {
    if (footerVisible && scrollCount > 0) {
      setFooterVisible(false);
    }
  }, [scrollCount]);

  return (
    <>
      <div
        className={`library-footer with-sidepanel remove-nesting ${!footerVisible ? 'closed' : ''}`}
      >
        <div className="close-actions-button">
          <button type="button" className="toggle-footer-button" onClick={toggleFooterVisible}>
            <Translate>Hide actions</Translate>
          </button>
        </div>
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
            <PDFUploadButton />
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
      <div className={`open-actions-button ${footerVisible ? 'closed' : ''}`}>
        <button type="button" className="toggle-footer-button" onClick={toggleFooterVisible}>
          <Translate>Show actions</Translate>
        </button>
      </div>
    </>
  );
};

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
