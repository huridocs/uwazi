import React, { useEffect, useRef } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { actions } from 'react-redux-form';
import { connect, ConnectedProps } from 'react-redux';
import { get } from 'lodash';
import { Icon } from 'UI';
import { socket } from 'app/socket';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import { startUpload } from 'app/Uploads/actions/uploadsActions';
import { MetadataFormFiles } from './MetadataFormFiles';

type PDFUploadProps = {
  model: string;
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
    entity,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    { handlePDFUploadAction: handlePDFUpload, startUploadAction: startUpload },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = PDFUploadProps & mappedProps;

const PDFUpload = ({ model, entity, handlePDFUploadAction, startUploadAction }: ComponentProps) => {
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadButtonClicked = () => {
    inputFileRef.current?.click();
  };

  useEffect(() => {
    socket.on('batchUploadStart', (sharedId: string) => {
      startUploadAction(sharedId);
    });
  }, [entity]);

  return (
    <>
      <h2>
        <Translate>Primary Documents</Translate>
      </h2>
      <button type="button" onClick={handleUploadButtonClicked}>
        <Icon icon="paperclip" />
        <Translate>Upload PDF</Translate>
      </button>
      <input
        aria-label="pdfInput"
        type="file"
        onChange={event => handlePDFUploadAction(event, model)}
        style={{ display: 'none' }}
        ref={inputFileRef}
        accept="application/pdf"
      />
      <MetadataFormFiles model={model} type="document" files={entity.documents} />
    </>
  );
};

const container = connector(PDFUpload);
export { container as PDFUpload };
