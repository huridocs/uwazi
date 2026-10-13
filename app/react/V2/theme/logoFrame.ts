import { useEffect, useState } from 'react';

const MIN_CROP = 8;
const MAX_CROP_SCALE = 2;
const HEADER_LOGO_MAX_WIDTH = 200;
const HEADER_LOGO_MAX_HEIGHT = 48;
const BACKGROUND_TOLERANCE = 24;
const TRIM_AREA_LIMIT = 0.92;

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

const pixelAt = (pixels: Uint8ClampedArray, index: number) => ({
  r: pixels[index],
  g: pixels[index + 1],
  b: pixels[index + 2],
  a: pixels[index + 3],
});

const differsFromBackground = (
  pixels: Uint8ClampedArray,
  index: number,
  background: { r: number; g: number; b: number; a: number }
) => {
  const pixel = pixelAt(pixels, index);
  return (
    Math.abs(pixel.r - background.r) +
      Math.abs(pixel.g - background.g) +
      Math.abs(pixel.b - background.b) +
      Math.abs(pixel.a - background.a) >
    BACKGROUND_TOLERANCE
  );
};

type ContentEdges = { minX: number; minY: number; maxX: number; maxY: number };

const expandEdges = (edges: ContentEdges, x: number, y: number) => {
  edges.minX = Math.min(edges.minX, x);
  edges.minY = Math.min(edges.minY, y);
  edges.maxX = Math.max(edges.maxX, x);
  edges.maxY = Math.max(edges.maxY, y);
};

const scanContent = (
  pixels: Uint8ClampedArray,
  size: Bounds,
  background: { r: number; g: number; b: number; a: number }
) => {
  const edges = { minX: size.width, minY: size.height, maxX: -1, maxY: -1 };
  for (let y = 0; y < size.height; y += 1) {
    for (let x = 0; x < size.width; x += 1) {
      if (differsFromBackground(pixels, (y * size.width + x) * 4, background)) {
        expandEdges(edges, x, y);
      }
    }
  }
  return edges;
};

const contentBounds = (pixels: Uint8ClampedArray, width: number, height: number): Crop | null => {
  const edges = scanContent(pixels, { width, height }, pixelAt(pixels, 0));
  if (edges.maxX < 0) return null;
  return {
    x: edges.minX,
    y: edges.minY,
    width: edges.maxX - edges.minX + 1,
    height: edges.maxY - edges.minY + 1,
  };
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

const croppedLogoUrl = (image: CanvasImageSource, bounds: Crop) => {
  const canvas = document.createElement('canvas');
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  canvas
    .getContext('2d')
    ?.drawImage(
      image,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      0,
      0,
      bounds.width,
      bounds.height
    );
  return canvas.toDataURL('image/png');
};

type PixelSample = { data: Uint8ClampedArray; width: number; height: number };

const canvasContext = (width: number, height: number) => {
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  return source.getContext('2d');
};

const imagePixels = (image: HTMLImageElement): PixelSample | null => {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const context = canvasContext(width, height);
  if (!context || width === 0 || height === 0) return null;
  context.drawImage(image, 0, 0);
  try {
    return { data: context.getImageData(0, 0, width, height).data, width, height };
  } catch {
    return null;
  }
};

const logoNeedsTrim = (sample: PixelSample, bounds: Crop) =>
  pixelAt(sample.data, 0).a !== 0 &&
  bounds.width * bounds.height < sample.width * sample.height * TRIM_AREA_LIMIT;

const trimmedLogoUrl = (image: HTMLImageElement) => {
  const sample = imagePixels(image);
  if (!sample) return null;
  const bounds = contentBounds(sample.data, sample.width, sample.height);
  if (!bounds || !logoNeedsTrim(sample, bounds)) return null;
  return croppedLogoUrl(image, bounds);
};

type TrimmedLogo = { src: string | undefined; url: string };

const currentTrimmedLogo = (src: string | undefined, trimmed: TrimmedLogo) =>
  trimmed.src === src ? trimmed.url || src || '' : src || '';

const useTrimmedLogo = (src: string | undefined) => {
  const [trimmed, setTrimmed] = useState<TrimmedLogo>({ src, url: src ?? '' });
  useEffect(() => {
    if (!src) {
      setTrimmed({ src, url: '' });
      return undefined;
    }
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!cancelled) setTrimmed({ src, url: trimmedLogoUrl(image) ?? src });
    };
    image.onerror = () => {
      if (!cancelled) setTrimmed({ src, url: src });
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return currentTrimmedLogo(src, trimmed);
};

export type { Crop, Bounds };
export {
  contentBounds,
  logoDisplaySize,
  logoFrameClass,
  applyCropDrag,
  scaledCropSize,
  defaultOutputScale,
  currentTrimmedLogo,
  useTrimmedLogo,
};
