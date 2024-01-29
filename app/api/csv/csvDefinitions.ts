const csvConstants = {
  dictionaryParentChildSeparator: '::',
  dateRangeExportSeparator: '~',
  dateRangeImportSeparator: ':',
  multiValueSeparator: '|',
  languageHeaderSeparator: '__',
};

const languageCodeSuffix = (language: string) =>
  `${csvConstants.languageHeaderSeparator}${language}`;

const headerWithLanguage = (header: string, language: string) =>
  `${header}${languageCodeSuffix(language)}`;

export { csvConstants, headerWithLanguage, languageCodeSuffix };
