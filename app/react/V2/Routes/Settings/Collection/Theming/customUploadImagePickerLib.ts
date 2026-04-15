import { t } from '#app/I18N/index.js';
import { FileType } from '#shared/types/fileType.js';

type ImageSizePolicy = 'strict' | 'soft';
type ImageDimensions = { width: number; height: number };
type ImageFeedback = {
  type: 'warning' | 'error';
  message: string;
};
type ImageSizeRule = {
  policy: ImageSizePolicy;
  assetLabel: 'favicon' | 'logotype';
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  square: boolean;
};

const assetUrl = (file: FileType): string => {
  const u = file.url?.trim();
  if (u) return u;
  if (file.filename) return `/assets/${file.filename}`;
  return '';
};

const isImageFile = (file: FileType): boolean => Boolean(file.mimetype?.startsWith('image/'));

const loadImageDimensions = async (src: string): Promise<ImageDimensions> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });

const loadFileDimensions = async (file: File): Promise<ImageDimensions> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await loadImageDimensions(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const formatPx = (dimensions: ImageDimensions) => `${dimensions.width}x${dimensions.height} px`;

const rangeDescription = (rule: ImageSizeRule): string =>
  rule.square
    ? `square ${rule.minWidth}x${rule.minWidth} to ${rule.maxWidth}x${rule.maxWidth} px`
    : `${rule.minWidth}x${rule.minHeight} to ${rule.maxWidth}x${rule.maxHeight} px`;

const getImageFeedback = (
  rule: ImageSizeRule,
  dimensions: ImageDimensions
): ImageFeedback | null => {
  const { width: w, height: h } = dimensions;
  const got = formatPx(dimensions);
  const band = rangeDescription(rule);
  const message = `${t('System', "Image doesn't match the required size.", null, false)} Actual: ${got}. Expected: ${band}`;

  if (rule.square && w !== h) {
    return { type: 'error', message };
  }

  const inRange =
    w >= rule.minWidth && w <= rule.maxWidth && h >= rule.minHeight && h <= rule.maxHeight;
  if (inRange) {
    return null;
  }

  return { type: rule.policy === 'strict' ? 'error' : 'warning', message };
};

const dimensionsPassRule = (rule: ImageSizeRule, dimensions: ImageDimensions): boolean =>
  getImageFeedback(rule, dimensions) === null;

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

const sizeRuleKey = (sizeRule: ImageSizeRule | undefined): string =>
  sizeRule
    ? [
        sizeRule.policy,
        sizeRule.assetLabel,
        sizeRule.minWidth,
        sizeRule.maxWidth,
        sizeRule.minHeight,
        sizeRule.maxHeight,
        sizeRule.square ? '1' : '0',
      ].join(':')
    : '';

export type { ImageSizeRule, ImageFeedback, ImageDimensions };
export {
  assetUrl,
  isImageFile,
  loadImageDimensions,
  loadFileDimensions,
  formatPx,
  rangeDescription,
  getImageFeedback,
  dimensionsPassRule,
  filenameFromAssetUrl,
  fileMatchesAssetUrl,
  sizeRuleKey,
};
