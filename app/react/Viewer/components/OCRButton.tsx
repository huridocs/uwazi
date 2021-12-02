import React from 'react';
import { Translate } from 'app/I18N';

const addToQueue = (
  <button type="button" className="btn btn-default">
    <Translate>Add to OCR queue</Translate>
  </button>
);

const inQueue = (
  <div className="in-queue">
    <p>
      <Translate>In OCR queue</Translate>
    </p>
  </div>
);

const cannotBeProcessed = (
  <div className="cant-process">
    <p>
      <Translate>Cannot be processed</Translate>
    </p>
  </div>
);

const processing = (
  <div className="in-queue">
    <p>
      <Translate>Processing OCR</Translate>&nbsp;...
    </p>
  </div>
);

const ocrComplete = (
  <div className="complete">
    <p>
      <Translate>OCR Complete</Translate>&nbsp;&#10004;
    </p>
  </div>
);

const OCRButton = () => <div className="ocr-service-display">{ocrComplete}</div>;

export { OCRButton };
