enum OcrFailureReason {
  INVALID_PDF = 'invalidPdf',
  PDF_NOT_FOUND = 'pdfNotFound',
  SOURCE_GONE = 'sourceGone',
  SERVICE_NOT_CONFIGURED = 'serviceNotConfigured',
  TIMEOUT = 'timeout',
  UNEXPECTED = 'unexpected',
}

export { OcrFailureReason };
