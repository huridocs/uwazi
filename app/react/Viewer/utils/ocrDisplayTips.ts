import { t } from 'app/I18N';

const ocrDisplayTips = {
  noOcr: 'The original file will be added as a supporting file.',
  unsupportedLang: "The document's language is not supported.",
  ocrComplete: 'OCR complete. Click the button to refresh the page and see the changes.',
  cantProcess: (time: string) =>
    `${t(
      'System',
      'The OCR engine couldn’t read the document. Try uploading the document in a different format. Last updated',
      null,
      false
    )}: ${time}`,
  lastUpdated: (time: string) => `${t('System', 'Last updated', null, false)}: ${time}`,
};

export { ocrDisplayTips };
