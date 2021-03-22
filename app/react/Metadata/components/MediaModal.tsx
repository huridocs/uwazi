import React, { useMemo } from 'react';
import ReactModal from 'react-modal';
import { Tabs, TabLink, TabContent } from 'react-tabs-redux';
import filesize from 'filesize';

import { AttachmentSchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { RenderAttachment } from 'app/Attachments/components/RenderAttachment';
import { ObjectId } from 'mongodb';

export enum MediaModalType {
  Image,
  Media,
}
export interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: AttachmentSchema[];
  onChange: (id: string | ObjectId) => void;
  selectedId: string | ObjectId | null;
  type?: MediaModalType;
}

export const MediaModal = ({
  isOpen,
  onClose,
  attachments = [],
  onChange,
  selectedId,
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

  const handleAttachmentClick = (id: string | ObjectId) => () => {
    onChange(id);
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
            <TabLink to="selectFromFiles" className="tab-link modal-tab-1">
              <Translate>Select from files</Translate>
            </TabLink>
          </div>

          <div className="attachments-modal__tabs-content">
            <TabContent
              for="selectFromFiles"
              className="tab-content attachments-modal__tabs-content"
            >
              <div className="media-grid container">
                <div className="row">
                  {filteredAttachments.map((attachment, key) => (
                    <div
                      className="media-grid-item"
                      key={`attachment_${key}`}
                      onClick={handleAttachmentClick(attachment._id!)}
                    >
                      <div
                        className={`${'media-grid-card'} ${
                          attachment._id === selectedId ? 'active' : ''
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
