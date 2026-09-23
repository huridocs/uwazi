type ThumbFrame = 'landscape' | 'portrait';
type ThumbFit = 'cover' | 'contain';
type ThumbnailKind = 'document' | 'image' | 'audio' | 'video';

const DEFAULT_THUMB_FRAME: ThumbFrame = 'portrait';
const DEFAULT_THUMB_FIT: ThumbFit = 'cover';

/** Landscape card media header — matches the measured uwazi-design slot (142px).
 *  Tailwind `h-24` (96px) was the previous short band. */
const LANDSCAPE_THUMB_HEIGHT_PX = 142;
const landscapeThumbHeightClass = 'h-[142px]';

const THUMB_FRAMES: { id: ThumbFrame; label: string; detail: string }[] = [
  { id: 'portrait', label: 'Portrait', detail: '3:4 cards in narrower columns — a gallery hang' },
  { id: 'landscape', label: 'Landscape', detail: 'A wide band across the card' },
];

const thumbnailFitFromStyle = (style?: string): ThumbFit =>
  style === 'contain' ? 'contain' : 'cover';

const imageIsMatted = (fit: ThumbFit): boolean => fit === 'contain';

export type { ThumbFit, ThumbFrame, ThumbnailKind };
export {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
  LANDSCAPE_THUMB_HEIGHT_PX,
  THUMB_FRAMES,
  imageIsMatted,
  landscapeThumbHeightClass,
  thumbnailFitFromStyle,
};
