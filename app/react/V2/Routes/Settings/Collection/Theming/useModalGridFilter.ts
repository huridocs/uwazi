import { useEffect, useLayoutEffect, useState } from 'react';
import { FileType } from '#shared/types/fileType.js';
import {
  assetUrl,
  dimensionsPassRule,
  loadImageDimensions,
  type ImageSizeRule,
} from './customUploadImagePickerLib.js';

type ModalGridFilterArgs = {
  open: boolean;
  sizeRule: ImageSizeRule | undefined;
  images: FileType[];
  ruleKey: string;
  imagesKey: string;
};

export const useModalGridFilter = ({
  open,
  sizeRule,
  images,
  ruleKey,
  imagesKey,
}: ModalGridFilterArgs) => {
  const [modalGridImages, setModalGridImages] = useState<FileType[]>([]);
  const [modalGridPending, setModalGridPending] = useState(false);

  useLayoutEffect(() => {
    if (!open) {
      setModalGridPending(false);
      return;
    }
    if (!sizeRule || images.length === 0) {
      setModalGridImages([]);
      setModalGridPending(false);
      return;
    }
    setModalGridPending(true);
    setModalGridImages([]);
  }, [open, ruleKey, imagesKey, sizeRule, images.length]);

  useEffect(() => {
    if (!open || !sizeRule || images.length === 0) {
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      const results = await Promise.all(
        images.map(async file => {
          const url = assetUrl(file);
          if (!url) return null;
          try {
            const dimensions = await loadImageDimensions(url);
            return dimensionsPassRule(sizeRule, dimensions) ? file : null;
          } catch {
            return null;
          }
        })
      );
      const next = results.filter((file): file is FileType => file !== null);
      if (!cancelled) {
        setModalGridImages(next);
        setModalGridPending(false);
      }
    };

    run().catch(() => {
      if (!cancelled) {
        setModalGridImages([]);
        setModalGridPending(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, ruleKey, imagesKey, sizeRule, images]);

  return { modalGridImages, modalGridPending };
};
