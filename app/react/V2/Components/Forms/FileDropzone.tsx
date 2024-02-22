/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import Dropzone, { DropzoneOptions } from 'react-dropzone';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Translate } from 'app/I18N';
import { formatBytes } from 'V2/shared/formatHelpers';

type FileDropzoneProps = {
  onDrop?: DropzoneOptions['onDrop'];
  className?: string;
};

const FileDropzone = ({ className, onDrop }: FileDropzoneProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [totalSize, setTotalSize] = useState<number>(0);

  useEffect(() => {
    let result = 0;
    files.forEach(file => {
      result += file.size;
    });
    setTotalSize(result);
  }, [files]);

  return (
    <Dropzone
      onDrop={(acceptedFiles, fileRejections, event) => {
        if (acceptedFiles) {
          setFiles([...files, ...acceptedFiles]);
        }
        if (onDrop) {
          onDrop(acceptedFiles, fileRejections, event);
        }
      }}
    >
      {({ getRootProps, getInputProps }) => (
        <section
          className={`p-4 bg-gray-50 rounded border border-gray-300 border-dashed ${className}`}
        >
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <div className="flex flex-col gap-4">
              <ArrowUpTrayIcon className="m-auto w-auto text-gray-200 max-w-20" />

              <div className="leading-6 text-center">
                <Translate className="font-semibold border-b-2 border-black cursor-pointer">
                  Browse files to upload
                </Translate>
                &nbsp;
                <Translate>or drop your files here.</Translate>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 my-4">
            {files.map(file => (
              <div className="text-sm border border-gray-300 px-[2px] rounded flex flex-nowrap gap-1 align-middle">
                <span>{file.name}</span>
                <span>-</span>
                <span className="whitespace-nowrap">{formatBytes(file.size)}</span>
                <button type="button">
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
