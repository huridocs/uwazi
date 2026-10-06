import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { DisplayMenuCheckRow } from '#V2/Components/UI/index.js';
import {
  DEFAULT_THUMB_FRAME,
  DEFAULT_THUMB_SIZE,
  THUMB_FRAMES,
  THUMB_SIZES,
  type ThumbFrame,
  type ThumbSize,
} from './libraryCardDisplay.js';

type LibraryCardsDisplayOptionsProps = {
  showThumbnail: boolean;
  showMetadata: boolean;
  onShowThumbnailChange: (value: boolean) => void;
  onShowMetadataChange: (value: boolean) => void;
  thumbFrame?: ThumbFrame;
  onThumbFrameChange?: (value: ThumbFrame) => void;
  thumbSize?: ThumbSize;
  onThumbSizeChange?: (value: ThumbSize) => void;
};

const LibraryCardsDisplayOptions = ({
  showThumbnail,
  showMetadata,
  onShowThumbnailChange,
  onShowMetadataChange,
  thumbFrame = DEFAULT_THUMB_FRAME,
  onThumbFrameChange,
  thumbSize = DEFAULT_THUMB_SIZE,
  onThumbSizeChange,
}: LibraryCardsDisplayOptionsProps) => (
  <>
    <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
      <Translate>Show information</Translate>
    </p>
    <DisplayMenuCheckRow
      label={<Translate>Thumbnail</Translate>}
      checked={showThumbnail}
      onToggle={() => onShowThumbnailChange(!showThumbnail)}
    />
    <DisplayMenuCheckRow
      label={<Translate>Metadata</Translate>}
      checked={showMetadata}
      onToggle={() => onShowMetadataChange(!showMetadata)}
    />
    {showThumbnail ? (
      <>
        <div className="my-1 h-px border-t border-border-soft" />
        <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>Thumbnail size</Translate>
        </p>
        {THUMB_SIZES.map(option => (
          <DisplayMenuCheckRow
            key={option.id}
            label={<Translate>{option.label}</Translate>}
            checked={thumbSize === option.id}
            onToggle={() => onThumbSizeChange?.(option.id)}
          />
        ))}
        <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>Thumbnail frame</Translate>
        </p>
        {THUMB_FRAMES.map(option => (
          <DisplayMenuCheckRow
            key={option.id}
            label={<Translate>{option.label}</Translate>}
            description={<Translate>{option.detail}</Translate>}
            checked={thumbFrame === option.id}
            onToggle={() => onThumbFrameChange?.(option.id)}
          />
        ))}
      </>
    ) : null}
  </>
);

export type { LibraryCardsDisplayOptionsProps };
export { LibraryCardsDisplayOptions };
