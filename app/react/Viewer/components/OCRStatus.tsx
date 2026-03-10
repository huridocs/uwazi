/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import { socket } from 'app/socket';
import { bindActionCreators } from 'redux';
import { postToOcr, getOcrStatus } from '../actions/ocrActions';
import { ocrStatusTips } from '../utils/ocrStatusTips';
import { reloadDocument } from '../actions/documentActions';

type OCRStatusProps = {
  file: FileType;
};

const formatDate = (time: number, locale: string) => {
  const date = new Date(time);
  return date.toLocaleString(locale);
};

const mapStateToProps = ({ settings, locale }: any) => {
  const toggleOCRButton = settings.collection.get('ocrServiceEnabled');
  return {
    ocrIsToggled: toggleOCRButton || false,
    locale,
  };
};

const mapDispatchToProps = (dispatch: any) =>
  bindActionCreators({ loadDocument: reloadDocument }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);
type mappedProps = ConnectedProps<typeof connector>;
type ComponentProps = OCRStatusProps & mappedProps;

// eslint-disable-next-line max-statements
const OCRStatus = ({ file, ocrIsToggled, locale, loadDocument }: ComponentProps) => {
  if (!ocrIsToggled) return null;

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
    getOcrStatus(file.filename || '')
      .then(({ status, lastUpdated }) => {
        setOcrStatus({ status, lastUpdated });
        if (status === 'inQueue') {
          socket.on('ocr:ready', listenOnSuccess);
          socket.on('ocr:error', listenOnError);
        }
      })
      .catch(() => {
        setOcrStatus({ status: 'ocrError', lastUpdated: Date.now() });
      });

    return () => {
      socket.off('ocr:ready', listenOnSuccess);
      socket.off('ocr:error', listenOnError);
    };
  }, [file]);

  const handleClick = () => {
    setOcrStatus({ status: 'inQueue', lastUpdated: Date.now() });
    postToOcr(file.filename || '')
      .then(() => {
        socket.on('ocr:ready', listenOnSuccess);
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
      tip = ocrStatusTips.noOcr();
      break;

    case 'inQueue':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>In OCR queue</Translate>
          </p>
        </div>
      );
      tip = ocrStatusTips.lastUpdated(lastUpdated);
      break;

    case 'unsupported_language':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>Unsupported OCR language</Translate>
          </p>
        </div>
      );
      tip = ocrStatusTips.unsupportedLang(file.language || 'other');
      break;

    case 'cannotProcess':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>OCR error</Translate>
          </p>
        </div>
      );
      tip = ocrStatusTips.cantProcess(lastUpdated);
      break;

    case 'ocrError':
      statusDisplay = (
        <div className="ocr-error">
          <p>
            <Translate>Could not be processed</Translate>
          </p>
        </div>
      );
      tip = ocrStatusTips.cantProcess(lastUpdated);
      break;

    case 'withOCR':
      statusDisplay = (
        <div className="status">
          <p>
            <Translate>OCR</Translate>&nbsp;&#10004;
          </p>
        </div>
      );
      tip = ocrStatusTips.lastUpdated(lastUpdated);
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
    <div className="ocr-service-display">
      {statusDisplay}
      {tip && <div className="ocr-tooltip">{tip}</div>}
    </div>
  );
};

const container = connector(OCRStatus);
export { container as OCRStatus };
