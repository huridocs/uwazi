import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { NeedAuthorization } from 'app/Auth';
import { FeatureToggle } from 'app/components/Elements/FeatureToggle';
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

const OCRButton = ({ file }: OCRButtonProps) => {
  const [ocrStatus, setOcrStatus] = useState('loading');

  useEffect(() => {
    dummyOCRGet(file.filename || '')
      .then(result => setOcrStatus(result))
      .catch(() => {
        setOcrStatus('cannotProcess');
      });
  }, []);

  return (
    <NeedAuthorization roles={['admin', 'editor']}>
      <FeatureToggle feature="ocr.url">
        <div className="ocr-service-display">{statusDisplay(file, ocrStatus)}</div>
      </FeatureToggle>
    </NeedAuthorization>
  );
};

export { OCRButton };
