import React, { ChangeEvent, Dispatch, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Translate } from '#app/I18N/index.js';
import { Icon } from '#app/UI/index.js';
import {
  createDocument as createDocumentAction,
  uploadDocumentV2 as uploadDocumentAction,
} from '#app/Uploads/actions/uploadsActions.js';
import { unselectAllDocuments as unselectAllDocumentsAction } from '#app/Library/actions/libraryActions.js';
import { Truncate } from '#V2/Components/UI/Truncate.js';

interface PDFUploadActions {
  uploadDocument: (f: File, onProgress: (percent: number, filename: string) => void) => void;
  unselectAllDocuments: () => void;
}

type PDFUploadButtonProps = PDFUploadActions;

const onChangePDFs =
  ({
    uploadDocument,
    unselectAllDocuments,
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
    unselectAllDocuments();

    const uploadSequentially = async (pendingFiles: File[], index = 0): Promise<void> => {
      const file = pendingFiles[index];
      if (!file) {
        return;
      }

      try {
        await uploadDocument(file, onProgress);
      } catch (_e) {}

      await uploadSequentially(pendingFiles, index + 1);
    };

    if (files) {
      await uploadSequentially(Array.from(files));
    }

    onDone();
  };

const PDFUploadButtonComponent = ({
  uploadDocument,
  unselectAllDocuments,
}: PDFUploadButtonProps) => {
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
    <label className="btn btn-default tw-content">
      <span className="btn-label">
        <Translate>Uploading</Translate>: <Truncate maxLength={20}>{fileName}</Truncate> {progress}%
      </span>
    </label>
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
          unselectAllDocuments,
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
      unselectAllDocuments: unselectAllDocumentsAction,
      createDocument: createDocumentAction,
    },
    dispatch
  );

export const PDFUploadButton = connect(null, mapDispatchToProps)(PDFUploadButtonComponent);
