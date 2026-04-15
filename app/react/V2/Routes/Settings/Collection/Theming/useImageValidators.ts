import { useMemo } from 'react';
import {
  getImageFeedback,
  loadFileDimensions,
  loadImageDimensions,
  type ImageFeedback,
  type ImageSizeRule,
} from './customUploadImagePickerLib.js';

export const useImageValidators = (sizeRule: ImageSizeRule | undefined) =>
  useMemo(() => {
    const validateAssetUrl = async (url: string) => {
      if (!sizeRule || !url.trim()) {
        return null;
      }

      try {
        const dimensions = await loadImageDimensions(url);
        return getImageFeedback(sizeRule, dimensions);
      } catch {
        return null;
      }
    };

    const validateFiles = async (newFiles: File[]) => {
      if (!sizeRule || newFiles.length === 0) {
        return { acceptedFiles: newFiles, feedback: null as ImageFeedback | null };
      }

      const validations = await Promise.all(
        newFiles.map(async file => {
          try {
            return {
              file,
              feedback: getImageFeedback(sizeRule, await loadFileDimensions(file)),
            };
          } catch {
            return { file, feedback: null as ImageFeedback | null };
          }
        })
      );

      return {
        acceptedFiles:
          sizeRule.policy === 'strict'
            ? validations
                .filter(validation => validation.feedback?.type !== 'error')
                .map(validation => validation.file)
            : newFiles,
        feedback: validations.find(validation => validation.feedback)?.feedback ?? null,
      };
    };

    return { validateAssetUrl, validateFiles };
  }, [sizeRule]);
