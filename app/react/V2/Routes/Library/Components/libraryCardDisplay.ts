type ThumbFrame = 'landscape' | 'portrait';
type ThumbFit = 'cover' | 'contain';
type ThumbSize = 's' | 'm' | 'l';
type ThumbnailKind = 'document' | 'image' | 'audio' | 'video';

const DEFAULT_THUMB_FRAME: ThumbFrame = 'portrait';
const DEFAULT_THUMB_FIT: ThumbFit = 'cover';
/** uwazi-design `DEFAULT_THUMB_SIZE` — Small is the band default (main, 2026-09-23). */
const DEFAULT_THUMB_SIZE: ThumbSize = 's';

/** Landscape preview band. uwazi-design `EntityCard` `COVER_H`:
 *  Small `h-[3.75rem]` (60px), Medium `h-36` (9rem), Large `h-48` (12rem). */
const LANDSCAPE_THUMB_HEIGHT_CLASS: Record<ThumbSize, string> = {
  s: 'h-[3.75rem]',
  m: 'h-36',
  l: 'h-48',
};

/** Card floor while a landscape thumbnail and metadata are both on.
 *  uwazi-design `EntityCard` `CARD_FLOOR` — band height plus 9.5rem. */
const LANDSCAPE_CARD_FLOOR_CLASS: Record<ThumbSize, string> = {
  s: 'min-h-[13.25rem]',
  m: 'min-h-[18.5rem]',
  l: 'min-h-[21.5rem]',
};

/** Portrait columns. uwazi-design `LibraryView` `cardGridCols` — the 3:4 slot
 *  takes the column width, so size steps the column count rather than a height. */
const PORTRAIT_CARD_GRID_CLASS: Record<ThumbSize, string> = {
  s: 'grid-cols-2 sm:grid-cols-4 xl:grid-cols-5',
  m: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4',
  l: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
};

const THUMB_SIZES: { id: ThumbSize; label: string }[] = [
  { id: 's', label: 'Small' },
  { id: 'm', label: 'Medium' },
  { id: 'l', label: 'Large' },
];

const THUMB_FRAMES: { id: ThumbFrame; label: string; detail: string }[] = [
  { id: 'portrait', label: 'Portrait', detail: '3:4 cards in narrower columns — a gallery hang' },
  { id: 'landscape', label: 'Landscape', detail: 'A wide band across the card' },
];

const thumbnailFitFromStyle = (style?: string): ThumbFit =>
  style === 'contain' ? 'contain' : 'cover';

const imageIsMatted = (fit: ThumbFit): boolean => fit === 'contain';

export type { ThumbFit, ThumbFrame, ThumbSize, ThumbnailKind };
export {
  DEFAULT_THUMB_FIT,
  DEFAULT_THUMB_FRAME,
  DEFAULT_THUMB_SIZE,
  LANDSCAPE_CARD_FLOOR_CLASS,
  LANDSCAPE_THUMB_HEIGHT_CLASS,
  PORTRAIT_CARD_GRID_CLASS,
  THUMB_FRAMES,
  THUMB_SIZES,
  imageIsMatted,
  thumbnailFitFromStyle,
};
