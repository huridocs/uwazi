import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import socket from 'app/socket';
import { bindActionCreators } from 'redux';
import { postToOcr, getOcrStatus } from '../actions/ocrActions';
import { ocrDisplayTips } from '../utils/ocrDisplayTips';
import { realoadDocument } from '../actions/documentActions';

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

const mapDispatchToProps = (dispatch: any) =>
  bindActionCreators({ loadDocument: realoadDocument }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);
type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = OCRDisplayProps & mappedProps;

const OCRDisplay = ({ file, ocrIsToggled, locale, loadDocument }: ComponentProps) => {
  const [ocrStatus, setOcrStatus] = useState({ status: 'loading', lastUpdated: Date.now() });

  const listenOnSuccess = (_id: string) => {
    if (file._id === _id) {
      setOcrStatus({ status: 'ocrComplete', lastUpdated: Date.now() });
      loadDocument(file.entity);
    }
  };

  const listenOnError = (_id: string) => {
    if (file._id === _id) setOcrStatus({ status: 'ocrError', lastUpdated: Date.now() });
  };

  useEffect(() => {
    if (ocrIsToggled) {
      getOcrStatus(file.filename || '')
        .then(({ status, lastUpdated }) => {
          setOcrStatus({ status, lastUpdated });
          if (status === 'inQueue') {
            // @ts-ignore
            socket.on('ocr:ready', listenOnSuccess);
            // @ts-ignore
            socket.on('ocr:error', listenOnError);
          }
        })
        .catch(() => {
          setOcrStatus({ status: 'ocrError', lastUpdated: Date.now() });
        });
    }
    return () => {
      // @ts-ignore
      socket.off('ocr:ready', listenOnSuccess);
      // @ts-ignore
      socket.off('ocr:error', listenOnError);
    };
  }, []);

  const handleClick = () => {
    setOcrStatus({ status: 'inQueue', lastUpdated: Date.now() });
    postToOcr(file.filename || '')
      .then(() => {
        // @ts-ignore
        socket.on('ocr:ready', listenOnSuccess);
        // @ts-ignore
        socket.on('ocr:error', listenOnError);
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
          <Translate>OCR PDF</Translate>
        </button>
      );
      tip = ocrDisplayTips.noOcr();
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
            <Translate>Unsupported OCR language</Translate>
          </p>
        </div>
      );
      tip = ocrDisplayTips.unsupportedLang(file.language || 'other');
      break;

    case 'cannotProcess':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>OCR error</Translate>
          </p>
        </div>
      );
      tip = ocrDisplayTips.cantProcess(lastUpdated);
      break;

    case 'ocrError':
      statusDisplay = (
        <div className="ocr-error">
          <p>
            <Translate>Could not be processed</Translate>
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
        <div className="complete">
          <p>
            <Translate>OCR completed</Translate>&nbsp;&#10004;
          </p>
        </div>
      );
      break;

    default:
      break;
  }

  return (
    ocrIsToggled && (
      <div className="ocr-service-display">
        {statusDisplay}
        {tip && <div className="ocr-tooltip">{tip}</div>}
      </div>
    )
  );
};

const container = connector(OCRDisplay);
export { container as OCRDisplay };
