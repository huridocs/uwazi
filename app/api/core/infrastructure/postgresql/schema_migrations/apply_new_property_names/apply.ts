import { Knex } from 'knex';
import type { PgTenantMigrationContext } from '../../PgDataMigration.js';
import { planTemplates, renamedSomething, TemplateDoc, TemplatePlan, textPairs } from './plans.js';
import { rewriteText } from './textRewrite.js';
import {
  assertExtractors,
  ExtractorRow,
  json,
  renameExtractors,
  renameFileSelections,
  renameMetadata,
  renameSuggestions,
  renameTemplateProperties,
  rewriteLocaleRow,
  rewriteSettings,
} from './writes.js';

type SettingsRow = {
  new_name_generation: boolean | null;
  links: { url?: string; sublinks?: { url?: string }[] }[] | null;
  site_preferences: { home_page?: unknown } | null;
};

type Prepared = { plans: TemplatePlan[]; pairs: ReturnType<typeof textPairs> };

const sequentially = async <T>(items: T[], visit: (item: T) => Promise<void>) => {
  await items.reduce(async (previous, item) => {
    await previous;
    await visit(item);
  }, Promise.resolve());
};

const readPlans = async (trx: Knex.Transaction): Promise<Prepared | null> => {
  const settings = await trx('settings').first<SettingsRow>();
  if (!settings || settings.new_name_generation === true) return null;

  const templates = (await trx('templates').select('_id', 'properties', 'commonProperties')).map(
    row => ({
      ...row,
      properties: json(row.properties),
      commonProperties: json(row.commonProperties),
    })
  ) as TemplateDoc[];
  const plans = planTemplates(templates);
  const extractors = await trx('ix_extractors').select<ExtractorRow[]>(
    '_id',
    'property',
    'source',
    'templates'
  );
  assertExtractors(plans, extractors);
  return { plans, pairs: textPairs(plans) };
};

const writeTemplateRows = async (trx: Knex.Transaction, plans: TemplatePlan[]) => {
  await sequentially(plans, async plan => {
    await renameMetadata(trx, plan.template._id, plan.pairs);
    await renameFileSelections(trx, plan.template._id, plan.pairs);
    await renameSuggestions(trx, plan.template._id, plan.pairs);
  });
  await renameExtractors(trx, plans);
};

const rewriteReleaseLocales = (
  locales: Record<string, { draft?: { content?: string; script?: string } }> | null,
  pairs: Prepared['pairs']
) => {
  if (!locales) return locales;
  return Object.fromEntries(
    Object.entries(locales).map(([language, locale]) => {
      const { draft } = locale ?? {};
      if (!draft) return [language, locale];
      return [
        language,
        {
          ...locale,
          draft: {
            ...draft,
            content:
              typeof draft.content === 'string' ? rewriteText(draft.content, pairs) : draft.content,
            script:
              typeof draft.script === 'string' ? rewriteText(draft.script, pairs) : draft.script,
          },
        },
      ];
    })
  );
};

const rewriteStoredText = async (trx: Knex.Transaction, pairs: Prepared['pairs']) => {
  const settings = await trx('settings').first<SettingsRow>();
  if (settings) await rewriteSettings(trx, settings, pairs);
  const locales = await trx('page_locales').select<
    { page_id: string; language: string; draft_content: string; draft_script: string }[]
  >('page_id', 'language', 'draft_content', 'draft_script');
  await sequentially(locales, async row => {
    await rewriteLocaleRow(trx, row, pairs);
  });
  const releases = await trx('page_releases').select<{ _id: string; locales: unknown }[]>(
    '_id',
    'locales'
  );
  await sequentially(releases, async release => {
    await trx.raw('UPDATE page_releases SET locales = ?::jsonb WHERE _id = ?', [
      JSON.stringify(rewriteReleaseLocales(json(release.locales), pairs)),
      release._id,
    ]);
  });
};

const repairTenant = async (ctx: PgTenantMigrationContext, prepared: Prepared) => {
  await ctx.transaction(async trx => {
    await writeTemplateRows(trx, prepared.plans);
  });
  await ctx.heartbeat();
  await ctx.transaction(async trx => {
    await rewriteStoredText(trx, prepared.pairs);
  });
  await ctx.heartbeat();
  await ctx.transaction(async trx => {
    await renameTemplateProperties(trx, prepared.plans);
  });
  if (renamedSomething(prepared.plans)) ctx.reindex();
  await ctx.transaction(async trx => {
    await trx.raw('UPDATE settings SET new_name_generation = true');
  });
};

const applyNewPropertyNames = async (ctx: PgTenantMigrationContext): Promise<void> => {
  const prepared = await ctx.transaction(readPlans);
  if (!prepared) return;
  await repairTenant(ctx, prepared);
};

export { applyNewPropertyNames };
