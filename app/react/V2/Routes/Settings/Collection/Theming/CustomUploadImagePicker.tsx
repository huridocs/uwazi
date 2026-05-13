import React from 'react';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { FileType } from '#shared/types/fileType.js';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { Label } from '#V2/Components/Forms/Label.js';
import type { ImageSizeRule } from './customUploadImagePickerLib.js';
import { CustomUploadImagePickerModal } from './CustomUploadImagePickerModal.js';
import { ImageValidationIconButton } from './ImageValidationIconButton.js';
import { useCustomUploadImagePickerLogic } from './useCustomUploadImagePickerLogic.js';

type AssetField = 'site_logo' | 'favicon';

const defaultPreviewClass =
  'max-h-full max-w-full rounded object-contain [box-shadow:0_0_0_1px_color-mix(in_srgb,var(--color-theme-text-primary)_45%,transparent),0_0_0_2px_color-mix(in_srgb,var(--color-theme-surface-raised,var(--color-theme-bg-surface))_92%,transparent)]';

const defaultPreviewWrapperClass =
  'flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded border p-2 bg-[color-mix(in_srgb,var(--color-theme-surface-warm)_70%,var(--color-theme-text-primary))] [background-image:linear-gradient(45deg,color-mix(in_srgb,var(--color-theme-text-primary)_28%,transparent)_25%,transparent_25%,transparent_75%,color-mix(in_srgb,var(--color-theme-text-primary)_28%,transparent)_75%,color-mix(in_srgb,var(--color-theme-text-primary)_28%,transparent)),linear-gradient(45deg,color-mix(in_srgb,var(--color-theme-surface-muted)_88%,transparent)_25%,transparent_25%,transparent_75%,color-mix(in_srgb,var(--color-theme-surface-muted)_88%,transparent)_75%,color-mix(in_srgb,var(--color-theme-surface-muted)_88%,transparent))] [background-size:8px_8px] [background-position:0_0,4px_4px] border-[color-mix(in_srgb,var(--color-theme-text-primary)_30%,var(--color-theme-border-default))]';

type CustomUploadImagePickerProps = {
  id: string;
  registerProps?: UseFormRegisterReturn<AssetField>;
  value: string | undefined;
  onChange: (url: string) => void;
  files: FileType[];
  label: React.ReactNode;
  selectButtonTitle: React.ReactNode;
  previewImgClassName?: string;
  previewWrapperClassName?: string;
  recommendedSize?: string;
  sizeRule?: ImageSizeRule;
  emptyGalleryHint?: React.ReactNode;
};

const CustomUploadImagePicker = ({
  id,
  registerProps,
  value,
  onChange,
  files,
  label,
  selectButtonTitle,
  previewImgClassName = defaultPreviewClass,
  previewWrapperClassName = defaultPreviewWrapperClass,
  recommendedSize,
  sizeRule,
  emptyGalleryHint,
}: CustomUploadImagePickerProps) => {
  const logic = useCustomUploadImagePickerLogic({ sizeRule, files, value, onChange });

  const urlValidationControl =
    logic.validationFeedback === null ? null : (
      <div className="inline-flex">
        <ImageValidationIconButton feedback={logic.validationFeedback} />
      </div>
    );

  const actionButton = (
    <Button
      variant="secondary"
      type="button"
      onClick={() => logic.setOpen(true)}
      className="inline-flex items-center gap-1.5 px-2 py-1.5"
    >
      <ArrowUpTrayIcon className="h-4 w-4" />
      <span className="sr-only sm:not-sr-only">
        {logic.trimmed ? <Translate>Change</Translate> : <Translate>Choose</Translate>}
      </span>
    </Button>
  );

  return (
    <div className="sm:col-span-1">
      {registerProps ? (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <input type="hidden" id={id} {...registerProps} />
      ) : (
        <input type="hidden" id={id} value={logic.trimmed} readOnly />
      )}
      <Label htmlFor={id}>{label}</Label>
      {recommendedSize ? (
        <div className="mt-1 text-xs text-ink-tertiary">
          <Translate>Recommended</Translate>: {recommendedSize}
        </div>
      ) : null}
      <div className="mt-2 flex flex-col gap-3">
        {logic.trimmed ? (
          <div className="flex min-w-0 w-full flex-col items-center justify-center gap-4 min-[1400px]:flex-row min-[1400px]:flex-wrap min-[1400px]:items-center">
            <div className="flex min-w-0 items-center justify-center gap-2 min-[1400px]:justify-start">
              <div className={previewWrapperClassName}>
                <img src={logic.trimmed} alt="" className={previewImgClassName} />
              </div>
              {!logic.open && urlValidationControl ? urlValidationControl : null}
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2 min-[1400px]:ml-auto min-[1400px]:items-end">
              {actionButton}
              <Button
                variant="dangerSecondary"
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 px-2 py-1.5"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">
                  <Translate>Clear</Translate>
                </span>
              </Button>
            </div>
          </div>
        ) : (
          actionButton
        )}
      </div>

      {logic.open ? (
        <CustomUploadImagePickerModal
          selectButtonTitle={selectButtonTitle}
          onClose={() => logic.setOpen(false)}
          onDropzoneFiles={newFiles => {
            logic.handleDropzoneFiles(newFiles).catch(() => undefined);
          }}
          uploadProgress={logic.uploadProgress}
          dropzoneFeedback={logic.dropzoneFeedback}
          validationFeedback={logic.validationFeedback}
          getUploadFileFeedback={logic.getUploadFileFeedback}
          images={logic.images}
          emptyGalleryHint={emptyGalleryHint}
          modalGridPending={logic.modalGridPending}
          sizeRule={logic.sizeRule}
          modalGridImages={logic.modalGridImages}
          trimmed={logic.trimmed}
          onPick={logic.pick}
        />
      ) : null}
    </div>
  );
};

export { CustomUploadImagePicker };
