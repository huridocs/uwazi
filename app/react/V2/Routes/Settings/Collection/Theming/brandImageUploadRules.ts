import type { ImageSizeRule } from './customUploadImagePickerLib.js';

export const faviconImageSizeRule: ImageSizeRule = {
  policy: 'strict',
  assetLabel: 'favicon',
  minWidth: 16,
  maxWidth: 512,
  minHeight: 16,
  maxHeight: 512,
  square: true,
};

export const themeLogotypeImageSizeRule: ImageSizeRule = {
  policy: 'soft',
  assetLabel: 'logotype',
  minWidth: 48,
  maxWidth: 800,
  minHeight: 16,
  maxHeight: 256,
  square: false,
};
