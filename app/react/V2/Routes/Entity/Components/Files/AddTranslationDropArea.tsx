/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import Dropzone from 'react-dropzone-esm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';

type AddTranslationDropAreaProps = {
  onUpload: (files: File[]) => void | Promise<void>;
};

const AddTranslationDropArea = ({ onUpload }: AddTranslationDropAreaProps) => (
  <Dropzone
    multiple={false}
    accept={{ 'application/pdf': ['.pdf'] }}
    onDrop={acceptedFiles => {
      if (acceptedFiles.length) {
        onUpload(acceptedFiles).catch(() => undefined);
      }
    }}
  >
    {({ getRootProps, getInputProps, isDragActive }) => (
      <div
        {...getRootProps()}
        className={[
          'mt-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed py-3 transition-colors',
          isDragActive
            ? 'border-ink/40 bg-paper'
            : 'border-border-soft hover:border-ink/20 hover:bg-paper',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <PlusIcon className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
        <span className="text-xs text-ink-muted">
          {isDragActive ? (
            <Translate>Drop to add</Translate>
          ) : (
            <Translate>Add translation</Translate>
          )}
        </span>
      </div>
    )}
  </Dropzone>
);

export { AddTranslationDropArea };
