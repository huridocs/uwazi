import React, { useRef } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { actions } from 'react-redux-form';
import { connect, ConnectedProps } from 'react-redux';
import { get } from 'lodash';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import { MetadataFormFiles } from './MetadataFormFiles';

type PDFUploadProps = {
  model: string;
};

const handlePDFUpload =
  (event: React.FormEvent<HTMLInputElement>, model: string) => (dispatch: Dispatch<{}>) => {
    const { files } = event.target as HTMLInputElement;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const data = { data: URL.createObjectURL(file), originalFile: file };
        dispatch(actions.push(`${model}.documents`, data));
      });
    }
  };

const mapStateToProps = (state: IStore, ownProps: PDFUploadProps) => {
  const entity = get(state, ownProps.model);
  return {
    entity,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ handlePDFUploadAction: handlePDFUpload }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = PDFUploadProps & mappedProps;

const PDFUpload = ({ model, entity, handlePDFUploadAction }: ComponentProps) => {
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadButtonClicked = () => {
    inputFileRef.current?.click();
  };

  return (
    <div className="document-list-parent">
      <div className="attachments-list-header editor">
        <h2>
          <Translate>Primary Documents</Translate>
        </h2>
        <button type="button" onClick={handleUploadButtonClicked} className="btn">
          <Icon icon="plus" />
          &nbsp;
          <Translate>Add PDF</Translate>
        </button>
      </div>
      <input
        aria-label="pdfInput"
        type="file"
        onChange={event => handlePDFUploadAction(event, model)}
        style={{ display: 'none' }}
        ref={inputFileRef}
        accept="application/pdf"
        multiple
      />
      <MetadataFormFiles model={model} type="document" files={entity.documents} />
    </div>
  );
};

const container = connector(PDFUpload);
export { container as PDFUpload };
