import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import socket from 'app/socket';
import { postToOcr, getOcrStatus } from '../actions/ocrActions';
import { ocrDisplayTips } from '../utils/ocrDisplayTips';

type OCRDisplayProps = {
  file: FileType;
};

const formatDate = (time: number, locale: string) => {
  const date = new Date(time);
  return date.toLocaleString(locale);
};

const mapStateToProps = ({ settings, locale }: any) => {
  const toggleOCRButton = settings.collection.get('toggleOCRButton');
  return {
    ocrIsToggled: toggleOCRButton || false,
    locale,
  };
};

const connector = connect(mapStateToProps);
type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = OCRDisplayProps & mappedProps;

const OCRDisplay = ({ file, ocrIsToggled, locale }: ComponentProps) => {
  const [ocrStatus, setOcrStatus] = useState({ status: 'loading', lastUpdated: Date.now() });

  const socketListen = () => {
    // @ts-ignore
    socket.on('ocr:ready', () => {
      setOcrStatus({ status: 'ocrComplete', lastUpdated: 0 });
    });
    // @ts-ignore
    socket.on('ocr:error', () => {
      setOcrStatus({ status: 'cannotProcess', lastUpdated: Date.now() });
    });
  };

  useEffect(() => {
    if (ocrIsToggled) {
      getOcrStatus(file.filename || '')
        .then(({ status, lastUpdated }) => {
          setOcrStatus({ status, lastUpdated });
          socketListen();
        })
        .catch(() => {
          setOcrStatus({ status: 'cannotProcess', lastUpdated: Date.now() });
        });
    }
  }, []);

  const handleClick = () => {
    setOcrStatus({ status: 'inQueue', lastUpdated: Date.now() });
    postToOcr(file.filename || '')
      .then(() => {
        socketListen();
      })
      .catch(() => {});
  };

  const lastUpdated = formatDate(ocrStatus.lastUpdated, locale);

  let statusDisplay = <div />;
  let tip;

  switch (ocrStatus.status) {
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
      tip = ocrDisplayTips.lastUpdated(lastUpdated);
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
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>Cannot be processed</Translate>
          </p>
        </div>
      );
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
      tip = ocrDisplayTips.lastUpdated(lastUpdated);
      break;

    case 'ocrComplete':
      statusDisplay = (
        <button type="button" className="btn btn-success" onClick={() => window.location.reload()}>
          <Translate>OCR Complete</Translate>&nbsp;&#10004;
        </button>
      );
      tip = ocrDisplayTips.ocrComplete;
      break;

    default:
      break;
  }

  return (
    ocrIsToggled && (
      <div className="ocr-service-display">
        {statusDisplay}
        {tip && <span className="ocr-tooltip">{tip}</span>}
      </div>
    )
  );
};

const container = connector(OCRDisplay);
export { container as OCRDisplay };
