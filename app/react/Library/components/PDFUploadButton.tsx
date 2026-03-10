import React, { ChangeEvent, Dispatch } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import { Icon } from 'app/UI';
import { EntitySchema } from 'shared/types/entityType';
import { generateID } from 'shared/IDGenerator';
import {
  uploadDocument as uploadDocumentAction,
  createDocument as createDocumentAction,
} from 'app/Uploads/actions/uploadsActions';
import { unselectAllDocuments as unselectAllDocumentsAction } from 'app/Library/actions/libraryActions';
import { ClientEntitySchema } from 'app/istore';
import { templatesAtom } from 'V2/atoms';
import { ClientTemplateSchema } from 'V2/shared/types';

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
  ({
    createDocument,
    uploadDocument,
    unselectAllDocuments,
    templates,
  }: PDFUploadActions & { templates: ClientTemplateSchema[] }) =>
  async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    const { files } = input;

    const hasGeneratedId = !!templates.some(
      template =>
        template.default &&
        template.commonProperties?.some(
          property => property.name === 'title' && property.generatedId
        )
    );

    Array.from({ length: files?.length ?? 0 }).forEach(async (_, index) => {
      const file = files?.[index];
      if (file) {
        try {
          const newEntity = { title: hasGeneratedId ? generateID(3, 4, 4) : extractTitle(file) };
          const entity = (await createDocument(newEntity)) as ClientEntitySchema;

          if (entity.sharedId) {
            uploadDocument(entity.sharedId, file);
          }
        } catch (_e) {}
      }
    });
    //clear input
    input.value = '';
    input.files = null;
    unselectAllDocuments();
  };

const PDFUploadButtonComponent = ({
  createDocument,
  uploadDocument,
  unselectAllDocuments,
}: PDFUploadButtonProps) => {
  const templates = useAtomValue(templatesAtom);

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
        onChange={onChangePDFs({
          createDocument,
          uploadDocument,
          unselectAllDocuments,
          templates,
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
