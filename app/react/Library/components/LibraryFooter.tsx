import React, { Dispatch, useEffect, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { newEntity as newEntityAction } from '#app/Uploads/actions/uploadsActions.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { Icon } from '#app/UI/index.js';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { NeedAuthorization } from '#app/Auth/index.js';
import { ExportButton } from './ExportButton.js';
import { PDFUploadButton } from './PDFUploadButton.js';

interface LibraryFooterOwnProps {
  storeKey: string;
  scrollCount: number;
}

interface LibraryFooterActions {
  newEntity: (storeKey: string) => void;
}

type LibraryFooterProps = LibraryFooterActions & LibraryFooterOwnProps;

const LibraryFooterComponent = ({ storeKey, newEntity, scrollCount }: LibraryFooterProps) => {
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
          <NeedAuthorization roles={['admin']}>
            <I18NLinkV2 to="/settings/csv">
              <button className="btn btn-default sm-order-1" type="button">
                <Icon icon="import-csv" transform="up-0.2" />
                <span className="btn-label">
                  <Translate>Import CSV</Translate>
                </span>
              </button>
            </I18NLinkV2>
          </NeedAuthorization>

          <ExportButton className="sm-order-1" storeKey={storeKey} />
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
  return bindActionCreators({ newEntity: newEntityAction }, wrapDispatch(dispatch, props.storeKey));
}

export const LibraryFooter = connect<{}, LibraryFooterActions, LibraryFooterOwnProps>(
  null,
  mapDispatchToProps
)(LibraryFooterComponent);
