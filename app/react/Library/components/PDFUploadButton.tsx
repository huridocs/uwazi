import { Translate } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { Icon } from 'app/UI';
import React, { ChangeEvent, Dispatch, useMemo } from 'react';
import { bindActionCreators } from 'redux';
import { EntitySchema } from 'shared/types/entityType';

import {
  uploadDocument as uploadDocumentAction,
  createDocument as createDocumentAction,
} from 'app/Uploads/actions/uploadsActions';

import { unselectAllDocuments as unselectAllDocumentsAction } from 'app/Library/actions/libraryActions';
import { connect } from 'react-redux';

const extractTitle = (file: File) => {
  const title = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/ {2}/g, ' ');

  return title.charAt(0).toUpperCase() + title.slice(1);
};

interface PDFUploadActions {
  createDocument: (e: EntitySchema) => any;
  uploadDocument: (s: string, f: File) => void;
  unselectAllDocuments: () => void;
}

type PDFUploadButtonProps = PDFUploadActions;

const onChangePDFs =
  ({ createDocument, uploadDocument, unselectAllDocuments }: PDFUploadActions) =>
  (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target as HTMLInputElement;
    const count = files?.length || 0;

    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < count; index++) {
      const file = files![index];
      const doc = { title: extractTitle(file) };
      createDocument(doc)
        .then((newDoc: EntitySchema) => {
          uploadDocument(newDoc.sharedId!, file);
        })
        .catch(() => {});
    }

    unselectAllDocuments();
  };

const PDFUploadButtonComponent = ({
  createDocument,
  uploadDocument,
  unselectAllDocuments,
}: PDFUploadButtonProps) => {
  const onChangeHandler = useMemo(
    () =>
      onChangePDFs({
        createDocument,
        uploadDocument,
        unselectAllDocuments,
      }),
    [createDocument, uploadDocument, unselectAllDocuments]
  );

  return (
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
        onChange={onChangeHandler}
      />
    </label>
  );
};

function mapDispatchToProps(dispatch: Dispatch<any>) {
  return bindActionCreators(
    {
      uploadDocument: uploadDocumentAction,
      unselectAllDocuments: unselectAllDocumentsAction,
      createDocument: createDocumentAction,
    },
    wrapDispatch(dispatch, 'library')
  );
}

export const PDFUploadButton = connect<{}, PDFUploadActions>(
  null,
  mapDispatchToProps
)(PDFUploadButtonComponent);
