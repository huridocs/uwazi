/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import { postToOcr, getOcrStatus } from '../actions/ocrActions';
import { ocrDisplayTips } from '../utils/ocrDisplayTips';

type OCRDisplayProps = {
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
type ComponentProps = OCRDisplayProps & mappedProps;

const OCRDisplay = ({ file, ocrIsToggled }: ComponentProps) => {
  const [ocrStatus, setOcrStatus] = useState({ status: 'loading', lastUpdated: Date.now() });
  const { filename = '' } = file;

  useEffect(() => {
    if (ocrIsToggled) {
      getOcrStatus(filename)
        .then(({ status, lastUpdated }) => setOcrStatus({ status, lastUpdated }))
        .catch(() => {
          setOcrStatus({ status: 'cannotProcess', lastUpdated: 0 });
        });
    }
  }, []);

  const handleClick = () => {
    setOcrStatus({ status: 'inQueue', lastUpdated: 0 });
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

  const { status } = ocrStatus;
  const lastUpdated = new Date(ocrStatus.lastUpdated);

  let statusDisplay = <div />;
  let tip = '';

  switch (status) {
    case 'loading':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>Loading</Translate>&nbsp;...
          </p>
        </div>
      );
      break;

    case 'noOCR':
      statusDisplay = (
        <button type="button" className="btn btn-default" onClick={() => handleClick()}>
          <Translate>Add to OCR queue</Translate>
        </button>
      );
      tip = ocrDisplayTips.noOcr;
      break;

    case 'inQueue':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>In OCR queue</Translate>
          </p>
        </div>
      );
      tip = `Last updated ${lastUpdated}`;
      break;

    case 'unsupported_language':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>Unsupported language</Translate>
          </p>
        </div>
      );
      tip = ocrDisplayTips.unsupportedLang;
      break;

    case 'cannotProcess':
      statusDisplay = cannotProcess;
      tip = ocrDisplayTips.cantProcess(lastUpdated);
      break;

    case 'withOCR':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>OCR</Translate>&nbsp;&#10004;
          </p>
        </div>
      );
      tip = `Last updated ${lastUpdated}`;
      break;

    default:
      statusDisplay = cannotProcess;
      tip = ocrDisplayTips.cantProcess(lastUpdated);
      break;
  }

  return (
    ocrIsToggled && (
      <div className="ocr-service-display">
        {statusDisplay}
        {tip && (
          <span className="ocr-tooltip">
            <Translate>{tip}</Translate>
          </span>
        )}
      </div>
    )
  );
};

const container = connector(OCRDisplay);
export { container as OCRDisplay };
