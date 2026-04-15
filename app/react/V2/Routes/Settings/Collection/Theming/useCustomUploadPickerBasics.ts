import { useEffect, useMemo } from 'react';
import { FileType } from '#shared/types/fileType.js';
import { UploadService } from '#V2/api/files/index.js';
import { isImageFile } from './customUploadImagePickerLib.js';

export const useCustomUploadPickerBasics = (files: FileType[]) => {
  const uploadService = useMemo(() => new UploadService('custom'), []);
  const images = useMemo(() => files.filter(isImageFile), [files]);
  const imagesKey = useMemo(
    () => images.map(f => `${String(f._id ?? '')}:${f.filename ?? ''}`).join('|'),
    [images]
  );
  useEffect(() => () => uploadService.abort(), [uploadService]);
  return { uploadService, images, imagesKey };
};
