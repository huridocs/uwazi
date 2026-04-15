import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { CustomUploadImagePickerModalProps } from './CustomUploadImagePickerModal';
import { assetUrl, fileMatchesAssetUrl } from './customUploadImagePickerLib';

const muted = 'text-sm [color:var(--color-theme-text-secondary)]';

const GallerySection = ({
  images,
  emptyGalleryHint,
  modalGridPending,
  sizeRule,
  modalGridImages,
  trimmed,
  onPick,
}: Pick<
  CustomUploadImagePickerModalProps,
  | 'images'
  | 'emptyGalleryHint'
  | 'modalGridPending'
  | 'sizeRule'
  | 'modalGridImages'
  | 'trimmed'
  | 'onPick'
>) => {
  if (images.length === 0) {
    return <div className={muted}>{emptyGalleryHint}</div>;
  }

  if (modalGridPending && sizeRule) {
    return (
      <div className={muted}>
        <Translate>Checking which images fit the requirements</Translate>
      </div>
    );
  }

  if (sizeRule && modalGridImages.length === 0) {
    return (
      <div className={muted}>
        <Translate>No uploaded images fit the requirements</Translate>
      </div>
    );
  }

  const gridSource = sizeRule ? modalGridImages : images;

  return (
    <>
      <p className="text-sm font-medium [color:var(--color-theme-text-primary)]">
        <Translate>Select an existing image</Translate>
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {gridSource.map(file => {
          const url = assetUrl(file);
          const selected = fileMatchesAssetUrl(file, trimmed);
          return (
            <li key={String(file._id ?? file.filename)}>
              <button
                type="button"
                onClick={() => {
                  Promise.resolve(onPick(file)).catch(() => undefined);
                }}
                className="flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors"
                style={{
                  borderColor: selected
                    ? 'var(--color-theme-action-primary)'
                    : 'color-mix(in srgb, var(--color-theme-border-default) 70%, transparent)',
                  boxShadow: selected ? '0 0 0 2px var(--color-theme-action-primary)' : undefined,
                }}
              >
                <span className="flex h-24 items-center justify-center p-2 [background-color:var(--color-theme-surface-warm)]">
                  <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                </span>
                <span className="truncate border-t px-2 py-1.5 text-xs [color:var(--color-theme-text-secondary)] [border-color:color-mix(in_srgb,var(--color-theme-border-default)_40%,transparent)]">
                  {file.originalname || file.filename}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
};

export { GallerySection };
