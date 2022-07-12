import React, { useRef } from 'react';
import { actions } from 'react-redux-form';
import { get } from 'lodash';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';

type PDFUploadProps = {
  model: string;
  entitySharedID: string;
};

const handlePDFUpload =
  (event: React.FormEvent<HTMLInputElement>, model: string) => (dispatch: Dispatch<{}>) => {
    const { files } = event.target as HTMLInputElement;
    if (files && files.length > 0) {
      const data = { data: URL.createObjectURL(files[0]), originalFile: files[0] };
      dispatch(actions.push(`${model}.documents`, data));
    }
  };

const mapStateToProps = (state: IStore, ownProps: PDFUploadProps) => {
  const entity = get(state, ownProps.model);
  return {
    pdfFiles: entity.documents,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ handlePDFUploadAction: handlePDFUpload }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = PDFUploadProps & mappedProps;

const PDFUpload = ({ model, pdfFiles, entitySharedID, handlePDFUploadAction }: ComponentProps) => {
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadButtonClicked = () => {
    inputFileRef.current?.click();
  };

  return (
    <>
      <h2>
        <Translate>Primary Documents</Translate>
      </h2>
      <button type="button" onClick={handleUploadButtonClicked}>
        Upload PDF
      </button>
      <input
        aria-label="pdfInput"
        type="file"
        onChange={event => handlePDFUploadAction(event, model)}
        style={{ display: 'none' }}
        ref={inputFileRef}
        accept="application/pdf"
      />
    </>
  );
};

const container = connector(PDFUpload);
export { container as PDFUpload };
