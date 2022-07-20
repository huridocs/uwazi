import csvtojson from 'csvtojson';
import { availableLanguages } from 'shared/languagesList';
import { ensure } from 'shared/tsUtils';
import { LanguageSchema } from 'shared/types/commonTypes';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { Readable } from 'stream';
import { CSVRow } from './csv';

const buildThesauri = (values: ParsedRow[], languageLabel: string) =>
  values.reduce<ThesaurusValueSchema[]>((thesauriValues, value) => {
    const { value: valueForLanguage, nested } = value[languageLabel];
    const newThesauriValue = { label: valueForLanguage };

    if (!nested) {
      return [...thesauriValues, newThesauriValue];
    }

    const lastValue = thesauriValues[thesauriValues.length - 1];
    lastValue.values = (lastValue.values ?? []).concat([newThesauriValue]);
    return thesauriValues;
  }, []);

const buildTranslation = (
  values: ParsedRow[],
  languagesToTranslate: Record<string, string>,
  languageLabel: string
) =>
  Object.fromEntries(
    Object.keys(languagesToTranslate).map(lang => [
      lang,
      Object.fromEntries(
        values.map(t => [t[languageLabel].value, t[languagesToTranslate[lang]].value])
      ),
    ])
  );

type ParsedValue = { nested: boolean; value: string };
type ParsedRow = Record<string, ParsedValue>;

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
      throw new Error('Invalid csv: nested value need to be under a non-nested value');
    }

    const allEqual = restOfTheValues.every(value => value.nested === firstValue.nested);
    if (!allEqual) {
      throw new Error('Invalid csv: all the values for a row must be either nested or non-nested');
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
    thesauriValues: buildThesauri(parsedRows, languageLabel),
    thesauriTranslations: buildTranslation(parsedRows, languagesToTranslate, languageLabel),
  };
}

export { thesauriFromStream };
