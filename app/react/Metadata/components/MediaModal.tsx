import React, { useMemo } from 'react';
import ReactModal from 'react-modal';
import { Field, LocalForm } from 'react-redux-form';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import filesize from 'filesize';

import { AttachmentSchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { RenderAttachment } from 'app/Attachments/components/RenderAttachment';
import Tip from 'app/Layout/Tip';

const validators = {
  url: { required: (val: string) => !!val && val.trim() !== '' },
};

export enum MediaModalType {
  Image,
  Media,
}

enum MediaModalTab {
  SelectFromFile = 'SelectFromFile',
  AddFromUrl = 'AddFromUrl',
}
export interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachmentSchema[];
  onChange: (id: string) => void;
  selectedUrl: string | null;
  type?: MediaModalType;
}

export const MediaModal = ({
  isOpen,
  onClose,
  attachments = [],
  onChange,
  selectedUrl,
  type,
}: MediaModalProps) => {
  const filteredAttachments = useMemo(() => {
    switch (type) {
      case MediaModalType.Image:
        return attachments.filter(a => a.mimetype && a.mimetype.includes('image'));
      case MediaModalType.Media:
        return attachments.filter(
          a => a.mimetype && (a.mimetype.includes('video') || a.mimetype.includes('audio'))
        );
      default:
        return attachments;
    }
  }, [attachments, type]);

  const attachmentsUrls = useMemo(() => attachments.map(a => a.url || `/api/files/${a.filename}`), [
    attachments,
  ]);

  const defaultTab = useMemo(() => {
    if (!selectedUrl) {
      return MediaModalTab.SelectFromFile;
    }

    const selectedAttachmentIndex = attachmentsUrls.findIndex(url => url === selectedUrl);

    return selectedAttachmentIndex === -1 ? MediaModalTab.AddFromUrl : MediaModalTab.SelectFromFile;
  }, [selectedUrl, attachments]);

  const handleAttachmentClick = (url: string) => () => {
    onChange(url);
    onClose();
  };

  const handleSubmitFromUrl = (formData: { url: string }) => {
    onChange(formData.url);
    onClose();
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
            <TabLink
              to={MediaModalTab.SelectFromFile}
              className="tab-link modal-tab-1"
              default={defaultTab === MediaModalTab.SelectFromFile}
            >
              <Translate>Select from files</Translate>
            </TabLink>
            <TabLink
              to={MediaModalTab.AddFromUrl}
              className="tab-link modal-tab-2"
              default={defaultTab === MediaModalTab.AddFromUrl}
            >
              <Translate>Add from url</Translate>
            </TabLink>
          </div>

          <div className="attachments-modal__tabs-content">
            <TabContent
              for={MediaModalTab.SelectFromFile}
              className={`tab-content attachments-modal__tabs-content ${
                !filteredAttachments.length ? 'centered' : ''
              }`}
            >
              {filteredAttachments.length > 0 ? (
                <div className="media-grid container">
                  <div className="row">
                    {filteredAttachments.map(attachment => {
                      const attachmentUrl = attachment.url || `/api/files/${attachment.filename}`;
                      return (
                        <div
                          className="media-grid-item"
                          key={`attachment_${attachment._id}`}
                          onClick={handleAttachmentClick(attachmentUrl)}
                        >
                          <div
                            className={`${'media-grid-card'} ${
                              attachmentUrl === selectedUrl ? 'active' : ''
                            }`}
                          >
                            <div className="media-grid-card-header">
                              <h5>{attachment.originalname}</h5>
                              {!!attachment.size && <span>{filesize(attachment.size)}</span>}
                            </div>
                            <div className="media-grid-card-content">
                              <div className="media">
                                <RenderAttachment attachment={attachment} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <h4 className="empty-attachments-message">
                  <Translate>No attachments </Translate>
                </h4>
              )}
            </TabContent>
            <TabContent
              for={MediaModalTab.AddFromUrl}
              className="tab-content attachments-modal__tabs-content centered"
            >
              <div className="wrapper-web">
                <LocalForm
                  onSubmit={handleSubmitFromUrl}
                  model="urlForm"
                  validators={validators}
                  initialState={{ url: defaultTab === MediaModalTab.AddFromUrl ? selectedUrl : '' }}
                >
                  <div className="form-group has-feedback">
                    <Field model=".url">
                      <input
                        type="text"
                        className="form-control web-attachment-url"
                        placeholder="Paste URL here"
                      />
                    </Field>
                    <Tip icon="info-circle" position="right">
                      <p>To get resource from web:</p>
                      <p>
                        1. Right-click an image or video on the web and copy the image's URL.
                        Altenatively websites offers share button whereyou can get URL.
                      </p>
                      <p>2. Return here and paste the URL in this field (Ctrl+V or Command+V)</p>
                    </Tip>
                  </div>

                  <button type="submit" className="btn btn-success">
                    <Icon icon="link" />
                    &nbsp; <Translate>Add resource</Translate>
                  </button>
                </LocalForm>
              </div>
            </TabContent>
          </div>
        </Tabs>
      </div>
    </ReactModal>
  );
};
