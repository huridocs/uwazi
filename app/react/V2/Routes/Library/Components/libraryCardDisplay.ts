type ThumbFrame = 'landscape' | 'portrait';
type ThumbFit = 'auto' | 'cover' | 'contain';
type ThumbnailKind = 'document' | 'image';

const DEFAULT_THUMB_FRAME: ThumbFrame = 'landscape';
const DEFAULT_THUMB_FIT: ThumbFit = 'auto';

const THUMB_FRAMES: { id: ThumbFrame; label: string; detail: string }[] = [
  { id: 'landscape', label: 'Landscape', detail: 'A wide band across the card' },
  { id: 'portrait', label: 'Portrait', detail: '3:4 cards in narrower columns — a gallery hang' },
];

const THUMB_FITS: { id: ThumbFit; label: string; detail: string }[] = [
  { id: 'auto', label: 'Auto', detail: 'Ratio decides — wide fills, tall is matted' },
  { id: 'cover', label: 'Cover', detail: 'Fill the whole slot edge to edge, crop the image' },
  { id: 'contain', label: 'Contain', detail: 'Whole image on a quiet mat' },
];

const imageAspect = (width: number, height: number): ThumbFrame | 'square' => {
  const ratio = width / height;
  if (ratio > 1.05) {
    return 'landscape';
  }
  if (ratio < 0.95) {
    return 'portrait';
  }
  return 'square';
};

const imageIsMatted = (
  fit: ThumbFit,
  frame: ThumbFrame,
  aspect?: ThumbFrame | 'square'
): boolean => {
  if (fit === 'contain') {
    return true;
  }
  if (fit === 'cover') {
    return false;
  }
  return aspect !== frame;
};

export type { ThumbFit, ThumbFrame, ThumbnailKind };
export {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
  THUMB_FITS,
  THUMB_FRAMES,
  imageAspect,
  imageIsMatted,
};
