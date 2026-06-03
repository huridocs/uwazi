import React, { ChangeEvent, Dispatch, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { CloudArrowUpIcon } from '@heroicons/react/24/solid';
import { Translate } from '#app/I18N/index.js';
import { Icon } from '#app/UI/index.js';
import { uploadAndCreate as uploadDocumentAction } from '#app/Uploads/actions/uploadsActions.js';
import { Truncate } from '#V2/Components/UI/Truncate.js';
import { Tooltip } from '#V2/Components/UI/index.js';

interface PDFUploadActions {
  uploadDocument: (
    files: File[],
    onProgress: (percent: number, filename: string) => void,
    onFileComplete: () => void
  ) => any;
}

type PDFUploadButtonProps = PDFUploadActions;

const onChangePDFs =
  ({
    uploadDocument,
    onStart,
    onProgress,
    onFileComplete,
    onDone,
  }: PDFUploadActions & {
    onStart: (filesCount: number) => void;
    onProgress: (percent: number, filename: string) => void;
    onFileComplete: () => void;
    onDone: () => void;
  }) =>
  async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    const { files } = input;

    input.value = '';
    input.files = null;

    const filesToUpload = files ? Array.from(files) : [];

    if (!filesToUpload.length) {
      return;
    }

    onStart(filesToUpload.length);
    await uploadDocument(filesToUpload, onProgress, onFileComplete);
    onDone();
  };

const PDFUploadButtonComponent = ({ uploadDocument }: PDFUploadButtonProps) => {
  const [progress, setProgress] = useState(0);
  const [fileName, setFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [remainingFiles, setRemainingFiles] = useState(0);

  const onStart = (filesCount: number) => {
    setRemainingFiles(filesCount);
    setUploading(true);
  };

  const onProgress = (percent: number, filename: string) => {
    setProgress(percent);
    setFilename(filename);
    setUploading(true);
  };

  const onFileComplete = () => {
    setRemainingFiles(current => Math.max(0, current - 1));
  };

  const onDone = () => {
    setProgress(0);
    setFilename('');
    setRemainingFiles(0);
    setUploading(false);
  };

  return uploading ? (
    <div className="tw-content">
      <div className="bg-[#eceff1] border-[#cfd8dc] border py-1 px-2 rounded text-sm mr-3 flex flex-row gap-1 items-center">
        <Tooltip
          content={
            <>
              {remainingFiles} <Translate>remaining files</Translate>
            </>
          }
        >
          <CloudArrowUpIcon className="w-4 h-4" />
        </Tooltip>
        <Translate>Uploading</Translate>: <Truncate maxLength={20}>{fileName}</Truncate> {progress}%
      </div>
    </div>
  ) : (
    <label htmlFor="pdf-upload-button" className="btn btn-default">
      <Icon icon="cloud-upload-alt" />
      <span className="btn-label">
        <Translate>Upload PDF(s) to create</Translate>
      </span>
      <input
        type="file"
        id="pdf-upload-button"
        style={{ display: 'none' }}
        accept="application/pdf"
        multiple
        onChange={onChangePDFs({
          uploadDocument,
          onStart,
          onProgress,
          onFileComplete,
          onDone,
        })}
      />
    </label>
  );
};

const mapDispatchToProps = (dispatch: Dispatch<any>) =>
  bindActionCreators(
    {
      uploadDocument: uploadDocumentAction,
    },
    dispatch
  );

export const PDFUploadButton = connect(null, mapDispatchToProps)(PDFUploadButtonComponent);
