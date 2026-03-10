import React, { MouseEventHandler } from 'react';
import { filesize } from 'filesize';
import { Translate } from 'app/I18N';
import { ClientFile } from 'app/istore';
import { RenderAttachment } from 'app/Attachments';
import { AttachmentSchema } from 'shared/types/commonTypes';
import { isSerializedFile } from 'shared/fileUploadUtils';

type MediaModalFileListProps = {
  filteredAttachments: (AttachmentSchema | ClientFile)[];
  handleAttachmentClick: (fileURL: string) => MouseEventHandler;
  selectedUrl: string;
};

export const MediaModalFileList = ({
  filteredAttachments,
  handleAttachmentClick,
  selectedUrl,
}: MediaModalFileListProps) =>
  filteredAttachments.length > 0 ? (
    <div className="media-grid container">
      <div className="row">
        {filteredAttachments.map(attachment => {
          const attachmentUrl =
            attachment.url || attachment.fileLocalID || `/api/files/${attachment.filename}`;

          const fileSize =
            isSerializedFile(attachment) && attachment.serializedFile
              ? attachment.serializedFile.length
              : attachment.size;

          const sizeLabel = fileSize ? filesize(fileSize) : '_';

          return (
            <div
              className="media-grid-item"
              key={`attachment_${attachment._id}`}
              onClick={handleAttachmentClick(attachmentUrl as string)}
            >
              <div
                className={`${'media-grid-card'} ${attachmentUrl === selectedUrl ? 'active' : ''}`}
              >
                <div className="media-grid-card-header">
                  <h5>{attachment.originalname}</h5>
                  <span style={!fileSize ? { color: '#FFFFFF' } : {}}>{sizeLabel.toString()}</span>
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
  );
