import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { dummyOCRPost, dummyOCRGet } from '../actions/ocrActions';

const statusDisplay = (file: FileType, ocrStatus: string) => {
  const cannotProcess = (
    <div className="cant-process">
      <p>
        <Translate>Cannot be processed</Translate>
      </p>
    </div>
  );

  switch (ocrStatus) {
    case 'loading':
      return (
        <div className="in-queue">
          <p>
            <Translate>Loading</Translate>&nbsp;...
          </p>
        </div>
      );

    case 'noOCR':
      return (
        <button type="button" className="btn btn-default" onClick={() => dummyOCRPost(file)}>
          <Translate>Add to OCR queue</Translate>
        </button>
      );

    case 'inQueue':
      return (
        <div className="in-queue">
          <p>
            <Translate>In OCR queue</Translate>
          </p>
        </div>
      );

    case 'cannotProcess':
      return cannotProcess;

    case 'withOCR':
      return (
        <div className="complete">
          <p>
            <Translate>OCR Complete</Translate>&nbsp;&#10004;
          </p>
        </div>
      );

    default:
      return cannotProcess;
  }
};

type OCRButtonProps = {
  file: FileType;
};

const mapStateToProps = ({ settings }: any) => {
  const toggleOCRButton = settings.collection.get('toggleOCRButton');

  return {
    ocrIsToggled: toggleOCRButton || false,
  };
};

const connector = connect(mapStateToProps);
type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = OCRButtonProps & mappedProps;

const OCRButton = ({ file, ocrIsToggled }: ComponentProps) => {
  const [ocrStatus, setOcrStatus] = useState('loading');

  useEffect(() => {
    if (ocrIsToggled) {
      dummyOCRGet(file.filename || '')
        .then(result => setOcrStatus(result))
        .catch(() => {
          setOcrStatus('cannotProcess');
        });
    }
  }, []);

  return (
    ocrIsToggled && <div className="ocr-service-display">{statusDisplay(file, ocrStatus)}</div>
  );
};

const container = connector(OCRButton);
export { container as OCRButton };
