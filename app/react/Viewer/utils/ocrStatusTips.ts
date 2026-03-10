import { t } from 'app/I18N';

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

export { ocrStatusTips };
