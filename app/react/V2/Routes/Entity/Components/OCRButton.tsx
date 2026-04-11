import React, { useEffect, useMemo, useState } from 'react';
import { useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import { Tooltip } from 'flowbite-react';
import { FileType } from '#shared/types/fileType.js';
import { Translate, t } from '#app/I18N/index.js';
import { socket } from '#app/socket.js';
import { getOcrStatus, OcrStatus, postToOcr } from '#V2/api/files/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { reportErrorToSentry } from '#V2/shared/errorUtils.js';
import { secondsToDate } from '#V2/shared/dateHelpers.js';

const ocrStatusTips = {
  noOcr: () => t('System', 'OCR button tip', null, false),
  unsupportedLang: (language: string) => {
    let tip = "The document's language is not supported.";
    if (language === 'other') tip = 'Please select a language for this document';
    return t('System', tip, null, false);
  },
  cantProcess: (time: string) => `${t('System', 'OCR error tip', null, false)}: ${time}`,
  lastUpdated: (time: string) => `${t('System', 'Last updated', null, false)}: ${time}`,
};

type OCRButtonProps = {
  file: FileType;
};

const OCRButton = ({ file }: OCRButtonProps) => {
  const { revalidate } = useRevalidator();
  const locale = useAtomValue(localeAtom);
  const [ocrStatus, setOcrStatus] = useState<{
    status: OcrStatus | undefined;
    lastUpdated: number | undefined;
  }>({
    status: undefined,
    lastUpdated: Math.floor(Date.now() / 1000),
  });

  const { statusDisplay, tip } = useMemo(() => {
    if (ocrStatus.status === OcrStatus.NONE) {
      return { statusDisplay: <Translate>OCR PDF</Translate>, tip: ocrStatusTips.noOcr() };
    }

    if (ocrStatus.status === OcrStatus.PROCESSING) {
      return {
        statusDisplay: <Translate>In OCR queue</Translate>,
        tip: ocrStatus.lastUpdated
          ? ocrStatusTips.lastUpdated(secondsToDate(ocrStatus.lastUpdated, locale))
          : undefined,
      };
    }

    if (ocrStatus.status === OcrStatus.UNSUPPORTED_LANGUAGE) {
      return {
        statusDisplay: <Translate>Unsupported OCR language</Translate>,
        tip: ocrStatusTips.unsupportedLang(file.language || 'other'),
      };
    }

    if (ocrStatus.status === OcrStatus.ERROR) {
      return {
        statusDisplay: <Translate>OCR error</Translate>,
        tip: ocrStatus.lastUpdated
          ? ocrStatusTips.cantProcess(secondsToDate(ocrStatus.lastUpdated, locale))
          : undefined,
      };
    }

    if (ocrStatus.status === OcrStatus.READY) {
      return {
        statusDisplay: (
          <span>
            <Translate>OCR</Translate>&nbsp;&#10004;
          </span>
        ),
        tip: ocrStatus.lastUpdated
          ? ocrStatusTips.lastUpdated(secondsToDate(ocrStatus.lastUpdated, locale))
          : undefined,
      };
    }

    return {
      statusDisplay: (
        <span>
          <Translate>Loading</Translate>&nbsp;...
        </span>
      ),
      tip: undefined,
    };
  }, [file, locale, ocrStatus]);

  useEffect(() => {
    const listenOnSuccess = async (_id: string) => {
      if (file._id === _id) {
        setOcrStatus({ status: OcrStatus.READY, lastUpdated: Math.floor(Date.now() / 1000) });
        await revalidate();
      }
    };

    const listenOnError = (_id: string) => {
      if (file._id === _id) {
        setOcrStatus({ status: OcrStatus.ERROR, lastUpdated: Math.floor(Date.now() / 1000) });
      }
    };

    getOcrStatus(file.filename || '')
      .then(response => {
        if (response && typeof response === 'object' && 'status' in response) {
          const { status, lastUpdated } = response as { status: OcrStatus; lastUpdated?: number };
          const updatedOn = lastUpdated || Date.now();
          setOcrStatus({ status, lastUpdated: updatedOn / 1000 });
          socket.on('ocr:ready', listenOnSuccess);
          socket.on('ocr:error', listenOnError);
        }
      })
      .catch(e => {
        reportErrorToSentry(e, 'Error in OCR for document');
        setOcrStatus({ status: OcrStatus.ERROR, lastUpdated: Math.floor(Date.now() / 1000) });
      });

    return () => {
      socket.off('ocr:ready', listenOnSuccess);
      socket.off('ocr:error', listenOnError);
    };
  }, [file, revalidate]);

  const handleClick = async () => {
    try {
      setOcrStatus({ status: OcrStatus.PROCESSING, lastUpdated: Math.floor(Date.now() / 1000) });
      await postToOcr(file.filename || '');
    } catch (e) {
      reportErrorToSentry(e, 'Error in OCR for document');
      setOcrStatus({ status: OcrStatus.ERROR, lastUpdated: Math.floor(Date.now() / 1000) });
    }
  };

  return (
    // eslint-disable-next-line react/style-prop-object
    <Tooltip content={tip} style="light">
      <Button
        variant="secondary"
        disabled={ocrStatus.status !== OcrStatus.NONE}
        onClick={handleClick}
      >
        {statusDisplay}
      </Button>
    </Tooltip>
  );
};

export { OCRButton };
