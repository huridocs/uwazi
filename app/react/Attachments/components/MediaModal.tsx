import React from 'react';
import { connect } from 'react-redux';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';

import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';

import { uploadAttachment, uploadAttachmentFromUrl } from '../actions/actions';

export interface MediaModalProps {
  isOpen?: boolean;
}

export const MediaModalCmp = ({ isOpen }: MediaModalProps) => {
  return (
    <ReactModal
      isOpen={true}
      className="attachments-modal"
      overlayClassName="attachments-modal__overlay"
      ariaHideApp={false}
    >
      <div className="attachments-modal__header">
        <h4>
          <Translate>Supporting files</Translate>
        </h4>

        <button
          type="button"
          onClick={() => {
            return true;
          }}
          className="attachments-modal__close"
        >
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
                  <div className="media-grid-item">
                    <div className="media-grid-card">
                      <div className="media-grid-card-header">
                        <h5>media video.mp4</h5>
                        <span>12 MB</span>
                      </div>
                      <div className="media-grid-card-content">
                        <div className="media">
                          <img src="https://picsum.photos/200" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="media-grid-item">
                    <div className="media-grid-card">
                      <div className="media-grid-card-header">
                        <h5>media video.mp4</h5>
                        <span>12 MB</span>
                      </div>
                      <div className="media-grid-card-content">
                        <div className="media">
                          <img src="https://picsum.photos/200" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="media-grid-item">
                    <div className="media-grid-card">
                      <div className="media-grid-card-header">
                        <h5>media video.mp4</h5>
                        <span>12 MB</span>
                      </div>
                      <div className="media-grid-card-content">
                        <div className="media">
                          <img src="https://picsum.photos/200" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="media-grid-item">
                    <div className="media-grid-card">
                      <div className="media-grid-card-header">
                        <h5>media video.mp4</h5>
                        <span>12 MB</span>
                      </div>
                      <div className="media-grid-card-content">
                        <div className="media">
                          <img src="https://picsum.photos/200" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="media-grid-item">
                    <div className="media-grid-card">
                      <div className="media-grid-card-header">
                        <h5>media video.mp4</h5>
                        <span>12 MB</span>
                      </div>
                      <div className="media-grid-card-content">
                        <div className="media">
                          <img src="https://picsum.photos/200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabContent>
          </div>
        </Tabs>
      </div>
    </ReactModal>
  );
};

const mapDispatchToProps = {
  uploadAttachment,
  uploadAttachmentFromUrl,
};

export const MediaModal = connect(null, mapDispatchToProps)(MediaModalCmp);
