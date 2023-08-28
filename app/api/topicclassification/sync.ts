import entities from 'api/entities';
import { EnforcedWithId, QueryForEach } from 'api/odm';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { extractSequence, listModels } from 'api/topicclassification';
import { getModel, fetchSuggestions } from 'api/topicclassification/api';
import { buildFullModelName } from 'shared/commonTopicClassification';
import { provenanceTypes } from 'shared/provenanceTypes';
import { Task, TaskProvider } from 'shared/tasks/tasks';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import * as util from 'util';
import { ensure } from 'shared/tsUtils';

interface SyncArgs {
  limit?: number;
  mode: 'onlynew' | 'autoaccept';
  model?: string;
  noDryRun?: boolean;
  overwrite?: boolean;
  autoAcceptConfidence?: number;
  batchSize?: number;
}

// eslint-disable-next-line max-params, max-statements
async function handlePropOnlynew(
  e: EntitySchema,
  args: SyncArgs,
  prop: PropertySchema,
  thes: ThesaurusSchema,
  latestModelVersion?: string
): Promise<boolean> {
  const seq = await extractSequence(e);
  if (e.metadata![prop.name!] && (e.metadata![prop.name!] ?? []).length) {
    return false;
  }
  if (!args.overwrite && e.suggestedMetadata![prop.name!]) {
    return false;
  }
  if (latestModelVersion) {
    const currentModel = e
      .suggestedMetadata![prop.name!]?.map(v => v.suggestion_model)
      .reduce((max, s) => ((s || '') > max! ? s : max), '');
    if (currentModel && currentModel >= latestModelVersion) {
      return false;
    }
  }
  const suggestions = await fetchSuggestions(e, prop, seq, thes);
  if (
    !suggestions ||
    JSON.stringify(suggestions) === JSON.stringify(e.suggestedMetadata![prop.name!])
  ) {
    return false;
  }
  e.suggestedMetadata![prop.name!] = suggestions;
  return true;
}

// eslint-disable-next-line max-params, max-statements
async function handlePropAutoaccept(
  e: EntitySchema,
  args: SyncArgs,
  prop: PropertySchema,
  thes: ThesaurusSchema,
  latestModelVersion?: string
): Promise<boolean> {
  const seq = await extractSequence(e);
  if (e.metadata![prop.name!] && (e.metadata![prop.name!] ?? []).length) {
    if (!e.metadata![prop.name!]!.every(v => v.provenance === provenanceTypes.bulk)) {
      return false;
    }
    if (!args.overwrite) {
      return false;
    }
    if (latestModelVersion) {
      const currentModel = e
        .metadata![prop.name!]?.map(v => v.suggestion_model)
        .reduce((max, s) => ((s || '') > max! ? s : max), '');
      if (currentModel && currentModel >= latestModelVersion) {
        return false;
      }
    }
  }
  const suggestions = await fetchSuggestions(e, prop, seq, thes);
  if (!suggestions) {
    return false;
  }
  const toApply = suggestions
    .filter(s => (s.suggestion_confidence ?? 0) >= (args.autoAcceptConfidence ?? 0))
    .map(s => ({ ...s, provenance: provenanceTypes.bulk }));
  if (JSON.stringify(toApply) === JSON.stringify(e.metadata![prop.name!])) {
    return false;
  }
  e.metadata![prop.name!] = toApply;
  return true;
}

async function syncEntity(
  e: EntitySchema,
  args: SyncArgs,
  templateDictP?: { [k: string]: TemplateSchema },
  thesaurusDictP?: { [k: string]: ThesaurusSchema },
  availableModels?: { [k: string]: string | undefined }
): Promise<boolean> {
  if (!e.metadata) {
    e.metadata = {};
  }
  if (!e.suggestedMetadata) {
    e.suggestedMetadata = {};
  }
  const template: TemplateSchema | undefined =
    (templateDictP ?? {})[e.template?.toString() ?? ''] ??
    (await templates.getById(ensure<string>(e.template)));
  const thesaurusDict =
    thesaurusDictP ??
    (await thesauri.get(null)).reduce<Record<string, EnforcedWithId<ThesaurusSchema>>>(
      (res, t) => ({ ...res, [t._id.toString()]: t }),
      {}
    );
  let didSth = false;
  await Promise.all(
    (template?.properties ?? []).map(async prop => {
      const thesaurus = thesaurusDict[prop?.content ?? ''];
      if (!prop || !thesaurus) {
        return;
      }
      const modelName = buildFullModelName(thesaurus.name);
      if (availableModels !== undefined && !availableModels[modelName]) {
        return;
      }
      if (args.mode === 'onlynew') {
        didSth =
          didSth ||
          (await handlePropOnlynew(e, args, prop, thesaurus, (availableModels ?? {})[modelName]));
      } else if (args.mode === 'autoaccept') {
        didSth =
          didSth ||
          (await handlePropAutoaccept(
            e,
            args,
            prop,
            thesaurus,
            (availableModels ?? {})[modelName]
          ));
      }
    })
  );
  return didSth;
}

async function getAvailableModels(fixedModel?: string) {
  const models = (await listModels()) ?? { error: 'Internal error in calling backend.' };
  if (models.error) {
    return { error: `Suggestion sync aborted: ${models.error}` };
  }
  return models.models.reduce(
    async (res, m) => {
      if (fixedModel && m !== fixedModel) {
        return res;
      }
      const model = await getModel(m);
      if (model && model.preferred) {
        return { ...(await res), [m]: model.preferred };
      }
      return res;
    },
    Promise.resolve({} as { [k: string]: string | undefined; error?: string })
  );
}

class SyncTask extends Task {
  // eslint-disable-next-line max-statements
  protected async run(args: SyncArgs) {
    this.status.message = `Started with ${util.inspect(args)}`;
    const models = await getAvailableModels(args.model);
    if (models.error) {
      this.status.message = models.error;
      return;
    }
    const templatesDict = (await templates.get(null)).reduce(
      (res, t) => ({ ...res, [t._id.toString()]: t }),
      {}
    );
    const thesaurusDict = (await thesauri.get(null)).reduce(
      (res, t) => ({ ...res, [t._id.toString()]: t }),
      {} as { [k: string]: ThesaurusSchema }
    );
    if (!Object.keys(models).length) {
      if (args.model) {
        throw new Error(`The selected model ${args.model} was not found!`);
      }
      this.status.message =
        'No suggestions to sync: Topic Classification server does not have any models (yet).';
      return;
    }
    const res = this.status.result;
    res.total = await entities.count({ language: 'en' });
    res.seen = 0;
    res.index = 0;
    await QueryForEach(args.batchSize || 50, async e => {
      if (res.index > (args.limit ?? 1000000)) {
        return;
      }
      res.seen += 1;
      if (await syncEntity(e, args, templatesDict, thesaurusDict, models)) {
        res.index += 1;
        if (args.noDryRun) {
          await entities.save(e, { user: 'sync-topic-classification', language: e.language });
        }
      }
      this.status.message =
        `Updating suggestions in the background: ${res.seen} of ${res.total} documents processed, ` +
        `${res.index} changed. Sync arguments are ${util.inspect(args)}.`;
    });
  }
}

TaskProvider.registerClass('TopicClassificationSync', SyncTask);

export { syncEntity };
export type { SyncArgs };
