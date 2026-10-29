import { Knex } from 'knex';
import { nextName, PropertyDoc } from './names.js';
import { agreedName, Pair, TemplatePlan, templatesForExtractor } from './plans.js';
import { Link, rewriteLinks } from './documents.js';
import { rewriteText } from './textRewrite.js';

type ExtractorRow = {
  _id: string;
  property: string;
  source: { property?: string; pdf?: boolean } | null;
  templates: string[] | null;
};

const json = (value: unknown): unknown => (typeof value === 'string' ? JSON.parse(value) : value);

const tempKey = (index: number) => `__uwazi_rename_${index}__`;

const sequentially = async <T>(items: T[], visit: (item: T, index: number) => Promise<void>) => {
  await items.reduce(async (previous, item, index) => {
    await previous;
    await visit(item, index);
  }, Promise.resolve());
};

const renameMetadataKey = async (
  trx: Knex.Transaction,
  rename: { templateId: string; from: string; to: string }
) => {
  await trx.raw(
    `UPDATE entities
     SET metadata = (metadata - ?::text) || jsonb_build_object(?::text, metadata -> ?::text)
     WHERE template = ? AND jsonb_exists(metadata, ?::text)`,
    [rename.from, rename.to, rename.from, rename.templateId, rename.from]
  );
};

const renameMetadata = async (trx: Knex.Transaction, templateId: string, pairs: Pair[]) => {
  await sequentially(pairs, async (pair, index) => {
    await renameMetadataKey(trx, { templateId, from: pair.from, to: tempKey(index) });
  });
  await sequentially(pairs, async (pair, index) => {
    await renameMetadataKey(trx, { templateId, from: tempKey(index), to: pair.to });
  });
};

const renamedSelections = (selections: { name: string }[], pairs: Pair[]) =>
  selections.map(selection => {
    const pair = pairs.find(candidate => candidate.from === selection.name);
    if (!pair) return selection;
    return { ...selection, name: pair.to };
  });

const renameFileSelections = async (trx: Knex.Transaction, templateId: string, pairs: Pair[]) => {
  const files = await trx('files')
    .select<{ _id: string; propertySelections: { name: string }[] | string | null }[]>(
      '_id',
      'propertySelections'
    )
    .whereIn('entity', trx('entities').select('sharedId').where('template', templateId));
  await sequentially(files, async file => {
    const selections = json(file.propertySelections) as { name: string }[] | null;
    if (!selections) return;
    await trx.raw('UPDATE files SET "propertySelections" = ?::jsonb WHERE _id = ?', [
      JSON.stringify(renamedSelections(selections, pairs)),
      file._id,
    ]);
  });
};

const renameSuggestions = async (trx: Knex.Transaction, templateId: string, pairs: Pair[]) => {
  await sequentially(pairs, async (pair, index) => {
    await trx.raw(
      'UPDATE ix_suggestions SET "propertyName" = ? WHERE "entityTemplate" = ? AND "propertyName" = ?',
      [tempKey(index), templateId, pair.from]
    );
  });
  await sequentially(pairs, async (pair, index) => {
    await trx.raw(
      'UPDATE ix_suggestions SET "propertyName" = ? WHERE "entityTemplate" = ? AND "propertyName" = ?',
      [pair.to, templateId, tempKey(index)]
    );
  });
};

const assertExtractors = (plans: TemplatePlan[], extractors: ExtractorRow[]) => {
  extractors.forEach(extractor => {
    const templates = templatesForExtractor(plans, (json(extractor.templates) as string[]) ?? []);
    const source = json(extractor.source) as ExtractorRow['source'];
    agreedName(templates, extractor.property);
    if (typeof source?.property === 'string') agreedName(templates, source.property);
  });
};

const renameExtractors = async (trx: Knex.Transaction, plans: TemplatePlan[]) => {
  const extractors = await trx('ix_extractors').select<ExtractorRow[]>(
    '_id',
    'property',
    'source',
    'templates'
  );
  await sequentially(extractors, async extractor => {
    const templates = templatesForExtractor(plans, json(extractor.templates) as string[]);
    const source = json(extractor.source) as ExtractorRow['source'];
    const property = agreedName(templates, extractor.property);
    const sourceProperty =
      typeof source?.property === 'string' ? agreedName(templates, source.property) : undefined;
    const nextSource = sourceProperty && source ? { ...source, property: sourceProperty } : source;
    await trx.raw('UPDATE ix_extractors SET property = ?, source = ?::jsonb WHERE _id = ?', [
      property,
      JSON.stringify(nextSource),
      extractor._id,
    ]);
  });
};

const renamedProperties = (properties: PropertyDoc[]): PropertyDoc[] =>
  properties.map(property => {
    const to = nextName(property);
    if (!to) return property;
    return { ...property, name: to };
  });

const renameTemplateProperties = async (trx: Knex.Transaction, plans: TemplatePlan[]) => {
  await sequentially(plans, async plan => {
    if (plan.pairs.length === 0) return;
    const properties = json(plan.template.properties) as PropertyDoc[];
    await trx.raw('UPDATE templates SET properties = ?::jsonb WHERE _id = ?', [
      JSON.stringify(renamedProperties(properties)),
      plan.template._id,
    ]);
  });
};

const rewriteSettings = async (
  trx: Knex.Transaction,
  settings: { links?: Link[] | null; site_preferences?: { home_page?: unknown } | null },
  pairs: Pair[]
) => {
  const preferences = { ...(settings.site_preferences ?? {}) };
  if (typeof preferences.home_page === 'string') {
    preferences.home_page = rewriteText(preferences.home_page, pairs);
  }
  await trx.raw('UPDATE settings SET links = ?::jsonb, site_preferences = ?::jsonb', [
    JSON.stringify(
      Array.isArray(settings.links) ? rewriteLinks(settings.links, pairs) : settings.links
    ),
    JSON.stringify(preferences),
  ]);
};

const rewriteLocaleRow = async (
  trx: Knex.Transaction,
  row: { page_id: string; language: string; draft_content: string; draft_script: string },
  pairs: Pair[]
) => {
  await trx.raw(
    'UPDATE page_locales SET draft_content = ?, draft_script = ? WHERE page_id = ? AND language = ?',
    [
      rewriteText(row.draft_content, pairs),
      rewriteText(row.draft_script, pairs),
      row.page_id,
      row.language,
    ]
  );
};

export type { ExtractorRow };
export {
  assertExtractors,
  json,
  renameExtractors,
  renameFileSelections,
  renameMetadata,
  renameSuggestions,
  renameTemplateProperties,
  rewriteLocaleRow,
  rewriteSettings,
};
