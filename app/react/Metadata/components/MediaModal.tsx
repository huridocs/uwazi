import React, { useMemo, useRef } from 'react';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import filesize from 'filesize';

import { AttachmentSchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { RenderAttachment } from 'app/Attachments';
import { WebMediaResourceForm } from 'app/Attachments/components/WebMediaResourceForm';

enum MediaModalType {
  Image,
  Media,
}

enum MediaModalTab {
  SelectFromFile = 'SelectFromFile',
  AddFromUrl = 'AddFromUrl',
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachmentSchema[];
  onChange: (id: string | File) => void;
  selectedUrl: string | null;
  type?: MediaModalType;
}

const MediaModal = ({
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

  const attachmentsUrls = useMemo(
    () => attachments.map(a => a.url || `/api/files/${a.filename}`),
    [attachments]
  );

  const defaultTab = useMemo(() => {
    if (!selectedUrl) {
      return MediaModalTab.SelectFromFile;
    }

    const selectedAttachmentIndex = attachmentsUrls.findIndex(url => url === selectedUrl);

    return selectedAttachmentIndex === -1 ? MediaModalTab.AddFromUrl : MediaModalTab.SelectFromFile;
  }, [selectedUrl, attachments]);

  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const handleAttachmentClick = (url: string) => () => {
    onChange(url);
    onClose();
  };

  const handleSubmitFromUrl = (formData: { url: string }) => {
    onChange(formData.url);
    onClose();
  };

  const handleUploadButtonClicked = () => {
    if (inputFileRef.current) {
      inputFileRef.current.click();
    }
  };

  const handleInputFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onChange(event.target.files[0]);
      onClose();
    }
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
          <span>
            <Translate>Close</Translate>
          </span>
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
              <div className="upload-button">
                <button
                  type="button"
                  onClick={handleUploadButtonClicked}
                  className="btn btn-success"
                >
                  <Icon icon="link" />
                  &nbsp; <Translate>Upload and select file</Translate>
                </button>
                <input
                  aria-label="fileInput"
                  type="file"
                  onChange={handleInputFileChange}
                  style={{ display: 'none' }}
                  ref={inputFileRef}
                />
              </div>
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
                  <Translate>No attachments</Translate>
                </h4>
              )}
            </TabContent>
            <TabContent
              for={MediaModalTab.AddFromUrl}
              className="tab-content attachments-modal__tabs-content centered"
            >
              <div className="wrapper-web">
                <WebMediaResourceForm
                  handleSubmit={handleSubmitFromUrl}
                  url={defaultTab === MediaModalTab.AddFromUrl ? selectedUrl : ''}
                />
              </div>
            </TabContent>
          </div>
        </Tabs>
      </div>
    </ReactModal>
  );
};

export type { MediaModalProps };
export { MediaModalType, MediaModal };
