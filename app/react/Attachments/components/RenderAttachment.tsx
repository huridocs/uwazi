import React from 'react';

import { AttachmentSchema } from '#shared/types/commonTypes.js';
import ReactPlayer from 'react-player';
import MarkdownMedia from '#app/Markdown/components/MarkdownMedia.jsx';
import { ClientFile } from '#app/istore.js';

import { isSerializedFile, prepareHTMLMediaView } from '#shared/fileUploadUtils.js';

export const RenderAttachment = ({ attachment }: { attachment: AttachmentSchema | ClientFile }) => {
  const { mimetype = '' } = attachment;

  const fileURL = isSerializedFile(attachment) ? prepareHTMLMediaView(attachment) : attachment.url;

  if (mimetype.includes('image')) {
    return fileURL ? (
      <img src={fileURL} alt={attachment.originalname} />
    ) : (
      <img src={`/api/files/${attachment.filename}`} alt={attachment.originalname} />
    );
  }

  const isVideoAudio = mimetype.includes('video') || mimetype.includes('audio');

  const isFromSupportedSite = attachment.url && ReactPlayer.canPlay(attachment.url);

  if (isVideoAudio || isFromSupportedSite) {
    return fileURL ? (
      <MarkdownMedia config={`(${fileURL})`} />
    ) : (
      <MarkdownMedia config={`(/api/files/${attachment.filename})`} />
    );
  }

  return null;
};
