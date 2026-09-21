import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { DisplayMenuCheckRow } from '#V2/Components/UI/index.js';
import {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
  THUMB_FITS,
  THUMB_FRAMES,
  type ThumbFit,
  type ThumbFrame,
} from './libraryCardDisplay.js';

type LibraryCardsDisplayOptionsProps = {
  showThumbnail: boolean;
  showMetadata: boolean;
  onShowThumbnailChange: (value: boolean) => void;
  onShowMetadataChange: (value: boolean) => void;
  thumbFrame?: ThumbFrame;
  onThumbFrameChange?: (value: ThumbFrame) => void;
  thumbFit?: ThumbFit;
  onThumbFitChange?: (value: ThumbFit) => void;
};

const LibraryCardsDisplayOptions = ({
  showThumbnail,
  showMetadata,
  onShowThumbnailChange,
  onShowMetadataChange,
  thumbFrame = DEFAULT_THUMB_FRAME,
  onThumbFrameChange,
  thumbFit = DEFAULT_THUMB_FIT,
  onThumbFitChange,
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
        <p className="px-2 pt-1 pb-1 text-nano font-semibold uppercase tracking-wide text-ink-tertiary">
          <Translate>Image fit</Translate>
        </p>
        {THUMB_FITS.map(option => (
          <DisplayMenuCheckRow
            key={option.id}
            label={<Translate>{option.label}</Translate>}
            description={<Translate>{option.detail}</Translate>}
            checked={thumbFit === option.id}
            onToggle={() => onThumbFitChange?.(option.id)}
          />
        ))}
      </>
    ) : null}
  </>
);

export type { LibraryCardsDisplayOptionsProps };
export { LibraryCardsDisplayOptions };
