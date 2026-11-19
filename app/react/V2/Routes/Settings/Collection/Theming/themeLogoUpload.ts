import { FileType } from '#shared/types/fileType.js';
import type { ThemeMode } from '#V2/theme/tokens.js';
import * as FilesAPI from '#V2/api/files/index.js';
import { assetUrl } from './customUploadImagePickerLib.js';

type ThemeUploadKind = 'logo' | 'favicon';

type ThemeUploadSlot = {
  kind: ThemeUploadKind;
  mode: ThemeMode;
};

type ThemeAssetUrls = {
  siteLogo?: Partial<Record<ThemeMode, string>>;
  favicon?: Partial<Record<ThemeMode, string>>;
};

const themeAssetUploadName = (slot: ThemeUploadSlot, extension: string) =>
  `uwazi-theme-${slot.kind}-${slot.mode}.${extension.replace(/^\./, '').toLowerCase()}`;

const fileExtension = (name: string) => /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? 'png';

const namedThemeUpload = (file: File, slot: ThemeUploadSlot | undefined) => {
  if (!slot) return file;
  const extension = fileExtension(file.name);
  const name = themeAssetUploadName(slot, extension);
  return file.name === name ? file : new File([file], name, { type: file.type || 'image/png' });
};

const reservedThemeUpload = (originalname: string | undefined) =>
  originalname === 'uwazi-theme-logo.png' ||
  /^uwazi-theme-(logo|favicon)-(light|dark)\.[a-z0-9]+$/i.test(originalname ?? '');

const keptThemeUrls = (assets: ThemeAssetUrls) =>
  new Set(
    [assets.siteLogo?.light, assets.siteLogo?.dark, assets.favicon?.light, assets.favicon?.dark]
      .map(url => url?.trim() ?? '')
      .filter(url => url.length > 0)
  );

const themeAssetUploadsToRemove = (files: FileType[], assets: ThemeAssetUrls) => {
  const kept = keptThemeUrls(assets);
  return files.flatMap(file => {
    if (!file._id || !reservedThemeUpload(file.originalname)) return [];
    if (kept.has(assetUrl(file))) return [];
    return [file._id];
  });
};

const removeReplacedThemeAssets = async (assets: ThemeAssetUrls) => {
  const files = await FilesAPI.getByType('custom');
  if (!Array.isArray(files)) return;
  await Promise.all(themeAssetUploadsToRemove(files, assets).map(async id => FilesAPI.remove(id)));
};

export type { ThemeUploadSlot };
export {
  namedThemeUpload,
  removeReplacedThemeAssets,
  themeAssetUploadName,
  themeAssetUploadsToRemove,
};
