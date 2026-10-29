import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { ClientFile } from '#app/istore.js';
import type { FileType } from '#shared/types/fileType.js';
import { validateAndSanitizeUrl } from '#shared/urlValidationUtils.js';
import {
  extractMediaUrl,
  filterAttachments,
  type MediaPickerMode,
} from './mediaPickerAttachments.js';

type MediaPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string, localFile?: File) => void | Promise<void>;
  mode: MediaPickerMode;
  attachments: Array<FileType | ClientFile>;
  currentValue?: string;
};

const mediaPickerCopy = (mode: MediaPickerMode) => {
  const isImage = mode === 'image';
  return {
    isImage,
    title: isImage ? 'Select image' : 'Select media',
    urlAriaLabel: isImage ? 'Image URL' : 'Media URL',
    fileAriaLabel: isImage ? 'Image file' : 'Media file',
  };
};

const useMediaPickerForm = () => {
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState(false);
  const [selectError, setSelectError] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  return {
    urlInput,
    setUrlInput,
    urlError,
    setUrlError,
    selectError,
    setSelectError,
    selecting,
    setSelecting,
    fileInputRef,
  };
};

type MediaPickerForm = ReturnType<typeof useMediaPickerForm>;

const useMediaPickerActions = (
  form: MediaPickerForm,
  onSelect: MediaPickerModalProps['onSelect'],
  onClose: () => void
) => {
  const resetState = () => {
    form.setUrlInput('');
    form.setUrlError(false);
    form.setSelectError(false);
    form.setSelecting(false);
  };
  const handleClose = () => {
    resetState();
    onClose();
  };
  const handleSelect = async (value: string, localFile?: File) => {
    form.setSelectError(false);
    form.setSelecting(true);
    try {
      await onSelect(value, localFile);
      handleClose();
    } catch {
      form.setSelectError(true);
    } finally {
      form.setSelecting(false);
    }
  };
  const pickLocalFile = (file: File | undefined) => {
    if (!file) return;
    handleSelect('', file).catch(() => undefined);
  };
  const handleLocalFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    pickLocalFile(event.target.files?.[0]);
    event.target.value = '';
  };
  const handleUrlSubmit = () => {
    const { url, isValid } = validateAndSanitizeUrl(form.urlInput.trim());
    if (!isValid) {
      form.setUrlError(true);
      return;
    }
    handleSelect(url).catch(() => undefined);
  };
  return { handleClose, handleSelect, pickLocalFile, handleLocalFileChange, handleUrlSubmit };
};

const useMediaPicker = ({
  onClose,
  onSelect,
  mode,
  attachments,
  currentValue,
}: Omit<MediaPickerModalProps, 'isOpen'>) => {
  const form = useMediaPickerForm();
  const filteredAttachments = useMemo(
    () => filterAttachments(attachments, mode),
    [attachments, mode]
  );
  const selectedUrl = extractMediaUrl(currentValue);
  const actions = useMediaPickerActions(form, onSelect, onClose);
  return { ...form, ...actions, filteredAttachments, selectedUrl, ...mediaPickerCopy(mode) };
};

export { useMediaPicker };
export type { MediaPickerModalProps };
