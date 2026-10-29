import { Db, ObjectId } from 'mongodb';
import { pageUpdate, rewriteRelease, settingsTextUpdate } from './documents.js';
import { planTemplates, renamedSomething, TemplatePlan, textPairs } from './plans.js';
import {
  assertExtractorAgreements,
  renameExtractors,
  renameFileSelections,
  renameMetadata,
  renameSuggestions,
  renameTemplateProperties,
} from './writes.js';

const sequentially = async <T>(items: T[], visit: (item: T) => Promise<void>) => {
  await items.reduce(async (previous, item) => {
    await previous;
    await visit(item);
  }, Promise.resolve());
};

const hasKeys = (value: Record<string, unknown>): boolean => Object.keys(value).length > 0;

const rewritePages = async (db: Db, pairs: ReturnType<typeof textPairs>) => {
  const pages = await db.collection('pages').find({}).toArray();
  await sequentially(pages, async page => {
    const $set = pageUpdate(page as Parameters<typeof pageUpdate>[0], pairs);
    if (!hasKeys($set)) return;
    await db.collection('pages').updateOne({ _id: page._id }, { $set });
  });
};

const rewriteReleases = async (db: Db, pairs: ReturnType<typeof textPairs>) => {
  const releases = await db.collection('page_releases').find({}).toArray();
  await sequentially(releases, async release => {
    const { _id, ...replacement } = rewriteRelease(release as Record<string, unknown>, pairs);
    await db.collection('page_releases').replaceOne({ _id: _id as ObjectId }, replacement);
  });
};

const rewriteSettingsText = async (db: Db, pairs: ReturnType<typeof textPairs>) => {
  const settings = await db.collection('settings').findOne({});
  if (!settings) return;
  const $set = settingsTextUpdate(settings as Parameters<typeof settingsTextUpdate>[0], pairs);
  if (!hasKeys($set)) return;
  await db.collection('settings').updateOne({ _id: settings._id }, { $set });
};

const applyTemplateData = async (db: Db, plans: TemplatePlan[]) => {
  await sequentially(plans, async plan => {
    await renameMetadata(db, plan.template._id, plan.pairs);
    await renameFileSelections(db, plan.template._id, plan.pairs);
    await renameSuggestions(db, plan.template._id, plan.pairs);
  });
  await renameExtractors(db, plans);
};

const repairTenant = async (db: Db, plans: TemplatePlan[]) => {
  const pairs = textPairs(plans);
  await assertExtractorAgreements(db, plans);
  await applyTemplateData(db, plans);
  await rewritePages(db, pairs);
  await rewriteReleases(db, pairs);
  await rewriteSettingsText(db, pairs);
  await renameTemplateProperties(db, plans);
  await db.collection('settings').updateOne({}, { $set: { newNameGeneration: true } });
};

const applyNewPropertyNames = async (db: Db): Promise<boolean> => {
  const settings = await db.collection('settings').findOne({});
  if (!settings || settings.newNameGeneration === true) return false;

  const plans = planTemplates(await db.collection('templates').find({}).toArray());
  await repairTenant(db, plans);
  return renamedSomething(plans);
};

export { applyNewPropertyNames };
