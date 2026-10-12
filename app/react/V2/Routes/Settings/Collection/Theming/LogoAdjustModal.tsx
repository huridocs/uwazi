import React, { useEffect, useRef, useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import {
  applyCropDrag,
  defaultOutputScale,
  logoDisplaySize,
  scaledCropSize,
  useLogoFrame,
  type Crop,
} from '#V2/theme/logoFrame.js';
import type { ImageDimensions } from './customUploadImagePickerLib.js';

const handles = ['nw', 'ne', 'sw', 'se'] as const;

const handleClass: Record<(typeof handles)[number], string> = {
  nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
  ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
  sw: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
  se: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
};

type Drag = { mode: string; startX: number; startY: number; origin: Crop };

type LogoAdjustModalProps = {
  src: string;
  onClose: () => void;
  onApply: (file: File, dimensions: ImageDimensions) => void;
};

const drawCrop = (image: HTMLImageElement, crop: Crop, scale: number) => {
  const size = scaledCropSize(crop, scale);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  canvas
    .getContext('2d')
    ?.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height);
  return { canvas, size };
};

const previewDataUrl = (image: HTMLImageElement, next: Crop) => {
  const { canvas } = drawCrop(image, next, Math.min(1, 400 / Math.max(next.width, 1)));
  return canvas.toDataURL('image/png');
};

const useLogoCropDrag = (session: {
  imgRef: React.RefObject<HTMLImageElement | null>;
  dragRef: React.MutableRefObject<Drag | null>;
  cropRef: React.MutableRefObject<Crop>;
  bounds: { width: number; height: number };
  setCrop: React.Dispatch<React.SetStateAction<Crop>>;
  setPreviewUrl: (url: string) => void;
}) => {
  const { imgRef, dragRef, cropRef, bounds, setCrop, setPreviewUrl } = session;
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const image = imgRef.current;
      const drag = dragRef.current;
      if (!image || !drag || bounds.width === 0) return;
      const rect = image.getBoundingClientRect();
      setCrop(
        applyCropDrag({
          origin: drag.origin,
          mode: drag.mode,
          dx: ((event.clientX - drag.startX) / rect.width) * bounds.width,
          dy: ((event.clientY - drag.startY) / rect.height) * bounds.height,
          bounds,
        })
      );
    };
    const up = () => {
      const image = imgRef.current;
      const wasDragging = dragRef.current;
      dragRef.current = null;
      if (!image || !wasDragging) return;
      setCrop(current => {
        cropRef.current = current;
        return current;
      });
      setPreviewUrl(previewDataUrl(image, cropRef.current));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [bounds, cropRef, dragRef, imgRef, setCrop, setPreviewUrl]);
};

const useLogoCrop = () => {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 0, height: 0 });
  const cropRef = useRef(crop);
  const [scale, setScale] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');
  useLogoCropDrag({ imgRef, dragRef, cropRef, bounds, setCrop, setPreviewUrl });
  return {
    imgRef,
    dragRef,
    bounds,
    setBounds,
    crop,
    setCrop,
    scale,
    setScale,
    previewUrl,
    setPreviewUrl,
  };
};

const LogoAdjustModal = ({ src, onClose, onApply }: LogoAdjustModalProps) => {
  const session = useLogoCrop();
  const logo = useLogoFrame(session.previewUrl, 'preview');
  const shown = logoDisplaySize(session.crop.width, session.crop.height);
  const saved = scaledCropSize(session.crop, session.scale);
  const { bounds, crop, scale } = session;

  const startDrag = (mode: string) => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    session.dragRef.current = { mode, startX: event.clientX, startY: event.clientY, origin: crop };
  };

  return (
    <Modal size="xxl">
      <Modal.Header>
        <Translate>Crop or resize logo</Translate>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body className="space-y-4">
        <p className="text-sm text-ink-secondary">
          <Translate>
            Crop changes how the logo fits in the header. Resize changes the saved file.
          </Translate>
        </p>
        <div className="relative inline-block max-w-full">
          <img
            ref={session.imgRef}
            src={src}
            alt=""
            crossOrigin="anonymous"
            className="max-h-64 max-w-full"
            onLoad={event => {
              const image = event.currentTarget;
              const nextBounds = { width: image.naturalWidth, height: image.naturalHeight };
              const full = { x: 0, y: 0, width: nextBounds.width, height: nextBounds.height };
              session.setBounds(nextBounds);
              session.setCrop(full);
              session.setScale(defaultOutputScale(full));
              session.setPreviewUrl(previewDataUrl(image, full));
            }}
          />
          {bounds.width > 0 ? (
            <div
              className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              style={{
                left: `${(crop.x / bounds.width) * 100}%`,
                top: `${(crop.y / bounds.height) * 100}%`,
                width: `${(crop.width / bounds.width) * 100}%`,
                height: `${(crop.height / bounds.height) * 100}%`,
              }}
              onPointerDown={startDrag('move')}
            >
              {handles.map(handle => (
                <span
                  key={handle}
                  className={`absolute h-3 w-3 bg-white ${handleClass[handle]}`}
                  onPointerDown={startDrag(handle)}
                />
              ))}
            </div>
          ) : null}
        </div>
        <label className="block text-xs text-ink-tertiary">
          <Translate>Saved image</Translate>
          {` ${saved.width}×${saved.height} px`}
          <input
            className="mt-1 block w-full"
            type="range"
            min={0.01}
            max={1}
            step={0.01}
            value={scale}
            onChange={event => session.setScale(Number(event.currentTarget.value))}
          />
        </label>
        <div>
          <p className="mb-2 text-xs text-ink-tertiary">
            <Translate>Shown in the header at</Translate>
            {` ${Math.round(shown.width)}×${Math.round(shown.height)} px`}
          </p>
          <div
            className="flex h-13 items-center overflow-hidden rounded-md border px-3"
            style={{ backgroundColor: 'var(--color-theme-chrome-app-bar)' }}
          >
            {session.previewUrl ? (
              <img src={session.previewUrl} alt="" className={logo.className} />
            ) : null}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" onClick={onClose}>
          <Translate>Cancel</Translate>
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => {
            const image = session.imgRef.current;
            if (!image || crop.width === 0) return;
            const { canvas, size } = drawCrop(image, crop, scale);
            canvas.toBlob(blob => {
              if (!blob) return;
              onApply(new File([blob], 'logo.png', { type: 'image/png' }), size);
            }, 'image/png');
          }}
        >
          <Translate>Apply</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { LogoAdjustModal };
