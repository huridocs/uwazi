import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { Suggestion } from '../IXSuggestionsDataSource.js';

/**
 * The single fixture set behind the IXSuggestionsDataSource contract suite. One declaration
 * serves both backends: `testingEnvironment.setFixtures` mirrors `ixextractors` and
 * `ixsuggestions` into Postgres. `ixextractors` is declared first: tables are loaded in key order
 * and `ix_suggestions` references `ix_extractors`.
 *
 * Shapes follow the stored data: ids are ObjectIds, `entityTemplate` is a hex string, text-source
 * rows carry no `fileId`, every row carries `useForTraining`, and a never-run suggestion has
 * `date: null`.
 */

const f = getFixturesFactory();

const TENANT_ID = 'ix-suggestions-contract';

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const extractors = {
  text: f.id('text extractor'),
  pdf: f.id('pdf extractor'),
  other: f.id('other extractor'),
};

type Props = Parameters<typeof f.ixSuggestion>[0];

const textSuggestion = (name: string, props: Props) => {
  const { fileId, ...suggestion } = f.ixSuggestion({
    _id: f.id(name),
    extractorId: extractors.text,
    entityLanguageId: f.id(`${name} entity`),
    entityTemplate: f.idString('template'),
    useForTraining: false,
    ...props,
  });
  return suggestion as Suggestion;
};

const pdfSuggestion = (name: string, props: Props) =>
  f.ixSuggestion({
    _id: f.id(name),
    extractorId: extractors.pdf,
    entityLanguageId: f.id(`${name} entity`),
    entityTemplate: f.idString('template'),
    useForTraining: false,
    ...props,
  }) as Suggestion;

const withoutState = ({ state, ...suggestion }: Suggestion) => suggestion as Suggestion;

const suggestions = {
  accepted: textSuggestion('accepted', {
    entityId: 'entity1',
    date: 1000,
    modelData: { suggestionsRunTimestamp: 500 },
    useForTraining: true,
    state: { labeled: true, withSuggestion: true, withValue: true, match: true },
  }),
  blank: textSuggestion('blank', {
    entityId: 'entity2',
    date: 1000,
    modelData: { suggestionsRunTimestamp: 500 },
    // Mongo stores an unknown match as null (4e).
    state: { withSuggestion: true, withValue: false, match: null as unknown as boolean },
  }),
  obsolete: textSuggestion('obsolete', {
    entityId: 'entity3',
    date: 900,
    state: { withSuggestion: true, withValue: false, obsolete: true, match: false },
  }),
  pending: textSuggestion('pending', {
    entityId: 'entity4',
    status: 'processing',
    date: null,
    state: { labeled: true },
  }),
  errored: textSuggestion('errored', {
    entityId: 'entity5',
    status: 'failed',
    error: 'failed',
    date: 950,
    modelData: { suggestionsRunTimestamp: 500 },
    state: { withSuggestion: true, error: true },
  }),
  spanish: textSuggestion('spanish', {
    entityId: 'entity1',
    language: 'es',
    date: 800,
    state: { withSuggestion: true },
  }),
  stateless: withoutState(
    textSuggestion('stateless', { entityId: 'entity7', status: 'processing', date: null })
  ),
  otherExtractor: textSuggestion('other extractor suggestion', {
    extractorId: extractors.other,
    entityId: 'entity1',
    date: 1000,
    // Pending for its own extractor: counts scoped to another extractor must not see it.
    state: { obsolete: true, error: true },
  }),
  pdfFile1: pdfSuggestion('pdf file 1', {
    entityId: 'entity6',
    fileId: f.id('file 1'),
    useForTraining: true,
    suggestedValue: [{ id: 'option1', label: 'Option 1' }],
    selectionRectangles: [{ top: 1, left: 2, width: 3, height: 4, page: '1' }],
  }),
  // A second file of the same entity and language: pdf rows are keyed by file.
  pdfFile2: pdfSuggestion('pdf file 2', { entityId: 'entity6', fileId: f.id('file 2') }),
};

const fixtures: DBFixture = {
  ixextractors: [
    f.ixExtractor('text extractor', 'text_property', ['template'], { property: 'source' }),
    f.ixExtractor('pdf extractor', 'pdf_property', ['template'], { pdf: true }),
    f.ixExtractor('other extractor', 'other_property', ['template'], { property: 'source' }),
  ],
  ixsuggestions: Object.values(suggestions),
};

/**
 * A top-level field set to null and an absent one mean the same to every reader (`date` is the
 * one stored both ways), and a Postgres read cannot tell them apart. Nested values stay strict.
 */
const withoutNulls = (suggestion: object) =>
  Object.fromEntries(
    Object.entries(suggestion).filter(([, value]) => value !== null && value !== undefined)
  );

/** Order-insensitive, null-insensitive comparison form of a list of suggestions. */
const comparable = <T extends { _id: unknown }>(list: T[]) =>
  list.map(withoutNulls).sort((a, b) => String(a._id).localeCompare(String(b._id)));

const inIdOrder = <T extends { _id: { toHexString(): string } }>(list: T[]) =>
  [...list].sort((a, b) => (a._id.toHexString() < b._id.toHexString() ? -1 : 1));

export {
  f,
  TENANT_ID,
  testConfigs,
  extractors,
  suggestions,
  fixtures,
  withoutNulls,
  comparable,
  inIdOrder,
};
