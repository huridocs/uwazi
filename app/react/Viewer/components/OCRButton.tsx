import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import { postToOcr, getOcrStatus } from '../actions/ocrActions';

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
  const { filename = '' } = file;

  useEffect(() => {
    if (ocrIsToggled) {
      getOcrStatus(filename)
        .then(result => setOcrStatus(result))
        .catch(() => {
          setOcrStatus('cannotProcess');
        });
    }
  }, []);

  const handleClick = () => {
    setOcrStatus('inQueue');
    postToOcr(filename)
      .then(() => {})
      .catch(() => {});
  };

  const cannotProcess = (
    <div className="status">
      <p>
        <Translate>Cannot be processed</Translate>
      </p>
    </div>
  );

  let component = <div />;
  let tip = '';

  switch (ocrStatus) {
    case 'loading':
      component = (
        <div className="status">
          <p>
            <Translate>Loading</Translate>&nbsp;...
          </p>
        </div>
      );
      break;

    case 'noOCR':
      component = (
        <button type="button" className="btn btn-default" onClick={() => handleClick()}>
          <Translate>Add to OCR queue</Translate>
        </button>
      );
      tip = 'The original file will be added as a supporting file.';
      break;

    case 'inQueue':
      component = (
        <div className="status">
          <p>
            <Translate>In OCR queue</Translate>
          </p>
        </div>
      );
      break;

    case 'unsupported_language':
      component = (
        <div className="status">
          <p>
            <Translate>Unsupported language</Translate>
          </p>
        </div>
      );
      break;

    case 'cannotProcess':
      component = cannotProcess;
      tip =
        'The OCR engine couldn’t read the document. Try uploading the document in a different format.';
      break;

    case 'withOCR':
      component = (
        <div className="status">
          <p>
            <Translate>OCR Complete</Translate>&nbsp;&#10004;
          </p>
        </div>
      );
      break;

    default:
      component = cannotProcess;
      tip =
        'The OCR engine couldn’t read the document. Try uploading the document in a different format.';
      break;
  }

  return (
    ocrIsToggled && (
      <div className="ocr-service-display">
        {component}
        {tip && (
          <span className="ocr-tooltip">
            <Translate>{tip}</Translate>
          </span>
        )}
      </div>
    )
  );
};

const container = connector(OCRButton);
export { container as OCRButton };
