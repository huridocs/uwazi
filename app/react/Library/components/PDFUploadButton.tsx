import React, { ChangeEvent, Dispatch, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Translate } from '#app/I18N/index.js';
import { Icon } from '#app/UI/index.js';
import { uploadAndCreate as uploadDocumentAction } from '#app/Uploads/actions/uploadsActions.js';
import { Truncate } from '#V2/Components/UI/Truncate.js';

interface PDFUploadActions {
  uploadDocument: (f: File, onProgress: (percent: number, filename: string) => void) => void;
}

type PDFUploadButtonProps = PDFUploadActions;

const onChangePDFs =
  ({
    uploadDocument,
    onProgress,
    onDone,
  }: PDFUploadActions & {
    onProgress: (percent: number, filename: string) => void;
    onDone: () => void;
  }) =>
  async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    const { files } = input;

    input.value = '';
    input.files = null;

    if (files) {
      for (const file of Array.from(files)) {
        try {
          uploadDocument(file, onProgress);
        } catch (_e) {}
      }
    }

    onDone();
  };

const PDFUploadButtonComponent = ({ uploadDocument }: PDFUploadButtonProps) => {
  const [progress, setProgress] = useState(0);
  const [fileName, setFilename] = useState('');
  const [uploading, setUploading] = useState(false);

  const onProgress = (percent: number, filename: string) => {
    setProgress(percent);
    setFilename(filename);
    setUploading(true);
  };

  const onDone = () => {
    setProgress(0);
    setFilename('');
    setUploading(false);
  };

  return uploading ? (
    <div className="tw-content">
      <div className="bg-[#eceff1] border-[#cfd8dc] border py-1 px-2 rounded text-sm mr-3">
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
          onProgress,
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
