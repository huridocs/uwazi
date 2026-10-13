const MIN_CROP = 8;
const MAX_CROP_SCALE = 2;
const HEADER_LOGO_MAX_WIDTH = 200;
const HEADER_LOGO_MAX_HEIGHT = 48;

type Crop = { x: number; y: number; width: number; height: number };
type Bounds = { width: number; height: number };

const logoFrameClass = (variant: 'header' | 'preview' = 'header') =>
  `logo-img h-auto max-h-12 w-auto shrink-0 object-contain ${
    variant === 'preview' ? 'max-w-[12.5rem]' : 'max-w-[8rem] sm:max-w-[10rem] lg:max-w-[12.5rem]'
  }`;

const logoDisplaySize = (width: number, height: number) => {
  if (width === 0 || height === 0) return { width: 0, height: 0 };
  const scale = Math.min(HEADER_LOGO_MAX_WIDTH / width, HEADER_LOGO_MAX_HEIGHT / height, 1);
  return { width: width * scale, height: height * scale };
};

const clampCrop = (crop: Crop, bounds: Bounds): Crop => {
  const width = Math.min(Math.max(MIN_CROP, crop.width), bounds.width * MAX_CROP_SCALE);
  const height = Math.min(Math.max(MIN_CROP, crop.height), bounds.height * MAX_CROP_SCALE);
  return {
    x: Math.min(Math.max(crop.x, MIN_CROP - width), bounds.width - MIN_CROP),
    y: Math.min(Math.max(crop.y, MIN_CROP - height), bounds.height - MIN_CROP),
    width,
    height,
  };
};

const edgeDelta = (mode: string, edge: string, delta: number) => (mode.includes(edge) ? delta : 0);

const applyCropDrag = (drag: {
  origin: Crop;
  mode: string;
  dx: number;
  dy: number;
  bounds: Bounds;
}): Crop => {
  const { origin, mode, dx, dy, bounds } = drag;
  if (mode === 'move') {
    return clampCrop(
      { x: origin.x + dx, y: origin.y + dy, width: origin.width, height: origin.height },
      bounds
    );
  }
  return clampCrop(
    {
      x: origin.x + edgeDelta(mode, 'w', dx),
      y: origin.y + edgeDelta(mode, 'n', dy),
      width: origin.width + edgeDelta(mode, 'e', dx) - edgeDelta(mode, 'w', dx),
      height: origin.height + edgeDelta(mode, 's', dy) - edgeDelta(mode, 'n', dy),
    },
    bounds
  );
};

const scaledCropSize = (crop: Crop, scale: number) => ({
  width: Math.max(1, Math.round(crop.width * scale)),
  height: Math.max(1, Math.round(crop.height * scale)),
});

const defaultOutputScale = (crop: Crop, maxWidth = 800, maxHeight = 256) =>
  Math.min(1, maxWidth / crop.width, maxHeight / crop.height);

export type { Crop, Bounds };
export { logoDisplaySize, logoFrameClass, applyCropDrag, scaledCropSize, defaultOutputScale };
