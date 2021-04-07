import React from 'react';
import { AttachmentSchema } from 'shared/types/commonTypes';
import MarkdownMedia from 'app/Markdown/components/MarkdownMedia';
import ReactPlayer from 'react-player';

export const RenderAttachment = ({ attachment }: { attachment: AttachmentSchema }) => {
  const { mimetype = '' } = attachment;

  if (mimetype.includes('image')) {
    return attachment.url ? (
      <img src={attachment.url} alt={attachment.originalname} />
    ) : (
      <img src={`/api/files/${attachment.filename}`} alt={attachment.originalname} />
    );
  }

  const isVideoAudio = mimetype.includes('video') || mimetype.includes('audio');

  const isFromSupportedSite = attachment.url && ReactPlayer.canPlay(attachment.url);

  if (isVideoAudio || isFromSupportedSite) {
    return attachment.url ? (
      <MarkdownMedia config={`(${attachment.url})`} />
    ) : (
      <MarkdownMedia config={`(/api/files/${attachment.filename})`} />
    );
  }

  return null;
};
