/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Dropzone from 'react-dropzone';
import { ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { Translate } from 'app/I18N';

const FileDropzone = () => (
  <Dropzone onDrop={acceptedFiles => console.log(acceptedFiles)}>
    {({ getRootProps, getInputProps }) => (
      <section>
        <div
          {...getRootProps()}
          className="p-4 w-full h-full bg-gray-50 rounded border border-gray-300 border-dashed"
        >
          <input {...getInputProps()} />
          <div className="flex flex-wrap gap-4 items-baseline">
            <div className="flex-grow">
              <ArrowUpTrayIcon className="m-auto w-auto text-gray-200 max-w-20 min-w-4" />
            </div>
            <div className="leading-5">
              <Translate className="font-semibold border-b-2 border-black cursor-pointer">
                Browse files to upload
              </Translate>
              &nbsp;
              <Translate>or drop your files here.</Translate>
            </div>
          </div>
        </div>
      </section>
    )}
  </Dropzone>
);

export { FileDropzone };
