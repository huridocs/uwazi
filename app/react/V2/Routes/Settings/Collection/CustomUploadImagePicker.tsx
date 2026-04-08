import React, { useMemo, useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { FileType } from '#shared/types/fileType.js';
import { Translate } from '#app/I18N/index.js';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { Label } from '#V2/Components/Forms/Label.js';

type AssetField = 'site_logo' | 'favicon';

const assetUrl = (file: FileType): string => {
  const u = file.url?.trim();
  if (u) return u;
  if (file.filename) return `/assets/${file.filename}`;
  return '';
};

const isImageFile = (file: FileType): boolean => Boolean(file.mimetype?.startsWith('image/'));

const filenameFromAssetUrl = (valueUrl: string): string | undefined => {
  const m = valueUrl.trim().match(/\/assets\/([^?#]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
};

const fileMatchesAssetUrl = (file: FileType, valueUrl: string): boolean => {
  if (!valueUrl.trim() || !file.filename) return false;
  const fromUrl = filenameFromAssetUrl(valueUrl);
  if (fromUrl === file.filename) return true;
  return assetUrl(file) === valueUrl.trim();
};

const defaultPreviewClass =
  'max-h-16 max-w-[200px] rounded border border-gray-200 object-contain bg-gray-50 p-1';

type CustomUploadImagePickerProps = {
  id: string;
  registerProps: UseFormRegisterReturn<AssetField>;
  value: string | undefined;
  onChange: (url: string) => void;
  files: FileType[];
  label: React.ReactNode;
  selectButtonTitle: React.ReactNode;
  previewImgClassName?: string;
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
}: CustomUploadImagePickerProps) => {
  const [open, setOpen] = useState(false);
  const images = useMemo(() => files.filter(isImageFile), [files]);
  const trimmed = value?.trim() ?? '';

  const pick = (file: FileType) => {
    onChange(assetUrl(file));
    setOpen(false);
  };

  return (
    <div className="sm:col-span-1">
      <input type="hidden" id={id} {...registerProps} />
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-2 flex flex-col gap-3">
        {trimmed ? (
          <div className="flex items-center gap-3">
            <img src={trimmed} alt="" className={previewImgClassName} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" styling="outline" color="primary" onClick={() => setOpen(true)}>
                {selectButtonTitle}
              </Button>
              <Button type="button" styling="outline" color="error" onClick={() => onChange('')}>
                <Translate>Clear</Translate>
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" styling="outline" color="primary" onClick={() => setOpen(true)}>
            {selectButtonTitle}
          </Button>
        )}
      </div>

      {open ? (
        <Modal size="xxl">
          <Modal.Header>
            {selectButtonTitle}
            <Modal.CloseButton onClick={() => setOpen(false)} />
          </Modal.Header>
          <Modal.Body className="!p-4">
            {images.length === 0 ? (
              <div className="text-sm text-gray-600">
                <p>
                  <Translate>Site logo no images hint</Translate>
                </p>
                <p className="mt-3">
                  <I18NLink
                    to="/settings/custom-uploads"
                    className="font-medium text-primary-700 underline"
                    onClick={() => setOpen(false)}
                  >
                    <Translate>Custom Uploads</Translate>
                  </I18NLink>
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map(file => {
                  const url = assetUrl(file);
                  const selected = fileMatchesAssetUrl(file, trimmed);
                  return (
                    <li key={String(file._id ?? file.filename)}>
                      <button
                        type="button"
                        onClick={() => pick(file)}
                        className={[
                          'flex w-full flex-col overflow-hidden rounded-lg border text-left transition-colors',
                          selected
                            ? 'border-primary-600 ring-2 ring-primary-500'
                            : 'border-gray-200 hover:border-primary-400',
                        ].join(' ')}
                      >
                        <span className="flex h-24 items-center justify-center bg-gray-50 p-2">
                          <img
                            src={url}
                            alt=""
                            className="max-h-full max-w-full object-contain"
                          />
                        </span>
                        <span className="truncate border-t border-gray-100 px-2 py-1.5 text-xs text-gray-700">
                          {file.originalname || file.filename}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" styling="outline" onClick={() => setOpen(false)}>
              <Translate>Cancel</Translate>
            </Button>
          </Modal.Footer>
        </Modal>
      ) : null}
    </div>
  );
};

export { CustomUploadImagePicker };
export type { CustomUploadImagePickerProps, AssetField };
