/* eslint-disable react/no-multi-comp */
import { Translate } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { Icon } from 'app/UI';
import React, { ChangeEvent, Dispatch } from 'react';
import { bindActionCreators } from 'redux';
import {
  newEntity as newEntityAction,
  showImportPanel as showImportPanelAction,
  uploadDocument as uploadDocumentAction,
  createDocument as createDocumentAction,
} from 'app/Uploads/actions/uploadsActions';
import { connect } from 'react-redux';
import { unselectAllDocuments as unselectAllDocumentsAction } from 'app/Library/actions/libraryActions';
import Export from './ExportButton';
import { EntitySchema } from '../../../shared/types/entityType';

const extractTitle = (file: File) => {
  const title = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/ {2}/g, ' ');

  return title.charAt(0).toUpperCase() + title.slice(1);
};

const onChangePDFs = ({
  createDocument,
  uploadDocument,
  unselectAllDocuments,
}: {
  createDocument: any;
  uploadDocument: any;
  unselectAllDocuments: any;
}) => (e: ChangeEvent<HTMLInputElement>) => {
  const { files } = e.target as HTMLInputElement;
  const count = files?.length || 0;

  // eslint-disable-next-line no-plusplus
  for (let index = 0; index < count; index++) {
    const file = files![index];
    const doc = { title: extractTitle(file) };
    createDocument(doc).then((newDoc: EntitySchema) => {
      uploadDocument(newDoc.sharedId, file);
    });
  }

  unselectAllDocuments();
};

const PDFUploadButtonComponent = ({
  uploadDocument,
  unselectAllDocuments,
  createDocument,
}: any) => (
  <label htmlFor="pdf-upload-button" className="btn btn-success share-btn">
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
        createDocument,
      })}
    />
  </label>
);

function mapDispatchToProps2(dispatch: Dispatch<any>, props: any) {
  return bindActionCreators(
    {
      uploadDocument: uploadDocumentAction,
      unselectAllDocuments: unselectAllDocumentsAction,
      createDocument: createDocumentAction,
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

const PDFUploadButton = connect(null, mapDispatchToProps2)(PDFUploadButtonComponent);

interface LibrarySidePanelButtonsProps {
  storeKey: string;
  newEntity: (storeKey: string) => void;
  showImportPanel: () => void;
}

const LibrarySidePanelButtonsComponent = ({
  storeKey,
  newEntity,
  showImportPanel,
}: LibrarySidePanelButtonsProps) => (
  <div className="sidepanel-footer">
    <button className="btn btn-success share-btn" type="button" onClick={() => newEntity(storeKey)}>
      <Icon icon="plus" />
      <span className="btn-label">
        <Translate>Create entity</Translate>
      </span>
    </button>
    <PDFUploadButton storeKey={storeKey} />
    <Export storeKey={storeKey} />
    <button className="btn btn-success share-btn" type="button" onClick={showImportPanel}>
      <Icon icon="export-csv" />
      <span className="btn-label">
        <Translate>Import CSV</Translate>
      </span>
    </button>
  </div>
);

function mapDispatchToProps(dispatch: Dispatch<any>, props: LibrarySidePanelButtonsProps) {
  return bindActionCreators(
    { newEntity: newEntityAction, showImportPanel: showImportPanelAction },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export const LibrarySidePanelButtons = connect(
  null,
  mapDispatchToProps
)(LibrarySidePanelButtonsComponent);
