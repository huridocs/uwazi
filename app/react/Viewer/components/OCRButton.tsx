import React from 'react';
import { Translate } from 'app/I18N';

const addToQueue = (
  <button type="button" className="btn btn-default">
    <Translate>Add to OCR queue</Translate>
  </button>
);

const inQueue = (
  <div className="">
    <p>
      <Translate>In OCR queue</Translate>
    </p>
  </div>
);

const cannotBeProcessed = (
  <div className="">
    <p>
      <Translate>Cannot be processed</Translate>
    </p>
  </div>
);

const processing = (
  <div className="">
    <p>
      <Translate>Processing OCR</Translate>&nbsp;...
    </p>
  </div>
);

const ocrComplete = (
  <div className="">
    <p>
      <Translate>OCR Complete</Translate>&nbsp;&#10004;
    </p>
  </div>
);

const OCRButton = () => <div className="ocr-service-display">{addToQueue}</div>;

export { OCRButton };
