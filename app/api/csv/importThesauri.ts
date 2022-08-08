import { createError } from 'api/utils';
import csvtojson from 'csvtojson';
import { availableLanguages } from 'shared/languagesList';
import { ensure } from 'shared/tsUtils';
import { LanguageSchema } from 'shared/types/commonTypes';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { Readable } from 'stream';
import { CSVRow } from './csv';

type ParsedValue = { nested: boolean; value: string };
type ParsedRow = Record<string, ParsedValue>;

const buildThesauriValues = (rows: ParsedRow[], languageLabel: string) => {
  const result: ThesaurusValueSchema[] = [];
  rows.forEach(row => {
    const { value: valueForLanguage, nested } = row[languageLabel];
    const newThesauriValue = { label: valueForLanguage };

    if (!nested) {
      result.push(newThesauriValue);
    } else {
      const lastValue = result[result.length - 1];
      lastValue.values = lastValue.values ?? [];
      lastValue.values.push(newThesauriValue);
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
        rows.map(row => [row[languageLabel].value, row[languagesToTranslate[lang]].value])
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

  return {
    nested,
    value: nested ? processedValue.join('').trim() : value.trim(),
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

const getLanguagesToTranslate = (iso6391Languages: string[], rows: ParsedRow[]) =>
  availableLanguages
    .filter(l => iso6391Languages.includes(l.key) && Object.keys(rows[0]).includes(l.label))
    .reduce<Record<string, string>>((map, lang) => ({ ...map, [lang.key]: lang.label }), {});

async function thesauriFromStream(
  readStream: Readable,
  language: string,
  iso6391Languages: string[]
) {
  const rows: CSVRow[] = await csvtojson({ delimiter: [',', ';'] }).fromStream(readStream);
  const parsedRows = parseRows(rows);
  validate(parsedRows);

  const languageLabel: string = ensure<LanguageSchema>(
    availableLanguages.find(l => l.key === language)
  ).label;

  const languagesToTranslate = getLanguagesToTranslate(iso6391Languages, parsedRows);

  return {
    thesauriValues: buildThesauriValues(parsedRows, languageLabel),
    thesauriTranslations: buildTranslation(parsedRows, languagesToTranslate, languageLabel),
  };
}

export { thesauriFromStream };
