import { createError } from 'api/utils';
import csvtojson from 'csvtojson';
import { availableLanguages } from 'shared/language';
import { LanguageSchema } from 'shared/types/commonTypes';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { Readable } from 'stream';
import { CSVRow } from './csv';
import { sanitizeStringValue } from './sanitizationUtils';

type ParsedValue = { nested: boolean; value: string };
type ParsedRow = Record<string, ParsedValue>;

const buildThesauriValues = (rows: ParsedRow[], languageLabel: string) => {
  const result: ThesaurusValueSchema[] = [];
  rows.forEach(row => {
    const { value: valueForLanguage, nested } = row[languageLabel];
    if (!valueForLanguage || valueForLanguage === '') return;
    const newThesauriValue = { label: valueForLanguage };

    if (!nested) {
      result.push(newThesauriValue);
    } else {
      const lastValue = result[result.length - 1];
      if (!lastValue) return;
      lastValue.values = lastValue.values ?? [];
      if (valueForLanguage && valueForLanguage !== '') {
        lastValue.values.push(newThesauriValue);
      }
    }
  });
  return result;
};

const buildTranslation = (
  rows: ParsedRow[],
  languagesToTranslate: Record<string, string>,
  languageLabel: string
) =>
  Object.fromEntries(
    Object.keys(languagesToTranslate).map(lang => [
      lang,
      Object.fromEntries(
        rows
          .filter(row => row[languageLabel].value !== '')
          .map(row => [row[languageLabel].value, row[languagesToTranslate[lang]].value])
      ),
    ])
  );

const parseValue = (value: string) => {
  const processedValue = [...value];
  let nested = false;

  while (processedValue.length > 0 && !nested) {
    const firstChar = processedValue.shift();

    if (firstChar === '-') {
      nested = true;
    }
    if (firstChar !== ' ') {
      break;
    }
  }

  const sanitizedResult = nested
    ? sanitizeStringValue(processedValue.join(''), 'thesaurus_import')
    : sanitizeStringValue(value, 'thesaurus_import');

  return {
    nested,
    value: sanitizedResult.value,
  };
};

const parseRows = (rows: CSVRow[]) =>
  rows.map(row =>
    Object.keys(row).reduce<ParsedRow>(
      (newRow, lang) => ({ ...newRow, [lang]: parseValue(row[lang]) }),
      {}
    )
  );

const validate = (rows: ParsedRow[]) => {
  rows.forEach((row, index) => {
    const [firstValue, ...restOfTheValues] = Object.values(row);
    if (index === 0 && firstValue.nested) {
      throw createError('Invalid csv: nested value need to be under a non-nested value', 400);
    }

    const allEqual = restOfTheValues.every(value => value.nested === firstValue.nested);
    if (!allEqual) {
      throw createError(
        'Invalid csv: all the values for a row must be either nested or non-nested',
        400
      );
    }
  });
};

const getAvailableLanguageLabels = (rows: ParsedRow[]): Record<string, string> => {
  const availableColumns = Object.keys(rows[0] || {});
  return availableLanguages
    .filter((l: LanguageSchema) => availableColumns.includes(l.label))
    .reduce<
      Record<string, string>
    >((map, lang: LanguageSchema) => ({ ...map, [lang.key]: lang.label }), {});
};

async function thesauriFromStream(
  readStream: Readable,
  primaryLanguage: string,
  fallbackLanguage: string,
  iso6391Languages: string[]
) {
  const rows: CSVRow[] = await csvtojson({ delimiter: [',', ';'] }).fromStream(readStream);
  const parsedRows = parseRows(rows);
  validate(parsedRows);

  const availableLanguageLabels = getAvailableLanguageLabels(parsedRows);

  let languageLabel: string;

  if (availableLanguageLabels[primaryLanguage]) {
    languageLabel = availableLanguageLabels[primaryLanguage];
  } else if (availableLanguageLabels[fallbackLanguage]) {
    languageLabel = availableLanguageLabels[fallbackLanguage];
  } else {
    const availableColumns = Object.keys(parsedRows[0] || {});
    languageLabel = availableColumns[0];
  }

  const supportedLanguageLabels = Object.fromEntries(
    Object.entries(availableLanguageLabels).filter(([key]) => iso6391Languages.includes(key))
  );
  const languagesToTranslate = Object.fromEntries(
    Object.entries(supportedLanguageLabels).filter(([key]) => key !== primaryLanguage)
  );

  return {
    thesauriValues: buildThesauriValues(parsedRows, languageLabel),
    thesauriTranslations: buildTranslation(parsedRows, languagesToTranslate, languageLabel),
  };
}

export { thesauriFromStream };
