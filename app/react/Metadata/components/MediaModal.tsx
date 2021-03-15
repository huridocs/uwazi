import React from 'react';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';

import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';

export interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocument: any;
}

export const MediaModalCmp = ({ isOpen, onClose, selectedDocument }: MediaModalProps) => {
  const { attachments } = selectedDocument;

  const getAttachmentUrl = (attachment: any) => {
    return attachment.url || window.location.origin + `/api/files/${attachment.filename}`;
  };

  return (
    <ReactModal
      isOpen={isOpen}
      className="attachments-modal"
      overlayClassName="attachments-modal__overlay"
      ariaHideApp={false}
    >
      <div className="attachments-modal__header">
        <h4>
          <Translate>Supporting files</Translate>
        </h4>

        <button type="button" onClick={onClose} className="attachments-modal__close">
          <Icon icon="times" />
          <span>Close</span>
        </button>
      </div>
      <div className="attachments-modal__content">
        <Tabs renderActiveTabContentOnly>
          <div className="attachments-modal__tabs">
            <TabLink to="selectFromFiles" className="tab-link modal-tab-1">
              <Translate>Select from files</Translate>
            </TabLink>
          </div>

          <div className="attachments-modal__tabs-content">
            <TabContent for="selectFromFiles" className="tab-content">
              <div className="media-grid container">
                <div className="row">
                  {attachments.map((attachment: any, key: number) => (
                    <div className="media-grid-item" key={`attachment_${key}`}>
                      <div className="media-grid-card">
                        <div className="media-grid-card-header">
                          <h5>{attachment.originalname}</h5>
                          <span>12 MB</span>
                        </div>
                        <div className="media-grid-card-content">
                          <div className="media">
                            <img src={getAttachmentUrl(attachment)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabContent>
          </div>
        </Tabs>
      </div>
    </ReactModal>
  );
};

const mapStateToProps = (state: any, ownProps: any) => {
  const { selectedDocuments } = state.library.ui.toJS();

  return {
    selectedDocument: selectedDocuments[0] || { attachments: [] },
  };
};

const mapDispatchToProps = {};

export const MediaModal = connect(mapStateToProps, mapDispatchToProps)(MediaModalCmp);
