import { t } from 'app/I18N';

const ocrStatusTips = {
  noOcr: () =>
    t(
      'System',
      "This will process the document to recognize it's text. The original file will be added as a supporting file.",
      null,
      false
    ),
  unsupportedLang: (language: string) => {
    let tip = "The document's language is not supported.";
    if (language === 'other') tip = 'Please select a language for this document';
    return t('System', tip, null, false);
  },
  cantProcess: (time: string) =>
    `${t(
      'System',
      'The OCR engine couldn’t read the document. Try uploading the document in a different format. Last updated',
      null,
      false
    )}: ${time}`,
  lastUpdated: (time: string) => `${t('System', 'Last updated', null, false)}: ${time}`,
};

export { ocrStatusTips };
