const ocrDisplayTips = {
  noOcr: 'The original file will be added as a supporting file.',
  unsupportedLang: 'The documents language is not supported, try changing the document language',
  cantProcess: (
    time: Date
  ) => `The OCR engine couldn’t read the document. Try uploading the document in a different format. 
  Last updated ${time}`,
};

export { ocrDisplayTips };
