/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useRef, useState, useId } from 'react';
import Dropzone, { DropzoneOptions } from 'react-dropzone-esm';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { formatBytes } from '#V2/shared/formatHelpers.js';

type FileDropzoneProps = {
  onDrop?: DropzoneOptions['onDrop'];
  onChange?: (files: File[]) => void;
  className?: string;
  acceptedFiles?: DropzoneOptions['accept'];
  multiple?: boolean;
  message?: React.ReactNode;
  maxSize?: number;
  fileTrailing?: (file: File, index: number) => React.ReactNode;
};

const FileDropzone = ({
  className,
  onDrop,
  onChange,
  acceptedFiles,
  message,
  multiple = true,
  maxSize = undefined,
  fileTrailing,
}: FileDropzoneProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [totalSize, setTotalSize] = useState<number>(0);
  const inputId = useId();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let result = 0;

    files.forEach(file => {
      result += file.size;
    });

    setTotalSize(result);
    onChangeRef.current?.(files);
  }, [files]);

  const removeFile = (index: number) => {
    setFiles(files.filter((_file, i) => i !== index));
  };

  const handleOnDrop: DropzoneOptions['onDrop'] = (newFiles, fileRejections, event) => {
    let updatedFiles: File[] = [];
    if (newFiles) {
      if (multiple) {
        updatedFiles = [...files, ...newFiles];
      } else {
        updatedFiles = newFiles;
      }
    }
    setFiles(updatedFiles);
    if (onDrop) {
      onDrop(updatedFiles, fileRejections, event);
    }
  };

  return (
    <Dropzone onDrop={handleOnDrop} multiple={multiple} accept={acceptedFiles} maxSize={maxSize}>
      {({ getRootProps, getInputProps }) => (
        <section
          className={[
            'rounded-sm border border-dashed p-4',
            '[background-color:var(--color-theme-control-bg)]',
            '[border-color:var(--color-theme-control-border)]',
            '[color:var(--color-theme-control-text)]',
            className,
          ].join(' ')}
        >
          <div {...getRootProps()}>
            <label className="sr-only" htmlFor={inputId}>
              <Translate>Browse files to upload</Translate>
            </label>
            <input {...getInputProps()} id={inputId} />
            <div className="flex flex-col gap-4">
              <CloudArrowUpIcon className="m-auto w-auto max-w-14 [color:var(--color-theme-control-text)]" />
              <div className="leading-6 text-center">
                <Translate className="font-semibold border-b-2 border-black cursor-pointer">
                  Browse files to upload
                </Translate>
                &nbsp;
                <Translate>or drop your files here.</Translate>
              </div>
              <div className="text-center">{message}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 my-4">
            {files.map((file, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`${file.name}-${index}`}
                className={[
                  'flex flex-nowrap gap-1 rounded-sm border border-solid px-0.5 text-sm align-middle',
                  '[border-color:var(--color-theme-control-border)]',
                  '[background-color:var(--color-theme-surface-muted)]',
                ].join(' ')}
              >
                <span className="truncate max-w-32">{file.name}</span>
                <span>-</span>
                <span className="whitespace-nowrap">{formatBytes(file.size)}</span>
                {fileTrailing?.(file, index)}
                <button type="button" onClick={() => removeFile(index)}>
                  <Translate className="sr-only">Delete</Translate>
                  <XMarkIcon className="w-4" />
                </button>
              </div>
            ))}
          </div>

          {files.length > 0 && (
            <div className="text-sm">
              <Translate>Size</Translate>: {formatBytes(totalSize)}
            </div>
          )}
        </section>
      )}
    </Dropzone>
  );
};

export { FileDropzone };
